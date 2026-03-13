import { useState } from 'react';
import { useLcu } from './hooks/useLcu';
import Sidebar from './sidebar';
import { pages } from './pages_config';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const { connectionStatus, summoner, loading, refresh } = useLcu(6000);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const ActivePage = pages[activePage]?.component ?? pages.dashboard.component;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-league-bg-darkest">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        connectionStatus={connectionStatus}
        summoner={summoner}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Disconnected banner */}
        {!loading && !connectionStatus.connected && (
          <div className="
            flex items-center gap-2 px-4 py-2 bg-league-danger/10
            border-b border-league-danger/20 text-league-danger text-xs
          ">
            <AlertTriangle size={14} />
            <span>
              League client not detected. Start League of Legends, then click the{' '}
              <button
                onClick={handleRefresh}
                className="underline hover:text-league-danger/80 transition-colors"
              >
                refresh button
              </button>
              .
            </span>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <ActivePage />
        </div>
      </main>
    </div>
  );
}
