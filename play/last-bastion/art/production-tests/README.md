# Last Bastion production-test assets

These assets test the representative modular character pipeline. They are versioned review candidates, not a final animation library.

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

## Generation and extraction

All source art was generated with the built-in image tool using approved concepts as strict style references. The base prompt requested a consistent unarmed 4 × 3 high-three-quarter-view pixel-art body sheet. The helmet prompt requested helmet-only pixels registered to the corresponding base-sheet heads. The rifle prompt requested one clean east-facing gameplay sprite preserving the approved design. Every output used a flat magenta chroma-key background, which was removed locally with soft matte and despill. Gameplay assets were resized with nearest-neighbour sampling.

The retained `*-chroma.png` files record the generated source before background extraction. Do not use them in the game.

## Review switches

Use `?art=marine` to enable the generated Marine layers. The helmet is enabled by default; add `&helmet=0` to verify the unchanged base body without it. The existing `weapons=` parameter may be combined with either view.
