import { useState } from 'react';
import { Wrench, ChevronDown, Shield, Zap, BookOpen } from 'lucide-react';
import { getChampionIconUrl, getItemIconUrl } from '@/lib/lcu-api';

const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
const BUILD_TABS = ['Runes', 'Items', 'Abilities', 'Counters'] as const;
type BuildTab = typeof BUILD_TABS[number];

const QUICK_CHAMPS = [
  { id: 1, name: 'Annie' }, { id: 22, name: 'Ashe' }, { id: 51, name: 'Caitlyn' },
  { id: 11, name: 'Master Yi' }, { id: 24, name: 'Jax' }, { id: 31, name: "Cho'Gath" },
  { id: 44, name: 'Taric' }, { id: 4, name: 'Twisted Fate' }, { id: 2, name: 'Olaf' },
];

// Mock build data
const MOCK_ITEMS = [3031, 3094, 3046, 3087, 3508, 3072, 3085, 3053, 3065, 3083, 3044];
const MOCK_RUNE_PATHS = [
  { name: 'Precision', color: '#C89B3C', keystones: ['Conqueror', 'Lethal Tempo', 'Fleet Footwork'] },
  { name: 'Sorcery', color: '#0AC8B9', keystones: ['Arcane Comet', 'Phase Rush', 'Summon Aery'] },
  { name: 'Domination', color: '#E84057', keystones: ['Electrocute', "Predator", "Dark Harvest"] },
  { name: 'Resolve', color: '#0ACE81', keystones: ['Grasp', 'Aftershock', 'Guardian'] },
  { name: 'Inspiration', color: '#576BCE', keystones: ['Glacial', 'First Strike', 'Unsealed Spellbook'] },
];

const ABILITY_ORDER = ['Q', 'W', 'E', 'Q', 'Q', 'R', 'Q', 'W', 'Q', 'W', 'R', 'W', 'W', 'E', 'E', 'R', 'E', 'E'];

