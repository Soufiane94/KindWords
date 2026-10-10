// Quote picking (src/services/quotes.ts): no repeats before every quote that
// fits has had its turn (9F), per language, while "not for me", hidden
// quotes and today's check-in still count.

import quotesData from '../src/data/quotes.json';
import { getRandomQuote, getRandomQuoteForEvent, Quote, QuotePrefs, withSeen } from '../src/services/quotes';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const ALL = quotesData as Quote[];
const STUDENT = ['student'];

function poolFor(circumstance: string, language: string): Quote[] {
  return ALL.filter((q) => q.language === language && q.circumstances.includes(circumstance));
}

// Repeatable "randomness", so counting tests always give the same result.
function seedRandom(seed: number) {
  let state = seed;
  jest.spyOn(Math, 'random').mockImplementation(() => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  });
}

afterEach(() => jest.restoreAllMocks());

// Picks like Home does: each quote shown counts as seen.
function pickMany(count: number, language: 'en' | 'fr', prefs: QuotePrefs = {}, start: string[] = []) {
  let seenIds = start;
  const picked: Quote[] = [];
  for (let i = 0; i < count; i++) {
    const quote = getRandomQuote(STUDENT, language, { ...prefs, seenIds });
    picked.push(quote);
    seenIds = withSeen(seenIds, quote, STUDENT, prefs.hiddenIds ?? []);
  }
  return { picked, seenIds };
}

describe('no repeats', () => {
  test('the library has enough student quotes to test with', () => {
    expect(poolFor('student', 'en').length).toBeGreaterThan(3);
    expect(poolFor('student', 'fr').length).toBeGreaterThan(1);
  });

  test('every quote that fits comes once before any comes back', () => {
    seedRandom(1);
    const pool = poolFor('student', 'en');
    const { picked } = pickMany(pool.length, 'en');
    expect(new Set(picked.map((q) => q.id))).toEqual(new Set(pool.map((q) => q.id)));
  });

  test('a new round starts after that, without the last one coming straight back', () => {
    seedRandom(2);
    const pool = poolFor('student', 'en');
    const { picked, seenIds } = pickMany(pool.length, 'en');
    const last = picked[picked.length - 1];
    expect(seenIds.filter((id) => pool.some((q) => q.id === id))).toEqual([last.id]);
    const next = pickMany(pool.length - 1, 'en', {}, seenIds).picked;
    expect(next.map((q) => q.id)).not.toContain(last.id);
    expect(new Set(next.map((q) => q.id)).size).toBe(pool.length - 1);
  });

  test("each language has its own rounds", () => {
    seedRandom(3);
    const fr = pickMany(1, 'fr');
    const en = pickMany(poolFor('student', 'en').length, 'en', {}, fr.seenIds);
    // The English round ended and started over; the French quote stays seen.
    expect(en.seenIds).toContain(fr.picked[0].id);
  });

  test('the quote on screen is avoided even within a round', () => {
    seedRandom(4);
    for (let i = 0; i < 20; i++) {
      const current = getRandomQuote(STUDENT, 'en');
      expect(getRandomQuote(STUDENT, 'en', { avoidIds: [current.id] }).id).not.toBe(current.id);
    }
  });
});

describe('what still counts', () => {
  test('hidden quotes are never picked while others fit', () => {
    seedRandom(5);
    const pool = poolFor('student', 'en');
    const keep = pool[0];
    const hiddenIds = pool.slice(1).map((q) => q.id);
    for (let i = 0; i < 10; i++) {
      expect(getRandomQuote(STUDENT, 'en', { hiddenIds }).id).toBe(keep.id);
    }
  });

  test("today's check-in makes fitting moods more likely", () => {
    seedRandom(6);
    const comforting = (q: Quote) => ['comfort', 'warmth'].includes(q.mood);
    const count = (prefs: QuotePrefs) =>
      Array.from({ length: 2000 }, () => getRandomQuote(['other'], 'en', prefs)).filter(comforting).length;
    expect(count({ checkInMood: 'heavy' })).toBeGreaterThan(count({}) * 1.3);
  });

  test('"not for me" makes similar moods less likely', () => {
    seedRandom(7);
    const gentle = (q: Quote) => q.mood === 'gentle';
    const count = (prefs: QuotePrefs) =>
      Array.from({ length: 2000 }, () => getRandomQuote(['other'], 'en', prefs)).filter(gentle).length;
    const disliked = { feedback: { moods: { gentle: 3 }, tags: {} } };
    expect(count(disliked)).toBeLessThan(count({}) * 0.6);
  });

  test('event kind words fit the event type', () => {
    seedRandom(8);
    for (let i = 0; i < 10; i++) {
      expect(getRandomQuoteForEvent('exam', 'en').eventTypes).toContain('exam');
    }
  });
});
