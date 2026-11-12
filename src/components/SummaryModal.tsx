import { AGENTS } from '../game/data';
import { useSim } from '../game/useSim';
import { formatClock, formatCompact } from '../format';
import { agentLabel } from '../i18n/copy';
import { useFleet } from '../game/useFleet';
import { useI18n } from '../i18n/lang';
import { BotIcon } from './BotIcon';

export function SummaryModal() {
  const sim = useSim();
  const fleet = useFleet();
  const { lang, t } = useI18n();
  const names = fleet.bots.map((bot) => bot.name);
  const s = sim.state;
  if (!s.summaryOpen) return null;
  const m = s.metrics;
  const mvp = AGENTS.reduce((best, d) => (s.agents[d.id].doneToday > s.agents[best.id].doneToday ? d : best), AGENTS[0]);
  const mvpName = agentLabel(lang, mvp.id, names);
  return (
    <div className="modal-backdrop" onClick={() => sim.closeSummary()}>
      <div className="modal" role="dialog" aria-label={t.summaryAria} onClick={(e) => e.stopPropagation()}>
        <div className="crumbs">[ {t.crumbs} ]</div>
        <h2>{t.summary(s.ended, formatClock(s.clock))}</h2>
        <div className="modal-stats">
          <div><span>{t.views}</span><b>{formatCompact(m.views)}</b></div>
          <div><span>{t.followers}</span><b>+{formatCompact(m.followers)}</b></div>
          <div><span>{t.shares}</span><b>{formatCompact(m.shares)}</b></div>
          <div><span>{t.posted}</span><b>{m.posts}</b></div>
        </div>
        <ul className="modal-list">
          <li>{t.doorsPicked(m.hooksByYou, m.hooksPicked)}</li>
          <li>{t.pumpkinHooks}：<b>{m.pumpkinPicked}</b></li>
          <li>{t.gateLine(m.approved, m.edited, m.declined)}</li>
          <li>{t.autoLine(m.autoDecisions)}</li>
        </ul>
        <div className="modal-agents">
          {AGENTS.map((d) => (
            <div key={d.id} className={d.id === mvp.id ? 'mvp' : ''}>
              <BotIcon def={d} size={22} />
              <span>{agentLabel(lang, d.id, names)}</span>
              <b>{s.agents[d.id].doneToday}</b>
            </div>
          ))}
        </div>
        <p className="modal-note">{t.mvp(mvpName)}</p>
        <div className="modal-actions">
          <button className="ghost-btn" onClick={() => sim.closeSummary()}>{t.keepWatching}</button>
          <button className="btn-approve" onClick={() => sim.restart()}>{t.newNight}</button>
        </div>
      </div>
    </div>
  );
}
