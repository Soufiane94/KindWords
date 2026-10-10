// Small wrapper around AsyncStorage for the settings this app needs so far.
// Keeping all storage keys and shapes in one place makes it easy to change
// how we persist things later without hunting through every screen.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorldId, WORLD_OPTIONS, DEFAULT_WORLD_ID } from '../data/worlds';
import { Language, isSupportedLanguage } from '../data/languages';
import type { CheckInMood } from '../data/checkIn';
import type { NoteKind } from '../data/noteKinds';
import type { Quote } from './quotes';
import { todayISO } from './dates';
import { getCurrentUiLanguage } from '../i18n';

const KEYS = {
  ONBOARDING_DONE: 'kindwords:onboardingDone',
  CIRCUMSTANCES: 'kindwords:circumstances',
  NOTIFICATION_SETTINGS: 'kindwords:notificationSettings',
  EVENTS: 'kindwords:events',
  FAVORITES: 'kindwords:favorites',
  THEME: 'kindwords:theme',
  HIDDEN_QUOTES: 'kindwords:hiddenQuotes',
  QUOTE_FEEDBACK: 'kindwords:quoteFeedback',
  SNOOZE_UNTIL: 'kindwords:snoozeUntil',
  UI_LANGUAGE: 'kindwords:uiLanguage',
  QUOTE_LANGUAGE: 'kindwords:quoteLanguage',
  NOTES: 'kindwords:notes',
  CHECK_IN: 'kindwords:checkIn',
  CHECK_IN_ENABLED: 'kindwords:checkInEnabled',
  WIDGET_QUOTE_ID: 'kindwords:widgetQuoteId',
};

export type Frequency = 'daily' | 'three_per_week' | 'custom';
export type LockScreenVisibility = 'public' | 'private';

export type NotificationSettings = {
  enabled: boolean;
  frequency: Frequency;
  // Times of day, each as "HH:mm" (24-hour, local time).
  // "daily" and "three_per_week" only ever use the first entry;
  // "custom" can hold several.
  times: string[];
  quietHoursStart: string; // "HH:mm"
  quietHoursEnd: string; // "HH:mm"
  lockScreenVisibility: LockScreenVisibility;
  // Phase 7: space kind words out when the app goes unopened for a while
  // (see minHoursBetween() in reminderPlan.ts).
  gentlePacing: boolean;
};

// Default to "private" on the lock screen: some kind words are about grief
// or illness, which isn't always something someone wants a stranger glancing
// at their phone to see.
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  frequency: 'daily',
  times: ['09:00'],
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  lockScreenVisibility: 'private',
  gentlePacing: true,
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const value = await AsyncStorage.getItem(KEYS.NOTIFICATION_SETTINGS);
  if (!value) return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(value) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export async function setNotificationSettings(settings: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
}

export async function getOnboardingDone(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return value === 'true';
}

export async function setOnboardingDone(done: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, done ? 'true' : 'false');
}

export async function getCircumstances(): Promise<string[]> {
  const value = await AsyncStorage.getItem(KEYS.CIRCUMSTANCES);
  if (!value) return [];
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}

export async function setCircumstances(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CIRCUMSTANCES, JSON.stringify(ids));
}

// A date someone wants a kind word around, e.g. an exam or a grief
// anniversary. `date` is a plain "YYYY-MM-DD" (no time) since reminders are
// scheduled relative to the day, not a specific hour.
export type CalendarEvent = {
  id: string;
  title: string;
  type: string; // matches an id in src/data/eventTypes.ts
  date: string;
};

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getEvents(): Promise<CalendarEvent[]> {
  const value = await AsyncStorage.getItem(KEYS.EVENTS);
  if (!value) return [];
  try {
    return JSON.parse(value) as CalendarEvent[];
  } catch {
    return [];
  }
}

