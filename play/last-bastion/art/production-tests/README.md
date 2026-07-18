# Last Bastion production-test assets

These assets test the representative modular character pipeline. They are versioned review candidates, not a final animation library.

Production Asset Batch A (arena, effects, pickups, and HUD) is documented in [`batch-a/README.md`](batch-a/README.md). Its six runtime atlases are integrated into the default renderer.

Production Asset Batch B (weapons, Spitter, Carapace elite, Siege Crusher, portrait, and signature effects) is documented in [`batch-b/README.md`](batch-b/README.md). Its seven assets are integrated into gameplay and the Batch B gallery.

The gameplay-critical portion of Production Asset Batch C is documented in [`batch-c/README.md`](batch-c/README.md). Blast Mite, Warp Flanker, rewards, powerups, statuses, the electric fence, and Bastion Barrage presentation are integrated; Relic, Artifact, and Shrine art remains deferred until those systems exist.

Production Asset Batch D1 is documented in [`batch-d/README.md`](batch-d/README.md) and contains the integrated Brood Warden set. Production Asset Batch D2 is documented in [`batch-d2/README.md`](batch-d2/README.md) and contains the integrated Ripper body and melee effects. Production Asset Batch D4 is documented in [`batch-d4/README.md`](batch-d4/README.md) and contains the integrated Razor Scuttler body and interceptor effects. Production Asset Batch F1 is documented in [`batch-f1/README.md`](batch-f1/README.md) and contains the integrated Patrol Blade, action-tile, and Uranium-Core Rounds family.

Production Asset Batch E1 is documented in [`batch-e1/README.md`](batch-e1/README.md) and contains the integrated Quillback body, individual spike projectile, launch accents, impacts, hit, and defeat effects.

Production Asset Batch K is documented in [`batch-k/README.md`](batch-k/README.md) and contains the integrated persistent Blaze, Overload, Corrode, and Freeze status-overlay atlas.

Batch I Codex, perk, and hotkey tile preflight is documented in [`batch-i/README.md`](batch-i/README.md). Its generated masters are retained but held from runtime until the tile/inventory behavior gate passes.

Event Horizon art preflight Batch L is documented in [`batch-l/README.md`](batch-l/README.md). It is retained and gallery-integrated for Steam-quality review but intentionally held from normal gameplay until the Unique behavior gate passes.

Corrupted Human outbreak art preflight Batch M is documented in [`batch-m/README.md`](batch-m/README.md). It contains held Infected Survivor, Corrupted Marine, Abomination, and Marine knife/projectile effect families for post-Web-MVP behavior gates.

Emberfall world-theme art preflight Batch H is documented in [`batch-h/README.md`](batch-h/README.md). It contains held floor, boundary, obstacle, and low-contrast decal atlases that preserve Batch A collision silhouettes, plus Toxic Bloom, Void Approach, and Arctic Relay variants under `batch-h/`.

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

Production art is enabled by default. Use `?art=placeholder` for the code-shape comparison renderer. The helmet is enabled by default; add `?helmet=0` to verify the unchanged base body without it. The existing `weapons=` parameter may be combined with either view. Use `?mode=gallery` for character/enemy/equipment frames and `?mode=gallery&batch=a|b|c|d|d2|d3|d4|e1|e2|e3|f1|f2|f3|f4|k|eh|m|h|tb|va|ar` for each production batch. F1 is Patrol Blade/action UI, F2 is Bolt Carbine, F3 is Bulwark Rotary Cannon, F4 is Grenade Tube, K is the shared status-overlay family, EH is the held Event Horizon preflight, M is the held Corrupted Human outbreak preflight, H is the held Emberfall world-theme preflight, TB is Toxic Bloom, VA is Void Approach, and AR is Arctic Relay.

Automated type, unit, build, asset-HTTP, and route-HTTP validation is complete. Full-resolution transparent masters and exact-resolution runtime atlases were visually inspected; creator gameplay-scale acceptance remains available through the deterministic gallery and loadout routes.
