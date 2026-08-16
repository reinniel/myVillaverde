# myVillaverde

myVillaverde is a mobile-first local guide for Villaverde, Nueva Vizcaya. It combines barangay-aware discovery, a live places directory, maps, nearby results, place pages, saved collections, and the VillaverdeMo visitor experience.

## Project status

- Phases 1–5 are complete.
- Phase 6A, the visitor discovery home, is complete.
- The Phase 6 recovery baseline and Phase 6B.1 barangay cards are complete.
- Phase 6B.2, the barangay detail flow, is complete.
- Phase 6C, the ID-backed visitor trip planner and multi-stop route flow, is complete.
- Phase 6D, the final release-hardening and regression pass, is in progress.

## Working copy and checkpoints

- **Active working app:** the linked Google AI Studio project.
- **Versioned code mirror:** the `main` branch of this GitHub repository after a verified AI Studio commit.
- **Place data:** the published `Places` tab configured by `DEFAULT_PLACES_CSV_URL` in `src/data/config.ts`.
- **Offline place data:** generated `FALLBACK_PLACES` in `src/data/places.ts`.
- **Roadmap:** the `myVillaverde Phases` Google Doc.

Google AI Studio syncs changes outward to GitHub; GitHub changes do not automatically flow back into the live AI Studio app. Make application changes in AI Studio first, verify them there, and then commit the matching checkpoint to GitHub. Downloaded ZIP files remain useful inspection snapshots but are not a separate code history.

## Local development

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm run build
npm run check
npm run verify
```

## Places data flow

At runtime, `usePlacesData` requests the published Google Sheets CSV once and normalizes it into `PlaceRecord` objects. If that request is unavailable, the app uses the generated fallback snapshot so core discovery remains usable offline.

After changing the canonical Places sheet, regenerate and review the fallback:

```bash
npm run data:sync
npm run data:check
```

For a local CSV export instead of the published URL:

```bash
npm run data:sync -- --source ./places.csv
npm run data:check -- --source ./places.csv
```

The sync command validates required columns, IDs, categories, and coordinates before replacing `src/data/places.ts`. Commit the generated change with the related data update. `npm run verify` combines the live/fallback data check, TypeScript validation, and a forced production build for release handoffs.

## Current product boundaries

- The app is a client-side Vite and React application.
- The live Google Sheet remains the authoritative directory; the repository snapshot is an offline fallback.
- Place photos are shown only when a usable URL and approved permission are both present.
- Ratings, popularity, and tourism claims are not invented from missing data.
- Barangay cards and detail sheets derive counts, categories, and place links from the current database, including honest empty states.
- Trip plans store only ordered place IDs, resolve every stop against the current database, prevent duplicates, and open routes through Google Maps.
- Browser zoom remains available, reduced-motion preferences are respected, and a top-level recovery screen protects locally persisted data from render failures.

See `ARCHITECTURE.md` for module boundaries and data flow.
