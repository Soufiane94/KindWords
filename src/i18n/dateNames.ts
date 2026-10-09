// Weekday/month names per language, for formatting dates and times by hand
// instead of Date#toLocaleDateString — there's no real Intl locale for
// Darija written in Latin letters, so every language is formatted the same
// simple way here rather than relying on the device's ICU data.

import type { Language } from '../data/languages';

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
