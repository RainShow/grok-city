import type { AgentId, SeriesId, StageKey, TopicId } from '../game/data';
import { topicMeta } from '../game/data';
import type { BuildingId } from '../game/world';

export type Lang = 'zh' | 'en';

export type WanderSpot = 'gate' | 'home' | 'peek' | 'dailies' | 'files' | 'steal' | 'queue';

export type Phrase =
  | { id: 'boot' }
  | { id: 'wrap' }
  | { id: 'restart' }
  | { id: 'pumpkinAuto' }
  | { id: 'pumpkinYou' }
  | { id: 'seriesAuto'; series: SeriesId }
  | { id: 'seriesYou'; series: SeriesId }
  | { id: 'declined' }
  | { id: 'edited' }
  | { id: 'approved' }
  | { id: 'found'; topic: TopicId }
  | { id: 'hooksReady' }
  | { id: 'adapted' }
  | { id: 'archived' }
  | { id: 'gated' }
  | { id: 'held' }
  | { id: 'published'; n: number }
  | { id: 'doneStreet'; topic: TopicId }
  | { id: 'quota' }
  | { id: 'bookmark'; topic: TopicId }
  | { id: 'counted'; views: number; shares: number }
  | { id: 'clockIn' }
  | { id: 'idle' }
  | { id: 'waiting' }
  | { id: 'needsYou' }
  | { id: 'goto'; building: BuildingId }
  | { id: 'handoff'; agent: AgentId }
  | { id: 'toAgent'; agent: AgentId }
  | { id: 'stage'; stage: StageKey }
  | { id: 'scan' }
  | { id: 'countJob' }
  | { id: 'wander'; spot: WanderSpot }
  | { id: 'inside'; n: number }
  | { id: 'quiet' };

const SERIES_COPY: Record<SeriesId, { zh: string; en: string; verseZh: string; verseEn: string }> = {
  time: { zh: '时间', en: 'Time', verseZh: '影子先于光抵达', verseEn: 'The shadow arrives before the light' },
  cause: { zh: '因果', en: 'Cause', verseZh: '果子先落地，种子才想起', verseEn: 'The fruit lands first; the seed remembers after' },
  gravity: { zh: '重力', en: 'Gravity', verseZh: '向上的楼梯也在往下拉', verseEn: 'Even the upward stair pulls down' },
  sense: { zh: '知觉', en: 'Sense', verseZh: '你盯着的东西，其实在看你', verseEn: 'What you stare at is staring back' },
  scale: { zh: '尺度', en: 'Scale', verseZh: '整座城缩进一粒种子', verseEn: 'The whole city fits inside a seed' },
  form: { zh: '形体', en: 'Form', verseZh: '空心之处，才装得下一座城', verseEn: 'Only a hollow can hold a city' },
  path: { zh: '路径', en: 'Path', verseZh: '每扇门都通向刚才', verseEn: 'Every door leads back to just now' },
};

const TOPIC_COPY: Record<TopicId, { zh: string; en: string }> = {
  hollow: { zh: '借腹南瓜城：空心南瓜里亮着一整座城', en: '借腹南瓜城: a whole city lit inside the hollow pumpkin' },
  shadow: { zh: '影子比光先到门口', en: 'The shadow reaches the door before the light' },
  fruit: { zh: '果子先落地，树还没决定', en: 'The fruit lands before the tree decides' },
  stairs: { zh: '楼梯往上走，重力往下记', en: 'The stairs go up; gravity writes it down' },
  poster: { zh: '你看海报的时候，海报也在看你', en: 'While you watch the poster, it watches you' },
  seed: { zh: '森林缩进停车位，城缩进种子', en: 'A forest fits a parking space; a city fits a seed' },
  doors: { zh: '七扇门，每扇都通向刚才', en: 'Seven doors, each one leading to just now' },
  lamp: { zh: '黑森林里有一盏永不长大的灯', en: 'A lamp in the black forest that never grows' },
};

