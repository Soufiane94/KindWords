// "Worlds" are this app's visual identity (Phase 5C): each one bundles a
// color palette with fonts, a background, a quote-card style, and a small
// ambient decoration — not just a palette swap like the old Phase 4 themes.
// Everything still routes through one object per world, so screens and
// components that only care about colors (most of them) don't need to
// know worlds exist at all.

export type WorldId =
  | 'simple'
  | 'nature'
  | 'space'
  | 'medieval'
  | 'desert'
  | 'ocean'
  | 'cabin'
  | 'garden'
  | 'storybook'
  | 'winter'
  | 'meadow'
  | 'letters'
  | 'clouds'
  | 'quilt';

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
  // react-navigation and expo-status-bar need to know whether this world
  // counts as "dark" so native chrome (status bar, nav chrome) matches it.
  statusBarStyle: 'light' | 'dark';
};

// Font family names to pass straight to `fontFamily`. Left undefined for
// the Simple world, which uses the system font (and real fontWeight, since
// a loaded font file can't fake bold cleanly on Android).
export type WorldFonts = {
  heading?: string;
  body?: string;
};

// expo-linear-gradient wants at least two colors, top to bottom.
export type GradientColors = readonly [string, string, ...string[]];

export type WorldCardStyle = {
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  shadowOpacity: number;
  elevation: number;
};

export type World = {
  id: WorldId;
  name: string;
  emoji: string;
  colors: Palette;
  fonts: WorldFonts;
  // null = flat colors.background, like the old Phase 4 themes (that's
  // what makes Simple "simple", and keeps an accessibility-friendly,
  // battery-light option alongside the fuller worlds).
  background: { colors: GradientColors } | null;
  card: WorldCardStyle;
  decorations:
    | 'none'
    | 'nature'
    | 'space'
    | 'medieval'
    | 'desert'
    | 'ocean'
    | 'cabin'
    | 'garden'
    | 'storybook'
    | 'winter'
    | 'meadow'
    | 'letters'
    | 'clouds'
    | 'quilt';
};

// Simple — the original "warm" palette this app shipped with. No custom
// font, no gradient, no decorations: for anyone who finds busy backgrounds
// tiring, or just wants the plainest, most battery-light option.
const simple: World = {
  id: 'simple',
  name: 'Simple',
  emoji: '🪶',
  colors: {
    background: '#FBF6EC',
    card: '#FFFFFF',
    primaryText: '#3A3A3A',
    secondaryText: '#6A6A6A',
    mutedText: '#8A8A8A',
    placeholder: '#B5AD95',
    accent: '#C9A94F',
    // Dark text on this gold, not white — white only reaches ~2.3:1 here,
    // well under accessible contrast for button-sized text.
    accentText: '#3A3A3A',
    chipBackground: '#FFFFFF',
    chipBorder: '#D8C9A3',
    chipSelectedBackground: '#F4E8C8',
    chipSelectedBorder: '#C9A94F',
    divider: '#E8DFC8',
    border: '#E8DFC8',
    danger: '#B5563C',
    success: '#5A7A4A',
    statusBarStyle: 'dark',
  },
  fonts: {},
  background: null,
  card: { borderRadius: 24, borderWidth: 0, borderColor: 'transparent', shadowOpacity: 0.08, elevation: 3 },
  decorations: 'none',
};

// Nature — soft greens, leaves drifting in from the corners. Quicksand is
// rounded and friendly, legible at both heading and body sizes.
const nature: World = {
  id: 'nature',
  name: 'Nature',
  emoji: '🌿',
  colors: {
    background: '#EAF3E3',
    card: '#FBFDF8',
    primaryText: '#2E3B28',
    secondaryText: '#5B6B52',
    mutedText: '#7C8A72',
    placeholder: '#A9B79C',
    // A touch darker than it might otherwise be — white button text on the
    // lighter #5E8C4C only reaches ~3.9:1, under accessible contrast.
    accent: '#4F7E40',
    accentText: '#FFFFFF',
    chipBackground: '#FBFDF8',
    chipBorder: '#CFE0C2',
    chipSelectedBackground: '#DCEBD0',
    chipSelectedBorder: '#4F7E40',
    divider: '#DCE6D2',
    border: '#DCE6D2',
    danger: '#B5563C',
    success: '#4C7A3D',
    statusBarStyle: 'dark',
  },
  fonts: { heading: 'Quicksand_700Bold', body: 'Quicksand_400Regular' },
  background: { colors: ['#DCEBD0', '#F3F8ED'] },
  card: { borderRadius: 28, borderWidth: 1, borderColor: '#CFE0C2', shadowOpacity: 0.06, elevation: 2 },
  decorations: 'nature',
};

