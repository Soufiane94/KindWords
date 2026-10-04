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

  // Avoid repeating the exact same quote twice in a row, when possible.
  if (excludeId && candidates.length > 1) {
    candidates = candidates.filter((q) => q.id !== excludeId);
  }

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}