const AGENT_COPY: Record<AgentId, { zh: string; en: string; roleZh: string; roleEn: string }> = {
  proto: { zh: 'proto', en: 'proto', roleZh: '想法 → draft PR', roleEn: 'Idea → draft PR' },
  pumpkin: { zh: 'pumpkin', en: 'pumpkin', roleZh: '内容/发帖准备', roleEn: 'Content and post prep' },
  analysis: { zh: 'analysis', en: 'analysis', roleZh: '晨间 digest', roleEn: 'Morning digest' },
  grok: { zh: 'Grok', en: 'Grok', roleZh: '主协调', roleEn: 'Lead coordinator' },
  design: { zh: 'design', en: 'design', roleZh: '设计', roleEn: 'Design' },
  post: { zh: 'post', en: 'post', roleZh: '发布相关', roleEn: 'Publishing' },
};

const BUILDING_COPY: Record<BuildingId, { zh: string; en: string; tagZh: string; tagEn: string; signZh: string; signEn: string }> = {
  newsroom: { zh: '拆镜塔', en: 'Cut Tower', tagZh: '拆开每一条时间线', tagEn: 'Opens every timeline', signZh: '拆镜', signEn: 'CUT' },
  writers: { zh: '钩子房', en: 'Hook Room', tagZh: '三道门，只留一道', tagEn: 'Three doors, one stays', signZh: '钩子', signEn: 'HOOK' },
  post: { zh: '发报台', en: 'Dispatch Desk', tagZh: '模拟发出，不真发', tagEn: 'A simulated send', signZh: '发报', signEn: 'WIRE' },
  studio: { zh: '平台棚', en: 'Platform Shed', tagZh: '改成能发出去的尺寸', tagEn: 'Fit it to the feed', signZh: '平台', signEn: 'FEED' },
  bank: { zh: '归档库', en: 'Archive', tagZh: '数字在这里过夜', tagEn: 'Numbers stay the night', signZh: '归档', signEn: 'FILE' },
  cafe: { zh: '门卫亭', en: 'Gatehouse', tagZh: '不点头，就不发', tagEn: 'No nod, no send', signZh: '门卫', signEn: 'GATE' },
};

const STAGE_COPY: Record<StageKey, { zh: string; en: string; bubbleZh: string; bubbleEn: string }> = {
  found: { zh: '拆镜', en: 'Cut', bubbleZh: '拆开今晚的时间线', bubbleEn: "Opening tonight's timeline" },
  written: { zh: '钩子', en: 'Hook', bubbleZh: '三道门，只留一道', bubbleEn: 'Three doors, one stays' },
  adapted: { zh: '适配', en: 'Adapt', bubbleZh: '改成平台的尺寸', bubbleEn: 'Fitting the platform' },
  archived: { zh: '归档', en: 'File', bubbleZh: '写进档案柜', bubbleEn: 'Filing it' },
  gated: { zh: '过门', en: 'Gate', bubbleZh: '天亮前谁也别走', bubbleEn: 'Nobody leaves before dawn' },
  published: { zh: '发报', en: 'Send', bubbleZh: '模拟发出，不真发', bubbleEn: 'Simulated send, not a real one' },
};

const WANDER: Record<WanderSpot, { zh: string; en: string }> = {
  gate: { zh: '在门卫亭门口等', en: 'Waiting by the gatehouse' },
  home: { zh: '回到自己的楼', en: 'Back at the desk' },
  peek: { zh: '偷看时间线', en: 'Peeking at the timeline' },
  dailies: { zh: '看平台成片', en: 'Watching the cut' },
  files: { zh: '翻档案', en: 'Checking the files' },
  steal: { zh: '偷一句钩子', en: 'Stealing a hook' },
  queue: { zh: '看发报队列', en: 'Reading the dispatch queue' },
};

export function seriesName(lang: Lang, id: SeriesId) {
  return SERIES_COPY[id][lang];
}
export function seriesVerse(lang: Lang, id: SeriesId) {
  return lang === 'zh' ? SERIES_COPY[id].verseZh : SERIES_COPY[id].verseEn;
}
export function storyTitle(lang: Lang, id: TopicId) {
  return TOPIC_COPY[id][lang];
}
export function agentName(lang: Lang, id: AgentId) {
  return AGENT_COPY[id][lang];
}

const PIPELINE_BOT: Record<AgentId, readonly string[]> = {
  proto: ['开发'],
  pumpkin: ['运营'],
  analysis: ['动态', '行业分析'],
  grok: ['Grok'],
  design: ['设计'],
  post: ['发文'],
};

