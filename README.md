# myVillaverde

myVillaverde is a mobile-first local guide for Villaverde, Nueva Vizcaya. It combines barangay-aware discovery, a live places directory, maps, nearby results, place pages, saved collections, and the VillaverdeMo visitor experience.

## Project status

- Phases 1–5 are complete.
- Phase 6A, the visitor discovery home, is complete.
- A recovery sprint is in progress to align the repository, data snapshot, and documentation.
- Phase 6B, barangay discovery, resumes after the recovery baseline passes validation.

## Sources of truth

- **Application code:** the `main` branch of this GitHub repository.
- **Place data:** the published `Places` tab configured by `DEFAULT_PLACES_CSV_URL` in `src/data/config.ts`.
- **Offline place data:** generated `FALLBACK_PLACES` in `src/data/places.ts`.
- **Roadmap:** the `myVillaverde Phases` Google Doc.

Downloaded AI Studio ZIP files are snapshots of the app, not a separate code history. Reconcile intentional AI Studio changes into GitHub before continuing development.

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

The sync command validates required columns, IDs, categories, and coordinates before replacing `src/data/places.ts`. Commit the generated change with the related data update.

## Current product boundaries

- The app is a client-side Vite and React application.
- The live Google Sheet remains the authoritative directory; the repository snapshot is an offline fallback.
- Place photos are shown only when a usable URL and approved permission are both present.
- Ratings, popularity, and tourism claims are not invented from missing data.
- Phase 6B must derive barangay identities from real available records and honest empty states.

See `ARCHITECTURE.md` for module boundaries and data flow.
