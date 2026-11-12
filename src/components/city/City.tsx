import { memo, useMemo, type ReactNode } from 'react';
import { N, P, proj, pts, rotPt, rotRect, shade, type Pt } from '../../game/iso';
import { nightAt } from '../../game/sim';
import type { ActivityStatus, FleetBot } from '../../game/fleet';
import { useFleet } from '../../game/useFleet';
import { useSim, useSimFrame } from '../../game/useSim';
import {
  BILLBOARD, BUILDINGS, CONVEYORS, FILLERS, LAMPS, PUMPKIN, SERIES_GATES, TREES, isPlaza, isRoad, type Building, type BuildingId,
} from '../../game/world';
import { Lamp, StructureView, Tree } from './structures';
import { formatCompact } from '../../format';
import { buildingName, buildingTag, say, seriesName, signFor } from '../../i18n/copy';
import { useI18n } from '../../i18n/lang';

const INK = '#0c1014';

function MoteField() {
  const motes = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        x: -520 + ((i * 137) % 1040),
        y: -210 + ((i * 89) % 680),
        r: i % 7 === 0 ? 1.6 : 0.85,
        delay: -((i * 0.41) % 8),
        dur: 7 + (i % 6),
      })),
    [],
  );
  return (
    <g className="svg-motes" aria-hidden>
      {motes.map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={m.r} fill="#d7e6f2" style={{ animationDelay: `${m.delay}s`, animationDuration: `${m.dur}s` }} />
      ))}
    </g>
  );
}

export interface CityProps {
  rot: number;
  zoom: number;
  pan: Pt;
  labels: boolean;
}

export function City({ rot, zoom, pan, labels }: CityProps) {
  const sim = useSim();
  const { t } = useI18n();
  const night = Math.round(nightAt(sim.state.clock) * 10) / 10;
  return (
    <svg className="city-svg" viewBox="-560 -228 1120 745" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="glow" cx="50%" cy="48%" r="58%">
          <stop offset="0%" stopColor="#c5d8ea" stopOpacity="0.14" />
          <stop offset="42%" stopColor="#1a242e" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#05070a" stopOpacity="0" />
        </radialGradient>
        <pattern id="grit" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="2" r="0.45" fill="#d7e2ea" opacity="0.22" />
          <circle cx="5" cy="5" r="0.35" fill="#05070a" opacity="0.45" />
        </pattern>
      </defs>
      <MoteField />
      <g className="camera" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <ellipse cx={0} cy={210} rx={540} ry={250} fill="url(#glow)" />
        <StaticCity rot={rot} night={night} />
        <Billboard rot={rot} />
        <g className="blimp">
          <ellipse cx={210} cy={-150} rx={40} ry={15} fill="#14181e" stroke="#c5d0da" strokeWidth={1} />
          <path d="M-8,-136 h16 l-8,8 z" transform="translate(210 0)" fill="#c4f93e" />
          <text x={210} y={-146} textAnchor="middle" className="blimp-text">{t.blimp}</text>
        </g>
        <Dynamic rot={rot} labels={labels} />
      </g>
    </svg>
  );
}

