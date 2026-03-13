import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { getEternals, getChampionIconUrl } from '@/lib/lcu-api';

export default function Eternals() {
  const [eternals, setEternals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEternals().then((data) => {
      // Data can be array of champion eternal sets
      if (Array.isArray(data) && data.length > 0) {
        setEternals(data);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 space-y-5 animate-slide-up">
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-lg" />
          ))}
        </div>
      ) : eternals.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-ink-ghost">
          <Star size={40} className="mb-3 opacity-20" />
          <p className="text-sm text-ink-dim">No eternals data</p>
          <p className="text-xs mt-1">Eternals data will appear when you own eternals in the League client</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {eternals.map((set: any, idx: number) => {
            // Each set can have different structures depending on LCU version
            const champId = set.championId ?? set.champion_id;
            const statstones = set.statstones ?? set.sets ?? set.milestones ?? [];
            const displayStones = Array.isArray(statstones) ? statstones : Object.values(statstones);
            const setName = set.name ?? set.seriesName ?? `Eternal Set ${idx + 1}`;

            return (
              <div key={idx} className="card p-4">
                {/* Champion + set header */}
                <div className="flex items-center gap-2.5 mb-3">
                  {champId && (
                    <img src={getChampionIconUrl(champId)} alt=""
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-white/[0.06]"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
                  )}
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-ink-bright truncate">{setName}</h3>
                    {champId && <p className="text-[10px] text-ink-ghost">Champion #{champId}</p>}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2.5">
                  {displayStones.length > 0 ? displayStones.map((st: any, j: number) => {
                    const milestone = st.milestoneLevel ?? st.milestone ?? st.completedMilestones ?? 0;
                    return (
                      <div key={j} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-ink truncate">
                            {st.name ?? st.description ?? `Stat ${j + 1}`}
                          </p>
                          <p className="text-[9px] text-ink-ghost">Milestone {milestone}</p>
                        </div>
                        <span className="text-xs font-semibold text-gold tabular-nums flex-shrink-0">
                          {st.formattedValue ?? st.value?.toLocaleString?.() ?? '—'}
                        </span>
                      </div>
                    );
                  }) : (
                    <p className="text-[10px] text-ink-ghost">No stats in this set</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
