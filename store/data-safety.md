# Google Play: Data safety and privacy answers

What to answer in Play Console (App content), and why. Checked against
Google's Data safety guidance on 2026-10-10. Play Console's wording may
differ slightly from the questions below.

## Data safety form

**Does your app collect or share any of the required user data types?**
No.

Why that's accurate, in Google's own terms:
- *Collection* means "transmitting data from your app off a user's
  device", including through libraries and SDKs. Kindwords has no server,
  no analytics or crash-reporting SDK and no ads, and none of its libraries
  sends anything: notifications are local only (no push token is ever
  requested), and the language and region are read on the phone.
- *Sharing* doesn't include "transferring user data to a third party based
  on a specific user-initiated action, where the user reasonably expects
  the data to be shared". That's exactly what "Send a kind word", sharing
  a picture and "Export my data" do: the user taps a button and picks the
  app in the phone's share menu.
- Android's own backup (Auto Backup) is run by the phone, into the user's
  own Google account, and is end-to-end encrypted on Android 9+ when a
  screen lock is set. Google lists end-to-end encrypted data as not
  collected, and the developer never has access to it.
- Crash reports in Play Console (Android vitals) come from Google Play
  itself, not from code in the app.

**Does your app allow users to create an account?** No.

**Data deletion:** not required when nothing is collected. Worth knowing
anyway: Settings > Privacy and your data > "Delete all my data" erases
everything the app keeps.

## Other App content items
- **Privacy policy URL:** `docs/privacy.html` once GitHub Pages is on
  (https://soufiane94.github.io/KindWords/privacy.html, see CHANGELOG.md,
  9D). Google requires a privacy policy even when no data is collected,
  and the app links to it from Settings > Privacy and your data. Fill in
  the developer name and contact email first.
- **Ads:** the app contains no ads.
- **Exact alarms:** the app uses `SCHEDULE_EXACT_ALARM`, which the user
  grants in system settings. Only `USE_EXACT_ALARM` needs a Play
  declaration, and the app doesn't use it.

## When these answers stop being true
Update this file, the privacy policy (`docs/privacy.html`) and the in-app
privacy page *before* shipping any of these:
- an analytics, crash-reporting (Sentry, Crashlytics…) or ads SDK;
- EAS Update (the app would check Expo's servers for updates on launch);
- push notifications (a push token is sent to a server);
- accounts, sync or live AI quotes (Phase 13).
