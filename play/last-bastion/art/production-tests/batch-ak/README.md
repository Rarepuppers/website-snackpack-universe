# Batch AK — boss arena centerpiece atlas

Large visual candidate for the eight boss-arena identities authorized by the behavior/presentation gates: circular Colosseum, four-pillar Crucible, segmented Reactor Ring, Hive-Heart Chamber, Void/Stargate Dais, Foundry Forge, Ruined Military Parade Ground, and Multi-Lane Siege Arena.

## Contract

- One 4-column × 2-row transparent atlas in stable cell order listed above.
- Retained source and 512px per-cell 4K-preflight derivative stay here; runtime derivatives are 256/192/128px and are copied to `game-assets/`.
- These are reusable visual centerpieces, not complete collision layouts. Boundary pieces, cover placement, safe lanes, objective anchors, warning geometry, and recovery windows remain code-owned and authored per arena.

## Acceptance gate

Do not promote any arena or mini-boss from this candidate on art alone. Review at 960×540, Full HD, and 4K with mixed enemies, code telegraphs, cover, and intended builds; confirm a readable 45–90-second seeded fight before pool promotion.

## Steam target

Use the retained source/512px derivatives for HD/4K close views. Never upscale the runtime files as final showcase art.

`normalize_batch_ak.py` rebuilds the transparent master, runtime derivatives, and QA contact sheet deterministically.
