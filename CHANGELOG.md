# Kindwords changelog

Detailed history of each phase. ROADMAP.md has the status, CLAUDE.md has
the rules.

## Phase 1 — MVP
- Expo project setup (TypeScript), navigation (Home, Settings tabs).
- Onboarding: user picks one or more circumstances (student, worker, parent,
  widow/widower, living alone, patient, religious, other).
- Bundled ~40 sample quotes tagged by circumstance.
- Home screen: a calm card showing a quote matched to the user's
  circumstances, plus an "Another kind word" button.
- No notifications yet — that's Phase 2.

## Phase 2 — Notifications
- Settings: frequency (daily, 3x/week, or custom times), quiet hours.
- Local notifications scheduled with matching quotes, rescheduled whenever
  settings are saved or the app opens (so quotes stay fresh).
- Android notification channels (one per lock-screen visibility option,
  since channel visibility can't change after creation) and permission
  handling, including Android 13+'s runtime POST_NOTIFICATIONS prompt.
- Lock-screen visibility setting (show quote text vs. hide it), defaulting
  to hidden since some quotes touch on grief or illness.
- **Update (fix, before Phase 7):** the save message used to say "Scheduled
  N reminders", mixing repeating time slots with one-off event reminders
  (e.g. "3 reminders" for one daily kind word plus one event). It now
  describes the schedule in words: "A kind word every day at 9:00 AM",
  event reminders and notes to future-you coming up, and when the next one
  arrives. Duplicate custom times are merged on save (they used to send two
  notifications at once and count twice). Saving while snoozed is no longer
  mistaken for "notifications are blocked", which used to switch reminders
  off. Reschedules started at the same moment (app opening, saving, editing
  an event) now wait for each other instead of interleaving.

## Phase 3 — Calendar events
- New "Events" tab: add/edit/delete events with a type (exam, job interview,
  medical appointment, anniversary/grief day, family event, or other).
- A local notification is scheduled the day before and the day after each
  event (fixed at 9am, to keep it simple), with a quote chosen to match the
  event's type. Quotes in `quotes.json` are now tagged with `eventTypes`.
- Event reminders are rescheduled together with the regular ones (same
  cancel-all-then-reschedule approach), and skipped if 9am falls in quiet
  hours or the reminder date has already passed.
- **Update (fix, before Phase 7):** the "day before" reminder used to be
  dropped silently whenever 9am the day before had already passed — e.g. an
  event for tomorrow added in the evening, or an event for today — so a
  test event could produce no notification at all. It now comes on the
  morning of the event instead (9am, if that's still ahead). Each event in
  the list shows exactly when its kind words will arrive, and the screen
  says so when reminders are off in Settings or quiet hours cover 9am. The
  app also declares Android's `SCHEDULE_EXACT_ALARM` permission: without it,
  Android 12+ treats every scheduled notification as "inexact" and may
  deliver it late. Android 14+ doesn't grant it by default — see 9G in
  ROADMAP.md.

## Phase 4 — Polish
- Favorites: heart a quote from Home to save it; a new "Favorites" tab lists
  saved quotes (by id, so they always show the current quote text) and lets
  you unsave or share from there too.
- Share a quote as an image: the quote card is captured as a PNG
  (`react-native-view-shot`) and handed to the native share sheet
  (`expo-sharing`). Both add native code, so this needs a new EAS dev-client
  build before it can be tested on-device (see "Testing on a device" in
  CLAUDE.md).
- Themes: four color palettes (Warm/default, Calm, Rose, Dusk) chosen from a
  new "Appearance" section in Settings, applied app-wide via
  `src/theme/ThemeContext.tsx` and persisted locally. Every screen and
  component now reads colors from the active theme instead of hardcoded
  hex values; Dusk is a soft dark mode for evening use.
- Bigger quote library: `quotes.json` grew from ~40 to 80 original quotes,
  tagged the same way as before (circumstances/eventTypes/mood), still no
  attributed authors.

## Phase 5 — Adjustments
Goal, as planned: fix the rough edges and give the app its own personality
before adding more features, doing the sub-parts in this order, one commit
each.

### 5A — Notification detail page
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

### 5C — Visual identity: "Worlds" (aesthetic themes)
Goal: the app should feel fun and comfy, not like a plain React app. Replace
the simple color palettes with full "worlds", switchable from Settings >
Appearance.

- Replaced the four flat Phase 4 palettes (Warm/Calm/Rose/Dusk) with a
  world model in `src/data/worlds.ts`: each world bundles a color palette,
  fonts, a background, a quote-card style, and a decoration kind.
  `ThemeContext` exposes both `world` (the full object) and `colors` (just
  the palette, same shape as before), so most components didn't need any
  changes.
- Four worlds shipped: **Simple** (the old Warm palette, system font, no
  background or decorations — this is the accessibility/low-distraction
  option the plan called for), **Nature** (green gradient, Quicksand,
  drifting leaves), **Space** (indigo gradient, Space Mono, twinkling
  stars), **Medieval** (parchment gradient, MedievalSharp headings over IM
  Fell English body text, flickering candle corners). Picked from
  Settings > Appearance with the same chip row as before.
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
  simple opacity/transform loops, so one fewer native dependency than
  first planned.
- New native deps: `expo-linear-gradient`, `react-native-svg`. New fonts:
  `@expo-google-fonts/quicksand`, `space-mono`, `medievalsharp`, and
  `im-fell-english`, loaded once at app start via `expo-font`'s
  `useFonts`. **Needs a new EAS dev-client build** before testing
  on-device (see "Testing on a device" in CLAUDE.md) — the two native
  modules weren't linked before.
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
- **Update (fix, before Phase 7):** quote cards showed square-looking
  corners in worlds with a gradient background (most visibly Ocean, Desert,
  Sunrise Meadow, Medieval). Each card sat in a full-width wrapper painted
  with the world's flat background color — there so shared images don't
  get black corners — which didn't match the gradient behind it. That
  frame now lives inside `QuoteCard`, stays see-through on screen, and only
  gets its solid fill for the moment a share image is captured
  (`src/components/useCardShare.ts`). This applies to every world and to
  Home, Favorites, and the Kind word screen alike.

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

## Phase 6 — Languages
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
  build** before testing on-device (see "Testing on a device" in CLAUDE.md)
  — i18next and react-i18next themselves are plain JS.
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
  `ary` entries first — they carry the most linguistic risk. (Tracked in
  the "Needs native review" checklist under 9B in ROADMAP.md.)
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
Goal, as planned:
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

**Needs a new EAS dev-client build** before testing on-device: the widget
library has native code, and the `SCHEDULE_EXACT_ALARM` permission (see
the Phase 3 fix) changes the Android manifest.

### 7A — "Not for me"
- A thumbs-down "Not for me" button under the quote on Home and on the
  Kind word screen. It hides that quote for good (the same hidden list as
  5A) and records its mood and tags — circumstances and event types,
  minus the catch-all "other" — under `kindwords:quoteFeedback`.
- Quote picking (`src/services/quotes.ts`) is now a weighted random pick:
  each dislike makes that mood 40% less likely and each tag 20% less
  likely, with a floor so nothing ever becomes impossible. This applies
  everywhere quotes are picked: Home, regular and event notifications, and
  the widget.
- Replaces 5A's "Don't show me this quote again" in the snooze menu (same
  effect, plus the learning), so there aren't two buttons doing nearly the
  same thing.
- Settings > Personal touches > "Forget my 'not for me' choices" brings
  every hidden quote back and clears what was learned.
- The actions row under the card now uses Ionicons (icon above label), so
  up to four actions fit side by side.

### 7B — Personal notes
- New "Notes" tab (`NotesScreen`, envelope icon): a note to yourself, a
  note to future-you that arrives on a chosen day, or a message from
  someone you love (with their name). Stored only on the phone, under
  `kindwords:notes`.
- Notes to yourself and loved ones' messages are mixed into the regular
  kind words now and then: each regular notification has about a 1-in-5
  chance of being one of them (never two in a row), titled "A note from
  you" / "A message from {name}". A note to future-you arrives once, on its
  day at the user's first kind-word time — waiting out quiet hours or a
  snooze rather than being dropped — titled "A note from past you", and
  joins the mix after that.
- Tapping a note's notification opens the Kind word screen with the note,
  signed "You, {date written}" or with the loved one's name, with Share
  and Snooze.
- Notes never appear on the home screen widget, since anyone glancing at
  the phone can see it.

### 7C — Home screen widget (Android)
- Built with `react-native-android-widget` (config plugin + native code).
  Expo's own `expo-widgets` is iOS-only in SDK 57, so an iOS widget is left
  for Phase 12 (it would likely use `expo-widgets`).
- A "Kind word" widget (4x2 by default, resizable): one quote in the
  user's world gradient and body font, with "↻ Another" to swap in a new
  one without opening the app; tapping the quote opens the app. It
  refreshes by itself every 4 hours (`updatePeriodMillis` in app.json), and
  is redrawn when the app opens and when the world or a language changes in
  Settings.
- Code lives in `src/widget/`: the widget's look (`KindWordWidget.tsx`,
  built from the library's FlexWidget/TextWidget primitives, not regular
  views) and its task handler, registered in `index.ts` (Android only). It
  runs headless — possibly with the app closed — so it reads everything
  from storage. The worlds' body fonts are copied into the APK through the
  plugin's `fonts` list (about 3 MB) so the widget can use them.
