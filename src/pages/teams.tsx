import { useState } from 'react';
import { Globe, Plus, Trash2, UserPlus, Search, RefreshCw } from 'lucide-react';
import { getSummonerByName, getSummonerChallenges, getProfileIconUrl } from '@/lib/lcu-api';

/* Globetrotter / Harmony regions */
const REGIONS = [
  { id: 'demacia',     name: 'Demacia',       color: '#F0E6D2' },
  { id: 'noxus',       name: 'Noxus',         color: '#E84057' },
  { id: 'ionia',       name: 'Ionia',         color: '#10D48A' },
  { id: 'freljord',    name: 'Freljord',      color: '#4A9EFF' },
  { id: 'piltover',    name: 'Piltover',      color: '#C89B3C' },
  { id: 'bilgewater',  name: 'Bilgewater',    color: '#FF8C42' },
  { id: 'shadow_isles',name: 'Shadow Isles',  color: '#9D48E0' },
  { id: 'shurima',     name: 'Shurima',       color: '#F0B232' },
  { id: 'targon',      name: 'Targon',        color: '#576BCE' },
  { id: 'void',        name: 'The Void',      color: '#9D48E0' },
  { id: 'ixtal',       name: 'Ixtal',         color: '#10D48A' },
  { id: 'bandle_city', name: 'Bandle City',   color: '#F4C874' },
];

interface TeamMember {
  name: string;
  puuid?: string;
  profileIconId?: number;
  challengeData?: any;
  loading?: boolean;
  error?: string;
}

interface Team {
  id: string;
  region: string;
  members: TeamMember[];
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0].id);
  const [addName, setAddName] = useState('');
  const [addingToTeam, setAddingToTeam] = useState<string | null>(null);

  const createTeam = () => {
    const team: Team = {
      id: Date.now().toString(),
      region: selectedRegion,
      members: [],
    };
    setTeams([...teams, team]);
  };

  const deleteTeam = (id: string) => {
    setTeams(teams.filter(t => t.id !== id));
  };

  const addMember = async (teamId: string) => {
    if (!addName.trim()) return;
    const name = addName.trim();
    setAddName('');

    // Add placeholder member
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, members: [...t.members, { name, loading: true }] } : t
    ));

    // Lookup summoner
    try {
      const summoner = await getSummonerByName(name) as any;
      const puuid = summoner?.puuid;
      let challengeData = null;
      if (puuid) {
        challengeData = await getSummonerChallenges(puuid);
      }

      setTeams(prev => prev.map(t =>
        t.id === teamId ? {
          ...t,
          members: t.members.map(m =>
            m.name === name && m.loading ? {
              ...m,
              loading: false,
              puuid,
              profileIconId: summoner?.profileIconId,
              challengeData,
            } : m
          ),
        } : t
      ));
    } catch {
      setTeams(prev => prev.map(t =>
        t.id === teamId ? {
          ...t,
          members: t.members.map(m =>
            m.name === name && m.loading ? { ...m, loading: false, error: 'Not found' } : m
          ),
        } : t
      ));
    }
  };

  const removeMember = (teamId: string, index: number) => {
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, members: t.members.filter((_, i) => i !== index) } : t
    ));
  };

  const regionInfo = (id: string) => REGIONS.find(r => r.id === id) ?? REGIONS[0];

  return (
    <div className="p-6 space-y-5 animate-slide-up">
      {/* Create team bar */}
      <div className="flex gap-3 items-center">
        <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="select text-sm w-44">
          {REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button onClick={createTeam} className="btn-gold text-sm">
          <Plus size={14} /> New Team
        </button>
      </div>

      {/* Teams */}
      {teams.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-ink-ghost">
          <Globe size={40} className="mb-3 opacity-20" />
          <p className="text-sm text-ink-dim">No teams yet</p>
          <p className="text-xs mt-1">Create a team for a Globetrotter / Harmony region above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const region = regionInfo(team.region);
            return (
              <div key={team.id} className="card p-4 space-y-3">
                {/* Team header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: region.color, boxShadow: `0 0 6px ${region.color}60` }} />
                    <h3 className="text-sm font-semibold text-ink-bright">{region.name}</h3>
                    <span className="text-[10px] text-ink-ghost">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                  </div>
                  <button onClick={() => deleteTeam(team.id)} className="p-1.5 text-ink-ghost hover:text-ruby transition-colors rounded hover:bg-ruby/10">
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Members */}
                <div className="space-y-2">
                  {team.members.map((member, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-dark/50 border border-white/[0.04]">
                      {member.loading ? (
                        <div className="flex items-center gap-2 flex-1">
                          <RefreshCw size={12} className="animate-spin text-ink-ghost" />
                          <span className="text-xs text-ink-ghost">Looking up {member.name}…</span>
                        </div>
                      ) : (
                        <>
                          <img
                            src={getProfileIconUrl(member.profileIconId ?? 29)}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-white/[0.06] flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-ink-bright truncate">{member.name}</p>
                            {member.error ? (
                              <p className="text-[10px] text-ruby">{member.error}</p>
                            ) : member.challengeData ? (
                              <p className="text-[10px] text-ink-ghost">
                                {member.challengeData.totalChallengeScore?.toLocaleString() ?? '—'} challenge pts
                              </p>
                            ) : (
                              <p className="text-[10px] text-ink-ghost">No challenge data</p>
                            )}
                          </div>
                          <button onClick={() => removeMember(team.id, i)} className="p-1 text-ink-ghost hover:text-ruby transition-colors">
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add member */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Summoner name…"
                    value={addingToTeam === team.id ? addName : ''}
                    onFocus={() => setAddingToTeam(team.id)}
                    onChange={(e) => { setAddingToTeam(team.id); setAddName(e.target.value); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') addMember(team.id); }}
                    className="input text-xs flex-1"
                  />
                  <button
                    onClick={() => addMember(team.id)}
                    disabled={!addName.trim() || addingToTeam !== team.id}
                    className="btn-ghost text-xs px-3"
                  >
                    <UserPlus size={12} /> Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
