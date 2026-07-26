# Object Batch O28 — Robotics Support, Water Treatment, Expedition Field Gear

Three 2×2 source atlases for the Last Bastion object library. The 384px masters are review/4K-preflight references; 256px and 128px derivatives are copied into `game-assets/` for runtime wiring.

## Families

- **Robotics / Support:** drone charging cradle, robot tool rack, articulated manipulator arm, parts sorting carousel.
- **Water / Treatment:** filtration tank, purification manifold, condensate basin, sampling cabinet.
- **Expedition / Field Gear:** survey backpack frame, inactive beacon tripod, collapsible shelter frame, sample transport case.

Runtime PNGs are transparent RGBA and contain no baked labels, interaction prompts, collision, hazards, targets, telegraphs, rewards, or gameplay values. Keep these decorative until code-owned placement and interaction contracts exist.

## QA

Chroma was extracted with border auto-key, soft matte, despill, and thresholds 12/220. `normalize_object_batch_o28.py` restores transparent corners, validates all four cells, emits 384/256/128 derivatives, and builds the contact sheet. Re-running it must preserve master hashes.
