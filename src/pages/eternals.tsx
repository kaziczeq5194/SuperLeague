import { useEffect, useState } from 'react';
import { Star, TrendingUp, Trophy } from 'lucide-react';
import { getEternals, getChampionIconUrl } from '@/lib/lcu-api';

// Champion name lookup from Community Dragon
let championNames: Record<number, string> = {};
async function loadChampionNames(): Promise<Record<number, string>> {
  if (Object.keys(championNames).length > 0) return championNames;
  try {
    const res = await fetch('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json');
    const data = await res.json();
    if (Array.isArray(data)) {
      data.forEach((c: any) => {
        if (c.id && c.id !== -1) championNames[c.id] = c.name ?? c.alias ?? `#${c.id}`;
      });
    }
  } catch (e) {
    console.error('Failed to load champion names:', e);
  }
  return championNames;
}

function getChampionName(championId: number): string {
  return championNames[championId] ?? `Champion #${championId}`;
}

// Eternal/Statstone definitions from Community Dragon
interface EternalDef {
  name: string;
  description?: string;
  milestones: number[]; // thresholds for each milestone level
  series: string;
  isRetired: boolean;
}
let championEternals: Record<number, EternalDef[]> = {};
async function loadEternalDefinitions(): Promise<void> {
  if (Object.keys(championEternals).length > 0) return;
  try {
    const res = await fetch('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/statstones.json');
    const data = await res.json();

    // Structure: { statstoneData: [ { name: "Series 1", statstones: [...] }, ... ] }
    const statstoneData = data?.statstoneData ?? [];

    statstoneData.forEach((seriesData: any) => {
      const seriesName = seriesData.name ?? 'Unknown';
      const statstones = seriesData.statstones ?? [];

      statstones.forEach((stone: any) => {
        const champId = stone.boundChampion?.itemId;
        if (!champId || champId === -1) return;

        if (!championEternals[champId]) {
          championEternals[champId] = [];
        }

        // Normalize series name
        let series = 'Starter Series';
        if (seriesName.includes('1')) series = 'Series 1';
        else if (seriesName.includes('2')) series = 'Series 2';

        championEternals[champId].push({
          name: stone.name ?? 'Unknown',
          description: stone.description ?? stone.descriptionText ?? '',
          milestones: stone.milestones ?? [],
          series,
          isRetired: stone.isRetired ?? false,
        });
      });
    });

    console.log('[Eternals] Loaded definitions for', Object.keys(championEternals).length, 'champions');
  } catch (e) {
    console.error('Failed to load eternal definitions:', e);
  }
}

const SERIES_COLORS: Record<string, string> = {
  'Starter Series': '#9D48E0',
  'Series 1': '#576BCE',
  'Series 2': '#10D48A',
};

