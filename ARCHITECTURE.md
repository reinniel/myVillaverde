# Architecture

myVillaverde is a client-side Vite and React application. The current architecture grew out of the Phase 3R extraction refactor and now supports the completed map, place-page, nearby, saved, Phase 6A visitor discovery, Phase 6B barangay discovery, Phase 6C trip-planning MVP, Phase 6D polish, the v1.0.1 release-hardening pass, and an initial native single-place directions experience.

## Application boundaries

- `src/App.tsx` owns app-level state, Ko/Mo mode transitions, browser-history coordination, selected places, and screen orchestration.
- `src/screens/` owns full page-level experiences: landing, local dashboard, visitor dashboard, map, place details, and native directions.
- `src/components/` contains reusable interface behavior such as mode headers, category lists, saved collections, the ID-backed trip planner, galleries, the accessible bottom sheet, the directions bridge, and the top-level render error boundary.
- `src/hooks/usePlacesData.ts` owns the single live Places CSV request, online/offline transitions, reloads, and fallback selection.
- `src/data/` contains static barangay/category configuration, the live-feed URL, and the generated offline Places snapshot.
- `src/utils/` contains CSV normalization, place filtering, opening-hours parsing, distance calculations, map persistence, place navigation, and routing helpers.
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
- Place-page, visitor-barangay, and focused-map URLs use query parameters coordinated by `placeNavigation.ts` and `App.tsx`. Temporary sheets, galleries, and the native directions overlay use `history.state`, keeping the URL clean while Back/Forward restores their exact context without React Router.
- `NativeDirectionsBridge` only intercepts the existing single-place Google Maps directions link while a `?place=` page is active. Trip-planner directions are deliberately left unchanged for this MVP.
- Selected barangay, map view, favorites, Want to Visit, recently viewed data, and ordered trip place IDs are stored locally under versioned keys.
- Saved-place migrations preserve older ID-only entries until their live records can be restored.
- Trip plans never copy place records: each stop resolves by ID against the current live or fallback dataset, so the Places sheet remains authoritative.

## Native directions flow

1. A user selects **Directions** from a place page.
2. `NativeDirectionsBridge` captures that single-place action and stores the destination in browser history state.
3. `DirectionsScreen` requests the device's current location. Permission denial, unavailable GPS, timeout, and route errors remain explicit UI states.
4. `src/utils/routing.ts` requests a driving route from the configured OSRM-compatible endpoint using the current GPS coordinates and the destination coordinates.
5. OSRM route geometry is converted from GeoJSON longitude/latitude order to Leaflet latitude/longitude order.
6. The route, origin accuracy circle, destination, distance, estimated drive time, and maneuver list render inside the existing React Leaflet / OpenStreetMap stack.
7. **Open in another navigation app** offers explicit handoff links for Apple Maps, Waze, and Google Maps.
8. Browser Back closes native directions and restores the place page. If the native bridge cannot execute, the existing external Google Maps link remains a progressive fallback.

The initial endpoint is the public Project OSRM demo service. It is suitable for the MVP but is not considered the final production infrastructure dependency. A dedicated or self-hosted OSRM-compatible service is the intended path for stronger infrastructure independence and service reliability.

## Data integrity rules

- Place IDs must be unique.
- Categories must map to a supported app category.
- Latitude and longitude must be valid numbers.
- Duplicate and permanently closed source rows are excluded.
- Photos require both an approved permission value and a supported HTTP(S) URL.
- External website and source links must use an absolute HTTP(S) URL.
- Missing ratings, popularity, operating details, or barangay claims must remain unknown rather than being fabricated.

## Source-of-truth model

- **Application code:** GitHub `main` is authoritative.
- **Places data:** the published myVillaverde Places Google Sheet is authoritative.
- **Production:** Cloudflare deploys from the verified GitHub baseline.
- **Development/editor environments:** Google AI Studio or other editors may be used for active work, but their state is not canonical until the changes are committed and verified on GitHub `main`.

## Release workflow

1. Make application changes against the current GitHub `main` baseline.
2. Keep the generated fallback synchronized with the authoritative live Places source.
3. Run typecheck, tests, production build, and preview checks before release changes are finalized.
4. Confirm the GitHub checkpoint matches the reviewed development state.
5. Complete visual and interaction verification of empty, offline, loading, mobile, accessibility, persistence, routing, and recovery states.
6. Run `npm run verify` for every release gate; it checks source data, TypeScript, targeted utility tests, and a forced production build.
7. Publish releases from the verified GitHub baseline and deploy production from that same baseline.

## Production deployment

myVillaverde is deployed to Cloudflare as a static Vite build. The production branch is `main`.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy --assets=./dist`
- Version command: `npx wrangler versions upload --assets=./dist`
- Build output: `dist/`

Non-production branch builds may be disabled when branch previews are not needed. Production deployment should always trace back to a verified GitHub commit.

## Deferred decisions

- React Router remains deferred while the current history behavior is stable.
- Server-side rendering remains deferred because the product is a client-side local guide.
- Multi-stop trip routing remains on the existing external flow until native single-place routing has passed production QA.
- A dedicated or self-hosted routing backend remains a follow-up to the public OSRM MVP endpoint.
- Component and end-to-end coverage should be added as the Phase 7 interaction surface grows; targeted Node tests currently protect navigation history, URL validation, duplicate-ID rejection, live-data fallback behavior, and routing utilities.
- Broader design-system extraction should follow demonstrated reuse rather than happen preemptively.
- The production build wrapper sets `NODE_ENV=production` inside Node so host-level development environment variables cannot silently produce an oversized release bundle.
