// Schedules local notifications that deliver a kind word on the device's own
// clock. No server is involved — everything here runs on-device.
//
// Note for testing: local scheduled notifications work fine in Expo Go, but
// if you later build a standalone/dev-client app, re-test this screen since
// permission dialogs can look slightly different outside Expo Go.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getRandomQuote, getRandomQuoteForEvent } from './quotes';
import { getHiddenQuoteIds, getSnoozeUntil, setSnoozeUntil } from './storage';
import type { CalendarEvent, NotificationSettings } from './storage';
import type { Language } from '../data/languages';
import i18n from '../i18n';

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
    // Unlike importance/visibility, a channel's name can be updated after
    // creation, so this stays in sync with the chosen UI language.
    name: i18n.t('notifications.channelName'),
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

// How long "Snooze" on the Kind word screen pauses notifications for.
export type SnoozeDuration = 'hour' | 'tomorrow' | 'three_days';

export function computeSnoozeUntil(duration: SnoozeDuration, from: Date = new Date()): number {
  if (duration === 'hour') return from.getTime() + 60 * 60 * 1000;
  if (duration === 'three_days') return from.getTime() + 3 * 24 * 60 * 60 * 1000;
  // "Until tomorrow" means from now through the end of today.
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1).getTime();
}

export function describeSnoozeDuration(duration: SnoozeDuration): string {
  if (duration === 'hour') return i18n.t('notifications.snoozedHour');
  if (duration === 'three_days') return i18n.t('notifications.snoozedThreeDays');
  return i18n.t('notifications.snoozedTomorrow');
}

// Pulls the quote id back out of a tapped notification (see the `data:
// { quoteId }` attached below), so the app can open the Kind word screen
// for the exact quote that was sent instead of a new random one.
export function extractQuoteId(
  response: Notifications.MaybeNotificationResponse
): string | undefined {
  const quoteId = response?.notification.request.content.data?.quoteId;
  return typeof quoteId === 'string' ? quoteId : undefined;
}

// Cancels every notification this app has scheduled, then schedules fresh
// ones (with freshly-picked quotes) for the given settings, circumstances,
// and calendar events. Safe to call whenever settings change, an event is
// added/edited/deleted, or the app opens.
export async function rescheduleAllNotifications(
  settings: NotificationSettings,
  circumstances: string[],
  events: CalendarEvent[] = [],
  quoteLanguage: Language
): Promise<RescheduleResult> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.enabled) {
    return { scheduledCount: 0, skippedTimes: [] };
  }

  const granted = await requestNotificationPermissions();
  if (!granted) {
    return { scheduledCount: 0, skippedTimes: [] };
  }

  const hiddenQuoteIds = await getHiddenQuoteIds();

  // A snooze pauses every regular reminder until it passes. Once it has,
  // clear it so things just go back to normal without any extra steps.
  let snoozeUntil = await getSnoozeUntil();
  if (snoozeUntil !== null && snoozeUntil <= Date.now()) {
    await setSnoozeUntil(null);
    snoozeUntil = null;
  }

  const channelId = await ensureAndroidChannel(settings.lockScreenVisibility);

  // Like quiet hours, a snooze simply isn't scheduled rather than shifted —
  // it'll pick back up the next time this runs (settings save or app open)
  // after the snooze has passed.
  const allSlots = snoozeUntil ? [] : buildSlots(settings);
  const slots = allSlots.filter(
    (slot) => !isWithinQuietHours(slot.time, settings.quietHoursStart, settings.quietHoursEnd)
  );
  const skippedTimes = allSlots
    .filter((slot) => isWithinQuietHours(slot.time, settings.quietHoursStart, settings.quietHoursEnd))
    .map((slot) => slot.time);

  for (const slot of slots) {
    const { hour, minute } = parseTime(slot.time);
    const quote = getRandomQuote(circumstances, quoteLanguage, undefined, hiddenQuoteIds);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.title'),
        body: quote.text,
        data: { quoteId: quote.id },
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
        if (snoozeUntil && date.getTime() < snoozeUntil) continue; // falls inside the snooze

        const quote = getRandomQuoteForEvent(event.type, quoteLanguage, undefined, hiddenQuoteIds);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: offsetDays < 0 ? i18n.t('notifications.beforeEventTitle') : i18n.t('notifications.afterEventTitle'),
            body: quote.text,
            data: { quoteId: quote.id },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId },
        });
        eventReminderCount++;
      }
    }
  }

  return { scheduledCount: slots.length + eventReminderCount, skippedTimes };
}
