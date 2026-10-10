// The kinds of personal note a user can keep (Phase 7): a note to
// themselves, a letter to future-them that arrives on a chosen day, or a
// message from someone they love.
//
// Labels live in the translation files (src/i18n/locales, under
// "notes.kinds") — look up `notes.kinds.${id}` with useTranslation().

export type NoteKind = 'self' | 'future' | 'loved_one';

export const NOTE_KINDS: { id: NoteKind; emoji: string }[] = [
  { id: 'self', emoji: '📝' },
  { id: 'future', emoji: '⏳' },
  { id: 'loved_one', emoji: '💌' },
];
