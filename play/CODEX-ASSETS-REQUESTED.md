# Arcade asset execution record — reviewed 2026-08-14

Companion to `ARCADE-IMPROVEMENT-PLAN.md`. The older
[`spider-solitaire/ASSETS-NEEDED.md`](spider-solitaire/ASSETS-NEEDED.md) is
historical only: A1 is complete. This file is the current source of truth for
asset work. The only open production family is the gated A2 audio rollout;
completed briefs remain below as an audit record and must not be regenerated.

Visual items can be produced with Codex/imagegen. A2 is audio production, not
an imagegen task. Its first deterministic prototype and browser control now
exist; approve that sample by ear before generating the remaining sound family.

---

## Status board — re-verified on disk 2026-08-14

Everything below was checked against the actual files, not against this doc.
Work top-down.

| # | Item | Files | State |
|---|---|---|---|
| ~~A5~~ | ~~Mahjong tiles~~ | 60 PNGs | **DONE + REVIEWED** — vector symbols fixed at the generator; canonical, app and website copies match; no regeneration needed |
| **A2** | Shared sound effects | 1 of 8 `.wav` | **PILOT WIRED LOCALLY — NOT LIVE.** `place.wav`, the Sound on/off control and the Solitaire integration all pass locally, but the `.wav` was never committed and returns **404** in production. **The listening gate cannot be satisfied on Android until it deploys.** Seven sounds and wider rollout remain behind that |
| ~~A3~~ | ~~Soccer sprites~~ | existing sprite system | **DONE + WIRED** — actors, balls, goals, pitches, effects and badges are loaded by all soccer games |
| ~~A4~~ | ~~Snacky character sprites~~ | existing frames + sheet | **DONE + WIRED** — Flappy Snacky has three painted bird frames; Snacky Worm has head/body/tail in its sprite sheet |
| ~~A7~~ | ~~Small arcade sprites~~ | existing sheets | **DONE + WIRED** — Table Tennis and Asteroid Destroyer already use correctly scaled sprite-sheet regions |
| ~~A8~~ | ~~Maskable PWA icon~~ | 1 PNG | **DONE ON DISK — NOT LIVE.** Art and wiring are correct, but the PNG was never committed, so `/assets/icon-maskable-512.png` returns **404** and the manifest declares an icon that does not resolve. No regeneration needed; commit + deploy |
| ~~B1~~ | ~~SnackWords tile + card~~ | 2 PNGs + WebP | **DONE + WIRED** — final transparent hub icon and 1200×630 sharing card installed and visually checked |
| ~~B2~~ | ~~Golf Solitaire tile + card~~ | 2 PNGs + WebP | **DONE + WIRED** — distinct golf/card hub icon and final social card installed |
| ~~A1~~ | ~~Spider Solitaire~~ | — | **DONE** — real art present (85 KB tile, 157 KB card). Ignore any older note calling this outstanding |

**Nothing remaining here blocks the website.** Referenced assets exist; these
completed requests replaced false-gap briefs or live placeholders and improved
install/game polish.
The former live app issue, A5, is fixed in source but still needs the normal
release handoff before Play users receive it.

## Recommended action order

1. **A5 release handoff.** Script hardening, exact inventory/dimension checks,
   focused copy-parity verification, and durable word regressions are complete.
   Run the remaining on-device free/Pro smoke test, then hand Brain Games Vol 1
   to Claude for the Android production build and submission.
2. **Approve the A2 pilot by ear.** Listen to canonical `place.wav` in Solitaire
   on desktop and Android. If its tone and level are right, generate the other
   seven sounds from the same deterministic tool, then wire games incrementally.
3. **Website delivery contract — done for the confirmed gap.** The declared
   manifest excludes 52 unused premium classic faces, removing 31.72 MB while
   preserving canonical/app masters. Sync skips the exclusion and verification
   prevents it from silently returning.
4. **Finish automation and smoke the deployment.** Website CI is implemented.
   Add the monorepo workflow separately and use an explicit companion checkout
   or versioned hashes for cross-repo parity. After deployment, verify the
   maskable icon, service-worker v4, audio and both new OG cards.

---

## 2026-08-14 re-audit — new asset requests

Two visual items, both **optional and non-blocking** — the `/read/` SEO work in
`SITE-IMPROVEMENT-PLAN.md` § P11 ships without them, they just make it land
better. Generate in the house style below.

Before either: note that **`assets/icon-maskable-512.png` and
`play/shared-assets/game-ui/audio/place.wav` are finished but were never
committed and 404 on the live site.** No regeneration is needed — they exist and
are correct. That is a commit/deploy task for Claude, recorded here only so the
"DONE + WIRED" rows in the status board are not read as "live".

