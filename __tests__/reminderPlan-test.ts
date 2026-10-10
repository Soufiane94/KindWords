// When kind words arrive (src/services/reminderPlan.ts): pure date math, so
// every rule can be checked without a phone. Times are local wall-clock
// times, so these tests hold in both time zones `npm test` runs them in.

import {
  isWithinQuietHours,
  planEventReminders,
  planForSomeoneNote,
  planFutureNote,
  planRegularReminders,
  quietRegularTimes,
  regularTimes,
} from '../src/services/reminderPlan';
import type { CalendarEvent, NotificationSettings, PersonalNote } from '../src/services/storage';
import { atTime, addDays, dateToISO, timeOf } from '../src/services/dates';
import { clockChanges } from '../jest/clockChanges';

const BASE: NotificationSettings = {
  enabled: true,
  frequency: 'daily',
  times: ['09:00'],
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  lockScreenVisibility: 'private',
  gentlePacing: false,
};

function settings(patch: Partial<NotificationSettings> = {}): NotificationSettings {
  return { ...BASE, ...patch };
}

function local(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute);
}

// "2026-10-10 09:00", easy to compare.
function moment(date: Date): string {
  return `${dateToISO(date)} ${timeOf(date)}`;
}

function event(patch: Partial<CalendarEvent> = {}): CalendarEvent {
  return { id: 'e1', title: 'Exam', type: 'exam', date: '2026-10-20', ...patch };
}

function reminders(e: CalendarEvent, now: Date, s = settings(), snoozeUntil: number | null = null) {
  return planEventReminders(e, s, now, snoozeUntil).map((r) => `${r.kind} ${moment(r.date)}`);
}

const NOW = local(2026, 10, 10, 8, 0); // a Saturday morning

describe('quiet hours', () => {
  test('a window that wraps past midnight', () => {
    expect(isWithinQuietHours('23:00', '22:00', '07:00')).toBe(true);
    expect(isWithinQuietHours('22:00', '22:00', '07:00')).toBe(true);
    expect(isWithinQuietHours('06:59', '22:00', '07:00')).toBe(true);
    expect(isWithinQuietHours('07:00', '22:00', '07:00')).toBe(false);
    expect(isWithinQuietHours('12:00', '22:00', '07:00')).toBe(false);
  });

  test('a window within the day, and an empty one', () => {
    expect(isWithinQuietHours('14:00', '13:00', '15:00')).toBe(true);
    expect(isWithinQuietHours('15:00', '13:00', '15:00')).toBe(false);
    expect(isWithinQuietHours('03:00', '22:00', '22:00')).toBe(false);
  });

  test('regular times inside quiet hours are skipped, not moved', () => {
    const s = settings({ frequency: 'custom', times: ['06:30', '09:00', '23:00'] });
    expect(quietRegularTimes(s)).toEqual(['06:30', '23:00']);
    const plan = planRegularReminders(s, NOW, null);
    expect(new Set(plan.map(timeOf))).toEqual(new Set(['09:00']));
  });
});

describe('regular kind words', () => {
  test('daily at the chosen time, starting today if it is still ahead', () => {
    const plan = planRegularReminders(settings(), NOW, null);
    expect(plan.slice(0, 3).map(moment)).toEqual(['2026-10-10 09:00', '2026-10-11 09:00', '2026-10-12 09:00']);
    expect(moment(planRegularReminders(settings(), local(2026, 10, 10, 10, 0), null)[0])).toBe('2026-10-11 09:00');
  });

  test('three times a week: Monday, Wednesday and Friday', () => {
    const plan = planRegularReminders(settings({ frequency: 'three_per_week' }), NOW, null);
    expect(plan.length).toBeGreaterThan(0);
    expect(new Set(plan.map((date) => date.getDay()))).toEqual(new Set([1, 3, 5]));
  });

  test('duplicate custom times only send once', () => {
    const s = settings({ frequency: 'custom', times: ['12:00', '09:00', '12:00'] });
    expect(regularTimes(s)).toEqual(['09:00', '12:00']);
    const plan = planRegularReminders(s, NOW, null).map(moment);
    expect(new Set(plan).size).toBe(plan.length);
  });

  test('at most 50 are lined up at once', () => {
    expect(planRegularReminders(settings(), NOW, null)).toHaveLength(50);
    const busy = settings({ frequency: 'custom', times: ['09:00', '12:00', '15:00', '18:00'] });
    expect(planRegularReminders(busy, NOW, null)).toHaveLength(50);
  });

  test('a snooze or "Not today" skips what falls inside it, then picks up again', () => {
    const tomorrow = local(2026, 10, 11).getTime();
    expect(moment(planRegularReminders(settings(), NOW, tomorrow)[0])).toBe('2026-10-11 09:00');
    const threeDays = NOW.getTime() + 3 * 24 * 60 * 60 * 1000;
    expect(moment(planRegularReminders(settings(), NOW, threeDays)[0])).toBe('2026-10-13 09:00');
  });

  test('no regular kind word within an hour of an event reminder or a note', () => {
    const plan = planRegularReminders(settings(), NOW, null, [local(2026, 10, 11, 9, 30)]).map(moment);
    expect(plan).not.toContain('2026-10-11 09:00');
    expect(plan).toContain('2026-10-12 09:00');
  });

  test('gentle pacing: 5 as usual, then every other day, every 4 days, then weekly', () => {
    const plan = planRegularReminders(settings({ gentlePacing: true }), NOW, null).map(dateToISO);
    expect(plan).toEqual([
      '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14',
      '2026-10-16', '2026-10-18', '2026-10-20', '2026-10-22',
      '2026-10-26', '2026-10-30', '2026-11-03', '2026-11-07',
      '2026-11-14', '2026-11-21', '2026-11-28', '2026-12-05',
    ]);
  });
});

