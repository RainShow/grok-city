import { useState } from 'react';
import { AGENT_BY_ID, SERIES, STAGES, topicMeta } from '../game/data';
import { useSim } from '../game/useSim';
import { formatClock, formatCompact } from '../format';
import { POSTS_PER_DAY, type Prompt, type SimState } from '../game/sim';
import { agentLabel, featuring, say, seriesName, seriesVerse, stageLabel, storyDraft, storyTitle } from '../i18n/copy';
import { liveLog } from '../game/fleet';
import { useFleet } from '../game/useFleet';
import { useI18n } from '../i18n/lang';

export function LeftPanel() {
  return (
    <aside className="panel panel-left glass">
      <NeedsYou />
      <Activity />
    </aside>
  );
}

export function RightPanel() {
  return (
    <aside className="panel panel-right glass">
      <Pipeline />
      <Today />
    </aside>
  );
}

function NeedsYou() {
  const sim = useSim();
  const fleet = useFleet();
  const { t } = useI18n();
  const live = fleet.source === 'live';
  const prompts = live ? [] : sim.state.prompts;
  return (
    <section className="section needs" data-testid="approvals">
      <h2>
        <span className="hud">[ {t.approvals} ]</span>
        {!live && prompts.length > 0 && <span className="badge">{prompts.length}</span>}
        {!live && <span className="section-aside">{t.yourCall}</span>}
      </h2>
      {live ? (
        <div className="empty" data-testid="approvals-empty">{t.nothingPending}</div>
      ) : prompts.length === 0 ? (
        <div className="empty">{t.allQuiet}</div>
      ) : (
        prompts.map((p) => (
          <PromptCard key={p.id} p={p} onPick={(i, note) => sim.resolvePrompt(p.id, i, false, note)} />
        ))
      )}
    </section>
  );
}

