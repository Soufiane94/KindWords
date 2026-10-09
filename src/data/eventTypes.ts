// The list of event types a user can pick from when adding a calendar event.
// Each quote in quotes.json can be tagged with zero or more of these ids, so
// we can send a kind word that fits the kind of event it's attached to.
//
// Labels live in the translation files (src/i18n/locales, under
// "eventTypes") since Phase 6 — look up `eventTypes.${id}` with
// useTranslation() rather than reading a label from here.

export type EventTypeOption = {
  id: string;
  emoji: string;
};

export const EVENT_TYPES: EventTypeOption[] = [
  { id: 'exam', emoji: '📝' },
  { id: 'job_interview', emoji: '💼' },
  { id: 'medical_appointment', emoji: '🩺' },
  { id: 'grief_anniversary', emoji: '🕊️' },
  { id: 'family_event', emoji: '👨‍👩‍👧' },
  { id: 'other', emoji: '📌' },
];
