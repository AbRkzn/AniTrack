import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);
  const setOnlineStatus = useAppStore((s) => s.setOnlineStatus);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        cache: 'no-store',
      });
      const online = response.ok;
      setIsOnline(online);
      setOnlineStatus(online);
    } catch {
      setIsOnline(false);
      setOnlineStatus(false);
    }
  }, [setOnlineStatus]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return isOnline;
}
