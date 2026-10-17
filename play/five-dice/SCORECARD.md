# Five Dice — new game scorecard

- **Game and public name:** Five Dice (`/play/five-dice/`). The classic five-dice, three-roll, 13-box scoring game.
- **Independent name-search evidence and date:** 2026-10-17. Semrush's board-game ranking (March 2026) puts the branded name of this game in the 90k–246k monthly band, behind chess, mahjong and checkers. That demand is for a trademark, so this page cannot target it; generic terms ("dice game", "five dice", "roll and score dice game") are what the page can rank for.
- **Competition assessment:** Many free web versions exist, most ad-heavy and most using the trademark. The page's angle is the arcade's: calm, no ads, no sign-in, works offline, plus a shared daily dice challenge, which few rivals have.
- **Source engine and test coverage:** Ported from Brain Games Vol 2's `components/games/yahtzee/engine.ts` (scoring, joker rule, casual and sharp CPU). Played end to end in Playwright at 375 px touch and 1280 px desktop: full solo games, full games against the Sharp CPU, resume after reload; no page errors, no overflow.
- **Web interaction and accessibility risks:** Every die, the Roll button and each scorecard box is a real button with an accessible name ("Score 25 in Full house"), so it plays by Tab and Enter; written keyboard waiver on the stage. Dice faces come from the shared board-game icon sheet.
- **Existing art to reuse:** Dice faces from `pro-hand-painted/board-games/board-game-icons` (already WebP).
- **New 144×144 tile and 1200×630 social card:** Interim versions composed from the existing dice art; final art is requested in `CODEX-ASSET-BRIEF-2026-10-17.md` and recorded in `play/tiles/PLACEHOLDERS.txt`.
- **Maintenance cost:** Low. Self-contained page, no network, no new shared code.
- **Naming/trademark review:** The game's best-known name is a registered trademark (Hasbro). The page, its title, metadata and copy never use it; the box is called "Five of a kind". Note for the apps: Brain Games Vol 2 lists this game under the trademarked name — worth a separate look before its next release.
- **Fit with calm, ad-free, no-sign-in play:** Strong. Turn-based, no timer, short sessions, pass-and-play.
- **Daily mode:** Supported. `?daily=YYYY-MM-DD` seeds the dice so everyone gets the same rolls for the same sequence of rolls; resuming continues the sequence.
- **Decision and measurement window:** Ship. Review after 28 days in Cloudflare Web Analytics (page views) and `/go/arcade/five-dice/braingames2/` clicks against the arcade median.
