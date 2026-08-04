import { useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useAppStore } from '../store/appStore';
import { syncTaskReminders } from '../services/notifications';

export function useTaskReminders() {
  const tasks = useTaskStore((s) => s.tasks.data);
  const pushNotifications = useAppStore((s) => s.settings.pushNotifications);

  useEffect(() => {
    syncTaskReminders(tasks, pushNotifications).catch(() => {});
  }, [tasks, pushNotifications]);
}
