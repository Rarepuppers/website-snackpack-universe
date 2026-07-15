# Last Bastion production-test assets

These assets test the representative modular character pipeline. They are versioned review candidates, not a final animation library.

Production Asset Batch A (arena, effects, pickups, and HUD) is documented in [`batch-a/README.md`](batch-a/README.md). Its six runtime atlases are integrated into the default renderer.

## Marine base body v1

- Source sheet: `marine-base-spritesheet-v1.png`
- Gameplay sheet: `marine-base-spritesheet-v1-96.png`
- Logical cell: 96 × 96 pixels
- Grid: four columns × three rows
- Columns: south, north, east, west
- Rows: idle, move contact pose, dodge key pose
- Contains: base body, close-fitting default head layer, and baked-in boots
- Excludes: interchangeable outer helmet and weapons

## Bastion helmet overlay v1

- Source sheet: `marine-bastion-helmet-overlay-v1.png`
- Gameplay sheet: `marine-bastion-helmet-overlay-v1-96.png`
- Uses the same cell size, order, pivots, and frame indices as the base body
- Contains only the removable outer helmet and visor

## Bastion Service Rifle gameplay v1

- Source sprite: `bastion-service-rifle-gameplay-v1.png`
- Gameplay sprite: `bastion-service-rifle-gameplay-v1-64.png`
- Logical canvas: 64 × 32 pixels; visible rifle approximately 58 × 26 pixels
- Points east so runtime rotation can handle any aim direction
- Runtime origin is near the stock/receiver at `(0.25, 0.5)`
- Contains no character, hands, projectile, flash, or shadow

## Scuttler gameplay v1

- Source sheet: `scuttler-spritesheet-v1.png`
- Gameplay sheet: `scuttler-spritesheet-v1-64.png`
- Logical cell: 64 × 64 pixels
- Grid: four columns × two rows
- Columns: south, north, east, west
- Rows: alternating scuttle contact poses A and B
- Runtime facing follows the direction to the player
- Each enemy offsets its gait timing by stable entity ID so a swarm does not animate in lockstep

## Egg Cluster gameplay v1

- Source sheet: `egg-cluster-spritesheet-v1.png`
- Gameplay sheet: `egg-cluster-spritesheet-v1-64.png`
- Logical cell: 64 × 64 pixels
- Grid: four columns × one row
- Frames: dormant, pulsing, cracked, ruptured/empty
- Runtime frame selection comes from normalized hatch progress, not a decorative animation clock

## Brain Blob gameplay v1

- Source sheet: `brain-blob-states-v1.png`
- Gameplay sheet: `brain-blob-states-v1-64.png`
- Logical cell: 64 × 64 pixels
- Grid: four columns × one row
- Frames: drift, wind-up, lunge, recover
- The east-authored sprite rotates toward the player so the warning and lunge indicate the real attack direction

## Generation and extraction

All source art was generated with the built-in image tool using approved concepts as strict style references. The base prompt requested a consistent unarmed 4 × 3 high-three-quarter-view pixel-art body sheet. The helmet prompt requested helmet-only pixels registered to the corresponding base-sheet heads. The rifle prompt requested one clean east-facing gameplay sprite preserving the approved design. The Scuttler prompt requested an original low coral-and-violet crustacean swarmer with four facings and two gait poses. The Egg Cluster prompt requested four increasingly urgent hatch stages with a visibly empty final shell. The Brain Blob prompt requested four authored combat phases with yellow reserved for wind-up and hot coral-pink for lunge. Chroma-key backgrounds were removed locally with soft matte and despill. Gameplay assets were resized with nearest-neighbour sampling.

The retained `*-chroma.png` files record the generated source before background extraction. Do not use them in the game.

## Review switches

Production art is enabled by default. Use `?art=placeholder` for the code-shape comparison renderer. The helmet is enabled by default; add `?helmet=0` to verify the unchanged base body without it. The existing `weapons=` parameter may be combined with either view. Use `?mode=gallery` for character/enemy/equipment frames and `?mode=gallery&batch=a` for the arena/effect/pickup/HUD batch.

The in-app browser runtime could not initialise in the current environment, so creator visual acceptance remains a manual review step. Automated type, unit, build, asset-HTTP, and route-HTTP validation is complete.