- Uses the same quote picking as the app (circumstances, quote language,
  "not for me", today's check-in).
- Not done: a preview image for the widget picker (`previewImage` in the
  plugin config). Until a real screenshot is added, the picker shows the
  app icon.

### 7D — Smart pacing and "Not today"
- Scheduling reworked to make this possible. Each time slot used to be one
  repeating notification, which re-sent the same quote every day until the
  app was opened, and stayed off after a snooze until the app was opened
  again. Now every kind word is its own one-time notification, lined up
  ahead of time (up to 60 days / 50 kind words), each with its own quote.
  The plan is rebuilt whenever the app opens or comes back to the front (at
  most hourly) and whenever settings, events, or notes change. *When*
  things are sent is pure date math in `src/services/reminderPlan.ts`;
  `notifications.ts` only does the scheduling.
- Gentle pacing ("Ease off when I'm away" in Settings, on by default): the
  first 5 kind words after the app was last opened keep to the schedule;
  if the app stays closed, each next one waits longer — about every other
  day, then every 4 days, then weekly. Opening the app starts it over. A
  daily user who never opens the app gets 5 daily, 4 every other day, 4
  every 4 days, then weekly, for about two months. No streaks, no guilt
  messages, no "we miss you".
- "Not today — pause until tomorrow" under Home's main button (when
  reminders are on). While paused, Home says so, with a "Resume" link. The
  snooze menu's first option is renamed to match. Pauses now end by
  themselves.
