import { useState, useEffect } from 'react';
import { Settings, Users, Webhook, RefreshCw, Plus, Trash2, Check, AlertTriangle } from 'lucide-react';
import { getAccounts, switchAccount, testDiscordWebhook } from '@/lib/lcu-api';
import type { Account, AppSettings } from '@/lib/types';

const DEFAULT_SETTINGS: AppSettings = {
  discordWebhookUrl: '',
  refreshInterval: 6,
  autoConnect: true,
  showNotifications: true,
  theme: 'dark',
  activeAccountId: null,
};

const SECTION_TABS = ['Accounts', 'Discord', 'General'] as const;
type SectionTab = typeof SECTION_TABS[number];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionTab>('Accounts');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAccounts().then(setAccounts);
    // Load settings from localStorage as fallback
    try {
      const stored = localStorage.getItem('superleague_settings');
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('superleague_settings', JSON.stringify(settings));
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestWebhook = async () => {
    if (!settings.discordWebhookUrl) return;
    setWebhookStatus('testing');
    const ok = await testDiscordWebhook(settings.discordWebhookUrl);
    setWebhookStatus(ok ? 'success' : 'error');
    setTimeout(() => setWebhookStatus('idle'), 3000);
  };

  const handleSwitchAccount = async (id: number) => {
    await switchAccount(id);
    setAccounts(accounts.map(a => ({ ...a, isActive: a.id === id })));
    setSettings({ ...settings, activeAccountId: id });
  };

  return (
    <div className="p-6 h-full overflow-y-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="text-league-gold" size={24} />
          <div>
            <h1 className="text-xl font-bold text-league-gold-light">Settings</h1>
            <p className="text-xs text-league-text-secondary">Configure SuperLeague</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          {saved ? <Check size={14} /> : <Settings size={14} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-league-border-dark">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={`league-tab flex items-center gap-1.5 ${activeSection === tab ? 'active' : ''}`}
          >
            {tab === 'Accounts' && <Users size={13} />}
            {tab === 'Discord' && <Webhook size={13} />}
            {tab === 'General' && <Settings size={13} />}
            {tab}
          </button>
        ))}
      </div>

      {/* Accounts Section */}
      {activeSection === 'Accounts' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-league-text-secondary">
              {accounts.length > 0
                ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} tracked`
                : 'No accounts tracked yet — accounts are auto-detected when you log into League.'}
            </p>
          </div>

          {accounts.length === 0 ? (
            <div className="league-card text-center py-10">
              <Users size={36} className="mx-auto mb-3 text-league-text-muted opacity-40" />
              <p className="text-sm text-league-text-secondary">No accounts detected yet</p>
              <p className="text-xs text-league-text-muted mt-1">
                Launch a League client and SuperLeague will auto-detect your account
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div key={account.id} className={`
                  league-card flex items-center gap-3 transition-all
                  ${account.isActive ? 'border-league-gold/30 bg-league-gold-muted/10' : ''}
                `}>
                  <div className="w-9 h-9 rounded-full bg-league-bg-darkest border border-league-border-dark flex items-center justify-center text-sm font-bold text-league-gold flex-shrink-0">
                    {account.summonerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-league-text-primary">{account.summonerName}</p>
                    <p className="text-xs text-league-text-muted">{account.region} · {account.puuid.slice(0, 12)}…</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.isActive && (
                      <span className="text-xs text-league-success bg-league-success/10 border border-league-success/20 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                    {!account.isActive && (
                      <button
                        onClick={() => handleSwitchAccount(account.id)}
                        className="btn-secondary text-xs px-3 py-1"
                      >
                        Switch
                      </button>
                    )}
                    <button className="p-1 text-league-text-muted hover:text-league-danger transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mock examples */}
          {accounts.length === 0 && (
            <div className="text-xs text-league-text-muted bg-league-surface rounded-league p-3 border border-league-border-dark">
              <p className="font-medium text-league-text-secondary mb-1">How it works:</p>
              <ul className="space-y-1 list-disc ml-4">
                <li>Accounts are auto-added when you log in via League client</li>
                <li>Switch between tracked accounts without re-logging</li>
                <li>Each account has independent match history and stats</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Discord Section */}
      {activeSection === 'Discord' && (
        <div className="space-y-4">
          <div className="league-card space-y-3">
            <h3 className="text-sm font-semibold text-league-gold-light flex items-center gap-2">
              <Webhook size={14} className="text-league-blue" />
              Discord Webhook
            </h3>
            <p className="text-xs text-league-text-muted">
              Post match results, mastery milestones, and challenge unlocks to a Discord channel.
            </p>
            <div className="space-y-2">
              <input
                type="url"
                value={settings.discordWebhookUrl}
                onChange={(e) => setSettings({ ...settings, discordWebhookUrl: e.target.value })}
                placeholder="https://discord.com/api/webhooks/…"
                className="league-input w-full text-sm font-mono"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestWebhook}
                  disabled={webhookStatus === 'testing' || !settings.discordWebhookUrl}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  {webhookStatus === 'testing' && <RefreshCw size={13} className="animate-spin" />}
                  {webhookStatus === 'success' && <Check size={13} className="text-league-success" />}
                  {webhookStatus === 'error' && <AlertTriangle size={13} className="text-league-danger" />}
                  {webhookStatus === 'idle' && <Webhook size={13} />}
                  {webhookStatus === 'testing' ? 'Testing…' : webhookStatus === 'success' ? 'Success!' : webhookStatus === 'error' ? 'Failed' : 'Test Webhook'}
                </button>
                {webhookStatus === 'success' && (
                  <p className="text-xs text-league-success">Message sent to Discord!</p>
                )}
                {webhookStatus === 'error' && (
                  <p className="text-xs text-league-danger">Webhook failed. Check URL.</p>
                )}
              </div>
            </div>
          </div>

          {/* What gets posted */}
          <div className="league-card space-y-3">
            <h3 className="text-sm font-semibold text-league-gold-light">What to Post</h3>
            <div className="space-y-2">
              {[
                { label: 'Match results (win/loss, KDA)', key: 'postMatches' },
                { label: 'Mastery level-up milestones', key: 'postMastery' },
                { label: 'Challenge completions', key: 'postChallenges' },
                { label: 'New skin unlocks', key: 'postSkins' },
              ].map(({ label }) => (
                <label key={label} className="flex items-center gap-3 cursor-pointer">
                  <div className="w-4 h-4 rounded bg-league-gold/20 border border-league-gold/40 flex items-center justify-center">
                    <Check size={10} className="text-league-gold" />
                  </div>
                  <span className="text-sm text-league-text-secondary">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* General Section */}
      {activeSection === 'General' && (
        <div className="space-y-4">
          <div className="league-card space-y-4">
            <h3 className="text-sm font-semibold text-league-gold-light">Connection</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-league-text-primary">Auto-connect to League client</p>
                  <p className="text-xs text-league-text-muted">Automatically detect and connect when client launches</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, autoConnect: !settings.autoConnect })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${settings.autoConnect ? 'bg-league-gold' : 'bg-league-surface'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.autoConnect ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </label>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-league-text-primary">Refresh interval</p>
                  <p className="text-xs text-league-text-muted">How often to poll the League client</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.refreshInterval}
                    onChange={(e) => setSettings({ ...settings, refreshInterval: Number(e.target.value) })}
                    className="league-input w-16 text-sm text-center"
                    min={2}
                    max={60}
                  />
                  <span className="text-xs text-league-text-muted">seconds</span>
                </div>
              </div>
            </div>
          </div>

          <div className="league-card space-y-4">
            <h3 className="text-sm font-semibold text-league-gold-light">Notifications</h3>
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm text-league-text-primary">Desktop notifications</p>
                <p className="text-xs text-league-text-muted">Show system notifications for milestones</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, showNotifications: !settings.showNotifications })}
                className={`relative w-10 h-5 rounded-full transition-colors ${settings.showNotifications ? 'bg-league-gold' : 'bg-league-surface'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.showNotifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>

          <div className="league-card space-y-3">
            <h3 className="text-sm font-semibold text-league-gold-light">Data</h3>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm">Export Data</button>
              <button className="text-sm px-4 py-2 rounded-league border border-league-danger/30 text-league-danger hover:bg-league-danger/10 transition-colors">
                Clear History
              </button>
            </div>
            <p className="text-xs text-league-text-muted">
              Data is stored locally in a SQLite database. No data is sent to external servers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