export default function Builds() {
  const [selectedChamp, setSelectedChamp] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState('MID');
  const [buildTab, setBuildTab] = useState<BuildTab>('Items');
  const [showPicker, setShowPicker] = useState(false);

  const selected = QUICK_CHAMPS.find(c => c.id === selectedChamp);
  const primaryPath = MOCK_RUNE_PATHS[1];
  const secondaryPath = MOCK_RUNE_PATHS[0];

  return (
    <div className="p-6 h-full overflow-y-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Wrench className="text-league-gold" size={24} />
        <div>
          <h1 className="text-xl font-bold text-league-gold-light">Builds</h1>
          <p className="text-xs text-league-text-secondary">Recommended champion builds & runes</p>
        </div>
      </div>

      {/* Champion + Role Selector */}
      <div className="flex gap-3">
        {/* Champion picker */}
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="btn-secondary flex items-center gap-2 text-sm min-w-40"
          >
            {selected ? (
              <>
                <img src={getChampionIconUrl(selected.id)} alt={selected.name} className="w-5 h-5 rounded-full" />
                {selected.name}
              </>
            ) : (
              'Select Champion'
            )}
            <ChevronDown size={14} className="ml-auto" />
          </button>
          {showPicker && (
            <div className="absolute top-full mt-1 left-0 w-64 bg-league-surface border border-league-border-dark rounded-league p-2 z-40 animate-fade-in">
              <div className="grid grid-cols-4 gap-1.5">
                {QUICK_CHAMPS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedChamp(c.id); setShowPicker(false); }}
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

        {/* Role tabs */}
        <div className="flex gap-1">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                selectedRole === role
                  ? 'bg-league-gold text-league-bg-darkest'
                  : 'text-league-text-secondary hover:text-league-text-primary hover:bg-league-surface'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {!selectedChamp ? (
        <div className="flex flex-col items-center justify-center py-24 text-league-text-muted">
          <Wrench size={56} className="mb-4 opacity-20" />
          <p className="text-lg font-semibold text-league-text-secondary">Select a champion</p>
          <p className="text-sm mt-1">Choose a champion to see recommended builds</p>
        </div>
      ) : (
        <>
          {/* Champion Header */}
          <div className="league-card flex items-center gap-4">
            <img
              src={getChampionIconUrl(selectedChamp)}
              alt={selected?.name}
              className="w-14 h-14 rounded-full border-2 border-league-gold/50 object-cover"
            />
            <div>
              <h2 className="text-lg font-bold text-league-gold-light">{selected?.name} — {selectedRole}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-league-text-muted">
                <span className="text-league-success font-semibold">54.2% WR</span>
                <span>·</span>
                <span>8.3% PR</span>
                <span>·</span>
                <span className="text-league-blue">Top 3 Build</span>
              </div>
            </div>
            <div className="ml-auto text-xs text-league-text-muted">Source: Patch 14.4</div>
          </div>

          {/* Build Tabs (like u.gg) */}
          <div className="flex gap-1 border-b border-league-border-dark">
            {BUILD_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setBuildTab(tab)}
                className={`league-tab flex items-center gap-1.5 ${buildTab === tab ? 'active' : ''}`}
              >
                {tab === 'Runes' && <Shield size={13} />}
                {tab === 'Items' && <Wrench size={13} />}
                {tab === 'Abilities' && <Zap size={13} />}
                {tab === 'Counters' && <BookOpen size={13} />}
                {tab}
              </button>
            ))}
          </div>

          {buildTab === 'Items' && (
            <div className="space-y-4">
              {/* Starting Items */}
              <div className="league-card">
                <h3 className="text-sm font-semibold text-league-gold mb-3">Starting Items</h3>
                <div className="flex gap-2">
                  {MOCK_ITEMS.slice(0, 3).map((id) => (
                    <div key={id} className="relative group">
                      <div className="w-12 h-12 rounded border border-league-border-dark bg-league-bg-darkest overflow-hidden">
                        <img
                          src={getItemIconUrl(id)}
                          alt={`Item ${id}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Items */}
              <div className="league-card">
                <h3 className="text-sm font-semibold text-league-gold mb-3">Core Items</h3>
                <div className="flex flex-wrap gap-2">
                  {MOCK_ITEMS.slice(3, 7).map((id, i) => (
                    <div key={id} className="flex flex-col items-center gap-1">
                      <div className="w-14 h-14 rounded border-2 border-league-gold/30 bg-league-bg-darkest overflow-hidden">
                        <img
                          src={getItemIconUrl(id)}
                          alt={`Item ${id}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <span className="text-[10px] text-league-text-muted">Slot {i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Situational */}
              <div className="league-card">
                <h3 className="text-sm font-semibold text-league-gold mb-3">Situational Items</h3>
                <div className="flex flex-wrap gap-2">
                  {MOCK_ITEMS.slice(7).map((id) => (
                    <div key={id} className="w-10 h-10 rounded border border-league-border-dark bg-league-bg-darkest overflow-hidden">
                      <img
                        src={getItemIconUrl(id)}
                        alt={`Item ${id}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {buildTab === 'Runes' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="league-card space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primaryPath.color }} />
                  <h3 className="text-sm font-semibold text-league-gold">{primaryPath.name} (Primary)</h3>
                </div>
                <div className="space-y-2">
                  {primaryPath.keystones.map((k, i) => (
                    <div key={k} className={`
                      px-3 py-2 rounded text-sm transition-colors
                      ${i === 0 ? 'bg-league-gold/10 border border-league-gold/20 text-league-gold font-semibold' : 'text-league-text-secondary'}
                    `}>
                      {i === 0 ? '⬡ ' : '○ '}{k}
                    </div>
                  ))}
                </div>
              </div>
              <div className="league-card space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: secondaryPath.color }} />
                  <h3 className="text-sm font-semibold text-league-gold">{secondaryPath.name} (Secondary)</h3>
                </div>
                <div className="space-y-2">
                  {secondaryPath.keystones.slice(0, 2).map((k) => (
                    <div key={k} className="px-3 py-2 rounded text-sm text-league-text-secondary">○ {k}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {buildTab === 'Abilities' && (
            <div className="league-card space-y-4">
              <h3 className="text-sm font-semibold text-league-gold">Ability Priority</h3>
              <div className="flex items-center gap-1 flex-wrap">
                {ABILITY_ORDER.map((ability, i) => (
                  <div key={i} className={`
                    w-9 h-9 rounded flex items-center justify-center text-sm font-bold
                    ${ability === 'R'
                      ? 'bg-league-danger/20 border border-league-danger/40 text-league-danger'
                      : 'bg-league-surface border border-league-border-dark text-league-text-primary'
                    }
                  `}>
                    {ability}
                  </div>
                ))}
              </div>
              <p className="text-xs text-league-text-muted">
                Max order: R → Q → E → W
              </p>
            </div>
          )}

          {buildTab === 'Counters' && (
            <div className="league-card">
              <p className="text-league-text-muted text-sm">Counter data requires Riot API integration. Coming soon.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
