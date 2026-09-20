# Pinball Galley pilot

Canonical decorative playfield family for Brain Games Vol. 1 and the web
arcade Pinball game. The bitmap sits beneath the procedural geometry; physics,
paths, lamps, targets, flippers, balls, score and controls remain live code.

- `masters/playfield-galley@4x.png` is the 2000 × 4160 canonical master. It is
  excluded from every consumer delivery.
- `playfields/playfield-galley.png`, `playfield-galley@2x.png` and
  `playfield-galley@3x.png` are the app PNG tiers at 500 × 1040,
  1000 × 2080 and 1500 × 3120. Their names match React Native's density
  convention.
- The matching WebP files are the website tiers. They stay below the page
  weight budget while preserving the same pixels and composition.
- Loading failure in either renderer falls back to the existing procedural
  navy table. No rule or accessibility behavior depends on this pack.

Quality v2 adds a richer but geometry-free Galley background and transparent
object sprites for the ball, flippers, bumpers, saucers, posts, spinner and
drop targets. `masters/quality-v2/` holds the approved generated sources;
`scripts/build-pinball-quality-v2.ps1` deterministically crops and derives the
consumer files. The app receives `sprites/png/` and the website receives
`sprites/webp/`. Both keep procedural fallbacks if an image fails to decode.
The accepted visual mockup is a style reference only: its rails and live
objects are not baked into the playfield. All delivered sprites are placed
from `table.js` geometry.

The original generated source was reviewed and edited to remove curved orbit-like marks
and a ringed planet from the playing area so the decoration cannot imply false
ball paths. Alternate skins, sprites, tile, social art and audio remain
deferred from the first pilot. Audio, alternate skins, tile and social art
remain deferred after this quality pass.

Generated with the built-in image generation tool on 2026-09-20. The exact
prompt and edit are recorded in `PROMPT.md`.
