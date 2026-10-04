// The list of circumstances a user can pick from during onboarding.
// Each quote in quotes.json is tagged with zero or more of these ids,
// so we can show quotes that feel relevant to the person reading them.

export type Circumstance = {
  id: string;
  label: string;
  emoji: string;
};

export const CIRCUMSTANCES: Circumstance[] = [
  { id: 'student', label: 'Student', emoji: '📚' },
  { id: 'worker', label: 'Working', emoji: '💼' },
  { id: 'parent', label: 'Parent', emoji: '👨‍👩‍👧' },
  { id: 'widowed', label: 'Widow / Widower', emoji: '🕊️' },
  { id: 'living_alone', label: 'Living alone', emoji: '🏠' },
  { id: 'patient', label: 'Managing an illness', emoji: '🩺' },
  { id: 'religious', label: 'Religious / Spiritual', emoji: '🙏' },
  { id: 'other', label: 'Just here for kind words', emoji: '💛' },
];