- Not done (deferred): a "Not today" button on the notification itself.
  It's feasible with `setNotificationCategoryAsync`, but when the app is
  closed, action taps only reach an `expo-task-manager` background task
  (another native module), and they don't dismiss the notification on
  their own. Worth doing alongside the notification reliability work (now
  9G); for now it's in the ROADMAP backlog.
- Known limit: if the app isn't opened for about two months (sooner with
  several daily times and pacing off, since the plan holds at most 50),
  regular kind words stop until it's opened again.

### 7E — Daily mood check-in
- An optional "How are you today?" card at the top of Home: one tap among
  Heavy / Anxious / Tired / Okay / Good, or "Not now" for the rest of the
  day. Once answered, it shrinks to "Today: 🌧️ Heavy · Change".
- Each answer maps to the quote moods that fit it (`src/data/checkIn.ts`),
  which become 3x as likely on Home, in today's remaining notifications,
  and on the widget. Only today's answer is kept (`kindwords:checkIn`),
  never a history.
- Can be turned off in Settings > Personal touches, which also forgets
  today's answer.

New UI strings for all of the above were added in English, French,
Spanish, and Darija. As with Phase 6, the French, Spanish, and especially
the Darija strings were written by Claude and need a native speaker's
review before release (tracked under 9B in ROADMAP.md).