function PromptCard({ p, onPick }: { p: Prompt; onPick: (i: number, note?: string) => void }) {
  const sim = useSim();
  const fleet = useFleet();
  const { lang, t } = useI18n();
  const agent = p.kind === 'hook' ? AGENT_BY_ID.pumpkin : AGENT_BY_ID.grok;
  const story = sim.state.story?.id === p.storyId ? sim.state.story : undefined;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const quote = story ? (p.kind === 'approval' && story.editNote ? story.editNote : storyDraft(lang, story.topic)) : '';
  return (
    <div className={`prompt-card kind-${p.kind}`}>
      <div className="prompt-head">
        <span className="dot" style={{ background: agent.color }} />
        <span className="prompt-from">{agentLabel(lang, agent.id, fleet.bots.map((bot) => bot.name))}</span>
        <span className="prompt-role">{p.kind === 'hook' ? t.sevenDoors : t.atGate}</span>
        {p.ttl > 0 && <span className="prompt-ttl">{Math.ceil(p.ttl)}s</span>}
      </div>
      <div className="prompt-title">{p.kind === 'hook' ? t.whichDoor : t.gateAsk}</div>
      {story && (
        <div className="prompt-detail">
          {p.kind === 'hook' ? storyTitle(lang, story.topic) : featuring(lang, story.seriesPick, story.usedPumpkin)}
        </div>
      )}
      {quote && !editing && <blockquote className="prompt-quote">{lang === 'zh' ? `「${quote}」` : `“${quote}”`}</blockquote>}
      {p.kind === 'hook' ? (
        <>
          <div className="series-grid">
            {SERIES.map((s, i) => (
              <button key={s.id} className="series-btn" data-testid={`series-${s.id}`} title={seriesVerse(lang, s.id)} onClick={() => onPick(i)}>
                <i style={{ background: s.color }} />
                {seriesName(lang, s.id)}
              </button>
            ))}
          </div>
          <button className="pumpkin-btn" data-testid="pumpkin-hook" onClick={() => onPick(SERIES.length)}>
            {t.pumpkinBtn}
          </button>
        </>
      ) : editing ? (
        <div className="edit-box">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} aria-label={t.editAria} />
          <div className="take-options">
            <button className="btn-approve" data-testid="edit-confirm" onClick={() => onPick(1, draft)}>
              {t.saveEdit}
            </button>
            <button className="btn-skip" onClick={() => setEditing(false)}>
              {t.cancel}
            </button>
          </div>
        </div>
      ) : (
        <div className="take-options">
          <button className="btn-approve" data-testid="approve" onClick={() => onPick(0)}>
            {t.approve}
          </button>
          <button
            className="btn-edit"
            data-testid="edit"
            onClick={() => {
              setDraft(quote);
              setEditing(true);
            }}
          >
            {t.edit}
          </button>
          <button className="btn-decline" data-testid="decline" onClick={() => onPick(2)}>
            {t.reject}
          </button>
        </div>
      )}
      {p.kind === 'approval' && <div className="prompt-note">{t.simNote}</div>}
      {p.ttl > 0 && (
        <div className="ttl-bar">
          <div style={{ width: `${(p.ttl / p.total) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

function Activity() {
  const sim = useSim();
  const fleet = useFleet();
  const { lang, t } = useI18n();
  const names = fleet.bots.map((bot) => bot.name);
  const live = fleet.source === 'live';
  const lines = live ? liveLog(lang, fleet) : null;
  return (
    <section className="section activity">
      <h2>
        <span className="hud">[ CITY.LOG ]</span>
        {live ? null : <em className="example-tag">{t.exampleTag}</em>}
      </h2>
      <ol className="log" data-testid="city-log">
        {lines
          ? lines.map((line) => (
              <li key={line.key} className="log-item">
                <span className="log-time">{line.time}</span>
                <span className="dot" style={{ background: line.color }} />
                <span className="log-text">{line.text}</span>
              </li>
            ))
          : sim.state.log.map((e) => {
          const color = e.who === 'you' ? '#c4f93e' : e.who === 'city' ? '#8b959e' : AGENT_BY_ID[e.who].color;
          const name = e.who === 'you' ? t.whoYou : e.who === 'city' ? t.whoCity : agentLabel(lang, e.who, names);
          return (
            <li key={e.id} className={`log-item who-${e.who}`}>
              <span className="log-time">{formatClock(e.clock)}</span>
              <span className="dot" style={{ background: color }} />
              <span className="log-text">
                <b style={{ color }}>{name}</b> {say(lang, e.text)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function stageRows(s: SimState) {
  return STAGES.map((st, i) => {
    const state = !s.story ? 'todo' : i < s.stageIdx ? 'done' : i === s.stageIdx ? (s.stagePhase === 'gate' ? 'gate' : 'active') : 'todo';
    const a = AGENT_BY_ID[st.agent];
    return { key: st.key, state, color: a.color, agent: a.id, count: s.stageCounts[i] };
  });
}

function Pipeline() {
  const sim = useSim();
  const fleet = useFleet();
  const { lang, t } = useI18n();
  const names = fleet.bots.map((bot) => bot.name);
  const s = sim.state;
  const story = s.story;
  const rows = stageRows(s);
  const done = s.stageCounts.reduce((n, c) => n + c, 0);
  return (
    <section className="section pipeline">
      <h2>
        <span className="hud">[ {t.mission} ]</span>
        {fleet.source === 'live' && <em className="example-tag">{t.exampleTag}</em>}
        <span className="section-aside">
          {s.metrics.posts}/{POSTS_PER_DAY} {t.sent}
        </span>
      </h2>
      <div className="story-now">
        {story ? (
          <>
            <span className="tag">#{seriesName(lang, topicMeta(story.topic).series)}</span> {storyTitle(lang, story.topic)}
          </>
        ) : s.metrics.posts >= POSTS_PER_DAY ? (
          t.quotaFull
        ) : (
          t.waitingStory
        )}
      </div>
      <div className="dots-row" aria-hidden>
        {rows.map((st) => (
          <span key={st.key} className={`pdot ${st.state}`} />
        ))}
      </div>
      <ol className="stages">
        {rows.map((row) => (
          <li key={row.key} className={`stage ${row.state}`}>
            <span className={`pdot ${row.state}`} />
            <span className="stage-label">{stageLabel(lang, row.key)}</span>
            <span className="chip">
              <span className="dot" style={{ background: row.color }} />
              {agentLabel(lang, row.agent, names)}
            </span>
            <span className="stage-count">{row.count}</span>
          </li>
        ))}
      </ol>
      <div className="queue-line">
        {t.queue} {s.queue.length ? s.queue.map((q) => storyTitle(lang, q.topic)).join(' · ') : t.queueEmpty}
      </div>
      <div className="queue-line dim">{t.street(done)}</div>
    </section>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  const w = 120;
  const h = 28;
  const pts = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 -2 ${w} ${h + 4}`}>
      <polyline points={pts} fill="none" stroke="#c5d8ea" strokeWidth={1.4} />
    </svg>
  );
}

function Today() {
  const sim = useSim();
  const fleet = useFleet();
  const { t } = useI18n();
  const m = sim.state.metrics;
  return (
    <section className="section today">
      <h2>
        <span className="hud">[ {t.stats} ]</span>
        {fleet.source === 'live' && <em className="example-tag">{t.exampleTag}</em>}
        <span className="section-aside">{t.sample}</span>
      </h2>
      <div className="metric big">
        <div>
          <div className="metric-l">{t.views}</div>
          <div className="metric-n">{formatCompact(m.views)}</div>
        </div>
        <Sparkline data={sim.state.history} />
      </div>
      <div className="metric-row">
        <div className="metric">
          <div className="metric-l">{t.followers}</div>
          <div className="metric-n accent-mint">+{formatCompact(m.followers)}</div>
        </div>
        <div className="metric">
          <div className="metric-l">{t.shares}</div>
          <div className="metric-n accent-amber">{formatCompact(m.shares)}</div>
        </div>
      </div>
      <div className="posts-bar">
        <span>{t.posted}</span>
        <div className="bar">
          {Array.from({ length: POSTS_PER_DAY }, (_, i) => (
            <span key={i} className={i < m.posts ? 'on' : ''} />
          ))}
        </div>
        <span className="mono-num">
          {m.posts}/{POSTS_PER_DAY}
        </span>
      </div>
    </section>
  );
}
