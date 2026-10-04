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
- Quotes live in `src/data/quotes.json`: each quote has
  `{ id, text, author?, circumstances: [], eventTypes: [], mood }`.
  Only original or public-domain quotes — never fabricate an attribution to
  a real person.

## Code style
- Keep code simple and organized:
  - `src/screens` — one file per screen
  - `src/components` — small reusable UI pieces
  - `src/data` — bundled static data (quotes, circumstance lists)
  - `src/services` — storage and business logic, no UI
  - `src/navigation` — navigators
- Comment for a beginner: explain *why*, not *what*, and keep comments short.
- No unnecessary abstractions — this is a small app, prefer straightforward
  code over clever generalization.

## Current phase status
See ROADMAP.md. Phase 1 (MVP) is complete.
