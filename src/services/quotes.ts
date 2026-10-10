// Logic for picking a quote that matches the user's chosen circumstances
// and chosen quote language — leaning away from quotes like ones they
// said "not for me" to, and toward ones that fit today's check-in.

import quotesData from '../data/quotes.json';
import type { Language } from '../data/languages';
import { CHECK_IN_OPTIONS, CheckInMood } from '../data/checkIn';
import { getHiddenQuoteIds, getQuoteFeedback, getTodayCheckIn, QuoteFeedback } from './storage';

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

// What the pickers below know about the user's past choices. Every field is
// optional, so callers only pass what they have.
export type QuotePrefs = {
  hiddenIds?: string[]; // said "not for me": never picked, unless nothing else is left
  avoidIds?: string[]; // e.g. the quote just shown: picked only if nothing else is left
  feedback?: QuoteFeedback;
  checkInMood?: CheckInMood | null;
};

// How likely a quote is to be picked, compared to the others. "Not for me"
// makes quotes like the disliked one less likely but never impossible:
// each dislike shrinks a mood's chances by 40% and a tag's by 20%, down to
// a floor so nothing disappears for good. Today's check-in, if answered,
// makes the moods that fit it three times as likely.
function quoteWeight(quote: Quote, prefs: QuotePrefs): number {
  let weight = 1;
  if (prefs.feedback) {
    weight *= 0.6 ** (prefs.feedback.moods[quote.mood] ?? 0);
    for (const tag of [...quote.circumstances, ...quote.eventTypes]) {
      weight *= 0.8 ** (prefs.feedback.tags[tag] ?? 0);
    }
    weight = Math.max(weight, 0.05);
  }
  const fittingMoods = CHECK_IN_OPTIONS.find((option) => option.id === prefs.checkInMood)?.quoteMoods;
  if (fittingMoods?.includes(quote.mood)) weight *= 3;
  return weight;
}

// A weighted random pick from `candidates` (see quoteWeight), skipping
// `avoidIds` when there's anything else to choose from.
function pickRandom(candidates: Quote[], prefs: QuotePrefs): Quote {
  const fresh = candidates.filter((q) => !prefs.avoidIds?.includes(q.id));
  const pool = fresh.length > 0 ? fresh : candidates;
  const weights = pool.map((q) => quoteWeight(q, prefs));
  let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// The fallback chain shared by both pickers below: quotes in the chosen
// language that match, then same-language ones tagged "other", then any
// quote in that language, then (so a language with a thin library never
// shows literally nothing) any quote in any language. Hidden quotes are
// left out at every step, unless that would leave nothing to show.
function pickFrom(
  matches: (q: Quote) => boolean,
  isGeneric: (q: Quote) => boolean,
  language: Language,
  prefs: QuotePrefs
): Quote {
  const hiddenIds = prefs.hiddenIds ?? [];
  const visible = ALL_QUOTES.filter((q) => !hiddenIds.includes(q.id));
  const inLanguage = visible.filter((q) => q.language === language);
  const steps = [inLanguage.filter(matches), inLanguage.filter(isGeneric), inLanguage, visible];
  const candidates = steps.find((step) => step.length > 0) ?? ALL_QUOTES;
  return pickRandom(candidates, prefs);
}

// Returns a random quote matching at least one of the user's circumstances,
// in the chosen quote language.
export function getRandomQuote(
  userCircumstances: string[],
  language: Language,
  prefs: QuotePrefs = {}
): Quote {
  return pickFrom(
    (q) => q.circumstances.some((c) => userCircumstances.includes(c)),
    (q) => q.circumstances.includes('other'),
    language,
    prefs
  );
}

// Returns a random quote matching the given calendar event type (exam, job
// interview, etc.) in the chosen quote language, for the reminders scheduled
// before/after an event.
export function getRandomQuoteForEvent(eventType: string, language: Language, prefs: QuotePrefs = {}): Quote {
  return pickFrom(
    (q) => q.eventTypes.includes(eventType),
    (q) => q.eventTypes.includes('other'),
    language,
    prefs
  );
}

// Everything the pickers need to know about the user's past choices, read
// from storage in one go.
export async function loadQuotePrefs(): Promise<QuotePrefs> {
  const [hiddenIds, feedback, checkIn] = await Promise.all([
    getHiddenQuoteIds(),
    getQuoteFeedback(),
    getTodayCheckIn(),
  ]);
  return { hiddenIds, feedback, checkInMood: checkIn?.mood ?? null };
}

// Looks up a specific quote by id, e.g. to turn a favorited id back into the
// full quote for display. Favorites are stored as ids (see storage.ts) so
// they always reflect the latest quote text if quotes.json is ever edited.
export function getQuoteById(id: string): Quote | undefined {
  return ALL_QUOTES.find((q) => q.id === id);
}