/** Visible stand-in for the simulated night-shift roles, when that bot is in the fleet. */
export function agentLabel(lang: Lang, id: AgentId, names: readonly string[]) {
  const hit = PIPELINE_BOT[id].find((name) => names.includes(name));
  return hit ?? agentName(lang, id);
}
export function agentRole(lang: Lang, id: AgentId) {
  return lang === 'zh' ? AGENT_COPY[id].roleZh : AGENT_COPY[id].roleEn;
}
export function buildingName(lang: Lang, id: BuildingId) {
  return BUILDING_COPY[id][lang];
}
export function buildingTag(lang: Lang, id: BuildingId) {
  return lang === 'zh' ? BUILDING_COPY[id].tagZh : BUILDING_COPY[id].tagEn;
}
export function signFor(lang: Lang, id: BuildingId) {
  return lang === 'zh' ? BUILDING_COPY[id].signZh : BUILDING_COPY[id].signEn;
}
export function stageLabel(lang: Lang, id: StageKey) {
  return STAGE_COPY[id][lang];
}

export function storyDraft(lang: Lang, topic: TopicId) {
  const meta = topicMeta(topic);
  if (meta.pumpkin) {
    return lang === 'zh'
      ? '天亮前谁也别走。空心南瓜里亮着一座城，进去就是进去。'
      : 'Nobody leaves before dawn. A city is lit inside the hollow pumpkin. Step in, and you are in 借腹南瓜城 — Borrowed-Belly Pumpkin City.';
  }
  const name = seriesName(lang, meta.series);
  const verse = seriesVerse(lang, meta.series);
  const title = storyTitle(lang, topic);
  return lang === 'zh' ? `${name}：${verse}。今晚就讲「${title}」。` : `${name}: ${verse}. Tonight: “${title}”.`;
}

export function featuring(lang: Lang, series?: SeriesId, pumpkin?: boolean) {
  const door = series ? seriesName(lang, series) : lang === 'zh' ? '还没选' : 'not chosen';
  const brand = pumpkin ? ' · 借腹南瓜城' : '';
  return lang === 'zh' ? `主打「${door}」${brand}` : `Featuring ${door}${brand}`;
}

