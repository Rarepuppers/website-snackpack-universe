# Weapon identity tiles — Batch 68A

Eight player-visible weapons that previously borrowed generic Batch I frames now have stable dedicated tiles. The generated 1254 px sources and cleaned 512 px masters are retained; `normalize_weapon_batch_68a.py` deterministically produces the 128 px PNG/WebP runtime atlas.

## Stable frame contract

| Frame | Weapon ID | Readable identity |
| ---: | --- | --- |
| 0 | `railspike` | Long electromagnetic spear cannon |
| 1 | `seeker-swarm` | Clustered micro-missile rack |
| 2 | `cryo-lance` | Forked frost projector |
| 3 | `tesla-coil` | Copper coil and arc cage |
| 4 | `flamethrower` | Heat-shrouded flame projector |
| 5 | `sawblade` | Dominant powered circular blade |
| 6 | `combat-knife` | Short clipped-point fighting knife |
| 7 | `machete` | Long forward-weighted chopping blade |

## Generation provenance

Mode: built-in ImageGen, one generation per distinct asset, using `batch-i/codex-weapon-tile-atlas-v1-128.png` as the visual reference.

Shared prompt prefix:

> Create one square Last Bastion inventory weapon tile matching the attached atlas exactly in visual language: chunky hand-painted sci-fi game icon, dark charcoal recessed square panel, clipped industrial metal corner brackets, tiny cyan lower-center indicator, crisp high-contrast silhouette, warm worn metal with selective emissive accents, no text, no numbers, no letters, no logo, no character, no hands.

The asset-specific suffixes requested the identity in the table above, a three-quarter or diagonal upper-right orientation, centered safe padding, 128 px readability, and one square tile only. Source filenames preserve the exact output associated with each weapon ID.

## Regeneration

Run with the bundled Pillow-capable Python runtime:

```powershell
& 'C:\Users\Mark\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' .\art\production-tests\weapon-batch-68a\normalize_weapon_batch_68a.py
```

Event Horizon is intentionally absent: it already owns `event-horizon-tile-v1`; Batch 68A also fixes the UI mapper so that existing dedicated tile is actually selected.
