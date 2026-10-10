// Works out *when* kind words should arrive. This is pure date math with no
// expo-notifications calls, so the Events and Settings screens can show
// exactly the dates the scheduler will use, and the rules can be read (and
// checked) on their own. notifications.ts turns these plans into real
// notifications.

import type { CalendarEvent, NotificationSettings, PersonalNote } from './storage';
import { addDays, addHours, atTime, isoToDate, isSameDay, parseTime, sameDayInYear, timeOf } from './dates';

// Mon/Wed/Fri, as Date#getDay() numbers (0 = Sunday).
const THREE_PER_WEEK_DAYS = [1, 3, 5];

// Kind words for an event without a time, and reminders to send a note for
// someone else's day, arrive at this local time, so adding one doesn't mean
// picking yet another time.
export const EVENT_REMINDER_TIME = '09:00';

// An event with a time (9F): the "before" kind word comes this many hours
// before it (the first that isn't past or inside quiet hours)...
const HOURS_BEFORE_TIMED_EVENT = [2, 1];
// ...or else the evening before, and the "after" one that evening: at this
// time, or this many hours after the event if it's later in the day.
const EVENING_TIME = '19:00';
const HOURS_AFTER_TIMED_EVENT = 2;

// Regular kind words are lined up as separate one-time notifications (each
// with its own quote), up to this many days ahead and at most this many at
// once. The plan is rebuilt every time the app opens, so these limits only
// matter for someone who stays away for weeks. (iOS keeps just the 64
// soonest pending notifications, so this stays under that, with room left
// for event reminders and notes.)
const PLAN_DAYS = 60;
const MAX_REGULAR_REMINDERS = 50;

// A regular kind word that would land this close to an event reminder or a
// note is left out, so two notifications don't arrive at once.
const BUSY_WINDOW_MS = 60 * 60 * 1000;

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

function isQuiet(date: Date, settings: NotificationSettings): boolean {
  return isWithinQuietHours(timeOf(date), settings.quietHoursStart, settings.quietHoursEnd);
}

// The times of day regular kind words go out at: "daily" and "three per
// week" use only the first time, "custom" uses all of them — without
// duplicates (two identical times would just send two at once), earliest
// first.
export function regularTimes(settings: NotificationSettings): string[] {
  const times = settings.frequency === 'custom' ? settings.times : settings.times.slice(0, 1);
  return [...new Set(times)].sort();
}

// Regular times that fall inside quiet hours, which are never sent — so
// Settings can tell the user which ones got skipped.
export function quietRegularTimes(settings: NotificationSettings): string[] {
  return regularTimes(settings).filter((time) =>
    isWithinQuietHours(time, settings.quietHoursStart, settings.quietHoursEnd)
  );
}

// Gentle pacing (Phase 7). The plan is rebuilt every time the app is
// opened, so it can assume nothing gets opened in between. The first few
// kind words keep to the user's schedule exactly; if they keep going by
// with the app left unopened, each next one waits a little longer: about
// every other day, then every few days, then about once a week. Opening
// the app starts the count over, so anyone who drops in now and then never
// notices it — no streaks, nothing to catch up on.
function minHoursBetween(sentSoFar: number): number {
  if (sentSoFar < 5) return 0;
  if (sentSoFar < 9) return 40;
  if (sentSoFar < 13) return 88;
  return 160;
}

// When regular kind words should go out, from `now` on. Moments inside
// quiet hours or a snooze are simply skipped (not shifted), as are any
// within an hour of `busy` moments (event reminders and notes).
export function planRegularReminders(
  settings: NotificationSettings,
  now: Date,
  snoozeUntil: number | null,
  busy: Date[] = []
): Date[] {
  const times = regularTimes(settings).filter(
    (time) => !isWithinQuietHours(time, settings.quietHoursStart, settings.quietHoursEnd)
  );
  const planned: Date[] = [];

  for (let offset = 0; offset < PLAN_DAYS; offset++) {
    const day = addDays(now, offset);
    if (settings.frequency === 'three_per_week' && !THREE_PER_WEEK_DAYS.includes(day.getDay())) {
      continue;
    }

    for (const time of times) {
      const moment = atTime(day, time);
      if (moment <= now) continue;
      if (snoozeUntil !== null && moment.getTime() < snoozeUntil) continue;
      if (busy.some((other) => Math.abs(other.getTime() - moment.getTime()) < BUSY_WINDOW_MS)) continue;

      const previous = planned[planned.length - 1];
      const minGapMs = minHoursBetween(planned.length) * 60 * 60 * 1000;
      if (settings.gentlePacing && previous && moment.getTime() - previous.getTime() < minGapMs) {
        continue;
      }

      planned.push(moment);
      if (planned.length >= MAX_REGULAR_REMINDERS) return planned;
    }
  }
  return planned;
}

export type EventReminder = { date: Date; kind: 'before' | 'after' };

// The days a yearly date (an event, or someone else's day) could fall on
// right now: last year's, this year's and next year's, soonest first,
// leaving out any before the date itself (a yearly date set in the future
// starts there). Callers plan only the first one with something still to
// come; the next is planned once it has passed, since the plan is rebuilt
// every time the app opens.
function yearlyDays(iso: string, now: Date): Date[] {
  const first = isoToDate(iso);
  const year = now.getFullYear();
  return [year - 1, year, year + 1].map((y) => sameDayInYear(iso, y)).filter((day) => day >= first);
}

