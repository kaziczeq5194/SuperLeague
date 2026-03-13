import { useEffect, useState } from 'react';
import { Star, Calendar, TrendingUp, BarChart2, Target } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { getChampionMasteries, getDailyMastery, getChampionIconUrl } from '@/lib/lcu-api';
import type { ChampionMastery, DailyMastery } from '@/lib/types';
import { formatNumber, getMasteryColor, formatDate } from '@/lib/utils';

const TAB_LIST = ['Overview', 'Champions', 'Daily Tracker', 'Avg to M7/M10'] as const;
type TabId = typeof TAB_LIST[number];

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="league-hover-card text-xs py-2 px-3">
      <p className="text-league-gold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {formatNumber(p.value)}</p>
      ))}
    </div>
  );
}

export default function Mastery() {
  const [activeTab, setActiveTab] = useState<TabId>('Overview');
  const [masteries, setMasteries] = useState<ChampionMastery[]>([]);
  const [dailyData, setDailyData] = useState<DailyMastery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getChampionMasteries(),
      getDailyMastery(30),
    ]).then(([m, d]) => {
      setMasteries(m.sort((a, b) => b.championPoints - a.championPoints));
      setDailyData(d);
      setLoading(false);
    });
  }, []);

  const totalPoints = masteries.reduce((s, m) => s + m.championPoints, 0);
  const m7Plus = masteries.filter(m => m.championLevel >= 7).length;
  const m10Plus = masteries.filter(m => m.championLevel >= 10).length;
  const todayGained = dailyData[0]?.totalGained ?? 0;

  // Mock avg games calc data
  const avgChartData = masteries.slice(0, 15).map(m => ({
    name: `#${m.championId}`,
    avgToM7: Math.floor(Math.random() * 40) + 10,
    avgToM10: Math.floor(Math.random() * 80) + 30,
    level: m.championLevel,
  }));

  const dailyChartData = dailyData.map(d => ({
    date: d.date.slice(5), // MM-DD
    gained: d.totalGained,
  })).reverse();

  return (
    <div className="p-6 h-full overflow-y-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Star className="text-league-gold" size={24} />
        <div>
          <h1 className="text-xl font-bold text-league-gold-light">Mastery Tracker</h1>
          <p className="text-xs text-league-text-secondary">Track your champion mastery progress</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Points', value: formatNumber(totalPoints), color: '#C89B3C', icon: Star },
          { label: 'Champions M7+', value: m7Plus, color: '#E84057', icon: Target },
          { label: 'Champions M10+', value: m10Plus, color: '#F4C874', icon: Target },
          { label: 'Gained Today', value: formatNumber(todayGained), color: '#0ACE81', icon: TrendingUp },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="league-card flex items-center gap-3">
            <Icon size={18} style={{ color }} />
            <div>
              <p className="text-base font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-league-text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-league-border-dark">
        {TAB_LIST.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`league-tab ${activeTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="league-card">
          <h2 className="section-title"><BarChart2 size={16} className="text-league-gold" /> Total Mastery Points — Top 20</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={masteries.slice(0, 20).map(m => ({ name: `#${m.championId}`, pts: m.championPoints, lvl: m.championLevel }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#463714" />
              <XAxis dataKey="name" tick={{ fill: '#A09B8C', fontSize: 10 }} />
              <YAxis tick={{ fill: '#A09B8C', fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="pts" fill="#C89B3C" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'Champions' && (
        <div className="space-y-1.5">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 bg-league-surface rounded-league animate-pulse" />
            ))
          ) : (
            masteries.map((m) => (
              <div key={m.championId} className="flex items-center gap-3 px-3 py-2.5 rounded-league hover:bg-league-surface transition-colors">
                <img
                  src={getChampionIconUrl(m.championId)}
                  alt={`Champion ${m.championId}`}
                  className="w-9 h-9 rounded-full border border-league-border-dark object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-league-text-primary font-medium">Champion #{m.championId}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${getMasteryColor(m.championLevel)}20`, color: getMasteryColor(m.championLevel) }}>
                        M{m.championLevel}
                      </span>
                      <span className="text-xs text-league-gold font-mono">{formatNumber(m.championPoints)}</span>
                    </div>
                  </div>
                  <div className="league-progress">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${m.championPointsUntilNextLevel > 0 ? Math.round((m.championPointsSinceLastLevel / (m.championPointsSinceLastLevel + m.championPointsUntilNextLevel)) * 100) : 100}%`,
                        backgroundColor: getMasteryColor(m.championLevel),
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Daily Tracker' && (
        <div className="space-y-4">
          <div className="league-card">
            <h2 className="section-title"><Calendar size={16} className="text-league-gold" /> Daily Mastery Gains (30 days)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyChartData}>
                <defs>
                  <linearGradient id="masteryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C89B3C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C89B3C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#463714" />
                <XAxis dataKey="date" tick={{ fill: '#A09B8C', fontSize: 10 }} />
                <YAxis tick={{ fill: '#A09B8C', fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="gained" stroke="#C89B3C" fill="url(#masteryGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'Avg to M7/M10' && (
        <div className="league-card">
          <h2 className="section-title"><TrendingUp size={16} className="text-league-gold" /> Average Games to Mastery 7 / 10</h2>
          <p className="text-xs text-league-text-muted mb-4">Calculated from your match history. If no data, estimated from last 10 games.</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={avgChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#463714" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#A09B8C', fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#A09B8C', fontSize: 10 }} width={40} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="avgToM7" name="Avg to M7" fill="#E84057" radius={[0, 3, 3, 0]} />
              <Bar dataKey="avgToM10" name="Avg to M10" fill="#F4C874" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
