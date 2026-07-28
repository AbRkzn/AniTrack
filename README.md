# AniTrack

**Offline-First Farm Management for Modern Farmers**

AniTrack is a production-ready, offline-first farm management mobile app for
farmers, farm owners, and agricultural workers. Every core feature works with
zero connectivity; weather data and cloud backups sync opportunistically when
a connection is available.

## Tech Stack

| Concern | Choice |
|---|---|
| App framework | React Native + Expo SDK (Expo Router) |
| Language | TypeScript |
| State | Zustand |
| Local database | SQLite (`expo-sqlite`) |
| Forms & validation | React Hook Form + Zod |
| Notifications | Expo Notifications |
| Charts | React Native Chart Kit |
| Cloud sync (Phase 8) | Supabase |

## Architecture

Clean Architecture + Repository Pattern, feature-based folder structure:

```
src/
├── app/            # Expo Router routes (screens & navigation)
├── components/     # Reusable, presentation-only UI components
├── database/       # SQLite connection, schema, migrations, repositories
├── features/       # Feature modules: validation schemas, feature logic
├── hooks/          # Shared React hooks
├── services/       # Cross-cutting services (weather, notifications, backup, sync)
├── store/          # Zustand stores (one per feature domain)
├── types/          # Shared TypeScript models
├── constants/      # Design tokens: colors, spacing, typography
└── assets/         # Images & icons
```

Data flow is one-directional: **Screen → Zustand store → Repository → SQLite**.
Screens never touch SQL directly; repositories are the only place that knows
the schema, which keeps the schema swappable and testable.

## Offline-First Strategy

- All writes go to SQLite first and complete synchronously from the user's
  point of view — there is no "waiting for the network" state anywhere in
  the core CRUD flows.
- `weather_cache` stores the last successful fetch plus an `is_stale` flag,
  so the Weather screen always has something to show.
- `synced_at` / `is_deleted` columns on syncable tables lay the groundwork
  for a future last-write-wins sync engine against Supabase (Phase 8)
  without requiring a schema migration later.
- Backups are plain files written via `expo-file-system`/`expo-sharing` and
  tracked in `backup_history` — no network required to protect your data.

## Getting Started

```bash
npm install
npx expo start
```

Requires the Expo Go app or a development build on a physical device/simulator.

## Development Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Project setup, navigation, theme system, SQLite setup, schema | ✅ Done |
| 2 | Dashboard module, Crop Management module | ⬜ Next |
| 3 | Fertilizer Management, Notification system | ⬜ |
| 4 | Harvest Tracking, Expense Tracking | ⬜ |
| 5 | Reports & Analytics | ⬜ |
| 6 | Weather Synchronization | ⬜ |
| 7 | Backup & Restore | ⬜ |
| 8 | Cloud Synchronization (Supabase) | ⬜ |

## Git Workflow

Each phase is developed on its own feature branch and merged via PR using
Conventional Commits, e.g.:

```
feat(phase-1): project setup, navigation, theme system, sqlite schema
```

## License

Proprietary — © AniTrack.