// Space — deep indigo with a scatter of twinkling stars. Space Mono is a
// techno monospace that still reads fine at quote-body sizes.
const space: World = {
  id: 'space',
  name: 'Space',
  emoji: '🌌',
  colors: {
    background: '#10132A',
    card: '#1B2044',
    primaryText: '#EDEFFB',
    secondaryText: '#AEB4D9',
    mutedText: '#7D84AC',
    placeholder: '#5B6192',
    accent: '#A98CE8',
    accentText: '#10132A',
    chipBackground: '#1B2044',
    chipBorder: '#363D6E',
    chipSelectedBackground: '#2C2F5E',
    chipSelectedBorder: '#A98CE8',
    divider: '#2A2E57',
    border: '#2A2E57',
    danger: '#E0897A',
    success: '#8FB37A',
    statusBarStyle: 'light',
  },
  fonts: { heading: 'SpaceMono_700Bold', body: 'SpaceMono_400Regular' },
  background: { colors: ['#05060F', '#1B2044'] },
  card: { borderRadius: 20, borderWidth: 1, borderColor: '#363D6E', shadowOpacity: 0.3, elevation: 4 },
  decorations: 'space',
};

// Medieval — parchment and candlelight. MedievalSharp is a display face
// kept to short titles only; IM Fell English carries the quote text itself
// since it's an old-style serif that still reads cleanly in paragraphs.
const medieval: World = {
  id: 'medieval',
  name: 'Medieval',
  emoji: '🏰',
  colors: {
    background: '#EDE0C3',
    card: '#F6ECD2',
    primaryText: '#3B2B1A',
    secondaryText: '#6B5636',
    mutedText: '#8A7352',
    placeholder: '#B5A379',
    accent: '#8C5A2B',
    accentText: '#F6ECD2',
    chipBackground: '#F6ECD2',
    chipBorder: '#C9B48A',
    chipSelectedBackground: '#E3CE9D',
    chipSelectedBorder: '#8C5A2B',
    divider: '#D9C49A',
    border: '#D9C49A',
    danger: '#8C3B2E',
    success: '#5A7A3E',
    statusBarStyle: 'dark',
  },
  fonts: { heading: 'MedievalSharp_400Regular', body: 'IMFellEnglish_400Regular' },
  background: { colors: ['#E3CE9D', '#F2E4C4'] },
  card: { borderRadius: 12, borderWidth: 2, borderColor: '#C9B48A', shadowOpacity: 0.12, elevation: 3 },
  decorations: 'medieval',
};

// Desert — warm dunes under a low sun. A quiet, wide-open warmth rather
// than anything harsh or empty.
const desert: World = {
  id: 'desert',
  name: 'Desert',
  emoji: '🏜️',
  colors: {
    background: '#FCE8D6',
    card: '#FFF6EC',
    primaryText: '#4A2E1E',
    secondaryText: '#7A5438',
    mutedText: '#9C7A5C',
    placeholder: '#C9A684',
    // Mid-tone terracotta: white text only reaches ~2.8:1 here, so dark
    // text instead (same reasoning as Simple's gold accent).
    accent: '#D97B3F',
    accentText: '#3A2415',
    chipBackground: '#FFF6EC',
    chipBorder: '#E8C7A3',
    chipSelectedBackground: '#F7D9B8',
    chipSelectedBorder: '#D97B3F',
    divider: '#EDD4B5',
    border: '#EDD4B5',
    danger: '#A8472E',
    success: '#6B7A3E',
    statusBarStyle: 'dark',
  },
  fonts: { heading: 'Lora_700Bold', body: 'Lora_400Regular' },
  background: { colors: ['#F4B98A', '#FCE8D6'] },
  card: { borderRadius: 20, borderWidth: 1, borderColor: '#E8C7A3', shadowOpacity: 0.08, elevation: 2 },
  decorations: 'desert',
};