### C1. `/read/` bookshelf social card

| File | Size | Brief |
|---|---|---|
| `read/social-card.png` | 1200×630 PNG | The `/read/` index currently has no dedicated OG card. Each individual book correctly uses its own cover as `og:image`, but the shelf page itself has nothing representing the collection. Show **three or four book covers fanned or stacked on a shelf** in the house style, with the wordmark "SnackPack Bookshelf" and the line "Complete illustrated stories · free, no account". Do not reproduce a specific book's cover art exactly — a suggestion of covers is enough, so the card does not go stale when the shelf grows. |

### C2. Printable-readers guide social card

| File | Size | Brief |
|---|---|---|
| `guides/social/printable-decodable-readers.png` | 1200×630 PNG | For the planned `/guides/free-printable-decodable-readers/`. **This is the card most likely to be shared into teacher and parent groups**, which is the whole point of the guide — it targets the one audience on this property that actually links to things. Show a **printed page coming off a shelf or a small stack of printed sheets** alongside a book, with the wordmark "Free Printable Decodable Readers" and "8 books · PDF · no sign-up". Keep it warm and calm, not "classroom clipart". |

> If neither card is produced, the guide falls back to the existing
> `snackpack-social-share.png`, which is what two current guides already do —
> acceptable, just weaker for the one page where sharing is the strategy.

**Nothing else is requested.** In particular do not generate: new book page art
(the eight `/read/` books have complete approved sets), arcade tiles or social
cards (all 34 games have real art), or anything in the "What NOT to generate"
list at the foot of this file.

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

## A5. Mahjong tiles — complete; retain as an audit record

The original brief was wrong and must not be reused. The app consumes **30**
tiles, not 41: `dot`, `bam`, and `crak` 1–6; winds E/N/S/W; flowers A/B; and
snacks 1–6. The filename is `crak-*`, not `crack-*`. `MahjongGame.tsx` renders
the complete PNG; numeral and footer text are not separate UI layers except in
the missing-image fallback.

The root cause was literal non-ASCII symbols in a BOM-less PowerShell script.
Windows PowerShell 5.1 decoded them as ANSI before drawing. The fix now draws
ASCII-authored vector geometry in `scripts/generate-game-ui-asset-packs.ps1`.
The four wind tiles are distinct directional arrows.

The 30 Pro tiles are original painted assets, not generator output. Rebuilding
them with the generic Pro coverage script discarded their marbled frame and
texture, so `scripts/fix-mahjong-pro-tiles.ps1` instead heals only the old glyph
area and composites the new vector symbol over the retained artwork.

Review result:

- 30 base + 30 Pro PNGs exist at 256×344.
- Canonical `shared-assets`, Brain Games Vol 1, and website copies are
  byte-identical for every file.
- Base tiles are crisp and readable; Pro tiles retain the painted frame and
  parchment texture with no visible repair-box seams.
- Pro files remain about 116–120 KB each, rather than the roughly 10 KB flattened
  re-derivations that were rejected.
- The existing diagonal texture over the `bam-4` numeral is present in the
  pristine painted source and was not introduced by the repair.
- Keep the shipped suit palette. Changing only the new symbol would conflict
  with the baked-in Pro numerals; a palette change would require a deliberate
  full repaint of all Pro tiles.

**Recommendation: do not regenerate either set.** Next action is app verification,
an on-device free/Pro deck smoke test, then a Brain Games Vol 1 release via Claude.

Pipeline hardening completed 2026-08-14:

- `mahjong-tiles` is excluded from the generic Pro generator, including an
  explicit refusal when requested manually.
- `fix-mahjong-pro-tiles.ps1` now requires a separate pristine `-SourceDir` and
  rejects in-place input.
- Both Mahjong scripts validate the exact 30-name inventory and 256×344
  dimensions, then explicitly copy canonical output to the app and website.
- The verifier supports focused pack/target filters; the canonical, app and
  website Mahjong subsets pass.
- The formerly stale website Pro packs were synchronized from canonical assets
  with the new explicit sync script. The full `verify-game-ui-assets.ps1` now
  passes for all three apps and the website.

## Code-fix review — SnackWords and Vol 3 word guess

No asset regeneration is connected to this fix. The implementation is correct:

- SnackWords uses `FULL_DICTIONARY ∪ ACCEPTED_WORDS`, and `ACCEPTED_WORDS` is the
  existing `DAILY_WORDS ∪ EXTRA_WORDS` export. This fixes the false warning for
  `LATIN` and protects every curated guess, not only scheduled answers.
- Vol 3 uses `FULL_DICTIONARY ∪ WORDS5`; its existing length guard continues to
  handle non-five-letter input.