export function say(lang: Lang, p: Phrase): string {
  const zh = lang === 'zh';
  switch (p.id) {
    case 'boot':
      return zh ? '夜班开始。Grok City 亮了。' : 'Night shift. Grok City is lit.';
    case 'wrap':
      return zh ? '夜班收工，汇总在这儿' : 'Night shift wrapped. The summary is up.';
    case 'restart':
      return zh ? '又一个夜班。灯重新亮了。' : 'Another night. The lights are back.';
    case 'pumpkinAuto':
      return zh ? '没人应，借腹南瓜城的钩子自己亮了' : 'No answer. The 借腹南瓜城 hook lit itself.';
    case 'pumpkinYou':
      return zh ? '你批准了借腹南瓜城：天亮前谁也别走' : 'You approved 借腹南瓜城: Nobody leaves before dawn.';
    case 'seriesAuto':
      return zh ? `没人应，自动选了「${seriesName(lang, p.series)}」` : `No answer. Auto-picked “${seriesName(lang, p.series)}”.`;
    case 'seriesYou':
      return zh
        ? `你选了「${seriesName(lang, p.series)}」：${seriesVerse(lang, p.series)}`
        : `You picked “${seriesName(lang, p.series)}”: ${seriesVerse(lang, p.series)}`;
    case 'declined':
      return zh ? '拒绝了。这条留在城里，不会发出去。' : 'Rejected. It stays in the city. Nothing goes out.';
    case 'edited':
      return zh ? '改了一句。Grok 放行，仍然只是模拟。' : 'Edited. Grok lets it through. Still only a simulation.';
    case 'approved':
      return zh ? 'Grok 放行。post 只做模拟，不会真的投稿。' : 'Grok approved. post only simulates a send.';
    case 'found':
      return zh ? `拆开「${storyTitle(lang, p.topic)}」` : `Opened “${storyTitle(lang, p.topic)}”`;
    case 'hooksReady':
      return zh ? '钩子写好了，等你选一道门' : 'Hooks are ready. Pick a door.';
    case 'adapted':
      return zh ? '改成竖屏，字幕压短' : 'Cut vertical. Captions shortened.';
    case 'archived':
      return zh ? '归档编号写好了' : 'The archive number is written.';
    case 'gated':
      return zh ? '拦在门口：批准才发' : 'Stopped at the gate. It ships only if you approve.';
    case 'held':
      return zh ? 'Grok 没放行，这条留在内部档' : 'Grok held it. Filed internally.';
    case 'published':
      return zh ? `模拟发出第 ${p.n} 条。没有真的投稿。` : `Simulated send #${p.n}. Nothing was actually posted.`;
    case 'doneStreet':
      return zh ? `「${storyTitle(lang, p.topic)}」走完这条夜班街` : `“${storyTitle(lang, p.topic)}” walked the whole night street.`;
    case 'quota':
      return zh ? '六条额度满了。准备收班。' : 'Six-post quota hit. Wrapping the shift.';
    case 'bookmark':
      return zh ? `先夹住「${storyTitle(lang, p.topic)}」` : `Clipped “${storyTitle(lang, p.topic)}” for later.`;
    case 'counted':
      return zh ? `清点完毕：浏览 ${p.views}，分享 ${p.shares}` : `Counted: ${p.views} views, ${p.shares} shares.`;
    case 'clockIn':
      return zh ? '到岗' : 'Clocking in';
    case 'idle':
      return zh ? '空闲' : 'Idle';
    case 'waiting':
      return zh ? '等你拍板' : 'Waiting on you';
    case 'needsYou':
      return zh ? '需要你' : 'Needs you';
    case 'goto':
      return zh ? `前往${buildingName(lang, p.building)}` : `Heading to ${buildingName(lang, p.building)}`;
    case 'handoff':
      return zh ? `把稿子送到${agentName(lang, p.agent)}` : `Bringing it to ${agentName(lang, p.agent)}`;
    case 'toAgent':
      return zh ? `送到${agentName(lang, p.agent)}` : `To ${agentName(lang, p.agent)}`;
    case 'stage':
      return zh ? STAGE_COPY[p.stage].bubbleZh : STAGE_COPY[p.stage].bubbleEn;
    case 'scan':
      return zh ? '翻时间线' : 'Reading the timeline';
    case 'countJob':
      return zh ? '清点今晚的分享' : "Counting tonight's shares";
    case 'wander':
      return WANDER[p.spot][lang];
    case 'inside':
      return zh ? `${p.n} 人在内` : `${p.n} inside`;
    case 'quiet':
      return zh ? '安静' : 'Quiet';
  }
}

export interface Dict {
  brand: string;
  night: string;
  gloss: string;
  online: string;
  done: string;
  needs: string;
  uptime: string;
  wrap: string;
  newNight: string;
  you: string;
  duty: string;
  onlineDot: string;
  clear: string;
  wrapped: string;
  pumpkinLit: string;
  pause: string;
  resume: string;
  speed: string;
  langSwitch: string;
  approvals: string;
  yourCall: string;
  allQuiet: string;
  sevenDoors: string;
  atGate: string;
  whichDoor: string;
  gateAsk: string;
  roster: string;
  rosterPrev: string;
  rosterNext: string;
  rosterPage: (n: number, m: number) => string;
  statusIdle: string;
  statusBusy: string;
  statusNeeds: string;
  statusOffline: string;
  openChat: string;
  copyId: string;
  copiedId: string;
  fleetSample: string;
  fleetSource: (source: string) => string;
  liveFresh: (hm: string) => string;
  sampleBadge: string;
  staleBadge: string;
  hiddenTag: string;
  msgs24h: (n: number) => string;
  atDesk: string;
  webOpen: string;
  pumpkinBtn: string;
  approve: string;
  edit: string;
  reject: string;
  saveEdit: string;
  cancel: string;
  editAria: string;
  simNote: string;
  live: string;
  whoYou: string;
  whoCity: string;
  mission: string;
  sent: string;
  quotaFull: string;
  waitingStory: string;
  queue: string;
  queueEmpty: string;
  street: (n: number) => string;
  stats: string;
  sample: string;
  views: string;
  followers: string;
  shares: string;
  posted: string;
  camFull: string;
  camLeft: string;
  camRight: string;
  camIn: string;
  camOut: string;
  camLabels: string;
  camSummary: string;
  modeMoving: string;
  modeWorking: string;
  modeWaiting: string;
  modeIdle: string;
  pieces: (n: number) => string;
  onStreet: string;
  toward: (name: string) => string;
  crumbs: string;
  summary: (ended: boolean, clock: string) => string;
  summaryAria: string;
  doorsPicked: (you: number, all: number) => string;
  pumpkinHooks: string;
  gateLine: (a: number, e: number, r: number) => string;
  autoLine: (n: number) => string;
  mvp: (name: string) => string;
  keepWatching: string;
  noLabel: string;
  viewsBoard: string;
  blimp: string;
  pumpkinGloss: string;
}

