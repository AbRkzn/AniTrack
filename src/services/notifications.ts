import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { parseISO, startOfDay, addDays, addHours, isBefore } from 'date-fns';
import type { Crop, AppSettings } from '../types';

const CHANNEL_ID = 'harvest-reminders';
const REMINDER_TYPE = 'harvest_reminder';

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
  }
}

export async function setupNotificationTapHandling(onHarvestReminder: () => void): Promise<() => void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return () => {};

  const handle = (response: { notification: { request: { content: { data?: Record<string, unknown> | null } } } }) => {
    if (response.notification.request.content.data?.type === REMINDER_TYPE) onHarvestReminder();
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