## Phase 8 — Spread kindness
Goal, as planned:
- "Send a kind word": pick or write a message and send it to a friend or
  relative through the native share sheet, as text or as a themed image.
- A link that opens the app store page (or the app, if installed) so
  recipients can try Kindwords.
- Optional "Thinking of you" note users can schedule for someone else's
  important date (birthday, exam, appointment).

**No new EAS dev-client build needed:** sending as text uses React
Native's built-in `Share` API, and everything else reuses native modules
that were already linked (`expo-sharing`, `react-native-view-shot`,
`expo-notifications`). A Metro reload picks it all up.

### 8A — Send a kind word
- New "Send a kind word" screen (`SendKindWordScreen`), opened full screen
  over the tabs like the Kind word screen.
- The "Share" button under quotes is now "Send" (paper plane) on Home,
  Favorites, and the Kind word screen, and opens this screen with that
  quote. One button rather than two doing nearly the same thing (the same
  call as in 7A): sending a picture is still the default, one tap further
  along. A personal note on the Kind word screen keeps its plain picture
  "Share", since it's the user's own and not a kind word to pass on.
- What to send: "A kind word" starts from the quote it came from, and
  "Another one" picks from the kind words meant for anyone (circumstance
  "other"), since the sender's own circumstances say nothing about the
  person receiving it. "Not for me" choices still count; today's check-in
  doesn't (it's about the sender). Or "My own words", typed in a box.