const zh: Dict = {
  brand: 'Grok City',
  night: '夜班',
  gloss: 'Grok City',
  online: '在线',
  done: '完成',
  needs: '需要你',
  uptime: '在线时长',
  wrap: '收班',
  newNight: '再开一夜',
  you: '你',
  duty: '值班',
  onlineDot: '在线',
  clear: '夜班 · 晴',
  wrapped: '夜班收工',
  pumpkinLit: '借腹南瓜城亮着',
  pause: '暂停',
  resume: '继续',
  speed: '速度',
  langSwitch: '切换到英文',
  approvals: '审批',
  yourCall: '你的决定',
  allQuiet: '夜班安静，城自己在跑。',
  sevenDoors: '七道门',
  atGate: '过门',
  whichDoor: '今晚主打哪一道门？',
  gateAsk: '发出去之前，Grok 要你点头',
  pumpkinBtn: '借腹南瓜城 · 天亮前谁也别走',
  approve: '批准',
  edit: '编辑',
  reject: '拒绝',
  saveEdit: '确认修改',
  cancel: '取消',
  editAria: '改一句',
  simNote: '模拟审批。点批准也不会发到站外。',
  live: '直播',
  whoYou: '你',
  whoCity: '城',
  mission: '任务板',
  sent: '已发',
  quotaFull: '六条夜班额度满了',
  waitingStory: '等下一条从借腹南瓜城里走出来…',
  queue: '排队：',
  queueEmpty: '还没有。proto 在翻时间线。',
  street: (n) => `这条街今晚走过 ${n} 段工序。发出去的都是模拟。`,
  stats: '城市数据',
  sample: '示意数字',
  views: '浏览',
  followers: '关注',
  shares: '分享',
  posted: '已发',
  camFull: '全景',
  camLeft: '左转',
  camRight: '右转',
  camIn: '放大',
  camOut: '缩小',
  camLabels: '标签',
  camSummary: '汇总',
  modeMoving: '赶路',
  modeWorking: '干活',
  modeWaiting: '需要你',
  modeIdle: '空闲',
  pieces: (n) => `${n} 件`,
  onStreet: '在街上',
  toward: (name) => `→ ${name}`,
  crumbs: 'Grok City · 夜班 · 第一夜',
  summary: (ended, clock) => (ended ? `夜班汇总 · ${clock} 收工` : '夜班汇总 · 还在走'),
  summaryAria: '夜班汇总',
  doorsPicked: (you, all) => `你选的门：${you} / 一共 ${all}`,
  pumpkinHooks: '借腹南瓜城钩子',
  gateLine: (a, e, r) => `Grok：批准 ${a} · 改过 ${e} · 拒绝 ${r}`,
  autoLine: (n) => `城自己拿的主意：${n}。没有一条真的发出去。`,
  mvp: (name) => `今晚最忙的是${name}。灯还亮着，proto 还在翻。`,
  roster: '花名册',
  rosterPrev: '上一页',
  rosterNext: '下一页',
  rosterPage: (n, m) => `${n} / ${m}`,
  statusIdle: '空闲',
  statusBusy: '忙碌',
  statusNeeds: '需要你',
  statusOffline: '离线',
  openChat: '打开对话',
  copyId: '复制 id',
  copiedId: '已复制',
  fleetSample: '数据：fleet.json（样例）',
  fleetSource: (source) => `数据：fleet.json（${source}）`,
  liveFresh: (hm) => `实时 · 更新于 ${hm}`,
  sampleBadge: 'Sample',
  staleBadge: '数据已过期',
  hiddenTag: '隐藏',
  msgs24h: (n) => `24h · ${n}`,
  atDesk: '在工位',
  webOpen: '打开网页',
  keepWatching: '继续看',
  noLabel: '编号',
  viewsBoard: '浏览',
  blimp: '夜班',
  pumpkinGloss: '',
};

