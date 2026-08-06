# Assets requested from Codex / imagegen — ready to hand off

Companion to [`spider-solitaire/ASSETS-NEEDED.md`](spider-solitaire/ASSETS-NEEDED.md)
(A1, still outstanding) and `ARCADE-IMPROVEMENT-PLAN.md` (full context, priority
order, and why each item is genuinely needed rather than nice-to-have). This
file exists so each item can be copy-pasted as a generation brief without
re-deriving context from the plan doc.

**Claude does not generate or place any art or audio itself** — every file
below is Codex/imagegen's to produce. Once a file lands at the stated path,
wiring it into the site is a follow-up code task, not part of this request.

---

## Style reference (applies to every visual item below)

- **Palette:** cream `#f6efe4` background, ink `#201713`, brand orange
  `#de6a38`, accent green `#1f8f77`, gold `#efb54d`.
- **Feel:** calm, hand-painted, warm — not glossy, not neon, not "casino" or
  "mobile game store" in style.
- **Closest existing examples to match:** anything already in
  `play/shared-assets/game-ui/pro-hand-painted/` and
  `play/shared-assets/game-ui/arcade-sprites/png/` — generate *in that style*,
  not a fresh style.

---

## A5. Mahjong tiles — urgent, fixes a live Google Play bug, not a website task

**Priority: highest.** This is shipping broken right now in Brain Games Vol 1's
Mahjong Solitaire (both free and Pro decks) — a published app is rendering
corrupted glyphs on every tile.

**Brief:** Regenerate 60 mahjong tile faces (30 base + 30 "pro hand-painted"),
each a clean drawn suit glyph on a cream tile body — no embedded CJK text
(the bug is a UTF-8/Latin-1 mojibake corruption of Chinese characters; the
fix is to stop relying on text glyphs at all and draw the symbol instead).

