# Weapon identity tiles — Batch 68B

Eight additional player-facing weapons receive stable dedicated tiles. Generated 1254 px sources and cleaned 512 px masters are retained; `normalize_weapon_batch_68b.py` deterministically produces the 128 px PNG/WebP runtime atlas.

## Stable frame contract

| Frame | Weapon ID | Final prompt identity |
| ---: | --- | --- |
| 0 | `fire-axe` | Practical single-headed rescue axe; one heated blade, opposite pick, straight haft; explicitly not a fantasy double-axe |
| 1 | `shock-baton` | Short insulated electro-baton with forked arcing prongs |
| 2 | `breaching-maul` | Massive two-handed piston-assisted rectangular ram hammer |
| 3 | `plasma-saber` | Broad magenta-white contained energy blade in a partial metal cage |
| 4 | `corrosive-lobber` | Short heavy acid launcher with bulbous canister and pressure gauge |
| 5 | `scourge-repeater` | Lean toxic repeater with twin blight reservoirs and perforated jacket |
| 6 | `bile-lance` | Long pressurized solvent projector with tank, hose, and valve wheel |
| 7 | `rime-cleaver` | Broad supercooled chopping blade with frost crystals and cooling veins |

## Generation provenance

Mode: built-in ImageGen, one generation per distinct asset, using Batch 68A as the style reference. The rejected first Fire Axe generation was not copied into the project because its double-headed fantasy silhouette contradicted the weapon brief.

Shared prompt:

> Use case: stylized-concept. Asset type: Last Bastion inventory weapon tile. Use the attached atlas only as the style and framing reference. Create one square tile with the same chunky hand-painted sci-fi game-icon language: dark charcoal recessed panel, clipped worn-metal corner brackets, tiny cyan lower-center indicator, crisp high-contrast silhouette, warm aged metal plus selective elemental glow. No text, numbers, letters, logo, watermark, character, or hands.

Each final prompt appended the table’s weapon-specific identity, an upper-right three-quarter or diagonal orientation, centered safe padding, 128 px readability, and a one-tile-only constraint.

## Regeneration

```powershell
& 'C:\Users\Mark\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' .\art\production-tests\weapon-batch-68b\normalize_weapon_batch_68b.py
```
