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
full `pro-hand-painted/` set. **Only 4 of 32 games use any of it.**

| Asset family | Files | Used by | Should be used by |
|---|---:|---|---|
| `card-decks/` (8 backs, 4 suits, faces) | 64 + 66 | Solitaire, Spider | FreeCell, Thirteen |
| `mahjong-tiles/` | 30 + 32 | **nothing** | Mahjong (renders in CSS today) |
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

## A5. Social share cards for games that lack a good one

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

## B1. FreeCell is visibly the least-finished page — fix first

It is the only game missing **all** of: `VideoGame` schema, an FAQ, difficulty
options, deck themes, stats, and it has **92 words** of prose against a ~350
average. It also has **no `<footer>` at all**, unlike every other game.

`freecell online free` is a **21,300/month** Bing term. This page is the
weakest asset pointed at the strongest keyword in the set.

## B2. Wire up the existing art (see table above)

Mahjong using the real painted tiles instead of CSS is the highest-impact
single change — 12k/month term, and tile legibility is the whole game.

## B3. Keyboard support — 20 of 32 games have none

Given **95% desktop traffic** this is the most under-weighted gap in the arcade.
Missing on: Checkers, Connect 4, Minesweeper, Reversi, Solitaire, Mahjong,
Memory Match, Picross, Word Search, Thirteen, FreeCell, Snakes & Ladders,
Soccer Trivia Sprint, and the soccer games.

Also an accessibility issue — several games are currently mouse-only, which
makes them unusable for keyboard-only users.

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
| FreeCell | 92 | 21,300/mo |
| Target Shooting Arena | 185 | low |
| Keepy-Uppy | 194 | low |
| Crossbar Challenge | 197 | low |
| Goalkeeper Hero | 200 | low |
| Soccer Trivia Sprint | 206 | low |
| Free Kick Curl | 218 | low (but ranks #1 and converts) |
| Snakes & Ladders | 240 | low |

FreeCell is the only one where this clearly costs traffic. The rest are worth
doing for consistency, not for ranking.

## B7. Smaller gaps

- **Flag Frenzy never calls `SnackPack.celebrate()`** — the only game that
  doesn't trigger the download funnel on a win. Straight bug.
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

1. **A1** Spider art (already briefed, unblocks a 123k/mo page)
2. **B1** Rebuild FreeCell to match the other card games
3. **A2** Shared SFX set → then I wire it across all 32
4. **B2** Wire the existing painted art, Mahjong first
5. **B3/B4** Keyboard + pause
6. **A3/A4** Soccer and character sprites
7. **B5–B8** Undo, prose, modes

Items 2, 4, 5 and 7 are mine and don't block on Codex. Say the word and I'll
start on FreeCell.