| Suit | Tiles | Colour | Glyph to draw |
|---|---|---|---|
| Dots | `dot-1` … `dot-9` | `#2f6fd6` | 1–9 circles/dots arranged per traditional mahjong dot-tile layout |
| Bamboo | `bam-1` … `bam-9` | `#1f8f77` | 1–9 bamboo stalks, traditional arrangement |
| Cracks | `crack-1` … `crack-9` | `#d8483a` | 1–9 character-tile numerals with a simple drawn ideogram-style mark (not real CJK text) |
| Winds | `wind-e`, `wind-s`, `wind-w`, `wind-n` | `#5b3fb0` | A simple drawn compass-direction glyph (arrow or wind-swirl), not the letter E/S/W/N alone |
| Flowers | `flower-a` … `flower-d` | `#d24a86` | 4 distinct simple flower motifs |
| Snacks (custom suit) | `snack-1` … `snack-6` | `#b9772e` | 6 distinct SnackPack-style snack icons (the game's own custom suit) |

- Base set: `play/shared-assets/game-ui/mahjong-tiles/png/` at whatever size
  the existing files there are (match exactly).
- Pro set: `play/shared-assets/game-ui/pro-hand-painted/mahjong-tiles/png/`,
  same filenames, painted/higher-detail treatment matching the rest of that
  folder.
- The numeral and footer word (`Bamboo`, `Dots`, `Cracks`, `Wind`, `Flower`,
  `Snack`) already render correctly as separate UI text — only the glyph
  artwork on the tile itself is being replaced.
- Sync targets after regeneration (a code/build task, not part of this
  request): all three Brain Games apps' `assets/game-ui/`, plus this repo's
  `play/shared-assets/game-ui/`. Run `scripts/verify-game-ui-assets.ps1`
  afterward — it checks the copies match each other, not that the glyph
  itself is correct, so a human should eyeball a few tiles too.

## A2. Shared sound effects — all 32 games are currently silent

**Brief:** A small shared SFX set — not per-game libraries. Short, soft, mixed
quiet. These are calm games; nothing should startle a player.

| File | Used for | Character |
|---|---|---|
| `place.wav` | card/tile/piece placed | soft wooden tap |
| `pickup.wav` | card/piece lifted | lighter, higher tap |
| `invalid.wav` | rejected move | dull, short, not a buzzer |
| `success.wav` | run/line/match completed | brief warm chime |
| `win.wav` | game won | 3–4 note resolve, under 1.5s |
| `tick.wav` | timer/counter increment | very quiet click |
| `pop.wav` | arcade block/asteroid destroyed | soft pop |
| `whoosh.wav` | ball kicked / paddle hit | short air movement |

- Format: WAV masters + MP3 or OGG for delivery, mono, 44.1kHz.
- Each under 400ms except `win.wav`.
- Peak around −12dBFS; nothing harsh above 8kHz.
- Target path: `play/shared-assets/game-ui/audio/`.

## A3. Soccer game sprites — the World Cup set is entirely CSS shapes

Seven soccer games (Goalkeeper Hero, Penalty Shootout, Free Kick Curl,
Crossbar Challenge, Header Hero, Dribble Rush, Keepy-Uppy) currently render
with no art at all.

| File | Size | Brief |
|---|---|---|
| `goalkeeper-idle.png` | 256×256 | Goalkeeper standing, ready stance, transparent background |
| `goalkeeper-dive-left.png` | 256×256 | Same character, diving left, transparent background |
| `goalkeeper-dive-right.png` | 256×256 | Same character, diving right (can mirror left if the pose is symmetric) |
| `striker-idle.png` | 256×256 | Striker standing ready, transparent background |
| `striker-kick.png` | 256×256 | Same character mid-kick, transparent background |
| `goal-frame.png` | 1024×512 | Net/posts, transparent background |
| `pitch-grass.png` | 512×512 | Seamless tileable turf texture |
| `football.png` | 128×128 | Check `arcade-sprites/png/ball.png` first — may already suit this without a new asset |

Path: `play/shared-assets/game-ui/soccer-sprites/png/` (new folder, following
the `arcade-sprites/png/` convention).

## A4. Snacky character sprites — two games render as coloured rectangles

Flappy Snacky and Snacky Worm use the SnackPack characters by name but have
no actual character art.

| File | Size | Brief |
|---|---|---|
| `snacky-bird-up.png` | 128×128 | Wings-up flap frame |
| `snacky-bird-down.png` | 128×128 | Wings-down flap frame |
| `snacky-worm-head.png` | 64×64 | Worm head, facing right |
| `snacky-worm-body.png` | 64×64 | Repeatable body segment |
| `snacky-worm-tail.png` | 64×64 | Tail segment |

**Match the corgi/character style already used across the SnackPack apps** —
not a generic game-sprite look. Reference the existing character art in
`shared-assets/` (the corgi mascot) for face/proportions/palette consistency.

Path: `play/shared-assets/game-ui/snacky-sprites/png/` (new folder).

## A7. Correctly-shaped small arcade sprites — blocks 2 canvas games

The existing `arcade-sprites/png/` pack (`paddle.png`, `ball.png`,
`asteroid.png`) is built for large, horizontal renders. Table Tennis and
Asteroid Destroyer need small/differently-oriented variants — using the
existing files as-is would be a visible downgrade at their actual render
size, which is why they're still unwired.

| File | Size | Brief |
|---|---|---|
| `paddle-vertical.png` | 64×256 | Vertical pill, same material/style as `paddle.png` rotated to portrait, not a squash of the horizontal asset |
| `ball-small.png` | 64×64 | Simplified read of `ball.png` that still works at ~18px on screen — less internal detail, since fine detail turns to mush at that size |
| `asteroid-small.png` | 64×64 | Same simplification treatment for `asteroid.png` |

Path: `play/shared-assets/game-ui/arcade-sprites/png/` (same folder as the
existing set — these are additions, not a new pack).

## A8. Maskable PWA icon

The arcade is installable but has no maskable icon variant — the existing
`icon-512.png` is edge-to-edge and would lose its corgi or its coloured dots
if forced into Android's maskable-safe circle.

| File | Size | Brief |
|---|---|---|
| `icon-maskable-512.png` | 512×512, full-bleed, no transparency | Corgi + backpack recomposed to sit entirely within the centre **410px circle** (80% safe zone — Android crops to whatever shape the launcher uses). The four coloured dots can be dropped or reduced to a subtle background motif; they're the first thing a circular mask eats. Background colour must be `#fdf6ec` (matches the manifest's `background_color`) |

Path: `assets/icon-maskable-512.png` (repo root `assets/`, alongside the
existing `icon-192.png`/`icon-512.png`).

Once it exists, add to `manifest.webmanifest`:
```json
{ "src": "/assets/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
```

---

## What NOT to generate (already covered, see `ARCADE-IMPROVEMENT-PLAN.md`)

- Grid puzzle art (Sudoku, Crossword, Kakuro, Picross, Minesweeper, 2048, Word
  Search) — typographic by nature, art would hurt legibility.
- Card faces — the painted deck (`card-decks/`) is complete.
- Backgrounds — `table-themes/` already has 8.
- App store art — these are web pages only.
- Share-card image variants (A9 in the plan) — deliberately text/emoji only
  for now; not requested.

## When art arrives

Drop files at the paths above (same filenames), then from the repo root:

```bash
node scripts/build-webp.mjs
```

That regenerates WebP derivatives. Wiring each asset into its game (CSS/JS
changes) is a separate follow-up — flag when files land and it'll get done.
