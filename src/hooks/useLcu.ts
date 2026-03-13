import { useState, useEffect, useCallback, useRef } from 'react';
import { getConnectionStatus, refreshConnection, getCurrentSummoner } from '../lib/lcu-api';
import type { ConnectionStatus, Summoner } from '../lib/types';

export function useLcu(pollInterval = 5000) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false });
  const [summoner, setSummoner] = useState<Summoner | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const status = await getConnectionStatus();
      setConnectionStatus(status);

      if (status.connected) {
        const summonerData = await getCurrentSummoner();
        setSummoner(summonerData);
      } else {
        setSummoner(null);
      }
    } catch {
      setConnectionStatus({ connected: false });
      setSummoner(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const status = await refreshConnection();
      setConnectionStatus(status);
      if (status.connected) {
        const summonerData = await getCurrentSummoner();
        setSummoner(summonerData);
      }
    } catch {
      setConnectionStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
    intervalRef.current = setInterval(checkConnection, pollInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkConnection, pollInterval]);

  return { connectionStatus, summoner, loading, refresh };
}
