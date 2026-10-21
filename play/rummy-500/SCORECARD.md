# Rummy 500 — new game scorecard

- **Game and public name:** Rummy 500 (`/play/rummy-500/`), also known as 500 Rum. Traditional; the name is generic.
- **Independent name-search evidence and date:** 2026-10-22. No measured search figure: Semrush's board-game ranking used for games 40–43 does not cover rummy variants, and this site has no rummy impressions in Search Console yet. Rummy is a large evergreen card-game search family; this page is the measurement.
- **Competition assessment:** Established card-game sites carry Rummy 500, most with ads or sign-in. The angle: calm, no ads, no sign-in, offline, a daily deal, saved games.
- **Source engine and test coverage:** The whole Vol 2 `components/games/rummy-500/engine.ts` (after Codex's 2026-10-19 polish: rotating first seat, Sharp meld planning, stock-exhaustion ending, tied leaders play on) except `initialState`, generated into the page by the monorepo's `scripts/sync-card-policies.cjs` and drift-checked by `verify-card-policies.cjs`. Node: 400 all-computer games, 116,195 turns, 52 cards accounted for after every turn, every game ends; a Sharp seat won 88 of 200 mixed-table games (baseline ~37.5%). `arcade-rummy.spec` plays a whole quick game through the page's buttons (draw, meld, lay off, discard) to a recorded result, and checks the daily deal is shared.
- **Game length (simulated, all-computer):** 2 players to 250 ≈ 3 rounds / 26 of your turns; to 500 ≈ 6 / 51. 4 players to 250 ≈ 14 rounds / 71 turns; to 500 ≈ 31 / 159. Seven-card hands score slowly; that is the rule set's nature, not a defect. Watch whether 4-player Full games get finished.
- **Web interaction and accessibility risks:** Every card, the stock, the discard and every meld you can add to is a button with a label ("Lay off the 9 of hearts on CPU's 6–8 of hearts"); melds you cannot add to are not buttons. Written keyboard waiver.
- **Existing art to reuse:** Shared suit icons and card backs; table and cards are CSS.
- **New 144×144 tile and 1200×630 social card:** Interim composites from the shared suit icons and the Royal Plum back; final art briefed to Codex.
- **Maintenance cost:** Low; the engine is generated from the app.
- **Naming/trademark review:** Generic name.
- **Fit with calm, ad-free, no-sign-in play:** Strong; turn-based.
- **Daily mode:** Supported — each round's deal is seeded from the day and table size, so everyone at the same size gets the same deals.
- **Decision and measurement window:** Ship. Review after 28 days with Search Console impressions for rummy queries and `/go/arcade/rummy-500/braingames2/` clicks.