// Ocean — deep calm blues, slow waves. A classic, safe kind of calming.
const ocean: World = {
  id: 'ocean',
  name: 'Ocean',
  emoji: '🌊',
  colors: {
    background: '#E3F0F3',
    card: '#FBFEFF',
    primaryText: '#1F3A3E',
    secondaryText: '#4C6A6E',
    mutedText: '#7D9497',
    placeholder: '#AEC6C9',
    accent: '#2E7D8C',
    accentText: '#FFFFFF',
    chipBackground: '#FBFEFF',
    chipBorder: '#C7DEE1',
    chipSelectedBackground: '#D5EBEE',
    chipSelectedBorder: '#2E7D8C',
    divider: '#D5E6E8',
    border: '#D5E6E8',
    danger: '#B5563C',
    success: '#3F8C6B',
    statusBarStyle: 'dark',
  },
  fonts: { heading: 'Comfortaa_700Bold', body: 'Comfortaa_400Regular' },
  background: { colors: ['#A9D6DE', '#EAF6F8'] },
  card: { borderRadius: 26, borderWidth: 1, borderColor: '#C7DEE1', shadowOpacity: 0.06, elevation: 2 },
  decorations: 'ocean',
};

// Cozy Cabin — dark warm wood and firelight, rain outside the window. The
// one dark-toned world besides Space, but warm instead of cool.
const cabin: World = {
  id: 'cabin',
  name: 'Cozy Cabin',
  emoji: '🔥',
  colors: {
    background: '#3B2A22',
    card: '#4A362B',
    primaryText: '#F3E4D4',
    secondaryText: '#D2B99E',
    mutedText: '#A98F76',
    placeholder: '#8A7260',
    // Light-ish orange glow: dark text reads better than white here too.
    accent: '#E08A3C',
    accentText: '#3B2414',
    chipBackground: '#4A362B',
    chipBorder: '#6B5240',
    chipSelectedBackground: '#6B4A30',
    chipSelectedBorder: '#E08A3C',
    divider: '#5C4634',
    border: '#5C4634',
    danger: '#E0897A',
    success: '#8FB37A',
    statusBarStyle: 'light',
  },
  fonts: { heading: 'Merriweather_700Bold', body: 'Merriweather_400Regular' },
  background: { colors: ['#2B1D16', '#4A362B'] },
  card: { borderRadius: 16, borderWidth: 1, borderColor: '#6B5240', shadowOpacity: 0.25, elevation: 4 },
  decorations: 'cabin',
};

// Japanese Garden — minimal and serene, cherry blossom pink. The second
// low-stimulation option alongside Simple, for anyone who wants calm
// without going all the way to no decoration at all.
const garden: World = {
  id: 'garden',
  name: 'Japanese Garden',
  emoji: '🌸',
  colors: {
    background: '#F5F1EC',
    card: '#FFFFFF',
    primaryText: '#3E3A36',
    secondaryText: '#6E6660',
    mutedText: '#948B83',
    placeholder: '#C7BDB2',
    accent: '#D98CA3',
    accentText: '#3E3A36',
    chipBackground: '#FFFFFF',
    chipBorder: '#E6D9D2',
    chipSelectedBackground: '#F6E1E7',
    chipSelectedBorder: '#D98CA3',
    divider: '#E8E1D8',
    border: '#E8E1D8',
    danger: '#B5563C',
    success: '#6B8F5E',
    statusBarStyle: 'dark',
  },
  fonts: { heading: 'Nunito_700Bold', body: 'Nunito_400Regular' },
  background: { colors: ['#F6E1E7', '#F8F4EE'] },
  card: { borderRadius: 30, borderWidth: 1, borderColor: '#E6D9D2', shadowOpacity: 0.05, elevation: 1 },
  decorations: 'garden',
};