async function setEvents(events: CalendarEvent[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
}

export async function createEvent(data: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  const events = await getEvents();
  const event: CalendarEvent = { ...data, id: generateId() };
  await setEvents([...events, event]);
  return event;
}

export async function updateEvent(event: CalendarEvent): Promise<void> {
  const events = await getEvents();
  await setEvents(events.map((e) => (e.id === event.id ? event : e)));
}

export async function deleteEvent(id: string): Promise<void> {
  const events = await getEvents();
  await setEvents(events.filter((e) => e.id !== id));
}

// A personal note (Phase 7): something the user wrote to themselves or to
// future-them, or a message from someone they love. Like events, these
// only ever live on the phone.
export type PersonalNote = {
  id: string;
  kind: NoteKind;
  text: string;
  from?: string; // 'loved_one' only: who the message is from
  deliverOn?: string; // 'future' only: the "YYYY-MM-DD" it should arrive on
  createdOn: string; // "YYYY-MM-DD"
};

export async function getNotes(): Promise<PersonalNote[]> {
  const value = await AsyncStorage.getItem(KEYS.NOTES);
  if (!value) return [];
  try {
    return JSON.parse(value) as PersonalNote[];
  } catch {
    return [];
  }
}

async function setNotes(notes: PersonalNote[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
}

export async function createNote(data: Omit<PersonalNote, 'id' | 'createdOn'>): Promise<PersonalNote> {
  const notes = await getNotes();
  const note: PersonalNote = { ...data, id: generateId(), createdOn: todayISO() };
  await setNotes([...notes, note]);
  return note;
}

export async function updateNote(note: PersonalNote): Promise<void> {
  const notes = await getNotes();
  await setNotes(notes.map((n) => (n.id === note.id ? note : n)));
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await getNotes();
  await setNotes(notes.filter((n) => n.id !== id));
}

// Favorite quotes, stored as just a list of quote ids — the quote text
// itself always comes from quotes.ts, so there's only one place it can
// drift out of date.
export async function getFavoriteIds(): Promise<string[]> {
  const value = await AsyncStorage.getItem(KEYS.FAVORITES);
  if (!value) return [];
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}

async function setFavoriteIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(ids));
}

// Flips a quote's favorite state and returns whether it's now a favorite,
// so callers can update their UI without a second read.
export async function toggleFavorite(quoteId: string): Promise<boolean> {
  const ids = await getFavoriteIds();
  const isFavorite = ids.includes(quoteId);
  const next = isFavorite ? ids.filter((id) => id !== quoteId) : [...ids, quoteId];
  await setFavoriteIds(next);
  return !isFavorite;
}

// Quotes the user has said "not for me" to. Kept separate from favorites —
// hiding a quote only stops it being picked again, it doesn't touch
// anything already saved.
export async function getHiddenQuoteIds(): Promise<string[]> {
  const value = await AsyncStorage.getItem(KEYS.HIDDEN_QUOTES);
  if (!value) return [];
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}

async function hideQuoteForever(quoteId: string): Promise<void> {
  const ids = await getHiddenQuoteIds();
  if (!ids.includes(quoteId)) {
    await AsyncStorage.setItem(KEYS.HIDDEN_QUOTES, JSON.stringify([...ids, quoteId]));
  }
}

// What "not for me" has taught the app so far: how many disliked quotes had
// each mood, and each circumstance/event tag. Used to make similar quotes
// less likely (never impossible) — see quoteWeight() in quotes.ts.
export type QuoteFeedback = {
  moods: Record<string, number>;
  tags: Record<string, number>;
};

export async function getQuoteFeedback(): Promise<QuoteFeedback> {
  const value = await AsyncStorage.getItem(KEYS.QUOTE_FEEDBACK);
  if (!value) return { moods: {}, tags: {} };
  try {
    return { moods: {}, tags: {}, ...JSON.parse(value) };
  } catch {
    return { moods: {}, tags: {} };
  }
}

// "Not for me" (Phase 7): hides this quote for good and remembers its mood
// and tags, so quotes like it come up less often.
export async function markNotForMe(quote: Quote): Promise<void> {
  await hideQuoteForever(quote.id);
  const feedback = await getQuoteFeedback();
  feedback.moods[quote.mood] = (feedback.moods[quote.mood] ?? 0) + 1;
  for (const tag of [...quote.circumstances, ...quote.eventTypes]) {
    // "other" is on most quotes, so it says nothing about what didn't land.
    if (tag === 'other') continue;
    feedback.tags[tag] = (feedback.tags[tag] ?? 0) + 1;
  }
  await AsyncStorage.setItem(KEYS.QUOTE_FEEDBACK, JSON.stringify(feedback));
}

// Undoes every "not for me": hidden quotes come back, and nothing is
// leaned away from anymore.
export async function forgetNotForMe(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.HIDDEN_QUOTES, KEYS.QUOTE_FEEDBACK]);
}

