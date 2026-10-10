// Small date helpers shared by storage, scheduling, and screens. Days
// without a time are kept as plain "YYYY-MM-DD" strings and times of day as
// "HH:mm" strings, both in the phone's local time, so the rest of the app
// rarely has to touch Date objects directly.

export function dateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isoToDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayISO(): string {
  return dateToISO(new Date());
}

export function parseTime(hhmm: string): { hour: number; minute: number } {
  const [hour, minute] = hhmm.split(':').map(Number);
  return { hour, minute };
}

// "HH:mm" for a Date's local time of day.
export function timeOf(date: Date): string {
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

// The same calendar day as `day`, at the given "HH:mm".
export function atTime(day: Date, hhmm: string): Date {
  const { hour, minute } = parseTime(hhmm);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
}

// Moves by calendar days rather than adding 24 hours, so a daylight-saving
// change never turns a 9:00 reminder into an 8:00 or 10:00 one.
export function addDays(date: Date, days: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}