describe('clock changes', () => {
  // Whatever the time zone, kind words keep their local time through every
  // change the time zone database knows of (France's in October and March,
  // Morocco's around Ramadan).
  const changes = clockChanges(local(2026, 9, 1), local(2027, 12, 31));

  test('the zone has clock changes to test', () => {
    expect(changes.length).toBeGreaterThan(0);
  });

  test('daily kind words stay at 9:00 through each change', () => {
    for (const change of changes) {
      const now = atTime(addDays(change.at, -3), '08:00');
      const plan = planRegularReminders(settings(), now, null).slice(0, 7);
      expect(plan.map(timeOf)).toEqual(Array(7).fill('09:00'));
      expect(plan.map(dateToISO)).toContain(dateToISO(change.at));
    }
  });

  test('quiet hours still hold through each change', () => {
    for (const change of changes) {
      const now = atTime(addDays(change.at, -2), '12:00');
      const s = settings({ frequency: 'custom', times: ['06:30', '07:30'] });
      const plan = planRegularReminders(s, now, null).slice(0, 5);
      expect(plan.map(timeOf)).toEqual(Array(5).fill('07:30'));
    }
  });

  test('event kind words stay at 9:00 around a change', () => {
    for (const change of changes) {
      const e = event({ date: dateToISO(change.at) });
      const now = atTime(addDays(change.at, -5), '12:00');
      expect(reminders(e, now).map((r) => r.slice(-5))).toEqual(['09:00', '09:00']);
    }
  });
});

describe('events without a time', () => {
  test('the day before and the day after, at 9:00', () => {
    expect(reminders(event(), NOW)).toEqual(['before 2026-10-19 09:00', 'after 2026-10-21 09:00']);
  });

  test('added the evening before: comes the morning of instead', () => {
    const e = event({ date: '2026-10-11' });
    expect(reminders(e, local(2026, 10, 10, 20, 0))).toEqual(['before 2026-10-11 09:00', 'after 2026-10-12 09:00']);
  });

  test('on the day itself, after 9:00: only the day after', () => {
    expect(reminders(event({ date: '2026-10-10' }), local(2026, 10, 10, 10, 0))).toEqual(['after 2026-10-11 09:00']);
  });

  test('a snooze over the day before moves "before" to the morning of', () => {
    const e = event({ date: '2026-10-12' });
    const snooze = local(2026, 10, 11, 12, 0).getTime();
    expect(reminders(e, NOW, settings(), snooze)).toEqual(['before 2026-10-12 09:00', 'after 2026-10-13 09:00']);
  });

  test('nothing when quiet hours cover 9:00, or once it has passed', () => {
    expect(reminders(event(), NOW, settings({ quietHoursStart: '21:00', quietHoursEnd: '10:00' }))).toEqual([]);
    expect(reminders(event({ date: '2026-09-01' }), NOW)).toEqual([]);
  });
});

