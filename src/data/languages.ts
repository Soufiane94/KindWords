// The languages this app supports (Phase 6). `label` here is always each
// language's own name for itself, shown as-is regardless of the current UI
// language — so someone can always recognize their language in the list,
// even while the app is currently showing a different one.

export type Language = 'en' | 'fr' | 'es' | 'ary';

export const DEFAULT_LANGUAGE: Language = 'en';

export const LANGUAGE_OPTIONS: { id: Language; label: string; emoji: string }[] = [
  { id: 'en', label: 'English', emoji: '🇬🇧' },
  { id: 'fr', label: 'Français', emoji: '🇫🇷' },
  { id: 'es', label: 'Español', emoji: '🇪🇸' },
  // Darija removed from this picker for now — the current translation needs
  // a native speaker's pass before showing it as a choice again (see
  // ROADMAP.md Phase 6). The 'ary' language code, its i18n strings, and its
  // quotes all stay in place so anyone who already picked it keeps working;
  // re-adding it later is just uncommenting the line below.
  // { id: 'ary', label: 'Darija', emoji: '🇲🇦' },
];

export function isSupportedLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'fr' || value === 'es' || value === 'ary';
}