- SnackWords still counts an unknown five-letter guess after showing a soft
  warning. That is the existing product behavior, so the defect was cosmetic,
  not an unwinnable puzzle.

Completed follow-up: the existing Vol 2 and Vol 3 validation scripts now assert
`LATIN` and every curated answer are known, a nonsense token is not known, and
scheduled answers remain accepted. Both validators and both app typechecks pass.

## A2. Shared sound effects — pilot complete; wider rollout gated on listening

Implemented pilot:

- `scripts/generate-arcade-audio.mjs` deterministically creates a 180 ms mono,
  44.1 kHz soft wooden tap peaking at −12 dBFS.
- Canonical output is `shared-assets/game-ui/audio/place.wav`; the generator
  explicitly synchronizes its website copy to
  `play/shared-assets/game-ui/audio/place.wav`.
- `play/audio.js` owns the persistent visible Sound on/off control and safe audio
  playback. Solitaire calls it only after a legal placement.
- Browser verification passed: preference persisted after reload, an Ace move
  registered and exercised the sound path, and no console/load errors appeared.

**Do not generate or wire the remaining seven sounds until `place.wav` is
approved by ear on desktop and Android.** This is a product-tone gate, not a
technical blocker.

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
- Canonical path: `shared-assets/game-ui/audio/`; the generator explicitly
  refreshes the website delivery copy under `play/shared-assets/game-ui/audio/`.

## A3. Soccer game sprites — complete; do not regenerate

The proposed folder was not the implemented asset contract. The site already
ships `soccer-actors.png`, `soccer-sprites.png`, `soccer-goal.png`, two painted
pitch images, effects sheets, and badge art under `play/sprites/`.
`SnackSoccerAssets` loads and exposes them, and every soccer canvas calls those
helpers before its CSS/canvas fallback. The actor sheet includes running,
heading, defending, tackling, striking, three keeper poses, and four ball frames.

The existing system was visually reviewed and is high quality at gameplay size.
The eight-file brief below would duplicate fewer poses than the working system
already contains and should not be actioned.

<details><summary>Superseded request retained for audit history</summary>

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

</details>

## A4. Snacky character sprites — complete; do not regenerate

The original request checked for a proposed `snacky-sprites/png/` directory but
missed the assets already used by the runtime. `arcade-assets.js` loads three
painted `flappy-bird-*` frames from the shared Pro arcade pack. Snacky Worm uses
`sprites/arcade/snacky-worm-sprites.png`, whose manifest regions provide head,
body, tail, food, and medal. The canvas rectangles are fallbacks only.

The existing assets were visually reviewed and remain crisp at their actual
render sizes. Creating the five files below would duplicate working art and
would not be loaded without unnecessary rewiring. Retain the old brief only as
historical context; no generation is requested.

<details><summary>Superseded request retained for audit history</summary>

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

</details>

## A7. Small arcade sprites — complete via sprite sheets; do not regenerate

The original audit looked only for standalone filenames. Both consumers are
already wired through `arcade-assets.js`: Table Tennis uses its dedicated
vertical paddle and 48px ball regions, while Asteroid Destroyer uses distinct
large, medium, and small asteroid regions. Their CSS/canvas shapes are fallback
rendering. The three standalone additions below are redundant.

<details><summary>Superseded request retained for audit history</summary>

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

</details>

## A8. Maskable PWA icon

**Completed 2026-08-14.** The canonical corgi-in-backpack artwork was preserved
and deterministically recomposed over the required opaque `#fdf6ec` background.
All meaningful artwork fits inside the central 410px safe circle and was checked
under circular, squircle, and rounded-square masks. The manifest declares the new
file as `purpose: "maskable"`, and the service-worker shell precaches it.

<details><summary>Original specification retained for audit history</summary>

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

</details>

---

## B1. SnackWords — hub tile + social card

**Completed 2026-08-14.** The placeholder PNGs were replaced with a transparent
painted three-tile hub icon and a deterministic 1200×630 social card. The card
uses an exact 5×6 grid, exact approved copy, and the non-answer phrase “SNACKY
PLAY” distributed across coloured tiles. `build-webp.mjs` regenerated the social
WebP derivative. No further art is requested.

<details><summary>Original brief retained for audit history</summary>

For the daily word-guess game ported from Brain Games Vol 2. Full context in
`ARCADE-IMPROVEMENT-PLAN.md` &sect; B1. The game itself is CSS — board, letter
tiles and on-screen keyboard are styled surfaces like the other arcade games — so
**only these two files are needed. Do not generate a background, a board, a
container, letter tiles or a keyboard**; bespoke art there would make
SnackWords the only game in the arcade that doesn't match the rest.

