# Production Asset Batch R — Destructible Terrain

Task 55 supplies the presentation layer for Task 54's numeric-health terrain. The canonical prop atlas contains 28 frames: columns are intact, damaged, critical, destroyed; rows are fence, cargo crate, barricade, boulder, power conduit, reinforced cover, biomass.

## Files

- `destructible-terrain-v1-chroma-master.png` — untouched built-in image-generation source.
- `destructible-terrain-v1-alpha-master.png` — transparent extraction from the source.
- `destructible-terrain-v1-alpha-master-4x.png` — normalized retained 2048×3584 alpha master.
- `destructible-terrain-v1-128.png` — live 4×7 atlas with 128×128 cells.
- `destructible-terrain-effects-v1-*` — equivalent retained/runtime family for the eight 64×64 material effects.
- `frame-map.json` — stable frame order, origins, and code-owned state thresholds.
- `normalize_batch_r.py` — deterministic crop, bottom-centre alignment, nearest-neighbour normalization, and contact-sheet generation.
- `PROMPTS.md` — exact prompt provenance and generation mode.

Runtime code owns durability, thresholds, collision, tint, hit flashes, HP bars, debris timing, and route opening. Art must never narrow an active collision footprint or make destroyed rubble appear blocking.

Review at `?mode=gallery&batch=r`.
