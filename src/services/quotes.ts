// Logic for picking a quote that matches the user's chosen circumstances
// and chosen quote language.

import quotesData from '../data/quotes.json';
import type { Language } from '../data/languages';

export type Quote = {
  id: string;
  text: string;
  author?: string;
  circumstances: string[];
  eventTypes: string[];
  mood: string;
  language: Language;
};

const ALL_QUOTES: Quote[] = quotesData as Quote[];

// Picks randomly from `candidates`, avoiding `excludeId` (the previous
// quote) when there's another option, so the same quote doesn't repeat.
function pickRandom(candidates: Quote[], excludeId?: string): Quote {
  let pool = candidates;
  if (excludeId && pool.length > 1) {
    pool = pool.filter((q) => q.id !== excludeId);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// Returns a random quote matching at least one of the user's circumstances,
// in the chosen quote language. Falls back, in order: any quote in that
// language tagged "other", any quote at all in that language, then (so a
// language with a thin library never shows literally nothing) any quote in
// any language. `hiddenIds` (quotes the user said "don't show me this
// again" to) are excluded first, unless that would leave nothing to show.
export function getRandomQuote(
  userCircumstances: string[],
  language: Language,
  excludeId?: string,
  hiddenIds: string[] = []
): Quote {
  const notHidden = (qs: Quote[]) => qs.filter((q) => !hiddenIds.includes(q.id));
  const inLanguage = (qs: Quote[]) => qs.filter((q) => q.language === language);

  let candidates = notHidden(
    inLanguage(ALL_QUOTES).filter((q) => q.circumstances.some((c) => userCircumstances.includes(c)))
  );

  if (candidates.length === 0) {
    candidates = notHidden(inLanguage(ALL_QUOTES).filter((q) => q.circumstances.includes('other')));
  }
  if (candidates.length === 0) {
    candidates = notHidden(inLanguage(ALL_QUOTES));
  }
  if (candidates.length === 0) {
    candidates = notHidden(ALL_QUOTES);
  }
  if (candidates.length === 0) {
    candidates = ALL_QUOTES; // everything is hidden; show something rather than nothing
  }

  return pickRandom(candidates, excludeId);
}

// Returns a random quote matching the given calendar event type (exam, job
// interview, etc.) in the chosen quote language, for the reminders scheduled
// before/after an event. Falls back the same way getRandomQuote() does.
export function getRandomQuoteForEvent(
  eventType: string,
  language: Language,
  excludeId?: string,
  hiddenIds: string[] = []
): Quote {
  const notHidden = (qs: Quote[]) => qs.filter((q) => !hiddenIds.includes(q.id));
  const inLanguage = (qs: Quote[]) => qs.filter((q) => q.language === language);

  let candidates = notHidden(inLanguage(ALL_QUOTES).filter((q) => q.eventTypes.includes(eventType)));

  if (candidates.length === 0) {
    candidates = notHidden(inLanguage(ALL_QUOTES).filter((q) => q.eventTypes.includes('other')));
  }
  if (candidates.length === 0) {
    candidates = notHidden(inLanguage(ALL_QUOTES));
  }
  if (candidates.length === 0) {
    candidates = notHidden(ALL_QUOTES);
  }
  if (candidates.length === 0) {
    candidates = ALL_QUOTES;
  }

  return pickRandom(candidates, excludeId);
}

// Looks up a specific quote by id, e.g. to turn a favorited id back into the
// full quote for display. Favorites are stored as ids (see storage.ts) so
// they always reflect the latest quote text if quotes.json is ever edited.
export function getQuoteById(id: string): Quote | undefined {
  return ALL_QUOTES.find((q) => q.id === id);
}
