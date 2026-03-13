import { useEffect, useState } from 'react';
import { Users, Search, Crown } from 'lucide-react';
import { getLobbyMembers, getProfileIconUrl } from '@/lib/lcu-api';

export default function Lobby() {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLobbyMembers().then((data) => {
      if (Array.isArray(data)) setMembers(data);
      setLoading(false);
    });
  }, []);

  const filtered = members.filter((m) =>
    (m.summonerName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`status-dot ${members.length > 0 ? 'online' : 'offline'}`} />
          <span className="text-sm text-ink-dim">
            {loading ? 'Loading…' : `${members.length} player${members.length !== 1 ? 's' : ''} in lobby`}
          </span>
        </div>
        <div className="relative w-56">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-ghost" />
          <input
            type="text"
            placeholder="Search players…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-search text-sm"
          />
        </div>
      </div>

      {/* Empty state */}
      {!loading && members.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-ink-ghost">
          <Users size={40} className="mb-3 opacity-20" />
          <p className="text-sm font-medium text-ink-dim">No lobby detected</p>
          <p className="text-xs mt-1">Join or create a lobby in the League client</p>
        </div>
      )}

      {/* Members grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {loading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="card p-4 flex gap-4">
                <div className="skeleton w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
              </div>
            ))
          : filtered.map((m, i) => (
              <div key={m.summonerId ?? i} className={`card p-4 flex items-start gap-4 ${i === 0 ? 'card-gold' : ''}`}>
                <div className="relative flex-shrink-0">
                  <img
                    src={getProfileIconUrl(m.profileIconId ?? 29)}
                    alt={m.summonerName ?? ''}
                    className="w-12 h-12 rounded-lg object-cover border border-white/[0.08]"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.4'; }}
                  />
                  {m.isLeader && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                      <Crown size={10} className="text-void" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink-bright truncate">{m.summonerName ?? 'Unknown'}</p>
                    {i === 0 && <span className="badge-gold text-[9px]">You</span>}
                    {m.isLeader && <span className="badge-muted text-[9px]">Leader</span>}
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {m.summonerLevel ? `Level ${m.summonerLevel}` : ''}
                  </p>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}
