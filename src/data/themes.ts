// The color palettes a user can pick from in Settings. Every screen and
// component reads its colors from one of these (via ThemeContext) instead
// of hardcoding hex values, so adding a theme here is enough to make it
// available everywhere.

export type ThemeName = 'warm' | 'calm' | 'rose' | 'dusk';

export type Palette = {
  background: string;
  card: string;
  primaryText: string;
  secondaryText: string;
  mutedText: string;
  placeholder: string;
  accent: string;
  accentText: string;
  chipBackground: string;
  chipBorder: string;
  chipSelectedBackground: string;
  chipSelectedBorder: string;
  divider: string;
  border: string;
  danger: string;
  success: string;
  quoteMark: string;
  // react-navigation needs to know whether this palette counts as "dark" so
  // native chrome (e.g. the status bar) matches it.
  statusBarStyle: 'light' | 'dark';
};

// The original palette this app shipped with — warm cream and gold.
const warm: Palette = {
  background: '#FBF6EC',
  card: '#FFFFFF',
  primaryText: '#3A3A3A',
  secondaryText: '#6A6A6A',
  mutedText: '#8A8A8A',
  placeholder: '#B5AD95',
  accent: '#C9A94F',
  accentText: '#FFFFFF',
  chipBackground: '#FFFFFF',
  chipBorder: '#D8C9A3',
  chipSelectedBackground: '#F4E8C8',
  chipSelectedBorder: '#C9A94F',
  divider: '#E8DFC8',
  border: '#E8DFC8',
  danger: '#B5563C',
  success: '#5A7A4A',
  quoteMark: '#D8C9A3',
  statusBarStyle: 'dark',
};

// Soft blue-gray, meant to feel calming and unhurried.
const calm: Palette = {
  background: '#EFF3F8',
  card: '#FFFFFF',
  primaryText: '#35404A',
  secondaryText: '#647180',
  mutedText: '#8C97A3',
  placeholder: '#A7B3BF',
  accent: '#6E8FB5',
  accentText: '#FFFFFF',
  chipBackground: '#FFFFFF',
  chipBorder: '#C9D6E3',
  chipSelectedBackground: '#DCE6F0',
  chipSelectedBorder: '#6E8FB5',
  divider: '#DCE3EA',
  border: '#DCE3EA',
  danger: '#B5563C',
  success: '#5A8A7A',
  quoteMark: '#C9D6E3',
  statusBarStyle: 'dark',
};

// Soft rose and mauve — gentle, a little tender, fits grief and comfort well.
const rose: Palette = {
  background: '#FBF0F0',
  card: '#FFFFFF',
  primaryText: '#4A3838',
  secondaryText: '#7A6666',
  mutedText: '#9C8A8A',
  placeholder: '#BFA9A9',
  accent: '#C98F94',
  accentText: '#FFFFFF',
  chipBackground: '#FFFFFF',
  chipBorder: '#E3C9CC',
  chipSelectedBackground: '#F3DEE0',
  chipSelectedBorder: '#C98F94',
  divider: '#EBD9D9',
  border: '#EBD9D9',
  danger: '#B5563C',
  success: '#6E8A5A',
  quoteMark: '#E3C9CC',
  statusBarStyle: 'dark',
};

// A gentle, warm-toned dark mode for evening use — soft charcoal, not black.
const dusk: Palette = {
  background: '#22252B',
  card: '#2C3038',
  primaryText: '#EDEBE6',
  secondaryText: '#B8B4AC',
  mutedText: '#8C8980',
  placeholder: '#6E6B63',
  accent: '#D9BB6B',
  accentText: '#22252B',
  chipBackground: '#333841',
  chipBorder: '#4A4E58',
  chipSelectedBackground: '#3E3A2C',
  chipSelectedBorder: '#D9BB6B',
  divider: '#3A3E46',
  border: '#3A3E46',
  danger: '#E0897A',
  success: '#8FB37A',
  quoteMark: '#4A4E58',
  statusBarStyle: 'light',
};

export const THEMES: Record<ThemeName, Palette> = { warm, calm, rose, dusk };

export const DEFAULT_THEME_NAME: ThemeName = 'warm';

export const THEME_OPTIONS: { id: ThemeName; label: string; emoji: string }[] = [
  { id: 'warm', label: 'Warm', emoji: '🌼' },
  { id: 'calm', label: 'Calm', emoji: '💧' },
  { id: 'rose', label: 'Rose', emoji: '🌸' },
  { id: 'dusk', label: 'Dusk', emoji: '🌙' },
];
