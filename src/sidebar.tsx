import { RefreshCw } from 'lucide-react';
import { cn } from './lib/utils';
import { pages, pageKeys } from './pages_config';
import type { Summoner, ConnectionStatus } from './lib/types';
import { getProfileIconUrl } from './lib/lcu-api';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  connectionStatus: ConnectionStatus;
  summoner: Summoner | null;
  onRefresh: () => void;
  refreshing: boolean;
}

// Split pages into main nav and bottom group
const bottomPages = ['debug', 'settings'];
const mainPages = pageKeys.filter(k => !bottomPages.includes(k));

export default function Sidebar({
  activePage,
  onNavigate,
  connectionStatus,
  summoner,
  onRefresh,
  refreshing,
}: SidebarProps) {
  return (
    <aside className="
      flex flex-col w-[220px] min-w-[220px] h-screen
      bg-league-bg-dark border-r border-league-border-dark
      select-none overflow-hidden
    ">
      {/* ── Logo / Header ── */}
      <div className="px-4 pt-5 pb-4 border-b border-league-border-dark">
        <div className="flex items-center gap-3">
          {/* Logo placeholder — user will replace */}
          <div className="
            w-9 h-9 rounded-full bg-league-gold-muted border border-league-gold/30
            flex items-center justify-center text-league-gold font-bold text-sm
          ">
            SL
          </div>
          <div>
            <p className="text-sm font-bold text-league-gold-light tracking-wide">SuperLeague</p>
            <p className="text-xs text-league-text-muted">Companion</p>
          </div>
        </div>
      </div>

      {/* ── Connection Status ── */}
      <div className="px-4 py-3 border-b border-league-border-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              'connection-dot',
              connectionStatus.connected ? 'connected' : 'disconnected'
            )} />
            <span className="text-xs text-league-text-secondary">
              {connectionStatus.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="
              p-1 rounded text-league-text-muted hover:text-league-gold
              transition-colors duration-200 disabled:opacity-50
            "
            title="Refresh connection"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        {connectionStatus.connected && summoner && (
          <p className="text-xs text-league-blue mt-1 truncate">{summoner.displayName}</p>
        )}
      </div>

      {/* ── Main Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {mainPages.map((key) => {
          const page = pages[key];
          const Icon = page.icon;
          const isActive = activePage === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={cn('nav-item w-full text-left', isActive && 'active')}
            >
              <Icon size={16} />
              <span className="text-sm font-medium">{page.title}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Bottom Nav (Debug, Settings) ── */}
      <div className="border-t border-league-border-dark px-2 py-3 space-y-0.5">
        {bottomPages.map((key) => {
          const page = pages[key];
          const Icon = page.icon;
          const isActive = activePage === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={cn('nav-item w-full text-left', isActive && 'active')}
            >
              <Icon size={16} />
              <span className="text-sm font-medium">{page.title}</span>
            </button>
          );
        })}
      </div>

      {/* ── Summoner Card ── */}
      {summoner && (
        <div className="px-3 py-3 border-t border-league-border-dark">
          <div className="flex items-center gap-2">
            <img
              src={getProfileIconUrl(summoner.profileIconId)}
              alt="Profile icon"
              className="w-8 h-8 rounded-full border border-league-border object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/vite.svg'; }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-league-text-primary truncate">
                {summoner.displayName}
              </p>
              <p className="text-xs text-league-text-muted">Lv. {summoner.summonerLevel}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
