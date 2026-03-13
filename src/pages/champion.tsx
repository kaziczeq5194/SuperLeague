import { useState } from 'react';
import { Swords, TrendingUp, Trophy, Star, ChevronDown } from 'lucide-react';
import { getChampionIconUrl } from '@/lib/lcu-api';
import { getMasteryColor, formatNumber } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

const SUB_TABS = ['Mastery', 'Challenges', 'Match History'] as const;
type SubTab = typeof SUB_TABS[number];

// Mock champion list for selector
const QUICK_CHAMPS = [
  { id: 1, name: 'Annie' }, { id: 2, name: 'Olaf' }, { id: 4, name: 'TF' },
  { id: 11, name: 'Yi' }, { id: 12, name: 'Alistar' }, { id: 22, name: 'Ashe' },
  { id: 23, name: 'Tryndamere' }, { id: 24, name: 'Jax' }, { id: 31, name: 'Cho' },
  { id: 32, name: 'Amumu' }, { id: 44, name: 'Taric' }, { id: 51, name: 'Caitlyn' },
];

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

export default function ChampionBreakdown() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [subTab, setSubTab] = useState<SubTab>('Mastery');
  const [showPicker, setShowPicker] = useState(false);

  const selected = QUICK_CHAMPS.find(c => c.id === selectedId);

  // Mock data
  const masteryHistory = Array.from({ length: 20 }, (_, i) => ({
    game: `G${i + 1}`,
    points: 45000 + i * 2300 + Math.floor(Math.random() * 500),
  }));

  const challengeData = [
    { name: 'Kill Spree', value: 12, max: 50, tier: 'SILVER' },
    { name: 'Pentakill', value: 2, max: 10, tier: 'BRONZE' },
    { name: 'Carry Games', value: 34, max: 100, tier: 'SILVER' },
  ];

  const matchData = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    result: Math.random() > 0.4 ? 'Win' : 'Loss',
    kda: `${Math.floor(Math.random() * 12)}/${Math.floor(Math.random() * 7)}/${Math.floor(Math.random() * 18)}`,
    gained: Math.floor(Math.random() * 800) + 200,
    date: `Mar ${12 - i}`,
  }));

  return (
    <div className="p-6 h-full overflow-y-auto space-y-4 animate-fade-in">
      {/* Header + Champion Picker */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Swords className="text-league-gold" size={24} />
          <div>
            <h1 className="text-xl font-bold text-league-gold-light">Champion Breakdown</h1>
            <p className="text-xs text-league-text-secondary">Deep-dive into a single champion</p>
          </div>
        </div>

        {/* Champion selector */}
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {selected ? (
              <>
                <img src={getChampionIconUrl(selected.id)} alt={selected.name} className="w-5 h-5 rounded-full" />
                {selected.name}
              </>
            ) : 'Select Champion'}
            <ChevronDown size={14} />
          </button>

          {showPicker && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-league-surface border border-league-border-dark rounded-league p-2 z-40 animate-fade-in">
              <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                {QUICK_CHAMPS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedId(c.id); setShowPicker(false); }}
                    className="flex flex-col items-center gap-1 p-1.5 rounded hover:bg-league-surface-hover transition-colors"
                  >
                    <img src={getChampionIconUrl(c.id)} alt={c.name} className="w-9 h-9 rounded-full border border-league-border-dark" />
                    <span className="text-[9px] text-league-text-muted truncate w-full text-center">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!selectedId ? (
        <div className="flex flex-col items-center justify-center py-24 text-league-text-muted">
          <Swords size={56} className="mb-4 opacity-20" />
          <p className="text-lg font-semibold text-league-text-secondary">Select a champion</p>
          <p className="text-sm mt-1">Choose a champion above to view their detailed breakdown</p>
        </div>
      ) : (
        <>
          {/* Champion Header */}
          <div className="league-card-gold flex items-center gap-4">
            <div className="relative">
              <img
                src={getChampionIconUrl(selectedId)}
                alt={selected?.name}
                className="w-16 h-16 rounded-full border-2 border-league-gold/50 object-cover"
              />
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-league-bg-dark flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: getMasteryColor(7), color: '#000' }}
              >
                7
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-league-gold-light">{selected?.name}</h2>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[
                  { label: 'Points', value: '67,450' },
                  { label: 'Level', value: '7' },
                  { label: 'Games', value: '142' },
                  { label: 'WR', value: '56%' },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-sm font-bold text-league-gold">{value}</p>
                    <p className="text-[10px] text-league-text-muted">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sub Tabs */}
          <div className="flex gap-1 border-b border-league-border-dark">
            {SUB_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setSubTab(tab)}
                className={`league-tab ${subTab === tab ? 'active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {subTab === 'Mastery' && (
            <div className="league-card">
              <h2 className="section-title"><TrendingUp size={16} className="text-league-gold" /> Mastery Points Over Time</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={masteryHistory}>
                  <defs>
                    <linearGradient id="champGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C89B3C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C89B3C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#463714" />
                  <XAxis dataKey="game" tick={{ fill: '#A09B8C', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#A09B8C', fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="points" name="Mastery Points" stroke="#C89B3C" fill="url(#champGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {subTab === 'Challenges' && (
            <div className="space-y-3">
              {challengeData.map((c) => (
                <div key={c.name} className="league-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy size={14} className="text-league-gold" />
                      <span className="text-sm font-semibold text-league-text-primary">{c.name}</span>
                    </div>
                    <span className="text-xs text-league-text-muted">{c.value} / {c.max}</span>
                  </div>
                  <div className="league-progress">
                    <div className="league-progress-bar" style={{ width: `${(c.value / c.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {subTab === 'Match History' && (
            <div className="space-y-2">
              {matchData.map((m) => (
                <div key={m.id} className="league-card flex items-center gap-3">
                  <div className={`w-2 h-10 rounded-full flex-shrink-0 ${m.result === 'Win' ? 'bg-league-success' : 'bg-league-danger'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${m.result === 'Win' ? 'text-league-success' : 'text-league-danger'}`}>{m.result}</span>
                      <span className="text-xs text-league-text-muted">{m.date}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-league-text-secondary">KDA: {m.kda}</span>
                      <span className="text-xs text-league-gold">+{m.gained} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
