# myVillaverde Phase 5A.1 — Saved robustness and accessibility

This hardening patch addresses the review findings before Phase 5B.

## Replace

Replace this file completely:

- `src/components/SavedPlacesSheet.tsx`

## Update App.tsx

Apply `phase-5a1.patch`, or make these two edits manually:

1. Remove `Bookmark` from the `lucide-react` import in `src/App.tsx`.
2. Pass `dataState={placesDataState}` into `<SavedPlacesSheet />`.

## What changed

- Want to Visit now stores full `PlaceRecord` snapshots in
  `myVillaverde_wantToVisitPlaces_v2`.
- Existing ID-only entries from `myVillaverde_wantToVisitPlaceIds_v1` migrate
  automatically when their live records become available.
- Unresolved entries remain stored and show a restoring/unavailable notice
  instead of a false empty state.
- Recently Viewed also avoids a false empty state while place data is loading.
- The collection tabs now have:
  - matching `tab` / `tabpanel` IDs
  - `aria-controls` and `aria-labelledby`
  - roving `tabIndex`
  - Left/Right and Home/End keyboard navigation
- The dead `Bookmark` import in `App.tsx` is removed.

## Test before committing

1. Put at least one place in Want to Visit.
2. Reload on a throttled or slow connection.
3. Confirm the list never claims it is empty while restoring.
4. Confirm Left/Right and Home/End move keyboard focus between collection tabs.
5. Confirm Favorites and Recently Viewed still open exact place pages.

Commit:

`fix: harden saved collections and migration`
