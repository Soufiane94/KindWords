# Kindwords — rules for working on this project

## What this is
Kindwords sends occasional encouraging, loving quotes to users, especially
people who feel alone. The goal is to bring a smile.

**Tone:** warm, gentle, never preachy, never toxic-positive, and sensitive to
grief, illness, and loneliness. When writing or reviewing quotes or UI copy,
keep this tone in mind above all else.

## Process
- Build in phases (see ROADMAP.md). Do ONLY the phase currently requested,
  then stop and explain how to run/test it. Don't jump ahead to later phases
  even if it seems convenient.
- Keep ROADMAP.md up to date as phases are completed or re-scoped.

## Tech decisions
- React Native + Expo (TypeScript). Android first, iOS later — avoid
  Android-only code where possible, and clearly note anything
  platform-specific when it's unavoidable.
- Local-first: the app must work offline. Settings and events are stored
  locally (AsyncStorage for now; expo-sqlite may be added later if data gets
  more relational).
- Notifications use expo-notifications (local scheduled notifications only,
  no push server, until Phase 5).
- Sharing (Phase 8) always goes through the phone's share sheet — the app
  never sends anything to anyone by itself. Pictures use expo-sharing,
  which only shares files; plain text uses React Native's built-in `Share`
  API. `src/services/share.ts` holds both, plus the Kindwords store link.
  A picture is a `framed` QuoteCard: the card on its world's gradient with
  still decorations around it (`src/components/WorldFrame.tsx`). On screen
  the card stays unframed, since it already sits in its world.
- Quotes live in `src/data/quotes.json`: each quote has
  `{ id, text, author?, circumstances: [], eventTypes: [], mood, language }`.
  Only original or public-domain quotes — never fabricate an attribution to
  a real person. `language` is one of `en`/`fr`/`ary` (see Phase 6) — quotes
  are written natively per language, never machine-translated from another
  entry in the file.
- i18n (Phase 6): `i18next` + `react-i18next`, with `expo-localization` to
  detect the phone's language as the default. UI strings live in
  `src/i18n/locales/{en,fr,ary}.json`; look them up with `useTranslation()`,
  never hardcode UI text in a screen/component. `ary` (Darija) is written in
  Latin letters ("Arabizi"), not Arabic script — no RTL layout in this app.

## Code style
- Keep code simple and organized:
  - `src/screens` — one file per screen
  - `src/components` — small reusable UI pieces
  - `src/data` — bundled static data (quotes, circumstance lists)
  - `src/services` — storage and business logic, no UI
  - `src/navigation` — navigators
  - `src/widget` — the Android home screen widget (Phase 7), which runs
    outside the app and is built from react-native-android-widget's own
    primitives, not regular views
- Comment for a beginner: explain *why*, not *what*, and keep comments short.
- No unnecessary abstractions — this is a small app, prefer straightforward
  code over clever generalization.

## Current phase status
See ROADMAP.md. Phases 1 through 8 are complete.

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
- Only rebuild the APK when native dependencies change (new packages with
  native code, or config plugin changes). Plain JS/TS changes just need a
  Metro reload via `npx expo start --dev-client`.

## Notification scheduling notes
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
- Android can't change a channel's lock-screen visibility after it's
  created, so there are two channels (`kindwords-public` /
  `kindwords-private`) and scheduling picks whichever matches the current
  setting.
- Quiet hours are enforced at scheduling time: any regular slot whose time
  falls inside the quiet-hours window is simply not scheduled (not
  shifted), and the Settings screen tells the user which times got skipped.
  Event reminders (always 9am) are skipped the same way. Notes to future-you
  are the exception: they wait until quiet hours or a snooze end.
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
  on time. Android 14+ users must still allow it in system settings
  (Phase 10).
