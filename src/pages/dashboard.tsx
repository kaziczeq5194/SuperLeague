import { useEffect, useState } from 'react';
import { Flame, Trophy, Star, Swords, TrendingUp, TrendingDown, ArrowUpRight, Minus } from 'lucide-react';
import { getChampionMasteries, getChallenges, getChampionIconUrl, getRankedStats } from '@/lib/lcu-api';

/* ── SVG Ring Gauge ── */
function RingGauge({ progress, color, label, value }: { progress: number; color: string; label: string; value: string }) {
  const r = 36, cx = 44, cy = 44, c = 2 * Math.PI * r;
  const offset = c - (Math.min(progress, 100) / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-[88px] h-[88px]">
        <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
          <circle
            cx={cx} cy={cy} r={r} fill="none" strokeWidth="5" strokeLinecap="round"
            stroke={color}
            strokeDasharray={c} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out', filter: `drop-shadow(0 0 4px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-ink-bright tabular-nums">{value}</span>
        </div>
      </div>
      <span className="text-[10px] text-ink-muted font-medium">{label}</span>
    </div>
  );
}

/* ── Rank Badge ── */
const TIER_COLORS: Record<string, string> = {
  IRON: '#6B6B6B', BRONZE: '#8C5A3C', SILVER: '#9AA4AF', GOLD: '#C89B3C',
  PLATINUM: '#4E9996', EMERALD: '#10D48A', DIAMOND: '#576BCE', MASTER: '#9D48E0',
  GRANDMASTER: '#E84057', CHALLENGER: '#F4C874',
};

