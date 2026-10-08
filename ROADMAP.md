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

### 5B — Navigation icons
- Add icons to every bottom tab (Home, Events, Favorites, Settings), with a
  filled icon for the active tab and an outline icon for inactive ones.
- Use `@expo/vector-icons` (already included with Expo, no new native code).
- Icons should take their colors from the active theme.

### 5C — Visual identity: "Worlds" (aesthetic themes)
Goal: the app should feel fun and comfy, not like a plain React app. Replace
the simple color palettes with full "worlds", switchable from Settings >
Appearance. See the feasibility notes below.

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

World ideas:
- Nature (forest, leaves, soft greens), Space (starfield, nebula),
  Medieval (parchment, serif lettering, candlelight), Desert (dunes,
  warm sunset), Futuristic (glass, soft neon, mono font).
- More suggestions: Ocean (waves, deep blues), Cozy Cabin (rain on window,
  fireplace glow), Japanese Garden (minimal, cherry blossom), Storybook /
  Fairytale (illustrated, whimsical), Cottagecore (flowers, linen), Winter
  (snow, soft white), Sunrise Meadow (golden light), Retro Arcade (pixel
  style), Candlelit Library (books, warm dark).

## Phase 6 — Languages
Languages: English, French, and Moroccan Arabic (Darija).
- Add an i18n layer (`i18next` + `react-i18next`, `expo-localization` to
  detect the phone language). Move every UI string out of the code into
  translation files (`en`, `fr`, `ary`).
- Language picker in Settings, defaulting to the phone language.
- Quotes per language: the library is tagged with a `language` field and the
  app only picks quotes in the chosen language. Quotes are written natively
  in each language, not machine-translated, so they keep their warmth.
  Have a native speaker review the French and Darija quotes.
- Moroccan Darija decisions to make first:
  - Script: Arabic script (right-to-left), Latin letters ("Arabizi"), or let
    the user choose. Arabic script is the main target; Latin as an option
    is a good idea since many Moroccans type Darija that way.
  - Right-to-left layout: mirror the UI when Arabic script is selected
    (`I18nManager.forceRTL`, which requires an app restart, so ask the user
    first). Check every screen, tab order, icons with arrows, and the
    shared quote image.
  - Fonts: pick an Arabic-script font that suits each world.
- Notification text, event types, circumstance names, dates and times follow
  the chosen language.
- Keep the quote language separate from the UI language in settings, so a
  user can have a French interface with Darija quotes, for example.
- Later, easy to add after this foundation: Arabic (MSA), Spanish, Tamazight.

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