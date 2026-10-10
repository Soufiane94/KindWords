// The kinds of personal note a user can keep (Phase 7): a note to
// themselves, a letter to future-them that arrives on a chosen day, or a
// message from someone they love. Phase 8 adds a note for someone else,
// written ahead of that person's important day (a birthday, an exam, an
// appointment) — on the day, the app reminds the user to send it.
//
// Labels live in the translation files (src/i18n/locales, under
// "notes.kinds") — look up `notes.kinds.${id}` with useTranslation().

export type NoteKind = 'self' | 'future' | 'loved_one' | 'for_someone';

export const NOTE_KINDS: { id: NoteKind; emoji: string }[] = [
  { id: 'self', emoji: '📝' },
  { id: 'future', emoji: '⏳' },
  { id: 'loved_one', emoji: '💌' },
  { id: 'for_someone', emoji: '💐' },
];
