import { useEffect, useState, useMemo } from 'react';
import { Trophy, ChevronDown, Filter } from 'lucide-react';
import { getChallenges } from '@/lib/lcu-api';

const TIER_C: Record<string, string> = {
  NONE: '#5B5A56', IRON: '#6B6B6B', BRONZE: '#CD7F32', SILVER: '#C0C8D4',
  GOLD: '#C89B3C', PLATINUM: '#4E9996', DIAMOND: '#576BCE', MASTER: '#9D48E0',
  GRANDMASTER: '#E84057', CHALLENGER: '#F4C874',
};

const TIER_ORDER: Record<string, number> = {
  NONE: 0, IRON: 1, BRONZE: 2, SILVER: 3, GOLD: 4, PLATINUM: 5,
  DIAMOND: 6, MASTER: 7, GRANDMASTER: 8, CHALLENGER: 9,
};

type SortMode = 'closest' | 'name' | 'rank' | 'lastUpgraded' | 'leaderboardPosition';

const CATEGORIES = [
  'EXPERTISE', 'TEAMWORK', 'IMAGINATION', 'VETERANCY', 'COLLECTION', 'LEGACY', 'RETIRED'
] as const;

const GAMEMODES = [
  { id: 'SUMMONERS_RIFT', label: 'Summoners Rift', queueIds: [420, 440, 400] },
  { id: 'ARAM', label: 'ARAM', queueIds: [450, 100] },
  { id: 'COOP', label: 'Coop vs. AI', queueIds: [830, 840, 850] },
  { id: 'ARENA', label: 'Arena', queueIds: [1700, 1710] }
] as const;

