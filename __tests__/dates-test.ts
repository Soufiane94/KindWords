// Calendar-day date math (src/services/dates.ts). Every test reads in local
// time, so it holds in any time zone, clock changes included.

import { addDays, addHours, atTime, dateToISO, nextYearlyDay, sameDayInYear, timeOf } from '../src/services/dates';
import { clockChanges } from '../jest/clockChanges';

function local(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute);
}

describe('addDays', () => {
  test('keeps the time of day across every clock change', () => {
    for (const change of clockChanges(local(2026, 1, 1), local(2027, 12, 31))) {
      const dayBefore = atTime(addDays(change.at, -1), '09:00');
      const dayOf = addDays(dayBefore, 1);
      expect(timeOf(dayOf)).toBe('09:00');
      expect(dateToISO(dayOf)).toBe(dateToISO(change.at));
      // The real time between them is a day plus or minus the change.
      expect((dayOf.getTime() - dayBefore.getTime()) / 60000).toBe(24 * 60 - change.shiftMinutes);
    }
  });

  test('moves across months and years', () => {
    expect(dateToISO(addDays(local(2026, 12, 31), 1))).toBe('2027-01-01');
    expect(dateToISO(addDays(local(2027, 3, 1), -1))).toBe('2027-02-28');
  });
});

describe('addHours', () => {
  test('moves on the clock, across midnight', () => {
    const moment = addHours(local(2026, 10, 20, 1, 0), -2);
    expect(dateToISO(moment)).toBe('2026-10-19');
    expect(timeOf(moment)).toBe('23:00');
  });
});

describe('yearly dates', () => {
  test('February 29 falls on February 28 in other years', () => {
    expect(dateToISO(sameDayInYear('2024-02-29', 2027))).toBe('2027-02-28');
    expect(dateToISO(sameDayInYear('2024-02-29', 2028))).toBe('2028-02-29');
  });

  test('the next time a yearly date comes round', () => {
    expect(dateToISO(nextYearlyDay('2019-03-14', local(2026, 10, 10)))).toBe('2027-03-14');
    expect(dateToISO(nextYearlyDay('2019-10-10', local(2026, 10, 10, 18)))).toBe('2026-10-10');
    // Never before the date itself.
    expect(dateToISO(nextYearlyDay('2027-06-01', local(2026, 10, 10)))).toBe('2027-06-01');
  });
});
