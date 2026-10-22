# Killer Sudoku — new game scorecard

- **Game and public name:** Killer Sudoku (`/play/killer-sudoku/`). A generic puzzle name. (Vol 3's KenKen was considered too; "KenKen" is a registered trademark, so a web port would need a generic name such as Calcudoku.)
- **Independent name-search evidence and date:** 2026-10-22. No measured figure for this site; "killer sudoku" is a steady puzzle search, and Sudoku itself is one of the arcade's biggest targets (~94k/mo, see the analytics memory). This page is the measurement.
- **Competition assessment:** Several puzzle sites, mostly with ads. The angle: 68 solver-verified puzzles, a daily, no ads, no sign-in, offline.
- **Source engine and test coverage:** Vol 3's `killer-sudoku/mediumPuzzles.ts`, `puzzles.ts` and `engine.ts` (the banks, each puzzle verified unique by the app's generator, and the rules), generated into the page by the monorepo's `scripts/sync-card-policies.cjs` and drift-checked. Node: all 68 stored solutions are accepted by the page's engine and match every cage sum. `arcade-killer-sudoku.spec` solves Easy #1 through the page with keyboard entry (best time kept, the level moves to #2), checks a rule-breaking digit is marked and cleared, that Notes do not fill a square, and that the daily is shared.
- **Web interaction and accessibility risks:** 81 button cells with labels ("Row 2, column 3, empty, cage of 3 summing to 15"); `keyboard-grid.js` arrows, 1–9 / 0 / Backspace, N for Notes. Mistake marking follows the app: digits that break a rule (repeat in row, column, box or cage; cage over its sum; full cage wrong), not every wrong digit.
- **Existing art to reuse:** Hub tile from Vol 3's painted Killer Sudoku icon. Cages are CSS (dashed outlines joined across inner edges).
- **New 144×144 tile and 1200×630 social card:** Tile from the Vol 3 icon; social card interim (Codex brief item 16).
- **Maintenance cost:** Low; generated from the app.
- **Naming/trademark review:** Generic.
- **Fit with calm, ad-free, no-sign-in play:** Strong; untimed pressure (the clock only records).
- **Daily mode:** Supported — one puzzle a day from all 68, the same for everyone (the bank repeats after 68 days).
- **Decision and measurement window:** Ship. Review after 28 days with Search Console impressions and `/go/arcade/killer-sudoku/braingames3/` clicks.