function RankCard({ queue, tier, division, lp, wins, losses }: {
  queue: string; tier: string; division: string; lp: number; wins: number; losses: number;
}) {
  const color = TIER_COLORS[tier] ?? '#5B5A56';
  const total = wins + losses;
  const wr = total > 0 ? Math.round((wins / total) * 100) : 0;
  return (
    <div className="card p-4 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
      >
        {tier.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-muted">{queue}</p>
        <p className="text-sm font-semibold text-ink-bright">
          {tier.charAt(0) + tier.slice(1).toLowerCase()} {division} · <span className="tabular-nums">{lp} LP</span>
        </p>
        <div className="flex items-center gap-2 mt-1 text-[10px]">
          <span className="text-emerald">{wins}W</span>
          <span className="text-ruby">{losses}L</span>
          <span className="text-ink-ghost">{wr}% WR</span>
        </div>
      </div>
      {/* LP trend indicator */}
      <div className="flex flex-col items-center gap-0.5">
        {wr >= 50
          ? <TrendingUp size={14} className="text-emerald" />
          : wr > 0
            ? <TrendingDown size={14} className="text-ruby" />
            : <Minus size={14} className="text-ink-ghost" />
        }
        <span className={`text-[10px] font-semibold tabular-nums ${wr >= 50 ? 'text-emerald' : 'text-ruby'}`}>
          {wr >= 50 ? '+' : ''}{wr - 50}%
        </span>
      </div>
    </div>
  );
}

/* ── Champion Row ── */
function ChampionRow({ data, rank }: { data: any; rank: number }) {
  const pts = data.championPoints ?? 0;
  const lvl = data.championLevel ?? 0;
  const name = data.championName ?? `Champion #${data.championId}`;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="w-5 text-xs text-ink-ghost text-right tabular-nums">{rank}</span>
      <div className="relative flex-shrink-0">
        <img
          src={getChampionIconUrl(data.championId)}
          alt={name}
          className="w-9 h-9 rounded-lg object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
        />
        {lvl >= 7 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-void rounded-full text-[8px] font-bold flex items-center justify-center">
            {lvl}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-bright truncate">{name}</p>
        <div className="progress-track mt-1" style={{ height: '2px' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min((pts / 200_000) * 100, 100)}%`,
              background: lvl >= 7 ? 'linear-gradient(90deg, #785A28, #C89B3C)' : 'rgba(200,155,60,0.4)',
            }}
          />
        </div>
      </div>
      <span className="text-xs text-ink-dim tabular-nums flex-shrink-0">{pts.toLocaleString()}</span>
      <span className={`text-[10px] font-bold w-6 text-center flex-shrink-0 ${lvl >= 7 ? 'text-gold' : 'text-ink-ghost'}`}>
        M{lvl}
      </span>
    </div>
  );
}

/* ── Mastery class config ── */
const CLASSES = [
  { name: 'Marksman',  color: '#FA5C5C', roles: ['marksman'] },
  { name: 'Mage',      color: '#7B5CFA', roles: ['mage'] },
  { name: 'Assassin',  color: '#C89B3C', roles: ['assassin'] },
  { name: 'Fighter',   color: '#FF8C42', roles: ['fighter'] },
  { name: 'Tank',      color: '#4A9EFF', roles: ['tank'] },
  { name: 'Support',   color: '#10D48A', roles: ['support'] },
];

export default function Dashboard() {
  const [masteries, setMasteries] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [ranked, setRanked] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getChampionMasteries(),
      getChallenges(),
      getRankedStats(),
    ]).then(([m, c, r]) => {
      if (Array.isArray(m)) setMasteries(m);
      if (Array.isArray(c)) setChallenges(c);
      if (r && typeof r === 'object') setRanked(r);
      setLoading(false);
    });
  }, []);

  const totalMastery = masteries.reduce((s, m) => s + (m.championPoints ?? 0), 0);
  const champsPlayed = masteries.length;
  const challengesDone = challenges.filter((c: any) => c.currentLevel && c.currentLevel !== 'NONE').length;

  // Extract queues from ranked
  const soloQ = ranked?.queues?.find?.((q: any) => q.queueType === 'RANKED_SOLO_5x5');
  const flexQ = ranked?.queues?.find?.((q: any) => q.queueType === 'RANKED_FLEX_SR');

  // Compute class progress from real data (simplified — count mastery pts per class)
  const classProgress = CLASSES.map(cls => {
    const points = masteries
      .filter((m: any) => {
        const roles = (m.roles ?? []).map((r: string) => r.toLowerCase());
        return cls.roles.some(r => roles.includes(r));
      })
      .reduce((s: number, m: any) => s + (m.championPoints ?? 0), 0);
    const maxPts = 500_000; // arbitrary max for gauge
    return { ...cls, points, progress: Math.min((points / maxPts) * 100, 100) };
  });

  const stats = [
    { label: 'Total Mastery', value: totalMastery > 1_000_000 ? `${(totalMastery / 1_000_000).toFixed(1)}M` : `${Math.round(totalMastery / 1000)}K`, icon: Flame, color: '#C89B3C' },
    { label: 'Challenges', value: String(challengesDone), icon: Trophy, color: '#10D48A' },
    { label: 'Champions', value: String(champsPlayed), icon: Swords, color: '#0BC4E3' },
  ];

  return (
    <div className="p-6 space-y-5 animate-slide-up">
      {/* Stats + Rank row */}
      <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 items-stretch">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
              <Icon size={17} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-ink-bright tabular-nums leading-none">{value}</p>
              <p className="text-xs text-ink-muted mt-0.5">{label}</p>
            </div>
          </div>
        ))}
        {/* Rank badges */}
        {soloQ && soloQ.tier && soloQ.tier !== 'NONE' && (
          <RankCard queue="Solo/Duo" tier={soloQ.tier} division={soloQ.division ?? ''} lp={soloQ.leaguePoints ?? 0} wins={soloQ.wins ?? 0} losses={soloQ.losses ?? 0} />
        )}
        {flexQ && flexQ.tier && flexQ.tier !== 'NONE' && (
          <RankCard queue="Flex" tier={flexQ.tier} division={flexQ.division ?? ''} lp={flexQ.leaguePoints ?? 0} wins={flexQ.wins ?? 0} losses={flexQ.losses ?? 0} />
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_320px] gap-5">
        {/* Left: Champion list */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-ink-bright">Top Champions</h2>
              <p className="text-xs text-ink-muted mt-0.5">by mastery points</p>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="skeleton w-4 h-4 rounded" />
                  <div className="skeleton w-9 h-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-28 rounded" />
                    <div className="skeleton h-1.5 w-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : masteries.length === 0 ? (
            <div className="py-12 text-center text-ink-ghost">
              <Flame size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm text-ink-dim">No mastery data</p>
              <p className="text-xs mt-1">Connect to the League client to see your champions</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {masteries.slice(0, 10).map((m, i) => (
                <ChampionRow key={m.championId} data={m} rank={i + 1} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Mastery rings + today stats */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-ink-bright mb-1">Mastery Classes</h2>
            <p className="text-xs text-ink-muted mb-4">progress by role</p>
            <div className="grid grid-cols-3 gap-3">
              {classProgress.map((cls) => (
                <RingGauge
                  key={cls.name}
                  progress={cls.progress}
                  color={cls.color}
                  label={cls.name}
                  value={cls.points > 1000 ? `${Math.round(cls.points / 1000)}K` : String(cls.points)}
                />
              ))}
            </div>
          </div>

          {/* Quick session stats */}
          <div className="card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-ink-bright">Session</h2>
            <div className="space-y-2.5">
              {[
                { label: 'Total mastery',   value: totalMastery.toLocaleString(),  color: '#C89B3C' },
                { label: 'Champions played', value: String(champsPlayed),           color: '#0BC4E3' },
                { label: 'Challenges done',  value: String(challengesDone),          color: '#10D48A' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">{label}</span>
                  <span className="font-semibold tabular-nums" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
