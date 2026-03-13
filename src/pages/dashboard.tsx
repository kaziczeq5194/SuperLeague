import { useEffect, useState, useMemo } from 'react';
import { getChampionMasteries, getChallenges, getChampionIconUrl, lcuRequest } from '@/lib/lcu-api';

// ── Tier palette ────────────────────────────────────────────────────────────
const TIER_C: Record<string, string> = {
  NONE: '#5B5A56', IRON: '#72767E', BRONZE: '#A0522D', SILVER: '#A8B2BC',
  GOLD: '#C89B3C', PLATINUM: '#1A9E8F', DIAMOND: '#576BCE',
  MASTER: '#9D48E0', GRANDMASTER: '#E84057', CHALLENGER: '#F4C874',
};

// All thresholds — always draw all of them
const ALL_THRESHOLDS = [
  { tier: 'Iron',   min: 1,  color: TIER_C.IRON },
  { tier: 'Bronze', min: 5,  color: TIER_C.BRONZE },
  { tier: 'Silver', min: 12, color: TIER_C.SILVER },
  { tier: 'Gold',   min: 18, color: TIER_C.GOLD },
  { tier: 'Plat',   min: 25, color: TIER_C.PLATINUM },
  { tier: 'Dia',    min: 30, color: TIER_C.DIAMOND },
  { tier: 'Master', min: 45, color: TIER_C.MASTER },
  { tier: 'GM',     min: 50, color: TIER_C.GRANDMASTER },
  { tier: 'Chall',  min: 65, color: TIER_C.CHALLENGER },
];
const BAR_MAX = 65;

function getCurrentTier(count: number) {
  return [...ALL_THRESHOLDS].reverse().find(t => count >= t.min) ?? null;
}

// Emblem image
function Emblem({ tier, size = 18 }: { tier: string; size?: number }) {
  const key = ({ PLAT: 'platinum', DIA: 'diamond', GM: 'grandmaster', CHALL: 'challenger' } as Record<string, string>)[tier.toUpperCase()] ?? tier.toLowerCase();
  const color = TIER_C[tier.toUpperCase()] ?? TIER_C.NONE;
  const [failed, setFailed] = useState(false);
  if (failed) return (
    <div className="rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
      style={{ width: size, height: size, background: `${color}20`, border: `1px solid ${color}40`, color }}>
      {tier.charAt(0).toUpperCase()}
    </div>
  );
  return (
    <img src={`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/ranked-emblem/emblem-${key}.png`}
      alt={tier} style={{ width: size, height: size }} className="object-contain flex-shrink-0"
      onError={() => setFailed(true)} />
  );
}

// ── Shared-box mastery class bars ────────────────────────────────────────────
const CLASSES = ['Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank'];

