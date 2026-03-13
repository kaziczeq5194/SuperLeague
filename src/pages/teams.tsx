import { useState } from 'react';
import { Globe, Plus, Trash2, UserPlus, GripVertical } from 'lucide-react';
import { getChampionIconUrl } from '@/lib/lcu-api';
import type { Team, TeamMember } from '@/lib/types';
import { cn } from '@/lib/utils';

const REGIONS = ['LCS', 'LEC', 'LCK', 'LPL', 'CBLOL', 'LJL', 'PCS', 'VCS', 'LLA', 'TCL'];
const ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
const REGION_COLORS: Record<string, string> = {
  LCS: '#0397AB', LEC: '#9D48E0', LCK: '#C89B3C', LPL: '#E84057',
  CBLOL: '#0ACE81', LJL: '#F4C874', PCS: '#0AC8B9', VCS: '#576BCE', LLA: '#F0B232', TCL: '#9AA4AF',
};

function TeamCard({
  team,
  onDelete,
}: {
  team: Team;
  onDelete: () => void;
}) {
  const color = REGION_COLORS[team.region] ?? '#C89B3C';
  return (
    <div
      className="league-card space-y-3"
      style={{ borderColor: `${color}20` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
          />
          <h3 className="font-bold text-league-gold-light">{team.name}</h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
          >
            {team.region}
          </span>
        </div>
        <button
          onClick={onDelete}
          className="p-1 text-league-text-muted hover:text-league-danger transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Roles grid */}
      <div className="grid grid-cols-5 gap-2">
        {ROLES.map((role) => {
          const member = team.members.find(m => m.role === role);
          return (
            <div key={role} className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-11 h-11 rounded-full border-2 flex items-center justify-center text-xs',
                member
                  ? 'border-league-gold/30 bg-league-gold-muted/20'
                  : 'border-dashed border-league-border-dark bg-league-bg-darkest'
              )}>
                {member?.championId ? (
                  <img
                    src={getChampionIconUrl(member.championId)}
                    alt={member.summonerName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserPlus size={14} className="text-league-text-muted" />
                )}
              </div>
              <p className="text-[10px] text-league-text-muted">{role}</p>
              {member && (
                <p className="text-[10px] text-league-text-secondary truncate max-w-[60px] text-center">
                  {member.summonerName}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Token Progress (per Crystal pattern) */}
      <div className="pt-2 border-t border-league-border-dark">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-league-text-muted">Token Progress</span>
          <span className="text-xs font-semibold" style={{ color }}>{team.members.length * 2} / {ROLES.length * 2}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: ROLES.length * 2 }, (_, i) => (
            <div
              key={i}
              className="flex-1 h-2 rounded-full"
              style={{
                backgroundColor: i < team.members.length * 2 ? color : '#1E2328',
                boxShadow: i < team.members.length * 2 ? `0 0 4px ${color}60` : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([
    {
      id: '1',
      name: 'Cloud9',
      region: 'LCS',
      createdAt: new Date().toISOString(),
      members: [
        { summonerName: 'Impact', role: 'Top', championId: 2 },
        { summonerName: 'Blaber', role: 'Jungle', championId: 11 },
        { summonerName: 'Jojopyun', role: 'Mid', championId: 4 },
        { summonerName: 'Berserker', role: 'ADC', championId: 22 },
      ],
    },
    {
      id: '2',
      name: 'G2 Esports',
      region: 'LEC',
      createdAt: new Date().toISOString(),
      members: [
        { summonerName: 'BrokenBlade', role: 'Top' },
        { summonerName: 'Yike', role: 'Jungle' },
        { summonerName: 'Caps', role: 'Mid', championId: 1 },
        { summonerName: 'Hans Sama', role: 'ADC', championId: 51 },
        { summonerName: 'Mikyx', role: 'Support', championId: 44 },
      ],
    },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRegion, setNewRegion] = useState('LCS');

  const createTeam = () => {
    if (!newName.trim()) return;
    const team: Team = {
      id: Date.now().toString(),
      name: newName.trim(),
      region: newRegion,
      members: [],
      createdAt: new Date().toISOString(),
    };
    setTeams([...teams, team]);
    setNewName('');
    setShowCreate(false);
  };

  return (
    <div className="p-6 h-full overflow-y-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="text-league-gold" size={24} />
          <div>
            <h1 className="text-xl font-bold text-league-gold-light">Team Builder</h1>
            <p className="text-xs text-league-text-secondary">Build and track your regional teams</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={14} />
          New Team
        </button>
      </div>

      {/* Create Team Form */}
      {showCreate && (
        <div className="league-card-gold space-y-3 animate-fade-in">
          <h3 className="text-sm font-semibold text-league-gold">Create New Team</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Team name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createTeam()}
              className="league-input flex-1"
            />
            <select
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              className="league-input"
            >
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={createTeam} className="btn-primary px-4">Create</button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost px-3">Cancel</button>
          </div>
        </div>
      )}

      {/* Region Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {REGIONS.map((region) => {
          const color = REGION_COLORS[region];
          const count = teams.filter(t => t.region === region).length;
          if (count === 0) return null;
          return (
            <span
              key={region}
              className="text-xs px-2.5 py-1 rounded-full font-medium cursor-default"
              style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
            >
              {region} ({count})
            </span>
          );
        })}
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-league-text-muted">
          <Globe size={48} className="mb-3 opacity-20" />
          <p className="text-sm">No teams yet</p>
          <p className="text-xs mt-1">Click "New Team" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onDelete={() => setTeams(teams.filter(t => t.id !== team.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
