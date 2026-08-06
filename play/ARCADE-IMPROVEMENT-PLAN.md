# SnackPack Arcade — improvement plan

Audit of all 32 browser games, 2026-08-06. Companion to
[`spider-solitaire/ASSETS-NEEDED.md`](spider-solitaire/ASSETS-NEEDED.md), which
covers that one game's art in detail and is still outstanding.

**Read the "Before you generate anything" section first** — a large amount of
art already exists, and more of it is wired than an earlier draft of this plan
claimed. Regenerating it would be wasted work.

> ⚠️ **A5 is urgent and is not a website issue.** All 60 shared Mahjong tiles
> are corrupted, and **Brain Games Vol 1 is rendering them live on Google
> Play**. See A5.

---

## Context: what the analytics say

From Cloudflare (30 days) and Bing Webmaster (~6 months):

- The whole arcade gets **~60 page views a month**. It is not currently a
  traffic source, despite 32 finished games.
- **95% of site visitors are on desktop** (1,630 of 1,720). Keyboard support and
  large-screen layouts matter far more than the mobile-first instinct suggests.
- Bing shows **~500,000 monthly US impressions** of addressable demand across
  games we already have (solitaire 234k, spider 123k, sudoku 94k, checkers 28k,
  freecell 21k, mahjong 12k) — and we capture almost none of it.
- The bottleneck is **4 inbound links**, not game quality. Polish helps
  retention and conversion once people arrive; it will not fix discovery.

Read that as: these improvements are worth doing, but do the link-building in
parallel or the polish has no audience.

---

## Before you generate anything — art that already exists

`shared-assets/game-ui/` (canonical at `C:\snackpack-universe\shared-assets`,
mirrored into each Brain Games app and into `website-snackpack-universe/play/`)
holds **~640 finished art files**, including a full `pro-hand-painted/` set.

**Correction, 2026-08-06:** an earlier draft of this plan said only 4-5 games
used any of it. That was an undercount — it grepped the HTML, but most of the
wiring lives in `play.css`. The real figure is **9 of 32**, and much of the
remainder is a deliberate choice rather than a gap. See
`shared-assets/game-ui/ASSET_AUDIT_BRAIN_GAMES.md`, which already documents the
2026-07-13 website wiring pass.

Already wired: Checkers, Connect 4, Minesweeper, Picross, Reversi,
Snakes & Ladders, Solitaire, Spider Solitaire, FreeCell.

| Asset family | Used by | Genuinely still unwired? |
|---|---|---|
| `card-decks/` | Solitaire, Spider, FreeCell | Thirteen — worth doing |
| `grid-logic-markers/` | Minesweeper, Picross | Kakuro, Sudoku — worth doing |
| `strategy-tokens/` | Connect 4, Reversi | — |
| `board-games/` | Checkers, Snakes & Ladders | — |
| `table-themes/` | Snakes & Ladders | other board games — optional |
| `arcade-sprites/` | *(website)* nothing | Asteroid Destroyer, Cascade, Table Tennis |
| `word-game-tiles/` | nothing | Word Search, Crossword |
| `mahjong-tiles/` | nothing on web **by design** | see A5 — and the app bug below |
| `chess-pieces/`, `dominoes/`, `sokoban/`, `battleships/` | nothing | no web game exists for these yet |

**Mahjong on the website is not broken and does not need the shared tiles.** It
uses `play/sprites/mahjong-suits.png`, a clean local sprite sheet that is
clearer at its small render size. That was a documented decision, not an
oversight.

---

# Section A — for Codex (asset & image generation)

Only genuine gaps. Everything above is already covered.

## A1. Spider Solitaire art — **outstanding, highest priority**

See [`spider-solitaire/ASSETS-NEEDED.md`](spider-solitaire/ASSETS-NEEDED.md).
Tile (144×144) and social card (1200×630). Interim placeholders are live, so
nothing is broken — the page just doesn't match the rest of the arcade.

## A2. Sound effects — **the single biggest gap**

**All 32 games are completely silent.** There is no audio anywhere in the
arcade (the 288 audio files in the repo all belong to Last Bastion).

Needed: a small **shared** SFX set, not per-game libraries. Short, soft,
mixed quiet — these are calm games and the sounds must never startle.

| File | Used for | Character |
|---|---|---|
| `place.wav` | card/tile/piece placed | soft wooden tap |
| `pickup.wav` | card/piece lifted | lighter, higher tap |
| `invalid.wav` | rejected move | dull, short, not a buzzer |
| `success.wav` | run/line/match completed | brief warm chime |
| `win.wav` | game won | 3-4 note resolve, under 1.5s |
| `tick.wav` | timer/counter increment | very quiet click |
| `pop.wav` | arcade block/asteroid destroyed | soft pop |
| `whoosh.wav` | ball kicked / paddle hit | short air movement |

