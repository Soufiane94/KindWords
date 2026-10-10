// The optional daily check-in (Phase 7): one tap for how today feels. It's
// only ever used to pick a kind word that fits a little better, so each
// answer just lists which quote moods (the `mood` field in quotes.json) tend
// to land well on a day like that.
//
// Labels live in the translation files (src/i18n/locales, under
// "checkIn.moods") — look up `checkIn.moods.${id}` with useTranslation().

export type CheckInMood = 'heavy' | 'anxious' | 'tired' | 'okay' | 'good';

export const CHECK_IN_OPTIONS: { id: CheckInMood; emoji: string; quoteMoods: string[] }[] = [
  { id: 'heavy', emoji: '🌧️', quoteMoods: ['comfort', 'warmth'] },
  { id: 'anxious', emoji: '🌊', quoteMoods: ['gentle', 'comfort'] },
  { id: 'tired', emoji: '🌙', quoteMoods: ['gentle', 'warmth'] },
  { id: 'okay', emoji: '🌤️', quoteMoods: ['warmth', 'encouragement'] },
  { id: 'good', emoji: '☀️', quoteMoods: ['encouragement', 'warmth'] },
];
