# Kindwords roadmap

## Phase 1 — MVP ✅ done
- Expo project setup (TypeScript), navigation (Home, Settings tabs).
- Onboarding: user picks one or more circumstances (student, worker, parent,
  widow/widower, living alone, patient, religious, other).
- Bundled ~40 sample quotes tagged by circumstance.
- Home screen: a calm card showing a quote matched to the user's
  circumstances, plus an "Another kind word" button.
- No notifications yet — that's Phase 2.

## Phase 2 — Notifications
- Settings: frequency (e.g. 1/day, 3/week, custom times), quiet hours.
- Schedule local notifications with matching quotes, rescheduled when
  settings change or the app opens.
- Android notification channel, permission handling (including Android 13+),
  and a setting for lock-screen visibility (show text vs. hidden content).

## Phase 3 — Calendar events
- In-app calendar: add/edit/delete events with a type (exam, job interview,
  medical appointment, anniversary/grief day, family event, etc.).
- Schedule a quote before and after each event, chosen by event type. Tag
  more quotes with `eventTypes`.

## Phase 4 — Polish
- Favorites, share a quote as an image, themes, bigger quote library.

## Phase 5 — AI quotes
- Small serverless backend that calls the Claude API to generate quotes from
  circumstance + event type, with safety guidelines. API key stays
  server-side. App pre-fetches batches and schedules them locally, falling
  back to bundled quotes if offline.

## Phase 6 — iOS and release
- iOS adjustments, app icon, store listings, privacy policy, Play Store
  release.
