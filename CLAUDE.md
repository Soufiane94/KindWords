# Kindwords — rules for working on this project

## What this is
Kindwords sends occasional encouraging, loving quotes ("kind words") to
users, especially people who feel alone. The goal is to bring a smile.

## Product principles (never break these)
- Kindwords is for people who may be lonely, grieving, ill or overwhelmed.
  Warm, gentle, never preachy, never toxic-positive. When unsure, choose
  the gentler option. Keep this tone above all else when writing or
  reviewing quotes or UI copy.
- The app never sends anything to another person by itself; sending always
  goes through the phone's share sheet.
- No guilt mechanics: no streaks, badges, "you missed a day" or "we miss
  you".
- Private things stay private: notes never appear on the widget,
  lock-screen text is hidden by default, and the check-in keeps only
  today's answer, never a history.
- "Add a link to Kindwords" stays off by default.
- Local-first: the app must work offline, and personal data stays on the
  phone, with no analytics or tracking SDKs. Flag any change that would
  send data off the phone before making it, since it changes the privacy
  policy and the Data safety form.
- Quotes are short, original or public domain, never with a fake
  attribution. No medical advice, no "everything happens for a reason",
  nothing that dismisses someone's pain.
- Every world keeps quote text readable (enough contrast) and respects
  reduce motion (from 9C on); "Simple" stays the low-stimulation world.
- The safety-net page is quiet and optional, never a pop-up.

