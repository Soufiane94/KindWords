// Schedules local notifications that deliver a kind word on the device's own
// clock. No server is involved — everything here runs on-device.
//
// Since Phase 7, every kind word is its own one-time notification, lined up
// ahead of time by reminderPlan.ts (it used to be one repeating notification
// per time slot, which sent the same quote every day until the app was
// opened again). That's what lets each one carry a different quote, slip in
// a personal note now and then, ease off gently when the app goes unopened,
// and pick back up on its own after a pause. The whole plan is cancelled and
// rebuilt from scratch whenever the app opens or something changes, so
// there are no individual notification ids to keep track of. Since Phase 8
// it also reminds the user, on the day, to send a note they wrote for
// someone else.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getRandomQuote, getRandomQuoteForEvent, loadQuotePrefs } from './quotes';
import {
  getActiveSnoozeUntil,
  getCircumstances,
  getEvents,
  getNotes,
  getNotificationSettings,
  getQuoteLanguage,
} from './storage';
import type { NotificationSettings, PersonalNote } from './storage';
import {
  planEventReminders,
  planForSomeoneNote,
  planFutureNote,
  planRegularReminders,
  quietRegularTimes,
} from './reminderPlan';
import { isSameDay, todayISO } from './dates';
import { formatMomentDisplay } from '../i18n/dateNames';
import i18n, { getCurrentUiLanguage } from '../i18n';

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

// When the user has written any personal notes, roughly one regular kind
// word in five is one of those instead of a quote ("now and then"), and
// never two in a row.
const PERSONAL_NOTE_CHANCE = 0.2;

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

// What a reschedule ended up doing, so Settings can describe it in plain
// words. Permission problems are reported explicitly rather than guessed
// from a count of zero (which also happens, legitimately, during a snooze).
export type RescheduleResult =
  | { status: 'off' }
  | { status: 'permission_denied' }
  | {
      status: 'scheduled';
      regularCount: number; // regular kind words lined up (quotes and notes)
      eventReminderCount: number;
      futureNoteCount: number;
      forSomeoneCount: number; // reminders to send a note to someone else
      skippedTimes: string[]; // regular times never sent, for falling inside quiet hours
      pausedUntil: number | null; // an active snooze / "Not today", if any
      nextAt: number | null; // when the very next notification will arrive
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

// "Kind words are paused for today." or "...paused until Sat, Oct 11, 3:30 PM."
export function describePausedUntil(until: number): string {
  if (until === computeSnoozeUntil('tomorrow')) return i18n.t('notifications.pausedForToday');
  return i18n.t('notifications.pausedUntil', {
    when: formatMomentDisplay(new Date(until), getCurrentUiLanguage()),
  });
}

// What a tapped notification should open: the Kind word screen with the
// exact quote that was sent (never a new random one) or the personal note —
// or, for a note the user wrote for someone else (Phase 8), the Send
// screen, ready to pass it on.
export type KindWordParams = { quoteId?: string; noteId?: string };

export type NotificationTarget =
  | { screen: 'KindWord'; params: KindWordParams }
  | { screen: 'SendKindWord'; params: { noteId: string } };

export function extractNotificationTarget(
  response: Notifications.MaybeNotificationResponse
): NotificationTarget | undefined {
  const data = response?.notification.request.content.data;
  if (typeof data?.quoteId === 'string') return { screen: 'KindWord', params: { quoteId: data.quoteId } };
  if (typeof data?.noteId === 'string') return { screen: 'KindWord', params: { noteId: data.noteId } };
  if (typeof data?.sendNoteId === 'string') {
    return { screen: 'SendKindWord', params: { noteId: data.sendNoteId } };
  }
  return undefined;
}

function noteTitle(note: PersonalNote): string {
  if (note.kind === 'loved_one') {
    return i18n.t('notifications.lovedOneTitle', { name: note.from || i18n.t('notes.someoneWhoLovesYou') });
  }
  if (note.kind === 'future') return i18n.t('notifications.futureNoteTitle');
  return i18n.t('notifications.selfNoteTitle');
}

async function scheduleAt(
  date: Date,
  content: { title: string; body: string; data: Record<string, string> },
  channelId: string | undefined
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId },
  });
}

// Reschedules can be started from several places at nearly the same moment
// (the app opening, saving settings, editing an event). Each one cancels
// everything and then schedules from scratch, so two running side by side
// could interleave and leave duplicates — or drop a new event's reminders.
// Chaining them makes each wait for the previous one to finish.
let rescheduleQueue: Promise<unknown> = Promise.resolve();

// Cancels every notification this app has scheduled, then lines up fresh
// ones (with freshly-picked quotes) from the latest saved settings,
// circumstances, events, and notes. Safe to call whenever any of those
// change, or the app opens. Only Settings' Save button passes
// `askPermission`, so the system permission prompt never pops up unasked.
export function rescheduleAllNotifications(
  options: { askPermission?: boolean } = {}
): Promise<RescheduleResult> {
  const run = rescheduleQueue.then(() => rescheduleNow(options.askPermission ?? false));
  rescheduleQueue = run.catch(() => {});
  return run;
}

