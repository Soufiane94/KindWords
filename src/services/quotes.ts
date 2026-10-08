// Logic for picking a quote that matches the user's chosen circumstances.

import quotesData from '../data/quotes.json';

export type Quote = {
  id: string;
  text: string;
  author?: string;
  circumstances: string[];
  eventTypes: string[];
  mood: string;
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

// Returns a random quote matching at least one of the user's circumstances.
// If the user picked no circumstances, or none match, falls back to any quote
// tagged "other" so there is always something gentle to show.
export function getRandomQuote(userCircumstances: string[], excludeId?: string): Quote {
  let candidates = ALL_QUOTES.filter((q) =>
    q.circumstances.some((c) => userCircumstances.includes(c))
  );

  if (candidates.length === 0) {
    candidates = ALL_QUOTES.filter((q) => q.circumstances.includes('other'));
  }
  if (candidates.length === 0) {
    candidates = ALL_QUOTES;
  }

  return pickRandom(candidates, excludeId);
}

// Returns a random quote matching the given calendar event type (exam, job
// interview, etc.), for the reminders scheduled before/after an event. Falls
// back to quotes tagged "other" so there is always something to send.
export function getRandomQuoteForEvent(eventType: string, excludeId?: string): Quote {
  let candidates = ALL_QUOTES.filter((q) => q.eventTypes.includes(eventType));

  if (candidates.length === 0) {
    candidates = ALL_QUOTES.filter((q) => q.eventTypes.includes('other'));
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
