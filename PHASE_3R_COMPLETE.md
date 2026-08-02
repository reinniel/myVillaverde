# Phase 3R — Modular architecture refactor

This release reorganizes the Phase 3A app without redesigning its interface or replacing its existing browser-history navigation.

## Extracted areas
- shared types
- barangay, category, configuration, and fallback-place data
- place parsing, distance, map-storage, and place-URL utilities
- shared places-data and reduced-motion hooks
- reusable header, bottom-sheet, empty-state, artwork, quick-action, and category-list components
- landing, dashboard, map, and place-page screens
- global application styles

## Intentional cleanup
- Removed the silent 50-place saved-items cap. Existing saves are preserved and adding a new save no longer discards the oldest one.

## Deferred
- React Router
- SSR guards
- photo/gallery functionality
