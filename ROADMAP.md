# Kindwords roadmap

## Phase 1 — MVP ✅ done
- Expo project setup (TypeScript), navigation (Home, Settings tabs).
- Onboarding: user picks one or more circumstances (student, worker, parent,
  widow/widower, living alone, patient, religious, other).
- Bundled ~40 sample quotes tagged by circumstance.
- Home screen: a calm card showing a quote matched to the user's
  circumstances, plus an "Another kind word" button.
- No notifications yet — that's Phase 2.

## Phase 2 — Notifications ✅ done
- Settings: frequency (daily, 3x/week, or custom times), quiet hours.
- Local notifications scheduled with matching quotes, rescheduled whenever
  settings are saved or the app opens (so quotes stay fresh).
- Android notification channels (one per lock-screen visibility option,
  since channel visibility can't change after creation) and permission
  handling, including Android 13+'s runtime POST_NOTIFICATIONS prompt.
- Lock-screen visibility setting (show quote text vs. hide it), defaulting
  to hidden since some quotes touch on grief or illness.

## Phase 3 — Calendar events ✅ done
- New "Events" tab: add/edit/delete events with a type (exam, job interview,
  medical appointment, anniversary/grief day, family event, or other).
- A local notification is scheduled the day before and the day after each
  event (fixed at 9am, to keep it simple), with a quote chosen to match the
  event's type. Quotes in `quotes.json` are now tagged with `eventTypes`.
- Event reminders are rescheduled together with the regular ones (same
  cancel-all-then-reschedule approach), and skipped if 9am falls in quiet
  hours or the reminder date has already passed.

## Phase 4 — Polish ✅ done
- Favorites: heart a quote from Home to save it; a new "Favorites" tab lists
  saved quotes (by id, so they always show the current quote text) and lets
  you unsave or share from there too.
- Share a quote as an image: the quote card is captured as a PNG
  (`react-native-view-shot`) and handed to the native share sheet
  (`expo-sharing`). Both add native code, so this needs a new EAS dev-client
  build before it can be tested on-device (see Testing section).
- Themes: four color palettes (Warm/default, Calm, Rose, Dusk) chosen from a
  new "Appearance" section in Settings, applied app-wide via
  `src/theme/ThemeContext.tsx` and persisted locally. Every screen and
  component now reads colors from the active theme instead of hardcoded
  hex values; Dusk is a soft dark mode for evening use.
- Bigger quote library: `quotes.json` grew from ~40 to 80 original quotes,
  tagged the same way as before (circumstances/eventTypes/mood), still no
  attributed authors.

## Phase 5 — Adjustments
Goal: fix the rough edges and give the app its own personality before adding
more features. Do the sub-parts in this order, one commit each.

### 5A — Notification detail page ✅ done
- Tapping a notification opens a dedicated "Kind word" screen showing the
  quote that was received (not a random new one).
- The notification carries the quote id in its `data`; taps are handled with
  `Notifications.useLastNotificationResponse()` (covers both
  `getLastNotificationResponse` for a cold start and
  `addNotificationResponseReceivedListener` for app running/background in
  one call), then the root stack navigates to the screen.
- Actions on that screen:
  - Save to favorites (same heart as Home).
  - Share (same image share as Home).
  - Snooze, with a small menu: "Pause kind words for 1 hour / until
    tomorrow / for 3 days", and "Don't show me this quote again". Snooze
    cancels and reschedules the pending notifications from the chosen time
    (regular reminders simply aren't scheduled while snoozed, the same way
    quiet hours work, and pick back up next time reminders are scheduled
    after the snooze passes); hiding a quote excludes it from future random
    picks everywhere (Home included), not just notifications.
- Respects the lock-screen setting: the detail screen only ever opens after
  the phone is unlocked and the app is in front of the user, so it always
  shows the full quote regardless of what the lock screen showed.
- Not done (optional nice-to-have, skipped to keep this phase focused):
  Android notification action buttons ("Snooze", "Save") so users can act
  without opening the app. Would need `setNotificationCategoryAsync` plus
  handling `actionIdentifier` in the response — can be added later.

### 5B — Navigation icons ✅ done
- Added icons to every bottom tab (Home, Events, Favorites, Settings), with a
  filled icon for the active tab and an outline icon for inactive ones
  (`Ionicons` home/heart/calendar/settings, `*-outline` variants when not
  focused).
- Used `@expo/vector-icons` — added as an explicit dependency (SDK 57's
  `expo` package no longer pulls it in transitively), but it only needs
  `expo-font`, which was already linked, so no new EAS dev-client build is
  required.
- Icons take their colors from the active theme: `tabBarIcon` receives the
  same `color` as `tabBarActiveTintColor`/`tabBarInactiveTintColor`, which
  already read from `ThemeContext`.

### 5C — Visual identity: "Worlds" (aesthetic themes) ✅ done
Goal: the app should feel fun and comfy, not like a plain React app. Replace
the simple color palettes with full "worlds", switchable from Settings >
Appearance. See the feasibility notes below.

- Replaced the four flat Phase 4 palettes (Warm/Calm/Rose/Dusk) with a
  world model in `src/data/worlds.ts`: each world bundles a color palette,
  fonts, a background, a quote-card style, and a decoration kind.
  `ThemeContext` exposes both `world` (the full object) and `colors` (just
  the palette, same shape as before), so most components didn't need any
  changes.
- Four worlds shipped: **Simple** (the old Warm palette, system font, no
  background or decorations — this is the accessibility/low-distraction
  option the feasibility notes called for), **Nature** (green gradient,
  Quicksand, drifting leaves), **Space** (indigo gradient, Space Mono,
  twinkling stars), **Medieval** (parchment gradient, MedievalSharp
  headings over IM Fell English body text, flickering candle corners).
  Picked from Settings > Appearance with the same chip row as before.
- Ten more worlds added in a second pass, after curating the original
  "world ideas" list down to ones that fit people who need comfort,
  warmth, or a gentle lift — not just a nice palette (see "World ideas"
  below for what got cut and why): **Desert** (sunset dunes, low sun
  glow), **Ocean** (deep blue, swaying wave lines), **Cozy Cabin** (dark
  warm wood, firelight glow + rain streaks — the second dark-toned world
  after Space), **Japanese Garden** (minimal, cherry blossom petals),
  **Storybook** (whimsical, fairy-light sparkles + a crescent moon),
  **Winter** (falling snow + a warm lit-window glow, so it reads as
  hushed rather than cold), **Sunrise Meadow** (golden-hour light, rising
  light motes), **Letters & Ink** (handwritten stationery, a wax seal —
  echoes what this app itself does), **Soft Clouds** (pastel sky,
  drifting clouds — the lowest-stimulation world besides Simple), and
  **Patchwork Quilt** (stitched fabric, a comfort-object feel aimed at
  grief/illness). 14 worlds total.
- New `WorldBackground` component (gradient + decorations, absolutely
  positioned, `pointerEvents="none"`) is dropped into each screen as its
  first child. Adding a future world needs no screen changes — only a new
  entry in `worlds.ts` and, if it wants one, a decoration component.
- Decorations are small inline SVG/View shapes (leaves, stars, candle
  flames) animated with the plain `Animated` API (`useNativeDriver`) —
  skipped `react-native-reanimated` since plain `Animated` covers these
  simple opacity/transform loops, so one fewer native dependency than the
  feasibility notes guessed.
- New native deps: `expo-linear-gradient`, `react-native-svg`. New fonts:
  `@expo-google-fonts/quicksand`, `space-mono`, `medievalsharp`, and
  `im-fell-english`, loaded once at app start via `expo-font`'s
  `useFonts`. **Needs a new EAS dev-client build** before testing
  on-device (see Testing section) — the two native modules weren't linked
  before.
- The second batch of ten worlds added eleven more font packages (`lora`,
  `comfortaa`, `merriweather`, `nunito`, `patrick-hand`, `baloo-2`,
  `fredoka`, `caveat`, `eb-garamond`, `varela-round`, `mali`), all under
  `@expo-google-fonts/*`. These are font files, not native modules — they
  load through the same already-linked `expo-font`, so unlike
  `expo-linear-gradient`/`react-native-svg` above, **no new EAS dev-client
  build is needed for them**. A plain Metro reload picks them up.
- Headings, primary buttons, and quote text pick up each world's fonts;
  smaller UI chrome (chip labels, inputs, time/date pickers) intentionally
  stays on the system font, for legibility and to limit scope.
- Old Phase 4 choices ('warm'/'calm'/'rose'/'dusk', stored under the same
  AsyncStorage key) fall back to Simple automatically on upgrade — just a
  validity check, no migration code needed.
- Not done (deferred, out of scope for worlds specifically): per-world
  tab-icon style/button-shape variation (tab icons stay Ionicons
  app-wide, just recolored, and buttons keep one shape). Can be picked up
  incrementally later.

A world is more than colors. Each one defines:
- Color palette (light/dark where it makes sense).
- Fonts (bundled with `expo-google-fonts`, e.g. a serif for medieval, a
  monospace/techno font for futuristic).
- Background (gradient, subtle pattern, or illustration drawn as SVG).
- Quote card style (corner radius, border, shadow, paper/glass/stone look).
- Small decorations (stars, leaves, dunes, torches) and optional gentle
  animation (twinkling stars, drifting clouds), kept light for battery.
- Matching tab icon style and button shape.

Feasibility and approach:
- The Phase 4 theme system already routes every color through
  `ThemeContext`, so the plumbing exists. Extend the theme object from
  "colors" to "colors + fonts + background + card style + decorations".
- Build the theme engine once, then each new world is mostly data plus
  artwork. Adding a world should not require touching screens.
- Start with 3 worlds to prove the system (suggested: Nature, Space,
  Medieval), then add the others one at a time.
- Likely new native modules (need a new EAS dev-client build):
  `expo-linear-gradient`, `react-native-svg`, and possibly
  `react-native-reanimated` for animations (may already be present).
- The hard part is art, not code. Prefer SVG and gradients drawn in code
  over large image files, and check the license of any free asset or font.
- Quote text must always stay readable: enforce a minimum contrast in every
  world, and keep an "Simple" (no decorations/animations) option for users
  who find busy backgrounds tiring, and for accessibility.
- Android notifications themselves cannot be styled by the app beyond icon
  and accent color, so worlds apply inside the app, the notification detail
  page, and the shared quote image.

World ideas — shipped (14): Simple, Nature, Space, Medieval, Desert,
Ocean, Cozy Cabin, Japanese Garden, Storybook, Winter, Sunrise Meadow,
Letters & Ink, Soft Clouds, Patchwork Quilt.

World ideas — considered and cut, before building the second batch, on
the rule that a world should appeal to someone who actually needs this
app (lonely, grieving, unwell, overwhelmed), not just look nice:
- **Futuristic** (glass, neon, mono font) and **Retro Arcade** (pixel
  style) — cut for tone, not redundancy: sleek/neon and game-nostalgia
  both read as energetic rather than warm, which cuts against this app's
  "never toxic-positive, sensitive to grief/illness/loneliness" bar.
- **Cottagecore** (flowers, linen) — cut as redundant: sat in the same
  "soft homey florals" space as Nature, Japanese Garden, and Sunrise
  Meadow without adding a distinct mood.
- **Candlelit Library** (books, warm dark, candle glow) — cut as
  redundant with Medieval (candlelight) and Cozy Cabin (warm dark +
  glow); didn't earn a third variant on that combination.
- **Autumn Orchard** (rust/amber falling leaves) — cut as redundant: its
  decoration would have been Nature's drifting-leaves motif just
  recolored, not a genuinely distinct scene.
- **Aurora Night** (aurora ribbons, dark sky) — cut as redundant with
  Space: same dark-sky-with-light-phenomena slot, not different enough
  to earn both.
- **Lighthouse Coast** (foggy coast, lighthouse beam) — cut over Ocean:
  same coastal-blue slot, and fog/isolation imagery is a real risk to
  misread as bleak rather than comforting for someone already feeling
  alone, which isn't a risk worth taking for a subtle code-drawn scene.

## Phase 6 — Languages ✅ done
Languages: English, French, and Moroccan Arabic (Darija).

- **Script decision (made up front, as the roadmap asked):** Darija is
  written in **Latin letters ("Arabizi")**, not Arabic script. This means no
  `I18nManager.forceRTL`, no RTL layout auditing, and no Arabic-script font
  hunting for this phase — every world's existing Latin font already covers
  it. Arabic script + RTL remains a valid option to add later if wanted; see
  "Not done" below.
- i18n layer added: `i18next` + `react-i18next`, with `expo-localization` to
  detect the phone's language at startup (`src/i18n/index.ts`). A device set
  to French defaults to French; a device set to Arabic defaults to Darija
  (this app's main audience is Moroccan); anything else defaults to English.
  `expo-localization` has native code, so **this needs a new EAS dev-client
  build** before testing on-device (see Testing section) — i18next and
  react-i18next themselves are plain JS.
- Every UI string moved out of components into `src/i18n/locales/{en,fr,ary}
  .json`, looked up with `useTranslation()`. Circumstance names
  (`src/data/circumstances.ts`), event type names (`src/data/eventTypes.ts`),
  and world names (`src/data/worlds.ts`) all dropped their hardcoded English
  `label`/`name` and are now looked up the same way (`circumstances.<id>`,
  `eventTypes.<id>`, `worlds.<id>`) — those data files now only hold
  ids/emoji, so adding a language never means touching them again.
- Settings has a new "Language" section with **two separate pickers**, per
  the roadmap: app language (drives every screen, button, and notification's
  chrome text) and kind-words language (which quotes get picked), stored
  under their own keys (`kindwords:uiLanguage` / `kindwords:quoteLanguage` in
  storage.ts) so e.g. a French interface can show Darija quotes. Both
  default to the phone's detected language until changed.
- Quotes: every quote in `quotes.json` now has a `language` field. The
  existing 80 are tagged `en`. Added 40 new **original** French quotes and
  40 new original Darija (Latin-letter) quotes — written to match the same
  warm/gentle tone and circumstance/eventType/mood spread as the English
  set, not translations of it or of each other. `getRandomQuote()` /
  `getRandomQuoteForEvent()` (services/quotes.ts) now filter by language
  first, falling back in order: same-language "other"-tagged quotes → any
  quote in that language → any quote in any language (so a thinner library
  never shows nothing) → ignore "hidden" as the last resort, same as before.
- Notification text follows the **app** language (title chrome like "A kind
  word for you"/"Thinking of you", and the Android channel name — channel
  *name* can be updated after creation even though importance/visibility
  can't); the notification *body* is the quote text, which follows the
  **kind-words** language. `rescheduleAllNotifications()` now takes the
  chosen quote language explicitly; UI-language strings are read live off
  the shared i18next instance since the app language and the UI language
  are the same thing by definition.
- Dates and times follow the chosen language, formatted by hand
  (`src/i18n/dateNames.ts` + `DateRow`/`TimeRow`) instead of
  `Date#toLocaleDateString` — there's no real device locale for "Darija in
  Latin letters" for `Intl` to format against. English keeps its existing
  "Mon, Jan 5" / 12-hour "9:00 AM" style; French and Darija use the day-first
  order each actually uses ("lun. 5 janv." / "Tnin 5 Yanvir") and a plain
  24-hour clock, with Darija's month names matching the French-derived ones
  actually used in Morocco (Yanvir, Febrayer, ... Dejanbir), not the
  Levantine Arabic set.
- **Needs a native speaker's review before release**, exactly as this phase
  already called for — both the French and, especially, the Darija content
  (the 40 new quotes in `quotes.json` with `"language": "ary"`, and every
  string in `src/i18n/locales/ary.json`) were written by Claude, not a
  native speaker. Darija has no single standard spelling, and this pass
  made a deliberate simplification around gendered 2nd-person address
  (Darija verbs/pronouns inflect for the listener's gender; this content
  defaults to one unmarked form throughout rather than alternating or
  duplicating it) that a native speaker may want to revisit. Review the
  `ary` entries first — they carry the most linguistic risk.
- **Update:** added Spanish (`es`) — UI strings
  (`src/i18n/locales/es.json`), 40 new original quotes in `quotes.json`, and
  its own weekday/month names in `dateNames.ts` (day-first order, 24-hour
  clock, same as French). Device detection now also maps an `es` phone
  locale to it.
- **Update:** temporarily hid Darija from both Settings language pickers
  (commented out of `LANGUAGE_OPTIONS` in `src/data/languages.ts`, with a
  comment explaining why) since the native-speaker review called for above
  hadn't happened yet and the translation needs work first. The `ary`
  language code, its quotes, and `src/i18n/locales/ary.json` all stay in the
  codebase and keep working for anyone who already had it selected —
  re-adding it to the picker is a one-line uncomment once it's been
  reviewed.
- Not done (deferred, matching the script decision above): Arabic script as
  a second Darija option, RTL mirroring, and an Arabic-script font. All of
  this app's date/time and quote-picking logic is already language-keyed, so
  adding it later is mostly a script/layout problem, not a re-plumbing one.
- Later, still easy to add after this foundation: Arabic (MSA),
  Tamazight.

## Phase 7 — Personal touches
- Thumbs-down on a quote ("not for me"): the quote is hidden for that user
  and the app learns which moods and tags land badly.
- Personal messages: the user can write a note to themselves or to their
  future self, or save a message from a loved one, and the app mixes these
  into the schedule now and then.
- Home screen widget showing a gentle quote, no notification needed.
- Smart pacing: fewer notifications if the user keeps ignoring them,
  optional "not today" button, no streaks, no guilt messages.
- Optional daily mood check-in (one tap, private) used only to choose a
  more fitting quote.

## Phase 8 — Spread kindness
- "Send a kind word": pick or write a message and send it to a friend or
  relative through the native share sheet, as text or as a themed image.
- A link that opens the app store page (or the app, if installed) so
  recipients can try Kindwords.
- Optional "Thinking of you" note users can schedule for someone else's
  important date (birthday, exam, appointment).

## Phase 9 — AI quotes
- Small serverless backend that calls the Claude API to generate quotes from
  circumstance + event type + language, with safety guidelines. API key
  stays server-side. App pre-fetches batches and schedules them locally,
  falling back to bundled quotes if offline.
- Generation rules: warm, short, never preachy, no medical advice, no
  "everything happens for a reason", sensitive to grief and illness, and
  correct in each supported language, including Darija.
- Review a sample of generated quotes by hand before release, and keep the
  human-written library as the base, with AI adding variety.
- Decide the business model first (free limit, subscription, or one-time
  purchase), since generation has a running cost per user.

## Phase 10 — Care, accessibility and trust
- Accessibility: larger text option, high-contrast mode, screen reader
  labels, optional read-aloud of the quote.
- Gentle safety net: a quiet, optional "Need to talk to someone?" page with
  support lines by country (France, Morocco, others), never a pop-up.
- Privacy: all personal data stays on the device where possible, plain
  language explanation in the app, minimal data collected, export and
  delete-my-data options.
- Reliability on Android: help users exempt the app from aggressive battery
  optimization on phones that kill background notifications, and make
  exact-alarm permission handling robust.

## Phase 11 — iOS and release
- iOS adjustments, app icon, splash screen (matching the chosen worlds),
  store listings in English, French and Arabic, privacy policy, Play Store
  release, then App Store.
- EAS Build for production builds and EAS Submit for publishing.
- Check name availability ("Kindwords") on the stores and as a trademark
  before committing to marketing.
- Test on several real Android phones (Samsung, Xiaomi, etc.) for
  notification behavior, plus an iPhone before the iOS launch.

## Later ideas (not scheduled)
- Seasonal and holiday content (Ramadan, Eid, Christmas, New Year,
  Mother's Day), with matching sensitivity for people who find holidays hard.
- Quote packs by situation (grief, chronic illness, new parent, exams).
- Gentle sounds or haptics per world.
- Wear OS / smartwatch notification.