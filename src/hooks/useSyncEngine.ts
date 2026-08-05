import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { syncNow } from '../services/sync';

export function useSyncEngine(enabled: boolean): void {
  const authStatus = useAuthStore((s) => s.status);
  const isOnline = useAppStore((s) => s.isOnline);
  const lastRun = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (authStatus !== 'signedIn' || !isOnline) return;

    const now = Date.now();
    if (now - lastRun.current < 30_000) return;
    lastRun.current = now;

    syncNow().catch(() => {});
  }, [enabled, authStatus, isOnline]);
}
