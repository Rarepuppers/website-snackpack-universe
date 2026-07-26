# Object Batch O27 — Civic Market, Memorial Cultural, Surface Salvage

Three 2×2 source atlases for the Last Bastion object library. The 384px masters are review/4K-preflight references; 256px and 128px derivatives are copied into `game-assets/` for runtime wiring.

## Families

- **Civic / Market:** vendor stall counter, ration kiosk, weighing station (blank display), market crate rack.
- **Memorial / Cultural:** memorial plinth, remembrance wall, reclaimed-machine sculpture, offering shelf.
- **Surface / Salvage:** salvage cart, magnetic lifting cradle, reclaimed hull-plate stack, sealed salvage drum.

Runtime PNGs are transparent RGBA and contain no baked labels, interaction prompts, collision, hazards, targets, telegraphs, rewards, or gameplay values. Keep these decorative until code-owned placement and interaction contracts exist.

## QA

Chroma was extracted with border auto-key, soft matte, despill, and thresholds 12/220. `normalize_object_batch_o27.py` restores transparent corners, validates all four cells, emits 384/256/128 derivatives, and builds the contact sheet. Re-running it must preserve master hashes.
