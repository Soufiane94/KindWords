// Small wrapper around AsyncStorage for the settings this app needs so far.
// Keeping all storage keys and shapes in one place makes it easy to change
// how we persist things later without hunting through every screen.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorldId, WORLD_OPTIONS, DEFAULT_WORLD_ID } from '../data/worlds';
import { Language, isSupportedLanguage } from '../data/languages';
import { getCurrentUiLanguage } from '../i18n';

const KEYS = {
  ONBOARDING_DONE: 'kindwords:onboardingDone',
  CIRCUMSTANCES: 'kindwords:circumstances',
  NOTIFICATION_SETTINGS: 'kindwords:notificationSettings',
  EVENTS: 'kindwords:events',
  FAVORITES: 'kindwords:favorites',
  THEME: 'kindwords:theme',
  HIDDEN_QUOTES: 'kindwords:hiddenQuotes',
  SNOOZE_UNTIL: 'kindwords:snoozeUntil',
  UI_LANGUAGE: 'kindwords:uiLanguage',
  QUOTE_LANGUAGE: 'kindwords:quoteLanguage',
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

function generateEventId(): string {
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
  const event: CalendarEvent = { ...data, id: generateEventId() };
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

// Quotes the user has said "don't show me this again" to, from the Kind
// word detail screen. Kept separate from favorites — hiding a quote only
// stops it being picked again, it doesn't touch anything already saved.
export async function getHiddenQuoteIds(): Promise<string[]> {
  const value = await AsyncStorage.getItem(KEYS.HIDDEN_QUOTES);
  if (!value) return [];
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}

export async function hideQuoteForever(quoteId: string): Promise<void> {
  const ids = await getHiddenQuoteIds();
  if (!ids.includes(quoteId)) {
    await AsyncStorage.setItem(KEYS.HIDDEN_QUOTES, JSON.stringify([...ids, quoteId]));
  }
}

// A timestamp (ms since epoch) until which notifications are paused, set by
// the "Snooze" menu on the Kind word screen. `null` means not snoozed.
export async function getSnoozeUntil(): Promise<number | null> {
  const value = await AsyncStorage.getItem(KEYS.SNOOZE_UNTIL);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function setSnoozeUntil(timestamp: number | null): Promise<void> {
  if (timestamp === null) {
    await AsyncStorage.removeItem(KEYS.SNOOZE_UNTIL);
  } else {
    await AsyncStorage.setItem(KEYS.SNOOZE_UNTIL, String(timestamp));
  }
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
