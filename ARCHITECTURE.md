# Architecture notes

Phase 3R is an extraction refactor rather than a rewrite.

## Boundaries

- `App.tsx` owns shared app state, mode changes, modal selection, and screen orchestration.
- `usePlacesData` owns the single live Places CSV request and fallback state.
- Screen files own complete page-level layouts.
- Shared components contain reusable interface behavior such as the accessible bottom sheet.
- Data files contain static records and configuration only.
- Utility files are framework-independent except where browser URL or local-storage access is required.

## Deferred decisions

- React Router is not introduced because the existing place-page history behavior is already working.
- SSR guards remain deferred because this is a client-side Vite application.
- Screen-specific subcomponents can be extracted later when Phase 3B makes their boundaries clearer.