// Storybook — warm, whimsical, like being read a bedtime story. Kept
// distinct from Medieval's castle-and-candlelight feel by leaning into
// softer fairy-light warmth instead.
const storybook: World = {
  id: 'storybook',
  name: 'Storybook',
  emoji: '📖',
  colors: {
    background: '#F3EBDD',
    card: '#FFFBF2',
    primaryText: '#4A3B5C',
    secondaryText: '#746690',
    mutedText: '#9A8FB0',
    placeholder: '#C7BEDB',
    accent: '#8C6BB5',
    accentText: '#2E2340',
    chipBackground: '#FFFBF2',
    chipBorder: '#DCCFEA',
    chipSelectedBackground: '#E8DCF2',
    chipSelectedBorder: '#8C6BB5',
    divider: '#E6DCCB',
    border: '#E6DCCB',
    danger: '#B5563C',
    success: '#5A8F6B',
    statusBarStyle: 'dark',
  },
  fonts: { heading: 'PatrickHand_400Regular', body: 'Quicksand_400Regular' },
  background: { colors: ['#E8DCF2', '#F6EFE2'] },
  card: { borderRadius: 22, borderWidth: 2, borderColor: '#DCCFEA', shadowOpacity: 0.1, elevation: 3 },
  decorations: 'storybook',
};

// Winter — soft falling snow, hushed rather than cold. A warm amber accent
// (a lit window) is deliberate, so this reads as cozy-quiet, not bleak.
const winter: World = {
  id: 'winter',
  name: 'Winter',
  emoji: '❄️',
  colors: {
    background: '#EDF2F7',
    card: '#FFFFFF',
    primaryText: '#33424F',
    secondaryText: '#5C6E7A',
    mutedText: '#8699A3',
    placeholder: '#BBCAD2',
    accent: '#D99B5B',
    accentText: '#3A2A16',
    chipBackground: '#FFFFFF',
    chipBorder: '#D7E3EA',
    chipSelectedBackground: '#F3E3CC',
    chipSelectedBorder: '#D99B5B',
    divider: '#DDE7ED',
    border: '#DDE7ED',
    danger: '#B5563C',
    success: '#5A8F6B',
    statusBarStyle: 'dark',
  },
  fonts: { heading: 'Baloo2_700Bold', body: 'Baloo2_400Regular' },
  background: { colors: ['#DCE8EF', '#F4F8FB'] },
  card: { borderRadius: 24, borderWidth: 1, borderColor: '#D7E3EA', shadowOpacity: 0.06, elevation: 2 },
  decorations: 'winter',
};

// Sunrise Meadow — golden-hour light and a new day. A gentle, hopeful
// register without being preachy about it — just light, not a message.
const meadow: World = {
  id: 'meadow',
  name: 'Sunrise Meadow',
  emoji: '🌅',
  colors: {
    background: '#FDF0D9',
    card: '#FFFBF0',
    primaryText: '#4A3B1E',
    secondaryText: '#7A6640',
    mutedText: '#9C8860',
    placeholder: '#D4BE8A',
    accent: '#E8A33D',
    accentText: '#4A3B1E',
    chipBackground: '#FFFBF0',
    chipBorder: '#EDD9A8',
    chipSelectedBackground: '#F7E6B8',
    chipSelectedBorder: '#E8A33D',
    divider: '#F0E0B8',
    border: '#F0E0B8',
    danger: '#B5563C',
    success: '#6B8F3E',
    statusBarStyle: 'dark',
  },
  fonts: { heading: 'Fredoka_700Bold', body: 'Fredoka_400Regular' },
  background: { colors: ['#F7C873', '#FDF0D9'] },
  card: { borderRadius: 26, borderWidth: 1, borderColor: '#EDD9A8', shadowOpacity: 0.07, elevation: 2 },
  decorations: 'meadow',
};

// Letters & Ink — handwritten stationery and a wax seal. Ties straight
// back into what this app actually does: a kind word someone sent you.
const letters: World = {
  id: 'letters',
  name: 'Letters & Ink',
  emoji: '✉️',
  colors: {
    background: '#F2EADA',
    card: '#FFFDF6',
    primaryText: '#2E2A22',
    secondaryText: '#5C5648',
    mutedText: '#8A8270',
    placeholder: '#C2B89E',
    accent: '#A8392E',
    accentText: '#FFFFFF',
    chipBackground: '#FFFDF6',
    chipBorder: '#E0D4B8',
    chipSelectedBackground: '#EFE0C4',
    chipSelectedBorder: '#A8392E',
    divider: '#E6DAC0',
    border: '#E6DAC0',
    danger: '#A8392E',
    success: '#5A7A4A',
    statusBarStyle: 'dark',
  },
  fonts: { heading: 'Caveat_700Bold', body: 'EBGaramond_400Regular' },
  background: { colors: ['#EFE4CC', '#F6EFE0'] },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#E0D4B8', shadowOpacity: 0.1, elevation: 3 },
  decorations: 'letters',
};