- Format: **WAV masters + MP3 or OGG** for delivery, mono, 44.1kHz
- Each under 400ms except `win.wav`
- Target path: `play/shared-assets/game-ui/audio/`
- Peak around -12dBFS; nothing harsh above 8kHz

> If audio generation is out of scope for Codex, say so and I'll source
> CC0 sounds instead — but they must be tonally consistent, which is why a
> generated set is preferable.

## A3. Soccer game sprites

Seven soccer games (Goalkeeper Hero, Penalty Shootout, Free Kick Curl, Crossbar
Challenge, Header Hero, Dribble Rush, Keepy-Uppy) are **entirely CSS shapes**.
They were built for the World Cup push and look the most unfinished.

Needed, in the existing hand-painted style, matching `arcade-sprites/`:

- `goalkeeper-idle.png`, `goalkeeper-dive-left.png`, `goalkeeper-dive-right.png` (256×256)
- `striker-idle.png`, `striker-kick.png` (256×256)
- `goal-frame.png` — net/posts, transparent, 1024×512
- `pitch-grass.png` — tileable turf background, 512×512 seamless
- `football.png` — 128×128 (may already suit `arcade-sprites/ball.png`; check first)

## A4. Character sprites for the two "Snacky" games

Flappy Snacky and Snacky Worm use the SnackPack characters by name but render
as coloured rectangles.

- `snacky-bird-up.png`, `snacky-bird-down.png` (128×128)
- `snacky-worm-head.png`, `snacky-worm-body.png`, `snacky-worm-tail.png` (64×64)
- Match the corgi/character style used in the apps, not a generic sprite look

## A5. Mahjong tiles — **corrupted, and SHIPPING in Brain Games Vol 1**

Found 2026-08-06. **All 60 mahjong tiles (30 base + 30 pro-hand-painted) have a
mojibake glyph** where a Chinese character should be — UTF-8 written, Latin-1
read.

| File | Shows | Should show |
|---|---|---|
| `bam-3.png` | `a-` above the 3 | a bamboo glyph |
| `dot-5.png` | `a-` above the 5 | a dot glyph |
| `wind-e.png` | `a(tm)` above the E | East |
| `flower-a.png` | `aoe` above the A | a flower glyph |
| `snack-1.png` | `a~` above the 1 | the snack symbol |

**This is not a website problem — the website is fine.** Web Mahjong uses a
clean local sprite sheet by design. The damage is in the app:

> `apps/snackpack-brain-games/components/games/mahjong/MahjongGame.tsx`
> `require()`s all 30 base tiles into `TILE_ART` and all 30 pro tiles into
> `PRO_TILE_ART`, and renders them unconditionally as `<Image>` (line ~239).
>
> **Brain Games Vol 1 is live on Google Play. Its Mahjong Solitaire is
> currently showing mojibake on every tile, in both the free and Pro decks.**

The `ASSET_AUDIT_BRAIN_GAMES.md` entry for 2026-07-12 explains how it survived:
that pass regenerated the *tile bodies* and explicitly "preserved the custom
labels and glyphs" — faithfully preserving glyphs that were already corrupt.

### To fix

Regenerate at the canonical source, then sync:

- Source: `C:\snackpack-universe\shared-assets\game-ui\mahjong-tiles\png\`
  and `...\pro-hand-painted\mahjong-tiles\png\`
- Sync targets: all three Brain Games apps' `assets/game-ui/`, plus
  `website-snackpack-universe/play/shared-assets/game-ui/`
- Same 30 filenames and sizes in both sets
- The numeral and footer word (`Bamboo`, `Dots`, `Cracks`, `Wind`, `Flower`,
  `Snack`) are already correct — only the glyph above them is wrong
- **Write the source as UTF-8 and confirm the renderer reads it as UTF-8.** If
  the pipeline can't reliably carry CJK, drop the glyph and use a clean drawn
  suit symbol instead — a wrong-but-tidy tile beats mojibake
- Suit colours in use: dots `#2f6fd6`, bamboo `#1f8f77`, cracks `#d8483a`,
  winds `#5b3fb0`, flowers `#d24a86`, snacks `#b9772e`

After regenerating, run `scripts/verify-game-ui-assets.ps1`. Note that it
verifies files *match across copies* — it cannot detect that the glyph itself
is wrong, which is exactly why this survived four refresh passes. Someone
should eyeball a few tiles.

