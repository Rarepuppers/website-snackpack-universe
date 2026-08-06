# SnackPack Arcade — improvement plan

Audit of all 32 browser games, 2026-08-06. Companion to
[`spider-solitaire/ASSETS-NEEDED.md`](spider-solitaire/ASSETS-NEEDED.md), which
covers that one game's art in detail and is still outstanding.

**Read the "Before you generate anything" section first — a large amount of art
already exists and is simply not wired up. Generating it again would be wasted
work.**

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

`play/shared-assets/game-ui/` holds **~640 finished art files**, including a
full `pro-hand-painted/` set. **Only 5 of 32 games use any of it** (FreeCell was
wired up on 2026-08-06; the rest still render CSS).

| Asset family | Files | Used by | Should be used by |
|---|---:|---|---|
| `card-decks/` (8 backs, 4 suits, faces) | 64 + 66 | Solitaire, Spider, FreeCell | Thirteen |
| ~~`mahjong-tiles/`~~ | 30 + 30 | **nothing** | ⚠️ **corrupted — see A5, do not wire** |
| `arcade-sprites/` (asteroid, ball, blocks, bricks…) | 39 + 58 | **nothing** | Asteroid Destroyer, Cascade, Table Tennis |
| `board-games/` | 20 + 22 | Checkers | Snakes & Ladders |
| `strategy-tokens/` | 11 + 13 | Reversi | Connect 4 |
| `grid-logic-markers/` (bulbs, cages, bridges) | 48 + 50 | **nothing** | Kakuro, Picross, Minesweeper |
| `word-game-tiles/` (keyboard states, hint ring) | 14 + 16 | **nothing** | Word Search, Crossword |
| `table-themes/` (8 backgrounds: felt, wood, marble, slate…) | 8 + 6 | **nothing** | every board/card game |
| `chess-pieces/`, `dominoes/`, `sokoban/`, `battleships/` | 85 | **nothing** | no web game exists for these yet |

**Wiring this up is a code task, not an art task — I'll do it.** Listed here so
Codex doesn't regenerate any of it.

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

## A5. Mahjong tiles — **all 60 files are corrupted, must be regenerated**

Found 2026-08-06 while attempting to wire these up. **Every one of the 30
standard and 30 pro-hand-painted mahjong tiles has a mojibake glyph** where the
Chinese character should be — the classic UTF-8-decoded-as-Latin-1 failure.

Examples of what is actually rendered on the tiles today:

| File | Shows | Should show |
|---|---|---|
| `bam-3.png` | `â–` above the 3 | 條 / a bamboo glyph |
| `dot-5.png` | `â—` above the 5 | 筒 / a dot glyph |
| `wind-e.png` | `â™` above the E | 東 |
| `flower-a.png` | `âœ` above the A | a flower glyph |
| `snack-1.png` | `â˜` above the 1 | the snack symbol |

Nobody noticed because **nothing renders them** — Mahjong draws its tiles in
CSS, and the art is only referenced in the asset manifest, never consumed.

**This is why Mahjong could not be wired up.** Wiring it as-is would have
shipped 30 visibly broken tiles onto a 12,000/month page.

To regenerate:
- Same 30 filenames, same sizes, both the standard and `pro-hand-painted` sets
- The numeral and the footer word (`Bamboo`, `Dots`, `Cracks`, `Wind`,
  `Flower`, `Snack`) are correct in the current files — only the glyph above
  them is wrong
- **Write the source file as UTF-8 and confirm the renderer reads it as UTF-8.**
  If the pipeline can't reliably carry CJK, drop the glyph entirely and use a
  clean suit symbol instead — a wrong-but-tidy tile beats mojibake
- Suit colours already in use: dots `#2f6fd6`, bamboo `#1f8f77`, cracks
  `#d8483a`, winds `#5b3fb0`, flowers `#d24a86`, snacks `#b9772e`

Everything else in `shared-assets/` was spot-checked and is clean — card suits,
grid-logic markers, word tiles, strategy tokens, dominoes and board games all
render correctly.

## A6. Social share cards for games that lack a good one

Check `play/social/` — every game has a file, but several are auto-generated
placeholders. Lowest priority; only worth doing once A1–A4 are done.

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

**Mahjong is blocked** — its 60 tile files are corrupted (see A5). It was the
intended first job here and cannot proceed until they are regenerated.

Remaining, all verified clean and ready to wire:
Connect 4 (`strategy-tokens/`), Snakes & Ladders (`board-games/`),
Asteroid Destroyer / Cascade / Table Tennis (`arcade-sprites/`),
Kakuro / Picross / Minesweeper (`grid-logic-markers/`),
Word Search / Crossword (`word-game-tiles/`), and `table-themes/` backgrounds
across the board games.

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

## B5. Undo — missing on 27 of 32

Only Solitaire, Spider, FreeCell, Checkers and Reversi have it. Highest value
on the logic puzzles where a misclick currently costs the whole board:
**Sudoku, Kakuro, Picross, Minesweeper, Crossword, 2048, Memory Match**.

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

1. ~~**B1** Rebuild FreeCell~~ — **done**
2. **A1** Spider art (already briefed, unblocks a 123k/mo page)
3. **A2** Shared SFX set → then I wire it across all 32
4. **A5** Regenerate the mahjong tiles — currently blocking a 12k/mo page
5. **B2** Wire the remaining painted art (verified clean), Mahjong once A5 lands
6. **B3/B4** Keyboard + pause
7. **A3/A4** Soccer and character sprites
8. **B5–B8** Undo, prose, modes

Items 5, 6 and 8 are mine and don't block on Codex.