describe('events with a time', () => {
  test('two hours before, and that evening', () => {
    expect(reminders(event({ time: '14:00' }), NOW)).toEqual(['before 2026-10-20 12:00', 'after 2026-10-20 19:00']);
  });

  test('one hour before when two would be in quiet hours', () => {
    expect(reminders(event({ time: '08:00' }), NOW)[0]).toBe('before 2026-10-20 07:00');
  });

  test('the evening before when both would be in quiet hours', () => {
    expect(reminders(event({ time: '07:30' }), NOW)[0]).toBe('before 2026-10-19 19:00');
  });

  test('one hour before when two hours before has passed', () => {
    const now = local(2026, 10, 20, 12, 30);
    expect(reminders(event({ time: '14:00' }), now)).toEqual(['before 2026-10-20 13:00', 'after 2026-10-20 19:00']);
  });

  test('an evening event: two hours after it', () => {
    expect(reminders(event({ time: '18:30' }), NOW)[1]).toBe('after 2026-10-20 20:30');
  });

  test('a late event, or a quiet evening: the next morning at 9:00', () => {
    expect(reminders(event({ time: '23:00' }), NOW)[1]).toBe('after 2026-10-21 09:00');
    const quietEvenings = settings({ quietHoursStart: '18:00', quietHoursEnd: '08:00' });
    expect(reminders(event({ time: '14:00' }), NOW, quietEvenings)[1]).toBe('after 2026-10-21 09:00');
  });

  test('a snooze still applies (and is over at the moment it ends)', () => {
    const untilHalfPast = local(2026, 10, 20, 13, 30).getTime();
    expect(reminders(event({ time: '14:00' }), NOW, settings(), untilHalfPast)).toEqual(['after 2026-10-20 19:00']);
    const untilOne = local(2026, 10, 20, 13, 0).getTime();
    expect(reminders(event({ time: '14:00' }), NOW, settings(), untilOne)[0]).toBe('before 2026-10-20 13:00');
  });
});

describe('events every year', () => {
  test('around the next time it comes round', () => {
    const e = event({ type: 'grief_anniversary', date: '2019-03-14', repeatsYearly: true });
    expect(reminders(e, NOW)).toEqual(['before 2027-03-13 09:00', 'after 2027-03-15 09:00']);
  });

  test("the day after this year's, before 9:00, is still to come", () => {
    const e = event({ date: '2019-03-14', repeatsYearly: true });
    expect(reminders(e, local(2027, 3, 15, 8, 0))).toEqual(['after 2027-03-15 09:00']);
    const newYearsEve = event({ date: '2020-12-31', repeatsYearly: true });
    expect(reminders(newYearsEve, local(2027, 1, 1, 8, 0))).toEqual(['after 2027-01-01 09:00']);
  });

  test('February 29 on February 28, and not before the first time', () => {
    const leapDay = event({ date: '2024-02-29', repeatsYearly: true });
    expect(reminders(leapDay, NOW)).toEqual(['before 2027-02-27 09:00', 'after 2027-03-01 09:00']);
    const startsLater = event({ date: '2027-03-01', repeatsYearly: true });
    expect(reminders(startsLater, local(2026, 2, 1))[0]).toBe('before 2027-02-28 09:00');
  });
});

describe('notes', () => {
  const future: PersonalNote = { id: 'n1', kind: 'future', text: 'Hi', deliverOn: '2026-10-20', createdOn: '2026-10-01' };
  const forSomeone: PersonalNote = {
    id: 'n2',
    kind: 'for_someone',
    text: 'Happy birthday',
    to: 'Yasmine',
    deliverOn: '2026-10-20',
    createdOn: '2026-10-01',
  };

  test('to future-you: on its day, at the first kind-word time', () => {
    expect(moment(planFutureNote(future, settings({ times: ['08:00'] }), NOW, null)!)).toBe('2026-10-20 08:00');
  });

  test('to future-you: waits out quiet hours and a snooze instead of being dropped', () => {
    const quietMorning = settings({ times: ['08:00'], quietHoursEnd: '09:30' });
    expect(moment(planFutureNote(future, quietMorning, NOW, null)!)).toBe('2026-10-20 09:30');
    const snooze = local(2026, 10, 20, 12, 0).getTime();
    expect(moment(planFutureNote(future, settings(), NOW, snooze)!)).toBe('2026-10-20 12:00');
    expect(planFutureNote(future, settings(), local(2026, 10, 21), null)).toBeNull();
  });

  test("for someone else: 9:00 on their day, after quiet hours but not a snooze", () => {
    expect(moment(planForSomeoneNote(forSomeone, settings(), NOW)!)).toBe('2026-10-20 09:00');
    const lateMornings = settings({ quietHoursEnd: '10:00' });
    expect(moment(planForSomeoneNote(forSomeone, lateMornings, NOW)!)).toBe('2026-10-20 10:00');
    expect(planForSomeoneNote(forSomeone, settings(), local(2026, 10, 20, 10, 0))).toBeNull();
  });

  test('for someone else, every year: next year once this one has passed', () => {
    const birthday = { ...forSomeone, deliverOn: '2001-10-20', repeatsYearly: true };
    expect(moment(planForSomeoneNote(birthday, settings(), local(2026, 10, 20, 10, 0))!)).toBe('2027-10-20 09:00');
    expect(moment(planForSomeoneNote(birthday, settings(), NOW)!)).toBe('2026-10-20 09:00');
  });
});