Everything else in `shared-assets/` was spot-checked and is clean: card suits,
grid-logic markers, word tiles, strategy tokens, dominoes, board games.

## A6. Social share cards for games that lack a good one

Check `play/social/` — every game has a file, but several are auto-generated
placeholders. Lowest priority; only worth doing once A1–A4 are done.

## A7. Correctly-shaped arcade sprites (small, blocks the two canvas games)

The existing `arcade-sprites/` pack is built for large render sizes and
horizontal orientation. Two canvas games can't use it as-is:

- `paddle-vertical.png` — **64x256**, vertical pill matching the existing
  paddle's material. Table Tennis renders it at 12x80.
- `ball-small.png` — **64x64**, a simplified read of `ball.png` that still
  works at ~18px on screen. The current 256px version loses to a plain circle
  at that size.
- `asteroid-small.png` — **64x64**, same simplification for Asteroid Destroyer.

These are small, cheap additions rather than a new pack. Without them, those
two games are better off as they are.

## What NOT to generate

- **Grid puzzle art** (Sudoku, Crossword, Kakuro, Picross, Minesweeper, 2048,
  Word Search). These are typographic by nature. Art would hurt legibility and
  the existing `grid-logic-markers/` set already covers the accents they need.
- **Card faces** — the painted deck is complete.
- **Backgrounds** — `table-themes/` has 8 already.
- **App store art** — these are web pages only.

---

# Section B — code work (mine, no assets needed)

Ordered by value. Nothing here needs Codex.

## ~~B1. FreeCell~~ — **DONE 2026-08-06**

Was the only game missing `VideoGame` schema, an FAQ, difficulty options, deck
art, and a `<footer>`, with 92 words of prose against a ~350 average — all
while sitting on a **21,300/month** Bing term.

Rebuilt: fixed two malformed meta tags (the canonical link had no closing `>`,
which swallowed the tag after it, and there was a stray `>` after
`twitter:image`); added `VideoGame` + `HowTo` schema, a footer, the download
funnel card, a real social share image, and 4/2/1 free-cell difficulty; wired
the painted card art; prose 92 → 797 words with a 6-question FAQ.

The game engine was left alone — it was already the strongest in the arcade
(supermove capacity, hints, auto-finish, undo/redo, solver-verified deals).

## B2. Wire up the existing art (see table above)

Revised after checking `play.css` — Connect 4, Minesweeper, Picross,
Snakes & Ladders, Checkers and Reversi were **already wired** in the 2026-07-13
pass, and web Mahjong deliberately uses its own local sprites.

**Thirteen is also already wired** — it renders the painted `card-suit-icon`
set. Static grep missed it because the class name is built in JS at runtime;
that is why the earlier counts in this plan were unreliable in both directions.

Genuinely unwired, and my honest read on each:

| Game | Available pack | Verdict |
|---|---|---|
| Sudoku, Kakuro | `grid-logic-markers/` | **Skip.** Their cell states are clean CSS and highly readable. PNG backgrounds would fight the typography for no gain. |
| Word Search, Crossword | `word-game-tiles/` | **Maybe.** Worth a look, but the current letter rendering is already crisp. |
| Memory Match | `card-decks/` backs | **Worth doing** — the painted backs would suit the flip animation. |
| Table Tennis, Asteroid Destroyer | `arcade-sprites/` | **Blocked on shape, not wiring** — see below. |
| Cascade | `arcade-sprites/` | DOM-rendered, not canvas; blocks are CSS. Low value. |

**Table Tennis / Asteroid Destroyer — why I did not wire these.** The sprites
exist and look good, but they are the wrong shape and scale for these
renderers. `paddle.png` is a *horizontal* pill; Table Tennis paddles are
12x80 **vertical**. Rotating and squashing it to 12px wide would look worse
than the current clean rect. The ball renders at 18px across, where the
painted `ball.png` detail turns to mush against the current crisp circle.

Wiring these would be a visible downgrade, so it needs art at the right shape
first — see A7.

## B3. Keyboard support — **7 grid games done 2026-08-06, 13 remain**

Given **95% desktop traffic** this was the most under-weighted gap in the
arcade. Built `play/keyboard-grid.js`, a shared roving-tabindex helper: a grid
becomes a single tab stop, arrows move a cursor, Enter/Space plays the focused
cell. It derives the row width from the rendered layout rather than being told,
so it works at any board size and survives a resize, and a MutationObserver
restores the cursor after each re-render.

Done: **Minesweeper** (+ <kbd>F</kbd> to flag), **Connect 4**, **Reversi**,
**Checkers**, **Memory Match**, **Word Search**, **Picross**
(+ <kbd>X</kbd> to switch fill/cross).

