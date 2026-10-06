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