**Naming, and this one is not negotiable: the game is "SnackWords". Never
"Wordle"** — that is a New York Times trademark and they took down clones in
2022. Do not put the word Wordle in the artwork, the filename, or the alt text.

| File | Size | Brief |
|---|---|---|
| `play/tiles/snackwords.png` | 72&times;72 PNG, transparent | Hub tile. Must sit beside the existing arcade tiles — match their weight and silhouette exactly. Suggested motif: a single small letter tile (a rounded cream square with a serif capital letter on it), or three overlapping tiles fanned slightly. Use the accent green `#1f8f77` for a "correct" tile if you want one colour hit; keep the rest cream/ink. No text other than the letter itself. |
| `play/social/snackwords.png` | 1200&times;630 PNG | Open Graph card. **This matters more than any other social card in the arcade**: it is the link preview when a player pastes their daily result into a chat, which is the whole growth loop for a daily game. Show a partially-solved 5&times;6 grid — a few tiles in accent green `#1f8f77` (correct) and gold `#efb54d` (present), the rest empty cream outlines — with the wordmark "SnackWords" and the line "A new word every day &middot; free, no ads". **Do not spell a real answer word in the grid** — use scattered non-word letters, or blank tiles, so the card can never leak a puzzle. |

Both in the house style at the top of this file: calm, hand-painted, warm cream
`#f6efe4` ground, ink `#201713`, brand orange `#de6a38` available as an accent.

> **Both paths already contain a flat placeholder** so the live hub has no
> broken image and the social card is not blank. They are plain shapes drawn
> programmatically, not art — **overwrite them at the same paths.** After
> dropping the real files, run `node scripts/build-webp.mjs` from the repo
> root so the WebP variants regenerate.

</details>

---

## B2. Golf Solitaire — hub tile + social card

**Completed 2026-08-14.** The placeholders were replaced with a transparent
golf-flag/card hub icon and a 1200×630 seven-column tableau card. Exact title and
subtitle copy were composited deterministically, and `build-webp.mjs` regenerated
the social WebP derivative. No further art is requested.

<details><summary>Original brief retained for audit history</summary>

Ported from Brain Games Vol 2. Same shape of request as B1: the board and cards
are CSS reusing the existing painted suit icons, so **only these two files are
needed — no board, background, table or card-face art.**

| File | Size | Brief |
|---|---|---|
| `play/tiles/golf-solitaire.png` | 72&times;72 | Hub tile, matching the other 33. Suggested motif: three cards fanned in a shallow arc, or a single card over a small green baize sweep — it must read differently from the Solitaire, Spider Solitaire and FreeCell tiles at 72px, since all four sit near each other on the hub. |
| `play/social/golf-solitaire.png` | 1200&times;630 | OG card. Seven short columns of card backs/faces over the green baize `#247a55`&rarr;`#14523a` used by the board, with the wordmark "Golf Solitaire" and "Free &middot; no ads &middot; no sign-in". |

> **Flat placeholders already sit at both paths** so nothing renders broken.
> Overwrite in place, then run `node scripts/build-webp.mjs` from the repo root.

</details>

---

## What NOT to generate (already covered, see `ARCADE-IMPROVEMENT-PLAN.md`)

- Grid puzzle art (Sudoku, Crossword, Kakuro, Picross, Minesweeper, 2048, Word
  Search) — typographic by nature, art would hurt legibility.
- Card faces — the painted deck (`card-decks/`) is complete.
- Backgrounds — `table-themes/` already has 8.
- App store art — these are web pages only.
- Share-card image variants (A9 in the plan) — deliberately text/emoji only
  for now; not requested.
- SnackWords board / background / letter-tile / keyboard art — the game is
  CSS, and only the two B1 files above are wanted.
- Golf Solitaire board / baize / card-face art — same reason; the cards reuse
  the existing painted suit icons.

## Asset pipeline rules

For any future approved asset replacement, update canonical `shared-assets`
first unless the file is intentionally website-only. Then:

```bash
powershell -File scripts/sync-game-ui-assets.ps1 -TargetNames <target> -Packs <pack>
powershell -File scripts/verify-game-ui-assets.ps1

cd website-snackpack-universe
node scripts/build-webp.mjs
```

Run the sync and verifier from the monorepo root. For apps, synchronize every
pack they consume. For the website, synchronize only assets in its declared
consumption manifest once that D1 task exists; do not deploy an app-only pack
merely to satisfy blanket parity. Future website-only optimized derivatives
must be declared explicitly rather than silently replacing the canonical
app-quality PNG. Wiring, accessibility and browser QA are part of the same task
as landing the asset, not an unspecified later follow-up.
