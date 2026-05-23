import { useEffect, useRef, useState } from 'react';
import { startNetworkMonitor, stopNetworkMonitor } from '../sync/networkMonitor';
import { runSync } from '../sync/syncWorker';

export function useNetworkSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startNetworkMonitor();
    return () => stopNetworkMonitor();
  }, []);

  const syncNow = async () => {
    setIsSyncing(true);
    setLastSyncError(null);
    const result = await runSync();
    setIsSyncing(false);
    if (result.error) {
      setLastSyncError(result.error);
    } else {
      setLastSyncedAt(new Date());
    }
  };

  return { isSyncing, lastSyncError, lastSyncedAt, syncNow };
}
