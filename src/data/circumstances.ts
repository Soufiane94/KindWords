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

// Each new one sits next to the one it's closest to, so related situations
// are found together. Pregnancy loss sits with the griefs, away from "New
// parent / expecting".
export const CIRCUMSTANCES: Circumstance[] = [
  { id: 'student', emoji: '📚' },
  { id: 'worker', emoji: '💼' },
  { id: 'parent', emoji: '👨‍👩‍👧' },
  { id: 'single_parent', emoji: '🧑‍🧒' },
  { id: 'widowed', emoji: '🕊️' },
  { id: 'living_alone', emoji: '🏠' },
  { id: 'patient', emoji: '🩺' },
  { id: 'recovery', emoji: '🌱' },
  { id: 'religious', emoji: '🙏' },
  { id: 'caregiver', emoji: '🤲' },
  { id: 'grieving', emoji: '🕯️' },
  { id: 'pregnancy_loss', emoji: '🤍' },
  { id: 'pet_loss', emoji: '🐾' },
  { id: 'breakup', emoji: '💔' },
  { id: 'new_parent', emoji: '🍼' },
  { id: 'far_from_home', emoji: '🌍' },
  { id: 'overwhelmed', emoji: '🌊' },
  { id: 'low_mood', emoji: '🌫️' },
  { id: 'job_searching', emoji: '🔍' },
  { id: 'money_worries', emoji: '🧾' },
  { id: 'older_adult', emoji: '🧓' },
  { id: 'other', emoji: '💛' },
];
