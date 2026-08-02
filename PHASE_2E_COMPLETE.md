# Phase 2E — Location and Nearby

Status: Complete

## Included

- Tap-triggered location permission
- Live user marker
- Accuracy radius
- GPS refresh through `watchPosition`
- Haversine distance calculations
- Human-readable meter and kilometer labels
- Nearby sorting and category filtering
- Location-aware place previews
- Distance labels in place, search, and Saved lists
- Home Nearby action connected to the map
- Denied, unavailable, timeout, unsupported-browser, and retry states
- Manual browsing remains available without GPS

## Privacy behavior

The location is held in React state for the current browser session only. It is not sent to the Places database or saved in the Google Sheet.
