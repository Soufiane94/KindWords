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
  policy and the Data safety form. Those live in `docs/privacy.html` (the
  public page), the in-app Privacy page (`privacy.*` strings) and
  `store/data-safety.md`: keep all three true. EAS Update, push, crash
  reporting and ads all count.
- Quotes are short, original or public domain, never with a fake
  attribution. No medical advice, no "everything happens for a reason",
  nothing that dismisses someone's pain.
- Every world keeps quote text readable (enough contrast) and respects
  reduce motion (from 9C on); "Simple" stays the low-stimulation world,
  the one shown every day when "A new look each day" is off (9M).
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
  24 hours in milliseconds; `addDays`/`addHours`/`atTime` in
  `src/services/dates.ts` do this), keep reminderPlan.ts pure, and run
  `npm test` after every scheduling change: it runs the tests (in
  `__tests__/`) in both Europe/Paris and Africa/Casablanca time. A new
  scheduling rule gets a test.
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
  more relational. Every key starts with `kindwords:`: "Delete all my data"
  erases by that prefix.
- `docs/` is the public website, served by GitHub Pages (the privacy policy
  now, App Links files later). `store/` holds the Play Console texts.
- Backups (9E): Android's Auto Backup (`allowBackup`, keep it on) plus
  "Export my data" / "Import" (`src/services/backup.ts`, with expo-file-system
  and expo-document-picker). A new kind of user data goes into
  `BackupData`, `readBackupData` and `restoreBackupData` (storage.ts) and
  `parseBackup` (backup.ts); anything that only describes the moment (like
  today's check-in) stays out. Importing only ever adds, never deletes.
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
- Tagging quotes (9J): event kind words are picked by event type alone,
  whatever the user's circumstances, and come before and after the event.
  So a quote only gets an event type if it suits anyone facing that event,
  on either day; one written for a single situation gets `eventTypes: []`.
  The circumstance `other` means "for anyone" (Send picks from those). Every
  circumstance needs quotes of its own in each language. French quotes fit
  any reader: nothing that agrees with "tu" (seul/seule, prêt/prête).
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
  - `__tests__` — Jest tests, named `*-test.ts`; `jest/` holds their setup
    and helpers, `scripts/` small Node scripts like `npm test`'s
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
- The splash screen can't be fully seen in a development build: check it
  in a `preview` or `production` build. `production` makes the AAB for
  Play, and EAS raises its version code by itself.
- The icon, splash image, widget preview and Play graphics are drawn by
  `scripts/make-assets.js`; changing them needs a new build too.
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
- An event with a time (9F): 2 hours before (else 1 hour before, else
  19:00 the evening before), and that evening at 19:00 (or 2 hours after
  when it starts after 17:00, else 9:00 the next morning); each moment
  skips quiet hours and snoozes. Yearly events and yearly notes for someone
  else's day only plan their next time; the plan's rebuild on each open
  picks up the one after.
- No repeats (9F): picks prefer quotes not in the seen list, and a round
  ends only when every quote that fits (circumstances, language, not
  hidden) has been seen (`withSeen`). Home and the widget mark what they
  show; a notification's quote is marked at the next rebuild once its time
  has passed (the plan is kept in `kindwords:plannedQuotes`).
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
  on time. Android 14+ doesn't grant it by default: users can allow it from
  "If kind words arrive late" (`DeliveryHelpScreen`, 9G), and without it
  expo-notifications falls back to inexact alarms, so the app still works.
  Never use `USE_EXACT_ALARM` or ask to ignore battery optimizations: Play
  only allows those for alarm and similar apps.

### Worlds and pictures
- Colors always come from the active world via `ThemeContext` (`colors`,
  or `world` for fonts, background and card style), never hardcoded hex.
- A world is an entry in `src/data/worlds.ts`; adding one needs no screen
  changes or strings, and it joins the daily draw. Its optional file in
  `src/components/decorations/` holds the animated decorations (shown by
  `WorldBackground`) and a still version for pictures (`WorldFrame`).
- A new look each day (9M): nobody picks a world. `pickTodaysWorld()`
  (storage.ts) draws one per calendar day, never Simple and never the day
  before's, when the app starts or comes to the front; nothing changes
  while it's in use. The world of the day is saved under `kindwords:theme`,
  which the widget reads.
- Decorations are inline SVG/View shapes animated with plain `Animated`
  (`useNativeDriver`), kept light for battery. Prefer SVG and gradients
  drawn in code over image files, and check the license of any free asset
  or font.
- Decorations only move through `useLoopingValue` / `useDriftingValue`:
  those two hooks keep them still when the phone's "Remove animations"
  (reduce motion) is on. A piece that drifts passes its own resting point,
  so still pieces don't line up.
- "Plain font" (9C): `world` from `ThemeContext` already has its fonts
  removed when it's on, so always take fonts from it, never from `WORLDS`
  directly. Code outside React (the widget) applies `withPlainFont` itself.
- Headings, primary buttons and quote text use the world's fonts; smaller
  UI chrome (chips, inputs, pickers) stays on the system font, for
  legibility.
- The card has no quotation marks (reasons in CHANGELOG.md, 8D).
- The pup (9N) peeks over the quote card on Home and the Kind word screen
  (`Mascot.tsx`, drawn in `MascotDrawing.tsx`). Its face must suit the
  kind word's mood: the cheerful faces only with encouragement, never a
  grin on grief. One set of colors for every world, decorative (hidden
  from screen readers), its hop stilled by reduce motion, and never on
  shared pictures.
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

### Accessibility and care (9C)
- Every `Pressable` gets an `accessibilityRole`, plus an
  `accessibilityLabel` whenever its visible content isn't plain words (✕,
  icons, emoji, a value next to a separate label). Switches are labeled
  after their row's text. Screen titles get `accessibilityRole="header"`,
  and purely decorative layers are hidden from screen readers.
- Large text: text sitting in a row next to a button or switch gets
  `flex: 1` or `flexShrink: 1` so it wraps instead of pushing things off
  screen; anything that can grow taller than the screen scrolls. Tight rows
  switch layout with `useLargeText()`.
- The support lines (`src/data/supportLines.ts`) were each checked against
  an official source (CHANGELOG.md, 9C). Never add or change a number
  without doing the same, and check them all again before each release.

### Widget
- The widget runs headless, possibly with the app closed, and reads
  everything from storage. The app redraws it on open and when the world
  or a language changes; anything new it shows needs the same.
- It can only use fonts in the widget plugin's `fonts` list in app.json
  (copied into the APK): a new world's body font goes there too, which
  needs a new build.
