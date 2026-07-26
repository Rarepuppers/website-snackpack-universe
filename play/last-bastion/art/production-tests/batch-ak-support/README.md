# Batch AK support — modular boundaries and fixtures

The second large Batch AK package extends the arena centerpiece atlas with reusable support pieces.

## Atlas contract

- Boundary atlas: 4×2, stable order north, south, west, east, inner corner, outer corner, gate, breach.
- Fixture atlas: 4×2, stable order armored pillar, cover crate cluster, reactor generator, control console, stair/bridge, rubble barricade, hive biomass growth, void obelisk.
- Transparent masters and 384px per-cell preflight derivatives are retained. Runtime 256/192/128px derivatives are copied into `game-assets/`.

These pieces are composition-ready but not gameplay-ready. Collision, cover, safe lanes, objective anchors, warning geometry, and interaction rules remain code-owned. Do not promote a boss arena until mixed-enemy 960×540/Full HD/4K and 45–90-second fight reviews pass.

`normalize_batch_ak_support.py` performs deterministic alpha restoration, normalization, QA contact-sheet generation, and runtime copying.
