# Phase 2D mobile sheet scroll fix

- Converted the map bottom sheet into a proper flex column.
- The sheet body now owns the remaining height with `min-height: 0` and mobile momentum scrolling.
- Added extra safe-area bottom padding.
- Kept **Back to places** sticky and fully reachable while viewing long place details.
