import rawSample from './fleet.sample.json';

export type FleetStatus = 'idle' | 'busy' | 'needs_you' | 'offline';
export type ActivityStatus = 'active' | 'recent' | 'idle' | 'scheduled';

export interface FleetRoutine {
  name: string;
  schedule: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface FleetBot {
  id: string;
  name: string;
  role: string;
  status: FleetStatus;
  deepLink: string;
  title?: string;
  webLink?: string;
  color?: string;
  activityStatus?: ActivityStatus;
  lastActiveAt?: string;
  messages24h?: number;
  routines?: FleetRoutine[];
  topic?: string;
  avatarShape?: string;
  avatarColor?: string;
  hiddenFromSidebar?: boolean;
}

export interface FleetFile {
  updatedAt: string;
  generatedAt?: string;
  source: string;
  bots: FleetBot[];
}

const STATUSES: readonly FleetStatus[] = ['idle', 'busy', 'needs_you', 'offline'];
const ACTIVITIES: readonly ActivityStatus[] = ['active', 'recent', 'idle', 'scheduled'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIVITY_RANK: Record<ActivityStatus, number> = { active: 0, recent: 1, scheduled: 2, idle: 3 };

export const STALE_AFTER_MS = 2 * 60 * 60 * 1000;
export const FLEET_REFRESH_MS = 5 * 60 * 1000;

function canonicalDeepLink(id: string) {
  return `grokbot://app/v1/agent?id=${id}`;
}

function isStatus(value: unknown): value is FleetStatus {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

function isActivity(value: unknown): value is ActivityStatus {
  return typeof value === 'string' && (ACTIVITIES as readonly string[]).includes(value);
}

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function parseRoutines(value: unknown): FleetRoutine[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const routines: FleetRoutine[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const name = optionalText(row.name);
    const schedule = optionalText(row.schedule);
    if (!name || !schedule) continue;
    const routine: FleetRoutine = { name, schedule, enabled: row.enabled !== false };
    const lastRunAt = optionalText(row.lastRunAt);
    const nextRunAt = optionalText(row.nextRunAt);
    if (lastRunAt) routine.lastRunAt = lastRunAt;
    if (nextRunAt) routine.nextRunAt = nextRunAt;
    routines.push(routine);
  }
  return routines;
}

export function parseFleet(data: unknown): FleetFile | null {
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  if (typeof root.updatedAt !== 'string' || typeof root.source !== 'string' || !Array.isArray(root.bots)) return null;
  const bots: FleetBot[] = [];
  for (const raw of root.bots) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    if (typeof row.id !== 'string' || !UUID_RE.test(row.id)) continue;
    if (typeof row.name !== 'string' || row.name.trim() === '') continue;
    if (typeof row.role !== 'string') continue;
    if (!isStatus(row.status)) continue;
    const bot: FleetBot = {
      id: row.id,
      name: row.name,
      role: row.role,
      status: row.status,
      deepLink: canonicalDeepLink(row.id),
    };
    if (typeof row.title === 'string' && row.title.trim()) bot.title = row.title;
    if (typeof row.webLink === 'string' && /^https:\/\//.test(row.webLink)) bot.webLink = row.webLink;
    if (typeof row.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(row.color)) bot.color = row.color;
    if (isActivity(row.activityStatus)) bot.activityStatus = row.activityStatus;
    const lastActiveAt = optionalText(row.lastActiveAt);
    if (lastActiveAt) bot.lastActiveAt = lastActiveAt;
    if (typeof row.messages24h === 'number' && Number.isFinite(row.messages24h)) bot.messages24h = row.messages24h;
    const routines = parseRoutines(row.routines);
    if (routines) bot.routines = routines;
    const topic = optionalText(row.topic);
    const avatarShape = optionalText(row.avatarShape);
    const avatarColor = optionalText(row.avatarColor);
    if (topic) bot.topic = topic;
    if (avatarShape) bot.avatarShape = avatarShape;
    if (avatarColor) bot.avatarColor = avatarColor;
    if (row.hiddenFromSidebar === true) bot.hiddenFromSidebar = true;
    bots.push(bot);
  }
  if (bots.length === 0) return null;
  const file: FleetFile = { updatedAt: root.updatedAt, source: root.source, bots };
  const generatedAt = optionalText(root.generatedAt);
  if (generatedAt) file.generatedAt = generatedAt;
  return file;
}

const parsedSample = parseFleet(rawSample);
if (!parsedSample) throw new Error('fleet.sample.json is not a valid fleet file');

export const SAMPLE_FLEET: FleetFile = parsedSample;

/** Active bots first, then the rest by lastActiveAt. Missing live fields keep file order. */
export function orderRoster(bots: readonly FleetBot[]): FleetBot[] {
  return bots
    .map((bot, index) => ({ bot, index }))
    .sort((a, b) => {
      const rankA = a.bot.activityStatus ? ACTIVITY_RANK[a.bot.activityStatus] : ACTIVITY_RANK.idle;
      const rankB = b.bot.activityStatus ? ACTIVITY_RANK[b.bot.activityStatus] : ACTIVITY_RANK.idle;
      if (rankA !== rankB) return rankA - rankB;
      const timeA = a.bot.lastActiveAt ? Date.parse(a.bot.lastActiveAt) : Number.NEGATIVE_INFINITY;
      const timeB = b.bot.lastActiveAt ? Date.parse(b.bot.lastActiveAt) : Number.NEGATIVE_INFINITY;
      const safeA = Number.isFinite(timeA) ? timeA : Number.NEGATIVE_INFINITY;
      const safeB = Number.isFinite(timeB) ? timeB : Number.NEGATIVE_INFINITY;
      if (safeA !== safeB) return safeB - safeA;
      return a.index - b.index;
    })
    .map((row) => row.bot);
}

export function fleetCounts(fleet: FleetFile) {
  const total = fleet.bots.length;
  const online = fleet.bots.filter((bot) => bot.status !== 'offline').length;
  const needsYou = fleet.bots.filter((bot) => bot.status === 'needs_you').length;
  return { total, online, needsYou };
}

export function isFleetStale(updatedAt: string, now = Date.now()) {
  const stamp = Date.parse(updatedAt);
  if (!Number.isFinite(stamp)) return true;
  return now - stamp > STALE_AFTER_MS;
}

export function taipeiHM(iso: string) {
  const stamp = Date.parse(iso);
  if (!Number.isFinite(stamp)) return '--:--';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Taipei',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(stamp));
  } catch {
    const shifted = new Date(stamp + 8 * 3600 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
  }
}

export function relativeActive(lang: 'zh' | 'en', iso: string | undefined, now = Date.now()) {
  if (!iso) return '';
  const stamp = Date.parse(iso);
  if (!Number.isFinite(stamp)) return '';
  const mins = Math.max(0, Math.round((now - stamp) / 60000));
  if (mins < 1) return lang === 'zh' ? '刚刚' : 'just now';
  if (mins < 60) return lang === 'zh' ? `${mins} 分钟前` : `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return lang === 'zh' ? `${hours} 小时前` : `${hours}h ago`;
  const days = Math.max(1, Math.round(hours / 24));
  return lang === 'zh' ? `${days} 天前` : `${days}d ago`;
}

export async function loadFleet(): Promise<FleetFile> {
  try {
    const res = await fetch(`./fleet.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return SAMPLE_FLEET;
    return parseFleet(await res.json()) ?? SAMPLE_FLEET;
  } catch {
    return SAMPLE_FLEET;
  }
}