// When the kind words for one calendar event arrive. For an event that
// comes back every year (9F), that's around its next time.
export function planEventReminders(
  event: CalendarEvent,
  settings: NotificationSettings,
  now: Date,
  snoozeUntil: number | null
): EventReminder[] {
  const days = event.repeatsYearly ? yearlyDays(event.date, now) : [isoToDate(event.date)];
  for (const day of days) {
    const reminders = event.time
      ? planTimedEvent(day, event.time, settings, now, snoozeUntil)
      : planAllDayEvent(day, settings, now, snoozeUntil);
    if (reminders.length > 0) return reminders;
  }
  return [];
}

// An event without a time: the day before and the day after, at 9:00. If
// the day-before one can't happen anymore — it's already past (say the
// event was added the evening before) or it falls inside a snooze — it
// comes on the morning of the event instead, rather than being silently
// dropped. Nothing is sent if 9:00 is in quiet hours.
function planAllDayEvent(
  eventDay: Date,
  settings: NotificationSettings,
  now: Date,
  snoozeUntil: number | null
): EventReminder[] {
  if (isWithinQuietHours(EVENT_REMINDER_TIME, settings.quietHoursStart, settings.quietHoursEnd)) {
    return [];
  }

  const canSend = (date: Date) => date > now && (snoozeUntil === null || date.getTime() >= snoozeUntil);
  const reminders: EventReminder[] = [];

  const dayBefore = atTime(addDays(eventDay, -1), EVENT_REMINDER_TIME);
  const morningOf = atTime(eventDay, EVENT_REMINDER_TIME);
  if (canSend(dayBefore)) {
    reminders.push({ date: dayBefore, kind: 'before' });
  } else if (canSend(morningOf)) {
    reminders.push({ date: morningOf, kind: 'before' });
  }

  const dayAfter = atTime(addDays(eventDay, 1), EVENT_REMINDER_TIME);
  if (canSend(dayAfter)) {
    reminders.push({ date: dayAfter, kind: 'after' });
  }
  return reminders;
}

// An event with a time (9F): the "before" kind word two hours ahead of it,
// or one hour if two would be past or inside quiet hours, or else at 19:00
// the evening before. The "after" one that same evening, at 19:00 (or two
// hours after the event, when it starts after 17:00), or else at 9:00 the
// next morning. Every moment skips quiet hours and snoozes, and one that
// can't be sent at all is left out.
function planTimedEvent(
  eventDay: Date,
  time: string,
  settings: NotificationSettings,
  now: Date,
  snoozeUntil: number | null
): EventReminder[] {
  const canSend = (date: Date) =>
    date > now && (snoozeUntil === null || date.getTime() >= snoozeUntil) && !isQuiet(date, settings);
  const start = atTime(eventDay, time);
  const reminders: EventReminder[] = [];

  const before = [
    ...HOURS_BEFORE_TIMED_EVENT.map((hours) => addHours(start, -hours)),
    atTime(addDays(eventDay, -1), EVENING_TIME),
  ].find(canSend);
  if (before) reminders.push({ date: before, kind: 'before' });

  const evening = atTime(eventDay, EVENING_TIME);
  const afterEnd = addHours(start, HOURS_AFTER_TIMED_EVENT);
  const sameEvening = afterEnd > evening ? afterEnd : evening;
  const after = [
    ...(isSameDay(sameEvening, eventDay) ? [sameEvening] : []),
    atTime(addDays(eventDay, 1), EVENT_REMINDER_TIME),
  ].find(canSend);
  if (after) reminders.push({ date: after, kind: 'after' });
  return reminders;
}

// Moves `date` forward, if needed, past the end of a snooze and then out of
// quiet hours.
function nextFreeMoment(date: Date, settings: NotificationSettings, snoozeUntil: number | null): Date {
  let moment = date;
  if (snoozeUntil !== null && moment.getTime() < snoozeUntil) {
    moment = new Date(snoozeUntil);
  }
  if (isQuiet(moment, settings)) {
    let quietEnds = atTime(moment, settings.quietHoursEnd);
    if (quietEnds <= moment) quietEnds = addDays(quietEnds, 1);
    moment = quietEnds;
  }
  return moment;
}

// When a note to future-you arrives: on the day the user picked, at their
// first kind-word time. It's a one-time letter, so unlike a regular kind
// word it isn't dropped by quiet hours or a snooze — it waits them out and
// arrives right after. Returns null once its day has come and gone.
export function planFutureNote(
  note: PersonalNote,
  settings: NotificationSettings,
  now: Date,
  snoozeUntil: number | null
): Date | null {
  if (note.kind !== 'future' || !note.deliverOn) return null;
  const onItsDay = atTime(isoToDate(note.deliverOn), settings.times[0] ?? EVENT_REMINDER_TIME);
  if (onItsDay <= now) return null;
  return nextFreeMoment(onItsDay, settings, snoozeUntil);
}

// When the user is reminded to send a note they wrote for someone else's
// day (Phase 8): at 9:00 that morning, like event reminders, so there's
// still the whole day to send it. Like a note to future-you, it waits out
// quiet hours rather than being dropped — but not a snooze: a pause is
// about kind words for the user, and waiting one out could mean missing the
// other person's day. Returns null once that moment has passed, except for
// a day that comes back every year (a birthday, 9F): then it's next year's.
export function planForSomeoneNote(
  note: PersonalNote,
  settings: NotificationSettings,
  now: Date
): Date | null {
  if (note.kind !== 'for_someone' || !note.deliverOn) return null;
  const days = note.repeatsYearly ? yearlyDays(note.deliverOn, now) : [isoToDate(note.deliverOn)];
  for (const day of days) {
    const moment = nextFreeMoment(atTime(day, EVENT_REMINDER_TIME), settings, null);
    if (moment > now) return moment;
  }
  return null;
}