## Working rules
- At the start of each session, read ROADMAP.md for the current status (it
  isn't loaded automatically).
- Do only the phase or sub-phase I ask for, then stop and tell me how to
  test it. Don't jump ahead to later phases, even if it seems convenient.
- Every new UI string goes into every locale file (en, fr, es, ary). Any
  non-English text written by Claude goes on the "Needs native review"
  checklist in ROADMAP.md.
- Always say whether a change needs a new EAS dev-client build (new native
  module, config plugin, permission or manifest change) or just a Metro
  reload. We test with a development build, not Expo Go (see "Testing on a
  device").
- Scheduling: compute times with calendar dates in local time (never add
  24 hours in milliseconds; `addDays`/`atTime` in `src/services/dates.ts`
  do this), keep reminderPlan.ts pure, and run its tests after every
  scheduling change (the tests arrive in 9G).
- Never change the Android package name (com.kindwords.app) once a build
  has been uploaded to Play Console.
- After each phase or sub-phase: a ✅ line in ROADMAP.md and an updated
  status line, the details in CHANGELOG.md (what was built, decisions and
  why, what was not done), "Not done" items into the ROADMAP backlog, new
  lasting rules into CLAUDE.md. Then commit. A re-scoped phase is updated
  in ROADMAP.md too.

## Tech decisions
- React Native + Expo (TypeScript). Android first, iOS later — avoid
  Android-only code where possible, and clearly note anything
  platform-specific when it's unavoidable.
- All data is stored locally: AsyncStorage for now (keys in
  `src/services/storage.ts`); expo-sqlite may be added later if data gets
  more relational.
- Notifications use expo-notifications: local scheduled notifications only,
  no push server.
- Sharing (Phase 8): pictures use expo-sharing, which only shares files;
  plain text uses React Native's built-in `Share` API.
  `src/services/share.ts` holds both, plus the Kindwords store link.
- Quotes live in `src/data/quotes.json`: each quote has
  `{ id, text, author?, circumstances: [], eventTypes: [], mood, language }`.
  `language` is one of `en`/`fr`/`es`/`ary` — quotes are written natively
  per language, never machine-translated from another entry in the file.
  Favorites, hidden quotes, the widget and scheduled notifications point to
  quotes by `id`, so never change or reuse an id.
- i18n (Phase 6): `i18next` + `react-i18next`, with `expo-localization` to
  detect the phone's language as the default. UI strings live in
  `src/i18n/locales/{en,fr,es,ary}.json`; look them up with
  `useTranslation()`, never hardcode UI text in a screen/component. `ary`
  (Darija) is written in Latin letters ("Arabizi"), not Arabic script — no
  RTL layout in this app.

## Code style
- Keep code simple and organized:
  - `src/screens` — one file per screen
  - `src/components` — small reusable UI pieces
  - `src/data` — bundled static data (quotes, circumstance lists)
  - `src/services` — storage and business logic, no UI
  - `src/navigation` — navigators
  - `src/widget` — the Android home screen widget (Phase 7), built from
    react-native-android-widget's own primitives, not regular views
- Comment for a beginner: explain *why*, not *what*, and keep comments short.
- No unnecessary abstractions — this is a small app, prefer straightforward
  code over clever generalization.

## Testing on a device
As of Phase 2, **Expo Go can no longer run this app** — `expo-notifications`
registers Android push-token listeners at import time, and Android push
support was removed from Expo Go in SDK 53+ (it throws a "runtime not
ready" error immediately on load, even though this app only uses local
notifications). We now test with a custom **EAS development build**
instead:
- `expo-dev-client` is installed and `eas.json` has a `development` profile
  (`developmentClient: true`, Android `apk` build type).
- Build once with `eas build --platform android --profile development`,
  install the resulting APK on the test device, then run
  `npx expo start --dev-client` for day-to-day iteration — no Expo Go.
- Only rebuild the APK for the native changes listed in Working rules.
  Plain JS/TS changes just need a Metro reload via
  `npx expo start --dev-client`, and so do new `@expo-google-fonts/*`
  packages and `@expo/vector-icons`, which load through the already-linked
  `expo-font`. The exception is a font added to the widget's `fonts` list
  in app.json: that's plugin config, so it needs a rebuild.

## Technical notes
### Notifications and scheduling
- `src/services/notifications.ts` holds all expo-notifications logic.
  *When* things are sent is worked out separately in
  `src/services/reminderPlan.ts` (pure date math, no expo calls), which the
  Events screen also uses to show each event's reminder dates.
- Since Phase 7, every kind word is its own one-time (DATE) notification,
  lined up ahead of time (up to 60 days / 50 kind words) — no repeating
  triggers. `rescheduleAllNotifications()` always cancels every scheduled
  notification first, then reschedules from scratch, which avoids tracking
  individual notification IDs. Calls are queued so two never interleave.
  It runs when the app opens or comes back to the front (at most hourly)
  and after any change to settings, events, notes, snoozes, "not for me",
  or the check-in.
- Only Settings' Save button passes `askPermission: true`; every other
  reschedule just checks the permission, so the system prompt never
  appears unasked.
- Android notification channels can't change importance or lock-screen
  visibility after creation (only the name), hence one channel per
  visibility option: `kindwords-public` / `kindwords-private`, and
  scheduling picks whichever matches the current setting.
- Android notifications can't be styled beyond the icon and accent color;
  worlds apply inside the app, on the Kind word screen and in shared
  pictures.
- Quiet hours are enforced at scheduling time: any regular slot whose time
  falls inside the quiet-hours window is simply not scheduled (not
  shifted), and the Settings screen tells the user which times got skipped.
  Event reminders (9:00 the day before, or the morning of if that has
  passed, and 9:00 the day after) are skipped the same way. Notes to
  future-you are the exception: they wait until quiet hours or a snooze
  end.
- Regular kind words skip any slot within an hour of an event reminder or
  a note.
- A snooze / "Not today" skips everything inside it and resumes on its own.
  Gentle pacing assumes the app stays unopened from the moment the plan is
  built, and starts over each time it's rebuilt.
- Notes for someone else (Phase 8) are a reminder to the user, not a kind
  word for them: 9:00 on that person's day, waiting out quiet hours but
  never held back by a snooze (that could mean missing their day). Their
  notification carries `sendNoteId` rather than `noteId`, so a tap opens
  the Send screen instead of the Kind word screen, and they're never mixed
  in with the regular kind words.
- `SCHEDULE_EXACT_ALARM` is declared in app.json so Android 12+ can deliver
  on time. Android 14+ doesn't grant it by default: users must allow it in
  system settings, and the app must still work if they don't (9G).

### Worlds and pictures
- Colors always come from the active world via `ThemeContext` (`colors`,
  or `world` for fonts, background and card style), never hardcoded hex.
- A world is an entry in `src/data/worlds.ts` plus its name in each locale
  file; adding one needs no screen changes. Its optional file in
  `src/components/decorations/` holds the animated decorations (shown by
  `WorldBackground`) and a still version for pictures (`WorldFrame`).
- Decorations are inline SVG/View shapes animated with plain `Animated`
  (`useNativeDriver`), kept light for battery. Prefer SVG and gradients
  drawn in code over image files, and check the license of any free asset
  or font.
- Headings, primary buttons and quote text use the world's fonts; smaller
  UI chrome (chips, inputs, pickers) stays on the system font, for
  legibility.
- The card has no quotation marks (reasons in CHANGELOG.md, 8D).
- A shared picture is a `framed` QuoteCard: the card on its world's
  gradient with still decorations around it (`WorldFrame`). On screen the
  card stays unframed, since it already sits in its world.
  react-native-view-shot draws the view itself, so an off-screen copy
  works on Android. Corners are square while the picture is taken, since
  many apps show see-through corners as black.

### Languages
- Two settings: the app language (screens, notification titles, channel
  name) and the kind-words language (which quotes are picked, so also the
  notification text).
- Dates and times are formatted by hand (`src/i18n/dateNames.ts`), never
  with `toLocaleDateString`/`Intl`: no phone locale exists for Darija in
  Latin letters.
- Darija is hidden from the language pickers until it's reviewed
  (commented out in `src/data/languages.ts`), but its strings and quotes
  stay in use, so it still gets every new string.

### Widget
- The widget runs headless, possibly with the app closed, and reads
  everything from storage. The app redraws it on open and when the world
  or a language changes; anything new it shows needs the same.
- It can only use fonts in the widget plugin's `fonts` list in app.json
  (copied into the APK): a new world's body font goes there too, which
  needs a new build.
