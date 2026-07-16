# Production Asset Batch B

Batch B replaces the vertical-slice combat placeholders with the approved Last Bastion pixel-art language. Source chroma masters, transparent extractions, normalized runtime assets, and the repeatable normalizer are retained together.

## Runtime contracts

| Stable ID | Runtime file | Grid | Logical cell | Frames |
| --- | --- | ---: | ---: | ---: |
| `scattergun-v1` | `scattergun-gameplay-v1-64.png` | image | 64 × 32 | 1 |
| `arc-carbine-v1` | `arc-carbine-gameplay-v1-64.png` | image | 64 × 32 | 1 |
| `slime-spitter-v1` | `slime-spitter-spritesheet-v1-64.png` | 4 × 3 | 64 × 64 | 12 |
| `carapace-scuttler-v1` | `carapace-scuttler-spritesheet-v1-96.png` | 4 × 4 | 96 × 96 | 16 |
| `siege-crusher-v1` | `siege-crusher-spritesheet-v1-128.png` | 4 × 3 | 128 × 128 | 12 |
| `batch-b-effects-v1` | `batch-b-effect-atlas-v1-64.png` | 5 × 4 | 64 × 64 | 20 |
| `siege-crusher-portrait-v1` | `siege-crusher-portrait-v1-128.png` | image | 128 × 128 | 1 |

Directional columns are south, north, east, west. Spitter rows are positioning, wind-up, recovery. Carapace rows are pursuit, wind-up, charge, recovery. Crusher rows are stalk, charge, sweep. Weapon sprites point east and use a `(0.25, 0.5)` origin; sheets and portrait use centered pivots.

## Effect frame order

- 0–4: Scattergun muzzle, pellet, fan impact, knockback burst, recoil/shell sparks.
- 5–9: Arc muzzle, arc bolt, chain connector, conductive impact, overload burst.
- 10–14: slime glob, trail, target ring, fresh puddle, fading puddle.
- 15–19: Crusher charge dust, claw sweep, debris shockwave, armour impact, defeat burst.

## Generation and normalization

The built-in image workflow used the approved Marine, Service Rifle, Scuttler, arena, and earlier enemy art as strict style references. Prompts locked the high-three-quarter camera, limited palette, readable silhouettes, exact grids, state order, text-free output, and flat chroma background. The weapon background received a precise background-only correction before extraction. Chroma was removed locally with soft matte and despill.

`normalize_atlases.py` crops the source grid, removes neighboring-cell fragments from creature sheets, applies a shared nearest-neighbour scale across each creature, and emits fixed Phaser assets. Re-run it after replacing an approved transparent master:

```powershell
& <python-with-pillow> normalize_atlases.py
```

The `*-chroma.png` files are retained provenance and must never be loaded by the game. The larger transparent files are review masters; only the fixed-size runtime files belong in the manifest.

## Review

- Gameplay: `?loadout=vertical`
- Spitter lab: `?scenario=slime-spitter&loadout=vertical`
- Carapace lab: `?scenario=carapace-elite&loadout=vertical`
- Crusher lab: `?scenario=siege-crusher&loadout=vertical`
- Complete Batch B gallery: `?mode=gallery&batch=b`

Automated acceptance on 16 July 2026: TypeScript passed, 63 unit tests passed across ten files, the production build emitted all 19 manifest assets, and 11 HTTP review routes passed.
