# Architecture

myVillaverde is a client-side Vite and React application. The current architecture grew out of the Phase 3R extraction refactor and now supports the completed map, place-page, nearby, saved, and Phase 6A visitor-discovery work.

## Application boundaries

- `src/App.tsx` owns app-level state, Ko/Mo mode transitions, browser-history coordination, selected places, and screen orchestration.
- `src/screens/` owns full page-level experiences: landing, local dashboard, visitor dashboard, map, and place details.
- `src/components/` contains reusable interface behavior such as mode headers, category lists, saved collections, galleries, and the accessible bottom sheet.
- `src/hooks/usePlacesData.ts` owns the single live Places CSV request, online/offline transitions, reloads, and fallback selection.
- `src/data/` contains static barangay/category configuration, the live-feed URL, and the generated offline Places snapshot.
- `src/utils/` contains CSV normalization, place filtering, opening-hours parsing, distance calculations, map persistence, and place navigation helpers.
- `src/types/app.ts` defines the shared data and UI contracts.

## Places data flow

1. `usePlacesData` starts with the generated `FALLBACK_PLACES` snapshot.
2. When online, it fetches `PLACES_CSV_URL` with cache busting.
3. `normalizePlacesCsv` validates and maps supported live rows into `PlaceRecord` objects.
4. A successful live load becomes the in-memory cache used by all screens.
5. If the device goes offline, the app keeps the last successful live data when available; otherwise it uses the generated snapshot.

The published Google Sheet is authoritative. Run `npm run data:sync` after canonical data changes and `npm run data:check` to detect drift. The generator is `scripts/sync-places-fallback.mjs`.

## Navigation and persistence

- The app intentionally uses browser history without React Router.
- Place-page, visitor-barangay, and focused-map URLs use query parameters coordinated by `placeNavigation.ts` and `App.tsx`, so Back/Forward restores the correct surface without React Router.
- Selected barangay, map view, favorites, Want to Visit, and recently viewed data are stored locally under versioned keys.
- Saved-place migrations preserve older ID-only entries until their live records can be restored.

## Data integrity rules

- Place IDs must be unique.
- Categories must map to a supported app category.
- Latitude and longitude must be valid numbers.
- Duplicate and permanently closed source rows are excluded.
- Photos require both an approved permission value and a supported HTTP(S) URL.
- Missing ratings, popularity, operating details, or barangay claims must remain unknown rather than being fabricated.

## Current delivery sequence

1. Keep Google AI Studio as the active working copy and GitHub `main` as its verified versioned mirror.
2. Keep the generated fallback synchronized with the live Places source.
3. Run typecheck, production build, and preview checks before committing from AI Studio to GitHub.
4. Confirm the GitHub checkpoint matches the verified AI Studio state.
5. Complete and verify the Phase 6B.2 barangay detail flow on the verified baseline.

## Deferred decisions

- React Router remains deferred while the current history behavior is stable.
- Server-side rendering remains deferred because the product is a client-side local guide.
- Automated component and end-to-end tests should be added as the Phase 6B interaction surface grows.
- Broader design-system extraction should follow demonstrated reuse rather than happen preemptively.
