import { useState, useEffect } from 'react';
import { getDatabase } from '../database';
import { runMigrations } from '../database/migrations';

interface UseDatabaseResult {
  isReady: boolean;
  error: string | null;
}

export function useDatabase(): UseDatabaseResult {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await getDatabase();
        await runMigrations();
        if (mounted) setIsReady(true);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Database initialization failed');
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error };
}
