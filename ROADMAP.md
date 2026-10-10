# Kindwords roadmap

Kindwords sends occasional warm, gentle kind words to people who may feel
alone, to bring a smile.

**Current:** Phase 9 — Release readiness. **Next:** 9A.

Each sub-phase is done on its own, one commit each.

## Done
- Phase 1 — MVP ✅ onboarding by circumstance, bundled quotes, a calm Home card
- Phase 2 — Notifications ✅ frequency, quiet hours, private lock screen by default
- Phase 3 — Calendar events ✅ Events tab, kind words the day before and the day after
- Phase 4 — Polish ✅ favorites, share as image, bigger quote library
- Phase 5 — Adjustments ✅ Kind word screen with snooze, tab icons, 14 worlds
- Phase 6 — Languages ✅ English, French, Spanish, Darija (hidden until reviewed)
- Phase 7 — Personal touches ✅ "not for me", notes, Android widget, gentle pacing, daily check-in
- Phase 8 — Spread kindness ✅ send a kind word, link to Kindwords, notes for someone's day, framed pictures

Details in CHANGELOG.md.

## Phase 9 — Release readiness
Goal: make the existing app ready for real users. No big new features.

### 9A — Name check (do first; mostly manual for me)
- Check "Kindwords" on Google Play, the App Store, and trademark databases
  (EUIPO, INPI for France, OMPIC for Morocco, WIPO Global Brand Database).
- Known conflict: Kind Words (2019, by Popcannibal) is a BAFTA-winning
  game, with a sequel, where players exchange worries and comforting
  letters. Very close concept.
- Decide the final name before the icon, store listing and first test
  build.
- The package name com.kindwords.app can't be changed once a build is
  uploaded to Play Console. Confirm it before then.

### 9B — Content review (the real release blocker)
- Native-speaker review of the French, Spanish and Darija UI strings and
  quotes. Ship only reviewed languages; if Spanish can't be reviewed in
  time, hide it from the pickers like Darija.
- Make review easy for people who don't code: a script that exports quotes
  and UI strings per language to a CSV spreadsheet with a column for
  corrections, and a script that imports the corrections back.
- A sensitivity read of all quotes by someone who has lived through grief
  or illness.
- Religious quotes: check what they say, then decide between faith-neutral
  wording and letting the user choose a tradition (a Muslim user in
  Morocco and a Catholic user in France may not want the same prayer).
- Language detection: check whether a phone set to Arabic still defaults
  to Darija while Darija is hidden. If so, fall back to French or English
  until Darija is reviewed.
- Keep a "Needs native review" checklist here and tick items off as
  they're reviewed.

**Needs native review** (all written by Claude, not by a native speaker):
- [ ] Darija quotes: the 40 `"language": "ary"` entries in
  `src/data/quotes.json`
- [ ] Darija UI strings: `src/i18n/locales/ary.json`, plus the Darija day
  and month names in `src/i18n/dateNames.ts`
- [ ] French quotes: the 40 `"language": "fr"` entries
- [ ] French UI strings: `src/i18n/locales/fr.json`, plus the French day
  and month names
- [ ] Spanish quotes: the 40 `"language": "es"` entries
- [ ] Spanish UI strings: `src/i18n/locales/es.json`, plus the Spanish day
  and month names

Review Darija first: it carries the most risk. It has no single standard
spelling, and the text uses one unmarked form for the gendered "you"
throughout, which a native speaker may want to revisit (CHANGELOG.md,
Phase 6).

### 9C — Care and accessibility (moved forward from the old Phase 10)
- A quiet, optional "Need to talk to someone?" page with support lines by
  country (France, Morocco, Spain, plus a general fallback). Never a
  pop-up. Verify every number against an official source when building it.
- Show it gently: a small line under the check-in when someone picks
  "Heavy". Nothing is stored.
- Respect the phone's "remove animations" (reduce motion) setting: world
  decorations stay still.
- Test every world at the largest system font size and fix what breaks.
- A "plain font" option that keeps the world's look with a readable font
  (MedievalSharp, Caveat and similar are hard for older eyes).
- Screen reader labels on every button and icon.

### 9D — Privacy and trust
- Plain-language privacy policy on a simple public web page (Play Console
  needs a URL; the same site can later host the App Links / Universal
  Links files).
- Play's Data safety form: "no data collected", as long as nothing leaves
  the phone.
- In the app: a short privacy page saying everything stays on the phone,
  and a "Delete all my data" option.
- In the store listing: "Nothing leaves your phone."

### 9E — Protect the notes
- Notes, especially messages from loved ones, live only on the phone.
  Check that Android's automatic backup covers them (Expo's
  `android.allowBackup`, on by default) and test a restore (reinstall, or
  a second phone).
- "Export my data" (notes, favorites, events, settings) to a file through
  the share sheet, and "Import" to restore it. This gives a backup without
  accounts.

### 9F — Quick product fixes before the test
- No repeats: go through the whole matching pool before a quote comes back
  (per language, still respecting "not for me", hidden quotes and check-in
  weights).
- Events closer to the original idea (here if quick, otherwise first thing
  in Phase 11):
  - Optional event time. With a time, the "before" kind word comes an hour
    or two before and the "after" one that same evening. Without a time,
    keep today's behavior (9:00 the day before and the day after).
  - Yearly repeat for anniversaries and grief days, and for notes for
    someone else's day (birthdays, from 8C).
  - Quiet hours still apply.

