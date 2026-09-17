# Codex asset handover — arcade art

Two jobs, in priority order: **(A) six assets that are missing or are placeholders**, and
**(B) 584 PNGs and no WebP** across `play/shared-assets/game-ui/`.

Everything below was measured on 2026-09-17 against `origin/main` at `921d96c6`. Re-check
before acting — other sessions edit this tree.

---

## Ground rules

1. **Never delete, overwrite or downscale a master.** Every pack's README names its
   canonical source (e.g. "Canonical source: `shared-assets/game-ui/table-themes`"). Add
   derivatives beside the masters; do not replace them. If a master is lower resolution
   than the target below, produce a **new higher-resolution master** and keep the old one
   until the new one is wired and verified.
2. **Do not touch `play/pinball/**` or `tools/pinball/**`.** Another session owns those,
   including `tiles/pinball.png` and `social/pinball.png`, which are placeholders on
   purpose and have their own brief at `docs/pinball/05-codex-art-brief.md`.
3. **Do not conclude an asset is unused from a grep.** Several are resolved at runtime
   through `play/game-ui-assets.js` by pack name, not by filename, so a filename search
   finds nothing. `card-suits.png` looks unreferenced by that test and almost certainly
   is not.
4. **Dimensions must match exactly when replacing a sprite sheet.** These are drawn with
   `background-position` / `drawImage` sub-rects, so a sheet that changes size silently
   misaligns every frame. `board-game-icons.webp` was checked to be the same 3072×1536 as
   its PNG before it shipped.
5. `play/game-ui-assets.js` currently has uncommitted edits from another session. Check
   `git status` before editing it, and stage only your own change.

---

## Job A — missing and placeholder assets

`play/tiles/PLACEHOLDERS.txt` is the existing record. These are the non-pinball entries.

| Asset | Required | State now |
| --- | --- | --- |
| `play/social/pyramid.png` | 1200×630 | **absent** — fails the quality gate |
| `play/social/tripeaks.png` | 1200×630 | **absent** — fails the quality gate |
| `play/tiles/pyramid.png` | 144×144 | placeholder studio mark, 96×94 |
| `play/tiles/tripeaks.png` | 144×144 | placeholder studio mark, 96×94 |
| `play/tiles/last-bastion.png` | 144×144 | placeholder studio mark, 96×94 |
| `play/social/last-bastion.png` | 1200×630 | check — absent from the `social/` listing |

The three tile placeholders are byte-identical (13,843 B), so they are literally the same
file copied three times.

**Subject matter, so the art is about the right game:**

- **Pyramid Solitaire** — a 28-card pyramid, cards removed in pairs that add to 13. Not a
  Klondike tableau; the pyramid silhouette is the recognisable thing.
- **TriPeaks Solitaire** — three overlapping peaks of cards above a single waste pile.
  The three-peak silhouette is the identity; do not draw a pyramid.
- **Last Bastion** — a Phaser roguelite, tonally unlike the rest of the arcade. It has
  ~4 GB of existing source art and has simply never had a 72/144px tile cut from it, so
  this is a crop-and-scale job from existing masters, not new art. See
  [[last-bastion-game]] notes before generating anything new.

Match the house style of the tiles that are already right — `play/tiles/solitaire.png`
(144×144) and the other card games are the reference. Social cards should match
`play/social/solitaire.png` (1200×630).

---

## Job B — 584 PNGs, 2 WebP, 57 MB

```
play/shared-assets/game-ui/   57 MB total, 584 .png, 2 .webp

  pro-hand-painted/   32 MB      board-games/   2.4 MB     battleships/   1.7 MB
  table-themes/      8.6 MB      card-decks/    2.3 MB     sokoban/       1.6 MB
  audio/             2.0 MB      arcade-sprites/2.2 MB     chess-pieces/  1.6 MB
                                 grid-logic-markers/ 2.1 MB
```

This is the single largest remaining win on the site and it is an asset job, not a code
one. What has already been proven here:

- `play/sprites/` (the soccer set): 8,212 KB of PNG → 1,864 KB of WebP at **q90**, a
  **4.4×** saving with no visible degradation, verified by screenshot. Lossless WebP was
  tried and managed only 1.4×, so **use lossy q88–q90, not lossless.**
