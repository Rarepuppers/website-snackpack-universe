# Backgammon — new game scorecard

- **Game and public name:** Backgammon (`/play/backgammon/`). Public-domain; the name is generic.
- **Independent name-search evidence and date:** 2026-10-17. Semrush's board-game ranking (March 2026) places backgammon in the 90k–246k monthly band, with chess, mahjong and checkers ahead of it.
- **Competition assessment:** Established sites exist (several with sign-in or ads). The angle: calm, no ads, no sign-in, offline, a daily dice challenge, pass-and-play.
- **Source engine and test coverage:** Ported from Brain Games Vol 3's `components/games/backgammon/engine.ts` and `ai.ts`. One rules fix over the app: the app only enforced "play the higher die when only one can be played", so a first move could block the second die; the page now offers only moves that keep the maximum number of dice playable. 300 all-computer games / 23,305 turns in Node: 15 checkers per side at every step, no die left unplayed while a legal move existed, every game ends. Played in Playwright at both widths, including resume.
- **Web interaction and accessibility risks:** Every point, the bar and the bear-off tray is a button with a label ("Point 8: 3 light, pick up"); only legal sources and destinations are enabled. Written keyboard waiver.
- **Existing art to reuse:** Shared painted dice; checkers and board are CSS.
- **New 144×144 tile and 1200×630 social card:** Interim composites; final art briefed to Codex.
- **Maintenance cost:** Low.
- **Naming/trademark review:** Generic name.
- **Fit with calm, ad-free, no-sign-in play:** Strong; turn-based.
- **Daily mode:** Supported — the day's dice sequence is seeded, so everyone gets the same rolls; a resumed daily continues the sequence.
- **Decision and measurement window:** Ship. Review after 28 days with `/go/arcade/backgammon/braingames3/` clicks.
