# myVillaverde Phase 3E — Final AI Studio Update

This is a self-contained final Phase 3 handoff. It includes the current Phase
3B, 3C, 3D, and 3E files so the related-place wiring and supporting utilities
cannot be missed.

## Replace these matching files in AI Studio

1. `src/App.tsx`
2. `src/types/app.ts`
3. `src/utils/places.ts`
4. `src/components/PhotoGallery.tsx`
5. `src/screens/PlacePage.tsx`
6. `vite.config.ts`

Replace the contents of the existing files. Do not create duplicate files with
similar names.

## What Phase 3E adds

- Final 320 px and 390 px mobile layout polish
- A valid Vite configuration that passes TypeScript checking
- Keyboard and screen-reader focus on the newly opened place page
- A polite screen-reader announcement when a place link is copied
- Keyboard focus trapping and focus restoration in the photo gallery
- Full-cover tapping when an approved cover photo is present
- A 44 px minimum tap target for the website link in Place details

## Verified before packaging

- `npm run lint` passes
- `npm run build` passes
- No horizontal page overflow at 320 px or 390 px
- No interactive target below 44 px on the tested place page
- Related-place navigation opens the correct record
- Browser Back and Forward restore the correct place
- Save toggles and restores correctly
- Open 24 hours, Check current hours, and Hours unavailable states render
- Missing-place and no-approved-photo states render
- No browser console errors or warnings during the final regression pass

The only remaining build notice is Vite's non-blocking warning that the main
JavaScript bundle is slightly larger than 500 kB.
