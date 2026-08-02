# Phase 3A — Dedicated Place Pages

This build adds the first real place-page flow on top of the shared Places store.

## Included

- Dedicated full-screen page for every place record
- Shareable `?place=<Place ID>` URLs
- Browser Back/Forward synchronization through the History API
- Direct-link loading and unavailable-place handling
- Name, category, barangay, status, hours, address, description, contact data, verification details, and notes
- Directions, Save, Call, Website/Source, and Share actions
- Missing phone/link fields are omitted instead of rendered as dead actions
- Place pages open from map previews, category results, and Saved Places
- Recently viewed places update when a page is opened
- Phase 3B photo placeholder without inventing unsupported place photos

## Data architecture

Place pages use the existing App-level shared Places loader. They do not add another CSV request.
