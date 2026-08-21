# Weapon identity tiles — Batch 68C

The final seven player-facing weapons that borrowed generic Batch I frames receive stable dedicated tiles. The atlas intentionally contains seven frames: no filler identity was created merely to fill an eighth slot. Generated 1254 px sources and cleaned 512 px masters are retained.

## Stable frame contract

| Frame | Weapon ID | Final prompt identity |
| ---: | --- | --- |
| 0 | `hoarfrost-scatter` | Wide multi-port cryogenic scattergun |
| 1 | `glacier-ward` | Ice crystal suspended in a three-arm autonomous gyroscope |
| 2 | `tether-harpoon` | Barbed launcher with prominent cable spool and winch |
| 3 | `sentry-stake` | Folded twin-barrel turret on a ground spike |
| 4 | `emberlance` | Long incendiary launcher with ember chamber and launch rail |
| 5 | `storm-coil-beam` | Split-emitter beam projector with exposed induction coils |
| 6 | `blight-scythe` | Hooked toxic scythe with solvent channel and reservoir |

## Generation provenance

Mode: built-in ImageGen, one generation per distinct asset, using Batch 68B as the style reference.

Shared prompt:

> Use case: stylized-concept. Asset type: Last Bastion inventory weapon tile. Use the attached atlas only as the style and framing reference. Create one square tile with the same chunky hand-painted sci-fi game-icon language: dark charcoal recessed panel, clipped worn-metal corner brackets, tiny cyan lower-center indicator, crisp high-contrast silhouette, warm aged metal plus selective elemental glow. No text, numbers, letters, logo, watermark, character, or hands.

Each final prompt appended the table’s weapon-specific mechanical identity, explicit distinctions from visually adjacent weapons, an upper-right three-quarter or diagonal orientation, centered safe padding, 128 px readability, and a one-tile-only constraint.

## Regeneration

```powershell
& 'C:\Users\Mark\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' .\art\production-tests\weapon-batch-68c\normalize_weapon_batch_68c.py
```
