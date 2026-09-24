import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function useHeartbeat(intervalMs: number = 60000) {
  const { session, pingHeartbeat } = useAuth();

  useEffect(() => {
    if (!session) return;

    // Ping immediately on mount
    pingHeartbeat();

    // Set up recurring ping
    const interval = setInterval(() => {
      pingHeartbeat();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [session, intervalMs, pingHeartbeat]);
}
