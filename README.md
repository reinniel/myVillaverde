<div align="center">

<h1>myVillaverde</h1>

<p><strong>A mobile-first local guide for Villaverde, Nueva Vizcaya.</strong></p>

<p>
  <img alt="Version 1.0.1" src="https://img.shields.io/badge/version-1.0.1-2B6A4E">
  <img alt="Status stable" src="https://img.shields.io/badge/status-stable-2B6A4E">
  <img alt="Verify workflow" src="https://github.com/reinniel/myVillaverde/actions/workflows/verify.yml/badge.svg">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white">
</p>

<p>
  Find verified local places, explore the map, browse by barangay, save discoveries,
  and build a multi-stop trip using one shared place database.
</p>

</div>

## Preview

<p align="center">
  <img src="docs/assets/villaverdeko-home.png" height="500" alt="VillaverdeKo local dashboard">
  &nbsp;&nbsp;
  <img src="docs/assets/villaverdemo-home.png" height="500" alt="VillaverdeMo visitor dashboard">
</p>

## What it does

- **VillaverdeKo** gives residents barangay-aware discovery, nearby places, saved collections, and direct map access.
- **VillaverdeMo** gives visitors curated discovery, barangay guides, place pages, saved collections, and a four-stop trip planner.
- **Explore Map** combines search, category filters, persistent map state, focused barangay views, and location-aware nearby results.
- **Live place data** comes from the published Villaverde Places database, with a generated 27-place fallback when the live feed is unavailable.
- **Resilient states** cover loading, offline use, reconnecting, unavailable records, reduced motion, browser zoom, and render recovery.

## Product principles

- Show only real places from the shared database.
- Keep unknown information unknown instead of inventing ratings, popularity, or operating details.
- Display photos only when a usable URL and approved permission are present.
- Store lightweight local preferences and place IDs rather than duplicating authoritative place records.
- Keep the core guide useful when the live database cannot be reached.

## Technology

| Area | Stack |
| --- | --- |
| Interface | React 19, TypeScript, Tailwind CSS 4 |
| Build | Vite 6 |
| Maps | Leaflet, React Leaflet, OpenStreetMap |
| Data | Published Google Sheets CSV with a generated TypeScript fallback |
| Persistence | Browser local storage |
| Directions | Google Maps URLs |

## Getting started

Requirements: Node.js 22 or newer and npm.

```bash
npm ci
npm run dev
```

The development server runs at `http://localhost:3000`.

## Verification

```bash
npm run verify
```

The release gate checks that the bundled fallback matches the live Places database, runs TypeScript and targeted utility tests, and creates a forced production build. The same gate runs automatically on pushes and pull requests through GitHub Actions.

Useful individual commands:

| Command | Purpose |
| --- | --- |
| `npm run lint` | Run TypeScript validation without emitting files |
| `npm test` | Run targeted navigation, URL-safety, and data-fallback tests |
| `npm run build` | Create a production-optimized Vite build |
| `npm run check` | Run TypeScript validation, targeted tests, and the production build |
| `npm run data:check` | Compare the fallback with the live Places database |
| `npm run data:sync` | Regenerate the fallback from the live Places database |

## Project structure

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Application state, navigation, and screen orchestration |
| `src/screens/` | Landing, dashboards, map, and place pages |
| `src/components/` | Reusable sheets, cards, galleries, and recovery UI |
| `src/hooks/` | Live place loading and online/offline transitions |
| `src/data/` | Categories, barangays, configuration, and fallback places |
| `src/utils/` | Place normalization, filtering, navigation, distance, and map helpers |
| `scripts/` | Data synchronization and production-build enforcement |

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full application boundaries and data flow.

## Data source

The published Villaverde Places database is authoritative. Runtime data is normalized into shared `PlaceRecord` objects; duplicate and permanently closed rows are excluded. When the live feed is unavailable, the app uses the generated snapshot in `src/data/places.ts`.

## Release

**Current version:** `1.0.1`

Phases 1 through 6 are complete. Google AI Studio remains the active working copy, while GitHub `main` is the verified versioned mirror.
