# Medicine Tracker

Cross-platform (iOS + Android) app for tracking medicines, dosage schedules, remaining
quantity, expiry dates and reminders.

Built with Expo (SDK 57), React Native, TypeScript and Expo Router.

> This project is independent of any other project in the parent folder. It has its own
> `node_modules`, tooling and git history.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in EXPO_PUBLIC_OPENAI_API_KEY for the scanner
npm start          # Metro; press "i" for iOS, "a" for Android
npm run ios        # iOS simulator (requires full Xcode)
npm run android    # Android emulator
```

The scanner (camera → OCR) needs an OpenAI API key in `.env` — see `.env.example`. Without
one, scanning shows a clear error and falls back to manual entry; nothing else in the app
depends on it. Env vars are read at Metro startup, so restart `expo start` after editing `.env`.

## Checks

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # jest
npx expo-doctor    # dependency + config health
```

## Project structure

Feature-based. Business logic stays out of components so it can be tested on its own.

```
src/
├── app/                  # Expo Router routes (file-based)
│   ├── _layout.tsx       # Root Stack + SafeAreaProvider
│   ├── index.tsx         # Dashboard
│   ├── +not-found.tsx
│   ├── medicines/
│   │   ├── add.tsx       # Add medicine (scan / manual)
│   │   ├── manual.tsx    # Manual entry + edit form
│   │   └── [id].tsx      # Medicine details
│   ├── today.tsx         # Today's dose checklist (Phase 1D)
│   └── scanner/
│       └── index.tsx     # Camera → OCR → hands off to medicines/manual
│
├── features/
│   ├── medicines/        # components, screens, hooks, services, store, types, utils
│   ├── scanner/          # types, services (OCRService + OpenAI impl), utils
│   ├── notifications/    # planner (pure) + scheduler (expo-notifications I/O)
│   └── settings/
│
├── components/           # Shared UI: Button, Card, Input, Screen, EmptyState
├── database/             # SQLite client + schema
├── services/
├── utils/
├── constants/            # Design tokens
└── types/
```

### Layering

UI never touches the database directly:

```
UI → Store / Service → Repository → SQLite
```

Calculations (finish date, remaining quantity, status) live in the domain layer as pure
functions, never in components.

## Conventions

- **Dates**: calendar dates are ISO `YYYY-MM-DD` strings, not timestamps. Medicine
  scheduling is a calendar-day concern, so storing instants would drag timezone drift
  into every comparison. `createdAt` / `updatedAt` are true ISO 8601 instants.
- **Derived state**: remaining quantity, finish date and status are computed, never
  persisted, so stored data cannot drift out of agreement with itself.
- **Path alias**: `@/*` maps to `src/*`.

## Roadmap

- **1A — Foundation** ✅ project, router, layout, screens, structure, tooling
- **1B — Medicine management** ✅ SQLite, repository, store, CRUD
- **1C — Dosage engine** ✅ consumption, finish date, remaining quantity, status
- **1D — Dosage consumption** ✅ today's checklist, confirm/undo, missed-dose flag
- **Scanner** ✅ camera, OCR abstraction, OpenAI vision extraction, confirmation
- **1E — Notifications** ✅ permissions, finish/expiry reminders, rescheduling, dedup
- **1F — Polish**: states, accessibility, icon, splash, production builds
- **Phase 2**: backend, auth, cloud sync, WhatsApp

## Scope

A tracking and reminder tool — not a medical device. It never recommends, infers or
changes a dosage; the user supplies all dosage information and the app only projects
consumption from it.
