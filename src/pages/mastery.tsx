import { useEffect, useState } from 'react';
import { Star, Target, TrendingUp, BarChart2, Calendar } from 'lucide-react';
import { getChampionMasteries, getDailyMastery, getChampionIconUrl } from '@/lib/lcu-api';
import type { ChampionMastery, DailyMastery } from '@/lib/types';

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const MASTERY_COLOR: Record<number, string> = {
  1: '#5B5A56', 2: '#5B5A56', 3: '#5B5A56', 4: '#5B5A56',
  5: '#E84057', 6: '#9D48E0', 7: '#C89B3C', 8: '#C89B3C',
  9: '#C89B3C', 10: '#F4C874',
};

const TAB_LIST = ['Overview', 'Champions'] as const;
type TabId = typeof TAB_LIST[number];

export default function Mastery() {
  const [activeTab, setActiveTab] = useState<TabId>('Overview');
  const [masteries, setMasteries] = useState<ChampionMastery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChampionMasteries().then((m) => {
      if (Array.isArray(m)) setMasteries(m.sort((a, b) => b.championPoints - a.championPoints));
      setLoading(false);
    });
  }, []);

  const totalPoints = masteries.reduce((s, m) => s + m.championPoints, 0);
  const m7Plus = masteries.filter(m => m.championLevel >= 7).length;

  return (
    <div className="p-6 space-y-5 animate-slide-up">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Points', value: formatNum(totalPoints), color: '#C89B3C', icon: Star },
          { label: 'Champions M7+', value: String(m7Plus), color: '#E84057', icon: Target },
          { label: 'Champions Played', value: String(masteries.length), color: '#0BC4E3', icon: TrendingUp },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
              <Icon size={17} style={{ color }} />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums" style={{ color }}>{value}</p>
              <p className="text-xs text-ink-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TAB_LIST.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab ${activeTab === tab ? 'active' : ''}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Champion list */}
      {loading ? (
        <div className="space-y-2">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-lg" />
          ))}
        </div>
      ) : masteries.length === 0 ? (
        <div className="card p-12 text-center text-ink-ghost">
          <Star size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm text-ink-dim">No mastery data</p>
          <p className="text-xs mt-1">Connect to League client</p>
        </div>
      ) : (
        <div className="space-y-1">
          {masteries.map((m) => {
            const color = MASTERY_COLOR[m.championLevel] ?? '#5B5A56';
            const pct = m.championPointsUntilNextLevel > 0
              ? Math.round((m.championPointsSinceLastLevel / (m.championPointsSinceLastLevel + m.championPointsUntilNextLevel)) * 100)
              : 100;
            return (
              <div key={m.championId} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                <img
                  src={getChampionIconUrl(m.championId)}
                  alt=""
                  className="w-9 h-9 rounded-lg border border-white/[0.06] object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ink-bright font-medium">Champion #{m.championId}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: `${color}20`, color }}>M{m.championLevel}</span>
                      <span className="text-xs text-gold tabular-nums">{formatNum(m.championPoints)}</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
