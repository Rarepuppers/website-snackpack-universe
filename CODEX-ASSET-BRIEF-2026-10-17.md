# Codex art brief — arcade and shared game art, 2026-10-17

Supersedes `CODEX-ASSET-HANDOVER.md` (2026-09-17). Its Job B (WebP for the whole
site copy) is **no longer a Codex job**: encoding is moving into the derivative
pipeline, where it is reproducible (see `ARCADE-AUDIT-2026-10-17.md`, step 2).
This brief is only for art that has to be **made or redrawn**.

Context and evidence: `ARCADE-AUDIT-2026-10-17.md`.

---

## Ground rules

1. **Masters go to the canonical tree, never to a consumer copy.** Shared game art
   lives in `shared-assets/game-ui/` (monorepo) and reaches the apps and the website
   through `scripts/build-game-ui-derivatives.ps1`. Never edit
   `apps/*/assets/game-ui/` or `website-snackpack-universe/play/shared-assets/` by
   hand. Arcade tiles and social cards (`play/tiles/`, `play/social/`) are
   website-only and are delivered there directly.
2. **Never overwrite or downscale an existing master.** Add new files; if you
   replace one, keep the old one until the new one is wired and checked.
3. **House style:** the clay/soft-3D look of the existing tiles — rounded square,
   warm palette, soft light from the upper left, a single clear subject, **no text
   or numbers rendered as words**, no logos, no real brands. Reference tiles:
   `play/tiles/solitaire.png`, `golf-solitaire.png`, `mahjong.png`,
   `snakes-and-ladders.png`. Reference social card: `play/social/solitaire.png`.
4. **Exact names and dimensions.** Each item below gives both.
5. **Do not touch** `play/pinball/**`, `tools/pinball/**`, `play/last-bastion/**`,
   or any `social/`/`tiles/` file for those two games — other sessions own them.
6. Card games must be **recognisable by silhouette**: the brief says what the
   identifying shape is. Do not draw a generic card fan for every card game; that
   is the problem with the current Thirteen tile.

---

## Batch 1 — the web arcade (do first)

| # | Files | Size | Subject |
| --- | --- | --- | --- |
| 1 | `play/tiles/pyramid.png`, `play/tiles/pyramid@2x.png` | 144×144, 288×288 | **Pyramid Solitaire.** A 7-row triangle of cards (1 at the top, 7 at the bottom), the top card lifting away with a matching card beside it. The triangle silhouette is the identity. Replaces the 96×94 placeholder. |
| 2 | `play/social/pyramid.png` | 1200×630 | Same subject, landscape, on a green felt table, room on the left third for the page title the site overlays (keep that area quiet — **do not render text**). |
| 3 | `play/tiles/tripeaks.png`, `@2x` | 144×144, 288×288 | **TriPeaks.** Three overlapping card peaks side by side above a single face-up waste card. Three peaks, not one pyramid. Replaces the placeholder. |
| 4 | `play/social/tripeaks.png` | 1200×630 | Same, landscape, title area quiet. |
| 5 | `play/tiles/spider-solitaire.png`, `@2x` | 144×144, 288×288 | **Redraw** in house style (current one is flat and off-style). A long descending run of spade cards cascading down, with a small friendly spider on the top card. |
| 6 | `play/tiles/thirteen.png`, `@2x` | 144×144, 288×288 | **Redraw** — currently near-identical to Solitaire's fanned cards. Four small hands of cards around a round table seen from above, one card (a 3 of spades shape — suit symbol only, no text) played in the middle. |
| 7 | `play/tiles/picross.png`, `@2x` | 144×144, 288×288 | **Redraw** — currently reads as Sudoku's colour grid. A 5×5 grid with clue strips along the top and left (shown as short bars/dots, not digits) and the filled cells forming a heart. |

Also deliver a `.webp` beside each PNG (same basename, q88, `method=6`) for 1–7.
After delivery, update `play/tiles/PLACEHOLDERS.txt` to remove the pyramid and
tripeaks entries.