Two classes of problem it fixed:
- `<button>` grids (Minesweeper, Connect 4) were reachable but needed up to
  480 Tab presses to cross. Now one.
- `<div>` grids (Reversi, Checkers, Word Search, Picross, Memory Match) could
  not be reached by keyboard **at all**.

Still to do — these need bespoke work, not the grid helper, because their
interaction is pile-to-pile rather than cell-to-cell:
**Solitaire, FreeCell, Spider, Thirteen, Mahjong** (card/tile selection),
**Snakes & Ladders, Soccer Trivia Sprint**, and the six soccer action games
(timing-based, need a key to shoot rather than a cursor).

## B4. Pause — missing on 30 of 32

Matters most for the timed/action games: Asteroid Destroyer, Cascade, Snacky
Worm, Flappy Snacky, Table Tennis, Dribble Rush, Keepy-Uppy, and the soccer set.
Currently you cannot stop mid-run.

## B5. Undo — **4 logic puzzles done 2026-08-06, 23 remain**

Added to the games where a stray click did the most damage:

- **Sudoku** (94k/mo) — restores the **mistake counter** too, so a wrong digit
  no longer permanently costs you. Pencil notes step back one digit at a time.
- **2048** — restores board, score and the spawned tile. Only real moves are
  snapshotted, so a no-op arrow press costs nothing.
- **Picross** — every fill/cross is a step.
- **Kakuro** — entries and hints are both undoable; the filled counter restores.

All four have an Undo button and <kbd>Ctrl</kbd>+<kbd>Z</kbd> where the game
already listens for keys. Snapshots are only taken when something is actually
about to change, so undo always steps back a real move rather than a no-op.

Still missing on the arcade/action games (Cascade, Snacky Worm, Flappy Snacky,
the soccer set) where undo doesn't really apply, and on Crossword, Memory Match,
Word Search, Minesweeper, Mahjong, Snakes & Ladders and Thirteen where it does.

## B6. Thin SEO prose — 8 games under 250 words

| Game | Words | Bing volume for its term |
|---|---:|---|
| ~~FreeCell~~ | ~~92~~ → 797 | 21,300/mo — **done** |
| Target Shooting Arena | 185 | low |
| Keepy-Uppy | 194 | low |
| Crossbar Challenge | 197 | low |
| Goalkeeper Hero | 200 | low |
| Soccer Trivia Sprint | 206 | low |
| Free Kick Curl | 218 | low (but ranks #1 and converts) |
| Snakes & Ladders | 240 | low |

FreeCell was the only one where this clearly cost traffic, and it is now fixed.
The rest are worth doing for consistency, not for ranking.

## B7. Smaller gaps

- ~~**Flag Frenzy never calls `SnackPack.celebrate()`**~~ — **fixed
  2026-08-06.** All 32 games now trigger the funnel on a win. While fixing it I
  found a second bug: nine soccer/World Cup games point the funnel at
  `/world-cup/` but the button label was hardcoded to "Get the free app on
  Android", promising an app the link doesn't lead to. `funnel.js` now takes an
  optional `SP_PLAY_LABEL`, those nine say "Open the World Cup hub", and
  internal links no longer force a new tab.
- **"Large cards" mode** exists only on the three card games; the same idea
  would help every board game on a desktop screen.
- **Best-score tracking** missing on 10 games including Sudoku, Minesweeper,
  Checkers and Reversi.
- **Daily puzzle** exists on 16 games — a genuine retention hook worth
  extending to Mahjong, Kakuro and FreeCell.

## B8. Modes worth adding

- **Mahjong** — only one layout; the classic Turtle plus 2-3 more would treble
  its depth using tiles we already own.
- **FreeCell** — no difficulty selection at all; the standard 4/2/1 free-cell
  variants are a one-line rule change.
- **Two-player pass-and-play** — only Snakes & Ladders and Table Tennis have it.
  Natural for Checkers, Connect 4, Reversi.

---

## Suggested order

1. **A5 — Mahjong tiles.** Not a website task and not cosmetic: a published
   Google Play app is rendering broken glyphs right now.
2. **A1 — Spider Solitaire art.** Unblocks a 123k/mo page.
3. **A2 — Shared SFX set.** Then I wire it across all 32 games.
4. **A3/A4/A7 — Soccer, Snacky and small-scale arcade sprites.**
5. Mine, unblocked: pause (B4), remaining undo (B5), Memory Match card backs,
   thin prose on the soccer pages (B6), and the remaining keyboard work (B3).

Everything in Section B is mine and none of it waits on Codex.
