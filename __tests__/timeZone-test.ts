// Makes sure `npm test` really runs in the time zone it says (see
// jest/timeZoneEnvironment.js): if it didn't, the clock-change tests would
// quietly test the computer's own zone instead.

import { clockChanges, currentTimeZone } from '../jest/clockChanges';

const requested = process.env.KINDWORDS_TEST_TZ;

(requested ? test : test.skip)(`runs in ${requested ?? 'the requested time zone'}`, () => {
  expect(currentTimeZone()).toBe(requested);
});

(requested === 'Europe/Paris' ? test : test.skip)('France changes its clocks on the expected nights', () => {
  const days = clockChanges(new Date(2026, 8, 1), new Date(2027, 5, 1)).map((change) => change.at.toDateString());
  expect(days).toEqual([new Date(2026, 9, 25).toDateString(), new Date(2027, 2, 28).toDateString()]);
});

(requested === 'Africa/Casablanca' ? test : test.skip)('Morocco changes its clocks around Ramadan 2027', () => {
  // Back an hour before Ramadan, forward after it. The dates come from the
  // time zone database, which predicts them from the calendar.
  const changes = clockChanges(new Date(2027, 0, 1), new Date(2027, 4, 1));
  expect(changes.map((change) => change.shiftMinutes)).toEqual([-60, 60]);
});
