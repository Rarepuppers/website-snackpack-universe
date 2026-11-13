# Chess Puzzles — new game scorecard

- **Game and public name:** Chess Puzzles (`/play/chess-puzzles/`). Generic.
- **Independent name-search evidence and date:** 2026-11-13. No keyword tool was available. "Chess puzzles" alone is dominated by lichess and chess.com, so the page targets the narrower "daily mate in one", "mate in two puzzles" and "beginner chess puzzles". This page is the measurement; plan and day-56 decision rule in the monorepo's `docs/audit-briefs/2026-11-13-brain-games-vol-3-web-daily-pages-plan.md`.
- **Competition assessment:** High for the head term, moderate for the mate-in-N phrases. The angle: a daily pair with exactly one winning first move, an explanation for every puzzle, no ads, no account.
- **Source engine and test coverage:** Vol 3's `chess/engine.ts` (perft-verified in the app), `mateSearch.ts`, `mateInTwo.ts`, `mateInThree.ts`, `puzzles.ts`, `constants/dailyBanks.ts` and `dailyPuzzles.ts`, generated into the page by `scripts/sync-card-policies.cjs` and drift-checked. `verify-daily-banks.cjs` checks all 730 daily pairs (mate in one: exactly one mating move; mate in two: no mate in one, exactly one key move). Browser check (13 Nov): today's mate in one solved; a wrong key rejected; the right key, the computer's reply and the mate played; both recorded in `daily-state` and offered as a share; Mate in Three hint highlights the key piece; 375 px wide with no sideways scroll.
- **Web interaction and accessibility risks:** Square buttons labelled like the app ("g8, black king, move here"); `keyboard-grid.js` arrows and Enter. The computer's reply waits 650 ms so the move is visible; input is locked meanwhile.
- **Existing art to reuse:** The site's chess pieces (`shared-assets/game-ui/chess-pieces/clear/`) and the chess page's board styles.
- **New 144×144 tile and 1200×630 social card:** Tile and card both made from Vol 3's painted Chess Puzzles icon on a plain background; a painted card is optional polish for Codex.
- **Maintenance cost:** Low; generated from the app. The daily bank lasts until 2028-10-30 and the guard fails 60 days before it wraps.
- **Naming/trademark review:** Generic.
- **Fit with calm, ad-free, no-sign-in play:** Strong; no clock.
- **Daily mode:** Supported. A mate in one and a mate in two each day from a 730-day bank shared with the app, the same for everyone. Today and yesterday play on the web; older dailies are in the app.
- **Decision and measurement window:** Ship. Review after 28 and 56 days: Search Console impressions and clicks, `/go/arcade/chess-puzzles/braingames3/` views, Play Console acquisitions by UTM campaign `chess-puzzles`.