- `board-game-icons.png` 2,311 KB → 457 KB. `painted-walnut.png` 1,860 KB → 120 KB.
  That single pair took `snakes-and-ladders` from 4,927 KB of media on first load to
  863 KB.

**The table themes are the clearest example of the problem.** They are only **1024×1024**
and yet weigh **1.8–2.2 MB each** — photographic material textures stored as PNG, which
is the worst possible format for them. There are eight in `table-themes/png/` and more in
`pro-hand-painted/table-themes/png/`.

### What to deliver

For every pack except `audio/` and the pinball tree:

1. A **WebP derivative beside each PNG**, same basename, same pixel dimensions, quality
   88–90, `method=6`. Keep the PNG.
2. Where a master is genuinely below the resolution target, a **new master** at that
   target, delivered alongside the existing one rather than over it.

### Resolution targets

The brief says "full HD and 4K". Applied sensibly per asset type rather than blanket:

| Asset type | Target | Why |
| --- | --- | --- |
| Table surfaces / backdrops | **3840×2160** master | currently 1024×1024, and they are stretched with `cover` to fill a table, so they are the assets most visibly soft today |
| Canvas backdrops (`sprites/pitch-*.png`) | **2560×1720** master | canvas is 640×430 CSS; this is a clean 4× for high-DPI. 4K would be wasted on a 640px canvas |
| Sprite sheets (icons, actors, fx) | keep current grid, **2× cell** | `board-game-icons` is already 3072×1536 (512px cells) and is fine. Changing a sheet's dimensions breaks frame alignment — see ground rule 4 |
| Tiles (`play/tiles/*.png`) | 144×144 **and** 288×288 `@2x` | they render at 52–72 CSS px; 288 covers 3× displays |
| Social cards (`play/social/*.png`) | 1200×630 exactly | fixed by the Open Graph spec; larger is not better |

**Do not upscale an existing raster to hit a target.** If the master is 1024×1024 and the
target is 3840×2160, that needs re-rendering from source, not an enlargement — an
upscaled PNG is bigger *and* softer, which is the opposite of the point.

### Constraints that will bite

- **Alpha matters.** Most sprite sheets are transparent RGBA. WebP handles alpha; check a
  frame with a soft edge (the `fx` sheets) rather than assuming.
- **Every pack has a `manifest.json` and `README.md`** listing its assets and
  `generatedAt` / `polishedAt` dates. Update them, or the next person cannot tell what
  changed.
- `play/shared-assets/game-ui/_delivery-manifest.json` and `website-delivery.json` also
  describe this tree. Keep them true.
- **`apps/*/assets/` is gitignored** in this monorepo. `play/shared-assets/` is not — it
  is committed, which is why its size matters.

### How to verify, not assume

A file listing proves nothing about what a browser fetches. Measure the page:

```bash
npx playwright test arcade-weight --reporter=line
```

`tests/visual/arcade-weight.spec.mjs` does a cold first-load measurement and is the
reference for doing it honestly — a warm service worker once reported 72 KB for a 6.6 MB
page, the HTTP cache survives `newContext()` and reported 524 KB for the same page, and
not awaiting `res.body()` reported anywhere between 185 and 597 KB. Use a fresh browser
process, `serviceWorkers: "block"`, and await the bodies.

Then, before calling any of it done:

```bash
node scripts/check-site.mjs
node scripts/check-javascript.mjs
node scripts/check-contrast.mjs
node scripts/check-game-ui-bootstrap.mjs
node scripts/check-new-game.mjs
npx playwright test arcade-weight arcade-mobile arcade-faq --reporter=line
```

**Screenshot anything you re-encode.** The soccer pitches and the Snakes & Ladders board
were both checked by eye after conversion, and that is what caught nothing — but it is
what would have caught a misaligned sheet or a crushed gradient. Do not skip it because
the byte count looks good.

### Do not regenerate the visual baselines

`tests/visual/__screenshots__/` holds **CI's Linux renders**. Refreshing them from a
Windows or macOS machine replaces them with that platform's rendering and breaks the suite
for everyone. If your art change legitimately moves a baseline, say so and let CI
regenerate it.
