import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { getEternals, getChampionIconUrl } from '@/lib/lcu-api';

export default function Eternals() {
  const [eternals, setEternals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEternals().then((data) => {
      if (Array.isArray(data)) setEternals(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 space-y-5 animate-slide-up">
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-48 rounded" />
              <div className="skeleton h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : eternals.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-ink-ghost">
          <Star size={40} className="mb-3 opacity-20" />
          <p className="text-sm text-ink-dim">No eternals data</p>
          <p className="text-xs mt-1">Connect to League client to see eternals</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {eternals.map((set: any, i: number) => (
            <div key={i} className="card p-4">
              <h3 className="text-sm font-semibold text-ink-bright mb-3">
                {set.name ?? `Eternal Set ${set.seriesNumber ?? i + 1}`}
              </h3>
              <div className="space-y-2.5">
                {(set.statstones ?? []).map((st: any, j: number) => (
                  <div key={j} className="flex items-center gap-3">
                    <img
                      src={getChampionIconUrl(st.championId ?? 0)}
                      alt=""
                      className="w-7 h-7 rounded object-cover flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-ink truncate">{st.name}</span>
                        <span className="text-xs text-gold tabular-nums flex-shrink-0">
                          {st.formattedValue ?? st.value}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-ghost">Milestone {st.milestoneLevel ?? 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