### 9G — Scheduling tests and reliability
- Jest unit tests for reminderPlan.ts (pure date math) and quote picking:
  quiet hours, snooze, "not today", gentle pacing, events (day before,
  morning-of fallback, day after, event times if 9F is done), notes
  (future-you, someone else's day), duplicate custom times, the 50-item
  cap. The Phase 2 and 3 fixes were scheduling bugs, and 7D rebuilt the
  scheduler, so this matters.
- Clock changes: run the tests in both the Europe/Paris and
  Africa/Casablanca time zones. Cover France's changes (back an hour in the
  night of Oct 24–25, 2026; forward on Mar 28, 2027) and Morocco's clock
  change around Ramadan (the time zone database has the dates). Compute
  times with calendar dates in local time, never by adding 24 hours in
  milliseconds.
- Android 14+ doesn't grant `SCHEDULE_EXACT_ALARM` by default: explain it
  gently and link to Settings > Alarms & reminders. The app must still work
  if the user says no.
- A short in-app guide for phones that kill background notifications
  (Samsung, Xiaomi, etc.): how to exempt Kindwords from battery
  optimization.

### 9H — Store assets and real phones
- App icon and splash screen (replacing the Expo defaults), matching the
  worlds' look.
- Widget preview image for the widget picker (the 7C "Not done").
- Store listing text and screenshots in the languages that actually ship
  (the old roadmap said "English, French and Arabic", which no longer
  matches).
- An EAS production build (AAB), tested on a few real phones: a Samsung, a
  Xiaomi, and an older low-end Android. Check notification behavior on
  each.

## Phase 10 — Android launch
- Google Play: personal developer accounts created after November 13, 2023
  must run a closed test with at least 12 testers who stay opted in for 14
  days in a row before applying for production.
- Recruit more than 12 (aim for 15–20), ideally people who fit the
  audience: if the count drops below 12, the 14 days start over. Start
  recruiting during Phase 9.
- Budget about three weeks: the 14 days, then the production application,
  then review.
- Use the internal testing track for quick builds alongside it (internal
  testing doesn't count toward the 14 days).
- Feedback: an in-app "Send feedback" email link. No analytics SDKs
  (they'd change the Data safety form); Play Console's Android vitals
  shows crashes.
- Fix what testers report, apply for production, publish with EAS Submit.

## Phase 11 — Grow after launch (guided by testers)
- AI-assisted quote library: use Claude during development, not inside the
  app, to draft a few hundred quotes per language, following the quote
  rules in CLAUDE.md and tagged like the existing ones (circumstances,
  eventTypes, mood, language). A person reviews every quote before it
  ships (same process as 9B). New quote files can reach users through EAS
  Update, without a store release.
- Event improvements, if not done in 9F.
- Keep kind words coming for people who stop opening the app (today they
  stop after about two months): a daily background task
  (expo-background-task) that tops up the plan at the weekly pace. New
  native module, so it needs a new EAS build.
- Whatever testers ask for most.

## Phase 12 — iOS
- iOS adjustments and App Store release (EAS Build + EAS Submit). Test on a
  real iPhone first.
- iOS keeps only the 64 soonest scheduled local notifications per app: on
  iOS, cap the whole plan (kind words, events, notes) below that, soonest
  first.
- iOS widget (likely expo-widgets).
- Check that shared pictures aren't blank on iPhone (react-native-view-shot's
  `useRenderInContext` is the usual fix).
- Android App Links and iOS Universal Links on our own domain, so the
  Kindwords link (8B) opens the app when it's installed and sends everyone
  else to the right store. The Android part can come earlier, once the app
  is on Play.

## Phase 13 — Optional: live AI and accounts (only if users ask)
Live AI quotes (the old Phase 9 plan):
- A small serverless backend calling the Claude API to generate quotes from
  circumstance, event type and language. API key server-side, strict
  safety guidelines, pre-fetched batches, bundled quotes as the offline
  fallback.
- Decide the business model first (free limit, subscription, or one-time
  purchase): generation costs money per user, and a paywall in front of
  lonely people goes against the app's purpose.
- Generated quotes would reach people without human review, so the safety
  rules and testing must be strict.
- Keep the human-written library as the base, with AI adding variety.
  Before release, review a sample of generated quotes by hand in every
  supported language, Darija included.
- Update the privacy policy and Data safety form first, since data would
  leave the phone.

Accounts and sync:
- Optional and late. A ready-made service (Firebase Auth or Supabase Auth)
  with Google sign-in or an email magic link; never our own password
  system.
- Back up only what's needed, encrypted. GDPR applies, and so does
  Morocco's Law 09-08.
- Google Play requires a way to delete the account and its data, in the
  app and on the web.
- The app keeps working fully offline without an account.

## Backlog (not scheduled)
- Android notification action buttons (Snooze, Save, "Not today") — 5A, 7D.
- Per-world tab icon style and button shape — 5C.
- Darija in Arabic script, with RTL layout and an Arabic-script font — 6.
  People whose phones are in Arabic read Arabic script, so this may suit
  them better than Latin letters.
- Arabic (MSA) and Tamazight — 6.
- An occasion type for notes for someone else's day — 8C.
- High-contrast mode — old Phase 10.
- Read-aloud of the quote — old Phase 10.
- An in-app larger text option, if the system font size isn't enough — old
  Phase 10.
- Seasonal content (Ramadan, Eid, Christmas, New Year, Mother's Day), with
  care for people who find holidays hard — old "Later ideas".
- Quote packs by situation (grief, chronic illness, new parent, exams) —
  old "Later ideas".
- Gentle sounds or haptics per world — old "Later ideas".
- Wear OS / smartwatch notification — old "Later ideas".