// Soft Clouds — pastel daytime sky, very low-stimulation. A second "calm"
// option next to Simple, for low-energy or anxious days.
const clouds: World = {
  id: 'clouds',
  name: 'Soft Clouds',
  emoji: '☁️',
  colors: {
    background: '#EAF1F8',
    card: '#FFFFFF',
    primaryText: '#3B4A5C',
    secondaryText: '#657789',
    mutedText: '#8FA0B0',
    placeholder: '#C3D2E0',
    accent: '#7FA8CC',
    accentText: '#1F2E3B',
    chipBackground: '#FFFFFF',
    chipBorder: '#D5E2EE',
    chipSelectedBackground: '#E3EDF7',
    chipSelectedBorder: '#7FA8CC',
    divider: '#DCE6EF',
    border: '#DCE6EF',
    danger: '#B5563C',
    success: '#5A8F6B',
    statusBarStyle: 'dark',
  },
  fonts: { heading: 'VarelaRound_400Regular', body: 'VarelaRound_400Regular' },
  background: { colors: ['#D7E7F5', '#F3F8FC'] },
  card: { borderRadius: 30, borderWidth: 0, borderColor: 'transparent', shadowOpacity: 0.05, elevation: 1 },
  decorations: 'clouds',
};

// Patchwork Quilt — stitched fabric warmth, a comfort object. Deliberately
// chosen for how well "wrapped in a blanket" can land for grief or illness.
const quilt: World = {
  id: 'quilt',
  name: 'Patchwork Quilt',
  emoji: '🧵',
  colors: {
    background: '#F6EDE4',
    card: '#FFFAF3',
    primaryText: '#4A3328',
    secondaryText: '#7A5C4A',
    mutedText: '#9C8270',
    placeholder: '#D2B8A0',
    accent: '#B5667A',
    accentText: '#331A22',
    chipBackground: '#FFFAF3',
    chipBorder: '#E6CFC0',
    chipSelectedBackground: '#EDD7DC',
    chipSelectedBorder: '#B5667A',
    divider: '#E8D6C8',
    border: '#E8D6C8',
    danger: '#A8472E',
    success: '#6B8F5E',
    statusBarStyle: 'dark',
  },
  fonts: { heading: 'Mali_700Bold', body: 'Mali_400Regular' },
  background: { colors: ['#F0DDD2', '#F8F1E8'] },
  card: { borderRadius: 14, borderWidth: 2, borderColor: '#E6CFC0', shadowOpacity: 0.08, elevation: 2 },
  decorations: 'quilt',
};

export const WORLDS: Record<WorldId, World> = {
  simple,
  nature,
  space,
  medieval,
  desert,
  ocean,
  cabin,
  garden,
  storybook,
  winter,
  meadow,
  letters,
  clouds,
  quilt,
};

export const DEFAULT_WORLD_ID: WorldId = 'simple';

// `name` on each World above is just a human-readable id for developers
// reading this file — the label shown in the UI comes from the translation
// files (src/i18n/locales, under "worlds") since Phase 6, looked up as
// `worlds.${id}` with useTranslation() rather than read from here.
export const WORLD_OPTIONS: { id: WorldId; emoji: string }[] = [
  { id: 'simple', emoji: simple.emoji },
  { id: 'nature', emoji: nature.emoji },
  { id: 'space', emoji: space.emoji },
  { id: 'medieval', emoji: medieval.emoji },
  { id: 'desert', emoji: desert.emoji },
  { id: 'ocean', emoji: ocean.emoji },
  { id: 'cabin', emoji: cabin.emoji },
  { id: 'garden', emoji: garden.emoji },
  { id: 'storybook', emoji: storybook.emoji },
  { id: 'winter', emoji: winter.emoji },
  { id: 'meadow', emoji: meadow.emoji },
  { id: 'letters', emoji: letters.emoji },
  { id: 'clouds', emoji: clouds.emoji },
  { id: 'quilt', emoji: quilt.emoji },
];
