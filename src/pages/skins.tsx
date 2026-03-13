import { useEffect, useState } from 'react';
import { Palette, Search, Lock, CheckCircle } from 'lucide-react';
import { getOwnedSkins, getChampionIconUrl } from '@/lib/lcu-api';
import type { SkinInfo } from '@/lib/types';

type RarityFilter = 'ALL' | 'DEFAULT' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'ULTIMATE' | 'MYTHIC';
const RARITY_OPTIONS: RarityFilter[] = ['ALL', 'DEFAULT', 'RARE', 'EPIC', 'LEGENDARY', 'ULTIMATE', 'MYTHIC'];

const RARITY_COLORS: Record<string, string> = {
  DEFAULT: '#5B5A56',
  RARE: '#9AA4AF',
  EPIC: '#9D48E0',
  LEGENDARY: '#C89B3C',
  ULTIMATE: '#E84057',
  MYTHIC: '#F4C874',
};

// Mock skin data
function mockSkins(): SkinInfo[] {
  const champIds = [1, 22, 51, 11, 24, 2, 4, 12, 31, 44];
  const rarities = ['DEFAULT', 'RARE', 'EPIC', 'LEGENDARY', 'ULTIMATE'];
  const names = ['Base', 'Classic', 'Gothic', 'Hextech', 'Championship', 'Star Guardian'];
  return champIds.flatMap((id, ci) =>
    Array.from({ length: 3 }, (_, si) => ({
      championId: id,
      skinId: id * 1000 + si,
      skinName: `${names[si % names.length]} #${id}`,
      isOwned: Math.random() > 0.4,
      splashPath: '',
      tilePath: '',
      rarity: rarities[Math.floor(Math.random() * rarities.length)],
      isChroma: si === 2,
    }))
  );
}

export default function Skins() {
  const [skins, setSkins] = useState<SkinInfo[]>([]);
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState<RarityFilter>('ALL');
  const [showOwned, setShowOwned] = useState<'ALL' | 'OWNED' | 'MISSING'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOwnedSkins().then((data) => {
      setSkins(data.length ? data : mockSkins());
      setLoading(false);
    });
  }, []);

  const filtered = skins.filter((s) => {
    const matchSearch = s.skinName.toLowerCase().includes(search.toLowerCase());
    const matchRarity = rarity === 'ALL' || s.rarity === rarity;
    const matchOwned =
      showOwned === 'ALL' ||
      (showOwned === 'OWNED' && s.isOwned) ||
      (showOwned === 'MISSING' && !s.isOwned);
    return matchSearch && matchRarity && matchOwned;
  });

  const owned = skins.filter(s => s.isOwned).length;
  const total = skins.length;
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;

  return (
    <div className="p-6 h-full overflow-y-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Palette className="text-league-gold" size={24} />
        <div>
          <h1 className="text-xl font-bold text-league-gold-light">Skins Collection</h1>
          <p className="text-xs text-league-text-secondary">Track your skin progress</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="league-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-league-text-secondary">Collection Progress</span>
          <span className="text-sm font-bold text-league-gold">{owned} / {total} ({pct}%)</span>
        </div>
        <div className="league-progress h-3">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, #785A28, #C89B3C, #F0E6D2)`,
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-league-text-muted" size={14} />
          <input
            type="text"
            placeholder="Search skins…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="league-search"
          />
        </div>
        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value as RarityFilter)}
          className="league-input text-sm"
        >
          {RARITY_OPTIONS.map(r => <option key={r} value={r}>{r === 'ALL' ? 'All Rarities' : r}</option>)}
        </select>
        <select
          value={showOwned}
          onChange={(e) => setShowOwned(e.target.value as any)}
          className="league-input text-sm"
        >
          <option value="ALL">All Skins</option>
          <option value="OWNED">Owned</option>
          <option value="MISSING">Missing</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-league-text-muted">
        Showing <span className="text-league-gold font-medium">{filtered.length}</span> skins
      </p>

      {/* Skin Grid */}
      {loading ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="h-28 bg-league-surface rounded-league animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {filtered.map((skin) => {
            const rarityColor = RARITY_COLORS[skin.rarity] ?? '#5B5A56';
            return (
              <div
                key={skin.skinId}
                className={`relative rounded-league overflow-hidden border transition-all duration-200
                  ${skin.isOwned
                    ? 'border-league-border-dark hover:border-league-gold/40'
                    : 'border-league-border-dark opacity-50 grayscale'
                  }`}
              >
                {/* Skin image placeholder */}
                <div
                  className="h-20 flex items-center justify-center"
                  style={{ backgroundColor: `${rarityColor}15` }}
                >
                  <img
                    src={getChampionIconUrl(skin.championId)}
                    alt={skin.skinName}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>

                {/* Info */}
                <div className="p-1.5 bg-league-surface">
                  <p className="text-[10px] text-league-text-primary truncate font-medium">{skin.skinName}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px]" style={{ color: rarityColor }}>{skin.rarity}</span>
                    {skin.isOwned
                      ? <CheckCircle size={10} className="text-league-success" />
                      : <Lock size={10} className="text-league-text-muted" />
                    }
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
