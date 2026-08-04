import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { parseISO, startOfDay, addDays, addHours, isBefore } from 'date-fns';
import type { Crop, FarmTask, AppSettings } from '../types';

const CHANNEL_ID = 'harvest-reminders';
const TASK_CHANNEL_ID = 'task-reminders';
const REMINDER_TYPE = 'harvest_reminder';
const TASK_REMINDER_TYPE = 'task_reminder';

type NotificationsModule = typeof import('expo-notifications');

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let modulePromise: Promise<NotificationsModule | null> | null = null;

function loadNotifications(): Promise<NotificationsModule | null> {
  if (isExpoGo) return Promise.resolve(null);
  if (!modulePromise) {
    modulePromise = import('expo-notifications')
      .then((m) => m as NotificationsModule)
      .catch(() => null);
  }
  return modulePromise;
}

export async function configureNotifications(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Harvest reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2E7D32',
    });
    await Notifications.setNotificationChannelAsync(TASK_CHANNEL_ID, {
      name: 'Task reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
    });
  }
}

export async function setupNotificationTapHandling(onHarvestReminder: () => void, onTaskReminder: () => void): Promise<() => void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return () => {};

  const handle = (response: { notification: { request: { content: { data?: Record<string, unknown> | null } } } }) => {
    if (response.notification.request.content.data?.type === REMINDER_TYPE) onHarvestReminder();
    if (response.notification.request.content.data?.type === TASK_REMINDER_TYPE) onTaskReminder();
  };

  const subscription = Notifications.addNotificationResponseReceivedListener(handle);
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) handle(response);
    })
    .catch(() => {});

  return () => subscription.remove();
}

async function ensurePermission(Notifications: NotificationsModule): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.status === 'undetermined') {
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  }
  return false;
}

export async function cancelHarvestReminders(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminders = scheduled.filter((n) => n.content.data?.type === REMINDER_TYPE);
  await Promise.all(reminders.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function cancelTaskReminders(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminders = scheduled.filter((n) => n.content.data?.type === TASK_REMINDER_TYPE);
  await Promise.all(reminders.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function syncTaskReminders(tasks: FarmTask[], pushNotifications: boolean): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  await configureNotifications();

  if (!pushNotifications) {
    await cancelTaskReminders();
    return;
  }

  const granted = await ensurePermission(Notifications);
  if (!granted) {
    await cancelTaskReminders();
    return;
  }

  await cancelTaskReminders();

  const now = new Date();

  for (const task of tasks) {
    if (task.status === 'completed' || task.status === 'cancelled') continue;
    if (!task.reminderEnabled || !task.reminderDate) continue;

    const reminderDate = parseISO(task.reminderDate);
    if (Number.isNaN(reminderDate.getTime())) continue;

    const trigger = addHours(startOfDay(reminderDate), 9);
    if (isBefore(trigger, now)) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: `${task.title} is due on ${task.dueDate}.`,
        data: { type: TASK_REMINDER_TYPE, taskId: task.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
        channelId: TASK_CHANNEL_ID,
      },
    });
  }
}

export async function syncHarvestReminders(crops: Crop[], settings: AppSettings): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  await configureNotifications();

  if (!settings.pushNotifications || settings.reminderDaysBeforeHarvest < 0) {
    await cancelHarvestReminders();
    return;
  }

  const granted = await ensurePermission(Notifications);
  if (!granted) {
    await cancelHarvestReminders();
    return;
  }

  await cancelHarvestReminders();

  const now = new Date();
  const reminderDays = settings.reminderDaysBeforeHarvest;

  for (const crop of crops) {
    if (crop.status !== 'growing' && crop.status !== 'ready_for_harvest') continue;

    const harvestDate = parseISO(crop.expectedHarvestDate);
    if (Number.isNaN(harvestDate.getTime())) continue;

    const trigger = addHours(addDays(startOfDay(harvestDate), -reminderDays), 9);
    if (isBefore(trigger, now)) continue;

    const body =
      reminderDays === 0
        ? `${crop.name} is ready for harvest today.`
        : `${crop.name} is expected to be ready for harvest in ${reminderDays} day${reminderDays === 1 ? '' : 's'}.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Harvest Reminder',
        body,
        data: { type: REMINDER_TYPE, cropId: crop.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
        channelId: CHANNEL_ID,
      },
    });
  }
}
