// Weekday/month names per language, for formatting dates and times by hand
// instead of Date#toLocaleDateString — there's no real Intl locale for
// Darija written in Latin letters, so every language is formatted the same
// simple way here rather than relying on the device's ICU data.

import type { Language } from '../data/languages';
import { dateToISO, isoToDate, parseTime, timeOf } from '../services/dates';

// Sunday-first, matching Date#getDay().
export const WEEKDAYS_SHORT: Record<Language, string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  fr: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
  es: ['dom.', 'lun.', 'mar.', 'mié.', 'jue.', 'vie.', 'sáb.'],
  // Standard Darija day names, written out (no common short form).
  ary: ['Lhed', 'Tnin', 'Tlat', 'Larb3a', 'Lkhmis', 'Jem3a', 'Sebt'],
};

export const MONTHS_SHORT: Record<Language, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  es: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'],
  // The Gregorian month names actually used day-to-day in Morocco (French-
  // derived), not the Levantine Arabic set.
  ary: [
    'Yanvir', 'Febrayer', 'Mars', 'Avril', 'Mayo', 'Yonyo',
    'Yolyoz', 'Ghoucht', 'Chotanbir', 'Oktobr', 'Nowanbir', 'Dejanbir',
  ],
};

// "YYYY-MM-DD" -> "Mon, Jan 5" in English. French, Spanish, and Darija read
// better day-first, the order each actually uses for a short date like this.
export function formatDateDisplay(iso: string, language: Language): string {
  const date = isoToDate(iso);
  const weekday = WEEKDAYS_SHORT[language][date.getDay()];
  const month = MONTHS_SHORT[language][date.getMonth()];
  const day = date.getDate();
  return language === 'en' ? `${weekday}, ${month} ${day}` : `${weekday} ${day} ${month}`;
}

// "HH:mm" -> English keeps the 12-hour "9:00 AM" it always had; French,
// Spanish, and Darija use the plain 24-hour clock that's standard in all
// three, so there's no AM/PM wording to translate.
export function formatTimeDisplay(hhmm: string, language: Language): string {
  const { hour, minute } = parseTime(hhmm);
  if (language !== 'en') {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  const period = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

// A specific moment, e.g. "Sat, Oct 11, 9:00 AM".
export function formatMomentDisplay(date: Date, language: Language): string {
  return `${formatDateDisplay(dateToISO(date), language)}, ${formatTimeDisplay(timeOf(date), language)}`;
}
