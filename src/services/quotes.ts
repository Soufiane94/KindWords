// Logic for picking a quote that matches the user's chosen circumstances
// and chosen quote language — leaning away from quotes like ones they
// said "not for me" to, and toward ones that fit today's check-in. Since
// 9F, no quote comes back before the others that fit have had their turn.

import quotesData from '../data/quotes.json';
import type { Language } from '../data/languages';
import { CHECK_IN_OPTIONS, CheckInMood } from '../data/checkIn';
import {
  getCircumstances,
  getHiddenQuoteIds,
  getQuoteFeedback,
  getSeenQuoteIds,
  getTodayCheckIn,
  QuoteFeedback,
  setSeenQuoteIds,
} from './storage';

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
const QUOTES_BY_ID = new Map(ALL_QUOTES.map((quote) => [quote.id, quote]));

// What the pickers below know about the user's past choices. Every field is
// optional, so callers only pass what they have.
export type QuotePrefs = {
  hiddenIds?: string[]; // said "not for me": never picked, unless nothing else is left
  avoidIds?: string[]; // e.g. the quote just shown: picked only if nothing else is left
  seenIds?: string[]; // seen this round: picked only once the rest have had their turn
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

// A weighted random pick from `candidates` (see quoteWeight). Quotes not
// seen yet this round come first, and `avoidIds` are skipped whenever
// there's anything else to choose from.
function pickRandom(candidates: Quote[], prefs: QuotePrefs): Quote {
  const fresh = candidates.filter((q) => !prefs.avoidIds?.includes(q.id));
  const allowed = fresh.length > 0 ? fresh : candidates;
  const unseen = allowed.filter((q) => !prefs.seenIds?.includes(q.id));
  const pool = unseen.length > 0 ? unseen : allowed;
  const weights = pool.map((q) => quoteWeight(q, prefs));
  let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// The quotes a pick chooses from: those in the chosen language that match,
// then same-language ones tagged "other", then any quote in that language,
// then (so a language with a thin library never shows literally nothing)
// any quote in any language. Hidden quotes are left out at every step,
// unless that would leave nothing to show.
function candidatesFor(
  matches: (q: Quote) => boolean,
  isGeneric: (q: Quote) => boolean,
  language: Language,
  hiddenIds: string[]
): Quote[] {
  const visible = ALL_QUOTES.filter((q) => !hiddenIds.includes(q.id));
  const inLanguage = visible.filter((q) => q.language === language);
  const steps = [inLanguage.filter(matches), inLanguage.filter(isGeneric), inLanguage, visible];
  return steps.find((step) => step.length > 0) ?? ALL_QUOTES;
}

function circumstanceCandidates(userCircumstances: string[], language: Language, hiddenIds: string[]): Quote[] {
  return candidatesFor(
    (q) => q.circumstances.some((c) => userCircumstances.includes(c)),
    (q) => q.circumstances.includes('other'),
    language,
    hiddenIds
  );
}

// Returns a random quote matching at least one of the user's circumstances,
// in the chosen quote language.
export function getRandomQuote(
  userCircumstances: string[],
  language: Language,
  prefs: QuotePrefs = {}
): Quote {
  return pickRandom(circumstanceCandidates(userCircumstances, language, prefs.hiddenIds ?? []), prefs);
}

// Returns a random quote matching the given calendar event type (exam, job
// interview, etc.) in the chosen quote language, for the reminders scheduled
// before/after an event.
export function getRandomQuoteForEvent(eventType: string, language: Language, prefs: QuotePrefs = {}): Quote {
  const candidates = candidatesFor(
    (q) => q.eventTypes.includes(eventType),
    (q) => q.eventTypes.includes('other'),
    language,
    prefs.hiddenIds ?? []
  );
  return pickRandom(candidates, prefs);
}

// No repeats (9F): adds a quote that was just shown or delivered to the
// seen list. Once every quote that fits the user in that language has been
// seen, a new round starts: that language's quotes are forgotten, except
// the one just shown, so it can't come straight back. Rounds go by the
// user's circumstances; event kind words count as seen too, and start over
// with them.
export function withSeen(
  seenIds: string[],
  quote: Quote,
  userCircumstances: string[],
  hiddenIds: string[]
): string[] {
  const next = seenIds.includes(quote.id) ? seenIds : [...seenIds, quote.id];
  const round = circumstanceCandidates(userCircumstances, quote.language, hiddenIds);
  if (!round.every((q) => next.includes(q.id))) return next;
  return [...next.filter((id) => QUOTES_BY_ID.get(id)?.language !== quote.language), quote.id];
}

// Records quotes as seen (on Home, on the widget, or delivered as a
// notification) and returns the updated list.
export async function markQuotesSeen(quotes: Quote[]): Promise<string[]> {
  const [seenIds, circumstances, hiddenIds] = await Promise.all([
    getSeenQuoteIds(),
    getCircumstances(),
    getHiddenQuoteIds(),
  ]);
  if (quotes.length === 0) return seenIds;
  const next = quotes.reduce((list, quote) => withSeen(list, quote, circumstances, hiddenIds), seenIds);
  await setSeenQuoteIds(next);
  return next;
}

// Everything the pickers need to know about the user's past choices, read
// from storage in one go.
export async function loadQuotePrefs(): Promise<QuotePrefs> {
  const [hiddenIds, feedback, checkIn, seenIds] = await Promise.all([
    getHiddenQuoteIds(),
    getQuoteFeedback(),
    getTodayCheckIn(),
    getSeenQuoteIds(),
  ]);
  return { hiddenIds, feedback, checkInMood: checkIn?.mood ?? null, seenIds };
}

// Looks up a specific quote by id, e.g. to turn a favorited id back into the
// full quote for display. Favorites are stored as ids (see storage.ts) so
// they always reflect the latest quote text if quotes.json is ever edited.
export function getQuoteById(id: string): Quote | undefined {
  return QUOTES_BY_ID.get(id);
}
