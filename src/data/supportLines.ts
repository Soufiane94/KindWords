// Listening lines for the "Need to talk to someone?" page (9C), by country,
// plus a directory for everywhere else. Every number here was checked
// against an official source on 2026-10-10 (sources in CHANGELOG.md, 9C).
// Lines do change, so check them again before each release.
//
// Names and numbers are the same in every language. What each line is for,
// and when it answers, live in the locale files under "support.lines.<id>".

export type SupportLine = {
  id: string;
  name: string;
  phone?: string; // as shown; the spaces are dropped when dialing
  url?: string; // a website instead of a number
};

export type SupportCountryId = 'fr' | 'ma' | 'es' | 'other';

export type SupportCountry = {
  id: SupportCountryId;
  flag: string;
  // The phone's region code that puts this country first on the page.
  region?: string;
  lines: SupportLine[];
  // For someone in danger right now.
  emergency: SupportLine[];
};

export const SUPPORT_COUNTRIES: SupportCountry[] = [
  {
    id: 'fr',
    flag: '🇫🇷',
    region: 'FR',
    lines: [
      { id: 'fr_3114', name: '3114', phone: '3114' },
      { id: 'fr_sos_amitie', name: 'SOS Amitié', phone: '09 72 39 40 50' },
    ],
    emergency: [{ id: 'fr_112', name: '112', phone: '112' }],
  },
  {
    id: 'ma',
    flag: '🇲🇦',
    region: 'MA',
    // No national listening line for Morocco could be checked, so this
    // points to a verified, kept-up-to-date list instead.
    lines: [{ id: 'ma_findahelpline', name: 'Find A Helpline', url: 'https://findahelpline.com/countries/ma' }],
    emergency: [
      { id: 'ma_15', name: '15', phone: '15' },
      { id: 'ma_19', name: '19', phone: '19' },
    ],
  },
  {
    id: 'es',
    flag: '🇪🇸',
    region: 'ES',
    lines: [
      { id: 'es_024', name: '024', phone: '024' },
      { id: 'es_esperanza', name: 'Teléfono de la Esperanza', phone: '717 003 717' },
    ],
    emergency: [{ id: 'es_112', name: '112', phone: '112' }],
  },
  {
    id: 'other',
    flag: '🌍',
    lines: [{ id: 'findahelpline', name: 'Find A Helpline', url: 'https://findahelpline.com' }],
    emergency: [],
  },
];

// The phone's own country first, when it's one of these; "other
// countries" always stays last.
export function orderedSupportCountries(region: string | null | undefined): SupportCountry[] {
  const own = SUPPORT_COUNTRIES.find((country) => country.region !== undefined && country.region === region);
  return own ? [own, ...SUPPORT_COUNTRIES.filter((country) => country !== own)] : SUPPORT_COUNTRIES;
}
