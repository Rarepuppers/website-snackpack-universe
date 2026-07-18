# Corrupted Human outbreak art preflight (Batch M)

Batch M is a Steam-quality held preflight for the post-Web-MVP human outbreak family. It deliberately stays out of live spawning until each enemy behavior gate is implemented and playtested.

## Runtime contracts

- `corrupted-survivor-v1`: 4 × 2 96 px sheet, directional columns south/north/east/west and two fast-swarm gait rows.
- `corrupted-marine-v1`: 4 × 3 96 px sheet, guarded/reposition row, knife wind-up row, and stagger/recovery row.
- `abomination-v1`: 4 × 3 128 px elite sheet, shamble, slam wind-up, and recovery/collapse rows.
- `corrupted-marine-effects-v1`: 4 × 2 64 px atlas: knife projectile, hand glint, throw arc, travel wake, cover impact, player impact, disarm burst, ready glint.

The art does not define sprint speed, swarm steering, knife damage, projectile travel, telegraph timing, cover collision, slam/grab lanes, stagger duration, defeat timing, or elite health. Those remain simulation-owned. Review at `?mode=gallery&batch=m`; no normal-run binding is added by this preflight.

## Source retention and rebuild

The four `*-chroma.png` files preserve the built-in image-generation output. Transparent masters are retained beside them, and `normalize_corrupted_humans.py` performs deterministic magenta extraction, despill, per-cell subject cropping, and nearest-neighbour normalization. Only the fixed runtime atlases are loaded by the manifest.

Creator review should check one-body-per-cell isolation, facing readability, the marine's knife silhouette and telegraph accents, the abomination's large-body value grouping, and grayscale readability before behavior promotion.
