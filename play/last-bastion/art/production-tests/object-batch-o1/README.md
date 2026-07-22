# World Object Production Batch O1

Completed 22 July 2026. This batch supplies the first dedicated Full HD/4K-ready structural destructibles for Last Bastion.

## Runtime contract

- Three 4x4 transparent atlases at 192x192 per frame (`*-192.png`).
- Retained 384x384-per-frame masters (`*-384.png`) for future desktop derivatives.
- Columns are always: intact, damaged, critical, destroyed.
- Military rows: broken wall, weapon rack, equipment locker, reinforced gate.
- Natural rows: boulder, earth mound, tree, ice block.
- Organic rows: overgrowth, web mass, biomass node, alien crystal.
- Destroyed frames remain low-profile and do not imply whether collision or loot persists.

HP, damage thresholds, collision, projectile blocking, cover, interaction state, navigation, drops, particles, sound, and repair remain code-owned. `dev/src/game/arena/WorldObjectCatalog.ts` owns the row binding.

## Provenance and derivatives

- Built-in image generation produced the three untouched chroma sources (`*-chroma.png`).
- The installed image-generation chroma helper produced clean-alpha source files (`*-v1.png`).
- `normalize_object_batch_o1.py` deterministically creates retained masters, runtime atlases, copies the runtime files to `game-assets/`, and builds the QA contact sheet.
- Source generation paths are recorded in `PROMPTS.md`.

## Acceptance notes

All families preserve a stable footprint across states, show obvious progressive damage, and end in a low silhouette. The military, natural, and organic palettes are distinct while remaining subordinate to enemies, projectiles, pickups, and code-native danger telegraphs.

