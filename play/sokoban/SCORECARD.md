# Sokoban — new game scorecard

- **Game and public name:** Sokoban (`/play/sokoban/`). The genre's own name since 1981, used by countless clones; generic in use.
- **Independent name-search evidence and date:** 2026-11-13. No keyword tool was available. Search Console shows this site has never had a Sokoban page, so this page is the measurement. Plan: `docs/audit-briefs/2026-11-13-brain-games-vol-3-web-daily-pages-plan.md` in the monorepo (decision rule at day 56).
- **Competition assessment:** Moderate. Mostly older Flash-era or level-pack sites, few mobile-friendly pages with a daily. The angle: solver-checked rooms with exact par, a daily room, tap to walk, no ads, offline.
- **Source engine and test coverage:** Vol 3's `sokoban/engine.ts`, `levels.ts` (+ medium, hard, long and discovery files), `roomPar.ts`, `constants/dailyBanks.ts` and `dailyLevels.ts`, generated into the page by `scripts/sync-card-policies.cjs` and drift-checked. `verify-daily-banks.cjs` solves all 730 daily rooms and checks each par is the exact fewest moves; `verify-sokoban.cjs` covers the pack rooms. Browser check (13 Nov): room 1 solved at par by keyboard; today's daily solved at par from a BFS solution through the arrow keys, recorded in `daily-state`; tap-to-walk moved 7 squares; old dates fall back to today's room; 375 px wide with no sideways scroll.
- **Web interaction and accessibility risks:** Arrow keys, W A S D, U (undo) and R (restart) move directly, so there is no grid cursor (written waiver on the stage). Floor cells are buttons labelled "Row 3, column 5, box on target"; the arrow pad gives 44 px+ targets; swipe on touch.
- **Existing art to reuse:** Board drawn in CSS (no sprite download). Hub tile from Vol 3's painted Sokoban icon.
- **New 144×144 tile and 1200×630 social card:** Tile and card both made from the Vol 3 icon on a plain background; a painted card is optional polish for Codex.
- **Maintenance cost:** Low; generated from the app. The daily bank lasts until 2028-10-30 and the guard fails 60 days before it wraps.
- **Naming/trademark review:** Generic genre name.
- **Fit with calm, ad-free, no-sign-in play:** Strong; no timer.
- **Daily mode:** Supported. One room a day from a 730-room bank shared with the app, the same for everyone. Today and yesterday play on the web; older dailies are in the app (its future Pro archive).
- **Decision and measurement window:** Ship. Review after 28 and 56 days: Search Console impressions and clicks, `/go/arcade/sokoban/braingames3/` views, Play Console acquisitions by UTM campaign `sokoban`.
