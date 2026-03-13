import { useState, useEffect, useCallback, useRef } from 'react';
import { getConnectionStatus, refreshConnection, getCurrentSummoner } from '../lib/lcu-api';
import type { Summoner } from '../lib/types';

export function useLcu(pollInterval = 5000) {
  const [connected, setConnected] = useState(false);
  const [summoner, setSummoner] = useState<Summoner | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const status = await getConnectionStatus();
      setConnected(status.connected);

      if (status.connected) {
        const summonerData = await getCurrentSummoner();
        setSummoner(summonerData);
      } else {
        setSummoner(null);
      }
    } catch {
      setConnected(false);
      setSummoner(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const status = await refreshConnection();
      setConnected(status.connected);
      if (status.connected) {
        const summonerData = await getCurrentSummoner();
        setSummoner(summonerData);
      }
    } catch {
      setConnected(false);
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

  return { connected, summoner, loading, refresh };
}