async function rescheduleNow(askPermission: boolean): Promise<RescheduleResult> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const settings = await getNotificationSettings();
  if (!settings.enabled) return { status: 'off' };

  const granted = askPermission
    ? await requestNotificationPermissions()
    : (await Notifications.getPermissionsAsync()).granted;
  if (!granted) return { status: 'permission_denied' };

  const [circumstances, events, notes, quoteLanguage, prefs, snoozeUntil] = await Promise.all([
    getCircumstances(),
    getEvents(),
    getNotes(),
    getQuoteLanguage(),
    loadQuotePrefs(),
    getActiveSnoozeUntil(),
  ]);
  const channelId = await ensureAndroidChannel(settings.lockScreenVisibility);
  const now = new Date();
  const scheduledDates: Date[] = [];

  // Today's check-in only describes today, so kind words on later days
  // don't lean on it.
  const prefsFor = (date: Date) => ({ ...prefs, checkInMood: isSameDay(date, now) ? prefs.checkInMood : null });

  // Event reminders and notes tied to a day (to future-you, or for someone
  // else) are placed first, and regular kind words make room around them.
  const eventReminders = events.flatMap((event) =>
    planEventReminders(event, settings, now, snoozeUntil).map((reminder) => ({ event, ...reminder }))
  );
  for (const { event, date, kind } of eventReminders) {
    const quote = getRandomQuoteForEvent(event.type, quoteLanguage, prefsFor(date));
    await scheduleAt(
      date,
      {
        title: kind === 'before' ? i18n.t('notifications.beforeEventTitle') : i18n.t('notifications.afterEventTitle'),
        body: quote.text,
        data: { quoteId: quote.id },
      },
      channelId
    );
    scheduledDates.push(date);
  }

  let futureNoteCount = 0;
  for (const note of notes) {
    const date = planFutureNote(note, settings, now, snoozeUntil);
    if (!date) continue;
    await scheduleAt(date, { title: noteTitle(note), body: note.text, data: { noteId: note.id } }, channelId);
    scheduledDates.push(date);
    futureNoteCount++;
  }

  // A note for someone else is the user's to send, so on that person's day
  // it comes as a reminder that opens the Send screen (see
  // extractNotificationTarget) rather than as a kind word for the user.
  let forSomeoneCount = 0;
  for (const note of notes) {
    const date = planForSomeoneNote(note, settings, now);
    if (!date) continue;
    const name = note.to || i18n.t('notes.someoneYouLove');
    await scheduleAt(
      date,
      { title: i18n.t('notifications.forSomeoneTitle', { name }), body: note.text, data: { sendNoteId: note.id } },
      channelId
    );
    scheduledDates.push(date);
    forSomeoneCount++;
  }

  // Notes to yourself and loved ones' messages can show up any time; a note
  // to future-you joins them once its own day has passed, so it can't turn
  // up early and spoil the surprise. Notes for someone else never do —
  // they were written for another person.
  const today = todayISO();
  const personalNotes = notes.filter(
    (note) =>
      note.kind === 'self' ||
      note.kind === 'loved_one' ||
      (note.kind === 'future' && note.deliverOn !== undefined && note.deliverOn < today)
  );

  const regularDates = planRegularReminders(settings, now, snoozeUntil, [...scheduledDates]);
  const usedQuoteIds: string[] = [];
  let lastWasNote = false;
  for (const date of regularDates) {
    if (personalNotes.length > 0 && !lastWasNote && Math.random() < PERSONAL_NOTE_CHANCE) {
      const note = personalNotes[Math.floor(Math.random() * personalNotes.length)];
      await scheduleAt(date, { title: noteTitle(note), body: note.text, data: { noteId: note.id } }, channelId);
      lastWasNote = true;
    } else {
      // Avoid repeating a quote within the plan until the matching ones run out.
      const quote = getRandomQuote(circumstances, quoteLanguage, { ...prefsFor(date), avoidIds: usedQuoteIds });
      usedQuoteIds.push(quote.id);
      await scheduleAt(
        date,
        { title: i18n.t('notifications.title'), body: quote.text, data: { quoteId: quote.id } },
        channelId
      );
      lastWasNote = false;
    }
    scheduledDates.push(date);
  }

  const times = scheduledDates.map((date) => date.getTime());
  return {
    status: 'scheduled',
    regularCount: regularDates.length,
    eventReminderCount: eventReminders.length,
    futureNoteCount,
    forSomeoneCount,
    skippedTimes: quietRegularTimes(settings),
    pausedUntil: snoozeUntil,
    nextAt: times.length > 0 ? Math.min(...times) : null,
  };
}
