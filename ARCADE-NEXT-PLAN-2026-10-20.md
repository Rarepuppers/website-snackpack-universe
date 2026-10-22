# Arcade — next round plan (20 October 2026)

Follows `ARCADE-AUDIT-2026-10-17.md` (all of its plan shipped) and Codex's
Brain Games passes of 18–20 October (`docs/BRAIN_GAMES_*` in the monorepo).
This plan lists only work **nobody owns yet**. Codex's open queue (GA14–GA21
CPU/rules/validator work; A1–A6 asset touch-ups; Jigsaw / Gem Path /
Backgammon match) is not repeated here.

## Where things stand

- **Healthy.** 42 local game pages plus Atlas Quest and Last Bastion: live
  sweep at 375 and 1280 px found no page errors, no 4xx and no sideways
  overflow. The last three website CI runs are green (latest `13364e1a`).
  Codex delivered all brief art (items 1–11 and G1b) and renamed Five Dice to
  **Dice Score**, keeping the `five-dice` URL and save keys.
- **Search demand is real now, and it is almost all one game.** Google Search
  Console, same property, 28 days each:

  | | 23 Aug – 19 Sep | 20 Sep – 17 Oct |
  | --- | ---: | ---: |
  | `/play/` impressions | 591 | **1,714** |
  | `/play/` clicks | 9 | **34** |
  | Thirteen impressions / clicks | 64 / 0 | **1,287 / 19** (position 7.7) |
  | 2048 | 21 (position 35) | 141 / 6 (position 23) |
  | Minesweeper | — | 80 / 1 (position 9.1) |
  | Snacky Worm | 101 / 1 | 73 / 3 (position 7.8) |
  | Picross | **198** (position 43) | **1** |

  Thirteen is 75% of arcade impressions. Its queries are generic ("thirteen
  game", "13 card game online free", "play tien len online"), not someone
  else's brand as in August, so CTR (1.5%) is worth working on.

## 1. Thirteen first — the one page with demand (S–M)

| # | Work | Why / done when |
| --- | --- | --- |
| 1a | **Difficulty choice** (Easy / Normal / Sharp) with a W–L record per level. Today there is one opponent strength and a single `sp_thirteen_wins` counter. | Every other card game has levels and records; newcomers searching "13 card game" meet the hardest CPU straight away. Easy = a simpler, still rule-legal policy (plays its lowest legal combo, never holds back 2s); Sharp = today's. Node sim: Easy loses clearly more often than Sharp against a fixed policy. |
| 1b | **Snippet test.** Title/description variant leading with the query words ("13 Card Game Online Free — Thirteen / Tiến Lên vs Computer"). | Position 7.7 with 1.5% CTR. Change once, then read GSC CTR at +14 and +28 days; revert if it drops. One variable at a time. |
| 1c | **Rules depth on the page.** Show the two rule sets' differences in a table, add "how to win" tips and a worked example of bombs beating 2s. | Answers the "how to play" half of the queries and keeps players on the page. No new URL. |
| 1d | **Hub order by demand.** Featured sort leads with Thirteen, 2048, Minesweeper, Snacky Worm, Solitaire. | The hub currently leads with Last Bastion and Atlas Quest; searchers landing on `/play/` should see the games people look for. |

## 2. Pages close to page one (S each)

- **2048 (position 23, "2048 no ads" queries):** check the page against the
  page-one results (undo, board-size options, best-score display), and make
  sure the "no ads" promise is visible above the board, not only in the title.
- **Minesweeper (position 9.1):** confirm the expected features exist (custom
  size, chording, first click always safe); add any that are missing.
- **Picross dropped from 198 impressions to 1.** Check with URL Inspection
  whether it is still indexed and whether its canonical or title changed (Codex
  edited a Picross image on 10-20). It could just be noise from position 43,
  but it should be checked before anything else is changed.

## 3. Small fixes left from 10-17 (S)

- **Generator exclusions.** `build-pwa.mjs` / `build-theme.mjs` still inject
  blocks into Pinball, Keeping Up and Last Bastion's privacy page; add an
  explicit skip list so nobody has to restore those files by hand.
- **Cascade Hold on the web.** The app gained Hold on 10-19; the browser
  version has none (Codex noted this). Port it with the same once-per-piece
  rule and save fields.

## 4. New games — ranked

Each still needs a SCORECARD.md (name search and trademark review) and Codex
tile/social art before it reaches the hub. All have an engine already in an
app, which halves the work and gives the page a real download link.

| # | Game | Engine | Why this rank |
| ---: | --- | --- | --- |
| 1 | **Rummy 500** | Vol 2 (Codex polished it on 10-19) | Big evergreen card search; reuses the Hearts/Spades table UI and links to Vol 2. |
| 2 | **Block puzzle** (placement, 8×8; generic name, *not* "Block Blast") | Vol 3 `block-blast` | Strongest mobile casual trend; calm and untimed, fits the arcade. Different from Cascade (falling blocks). |
| 3 | **Brick Breaker** | Vol 2 | Classic with steady demand; now cheap because the shared fixed-step clock exists. |
| 4 | **Chess** | Vol 3 | Highest demand (~1.5M/mo) but lowest chance to rank; build it as a Vol 3 funnel, not for search. Draw rules stay "casual" (no tournament claim, per Codex's GA17 note). |
| 5 | **Killer Sudoku / KenKen daily** | Vol 3 | Daily-hub value; blank markers now exist (G1b). |
| 6 | Dominoes / Mancala | Vol 1 | Cheap ports, smaller audiences. |

Recommended: **Rummy 500, then Block puzzle**, one at a time, each with
the same bar as games 40–43: daily mode, resume, per-level records, Node
simulation of the page's own engine, and phone layout spec.

## 5. Not arcade, but pending on my side

- Vol 2's Play listing still needs Codex's prepared **Dice Score** copy
  published in the next release workflow (Codex prepared it; publishing is mine).

## Order

1. Thirteen 1a–1d (with 1b's measurement dates noted in this file).
2. Picross check, then 2048 / Minesweeper gaps.
3. Generator skip list; Cascade Hold.
4. Rummy 500 → Codex brief for its tile/social → Block puzzle.

Measure: GSC `/play/` impressions, clicks and Thirteen CTR at +14 and +28 days
after each search-facing change. Cloudflare counts stay out of it (bot-inflated).

## Progress — 22 October 2026

| Item | Result |
| --- | --- |
| 1a Thirteen levels | **Done.** Easy / Normal (default) / Sharp, chosen level remembered, Record chip per level (`sp_thirteen_record_<level>`), total Wins kept. Sharp is the shared app policy, untouched; Easy and Normal live in the page's UI section. Page-engine simulation, Sharp-strategy player in seat 0: wins **40.5% / 31.8% / 26.4%** against Easy / Normal / Sharp (fair seat 25%). `arcade-thirteen.spec` fails if the levels collapse into one. |
| 1b Snippet test | **Live from this publish.** Title is now "13 Card Game Online Free — Thirteen (Tiến Lên) vs Computer"; description names the three levels. Baseline (GSC, 20 Sep – 17 Oct): 1,287 impressions, 19 clicks, **CTR 1.5%, position 7.7**. Read again on **5 Nov** (+14 days) and **19 Nov** (+28); revert the title if CTR falls. |
| 1c Rules depth | **Done.** Standard-vs-Classic table, five how-to-win tips, a worked bomb example. Found a copy defect while doing it: the page said the 2 is always the top card, but in Classic the engine (and the guide) makes the 2 the **lowest** card with no bombs. The FAQ, the structured-data answer and the combinations list now say which rules they mean; a spec checks the table's Classic claims against the engine. The guide's feature list mentions the levels. |
| 1d Hub order | **Done.** Featured leads with Thirteen, 2048, Minesweeper, Snacky Worm, Solitaire (`hub.js`; page order unchanged otherwise). Hub screenshots change, adopt from CI. |
| Phone segments | Found on the way: the phone rule laid every segment row out two per line, so any three-choice row (Hearts, Checkers, Spider, Thirteen…) showed 2 + 1. Three-choice rows now share one line; four-choice rows still wrap 2 + 2. |
| 2 Picross | **Not a defect.** Indexed, correct canonical, fetch passes. Its 198 impressions were a single week (4–10 Sep) at about position 40 for "picross logic nonogram", then none. |
| 2 Minesweeper | Has three levels, chording, a safe first click, flag mode and a best time. Nothing missing. |
| 2 2048 | Has Undo and Best. Its "no ads" line sits in the hero lead, which the game-first layout hides on every page. Option, not done: a small "No ads · no sign-in" line in the title strip for all games, which would change every game screenshot. |
| 3 Generator skips | **Left to its owner.** `scripts/lib/page-wiring-owner.mjs` now excludes Last Bastion and its privacy page, and says Pinball is "intentionally not excluded". The Keeping Up discovery page is an ordinary site page edited by other sessions. |
| 3 Cascade Hold | **Done.** Hold box (tap, C or Shift): once per piece, unlocks when the next piece locks, empty hold takes the next piece, a blocked replacement ends the run, New game empties it. `arcade-cascade-hold.spec` fails if a second hold is allowed. |
| Also seen | Codex shipped GA21 (penalty keeper fairness, trivia) on 10-21. The arcade's daily is deliberately the UTC day everywhere (`daily-state.js` `today()`), so the card games' `toISOString()` Daily buttons are consistent, not the local-day bug. |

| 4 Rummy 500 | **Done.** `/play/rummy-500/`: Casual or Sharp, 1 or 3 computers, Quick 250 or Full 500, daily deals, resume, a record per difficulty and table size. The engine is Vol 2's own `engine.ts`, generated into the page by `scripts/sync-card-policies.cjs` (new `--only=<slug>` flag so a write can't touch other card pages) and drift-checked with the others. Node: 400 all-computer games, 116,195 turns, 52 cards accounted for every turn, all finished. `arcade-rummy.spec` plays a quick game through the page to a recorded result. The tile is Vol 2's painted Rummy icon; the social card is interim (brief item 12). Simulated length: 2 players to 250 ≈ 26 of your turns, 4 players to 500 ≈ 159. |
| Found: related games | `build-related-games.mjs` only parses hub tiles written as a bare `<img>`, so the 12 tiles wrapped in `<picture>` for WebP (Hearts, Spades, Thirteen, Backgammon, Dice Score, Pyramid, TriPeaks…) get no related block of their own and never appear in other pages' rotations. Fix: accept the `<picture>` wrapper in `parseHub`. It rewrites related blocks on ~40 pages, many with other sessions' uncommitted edits, so it waits for a quiet moment. Rummy's hub tile is a bare `<img>` meanwhile. |
| Found: disabled buttons | `play.css` has no disabled look for `.btn-game`, so a dead Play / Lay meld button looks pressable (Thirteen, Hearts, Spades…). Rummy has a scoped rule; an arcade-wide `.btn-game:disabled` changes many screenshots, so it goes with the next screenshot adoption. |
| 4 Block Puzzle | **Done.** `/play/block-puzzle/`: Classic 8×8, Big 10×10 and a two-minute Timed mode (pauses with the tab), daily blocks, resume (a daily replays its seeded draws), best score per mode, keyboard grid. Engine ported from Vol 3's `block-blast/engine.ts`; a Node check against the app's own TypeScript over 300 random games matched every legal square, clear and score. `arcade-block-puzzle.spec` plays a Classic game to game over through the page. Tile is Vol 3's painted icon; social card interim (brief item 13). Found on the way: `.readout-chip` beats the `hidden` attribute, so the Time chip showed 0:00 in Classic; it now uses `style.display`. |
| For Mark | Vol 3 calls this game **"Block Blast"**, which is the name of another company's game, the same kind of trademark issue as Vol 2's "Yahtzee". The web page uses "Block Puzzle". Worth renaming in the app before Vol 3's next release. |
| 4 Brick Breaker | **Done (2026-10-22, Mark: "continue").** `/play/brick-breaker/`: Relaxed, Classic, Expert, Endless; best per mode; resume returns the ball to the paddle; pause with the tab. The whole Vol 2 engine is generated into the page (new whole-module mode in `sync-card-policies.cjs`) and runs on the shared 60 Hz fixed-step clock. Node autopilot: every Relaxed/Classic/Expert wall cleared in 200/200 games, Endless to wall 6, never stuck; a still paddle always loses. Found and fixed: on a 375×812 phone the paddle starts below the fold, so Start now scrolls the whole field into view. Daily waived (reflex game). Tile is Vol 2's painted icon; social interim (brief item 14). |
| Related games | **Fixed.** `build-related-games.mjs` now reads `<picture>`-wrapped hub tiles (45 games in rotation instead of 33) and writes `<picture>` itself when a WebP tile exists, so it and `build-webp.mjs` agree. 31 pages' blocks regenerated. |
| Disabled buttons | **Fixed arcade-wide.** `.btn-game:disabled` is now dimmed and inert; Rummy's scoped rule removed. |
