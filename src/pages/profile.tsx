import { useState } from 'react';
import { UserPen, Camera, Star, Trophy, Shield, Edit3, Save } from 'lucide-react';
import { setStatus, setProfileIcon, setRankedDisplay } from '@/lib/lcu-api';
import { getProfileIconUrl } from '@/lib/lcu-api';

const QUEUES = ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'];
const QUEUE_LABELS: Record<string, string> = {
  RANKED_SOLO_5x5: 'Solo/Duo Queue',
  RANKED_FLEX_SR: 'Flex Queue',
};

const STATUS_PRESETS = [
  '🎮 Grinding ranked',
  '🏆 Chasing Challenger',
  '📖 Studying on league',
  '🔥 On a hot streak',
  '🛡️ Tanking for the team',
  '🌙 Late night sessions',
];

export default function Profile() {
  const [status, setStatusText] = useState('');
  const [iconId, setIconId] = useState(1);
  const [displayedQueue, setDisplayedQueue] = useState(QUEUES[0]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editIcon, setEditIcon] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      setStatus(status),
      setProfileIcon(iconId),
      setRankedDisplay(displayedQueue),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 h-full overflow-y-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPen className="text-league-gold" size={24} />
          <div>
            <h1 className="text-xl font-bold text-league-gold-light">Profile</h1>
            <p className="text-xs text-league-text-secondary">Customize your League profile</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Save size={14} />
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile Icon */}
        <div className="league-card space-y-4">
          <h2 className="section-title">
            <Camera size={16} className="text-league-gold" /> Profile Icon
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={getProfileIconUrl(iconId)}
                alt="Profile Icon"
                className="w-20 h-20 rounded-full border-2 border-league-gold/50 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/29.jpg`;
                }}
              />
              <button
                onClick={() => setEditIcon(!editIcon)}
                className="absolute -bottom-1 -right-1 bg-league-gold text-league-bg-darkest w-6 h-6 rounded-full flex items-center justify-center"
              >
                <Edit3 size={12} />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm text-league-text-secondary mb-2">Icon ID</p>
              <input
                type="number"
                value={iconId}
                onChange={(e) => setIconId(Number(e.target.value))}
                className="league-input w-32 text-sm"
                min={1}
                max={9999}
              />
            </div>
          </div>

          {editIcon && (
            <div className="grid grid-cols-8 gap-1.5 max-h-36 overflow-y-auto pt-2 border-t border-league-border-dark animate-fade-in">
              {Array.from({ length: 32 }, (_, i) => i + 1).map((id) => (
                <button
                  key={id}
                  onClick={() => { setIconId(id); setEditIcon(false); }}
                  className={`rounded-full border-2 transition-colors overflow-hidden ${
                    iconId === id ? 'border-league-gold' : 'border-league-border-dark hover:border-league-gold/40'
                  }`}
                >
                  <img
                    src={getProfileIconUrl(id)}
                    alt={`Icon ${id}`}
                    className="w-8 h-8 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="league-card space-y-4">
          <h2 className="section-title">
            <Edit3 size={16} className="text-league-gold" /> Custom Status
          </h2>
          <textarea
            value={status}
            onChange={(e) => setStatusText(e.target.value)}
            placeholder="Set a custom status message…"
            className="league-input w-full resize-none text-sm"
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-league-text-muted text-right">{status.length}/200</p>
          <div className="space-y-1">
            <p className="text-xs text-league-text-muted mb-2">Quick Presets:</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setStatusText(preset)}
                  className="text-xs px-2 py-1 rounded bg-league-surface border border-league-border-dark
                             text-league-text-secondary hover:border-league-gold/30 hover:text-league-text-primary
                             transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Displayed Rank */}
        <div className="league-card space-y-4">
          <h2 className="section-title">
            <Trophy size={16} className="text-league-gold" /> Displayed Rank
          </h2>
          <p className="text-xs text-league-text-muted">Choose which ranked queue to display on your profile</p>
          <div className="space-y-2">
            {QUEUES.map((queue) => (
              <label key={queue} className="flex items-center gap-3 cursor-pointer group">
                <div className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                  ${displayedQueue === queue
                    ? 'border-league-gold bg-league-gold'
                    : 'border-league-border group-hover:border-league-gold/50'
                  }
                `}>
                  {displayedQueue === queue && <div className="w-2 h-2 rounded-full bg-league-bg-darkest" />}
                </div>
                <input
                  type="radio"
                  value={queue}
                  checked={displayedQueue === queue}
                  onChange={() => setDisplayedQueue(queue)}
                  className="sr-only"
                />
                <div>
                  <p className="text-sm text-league-text-primary">{QUEUE_LABELS[queue]}</p>
                  <p className="text-xs text-league-text-muted">
                    {queue === QUEUES[0] ? 'Gold II · 72 LP' : 'Platinum IV · 34 LP'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Rank Badges preview */}
        <div className="league-card space-y-4">
          <h2 className="section-title">
            <Shield size={16} className="text-league-gold" /> Rank Overview
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { queue: 'Solo/Duo', tier: 'GOLD', division: 'II', lp: 72 },
              { queue: 'Flex', tier: 'PLATINUM', division: 'IV', lp: 34 },
            ].map(({ queue, tier, division, lp }) => {
              const tierColors: Record<string, string> = {
                GOLD: '#C89B3C', PLATINUM: '#4E9996', DIAMOND: '#576BCE',
                SILVER: '#9AA4AF', EMERALD: '#0ACE81', MASTER: '#9D48E0',
              };
              const color = tierColors[tier] ?? '#C89B3C';
              return (
                <div
                  key={queue}
                  className="rounded-league p-3 border text-center space-y-1"
                  style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}
                >
                  <p className="text-xs text-league-text-muted">{queue}</p>
                  <p className="text-lg font-bold" style={{ color }}>{tier}</p>
                  <p className="text-sm text-league-text-secondary">{division} · {lp} LP</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