export default function Challenges() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideCapstones, setHideCapstones] = useState(false);
  const [hideMaxed, setHideMaxed] = useState(false);
  const [sort, setSort] = useState<SortMode>('closest');
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedGamemodes, setSelectedGamemodes] = useState<Set<string>>(new Set());
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showGamemodeDropdown, setShowGamemodeDropdown] = useState(false);

  useEffect(() => {
    getChallenges().then((data) => {
      if (Array.isArray(data) && data.length > 0) setChallenges(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handleClick = () => {
      setShowCategoryDropdown(false);
      setShowGamemodeDropdown(false);
    };
    if (showCategoryDropdown || showGamemodeDropdown) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showCategoryDropdown, showGamemodeDropdown]);

  const filtered = useMemo(() => {
    let list = [...challenges];

    const isCapstoneChallenge = (c: any): boolean => {
      const category = String(c.category ?? c.challengeCategory ?? '').toUpperCase();
      const name = String(c.name ?? '').toUpperCase();
      const tags = Array.isArray(c.tags) ? c.tags.map((t: any) => String(t).toUpperCase()) : [];
      const parentName = String(c.parentName ?? c.parentChallengeName ?? '').toUpperCase();

      if (c.isCapstone === true || c.capstone === true) return true;
      if (category.includes('CAPSTONE')) return true;
      if (name.includes('CAPSTONE')) return true;
      if (parentName.includes('CAPSTONE')) return true;
      if (tags.some((t: string) => t.includes('CAPSTONE'))) return true;
      return false;
    };

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => {
        const name = (c.name ?? c.description ?? '').toLowerCase();
        const desc = (c.shortDescription ?? c.description ?? '').toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    // Category filter
    if (selectedCategories.size > 0) {
      list = list.filter(c => {
        const category = (c.category ?? c.challengeCategory ?? '').toUpperCase();
        return selectedCategories.has(category);
      });
    }

    // Gamemode filter
    if (selectedGamemodes.size > 0) {
      list = list.filter(c => {
        // Check various possible fields for gamemode information
        const tags = c.tags ?? [];
        const queueIds = c.queueIds ?? [];
        const gameModes = c.gameModes ?? [];
        const source = (c.source ?? '').toUpperCase();

        return Array.from(selectedGamemodes).some(mode => {
          const gamemode = GAMEMODES.find(g => g.id === mode);
          if (!gamemode) return false;

          // Check queueIds
          if (queueIds.length > 0 && gamemode.queueIds.some((qid: number) => queueIds.includes(qid))) {
            return true;
          }

          // Check tags
          if (tags.some((tag: string) => {
            const tagUpper = String(tag).toUpperCase();
            return tagUpper.includes(mode) || tagUpper.includes(gamemode.label.toUpperCase().replace(/\s/g, '_'));
          })) {
            return true;
          }

          // Check gameModes array
          if (gameModes.some((gm: string) => {
            const gmUpper = String(gm).toUpperCase();
            return gmUpper.includes(mode) || gmUpper.includes(gamemode.label.toUpperCase().replace(/\s/g, '_'));
          })) {
            return true;
          }

          // Check source field
          if (source && (source.includes(mode) || source.includes(gamemode.label.toUpperCase().replace(/\s/g, '_')))) {
            return true;
          }

          return false;
        });
      });
    }

    // Capstone filter
    if (hideCapstones) {
      list = list.filter(c => !isCapstoneChallenge(c));
    }

    // Maxed filter
    if (hideMaxed) {
      list = list.filter(c => {
        const tier = c.currentLevel ?? c.level ?? 'NONE';
        const current = c.currentValue ?? 0;
        const next = c.nextLevelValue ?? c.nextThreshold ?? 0;
        const isMasterPlus = (TIER_ORDER[tier] ?? 0) >= 7;
        const isMaxed = next <= 0 || current >= next;
        return !(isMasterPlus || isMaxed);
      });
    }

    // Sort
    if (sort === 'closest') {
      list = list
        .map(c => ({
          ...c,
          _pct: (() => {
            const cur = c.currentValue ?? 0;
            const nxt = c.nextLevelValue ?? c.nextThreshold ?? 1;
            const prev = c.previousLevelValue ?? 0;
            return nxt > prev ? ((cur - prev) / (nxt - prev)) * 100 : 100;
          })(),
        }))
        .sort((a, b) => b._pct - a._pct);
    } else if (sort === 'rank') {
      list.sort((a, b) => (TIER_ORDER[b.currentLevel ?? 'NONE'] ?? 0) - (TIER_ORDER[a.currentLevel ?? 'NONE'] ?? 0));
    } else if (sort === 'lastUpgraded') {
      list.sort((a, b) => (b.achievedTime ?? 0) - (a.achievedTime ?? 0));
    } else if (sort === 'leaderboardPosition') {
      list.sort((a, b) => {
        const posA = a.position ?? a.percentile ?? Infinity;
        const posB = b.position ?? b.percentile ?? Infinity;
        return posA - posB;
      });
    } else {
      list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }

    return list;
  }, [challenges, sort, search, selectedCategories, selectedGamemodes, hideCapstones, hideMaxed]);

  const stats = useMemo(() => {
    const total = challenges.length;
    const byTier: Record<string, number> = {};
    challenges.forEach(c => {
      const t = c.currentLevel ?? c.level ?? 'NONE';
      byTier[t] = (byTier[t] ?? 0) + 1;
    });
    return { total, byTier };
  }, [challenges]);

  return (
    <div className="p-6 space-y-5 animate-slide-up">
      {/* Stats overview */}
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(TIER_C).map(([tier, color]) => {
          const count = stats.byTier[tier] ?? 0;
          if (count === 0 && tier === 'NONE') return null;
          return (
            <div key={tier} className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px]"
              style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span style={{ color }}>{tier.charAt(0) + tier.slice(1).toLowerCase()}</span>
              <span className="text-ink-ghost">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text" placeholder="Search titles and descriptions…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-search text-xs min-w-[220px] max-w-xs"
          />

          <button
            onClick={() => setHideCapstones(!hideCapstones)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              hideCapstones ? 'bg-gold text-void' : 'bg-raised text-ink-muted border border-white/[0.06] hover:text-ink'
            }`}
          >
            <Filter size={11} /> Hide capstones
          </button>

          <button
            onClick={() => setHideMaxed(!hideMaxed)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              hideMaxed ? 'bg-gold text-void' : 'bg-raised text-ink-muted border border-white/[0.06] hover:text-ink'
            }`}
          >
            <Filter size={11} /> Hide Master+/maxed
          </button>

          {/* Category Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowGamemodeDropdown(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                selectedCategories.size > 0 ? 'bg-gold/15 text-gold' : 'bg-raised text-ink-muted border border-white/[0.06] hover:text-ink'
              }`}
            >
              Category {selectedCategories.size > 0 && `(${selectedCategories.size})`}
              <ChevronDown size={12} />
            </button>
            {showCategoryDropdown && (
              <div className="absolute top-full mt-1 bg-raised border border-white/[0.08] rounded-lg shadow-xl z-50 min-w-[160px] py-1" onClick={(e) => e.stopPropagation()}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      const newSet = new Set(selectedCategories);
                      if (newSet.has(cat)) newSet.delete(cat);
                      else newSet.add(cat);
                      setSelectedCategories(newSet);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      selectedCategories.has(cat) ? 'text-gold bg-gold/10' : 'text-ink-muted hover:text-ink hover:bg-white/[0.02]'
                    }`}
                  >
                    {cat === 'RETIRED' ? 'Retired Seasonal' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </button>
                ))}
                {selectedCategories.size > 0 && (
                  <>
                    <div className="border-t border-white/[0.06] my-1" />
                    <button
                      onClick={() => setSelectedCategories(new Set())}
                      className="w-full text-left px-3 py-1.5 text-xs text-ink-ghost hover:text-ink transition-colors"
                    >
                      Clear all
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Gamemode Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowGamemodeDropdown(!showGamemodeDropdown);
                setShowCategoryDropdown(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                selectedGamemodes.size > 0 ? 'bg-gold/15 text-gold' : 'bg-raised text-ink-muted border border-white/[0.06] hover:text-ink'
              }`}
            >
              Gamemode {selectedGamemodes.size > 0 && `(${selectedGamemodes.size})`}
              <ChevronDown size={12} />
            </button>
            {showGamemodeDropdown && (
              <div className="absolute top-full mt-1 bg-raised border border-white/[0.08] rounded-lg shadow-xl z-50 min-w-[160px] py-1" onClick={(e) => e.stopPropagation()}>
                {GAMEMODES.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      const newSet = new Set(selectedGamemodes);
                      if (newSet.has(mode.id)) newSet.delete(mode.id);
                      else newSet.add(mode.id);
                      setSelectedGamemodes(newSet);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      selectedGamemodes.has(mode.id) ? 'text-gold bg-gold/10' : 'text-ink-muted hover:text-ink hover:bg-white/[0.02]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
                {selectedGamemodes.size > 0 && (
                  <>
                    <div className="border-t border-white/[0.06] my-1" />
                    <button
                      onClick={() => setSelectedGamemodes(new Set())}
                      className="w-full text-left px-3 py-1.5 text-xs text-ink-ghost hover:text-ink transition-colors"
                    >
                      Clear all
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-ink-ghost">Order by:</span>
          <div className="flex gap-1">
            {([
              ['closest', 'Closest Levelup'],
              ['rank', 'Rank'],
              ['lastUpgraded', 'Last Upgraded'],
              ['leaderboardPosition', 'Leaderboard'],
              ['name', 'A-Z']
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setSort(id as SortMode)}
                className={`px-2.5 py-1.5 rounded text-[10px] font-medium transition-all ${
                  sort === id ? 'bg-gold/15 text-gold' : 'text-ink-ghost hover:text-ink'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[10px] text-ink-ghost">
        Showing {filtered.length} / {challenges.length} challenges
      </div>

      {/* Challenge list */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {Array(20).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-ink-ghost">
          <Trophy size={40} className="mb-3 opacity-20" />
          <p className="text-sm text-ink-dim">
            {challenges.length === 0 ? 'No challenge data available' : 'No challenges match filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {filtered.map((c, i) => {
            const tier = c.currentLevel ?? c.level ?? 'NONE';
            const color = TIER_C[tier] ?? TIER_C.NONE;
            const current = c.currentValue ?? 0;
            const next = c.nextLevelValue ?? c.nextThreshold ?? 0;
            const prev = c.previousLevelValue ?? 0;
            const isMasterPlus = (TIER_ORDER[tier] ?? 0) >= 7;
            const pct = next > prev ? Math.min(Math.round(((current - prev) / (next - prev)) * 100), 100) : 100;
            const tokenSrc = `https://raw.communitydragon.org/latest/game/assets/challenges/config/${c.id}/tokens/${String(tier).toLowerCase()}.png`;
            const challengeName = c.name ?? c.description ?? `Challenge #${c.id}`;
            const challengeDescription = c.shortDescription ?? c.description ?? '';
            const showDescription = Boolean(challengeDescription && challengeDescription !== challengeName);

            return (
              <div key={c.id ?? i}
                className="rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors p-2 flex flex-col gap-2">
                <div className="flex items-start gap-1.5">
                  <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <img
                      src={tokenSrc}
                      alt=""
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="text-[10px] font-medium text-ink-bright leading-tight line-clamp-1 min-w-0">
                        {challengeName}
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: `${color}15`, color }}>
                        {tier.charAt(0) + tier.slice(1).toLowerCase()}
                      </span>
                    </div>
                    {showDescription && (
                      <div className="text-[9px] text-ink-dim leading-snug line-clamp-2 mt-0.5 h-[26px]">
                        {challengeDescription}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-[9px] text-ink-ghost tabular-nums flex-shrink-0 text-right min-w-[70px]">
                    {isMasterPlus && next === 0
                      ? `${current.toLocaleString()}`
                      : `${current.toLocaleString()} / ${next.toLocaleString()}`
                    }
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
