import { useEffect, useState } from 'react';
import { BarChart2, Star, Trophy, Swords, TrendingUp } from 'lucide-react';
import { getChampionMasteries } from '@/lib/lcu-api';
import type { ChampionMastery, MasteryClass } from '@/lib/types';
import { formatNumber, getMasteryColor } from '@/lib/utils';

const CLASS_META: Record<MasteryClass, { color: string; emoji: string; roles: string[] }> = {
  Marksman:   { color: '#C89B3C', emoji: '🏹', roles: ['marksman'] },
  Mage:       { color: '#0AC8B9', emoji: '🔮', roles: ['mage'] },
  Assassin:   { color: '#E84057', emoji: '🗡️', roles: ['assassin'] },
  Fighter:    { color: '#F0B232', emoji: '⚔️', roles: ['fighter'] },
  Tank:       { color: '#576BCE', emoji: '🛡️', roles: ['tank'] },
  Support:    { color: '#0ACE81', emoji: '💚', roles: ['support'] },
  Specialist: { color: '#9D48E0', emoji: '✨', roles: ['specialist'] },
};

const MASTERY_CLASSES: MasteryClass[] = [
  'Marksman', 'Mage', 'Assassin', 'Fighter', 'Tank', 'Support', 'Specialist',
];

interface ClassProgress {
  name: MasteryClass;
  champions: number;
  totalPoints: number;
  avgLevel: number;
  maxPoints: number;
}

export default function Dashboard() {
  const [masteries, setMasteries] = useState<ChampionMastery[]>([]);
  const [classProgress, setClassProgress] = useState<ClassProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChampionMasteries().then((data) => {
      setMasteries(data);
      // Mock class assignment for now (will come from Data Dragon champion data)
      const progress: ClassProgress[] = MASTERY_CLASSES.map((cls, i) => ({
        name: cls,
        champions: Math.floor(Math.random() * 30) + 5,
        totalPoints: Math.floor(Math.random() * 500000) + 50000,
        avgLevel: Math.floor(Math.random() * 5) + 3,
        maxPoints: 800000,
      }));
      setClassProgress(progress);
      setLoading(false);
    });
  }, []);

  const totalPoints = masteries.reduce((s, m) => s + m.championPoints, 0);
  const maxLevel = masteries.reduce((m, c) => Math.max(m, c.championLevel), 0);
  const championed = masteries.filter(m => m.championLevel >= 7).length;

  const stats = [
    { label: 'Total Mastery Points', value: formatNumber(totalPoints), icon: Star, color: '#C89B3C' },
    { label: 'Champions Played', value: masteries.length, icon: Swords, color: '#0AC8B9' },
    { label: 'Mastery 7+', value: championed, icon: Trophy, color: '#E84057' },
    { label: 'Highest Level', value: maxLevel, icon: TrendingUp, color: '#0ACE81' },
  ];

  return (
    <div className="p-6 h-full overflow-y-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart2 className="text-league-gold" size={24} />
        <div>
          <h1 className="text-xl font-bold text-league-gold-light">Dashboard</h1>
          <p className="text-xs text-league-text-secondary">Your League companion overview</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="league-card flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-league flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-lg font-bold text-league-gold-light">{value}</p>
              <p className="text-xs text-league-text-muted leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mastery Class Progress Bars */}
      <div className="league-card">
        <h2 className="section-title">
          <Star size={18} className="text-league-gold" />
          Mastery Class Progress
        </h2>
        <div className="flex items-end justify-around gap-4 h-64 px-4 pb-4">
          {classProgress.map((cls) => {
            const meta = CLASS_META[cls.name];
            const pct = Math.min((cls.totalPoints / cls.maxPoints) * 100, 100);
            return (
              <div key={cls.name} className="flex flex-col items-center gap-2 flex-1">
                {/* Vertical bar */}
                <div className="relative w-full max-w-[50px] h-48 bg-league-bg-darkest rounded-t-lg overflow-hidden border border-league-border-dark">
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-1000 ease-out"
                    style={{
                      height: `${pct}%`,
                      background: `linear-gradient(to top, ${meta.color}aa, ${meta.color})`,
                      boxShadow: `0 0 12px ${meta.color}40`,
                    }}
                  />
                  {/* % label inside */}
                  <p className="absolute bottom-2 w-full text-center text-[10px] font-bold text-white/80">
                    {Math.round(pct)}%
                  </p>
                </div>
                <span className="text-lg">{meta.emoji}</span>
                <p className="text-xs text-league-text-secondary text-center font-medium">{cls.name}</p>
                <p className="text-xs text-league-text-muted">{formatNumber(cls.totalPoints)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Mastery Highlights */}
      <div className="league-card">
        <h2 className="section-title">
          <TrendingUp size={18} className="text-league-gold" />
          Top Mastery Champions
        </h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-league-bg-dark rounded-league animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {masteries
              .sort((a, b) => b.championPoints - a.championPoints)
              .slice(0, 8)
              .map((m) => (
                <div key={m.championId} className="flex items-center gap-3 py-2 px-3 rounded-league hover:bg-league-surface-hover transition-colors">
                  <div
                    className="w-2 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getMasteryColor(m.championLevel) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-league-text-primary font-medium">Champion #{m.championId}</span>
                      <span className="text-xs text-league-text-muted">M{m.championLevel}</span>
                    </div>
                    <div className="league-progress">
                      <div
                        className="league-progress-bar"
                        style={{
                          width: `${Math.min((m.championPointsSinceLastLevel / (m.championPointsSinceLastLevel + m.championPointsUntilNextLevel)) * 100, 100)}%`,
                          background: getMasteryColor(m.championLevel),
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-league-gold font-mono">{formatNumber(m.championPoints)}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
