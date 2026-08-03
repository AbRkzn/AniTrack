import { useEffect } from 'react';
import { useCropsStore } from '../store/cropsStore';
import { useAppStore } from '../store/appStore';
import { syncHarvestReminders } from '../services/notifications';

export function useHarvestReminders() {
  const crops = useCropsStore((s) => s.crops.data);
  const settings = useAppStore((s) => s.settings);

  useEffect(() => {
    syncHarvestReminders(crops, settings).catch(() => {});
  }, [crops, settings]);
}
