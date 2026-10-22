# Chess — new game scorecard

- **Game and public name:** Chess (`/play/chess/`). Public domain; the name is generic.
- **Independent name-search evidence and date:** 2026-10-22. Semrush's board-game ranking (March 2026) puts chess at about 1.5M monthly searches, the highest of any board game, dominated by chess.com and lichess. Built as a calm Vol 3 funnel and a page that rounds out the arcade, not on an expectation of ranking.
- **Competition assessment:** Very strong (chess.com, lichess). The angle: no account, no ads, a gentle computer at six levels, take-backs, offline.
- **Source engine and test coverage:** The whole Vol 3 `components/games/chess/engine.ts`, `ai.ts` and `session.ts` (rules, the time-sliced computer player and the app's own save validator), generated into the page by the monorepo's `scripts/sync-card-policies.cjs` and drift-checked by `verify-card-policies.cjs`. Node: 20 Hard-vs-Beginner games through the page's engine — Hard won 19, one ended in a draw claim, no illegal move; the save shape round-trips through `restoreChessSave`. `arcade-chess.spec`: the pieces load through the shared-asset pipeline, a move and the computer's reply happen through the board, Take back restores the position, Black lets the computer open on a flipped board, Resign lands in the level's record, the Claim draw button stays hidden when no claim exists, and every square stays square.
- **Web interaction and accessibility risks:** Every square is a button labelled with its name and contents ("e4, white pawn, move here"); `keyboard-grid.js` gives one tab stop with arrow keys. Promotion offers a four-piece picker. Draw handling follows the app: automatic stalemate, insufficient material, 75 moves and fivefold repetition; threefold and 50 moves are claims (casual rules, no tournament claim).
- **Existing art to reuse:** The app's clear chess piece set (`shared-assets/game-ui/chess-pieces/clear/`), added to the Website target in `derivative-profiles.json` and delivered with WebP siblings through `build-game-ui-derivatives.ps1`; the painted 512 px set is excluded. The hub tile is Vol 3's painted chess icon.
- **New 144×144 tile and 1200×630 social card:** Tile from the Vol 3 icon; social card interim (Codex brief item 15).
- **Maintenance cost:** Low; generated from the app.
- **Naming/trademark review:** Generic.
- **Fit with calm, ad-free, no-sign-in play:** Good; no clock.
- **Daily mode:** Not offered — written waiver: the computer's replies depend on the player's moves, so a daily game would not be the same game for two players.
- **Decision and measurement window:** Ship. Review after 28 days with Search Console impressions and `/go/arcade/chess/braingames3/` clicks.