- How to send it: as a picture (the same themed card capture as before,
  previewed live, so your own words show up in your world's card) or as
  text, through React Native's own `Share` API, since `expo-sharing` only
  shares files. The preview always shows exactly what will be sent.
- The app never sends anything itself: it always goes through the phone's
  share sheet, so the user chooses who gets it and on which app.

### 8B — A link to Kindwords (works once the app is published)
- When sending as text, an optional "Add a link to Kindwords" switch adds
  one line at the end: "Sent with Kindwords. If you'd like kind words now
  and then too: <link>". Off by default, so a kind word to a grieving
  friend never comes with an ad attached unless the sender wants it to.
- Text only: `expo-sharing` can't send text along with an image, and a
  link inside a picture couldn't be tapped anyway.
- The link is the Play Store listing (`KINDWORDS_LINK` in
  `src/services/share.ts`, built from the `com.kindwords.app` package in
  app.json). On Android it opens in the Play Store app, which shows
  "Install", or "Open" if Kindwords is already installed. **Until the app
  is published (Phase 10) the Play Store can't find it**, so for now the
  link can be checked in the message but not followed.
- Not done (needs Phase 12): a link that opens the app straight away when
  it's installed and goes to the right store on an iPhone. That needs a
  page on our own website domain with Android App Links
  (`assetlinks.json`) and iOS Universal Links, plus the App Store id, none
  of which exist before release. Switching to it later only means changing
  `KINDWORDS_LINK`.

### 8C — Notes for someone else's day
- A fourth kind of note in the Notes tab: "For someone I love" (💐): who
  it's for (optional; "someone you love" otherwise), the note itself, and
  their day (today or later). Stored with the other notes
  (`kindwords:notes`), with a new `to` field.
- The app can't message anyone by itself (there's no server, and phones
  don't let apps send messages silently), so on the day it reminds the
  user instead: a notification at 9:00, "Your note for Yasmine is ready to
  send", with the note as its text. Tapping it opens the Send screen with
  the note already filled in, ready to go as a picture or text.
- Timing (`planForSomeoneNote` in reminderPlan.ts): 9:00 like event
  reminders, so there's the whole day left to send it. It waits out quiet
  hours like a note to future-you, but not a snooze: a pause is about kind
  words for the user, and waiting one out could mean missing the other
  person's day. Like everything else, nothing is sent while reminders are
  off in Settings.
- These notes are never mixed in with the user's own kind words and never
  appear on the widget. They count as "busy" moments, so no regular kind
  word lands within the same hour.
- Each one shows when its reminder comes ("For Yasmine · reminder Mon,
  Oct 20, 9:00 AM"), or just its day once that has passed. The note editor
  also has "Send it now", which saves and opens the Send screen: for a day
  that's already here, or a reminder that was missed.
- Settings' save summary mentions them too ("Plus 1 reminder to send a
  note to someone else.").
- Not done: repeating every year (for birthdays), and an occasion type
  (birthday/exam/appointment). The note's own words say what it's for, and
  the reminder doesn't need to know.

New UI strings for all of the above were added in English, French,
Spanish, and Darija. As with Phases 6 and 7, the French, Spanish, and
especially the Darija strings were written by Claude and need a native
speaker's review before release (tracked under 9B in ROADMAP.md).

### 8D — Adjustments
- **Quotation marks removed from the card**, rather than adding a closing
  one at the bottom. The single “ at the top looked unfinished, but a
  matching ” would have made things worse:
  - Since 8A the card also carries the user's own words to a friend, and
    notes from loved ones. Quote marks around your own message make it
    read like you're quoting someone else.
  - None of the app's kind words has an author. They're the app's own
    words, and a bare quotation mark only raises "who said this?".
  - Quotation marks differ by language (“ ” in English, « » in French and
    Spanish), so a big ” would have doubled down on the English ones.
  - The new picture frame (below) already gives a shared picture its
    ornament; quote marks on top of it would be clutter.

  The palette's `quoteMark` color went with them.
- **Pictures come framed in the sender's world.** A shared picture is now
  the card on its world's gradient, with a few of the world's decorations,
  kept still, around its sides and corners: leaves fanning out from behind
  the corners (Nature), stars and a small ringed planet (Space), a candle
  on each side (Medieval), dunes and a setting sun (Desert), waves and
  bubbles (Ocean), firelight, embers and rain (Cozy Cabin), a blossoming
  branch along the top (Japanese Garden), fairy lights across the top
  (Storybook), snowflakes, two pines and a warm window glow (Winter), a low
  sun, light motes and grass (Sunrise Meadow), ink flourishes and a wax
  seal under the card's corner (Letters & Ink), clouds peeking out from
  behind the card (Soft Clouds), and a stitched seam with patchwork
  corners (Patchwork Quilt). Simple stays plain: just the card on its
  cream background.
  - `QuoteCard`'s new `framed` prop draws it, with `WorldFrame`
    (`src/components/WorldFrame.tsx`) for the gradient and decorations,
    like `WorldBackground` but sized to the picture. Each world's frame
    (`NatureFrame`, …) lives in the same file as its screen decorations
    and reuses their shapes. Pieces are placed from the frame's edges, so
    they stay put however tall the card is.
  - The frame has rounded corners on screen and square ones while the
    picture is taken, since many apps show a picture's see-through corners
    as black. This replaces the 5C fix's capture-time fill: the plain card
    is never captured anymore.
- **Only on pictures, not on the card everywhere.** On Home, Favorites and
  the Kind word screen the card already sits inside its world (the
  screen's gradient and animated decorations around it). Framing it there
  too would double every decoration (two sets of leaves, four candles in
  Medieval) and turn Favorites into a wall of ornaments. A picture leaves
  that background behind, which is exactly why it needs to bring some of
  the world along. So the framed card only appears where a picture is
  made:
  - The Send screen's preview, which still shows exactly what will be sent
    (8A).
  - A note's "Share" on the Kind word screen, which sends the same framed
    picture. That copy is drawn just off screen for the capture, so the
    card on screen doesn't change. `react-native-view-shot` draws the view
    itself rather than taking a screenshot, so this works on Android. Check
    it on an iPhone in Phase 12; if the picture comes out blank there,
    view-shot's `useRenderInContext` option is the usual fix.
- Fixed along the way: the Storybook moon's path drew nothing (its second
  arc's radius was too small to reach its end point, so both arcs
  collapsed onto the same half-circle). The screen's moon and the
  picture's now share a proper crescent.
- **No new EAS dev-client build needed:** `react-native-svg`,
  `expo-linear-gradient` and `react-native-view-shot` are already linked,
  and there are no new UI strings.
