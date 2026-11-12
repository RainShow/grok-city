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

export const STALE_AFTER_MS = 8 * 60 * 60 * 1000;
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

function taipeiParts(stamp: number) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(stamp));
    const bag: Record<string, string> = {};
    for (const part of parts) bag[part.type] = part.value;
    return bag;
  } catch {
    const shifted = new Date(stamp + 8 * 3600 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      year: String(shifted.getUTCFullYear()),
      month: String(shifted.getUTCMonth() + 1),
      day: String(shifted.getUTCDate()),
      hour: pad(shifted.getUTCHours()),
      minute: pad(shifted.getUTCMinutes()),
    };
  }
}

const ACTIVITY_WORD: Record<ActivityStatus, { zh: string; en: string }> = {
  active: { zh: '活跃', en: 'active' },
  recent: { zh: '最近', en: 'recent' },
  idle: { zh: '闲置', en: 'idle' },
  scheduled: { zh: '定时', en: 'scheduled' },
};

export interface FleetLogLine {
  key: string;
  time: string;
  text: string;
  color: string;
}

/** One sync line, then one line per bot, newest lastActiveAt first. No extra prose. */
export function liveLog(lang: 'zh' | 'en', fleet: FleetFile, now = Date.now()): FleetLogLine[] {
  const hm = taipeiHM(fleet.updatedAt, now);
  const sync = lang === 'zh' ? `同步 · 快照更新于 ${hm}` : `Sync · snapshot updated ${hm}`;
  const ranked = fleet.bots
    .map((bot, index) => ({ bot, index }))
    .sort((a, b) => {
      const stamp = (iso?: string) => {
        const value = iso ? Date.parse(iso) : NaN;
        return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
      };
      const diff = stamp(b.bot.lastActiveAt) - stamp(a.bot.lastActiveAt);
      return diff !== 0 ? diff : a.index - b.index;
    });
  const lines: FleetLogLine[] = [{ key: 'sync', time: hm, text: sync, color: '#c5d8ea' }];
  for (const { bot } of ranked) {
    const word = bot.activityStatus ? ACTIVITY_WORD[bot.activityStatus][lang] : '';
    let text = word ? `${bot.name} ${word}` : bot.name;
    if (typeof bot.messages24h === 'number') text += lang === 'zh' ? ` · 24h ${bot.messages24h} 条` : ` · 24h ${bot.messages24h}`;
    if (bot.topic) text += ` · ${bot.topic}`;
    lines.push({
      key: bot.id,
      time: bot.lastActiveAt ? taipeiHM(bot.lastActiveAt, now) : '--:--',
      text,
      color: bot.color ?? '#8b959e',
    });
  }
  return lines;
}

/** Taipei clock. Today is HH:MM; any other day is M/D HH:MM. */
export function taipeiHM(iso: string, now = Date.now()) {
  const stamp = Date.parse(iso);
  if (!Number.isFinite(stamp)) return '--:--';
  const when = taipeiParts(stamp);
  const today = taipeiParts(now);
  const hm = `${when.hour}:${when.minute}`;
  if (when.year === today.year && when.month === today.month && when.day === today.day) return hm;
  return `${when.month}/${when.day} ${hm}`;
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

/** Role string only. "想法 → draft PR" reads as turning one into the other. */
function dutyPhrase(lang: 'zh' | 'en', role: string) {
  const match = role.trim().match(/^(.+?)\s*(?:→|->)\s*(.+)$/);
  if (!match) return role.trim();
  const from = match[1].trim();
  const to = match[2].trim();
  const gap = /^[A-Za-z0-9]/.test(to) ? ' ' : '';
  return lang === 'zh' ? `把${from}做成${gap}${to}` : `${from} → ${to}`;
}

function idleFor(lang: 'zh' | 'en', iso: string | undefined, now: number) {
  const stamp = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(stamp)) return lang === 'zh' ? '未活跃' : 'inactive';
  const days = Math.floor(Math.max(0, now - stamp) / 86400000);
  if (days < 1) return lang === 'zh' ? '今天未活跃' : 'inactive today';
  return lang === 'zh' ? `${days} 天未活跃` : `inactive ${days}d`;
}

/** One sentence from role and activity. No topics, routines, or invented work. */
export function botSummary(lang: 'zh' | 'en', bot: FleetBot, now = Date.now()) {
  const duty = dutyPhrase(lang, bot.role);
  if ((bot.activityStatus ?? 'idle') === 'idle') {
    const quiet = idleFor(lang, bot.lastActiveAt, now);
    return lang === 'zh' ? `负责${duty}，${quiet}。` : `Handles ${duty}, ${quiet}.`;
  }
  const when = relativeActive(lang, bot.lastActiveAt, now);
  const count = typeof bot.messages24h === 'number' ? bot.messages24h : null;
  if (lang === 'zh') {
    const active = when ? `${when}活跃` : '活跃';
    const msgs = count == null ? '' : `，24 小时内 ${count} 条消息`;
    return `负责${duty}，${active}${msgs}。`;
  }
  const active = when ? `active ${when}` : 'active';
  const msgs = count == null ? '' : `, ${count} messages in 24h`;
  return `Handles ${duty}, ${active}${msgs}.`;
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
