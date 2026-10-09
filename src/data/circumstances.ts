// The list of circumstances a user can pick from during onboarding.
// Each quote in quotes.json is tagged with zero or more of these ids,
// so we can show quotes that feel relevant to the person reading them.
//
// Labels live in the translation files (src/i18n/locales, under
// "circumstances") since Phase 6 — look up `circumstances.${id}` with
// useTranslation() rather than reading a label from here.

export type Circumstance = {
  id: string;
  emoji: string;
};

export const CIRCUMSTANCES: Circumstance[] = [
  { id: 'student', emoji: '📚' },
  { id: 'worker', emoji: '💼' },
  { id: 'parent', emoji: '👨‍👩‍👧' },
  { id: 'widowed', emoji: '🕊️' },
  { id: 'living_alone', emoji: '🏠' },
  { id: 'patient', emoji: '🩺' },
  { id: 'religious', emoji: '🙏' },
  { id: 'caregiver', emoji: '🤲' },
  { id: 'grieving', emoji: '🕯️' },
  { id: 'breakup', emoji: '💔' },
  { id: 'new_parent', emoji: '🍼' },
  { id: 'far_from_home', emoji: '🌍' },
  { id: 'overwhelmed', emoji: '🌊' },
  { id: 'job_searching', emoji: '🔍' },
  { id: 'older_adult', emoji: '🧓' },
  { id: 'other', emoji: '💛' },
];
