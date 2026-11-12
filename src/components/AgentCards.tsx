import { useEffect, useLayoutEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { botSummary, orderRoster, relativeActive, type FleetBot, type FleetStatus } from '../game/fleet';
import { useFleet } from '../game/useFleet';
import { useI18n } from '../i18n/lang';

function statusLabel(status: FleetStatus, t: ReturnType<typeof useI18n>['t']) {
  switch (status) {
    case 'idle':
      return t.statusIdle;
    case 'busy':
      return t.statusBusy;
    case 'needs_you':
      return t.statusNeeds;
    case 'offline':
      return t.statusOffline;
  }
}

export function AgentCards() {
  const fleet = useFleet();
  const { lang, t } = useI18n();
  const bots = orderRoster(fleet.bots);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = bots.find((bot) => bot.id === selectedId) ?? null;
  const note = fleet.source === 'sample' ? t.fleetSample : t.fleetSource(fleet.source);

  useEffect(() => {
    if (!selectedId) return;
    const detail = document.querySelector('[data-testid="bot-detail"]');
    if (detail && window.matchMedia('(max-width: 900px)').matches) {
      const header = document.querySelector('.header');
      const offset = (header?.getBoundingClientRect().height ?? 0) + 8;
      const top = detail.getBoundingClientRect().top - offset;
      window.scrollBy({ top });
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  return (
    <footer className="roster">
      {selected && <BotDetail key={selected.id} bot={selected} note={note} />}
      <RosterStrip
        bots={bots}
        selectedId={selectedId}
        onSelect={setSelectedId}
        lang={lang}
        t={t}
        labelFor={(status) => statusLabel(status, t)}
      />
      <div className="roster-foot" data-testid="fleet-source">
        <span>{note}</span>
      </div>
    </footer>
  );
}

function cardsPerPage(width: number) {
  const gap = 8;
  const narrow = width < 420;
  const minCard = narrow ? 108 : 176;
  const maxCards = narrow ? 2 : 12;
  if (width <= 0) return 1;
  const fit = Math.floor((width + gap) / (minCard + gap));
  return Math.max(1, Math.min(maxCards, fit || 1));
}

function RosterStrip({
  bots,
  selectedId,
  onSelect,
  lang,
  t,
  labelFor,
}: {
  bots: FleetBot[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  lang: 'zh' | 'en';
  t: ReturnType<typeof useI18n>['t'];
  labelFor: (status: FleetStatus) => string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const [pageSize, setPageSize] = useState(1);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(bots.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const apply = () => {
      const next = cardsPerPage(el.clientWidth);
      setPageSize((cur) => (cur === next ? cur : next));
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      setPage((cur) => {
        const count = Math.max(1, Math.ceil(bots.length / pageSize));
        return event.key === 'ArrowLeft' ? Math.max(0, cur - 1) : Math.min(count - 1, cur + 1);
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bots.length, pageSize]);

  const go = (next: number) => setPage(Math.max(0, Math.min(pageCount - 1, next)));

  const onTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    swipe.current = { x: touch.clientX, y: touch.clientY };
  };
  const onTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
    swiped.current = true;
    go(safePage + (dx < 0 ? 1 : -1));
  };

  const chunks: FleetBot[][] = [];
  for (let i = 0; i < bots.length; i += pageSize) chunks.push(bots.slice(i, i + pageSize));

  return (
    <>
      <div className="roster-pager">
        <button
          type="button"
          className="roster-arrow"
          data-testid="roster-prev"
          aria-label={t.rosterPrev}
          disabled={safePage <= 0}
          onClick={() => go(safePage - 1)}
        >
          ‹
        </button>
        <div
          className="roster-viewport"
          ref={viewportRef}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={() => {
            swipe.current = null;
          }}
        >
          <div className="roster-track" style={{ transform: `translateX(-${safePage * 100}%)` }}>
            {chunks.map((chunk, index) => (
              <div key={chunk[0]?.id ?? index} className="roster-page" style={{ gridTemplateColumns: `repeat(${pageSize}, minmax(0, 1fr))` }}>
                {chunk.map((bot) => {
                  const on = bot.id === selectedId;
                  const label = labelFor(bot.status);
                  return (
                    <button
                      key={bot.id}
                      type="button"
                      className={`agent-card status-${bot.status} activity-${bot.activityStatus ?? 'idle'} ${on ? 'is-selected' : ''}`}
                      style={{ ['--c' as string]: bot.color ?? '#8b959e' }}
                      aria-pressed={on}
                      aria-expanded={on}
                      data-testid={`bot-${bot.name.replace(/\s+/g, '-')}`}
                      onClick={() => {
                        if (swiped.current) {
                          swiped.current = false;
                          return;
                        }
                        onSelect(on ? null : bot.id);
                      }}
                    >
                      <span className="ac-top">
                        <span className={`ac-dot activity-${bot.activityStatus ?? 'idle'}`} />
                        <span className="ac-name">
                          <b>
                            {bot.name}
                            {bot.hiddenFromSidebar && <em className="ac-hidden">{t.hiddenTag}</em>}
                          </b>
                          <span>{bot.role}</span>
                        </span>
                        {bot.topic && <span className="ac-topic">{bot.topic}</span>}
                      </span>
                      <span className="ac-live">
                        <span>{bot.lastActiveAt ? relativeActive(lang, bot.lastActiveAt) : label}</span>
                        {typeof bot.messages24h === 'number' && (
                          <span className="ac-count">
                            <span className="ac-sep"> · </span>
                            {t.msgs24h(bot.messages24h)}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="roster-arrow"
          data-testid="roster-next"
          aria-label={t.rosterNext}
          disabled={safePage >= pageCount - 1}
          onClick={() => go(safePage + 1)}
        >
          ›
        </button>
      </div>
      <div className="roster-pages" data-testid="roster-page" aria-live="polite">
        <div className="roster-dots">
          {chunks.map((chunk, index) => (
            <button
              key={chunk[0]?.id ?? index}
              type="button"
              className={index === safePage ? 'on' : ''}
              aria-label={t.rosterPage(index + 1, pageCount)}
              aria-current={index === safePage ? 'true' : undefined}
              onClick={() => go(index)}
            />
          ))}
        </div>
        <span>{t.rosterPage(safePage + 1, pageCount)}</span>
      </div>
    </>
  );
}

function BotDetail({ bot, note }: { bot: FleetBot; note: string }) {
  const { lang, t } = useI18n();
  const heading = bot.title ?? bot.name;

  return (
    <div className={`roster-detail status-${bot.status}`} role="region" aria-label={`${heading} · ${bot.role}`} data-testid="bot-detail">
      <div className="roster-line">
        <span className="ac-pip" style={{ background: bot.color ?? '#8b959e' }} />
        <span className={`ac-dot activity-${bot.activityStatus ?? 'idle'}`} />
        <b>{heading}</b>
        {bot.hiddenFromSidebar && <em className="ac-hidden">{t.hiddenTag}</em>}
      </div>
      <p className="roster-summary" data-testid="bot-summary">
        {botSummary(lang, bot)}
      </p>
      <div className="roster-actions">
        <a className="btn-approve" href={bot.deepLink} data-testid="open-chat">
          {t.openChat}
        </a>
        {bot.webLink && (
          <a className="ghost-btn" href={bot.webLink} target="_blank" rel="noreferrer">
            {t.webOpen}
          </a>
        )}
      </div>
      <div className="roster-note">{note}</div>
    </div>
  );
}