// A timestamp (ms since epoch) until which notifications are paused, set by
// "Not today" on Home or the "Snooze" menu on the Kind word screen. `null`
// means not snoozed.
export async function getSnoozeUntil(): Promise<number | null> {
  const value = await AsyncStorage.getItem(KEYS.SNOOZE_UNTIL);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// Same as getSnoozeUntil(), but a snooze that has already ended counts as
// no snooze at all.
export async function getActiveSnoozeUntil(): Promise<number | null> {
  const until = await getSnoozeUntil();
  return until !== null && until > Date.now() ? until : null;
}

export async function setSnoozeUntil(timestamp: number | null): Promise<void> {
  if (timestamp === null) {
    await AsyncStorage.removeItem(KEYS.SNOOZE_UNTIL);
  } else {
    await AsyncStorage.setItem(KEYS.SNOOZE_UNTIL, String(timestamp));
  }
}

// Today's answer to the optional check-in (Phase 7). Only today's answer is
// ever kept — tomorrow it simply stops counting, and it's overwritten the
// next time the user answers. `mood: null` means "Not now" was tapped, so
// Home doesn't ask again today.
export type TodayCheckIn = { mood: CheckInMood | null };

export async function getTodayCheckIn(): Promise<TodayCheckIn | null> {
  const value = await AsyncStorage.getItem(KEYS.CHECK_IN);
  if (!value) return null;
  try {
    const stored = JSON.parse(value) as { date: string; mood: CheckInMood | null };
    return stored.date === todayISO() ? { mood: stored.mood } : null;
  } catch {
    return null;
  }
}

export async function setTodayCheckIn(mood: CheckInMood | null): Promise<void> {
  await AsyncStorage.setItem(KEYS.CHECK_IN, JSON.stringify({ date: todayISO(), mood }));
}

export async function clearTodayCheckIn(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.CHECK_IN);
}

// The check-in is optional: on unless the user turns it off in Settings.
export async function getCheckInEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEYS.CHECK_IN_ENABLED);
  return value !== 'false';
}

export async function setCheckInEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.CHECK_IN_ENABLED, enabled ? 'true' : 'false');
}

// The quote the home screen widget is showing, so resizing the widget
// redraws the same one instead of jumping to a new quote.
export async function getWidgetQuoteId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.WIDGET_QUOTE_ID);
}

export async function setWidgetQuoteId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.WIDGET_QUOTE_ID, id);
}

export async function getWorldId(): Promise<WorldId> {
  const value = await AsyncStorage.getItem(KEYS.THEME);
  // Phase 4 stored one of the old flat palettes ('warm'/'calm'/'rose'/
  // 'dusk') under this same key — anything that isn't a current world id
  // (including those) falls back to the default instead of rendering broken.
  const isValid = WORLD_OPTIONS.some((option) => option.id === value);
  return isValid ? (value as WorldId) : DEFAULT_WORLD_ID;
}

export async function setWorldId(id: WorldId): Promise<void> {
  await AsyncStorage.setItem(KEYS.THEME, id);
}

// The app's own UI language (buttons, screens, notification chrome text).
// Falls back to whatever i18next already detected from the phone, same way
// getWorldId() falls back to the default world, so Settings always has a
// sensible value to show even before the user has ever changed it.
export async function getUiLanguage(): Promise<Language> {
  const value = await AsyncStorage.getItem(KEYS.UI_LANGUAGE);
  return isSupportedLanguage(value) ? value : getCurrentUiLanguage();
}

export async function setUiLanguage(language: Language): Promise<void> {
  await AsyncStorage.setItem(KEYS.UI_LANGUAGE, language);
}

// The language quotes themselves are picked in — kept separate from the UI
// language (see ROADMAP.md Phase 6) so e.g. a French interface can still
// show Darija quotes. Defaults to the UI language until set explicitly.
export async function getQuoteLanguage(): Promise<Language> {
  const value = await AsyncStorage.getItem(KEYS.QUOTE_LANGUAGE);
  if (isSupportedLanguage(value)) return value;
  return getUiLanguage();
}

export async function setQuoteLanguage(language: Language): Promise<void> {
  await AsyncStorage.setItem(KEYS.QUOTE_LANGUAGE, language);
}
