# Hearts — new game scorecard

- **Game and public name:** Hearts (`/play/hearts/`). Public-domain card game; the name is generic.
- **Independent name-search evidence and date:** 2026-10-17. "Hearts" is among the most-searched classic card games (bundled with Windows for decades, so the search habit is old and broad). No measured monthly figure was available in this session; the audit's board-game ranking does not cover card games. Treat demand as high but unquantified until 28 days of page data exist.
- **Competition assessment:** Crowded with ad-heavy portals. The arcade's angle: calm, no ads, no sign-in, offline-capable, and a daily deal.
- **Source engine and test coverage:** Ported from Brain Games Vol 1's `components/games/hearts/engine.ts` (pass rotation, 2♣ lead, no points on the first trick, hearts broken, shooting the moon, three AI levels). 1,500 all-computer games / 16,818 rounds in Node against the page's own engine: every round awards exactly 26 points, no illegal plays. Played end to end in Playwright at 375 px touch and 1280 px desktop, with resume after reload.
- **Web interaction and accessibility risks:** Each card is a button labelled with its full name ("Queen of spades"); unplayable cards are disabled; the trick on the table is labelled by seat. Written keyboard waiver.
- **Existing art to reuse:** Shared painted suit icons (WebP), CSS cards.
- **New 144×144 tile and 1200×630 social card:** Interim composites of the painted suits; final art requested in `CODEX-ASSET-BRIEF-2026-10-17.md`.
- **Maintenance cost:** Low. Self-contained page.
- **Naming/trademark review:** "Hearts" is generic. Seat names (West/North/East) only.
- **Fit with calm, ad-free, no-sign-in play:** Strong; turn-based, no timer.
- **Daily mode:** Supported. `?daily=` seeds every round's deal, so everyone gets the same hands (computer play varies).
- **Decision and measurement window:** Ship. Review after 28 days against the arcade median and `/go/arcade/hearts/braingames/` clicks.
