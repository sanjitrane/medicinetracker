# Google Play submission readiness — Medicine Tracker

Audited 2026-09-24, against the codebase as of this commit. Target: **Internal/Closed testing** track first.

## TL;DR

Not blocked for **Internal testing** (a handful of invited testers). **Blocked for
Production** (public listing) until the two items in "Must fix before Production"
are addressed — Google's app review and ongoing policy enforcement will catch both.

## Must fix before Production (not required for Internal testing)

1. **Auth is not real.** [`src/features/auth/services/hardcodedAuthService.ts`](src/features/auth/services/hardcodedAuthService.ts)
   accepts the fixed code `12345` for any phone number — there's no actual identity
   check. Fine for testers who know it's a demo; not fine once the public can sign
   in as anyone. Fix: swap in a real OTP provider (Twilio Verify, Firebase Auth
   phone sign-in, AWS SNS) behind the existing `AuthService` interface — the app
   already isolates this behind `authService.ts`, so the UI and flow don't change,
   only `hardcodedAuthService.ts` gets replaced.

2. **Your OpenAI API key ships inside the app.** `.env`'s
   `EXPO_PUBLIC_OPENAI_API_KEY` gets compiled straight into the client JS bundle —
   anyone can pull it out of the installed APK with a text search. Two consequences:
   it's a live credential leak, and it lets any installer run up charges on your
   OpenAI account for free. Fix: move the OpenAI call in
   [`openAiOcrService.ts`](src/features/scanner/services/openAiOcrService.ts) behind
   a small backend/proxy endpoint you control (even a single serverless function),
   so the key never leaves your server. **Regardless of the Play Store timeline,
   rotate this key now** — it's sitting in a plaintext `.env` file and was visible
   in this session's terminal output.

Both are pre-existing, documented design choices (see the code comments citing
`phase2_architecture.md` and `architecture.md #32`) made for a personal/local build,
not gaps introduced by accident — they just don't survive contact with a public
store listing.

## Confirmed OK

| Item | Status |
|---|---|
| `compileSdkVersion` / `targetSdkVersion` | 36 (current Android API level — satisfies Play's target-API policy) |
| `minSdkVersion` | 24 |
| Package name | `com.sanjit.medicinetracker` (consistent across `app.json` iOS/Android) |
| App icon, adaptive icon (foreground/background/monochrome), splash | present in `assets/` |
| Camera permission | declared in `app.json`, with a user-facing rationale string via the `expo-camera` plugin config |
| Notification permission | handled by the `expo-notifications` plugin; requested contextually at runtime (`notificationScheduler.ts`), not on launch |
| EAS account | linked and authenticated (`sanjitrane` / `sanjitrane12@gmail.com`); `projectId` set in `app.json` |
| Build profiles | `eas.json` has `development`, `preview`, and `production` profiles; `appVersionSource: "remote"` + `autoIncrement` means EAS manages version codes for you |
| Signing | no release keystore exists yet locally — that's expected. EAS auto-generates and manages one the first time you run a build, unless you opt to supply your own |
| Backend / data residency | app has no backend at all; all data is local SQLite + SecureStore, except the one-off OCR photo upload to OpenAI |

## Generated for you in this pass

| File | Purpose |
|---|---|
| [`privacy-policy.html`](privacy-policy.html) | Public privacy policy. **Required by Play Console even for Internal testing.** See hosting steps below. |
| [`store-listing/title.txt`](store-listing/title.txt) | App title (16/30 chars) |
| [`store-listing/short_description.txt`](store-listing/short_description.txt) | Short description (67/80 chars) |
| [`store-listing/full_description.txt`](store-listing/full_description.txt) | Full description (1101/4000 chars) |
| [`store-listing/data-safety-answers.md`](store-listing/data-safety-answers.md) | Exact answers for the Play Console "Data safety" questionnaire, derived from what the code actually sends/stores |
| [`store-listing/content-rating-and-category.md`](store-listing/content-rating-and-category.md) | Category, target-audience, and content-rating questionnaire guidance |

These three sections of Play Console — **Privacy policy, Data safety, Content
rating/target audience** — are gated as prerequisites before *any* release,
including Internal testing, can roll out. Store listing polish (screenshots,
feature graphic) is generally only enforced before Production.

## Not generated — needs a design pass before Production

- **Screenshots** (min. 2 phone screenshots, PNG/JPEG, 320–3840px). Not required to
  start Internal testing. When you're ready, I can drive the app on the Android
  emulator again and capture real screens (Home, Today's Doses, Dose Reminders,
  Add Medicine) the same way I did earlier in this session.
- **Feature graphic** (1024×500 banner). Only required before Production. This is a
  genuine marketing-design artifact — better done deliberately (e.g. with the
  `design` skill) than auto-generated as a placeholder.

## Hosting the privacy policy (GitHub Pages)

You picked GitHub Pages. One-time setup, not something I can toggle for you without
confirmation since it makes the file publicly served from your repo:

1. Commit and push `privacy-policy.html` to `main`.
2. On GitHub: repo → **Settings → Pages** → under "Build and deployment", set
   **Source: Deploy from a branch**, **Branch: main**, folder **/(root)** → Save.
3. After a minute or two it'll be live at:
   `https://sanjitrane.github.io/medicinetracker/privacy-policy.html`
4. Paste that URL into Play Console → **App content → Privacy policy**.

(I can run `gh api repos/sanjitrane/medicinetracker/pages` to enable this for you via
the GitHub CLI instead of the web UI, if you'd rather — just say so, since it's a
public-facing change I'd want your go-ahead on first.)

## Submission checklist (Internal testing)

- [ ] Push `privacy-policy.html`, enable GitHub Pages, paste the URL into Play Console
- [ ] Play Console → App content: fill in Data safety (`store-listing/data-safety-answers.md`), content rating + target audience (`store-listing/content-rating-and-category.md`)
- [ ] Play Console → Store listing: paste in `title.txt` / `short_description.txt` / `full_description.txt`, upload `assets/icon.png` as the app icon
- [ ] Build a release artifact: `eas build -p android --profile preview` (or `production`, once you're ready) — this also generates/uses your managed signing key on first run
- [ ] Play Console → Testing → Internal testing: create a release, upload the `.aab` EAS produced, add tester emails
- [ ] Rotate the OpenAI key in `.env` regardless of Play Store timing — it's been exposed in this session
- [ ] Before moving to Production: fix the two "Must fix" items above, then generate screenshots + feature graphic
