# Phase 2F — Final Map Polish

Status: Complete

## Reliability

- Added live, loading, snapshot, and offline database states.
- Added map-tile loading and failure feedback with an online retry action.
- The built-in place snapshot remains usable when the published Google Sheet or network is unavailable.
- Returning online automatically retries the live database and map tiles.

## Mobile layout

- Map height follows the visual viewport, including browser chrome and keyboard changes.
- Leaflet recalculates its size after viewport changes and rotations.
- Compact pills and the map header respect left, right, top, and bottom safe areas.
- Rubber-band page scrolling is disabled while the full-screen map is open.
- Map controls progressively hide when the sheet leaves insufficient map space, preventing overlap on short screens.

## Motion and interaction

- Map movement honors the device's reduced-motion preference.
- Sheet, marker, and page animations also collapse to near-instant motion when reduced motion is enabled.
- Escape now closes the current place, clears search, returns from Nearby/Layers/Location, collapses the sheet, then exits the map in that order.

## Accessibility

- Added live screen-reader announcements for selected places and map/database state.
- Added busy states for data and map loading.
- The draggable sheet exposes its three levels as an accessible slider with keyboard controls.
- The sheet title and content are linked with accessible IDs.
- Hidden map controls are removed from keyboard navigation.

## Validation

- TypeScript/TSX transpilation completed with zero syntax diagnostics.
- A full Vite build could not run in this environment because its npm mirror does not contain `@tailwindcss/vite`.

## Shared place data

- Lifted the Places loader to App-level state.
- MapScreen and category search now use the same cached rows and status.
- Removed the second CSV download and independent loading race.
- Offline transitions preserve the last successful live rows in memory when available.
