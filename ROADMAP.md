# Kindwords roadmap

Kindwords sends occasional warm, gentle kind words to people who may feel
alone, to bring a smile.

**Current:** Phase 9 — Release readiness: everything but 9B is built.
**Next:** 9B (content review), the name decision (9A), and the checks on a
phone listed under each sub-phase; then Phase 10.

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

### 9A — Name check ✅ research done · name decision pending (yours)
"Kindwords" is crowded: "Kind Words - The Kindest App" has been on Google
Play since September 2025 with the same promise, on top of Popcannibal's
BAFTA-winning Kind Words games. Recommendation: rename before the store
listing and the first upload. Details and the rename checklist in
CHANGELOG.md.
- [ ] Trademark searches for the candidate names (TMview, INPI, OMPIC,
  WIPO, USPTO): they only work in a browser.
- [ ] Decide the name, and confirm the package name (com.kindwords.app or
  a new one) before any upload to Play Console.

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
- [ ] First within those files: the "Need to talk to someone?" page
  (`support.*` and `checkIn.heavyLine`), since it's safety content (9C)
- [ ] The French and Spanish privacy policy (`docs/privacy.html`, 9D)
- [ ] The French and Spanish store listings (`store/listing.md`, 9H)

Review Darija first: it carries the most risk. It has no single standard
spelling, and the text uses one unmarked form for the gendered "you"
throughout, which a native speaker may want to revisit (CHANGELOG.md,
Phase 6).

### 9C — Care and accessibility ✅
"Need to talk to someone?" page (numbers checked 2026-10-10) with a gentle
line under a "Heavy" check-in, decorations kept still with reduce motion, a
plain font option, large-text layout fixes, and screen reader labels.
Details in CHANGELOG.md.
- [ ] On a phone: every world at the largest font size (up to 200% on
  Android 14), with TalkBack on, and with "Remove animations" on.
- [ ] Before each release: check the support numbers again
  (`src/data/supportLines.ts`).

### 9D — Privacy and trust ✅
In-app "Privacy and your data" page with "Delete all my data"; a privacy
policy page in English, French and Spanish (`docs/`, for GitHub Pages);
Data safety answers and the English store listing in `store/`. Details in
CHANGELOG.md.
- [ ] Fill in the developer name and contact email in `docs/privacy.html`
  (three places each).
- [ ] Turn on GitHub Pages (repository Settings > Pages > Deploy from a
  branch > `main`, `/docs`), then check that
  https://soufiane94.github.io/KindWords/privacy.html opens. A new name or
  domain means updating `PRIVACY_POLICY_URL` in `src/data/links.ts`.
- [ ] Play Console: the privacy policy URL and the Data safety answers
  (`store/data-safety.md`).

### 9E — Protect the notes ✅
Android's automatic backup covers everything (checked: `allowBackup` is on,
and AsyncStorage's database is included by default). "Export my data" and
"Import from a file" give a backup without accounts; importing only ever
adds. Details in CHANGELOG.md.
- [ ] New EAS dev-client build (new native module: `expo-document-picker`).
- [ ] Test a restore with adb, on a phone with a screen lock:
  `adb shell bmgr enable true`, then
  `adb shell bmgr backupnow com.kindwords.app` (should say "Success"), then
  `adb shell pm uninstall --user 0 com.kindwords.app` and reinstall the APK
  with `adb install -t <apk>`. Notes, events and settings should be back
  before the app is opened.
- [ ] Export on one phone, import on another (or after "Delete all my
  data"), and import the same file twice: nothing should double.

### 9F — Quick product fixes before the test ✅
No repeats until every kind word that fits has had its turn (per language,
across Home, the widget and notifications). Events can have a time, and
events and notes for someone else's day can come back every year. Details
in CHANGELOG.md.

### 9G — Scheduling tests and reliability ✅
`npm test` runs 58 tests twice, in Paris and Casablanca time, through
France's and Morocco's clock changes. "If kind words arrive late" explains
"Alarms & reminders" and battery settings, with buttons to the right
pages. Details in CHANGELOG.md.
- [ ] New EAS dev-client build (new native module: `expo-intent-launcher`).
- [ ] On an Android 14+ phone: "Open Alarms & reminders" lands on
  Kindwords' own switch, and kind words still arrive with it off.

### 9H — Store assets ✅ · real phones pending (yours)
New app icon, splash screen and widget preview (no lettering, so they
survive a new name), Play's icon and feature graphic, the store listing in
English, French and Spanish, and a production build profile (AAB). Details
in CHANGELOG.md.
- [ ] Screenshots (the plan is in `store/listing.md`).
- [ ] `eas build --platform android --profile production`, then test it on
  a Samsung, a Xiaomi and an older low-end Android: notifications on time,
  with "Alarms & reminders" off, after a reboot; the widget; the splash
  screen; a backup restore.

### 9I — Choose a world in onboarding ✅
The welcome screen asks for a world too, under the circumstances, with the
same chips as Settings; tapping one turns the screen into that world.
Details in CHANGELOG.md.

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
