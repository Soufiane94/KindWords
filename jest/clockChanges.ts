// For the tests (9G): when the local clock changes between two moments, read
// straight from the time zone database by comparing UTC offsets hour by
// hour. Stepping in real hours is right here: this finds the changes, it
// doesn't schedule anything.

export type ClockChange = {
  at: Date; // the first moment after the change
  shiftMinutes: number; // +60 when clocks go forward an hour, -60 when back
};

export function clockChanges(from: Date, to: Date): ClockChange[] {
  const changes: ClockChange[] = [];
  let previous = from.getTimezoneOffset();
  for (let time = from.getTime(); time <= to.getTime(); time += 60 * 60 * 1000) {
    const offset = new Date(time).getTimezoneOffset();
    if (offset !== previous) {
      // getTimezoneOffset() counts minutes *behind* UTC, so going forward
      // makes it smaller.
      changes.push({ at: new Date(time), shiftMinutes: previous - offset });
      previous = offset;
    }
  }
  return changes;
}

// The zone the tests are running in.
export function currentTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
