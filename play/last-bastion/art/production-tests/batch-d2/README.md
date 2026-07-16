# Ripper Production Asset Batch D2

**Status:** Generated, normalized, and integrated — 16 July 2026

Batch D2 replaces the Ripper prototype shape with a reusable production set. The large chroma sources, transparent review masters, fixed runtime atlases, prompt contract, and deterministic Pillow normalizer are retained together.

## Runtime contracts

| Stable ID | Runtime file | Grid | Logical cell | Frames |
| --- | --- | ---: | ---: | ---: |
| `ripper-v1` | `ripper-spritesheet-v1-96.png` | 4 × 4 | 96 × 96 | 16 |
| `ripper-effects-v1` | `ripper-effect-atlas-v1-64.png` | 4 × 2 | 64 × 64 | 8 |

Body columns are south, north, east, west. Rows are pursuit, paired-claw wind-up, active sweep, and overextended recovery. All assets use centered pivots.

## Effect frame order

0. Coral cone warning.
1. Paired ivory claw wind-up glint.
2. Twin-claw active sweep arcs, authored facing east.
3. Melee impact.
4. Exposed-thorax recovery pulse.
5. Burrow/spawn dust.
6. Hit burst.
7. Defeat burst.

## Final prompt set

The built-in image-generation workflow used the approved Carapace Scuttler, Brood Warden, and Production Batch B effects as strict style references.

- **Body sheet:** premium hand-authored-looking high-three-quarter pixel art; exact 4 × 4 grid; lean predatory mantis-crab silhouette; charcoal segmented chitin, hot-coral seams, amber eyes, and two long serrated ivory scythe claws; directional columns S/N/E/W; rows pursuit/wind-up/active sweep/exposed recovery; consistent scale and pivot; isolated cells; flat `#0000ff` chroma; no shadows, text, scenery, UI, or baked effects.
- **Effects:** exact 4 × 2 atlas in the documented frame order; coral warning geometry, ivory claw motion, amber impacts, cracked recovery vulnerability, restrained dust and debris; crisp isolated pixel clusters; flat `#0000ff` chroma; no grid lines, text, UI, floor shadows, or scenery.

## Source-quality and normalization policy

- Generated source dimensions: body `1448 × 1086`, effects `1774 × 887`.
- These retained masters exceed the logical runtime dimensions by more than the required 4× source floor.
- `*-chroma.png` files preserve generation provenance and are never loaded by the game.
- Large transparent PNGs are review/edit masters; only `*-96.png` and `*-64.png` files enter the manifest.
- Chroma removal used border sampling, soft matte, despill, and validated fully transparent corners.
- `normalize_atlases.py` applies fixed grid crops, a shared nearest-neighbour body scale, equal cell padding, and stable output dimensions.

Rebuild runtime assets with the workspace Python runtime containing Pillow:

```powershell
& <python-with-pillow> normalize_atlases.py
```

## Review

- Encounter: `?scenario=ripper&loadout=vertical`
- Complete gallery: `?mode=gallery&batch=d2`
