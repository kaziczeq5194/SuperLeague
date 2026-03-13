import { useEffect, useState, useRef } from 'react';
import { Users, Search, RefreshCw, Crown, Shield, Info } from 'lucide-react';
import { getLobbyMembers } from '@/lib/lcu-api';
import type { LobbyMember } from '@/lib/types';
import { cn } from '@/lib/utils';

// Hover card with summoner info
function MemberHoverCard({ member }: { member: LobbyMember }) {
  return (
    <div className="league-hover-card w-64 z-50 pointer-events-none">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-league-bg-darkest border border-league-gold/30 flex items-center justify-center text-sm font-bold text-league-gold">
          {member.summonerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-league-gold-light">{member.summonerName}</p>
          {member.isLeader && (
            <span className="text-xs text-league-gold flex items-center gap-1">
              <Crown size={10} /> Lobby Leader
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-league-bg-dark rounded p-2">
          <p className="text-league-text-muted mb-0.5">Challenges</p>
          <p className="text-league-blue font-semibold">Loading…</p>
        </div>
        <div className="bg-league-bg-dark rounded p-2">
          <p className="text-league-text-muted mb-0.5">Points</p>
          <p className="text-league-gold font-semibold">— / —</p>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-league-border-dark text-xs text-league-text-muted flex items-center gap-1">
        <Info size={10} />
        Full data loads when connected
      </div>
    </div>
  );
}

interface MemberCardProps {
  member: LobbyMember;
}

function MemberCard({ member }: MemberCardProps) {
  const [showHover, setShowHover] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => setShowHover(true), 400);
  };
  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setShowHover(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={cn(
        'league-card flex items-center gap-3 cursor-default transition-all duration-200',
        member.isLocalMember && 'border-league-gold/30 bg-league-gold-muted/20',
      )}>
        {/* Avatar */}
        <div className="
          w-11 h-11 rounded-full bg-league-bg-darkest border-2 border-league-border-dark
          flex items-center justify-center text-league-text-secondary font-bold text-base
          flex-shrink-0
        ">
          {member.summonerName.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-league-text-primary truncate">
              {member.summonerName}
            </p>
            {member.isLeader && <Crown size={12} className="text-league-gold flex-shrink-0" />}
            {member.isLocalMember && (
              <span className="text-[10px] bg-league-gold/10 border border-league-gold/20 text-league-gold px-1.5 rounded-full">
                You
              </span>
            )}
          </div>
          <p className="text-xs text-league-text-muted">Hover for details</p>
        </div>

        {/* Team badge */}
        {member.teamId !== undefined && member.teamId > 0 && (
          <div className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            member.teamId === 1 ? 'bg-league-blue/10 text-league-blue border border-league-blue/20' : 'bg-league-danger/10 text-league-danger border border-league-danger/20'
          )}>
            Team {member.teamId}
          </div>
        )}
      </div>

      {/* Hover overlay */}
      {showHover && (
        <div className="absolute left-full top-0 ml-2 z-50 animate-fade-in">
          <MemberHoverCard member={member} />
        </div>
      )}
    </div>
  );
}

export default function Lobby() {
  const [members, setMembers] = useState<LobbyMember[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLobby = async () => {
    setRefreshing(true);
    const data = await getLobbyMembers();
    setMembers(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchLobby(); }, []);

  const filtered = members.filter(m =>
    m.summonerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 h-full overflow-y-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-league-gold" size={24} />
          <div>
            <h1 className="text-xl font-bold text-league-gold-light">Lobby Tracker</h1>
            <p className="text-xs text-league-text-secondary">
              {members.length > 0 ? `${members.length} player${members.length !== 1 ? 's' : ''} in lobby` : 'No active lobby'}
            </p>
          </div>
        </div>
        <button onClick={fetchLobby} className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-league-text-muted" size={14} />
        <input
          type="text"
          placeholder="Search players…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="league-search"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-league-text-muted">
        <span className="flex items-center gap-1"><Crown size={12} className="text-league-gold" /> Leader</span>
        <span className="flex items-center gap-1"><Shield size={12} className="text-league-blue" /> Hover player for challenge/rank info</span>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-league-surface rounded-league animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-league-text-muted">
          <Users size={48} className="mb-3 opacity-20" />
          <p className="text-sm">{members.length === 0 ? 'Not in a lobby' : 'No results found'}</p>
          <p className="text-xs mt-1">Start or join a lobby in League client</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <MemberCard key={m.summonerId} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}