function MasteryClassPanel({ classData }: { classData: { name: string; m7: number; m10: number }[] }) {
  const BAR_H = 160; // px height of bar area

  return (
    <div className="flex">
      {/* Left axis labels */}
      <div className="flex-shrink-0 w-14 relative" style={{ height: BAR_H }}>
        {ALL_THRESHOLDS.map(t => {
          const pct = (t.min / BAR_MAX) * 100;
          return (
            <div key={t.tier} className="absolute right-0 flex items-center gap-1"
              style={{ bottom: `${pct}%`, transform: 'translateY(50%)' }}>
              <span className="text-[9px] font-semibold tabular-nums" style={{ color: t.color }}>{t.min}</span>
              <span className="text-[8px]" style={{ color: `${t.color}AA` }}>{t.tier}</span>
            </div>
          );
        })}
      </div>

      {/* Bar area */}
      <div className="flex-1 relative" style={{ height: BAR_H }}>
        {/* Dotted grid lines — span the entire width across all bars */}
        {ALL_THRESHOLDS.map(t => {
          const pct = (t.min / BAR_MAX) * 100;
          return (
            <div key={t.tier} className="absolute left-0 right-0 pointer-events-none"
              style={{ bottom: `${pct}%` }}>
              <div className="border-t border-dashed w-full" style={{ borderColor: `${t.color}30` }} />
            </div>
          );
        })}

        {/* Bars */}
        <div className="absolute inset-0 flex gap-3 px-2">
          {classData.map(cls => {
            const pct7 = Math.min((cls.m7 / BAR_MAX) * 100, 100);
            const pct10 = Math.min((cls.m10 / BAR_MAX) * 100, 100);
            const cur = getCurrentTier(cls.m7);
            const barColor = cur?.color ?? TIER_C.NONE;

            return (
              <div key={cls.name} className="flex-1 flex flex-col items-center gap-1">
                {/* Count above bar */}
                <div className="h-5 flex items-end">
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: barColor }}>{cls.m7}</span>
                  {cls.m10 > 0 && <span className="text-[8px] text-gold tabular-nums ml-0.5">/{cls.m10}</span>}
                </div>

                {/* Bar column */}
                <div className="flex-1 w-full relative rounded overflow-hidden bg-dark border border-white/[0.06]">
                  {/* M10 highlight (gold, semi-transparent) */}
                  {cls.m10 > 0 && (
                    <div className="absolute bottom-0 inset-x-0 rounded-t transition-all duration-700"
                      style={{ height: `${pct10}%`, background: '#C89B3C33' }} />
                  )}
                  {/* M7 bar */}
                  <div className="absolute bottom-0 inset-x-1 rounded-t transition-all duration-700"
                    style={{ height: `${pct7}%`, background: `linear-gradient(0deg, ${barColor}CC, ${barColor})` }} />
                </div>

                {/* Emblem + label */}
                <Emblem tier={cur?.tier ?? 'None'} size={14} />
                <span className="text-[8px] text-ink-ghost font-medium text-center leading-tight">{cls.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Challenge row ────────────────────────────────────────────────────────────
function ChallengeRow({ c }: { c: any }) {
  const [tip, setTip] = useState(false);
  const tier = (c.currentLevel ?? c.level ?? 'NONE').toUpperCase();
  const cur = c.currentValue ?? 0;
  const next = c.nextLevelValue ?? c.nextThreshold ?? 0;
  const prev = c.previousLevelValue ?? 0;
  const isMasterPlus = ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier);
  const pct = (!isMasterPlus && next > prev) ? Math.min(((cur - prev) / (next - prev)) * 100, 100) : 100;
  const color = TIER_C[tier] ?? TIER_C.NONE;

  return (
    <div className="relative flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-white/[0.02] transition-colors"
      onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
      <Emblem tier={tier} size={20} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-medium text-ink-bright truncate pr-2">{c.name ?? `#${c.id}`}</span>
          <span className="text-[10px] text-ink-ghost tabular-nums flex-shrink-0">
            {isMasterPlus ? '✓' : `${cur.toLocaleString()} / ${next.toLocaleString()}`}
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      {tip && (c.description ?? c.shortDescription) && (
        <div className="absolute left-0 bottom-full mb-1 z-50 w-60 p-2 rounded-lg bg-raised border border-white/[0.1] shadow-xl text-[10px] text-ink-dim leading-relaxed">
          {c.description ?? c.shortDescription}
        </div>
      )}
    </div>
  );
}

// ── Champion row ─────────────────────────────────────────────────────────────
function ChampionRow({ m, rank }: { m: any; rank: number }) {
  const lvl = m.championLevel ?? 0;
  const pts = m.championPoints ?? 0;
  const color = lvl >= 7 ? '#C89B3C' : '#5B5A56';
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
      <span className="w-4 text-[10px] text-ink-ghost text-right flex-shrink-0 tabular-nums">{rank}</span>
      <img src={getChampionIconUrl(m.championId)} alt=""
        className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border border-white/[0.06]"
        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
      <span className="flex-1 text-xs text-ink-bright truncate">#{m.championId}</span>
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
        style={{ background: `${color}15`, color }}>M{lvl}</span>
      <span className="text-xs text-gold tabular-nums flex-shrink-0 w-16 text-right">
        {pts >= 1_000_000 ? `${(pts / 1_000_000).toFixed(1)}M` : pts >= 1_000 ? `${(pts / 1_000).toFixed(0)}K` : String(pts)}
      </span>
    </div>
  );
}

// ── Debug panel ──────────────────────────────────────────────────────────────
function DebugPanel() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const test = async (endpoint: string) => {
    setLoading(true);
    setResult('...');
    try {
      const res = await lcuRequest({ method: 'GET', endpoint });
      setResult(`Status: ${res.status}\n${res.body?.slice(0, 600) ?? '(empty)'}`);
    } catch (e) {
      setResult(`Error: ${e}`);
    }
    setLoading(false);
  };

  const endpoints = [
    ['/lol-summoner/v1/current-summoner', 'Summoner'],
    ['/lol-champion-mastery/v1/local-player/champion-mastery/top?count=10', 'Mastery'],
    ['/lol-challenges/v1/challenges/local-player/', 'Challenges'],
  ];

  return (
    <div className="card p-4 space-y-2">
      <h3 className="text-xs font-semibold text-ruby uppercase tracking-wider">Data Debug</h3>
      <div className="flex gap-2 flex-wrap">
        {endpoints.map(([ep, label]) => (
          <button key={ep} onClick={() => test(ep)} disabled={loading}
            className="px-2.5 py-1 text-[10px] rounded bg-raised border border-white/[0.1] text-ink hover:text-gold transition-colors disabled:opacity-50">
            {label}
          </button>
        ))}
      </div>
      {result && (
        <pre className="text-[9px] text-ink-ghost bg-dark rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap break-all">
          {result}
        </pre>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [masteries, setMasteries] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getChampionMasteries(), getChallenges()]).then(([m, c]) => {
      if (Array.isArray(m) && m.length > 0)
        setMasteries(m.sort((a: any, b: any) => (b.championPoints ?? 0) - (a.championPoints ?? 0)));
      if (Array.isArray(c) && c.length > 0)
        setChallenges(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const classData = CLASSES.map((name, i) => ({
    name,
    m7:  masteries.filter(m => (m.championId % CLASSES.length) === i && (m.championLevel ?? 0) >= 7).length,
    m10: masteries.filter(m => (m.championId % CLASSES.length) === i && (m.championLevel ?? 0) >= 10).length,
  }));

  const masteryChallenges = useMemo(() => {
    const kw = ['catch', 'master yourself', 'wise master', 'one-trick', 'master the enemy', 'jack of all'];
    const matched = challenges.filter(c => kw.some(k => (c.name ?? '').toLowerCase().includes(k)));
    return matched.length >= 3 ? matched.slice(0, 6) : challenges.slice(0, 6);
  }, [challenges]);

  const closest3 = useMemo(() =>
    challenges
      .filter(c => {
        const next = c.nextLevelValue ?? c.nextThreshold ?? 0;
        const tier = (c.currentLevel ?? '').toUpperCase();
        return next > 0 && (c.currentValue ?? 0) < next && !['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier);
      })
      .map(c => {
        const cur = c.currentValue ?? 0;
        const next = c.nextLevelValue ?? c.nextThreshold ?? 1;
        const prev = c.previousLevelValue ?? 0;
        return { ...c, _pct: next > prev ? ((cur - prev) / (next - prev)) * 100 : 0 };
      })
      .sort((a, b) => b._pct - a._pct)
      .slice(0, 3)
  , [challenges]);

  const noData = !loading && masteries.length === 0 && challenges.length === 0;

  return (
    <div className="p-6 space-y-4 animate-slide-up">
      {/* Debug panel — always shown when there's no data */}
      {noData && <DebugPanel />}

      <div className="grid grid-cols-[1fr_300px] gap-4">
        {/* ── Left ── */}
        <div className="space-y-4">
          {/* Mastery Class Challenges — one shared box */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink-bright">Mastery Class Challenges</h2>
              <div className="flex items-center gap-3 text-[9px] text-ink-ghost">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gold" /> M7</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gold/30" /> M10</div>
              </div>
            </div>
            {loading ? (
              <div className="skeleton h-48 rounded" />
            ) : (
              <MasteryClassPanel classData={classData} />
            )}
          </div>

          {/* Mastery Challenges */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-ink-bright mb-1">Mastery Challenges</h2>
            {loading ? (
              <div className="space-y-1.5">{Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}</div>
            ) : masteryChallenges.length === 0 ? (
              <p className="text-xs text-ink-ghost py-6 text-center">No challenge data</p>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {masteryChallenges.map((c, i) => <ChallengeRow key={c.id ?? i} c={c} />)}
              </div>
            )}
          </div>
        </div>

        {/* ── Right ── */}
        <div className="space-y-4">
          {/* Top Champions */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-ink-bright mb-2">Top Champions</h2>
            {loading ? (
              <div className="space-y-1.5">{Array(10).fill(0).map((_, i) => <div key={i} className="skeleton h-9 rounded" />)}</div>
            ) : masteries.length === 0 ? (
              <p className="text-xs text-ink-ghost py-8 text-center">No mastery data</p>
            ) : (
              <div>{masteries.slice(0, 12).map((m, i) => <ChampionRow key={m.championId} m={m} rank={i + 1} />)}</div>
            )}
          </div>

          {/* Closest 3 */}
          {(loading || closest3.length > 0) && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-ink-bright mb-2">Almost There</h2>
              {loading ? (
                <div className="space-y-2">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}</div>
              ) : (
                <div className="space-y-2">
                  {closest3.map((c, i) => {
                    const tier = (c.currentLevel ?? 'NONE').toUpperCase();
                    const color = TIER_C[tier] ?? TIER_C.NONE;
                    return (
                      <div key={c.id ?? i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                        <Emblem tier={tier} size={18} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-medium text-ink-bright truncate">{c.name ?? `#${c.id}`}</span>
                            <span className="text-[9px] text-ink-ghost ml-1 flex-shrink-0">{Math.round(c._pct ?? 0)}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${c._pct ?? 0}%`, background: color }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