## Batch 2 — shared masters the apps are missing (do when those games are scheduled)

Carried from the September plan; **none of it has landed**. Generate into
`shared-assets/game-ui/` (masters), never into an app. Match the pack you are adding
to: open two existing files from the same folder and match their size, alpha,
lighting and outline weight.

| # | Pack / files | Size | Why |
| --- | --- | --- | --- |
| G1 | `grid-logic-markers/png/op-plus.png`, `op-minus.png`, `op-times.png`, `op-divide.png`, `wall-block.png`, `rect-corner.png` (+ the same six in `pro-hand-painted/grid-logic-markers/png/`) | match pack (512×512, transparent) | KenKen operators, Akari wall, Shikaku corner — the only marker gaps for Vol 3's puzzles |
| G1b | **Text-free redraws** (keep the old files; add these beside them): `grid-logic-markers/png/island-blank.png`, `cage-corner-blank.png`, `clue-badge-blank.png`; every `word-game-tiles/png/` tile without its letter or number: `tile-correct-blank`, `tile-present-blank`, `tile-absent-blank`, `tile-empty-blank`, `keyboard-key-blank`, `keyboard-correct-blank`, `keyboard-present-blank`, `keyboard-absent-blank`, `clue-number-blank`, `trail-start-blank`, `trail-end-blank` (+ the same in `pro-hand-painted/`) | match pack, transparent | **Highest priority in batch 2.** The current island has a "3" painted in, the cage corner "8+", the clue badge "12", and every word tile an "A"/"Z"/"7", which breaks the no-rendered-text rule and makes them unusable under real clues and letters. This is why Vol 3's Hashi, KenKen, Killer Sudoku and Word Guess still have no art (found 2026-10-17 while wiring Vol 3). |
| G2 | new pack `board-grounds/png/`: `chess-classic.png`, `chess-walnut.png`, `chess-marble.png`, `go-grid-wood.png`, `go-grid-paper.png`, `backgammon-felt.png` | 2048×2048, opaque | chess/draughts/gomoku/backgammon have no board surface art |
| G3 | `mahjong-tiles/png/`: bam/crak/dot 7, 8, 9 (9 files) + `dragon-red.png`, `dragon-green.png`, `dragon-white.png` | match pack | completes the set. **Use the hardened Mahjong generator only.** |
| G4 | `card-decks/backs/`: 3 more **free-tier** backs | match pack | free tier has 3 backs against Pro's 5 |
| G6 | `strategy-tokens/png/`: a second colourway for reversi, gomoku, morris, connect (2 each) | match pack | lets Vol 1 offer a piece choice |
| G7 | `sokoban/png/`: second crate/wall/floor/goal/player/crate-goal theme | match pack | single theme today |
| G8 | `battleships/png/`: `sunk.png` + 3 distinct hull silhouettes | match pack | no sunk state |

Lowest priority, drop if the batch runs long: a SnackPack-character chess set.

---

## Not for Codex (pipeline work, listed so nobody re-briefs it)

- WebP derivatives of the files the website fetches, and right-sizing sprites to
  their draw size (checker pieces, flappy bird and pipes, card backs, suits,
  tokens). Owned by the derivative pipeline.
- Vol 2's raw backdrop PNGs (`snacky-worm-*`, `brick-breaker-*`,
  `tile-slide-picnic`). They need to enter the pipeline, not be redrawn.
- The September ask to re-render the 1024² table themes at 4K is **deferred**, not
  dropped: nobody has checked whether they look soft at today's render sizes. Do
  that check (screenshot a table game on a 3× phone) before generating anything.

## Check before handing back

- Names and dimensions exactly as above; alpha where the pack is transparent.
- Zero rendered words.
- Each tile viewed at 52 px and 72 px next to its neighbours on `/play/` — it must
  read at that size.
- For batch 2: run `scripts/build-game-ui-derivatives.ps1` for the affected
  targets and `scripts/verify-game-ui-assets.ps1` (it now reports every failing
  target, not just the first).
