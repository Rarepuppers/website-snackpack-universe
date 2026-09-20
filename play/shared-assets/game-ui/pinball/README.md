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

The generated source was reviewed and edited to remove curved orbit-like marks
and a ringed planet from the playing area so the decoration cannot imply false
ball paths. Alternate skins, sprites, tile, social art and audio remain
deferred.

Generated with the built-in image generation tool on 2026-09-20. The exact
prompt and edit are recorded in `PROMPT.md`.
