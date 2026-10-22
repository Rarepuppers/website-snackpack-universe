# Brick Breaker — new game scorecard

- **Game and public name:** Brick Breaker (`/play/brick-breaker/`). A generic genre name; "Breakout" (the original) is deliberately not used as the title.
- **Independent name-search evidence and date:** 2026-10-22. No measured figure for this site. "Brick breaker" is a long-standing generic browser-game search; this page is the measurement.
- **Competition assessment:** Many browser versions, most with ads. The angle: no ads, no sign-in, offline, identical speed on every screen, four modes.
- **Source engine and test coverage:** The whole Vol 2 `components/games/brick-breaker/engine.ts`, generated into the page by the monorepo's `scripts/sync-card-policies.cjs` (whole-module mode) and drift-checked by `verify-card-policies.cjs`. It runs on the shared 60-ticks-per-second `fixed-step-clock.js`, as the app does. Node, 200 games per mode with an autopilot paddle aiming at random offsets: every Relaxed, Classic and Expert wall cleared (about 2.5–3 minutes each), Endless reached wall 6 every time, no ball ever stuck; a paddle that never moves always ends in game over. `arcade-brick-breaker.spec`: the keys move the paddle (read from the canvas pixels), Pause freezes the field, a still paddle loses every life and the page ends the game, and on a phone Start scrolls the whole field into view.
- **Web interaction and accessibility risks:** Real-time; drag anywhere on the field or use ← → / A D, Space or tap serves, P / Escape pause (shared `pause.js`, auto-pauses with the tab). Written keyboard waiver. On a 375×812 phone the toolbar pushes the paddle below the fold until Start brings the field into view.
- **Existing art to reuse:** The hub tile is Vol 2's painted Brick Breaker icon. The field is drawn on canvas.
- **New 144×144 tile and 1200×630 social card:** Tile from the Vol 2 icon; the social card is an interim composite of that icon (Codex brief item 14).
- **Maintenance cost:** Low; the engine is generated from the app.
- **Naming/trademark review:** Generic name.
- **Fit with calm, ad-free, no-sign-in play:** Good; Relaxed is gentle, and the game pauses itself when you leave.
- **Daily mode:** Not offered — written waiver on the page: a reflex game's daily would compare reaction times, not decisions.
- **Decision and measurement window:** Ship. Review after 28 days with Search Console impressions for brick-breaker queries and `/go/arcade/brick-breaker/braingames2/` clicks.
