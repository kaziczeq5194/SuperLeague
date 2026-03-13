import { useEffect, useState } from 'react';
import { Trophy, Search } from 'lucide-react';
import { getChallenges } from '@/lib/lcu-api';

const TIERS = ['ALL', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'] as const;

const TIER_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  NONE:        { bg: 'rgba(91,90,86,0.12)',    text: '#5B5A56', border: 'rgba(91,90,86,0.2)' },
  IRON:        { bg: 'rgba(91,90,86,0.12)',    text: '#9AA4AF', border: 'rgba(91,90,86,0.3)' },
  BRONZE:      { bg: 'rgba(140,87,58,0.12)',   text: '#CD7F32', border: 'rgba(140,87,58,0.3)' },
  SILVER:      { bg: 'rgba(162,169,183,0.10)', text: '#C0C8D4', border: 'rgba(162,169,183,0.2)' },
  GOLD:        { bg: 'rgba(200,155,60,0.12)',  text: '#C89B3C', border: 'rgba(200,155,60,0.25)' },
  PLATINUM:    { bg: 'rgba(78,153,150,0.12)',  text: '#4E9996', border: 'rgba(78,153,150,0.25)' },
  DIAMOND:     { bg: 'rgba(87,107,206,0.12)',  text: '#576BCE', border: 'rgba(87,107,206,0.25)' },
  MASTER:      { bg: 'rgba(157,72,224,0.12)',  text: '#9D48E0', border: 'rgba(157,72,224,0.3)' },
  GRANDMASTER: { bg: 'rgba(232,64,87,0.12)',   text: '#E84057', border: 'rgba(232,64,87,0.3)' },
  CHALLENGER:  { bg: 'rgba(240,178,50,0.12)',  text: '#F0B232', border: 'rgba(240,178,50,0.3)' },
};

function TierBadge({ tier }: { tier: string }) {
  const s = TIER_STYLE[tier] ?? TIER_STYLE['NONE'];
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {tier}
    </span>
  );
}

export default function Challenges() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChallenges().then((data) => {
      if (Array.isArray(data)) setChallenges(data);
      setLoading(false);
    });
  }, []);

  const filtered = challenges.filter((c) => {
    const name = (c.name ?? c.description ?? '').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const currentTier = c.currentLevel ?? c.currentTier ?? 'NONE';
    const matchTier = tier === 'ALL' || currentTier === tier;
    return matchSearch && matchTier;
  });

  return (
    <div className="p-6 space-y-5 animate-slide-up">
      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-ghost" />
          <input
            type="text"
            placeholder="Search challenges…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-search"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={`px-2.5 py-1.5 rounded text-[11px] font-medium transition-all duration-150 ${
                tier === t
                  ? 'bg-gold text-void'
                  : 'bg-raised text-ink-muted border border-white/[0.06] hover:text-ink'
              }`}
            >
              {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-ghost">
        Showing <span className="text-ink font-medium">{filtered.length}</span> challenges
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-ink-ghost">
          <Trophy size={40} className="mb-3 opacity-20" />
          <p className="text-sm text-ink-dim">No challenge data</p>
          <p className="text-xs mt-1">Connect to League client to see challenges</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c, i) => {
            const currentTier = c.currentLevel ?? c.currentTier ?? 'NONE';
            const tierStyle = TIER_STYLE[currentTier] ?? TIER_STYLE['NONE'];
            const current = c.currentValue ?? 0;
            const next = c.nextLevelValue ?? c.nextThreshold ?? 1;
            const prev = c.previousLevelValue ?? 0;
            const pct = next > prev ? Math.min(Math.round(((current - prev) / (next - prev)) * 100), 100) : 100;

            return (
              <div key={c.id ?? i} className="card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-bright truncate">{c.name ?? c.description ?? `Challenge #${c.id}`}</p>
                    <p className="text-xs text-ink-muted mt-0.5 truncate-2">{c.description ?? ''}</p>
                  </div>
                  <TierBadge tier={currentTier} />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-ink-ghost mb-1.5">
                    <span className="tabular-nums">{current} / {next}</span>
                    <span className="font-medium" style={{ color: tierStyle.text }}>{pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${tierStyle.text}66, ${tierStyle.text})`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-ghost">{c.category ?? ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
