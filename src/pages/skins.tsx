import { useEffect, useState } from 'react';
import { Search, Lock, CheckCircle, Palette, Filter } from 'lucide-react';
import { getOwnedSkins, getSkinTileUrl, getChampionIconUrl } from '@/lib/lcu-api';

type OwnerFilter = 'ALL' | 'OWNED' | 'MISSING';

const RARITY_COLOR: Record<string, string> = {
  kNoRarity:   '#5B5A56',
  kRare:       '#4A9EFF',
  kEpic:       '#9D48E0',
  kLegendary:  '#C89B3C',
  kUltimate:   '#E84057',
  kMythic:     '#F4C874',
  DEFAULT:     '#5B5A56',
  RARE:        '#4A9EFF',
  EPIC:        '#9D48E0',
  LEGENDARY:   '#C89B3C',
  ULTIMATE:    '#E84057',
  MYTHIC:      '#F4C874',
};

function rarityLabel(r: string): string {
  return r.replace(/^k/, '').replace(/NoRarity/, 'Standard');
}

export default function Skins() {
  const [skins, setSkins] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OwnerFilter>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOwnedSkins().then((data) => {
      if (Array.isArray(data)) setSkins(data);
      setLoading(false);
    });
  }, []);

  const filtered = skins.filter((s) => {
    const name = (s.name ?? s.skinName ?? '').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const owned = s.ownership?.owned ?? s.isOwned ?? false;
    const matchFilter =
      filter === 'ALL' ||
      (filter === 'OWNED' && owned) ||
      (filter === 'MISSING' && !owned);
    return matchSearch && matchFilter;
  });

  const ownedCount = skins.filter(s => s.ownership?.owned ?? s.isOwned ?? false).length;
  const totalCount = skins.length;
  const pct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  return (
    <div className="p-6 space-y-5 animate-slide-up">
      {/* Collection progress */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-semibold text-ink-bright">Skin Collection</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              {loading ? 'Loading…' : `${ownedCount} of ${totalCount} skins owned`}
            </p>
          </div>
          <span className="text-lg font-bold text-gold tabular-nums">{pct}%</span>
        </div>
        <div className="progress-track h-2">
          <div
            className="progress-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-ghost" />
          <input
            type="text"
            placeholder="Search skins…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-search"
          />
        </div>
        <div className="flex gap-1.5">
          {(['ALL', 'OWNED', 'MISSING'] as OwnerFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-150 ${
                filter === f
                  ? 'bg-gold text-void'
                  : 'bg-raised text-ink-muted border border-white/[0.06] hover:text-ink'
              }`}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-ghost">
        Showing <span className="text-ink font-medium">{filtered.length}</span> skins
      </p>

      {/* Skins Grid — Crystal-style splash tiles */}
      {loading ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {Array(18).fill(0).map((_, i) => (
            <div key={i} className="skeleton rounded-lg" style={{ aspectRatio: '3/4' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-ink-ghost">
          <Palette size={40} className="mb-3 opacity-20" />
          <p className="text-sm text-ink-dim">
            {skins.length === 0 ? 'No skin data — connect to League client' : 'No skins match your filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {filtered.map((skin) => {
            const owned = skin.ownership?.owned ?? skin.isOwned ?? false;
            const champId = skin.championId ?? Math.floor((skin.skinId ?? skin.id ?? 0) / 1000);
            const skinId = skin.skinId ?? skin.id ?? 0;
            const name = skin.name ?? skin.skinName ?? 'Unknown';
            const rarity = skin.rarity ?? skin.rarityGemPath ?? 'DEFAULT';
            const rarityColor = RARITY_COLOR[rarity] ?? '#5B5A56';

            return (
              <div
                key={skinId}
                className={`group relative rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer ${
                  owned
                    ? 'border-white/[0.06] hover:border-gold/30 hover:shadow-gold-sm'
                    : 'border-white/[0.04] grayscale opacity-50 hover:opacity-70'
                }`}
                style={{ aspectRatio: '3/4' }}
              >
                {/* Splash image */}
                <img
                  src={getSkinTileUrl(champId, skinId)}
                  alt={name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to champion icon
                    (e.target as HTMLImageElement).src = getChampionIconUrl(champId);
                    (e.target as HTMLImageElement).className = 'w-full h-full object-contain p-4 opacity-40';
                  }}
                />

                {/* Bottom gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

                {/* Status icon */}
                <div className="absolute top-1.5 right-1.5">
                  {owned
                    ? <CheckCircle size={14} className="text-emerald drop-shadow" />
                    : <Lock size={12} className="text-ink-ghost drop-shadow" />
                  }
                </div>

                {/* Rarity dot */}
                <div
                  className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full"
                  style={{ background: rarityColor, boxShadow: `0 0 4px ${rarityColor}80` }}
                />

                {/* Name */}
                <div className="absolute bottom-0 inset-x-0 p-2">
                  <p className="text-[10px] font-medium text-white truncate drop-shadow-sm">{name}</p>
                  <p className="text-[8px] uppercase tracking-wider mt-0.5" style={{ color: rarityColor }}>
                    {rarityLabel(rarity)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
