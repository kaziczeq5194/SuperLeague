import { useEffect, useState } from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import { getEternals, getChampionIconUrl } from '@/lib/lcu-api';
import type { EternalSet } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

function EternalCard({ set }: { set: EternalSet }) {
  return (
    <div className="league-card space-y-3">
      <div className="flex items-center gap-2">
        <Flame size={16} className="text-league-danger" />
        <h3 className="text-sm font-semibold text-league-gold-light">{set.name}</h3>
        <span className="text-xs text-league-text-muted ml-auto">Series {set.seriesNumber}</span>
      </div>
      <div className="space-y-2">
        {set.statstones.map((stone) => {
          // Milestones: typically at 5 levels
          const pct = Math.min((stone.milestoneLevel / 5) * 100, 100);
          return (
            <div key={stone.statstoneId} className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-league-text-secondary">{stone.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-league-text-muted">{stone.formattedValue}</span>
                  <span className="text-xs font-bold" style={{
                    color: ['#C89B3C', '#E84057', '#9D48E0', '#F4C874', '#0AC8B9'][stone.milestoneLevel] ?? '#5B5A56'
                  }}>
                    Milestone {stone.milestoneLevel}
                  </span>
                </div>
              </div>
              <div className="league-progress">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, #C89B3C, #E84057)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mock data generator
function mockEternals(): EternalSet[] {
  const champions = [1, 22, 51, 11, 24];
  return champions.map((champId, i) => ({
    name: `Champion ${champId} — Series ${(i % 2) + 1}`,
    seriesNumber: (i % 2) + 1,
    statstones: [
      {
        name: 'Total Kills',
        contentId: `${champId}_kills`,
        championId: champId,
        milestoneLevel: Math.floor(Math.random() * 5),
        value: Math.floor(Math.random() * 5000),
        formattedValue: `${Math.floor(Math.random() * 5000).toLocaleString()}`,
        formattedMilestoneLevel: 'Milestone 2',
        statstoneId: `${champId}_1`,
      },
      {
        name: 'Multikills',
        contentId: `${champId}_multi`,
        championId: champId,
        milestoneLevel: Math.floor(Math.random() * 4),
        value: Math.floor(Math.random() * 200),
        formattedValue: `${Math.floor(Math.random() * 200)}`,
        formattedMilestoneLevel: 'Milestone 1',
        statstoneId: `${champId}_2`,
      },
      {
        name: 'Games Played',
        contentId: `${champId}_games`,
        championId: champId,
        milestoneLevel: Math.floor(Math.random() * 5),
        value: Math.floor(Math.random() * 200) + 20,
        formattedValue: `${Math.floor(Math.random() * 200) + 20}`,
        formattedMilestoneLevel: 'Milestone 3',
        statstoneId: `${champId}_3`,
      },
    ],
  }));
}

export default function Eternals() {
  const [eternals, setEternals] = useState<EternalSet[]>([]);
  const [filter, setFilter] = useState<1 | 2 | 0>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEternals().then((data) => {
      // Fallback to mock if LCU not connected
      setEternals(data.length ? data : mockEternals());
      setLoading(false);
    });
  }, []);

  const filtered = filter === 0 ? eternals : eternals.filter(e => e.seriesNumber === filter);

  return (
    <div className="p-6 h-full overflow-y-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flame className="text-league-danger" size={24} />
          <div>
            <h1 className="text-xl font-bold text-league-gold-light">Eternals</h1>
            <p className="text-xs text-league-text-secondary">Track your eternal milestones</p>
          </div>
        </div>
        <div className="flex gap-1">
          {(['All', 'Series 1', 'Series 2'] as const).map((label, i) => (
            <button
              key={label}
              onClick={() => setFilter(i as 0 | 1 | 2)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filter === i
                  ? 'bg-league-danger/20 text-league-danger border border-league-danger/30'
                  : 'text-league-text-secondary hover:text-league-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Champions Tracked', value: eternals.length },
          { label: 'Total Milestones', value: eternals.reduce((s, e) => s + e.statstones.reduce((ss, st) => ss + st.milestoneLevel, 0), 0) },
          { label: 'Series 1 / 2', value: `${eternals.filter(e => e.seriesNumber === 1).length} / ${eternals.filter(e => e.seriesNumber === 2).length}` },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card league-card">
            <p className="stat-value">{value}</p>
            <p className="stat-label">{label}</p>
          </div>
        ))}
      </div>

      {/* Eternal Cards Grid */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-league-surface rounded-league animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((set, i) => (
            <EternalCard key={i} set={set} />
          ))}
        </div>
      )}
    </div>
  );
}