const en: Dict = {
  brand: 'Grok City',
  night: 'NIGHT',
  gloss: 'Grok City',
  online: 'Online',
  done: 'Done',
  needs: 'Needs you',
  uptime: 'Uptime',
  wrap: 'Wrap',
  newNight: 'New night',
  you: 'You',
  duty: 'On duty',
  onlineDot: 'online',
  clear: 'Night · clear',
  wrapped: 'Shift over',
  pumpkinLit: '借腹南瓜城 is lit',
  pause: 'Pause',
  resume: 'Resume',
  speed: 'Speed',
  langSwitch: 'Switch to Chinese',
  approvals: 'Approvals',
  yourCall: 'your call',
  allQuiet: 'All quiet. The city runs the night.',
  sevenDoors: 'Seven doors',
  atGate: 'At the gate',
  whichDoor: 'Which door tonight?',
  gateAsk: 'Before it goes out, Grok wants your nod',
  pumpkinBtn: '借腹南瓜城 · Nobody leaves before dawn',
  approve: 'Approve',
  edit: 'Edit',
  reject: 'Reject',
  saveEdit: 'Save edit',
  cancel: 'Cancel',
  editAria: 'Edit the line',
  simNote: 'Simulated approval. Approve never posts outside.',
  live: 'live',
  whoYou: 'You',
  whoCity: 'City',
  mission: 'Mission board',
  sent: 'sent',
  quotaFull: 'Six-post quota is full',
  waitingStory: 'Waiting for the next piece to walk out of 借腹南瓜城…',
  queue: 'Queued:',
  queueEmpty: 'Nothing yet. proto is still reading.',
  street: (n) => `${n} steps down this street tonight. Every send is simulated.`,
  stats: 'City stats',
  sample: 'sample numbers',
  views: 'Views',
  followers: 'Followers',
  shares: 'Shares',
  posted: 'Sent',
  camFull: 'Full',
  camLeft: 'Left',
  camRight: 'Right',
  camIn: 'In',
  camOut: 'Out',
  camLabels: 'Labels',
  camSummary: 'Summary',
  modeMoving: 'En route',
  modeWorking: 'Working',
  modeWaiting: 'Needs you',
  modeIdle: 'Idle',
  pieces: (n) => `${n} done`,
  onStreet: 'On the street',
  toward: (name) => `→ ${name}`,
  crumbs: 'Grok City · night shift · night one',
  summary: (ended, clock) => (ended ? `Night summary · wrapped ${clock}` : 'Night summary · still going'),
  summaryAria: 'Night summary',
  doorsPicked: (you, all) => `Doors you picked: ${you} of ${all}`,
  pumpkinHooks: '借腹南瓜城 hooks',
  gateLine: (a, e, r) => `Grok: approved ${a} · edited ${e} · rejected ${r}`,
  autoLine: (n) => `Decisions the city made without you: ${n}. Nothing was actually posted.`,
  mvp: (name) => `Busiest tonight: ${name}. The lights stay on. proto keeps reading.`,
  roster: 'Roster',
  rosterPrev: 'Previous bots',
  rosterNext: 'Next bots',
  rosterPage: (n, m) => `${n} / ${m}`,
  statusIdle: 'Idle',
  statusBusy: 'Busy',
  statusNeeds: 'Needs you',
  statusOffline: 'Offline',
  openChat: 'Open chat',
  copyId: 'Copy id',
  copiedId: 'Copied',
  fleetSample: 'Data: fleet.json (sample)',
  fleetSource: (source) => `Data: fleet.json (${source})`,
  liveFresh: (hm) => `Live · updated ${hm}`,
  sampleBadge: 'Sample',
  staleBadge: 'Data is stale',
  hiddenTag: 'hidden',
  msgs24h: (n) => `${n} / 24h`,
  atDesk: 'at the desk',
  webOpen: 'Open page',
  keepWatching: 'Keep watching',
  noLabel: 'no.',
  viewsBoard: 'VIEWS',
  blimp: 'NIGHT',
  pumpkinGloss: 'Borrowed-Belly Pumpkin City',
};

export function ui(lang: Lang): Dict {
  return lang === 'zh' ? zh : en;
}