const StaticCity = memo(function StaticCity({ rot, night }: { rot: number; night: number }) {
  const { lang } = useI18n();
  const ground = useMemo(() => {
    const out: ReactNode[] = [];
    const corners = [P(0, 0, 0, rot), P(N, 0, 0, rot), P(N, N, 0, rot), P(0, N, 0, rot)];
    const r = rotRect(0, 0, N, N, rot);
    const fl = [proj(r.x0, r.y1, 0), proj(r.x1, r.y1, 0), proj(r.x1, r.y1, -26), proj(r.x0, r.y1, -26)];
    const fr = [proj(r.x1, r.y1, 0), proj(r.x1, r.y0, 0), proj(r.x1, r.y0, -26), proj(r.x1, r.y1, -26)];
    out.push(<polygon key="slab-l" points={pts(fl)} fill="#10151b" stroke="#0c1014" strokeWidth={1} />);
    out.push(<polygon key="slab-r" points={pts(fr)} fill="#0c1116" stroke="#0c1014" strokeWidth={1} />);
    out.push(<polygon key="slab-t" points={pts(corners)} fill="#161c23" stroke="rgba(197,216,234,0.16)" strokeWidth={1} />);
    out.push(<polygon key="slab-grit" points={pts(corners)} fill="url(#grit)" opacity={0.55} />);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const road = isRoad(i, j);
        const plaza = isPlaza(i, j);
        const tone = (i * 7 + j * 3) % 5 === 0;
        const fill = road ? '#1c232b' : plaza ? '#14191f' : tone ? '#181e25' : '#151a20';
        const d = [P(i, j, 0, rot), P(i + 1, j, 0, rot), P(i + 1, j + 1, 0, rot), P(i, j + 1, 0, rot)];
        out.push(<polygon key={`t${i}-${j}`} points={pts(d)} fill={fill} stroke={road ? 'rgba(197,216,234,0.16)' : 'rgba(197,216,234,0.05)'} strokeWidth={0.6} />);
        if (road) {
          const colRoad = i === 4 || i === 8;
          const rowRoad = j === 4 || j === 8;
          if (colRoad && !rowRoad) {
            const zebra = j === 3 || j === 5 || j === 7 || j === 9;
            if (zebra) {
              const top = j === 3 || j === 7 ? j + 0.55 : j + 0.05;
              for (let k = 0; k < 5; k++) {
                const x = i + 0.14 + k * 0.18;
                const a = P(x, top, 0, rot);
                const b = P(x, top + 0.4, 0, rot);
                out.push(<line key={`z${i}-${j}-${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#d5dee6" strokeWidth={2.4} opacity={0.45} />);
              }
            } else {
              const a = P(i + 0.5, j + 0.25, 0, rot);
              const b = P(i + 0.5, j + 0.75, 0, rot);
              out.push(<line key={`d${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#9eb4c6" strokeWidth={1.2} opacity={0.4} />);
            }
          } else if (rowRoad && !colRoad) {
            const zebra = i === 3 || i === 5 || i === 7 || i === 9;
            if (zebra) {
              const left = i === 3 || i === 7 ? i + 0.55 : i + 0.05;
              for (let k = 0; k < 5; k++) {
                const y = j + 0.14 + k * 0.18;
                const a = P(left, y, 0, rot);
                const b = P(left + 0.4, y, 0, rot);
                out.push(<line key={`z${i}-${j}-${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#d5dee6" strokeWidth={2.4} opacity={0.45} />);
              }
            } else {
              const a = P(i + 0.25, j + 0.5, 0, rot);
              const b = P(i + 0.75, j + 0.5, 0, rot);
              out.push(<line key={`d${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#9eb4c6" strokeWidth={1.2} opacity={0.4} />);
            }
          }
        }
      }
    }
    return out;
  }, [rot, night]);

  const sorted = useMemo(() => {
    const lit = night > 0.45;
    const items: { d: number; el: ReactNode }[] = [];
    for (const s of [...BUILDINGS, ...FILLERS]) {
      const r = rotRect(s.x0, s.y0, s.x1, s.y1, rot);
      const signed = s.id in signMap ? { ...s, sign: signFor(lang, s.id as BuildingId) } : s;
      items.push({ d: (r.x0 + r.x1 + r.y0 + r.y1) / 2, el: <StructureView key={s.id} s={signed} rot={rot} night={night} /> });
    }
    TREES.forEach(([x, y], i) => {
      const [a, b] = rotPt(x, y, rot);
      items.push({ d: a + b, el: <Tree key={`tr${i}`} x={a} y={b} night={night} /> });
    });
    LAMPS.forEach(([x, y], i) => {
      const [a, b] = rotPt(x, y, rot);
      items.push({ d: a + b, el: <Lamp key={`l${i}`} x={a} y={b} lit={lit} /> });
    });
    const [px, py] = rotPt(PUMPKIN.x, PUMPKIN.y, rot);
    items.push({ d: px + py + 0.4, el: <Pumpkin key="pumpkin" x={px} y={py} gloss={lang === 'en' ? 'Borrowed-Belly Pumpkin City' : ''} /> });
    SERIES_GATES.forEach((g, i) => {
      const [a, b] = rotPt(g.x, g.y, rot);
      items.push({ d: a + b - 0.15, el: <SeriesDoor key={g.id} x={a} y={b} name={seriesName(lang, g.id)} color={g.color} i={i} /> });
    });
    const [cx, cy] = rotPt(3.55, 4.85, rot);
    items.push({ d: cx + cy, el: <Crane key="crane" x={cx} y={cy} /> });
    return items.sort((a, b) => a.d - b.d).map((i) => i.el);
  }, [rot, night, lang]);

  return (
    <g>
      {ground}
      <Conveyors rot={rot} />
      {sorted}
    </g>
  );
});

const signMap: Record<BuildingId, true> = { newsroom: true, writers: true, post: true, studio: true, bank: true, cafe: true };

function Pumpkin({ x, y, gloss }: { x: number; y: number; gloss?: string }) {
  const p = proj(x, y, 0);
  return (
    <g transform={`translate(${p.x} ${p.y})`} className="pumpkin">
      <ellipse cx={0} cy={8} rx={62} ry={22} fill="#c5d8ea" opacity={0.08} />
      <g className="pine" transform="translate(-46 -6)">
        <polygon points="0,-34 -14,2 14,2" fill="#1a2420" stroke="#24302a" />
        <polygon points="0,-22 -11,6 11,6" fill="#24302a" />
      </g>
      <g className="pine" transform="translate(48 -2)">
        <polygon points="0,-40 -16,4 16,4" fill="#161e1c" stroke="#24302a" />
        <polygon points="0,-24 -12,8 12,8" fill="#1e2824" />
      </g>
      <ellipse cx={-18} cy={-16} rx={16} ry={26} fill="#2a3138" stroke={INK} strokeWidth={1} />
      <ellipse cx={18} cy={-16} rx={16} ry={26} fill="#3a424c" stroke={INK} strokeWidth={1} />
      <ellipse cx={0} cy={-18} rx={22} ry={30} fill="#343b44" stroke="rgba(214,224,232,0.35)" strokeWidth={1} />
      <path d="M-2,-46 C6,-58 10,-62 6,-70" fill="none" stroke="#6a756c" strokeWidth={2.4} strokeLinecap="round" />
      <rect x={-7} y={-30} width={5} height={6} fill="#eef5fb" className="blink" />
      <rect x={3} y={-26} width={5} height={5} fill="#c5d8ea" />
      <rect x={-4} y={-16} width={8} height={5} fill="#d5e4f2" className="blink" />
      <text y={22} textAnchor="middle" className="pumpkin-label">借腹南瓜城</text>
      {gloss && <text y={36} textAnchor="middle" className="pumpkin-gloss">{gloss}</text>}
    </g>
  );
}

function SeriesDoor({ x, y, name, color, i }: { x: number; y: number; name: string; color: string; i: number }) {
  const p = proj(x, y, 0);
  return (
    <g transform={`translate(${p.x} ${p.y})`} className="series-door" style={{ animationDelay: `${i * 0.35}s` }}>
      <path d="M-11,2 V-20 Q0,-34 11,-20 V2" fill="#10141a" stroke={color} strokeWidth={1.1} />
      <path d="M-6,2 V-14 Q0,-24 6,-14 V2" fill={color} opacity={0.28} />
      <text y={-38} textAnchor="middle" fill={color} className="door-label">{name}</text>
    </g>
  );
}

function Crane({ x, y }: { x: number; y: number }) {
  const p = proj(x, y, 0);
  return (
    <g transform={`translate(${p.x} ${p.y})`} className="crane">
      <line x1={0} y1={2} x2={0} y2={-78} stroke="#c5ccd4" strokeWidth={2.4} />
      <g className="crane-arm">
        <line x1={0} y1={-76} x2={58} y2={-86} stroke="#d5dee6" strokeWidth={2.2} />
        <line x1={42} y1={-84} x2={42} y2={-36} stroke="#9eb4c6" strokeWidth={0.8} />
        <rect x={36} y={-36} width={12} height={8} rx={1} fill="#c5d8ea" stroke={INK} />
      </g>
    </g>
  );
}

function Conveyors({ rot }: { rot: number }) {
  return (
    <g className="conveyors">
      {CONVEYORS.map((line, li) => {
        const top = line.map(([x, y]) => P(x, y, 22, rot));
        const d = `M${top.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}`;
        const posts: ReactNode[] = [];
        for (let k = 0; k < line.length - 1; k++) {
          const [ax, ay] = line[k];
          const [bx, by] = line[k + 1];
          const len = Math.hypot(bx - ax, by - ay);
          for (let s = 0.5; s < len; s += 1) {
            const t = s / len;
            const g = P(ax + (bx - ax) * t, ay + (by - ay) * t, 0, rot);
            posts.push(<line key={`${k}-${s}`} x1={g.x} y1={g.y} x2={g.x} y2={g.y - 22} stroke="#5c656e" strokeWidth={1.4} />);
          }
        }
        const pkgs = [0, 1, 2, 3].map((k) => (
          <g key={k}>
            <g>
              <rect x={-6} y={-12} width={12} height={9} rx={1} fill={k % 2 ? '#d5e4f2' : '#9ec0dc'} stroke={INK} strokeWidth={0.7} />
              <line x1={0} y1={-12} x2={0} y2={-3} stroke="#1a2026" strokeWidth={1} />
              <animateMotion dur={li === 0 ? '9s' : '6s'} repeatCount="indefinite" begin={`${-k * (li === 0 ? 2.25 : 1.5)}s`} path={d} />
            </g>
          </g>
        ));
        return (
          <g key={li}>
            {posts}
            <path d={d} fill="none" stroke="#0c1014" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} fill="none" stroke="#2a3138" strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} className="belt" fill="none" stroke="#c5d8ea" strokeWidth={1.6} strokeDasharray="4 6" />
            {pkgs}
          </g>
        );
      })}
    </g>
  );
}

function Billboard({ rot }: { rot: number }) {
  const sim = useSim();
  const { t } = useI18n();
  let a = P(BILLBOARD.x0, BILLBOARD.y, 0, rot);
  let b = P(BILLBOARD.x1, BILLBOARD.y, 0, rot);
  if (b.x < a.x) [a, b] = [b, a];
  const k = (b.y - a.y) / (b.x - a.x);
  const w = b.x - a.x;
  const z0 = 34;
  const hgt = 56;
  const panel = [
    { x: a.x, y: a.y - z0 }, { x: b.x, y: b.y - z0 }, { x: b.x, y: b.y - z0 - hgt }, { x: a.x, y: a.y - z0 - hgt },
  ];
  return (
    <g className="billboard">
      <line x1={a.x + 8} y1={a.y} x2={a.x + 8} y2={a.y - z0} stroke={INK} strokeWidth={2.5} />
      <line x1={b.x - 8} y1={b.y} x2={b.x - 8} y2={b.y - z0} stroke={INK} strokeWidth={2.5} />
      <polygon points={pts(panel)} fill="#10141a" stroke="#c5d8ea" strokeWidth={1} />
      <g transform={`translate(${a.x} ${a.y - z0 - hgt}) matrix(1 ${k} 0 1 0 0)`}>
        <text x={w / 2} y={20} textAnchor="middle" className="bb-label">{t.viewsBoard}</text>
        <text x={w / 2} y={45} textAnchor="middle" className="bb-value">{formatCompact(sim.state.metrics.views)}</text>
      </g>
    </g>
  );
}

const SEATS: [number, number][] = [
  [0.18, 0.42],
  [-0.42, 0.22],
  [0.48, -0.18],
  [-0.22, -0.46],
  [0.62, 0.55],
];

function bodyShape(shape?: string): 'pill' | 'ghost' | 'tri' {
  if (shape === 'blob' || shape === 'pumpkin' || shape === 'teardrop' || shape === 'flower') return 'ghost';
  if (shape === 'crystal' || shape === 'wedge' || shape === 'sparkle' || shape === 'clover') return 'tri';
  return 'pill';
}

function fleetPose(bot: FleetBot, index: number, rot: number, t: number) {
  const activity: ActivityStatus = bot.activityStatus ?? 'idle';
  const home = BUILDINGS[index % BUILDINGS.length];
  const seat = SEATS[Math.floor(index / BUILDINGS.length) % SEATS.length];
  const deskX = home.door[0] + 0.5 + seat[0];
  const deskY = home.door[1] + 0.5 + seat[1];
  let x = deskX;
  let y = deskY;
  let hop = 0;
  if (activity === 'active') {
    const period = 7 + (index % 4);
    const phase = ((t / period) + index * 0.17) % 1;
    const leg = phase < 0.46 ? phase / 0.46 : phase > 0.54 ? (1 - phase) / 0.46 : 1;
    const f = Math.max(0, Math.min(1, leg));
    const smooth = f * f * (3 - 2 * f);
    const dx = 6.5 - home.door[0];
    const dy = 6.5 - home.door[1];
    const len = Math.hypot(dx, dy) || 1;
    const toX = home.door[0] + 0.5 + (dx / len) * 1.8;
    const toY = home.door[1] + 0.5 + (dy / len) * 1.8;
    x = deskX + (toX - deskX) * smooth;
    y = deskY + (toY - deskY) * smooth;
    hop = Math.abs(Math.sin(smooth * Math.PI)) * 11;
  } else if (activity === 'recent') {
    hop = Math.abs(Math.sin(t * 1.3 + index)) * 2.2;
  }
  const p = P(x, y, 0, rot);
  const desk = P(deskX, deskY, 0, rot);
  return { x: p.x, y: p.y, hop, home, activity, desk };
}

function CityBot({ bot, activity }: { bot: FleetBot; activity: ActivityStatus }) {
  const c = bot.color ?? '#8b959e';
  const shape = bodyShape(bot.avatarShape);
  const body =
    shape === 'pill' ? (
      <rect x={-11} y={-27} width={22} height={25} rx={10} fill={c} stroke={INK} strokeWidth={1.6} />
    ) : shape === 'ghost' ? (
      <path d="M-11,-3 V-16 a11,11 0 0 1 22,0 V-3 l-3.7,3 -3.7,-3 -3.6,3 -3.7,-3 -3.6,3 z" fill={c} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
    ) : (
      <path d="M0,-29 L13,-2 H-13 Z" fill={c} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
    );
  const eyesY = shape === 'tri' ? -12 : -17;
  return (
    <g>
      {activity === 'active' && <ellipse cx={0} cy={2} rx={16} ry={6} fill={c} opacity={0.35} className="pulse" />}
      <ellipse cx={0} cy={1} rx={11} ry={4} fill="#05070a" opacity={0.45} />
      {body}
      <ellipse cx={-6} cy={-21} rx={3} ry={2} fill={shade(c, 0.45)} opacity={0.7} />
      {activity === 'idle' ? (
        <g stroke="#d7e2ea" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}>
          <line x1={-5} y1={eyesY + 2} x2={-2} y2={eyesY + 2} />
          <line x1={2} y1={eyesY + 2} x2={5} y2={eyesY + 2} />
        </g>
      ) : (
        <g fill="#fff">
          <rect className="eye" x={-5.5} y={eyesY - 1} width={3.4} height={7} rx={1.7} />
          <rect className="eye" x={2.1} y={eyesY - 1} width={3.4} height={7} rx={1.7} />
        </g>
      )}
    </g>
  );
}

function textWidth(text: string, lang: string) {
  return lang === 'zh' ? [...text].length * 13 + 28 : text.length * 6.4 + 28;
}

function Dynamic({ rot, labels }: { rot: number; labels: boolean }) {
  const sim = useSimFrame();
  const fleet = useFleet();
  const { lang } = useI18n();
  const s = sim.state;
  const t = s.real;
  const positions = fleet.bots.map((bot, i) => ({ bot, ...fleetPose(bot, i, rot, t) }));

  const paths = positions
    .filter((p) => p.activity === 'active')
    .map(({ bot, x, y, desk }) => (
      <g key={`p-${bot.id}`}>
        <polyline points={pts([{ x: desk.x, y: desk.y }, { x, y }])} fill="none" stroke={bot.color ?? '#c4f93e'} strokeWidth={2.2} strokeDasharray="0.1 7" strokeLinecap="round" opacity={0.8} />
      </g>
    ));

  const bubble = fleet.source === 'live' ? null : s.activeBubble;
  let bubbleEl: ReactNode = null;
  if (bubble) {
    const b = BUILDINGS.find((x) => x.id === bubble.building)!;
    const dp = P(b.door[0] + 0.5, b.door[1] + 0.5, 0, rot);
    const bubbleText = say(lang, bubble.text);
    const needs = bubble.text.id === 'needsYou';
    const w = textWidth(bubbleText, lang);
    const fill = '#0b0d10';
    const edge = needs ? '#c4f93e' : '#c5d8ea';
    bubbleEl = (
      <g transform={`translate(${dp.x} ${dp.y - 78})`} className={needs ? 'bubble pulse' : 'bubble'}>
        <rect x={-w / 2} y={-14} width={w} height={26} rx={2} fill={fill} stroke={edge} strokeWidth={1} />
        <path d={`M-6,12 L0,20 L6,12`} fill={fill} stroke={edge} strokeWidth={1} />
        <line x1={-5} y1={12} x2={5} y2={12} stroke={fill} strokeWidth={2} />
        <text x={0} y={2} textAnchor="middle" className="bubble-text">{bubbleText}</text>
      </g>
    );
  }

  return (
    <g>
      {paths}
      {positions
        .slice()
        .sort((a, b) => a.y - b.y)
        .map(({ bot, x, y, hop, activity }) => {
          const name = bot.name;
          const wide = [...name].some((ch) => ch.charCodeAt(0) > 255);
          const w = wide ? [...name].length * 14 + 28 : name.length * 7.2 + 28;
          return (
            <g key={bot.id} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} className={`agent agent-live-${activity}`}>
              <g transform={`translate(0 ${-hop})`}>
                <CityBot bot={bot} activity={activity} />
              </g>
              {labels && (
                <g transform="translate(0 -50)">
                  <rect x={-w / 2} y={-9} width={w} height={17} rx={2} fill="#0b0d10e6" stroke="rgba(232,236,239,0.28)" strokeWidth={0.8} />
                  <circle cx={-w / 2 + 9} cy={-0.5} r={3.5} fill={bot.color ?? '#8b959e'} />
                  <text x={-w / 2 + 17} y={3.5} className="nametag">{name}</text>
                </g>
              )}
            </g>
          );
        })}
      {labels && BUILDINGS.map((b) => <Callout key={b.id} b={b} rot={rot} />)}
      {bubbleEl}
    </g>
  );
}

function Callout({ b, rot }: { b: Building; rot: number }) {
  const fleet = useFleet();
  const { lang, t } = useI18n();
  const r = rotRect(b.x0, b.y0, b.x1, b.y1, rot);
  const extra = b.kind === 'house' ? 44 : b.kind === 'bank' ? 28 : 10;
  const anchor = proj((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, b.h + extra);
  const ground = proj((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, 0);
  const w = lang === 'zh' ? 168 : 196;
  const ang = Math.atan2((ground.y - 208) * 2, ground.x);
  const c = Math.cos(ang);
  let bx: number;
  let by: number;
  if (Math.abs(c) < 0.35) {
    bx = anchor.x + 46;
    by = Math.sin(ang) < 0 ? anchor.y - 13 : ground.y;
  } else {
    bx = c * 420 - w / 2;
    by = 208 + Math.sin(ang) * 250 - 33;
  }
  bx = Math.max(-420, Math.min(420 - w, bx));
  by = Math.max(-245, Math.min(400, by));
  const here = fleet.bots.filter((_, i) => BUILDINGS[i % BUILDINGS.length].id === b.id);
  const lead = [...here].sort((a, c) => {
    const rank = (bot: FleetBot) => (bot.activityStatus === 'active' ? 0 : bot.activityStatus === 'recent' ? 1 : 2);
    return rank(a) - rank(c);
  })[0];
  const status = !lead
    ? say(lang, { id: 'quiet' })
    : lead.activityStatus === 'active'
      ? `${lead.name} · ${lead.topic ?? t.onStreet}`
      : lead.activityStatus === 'recent'
        ? `${lead.name} · ${lead.topic ?? t.onStreet}`
        : `${lead.name} · ${t.atDesk}`;
  const dot = lead?.activityStatus === 'active' ? '#c4f93e' : lead?.activityStatus === 'recent' ? '#c5d8ea' : '#5c656e';
  const elbowX = anchor.x < bx ? bx : anchor.x > bx + w ? bx + w : anchor.x;
  const elbowY = anchor.x >= bx && anchor.x <= bx + w ? by + 66 : by + 13;
  const full = status;
  const pillText = lang === 'zh' ? [...full].slice(0, 16).join('') : full.slice(0, 34);
  const pw = (lang === 'zh' ? [...pillText].length * 11 : pillText.length * 6.2) + 24;
  return (
    <g className="callout">
      <polyline points={`${anchor.x},${anchor.y} ${anchor.x},${elbowY} ${elbowX},${elbowY}`} fill="none" stroke="#c5d0da" strokeWidth={0.9} opacity={0.7} />
      <circle cx={anchor.x} cy={anchor.y} r={2.4} fill="#c5d8ea" />
      <g transform={`translate(${bx} ${by})`}>
        <rect x={0} y={0} width={w} height={26} rx={2} fill="#0b0d10e8" stroke="rgba(232,236,239,0.22)" strokeWidth={0.8} />
        <circle cx={w / 2} cy={0} r={3.5} fill="#0b0d10" stroke="#c5d8ea" strokeWidth={0.9} />
        <text x={5} y={8} className="callout-no">{t.noLabel} {b.no}</text>
        <text x={w / 2} y={20} textAnchor="middle" className="callout-name">{buildingName(lang, b.id)}</text>
        <text x={w / 2} y={40} textAnchor="middle" className="callout-tag">{buildingTag(lang, b.id)}</text>
        <g transform={`translate(${(w - pw) / 2} 48)`} className={lead?.activityStatus === 'active' ? 'pulse' : undefined}>
          <rect width={pw} height={16} rx={2} fill="#10141a" stroke="rgba(232,236,239,0.16)" strokeWidth={0.7} />
          <circle cx={9} cy={8} r={3.2} fill={dot} />
          <text x={16} y={11.5} className="callout-pill">{pillText}</text>
        </g>
      </g>
    </g>
  );
}
