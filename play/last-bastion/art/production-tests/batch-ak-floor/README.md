# Batch AK floor atlas

Modular floor candidates for the eight boss-arena identities. The atlas supplies four material families—neutral armored deck, colosseum stone, reactor metal, hive biomass stone—with clean, panel-seam, scuffed, and damaged/maintenance variants.

## Contract

- 4×4 atlas, stable row/column order documented in the contact sheet.
- Retained transparent source and 256px per-cell preflight derivative remain here.
- Runtime derivatives are 128px and 64px tiles copied to `game-assets/`.
- Tiles are lower contrast than actors, projectiles, pickups, and code-drawn telegraphs. Collision, cover, room adjacency, hazards, and warning geometry remain code-owned.

The floor set is a candidate until seam mosaics, 45×26 repetition views, grayscale/colour-vision checks, and mixed-fight 960×540/Full HD/4K reviews pass.

`normalize_batch_ak_floor.py` rebuilds the transparent master, runtime derivatives, and QA contact sheet deterministically.
