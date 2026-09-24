# Play Console → App content → Data safety

This form is filled out in the Play Console UI, not uploaded as a file. Use these
answers — they're derived directly from what the code actually does (see the
codebase audit in `../PLAY_STORE_READINESS.md`), not guessed.

## Does your app collect or share any of the required user data types?
**Yes.**

## Data types

| Category | Type | Collected? | Shared? | Purpose | Notes |
|---|---|---|---|---|---|
| Personal info | Phone number | Yes | No | Account management (sign-in) | Stays on-device (secure local storage) |
| Personal info | Name | Yes | No | App functionality | The *patient's* name, entered by the user; stays on-device |
| Photos and videos | Photos | Yes (optional) | **Yes — to OpenAI** | App functionality (medicine-label OCR) | Only when the user taps "Scan Medicine." Not stored by the app before or after the request. Declare the third party as OpenAI, purpose "App functionality," and "processed ephemerally" (not retained). |
| Health and fitness | Health info | Yes | No | App functionality | Medicine names, dosages, schedules — entered by the user, stored locally only |

Everything else (Location, Financial info, Messages, Web browsing, App activity,
App info and performance, Device or other IDs) — **not collected.**

## Security practices section

- **Is all user data encrypted in transit?** Yes (the only network call, to OpenAI,
  is HTTPS).
- **Do you provide a way for users to request data deletion?** Yes — describe it as
  "in-app deletion (delete the patient or medicine record) and uninstalling the app
  removes all local data," since there is no server-side copy to separately delete.
- **Data collection is optional / can be disabled?** The photo-scan data sharing is
  optional — the app has a manual-entry path that sends nothing anywhere.

## Why "Health info" is called out separately

Play's data-safety taxonomy has a specific "Health and fitness" category. Because
this app's core purpose is tracking medicines and dosages, decline to under-classify
this as generic "App activity" — use Health info even though the data itself is
just text the user typed in, since it's the kind of app policy reviewers expect to
apply extra scrutiny to.

## Third-party data sharing disclosure text (paste into the relevant field)

> When you use the camera-scan feature, a photo of the medicine packaging is sent
> to OpenAI to extract the medicine name and dates. OpenAI is used only for this
> one-off processing request and does not receive any other app data. See our
> Privacy Policy for details.
