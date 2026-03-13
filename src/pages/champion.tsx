import { useEffect, useState, useMemo } from 'react';
import { Search, Swords } from 'lucide-react';
import { getChampionMasteries, getChampionIconUrl } from '@/lib/lcu-api';

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const M_COLOR: Record<number, string> = {
  1: '#5B5A56', 2: '#5B5A56', 3: '#5B5A56', 4: '#5B5A56',
  5: '#E84057', 6: '#9D48E0', 7: '#C89B3C', 8: '#C89B3C',
  9: '#C89B3C', 10: '#F4C874',
};

export default function ChampionBreakdown() {
  const [masteries, setMasteries] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChampionMasteries().then((m) => {
      if (Array.isArray(m) && m.length > 0) {
        const sorted = m.sort((a: any, b: any) => (b.championPoints ?? 0) - (a.championPoints ?? 0));
        setMasteries(sorted);
        setSelected(sorted[0]); // Auto-select first
      }
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return masteries;
    return masteries.filter(m => String(m.championId).includes(search));
  }, [masteries, search]);

  const detail = selected;
  const lvl = detail?.championLevel ?? 0;
  const color = M_COLOR[Math.min(lvl, 10)] ?? '#5B5A56';
  const pts = detail?.championPoints ?? 0;
  const ptsNext = detail?.championPointsUntilNextLevel ?? 0;
  const ptsSince = detail?.championPointsSinceLastLevel ?? 0;
  const pct = ptsNext > 0 ? Math.round((ptsSince / (ptsSince + ptsNext)) * 100) : 100;

  return (
    <div className="p-6 animate-slide-up flex gap-5 h-[calc(100vh-80px)]">
      {/* Left: champion list */}
      <div className="w-52 flex flex-col gap-2.5 flex-shrink-0">
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-ghost" />
          <input type="text" placeholder="Search…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-search text-[10px] py-1.5" />
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-0.5">
          {loading
            ? Array(12).fill(0).map((_, i) => <div key={i} className="skeleton h-9 rounded" />)
            : filtered.length === 0
              ? <p className="text-center py-6 text-[10px] text-ink-ghost">No champions found</p>
              : filtered.map(m => {
                  const l = m.championLevel ?? 0;
                  const c = M_COLOR[Math.min(l, 10)] ?? '#5B5A56';
                  return (
                    <button key={m.championId} onClick={() => setSelected(m)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                        selected?.championId === m.championId
                          ? 'bg-gold/10 border border-gold/20'
                          : 'hover:bg-white/[0.04] border border-transparent'
                      }`}>
                      <img src={getChampionIconUrl(m.championId)} alt=""
                        className="w-6 h-6 rounded object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-ink-bright truncate">#{m.championId}</p>
                      </div>
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded flex-shrink-0"
                        style={{ background: `${c}15`, color: c }}>M{l}</span>
                    </button>
                  );
                })
          }
        </div>
      </div>

      {/* Right: detail panel */}
      <div className="flex-1 min-w-0">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-ghost">
            <Swords size={36} className="mb-3 opacity-20" />
            <p className="text-sm text-ink-dim">Select a champion</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Champion header */}
            <div className="card p-5 flex items-center gap-4">
              <img src={getChampionIconUrl(selected.championId)} alt=""
                className="w-16 h-16 rounded-xl border-2 object-cover"
                style={{ borderColor: `${color}50` }} />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-ink-bright">Champion #{selected.championId}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${color}15`, color }}>
                    Mastery {lvl}
                  </span>
                  <span className="text-sm text-gold tabular-nums font-semibold">{pts.toLocaleString()} pts</span>
                </div>
              </div>
            </div>

            {/* Progress to next level */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-ink-muted">Progress to Mastery {lvl + 1}</span>
                <span className="text-xs text-ink-ghost tabular-nums">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-ink-ghost tabular-nums">
                <span>{ptsSince.toLocaleString()} earned</span>
                <span>{ptsNext.toLocaleString()} remaining</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Points', value: pts.toLocaleString(), color: '#C89B3C' },
                { label: 'Tokens', value: String(detail?.tokensEarned ?? 0), color: '#10D48A' },
                { label: 'Last Played', value: detail?.lastPlayTime
                  ? new Date(detail.lastPlayTime).toLocaleDateString()
                  : '—', color: '#576BCE' },
              ].map(({ label, value, color: c }) => (
                <div key={label} className="card-inset text-center py-3">
                  <p className="text-base font-bold tabular-nums" style={{ color: c }}>{value}</p>
                  <p className="text-[10px] text-ink-ghost mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
