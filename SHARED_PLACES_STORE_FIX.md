# Shared Places Store Fix

The Places CSV now loads once at the App level and is shared by every surface that needs place data.

## What changed

- Removed the independent CSV fetch from `MapScreen`.
- Removed the independent CSV fetch from the category search sheet.
- Added one `usePlacesData` store in `App.tsx`.
- Map markers, category search, loading state, offline state, and refresh now use the same in-memory data.
- Refreshing the database aborts any older in-flight request before the replacement request takes over.
- Going offline keeps the last successful live data in memory when available; a fresh offline launch still uses the built-in snapshot.
- Returning online automatically performs one shared live-data refresh.

This prevents duplicate downloads and temporary disagreements between the map and category results.
