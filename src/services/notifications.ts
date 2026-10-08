// Schedules local notifications that deliver a kind word on the device's own
// clock. No server is involved — everything here runs on-device.
//
// Note for testing: local scheduled notifications work fine in Expo Go, but
// if you later build a standalone/dev-client app, re-test this screen since
// permission dialogs can look slightly different outside Expo Go.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getRandomQuote, getRandomQuoteForEvent } from './quotes';
import type { CalendarEvent, NotificationSettings } from './storage';

// Show the notification banner even while the app is open, so it's easy to
// test without backgrounding the app.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHANNEL_PUBLIC = 'kindwords-public';
const CHANNEL_PRIVATE = 'kindwords-private';

// Mon/Wed/Fri. Expo's weekday numbering starts at 1 = Sunday.
const THREE_PER_WEEK_WEEKDAYS = [2, 4, 6];

export async function requestNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Android notification channels can't change their lock-screen visibility
// once created, so we keep one channel per visibility option and just
// schedule onto whichever one the user currently wants.
async function ensureAndroidChannel(
  visibility: NotificationSettings['lockScreenVisibility']
): Promise<string | undefined> {
  if (Platform.OS !== 'android') return undefined;

  const channelId = visibility === 'public' ? CHANNEL_PUBLIC : CHANNEL_PRIVATE;
  await Notifications.setNotificationChannelAsync(channelId, {
    name: 'Kind words',
    importance: Notifications.AndroidImportance.DEFAULT,
    lockscreenVisibility:
      visibility === 'public'
        ? Notifications.AndroidNotificationVisibility.PUBLIC
        : Notifications.AndroidNotificationVisibility.PRIVATE,
  });
  return channelId;
}

function parseTime(hhmm: string): { hour: number; minute: number } {
  const [hour, minute] = hhmm.split(':').map(Number);
  return { hour, minute };
}

function toMinutes(hhmm: string): number {
  const { hour, minute } = parseTime(hhmm);
  return hour * 60 + minute;
}

// True if `time` falls inside the quiet-hours window, which may wrap past
// midnight (e.g. 22:00 -> 07:00).
export function isWithinQuietHours(
  time: string,
  quietHoursStart: string,
  quietHoursEnd: string
): boolean {
  const t = toMinutes(time);
  const start = toMinutes(quietHoursStart);
  const end = toMinutes(quietHoursEnd);
  if (start === end) return false; // a zero-length window means no quiet hours
  if (start < end) return t >= start && t < end;
  return t >= start || t < end; // wraps past midnight
}

// Event reminders (before/after a calendar event) always fire at this local
// hour, so adding an event doesn't require picking yet another time.
const EVENT_REMINDER_HOUR = 9;

// `offsetDays` is -1 for the reminder before the event, +1 for after.
function eventReminderDate(event: CalendarEvent, offsetDays: number): Date {
  const [year, month, day] = event.date.split('-').map(Number);
  const date = new Date(year, month - 1, day, EVENT_REMINDER_HOUR, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

type Slot = { time: string; weekday?: number };

function buildSlots(settings: NotificationSettings): Slot[] {
  if (settings.frequency === 'daily') {
    return [{ time: settings.times[0] }];
  }
  if (settings.frequency === 'three_per_week') {
    return THREE_PER_WEEK_WEEKDAYS.map((weekday) => ({ time: settings.times[0], weekday }));
  }
  return settings.times.map((time) => ({ time }));
}

export type RescheduleResult = {
  scheduledCount: number;
  skippedTimes: string[]; // times skipped for falling inside quiet hours
};

// Cancels every notification this app has scheduled, then schedules fresh
// ones (with freshly-picked quotes) for the given settings, circumstances,
// and calendar events. Safe to call whenever settings change, an event is
// added/edited/deleted, or the app opens.
export async function rescheduleAllNotifications(
  settings: NotificationSettings,
  circumstances: string[],
  events: CalendarEvent[] = []
): Promise<RescheduleResult> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.enabled) {
    return { scheduledCount: 0, skippedTimes: [] };
  }

  const granted = await requestNotificationPermissions();
  if (!granted) {
    return { scheduledCount: 0, skippedTimes: [] };
  }

  const channelId = await ensureAndroidChannel(settings.lockScreenVisibility);

  const allSlots = buildSlots(settings);
  const slots = allSlots.filter(
    (slot) => !isWithinQuietHours(slot.time, settings.quietHoursStart, settings.quietHoursEnd)
  );
  const skippedTimes = allSlots
    .filter((slot) => isWithinQuietHours(slot.time, settings.quietHoursStart, settings.quietHoursEnd))
    .map((slot) => slot.time);

  for (const slot of slots) {
    const { hour, minute } = parseTime(slot.time);
    const quote = getRandomQuote(circumstances);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'A kind word for you',
        body: quote.text,
      },
      trigger: slot.weekday
        ? {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: slot.weekday,
            hour,
            minute,
            channelId,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId,
          },
    });
  }

  // Event reminders always use a fixed hour, so just check once whether
  // that hour falls inside quiet hours rather than per-event.
  const eventReminderTime = `${EVENT_REMINDER_HOUR.toString().padStart(2, '0')}:00`;
  let eventReminderCount = 0;
  if (!isWithinQuietHours(eventReminderTime, settings.quietHoursStart, settings.quietHoursEnd)) {
    const now = new Date();
    for (const event of events) {
      for (const offsetDays of [-1, 1]) {
        const date = eventReminderDate(event, offsetDays);
        if (date <= now) continue; // don't schedule reminders in the past

        const quote = getRandomQuoteForEvent(event.type);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: offsetDays < 0 ? 'Thinking of you' : 'Checking in on you',
            body: quote.text,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId },
        });
        eventReminderCount++;
      }
    }
  }

  return { scheduledCount: slots.length + eventReminderCount, skippedTimes };
}