export default function Eternals() {
  const [eternals, setEternals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChampionNames();
    loadEternalDefinitions();
    
    getEternals().then((data) => {
      // Data can be array of champion eternal sets
      if (Array.isArray(data) && data.length > 0) {
        // Sort by total milestones passed
        const sorted = data.sort((a, b) => {
          const aMilestones = (a.sets ?? []).reduce((sum: number, set: any) => sum + (set.milestonesPassed ?? 0), 0);
          const bMilestones = (b.sets ?? []).reduce((sum: number, set: any) => sum + (set.milestonesPassed ?? 0), 0);
          return bMilestones - aMilestones;
        });
        setEternals(sorted);
      }
      setLoading(false);
    });
  }, []);

  // Calculate totals
  const totalMilestones = eternals.reduce((sum, e) => {
    return sum + (e.sets ?? []).reduce((s: number, set: any) => s + (set.milestonesPassed ?? 0), 0);
  }, 0);

  const maxedSets = eternals.reduce((count, e) => {
    return count + (e.sets ?? []).filter((set: any) => {
      const maxMilestones = (set.stonesOwned ?? 0) * 5;
      return maxMilestones > 0 && (set.milestonesPassed ?? 0) >= maxMilestones;
    }).length;
  }, 0);

  return (
    <div className="p-6 space-y-5 animate-slide-up">
      {/* Stats row */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Champions with Eternals', value: String(eternals.length), color: '#9D48E0', icon: Star },
          { label: 'Total Milestones', value: String(totalMilestones), color: '#576BCE', icon: TrendingUp },
          { label: 'Maxed Sets', value: String(maxedSets), color: '#F4C874', icon: Trophy },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-3.5 flex items-center gap-3 flex-1 min-w-[160px]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums leading-none" style={{ color }}>{loading ? '…' : value}</p>
              <p className="text-[10px] text-ink-muted mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Eternals list */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-lg" />
          ))}
        </div>
      ) : eternals.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-ink-ghost">
          <Star size={40} className="mb-3 opacity-20" />
          <p className="text-sm text-ink-dim">No eternals data</p>
          <p className="text-xs mt-1">Eternals data will appear when you own eternals in the League client</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eternals.map((eternal: any, idx: number) => {
            const champId = eternal.championId ?? eternal.champion_id;
            const sets = eternal.sets ?? [];
            
            return (
              <div key={idx} className="card p-4">
                {/* Champion header */}
                <div className="flex items-center gap-3 mb-4">
                  {champId && (
                    <img src={getChampionIconUrl(champId)} alt=""
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border-2 border-white/[0.08]"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-ink-bright">{getChampionName(champId)}</h3>
                    <p className="text-[10px] text-ink-ghost">{sets.length} Eternal Set{sets.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Series breakdown */}
                <div className="space-y-3">
                  {sets.map((set: any, setIdx: number) => {
                    const seriesName = set.name ?? `Set ${setIdx + 1}`;
                    const seriesColor = SERIES_COLORS[seriesName] ?? '#9D48E0';
                    const stonesOwned = set.stonesOwned ?? 0;
                    const milestonesPassed = set.milestonesPassed ?? 0;
                    const maxMilestones = stonesOwned * 5;
                    const isMaxed = maxMilestones > 0 && milestonesPassed >= maxMilestones;
                    const progress = maxMilestones > 0 ? Math.round((milestonesPassed / maxMilestones) * 100) : 0;

                    // Get eternal definitions for this champion and series
                    const champEternals = championEternals[champId] ?? [];
                    const seriesEternals = champEternals.filter(e => e.series === seriesName);

                    return (
                      <div key={setIdx} className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                        {/* Series header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: seriesColor }} />
                            <span className="text-xs font-semibold" style={{ color: seriesColor }}>
                              {seriesName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded ${
                              isMaxed ? 'bg-gold/20 text-gold font-bold' : 'bg-white/[0.06] text-ink-ghost'
                            }`}>
                              {milestonesPassed} / {maxMilestones}
                            </span>
                            {isMaxed && (
                              <Trophy size={12} className="text-gold" />
                            )}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${progress}%`,
                              background: isMaxed ? '#F4C874' : seriesColor,
                            }}
                          />
                        </div>

                        {/* Individual eternals */}
                        {stonesOwned > 0 && (
                          <div className="space-y-2">
                            {Array.from({ length: stonesOwned }).map((_, i) => {
                              const stoneStart = i * 5;
                              const milestone = Math.min(Math.max(milestonesPassed - stoneStart, 0), 5);
                              const eternalDef = seriesEternals[i];
                              const name = eternalDef?.name ?? `Eternal ${i + 1}`;
                              const isRetired = eternalDef?.isRetired ?? false;
                              const milestone5Threshold = eternalDef?.milestones?.[4] ?? 0;

                              return (
                                <div key={i} className={`group relative ${isRetired ? 'opacity-50' : ''}`}>
                                  <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      <div className="flex gap-0.5">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                          <div
                                            key={j}
                                            className="w-1 h-3 rounded-sm"
                                            style={{
                                              background: j < milestone
                                                ? (milestone >= 5 ? '#F4C874' : seriesColor)
                                                : 'rgba(255,255,255,0.06)'
                                            }}
                                          />
                                        ))}
                                      </div>
                                      <span className={`truncate ${milestone >= 5 ? 'text-gold font-medium' : 'text-ink-muted'}`}>
                                        {name}
                                      </span>
                                      {isRetired && (
                                        <span className="text-[8px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 flex-shrink-0">
                                          Retired
                                        </span>
                                      )}
                                    </div>
                                    <span className={`text-[9px] tabular-nums flex-shrink-0 ml-2 ${milestone >= 5 ? 'text-gold' : 'text-ink-ghost'}`}>
                                      {milestone >= 5 && milestone5Threshold > 0
                                        ? milestone5Threshold.toLocaleString()
                                        : `${milestone}/5`
                                      }
                                    </span>
                                  </div>
                                  
                                  {/* Eternal description tooltip */}
                                  {eternalDef?.description && (
                                    <div className="hidden group-hover:block absolute left-0 top-full mt-1 z-50 p-2 rounded bg-raised border border-white/[0.1] shadow-xl min-w-[200px] max-w-[280px]">
                                      <p className="text-[9px] text-ink leading-snug">{eternalDef.description}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
