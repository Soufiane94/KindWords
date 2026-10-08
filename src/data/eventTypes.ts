// The list of event types a user can pick from when adding a calendar event.
// Each quote in quotes.json can be tagged with zero or more of these ids, so
// we can send a kind word that fits the kind of event it's attached to.

export type EventTypeOption = {
  id: string;
  label: string;
  emoji: string;
};

export const EVENT_TYPES: EventTypeOption[] = [
  { id: 'exam', label: 'Exam', emoji: '📝' },
  { id: 'job_interview', label: 'Job interview', emoji: '💼' },
  { id: 'medical_appointment', label: 'Medical appointment', emoji: '🩺' },
  { id: 'grief_anniversary', label: 'Anniversary / grief day', emoji: '🕊️' },
  { id: 'family_event', label: 'Family event', emoji: '👨‍👩‍👧' },
  { id: 'other', label: 'Other', emoji: '📌' },
];
