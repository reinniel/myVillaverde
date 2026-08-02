# myVillaverde — Phase 3R Modular Refactor

This build preserves the Phase 3A interface and behavior while reorganizing the app into maintainable modules before photos and galleries are added.

## What remains unchanged

- Ko, Home, and Mo experiences
- Barangay selection and theming
- Live Google Sheets place data with snapshot/offline fallback
- Leaflet map, categories, markers, Nearby, location, and saved places
- Three-level map bottom sheet and compact pills
- Dedicated place pages and `?place=<Place ID>` browser-history flow
- Accessibility, focus handling, reduced motion, and safe-area behavior

## Architecture

```text
src/
├─ components/   Reusable interface components
├─ data/         Barangays, categories, config, and fallback places
├─ hooks/        Shared data and browser-preference hooks
├─ screens/      Landing, dashboards, map, and place pages
├─ styles/       Application-wide animation and map styles
├─ types/        Shared TypeScript models
├─ utils/        Place, URL, distance, and map-storage helpers
└─ App.tsx       App-level state, orchestration, and modal routing
```

## Intentional cleanup

The silent 50-place saved-items cap was removed. Adding another saved place no longer discards the oldest entry.

## Run in Google AI Studio

Upload the full ZIP as the project. Phase 3R is multi-file, so replacing only `App.tsx` is not sufficient.

The published Places CSV URL is already configured. Geolocation requires an HTTPS preview and user permission. When offline, the app retains the latest in-memory place data when available, otherwise it uses the built-in snapshot.

## Next phase

Phase 3B adds place photos and a gallery on top of this modular structure.
