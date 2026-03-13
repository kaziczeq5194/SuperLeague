import { useEffect, useState } from 'react';
import { Trophy, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { getChallenges } from '@/lib/lcu-api';
import type { Challenge, ChallengeTier } from '@/lib/types';
import { cn, getProgressPercentage, formatNumber, getTierColor } from '@/lib/utils';

type FilterTier = 'ALL' | ChallengeTier;

const TIERS: FilterTier[] = ['ALL', 'NONE', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];

function TierBadge({ tier }: { tier: ChallengeTier }) {
  const color = getTierColor(tier);
  return (
    <span
      className="league-badge text-[10px] font-bold"
      style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {tier}
    </span>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const [expanded, setExpanded] = useState(false);
  const pct = challenge.nextLevelValue
    ? getProgressPercentage(challenge.currentValue, challenge.nextLevelValue)
    : 100;

  const color = getTierColor(challenge.currentLevel);

  return (
    <div className={cn('league-card transition-all duration-200', expanded && 'border-league-gold/20')}>
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Tier indicator */}
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-league-text-primary truncate">{challenge.name}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <TierBadge tier={challenge.currentLevel} />
              {expanded ? <ChevronDown size={14} className="text-league-text-muted" /> : <ChevronRight size={14} className="text-league-text-muted" />}
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 league-progress">
              <div
                className="league-progress-bar"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span className="text-xs text-league-text-muted font-mono flex-shrink-0">
              {formatNumber(challenge.currentValue)}{challenge.nextLevelValue ? ` / ${formatNumber(challenge.nextLevelValue)}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-league-border-dark animate-fade-in">
          <p className="text-xs text-league-text-secondary mb-2">{challenge.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(challenge.thresholds).map(([tier, data]) => (
              <div
                key={tier}
                className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: `${getTierColor(tier as ChallengeTier)}15`, color: getTierColor(tier as ChallengeTier) }}
              >
                {tier}: {formatNumber(data.value)}
              </div>
            ))}
          </div>
          {challenge.percentile < 1 && (
            <p className="text-xs text-league-text-muted mt-2">
              Top {(challenge.percentile * 100).toFixed(1)}% of players
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<FilterTier>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChallenges().then((data) => {
      setChallenges(data);
      setLoading(false);
    });
  }, []);

  const filtered = challenges.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchTier = filterTier === 'ALL' || c.currentLevel === filterTier;
    return matchSearch && matchTier;
  });

  return (
    <div className="p-6 h-full overflow-y-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="text-league-gold" size={24} />
        <div>
          <h1 className="text-xl font-bold text-league-gold-light">Challenges</h1>
          <p className="text-xs text-league-text-secondary">
            {challenges.length} challenges tracked
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-league-text-muted" size={14} />
          <input
            type="text"
            placeholder="Search challenges…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="league-search"
          />
        </div>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value as FilterTier)}
          className="league-input text-sm px-3 py-2"
        >
          {TIERS.map((t) => (
            <option key={t} value={t}>{t === 'ALL' ? 'All Tiers' : t}</option>
          ))}
        </select>
      </div>

      {/* Count badge */}
      <p className="text-xs text-league-text-muted">
        Showing <span className="text-league-gold font-medium">{filtered.length}</span> challenges
      </p>

      {/* Challenges */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-league-surface rounded-league animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-league-text-muted">
          <Trophy size={48} className="mb-3 opacity-20" />
          <p className="text-sm">No challenges found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
        </div>
      )}
    </div>
  );
}
