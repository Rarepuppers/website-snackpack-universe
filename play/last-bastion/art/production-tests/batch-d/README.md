# Production Asset Batch D1

**Status:** Generated, normalized, and integrated — 16 July 2026

Batch D1 replaces the Brood Warden code-art presentation with a reusable production set. The large chroma sources, transparent review masters, fixed runtime atlases, prompt contract, and deterministic Pillow normalizer are retained together.

## Runtime contracts

| Stable ID | Runtime file | Grid | Logical cell | Frames |
| --- | --- | ---: | ---: | ---: |
| `brood-warden-v1` | `brood-warden-spritesheet-v1-128.png` | 4 × 3 | 128 × 128 | 12 |
| `brood-warden-portrait-v1` | `brood-warden-portrait-v1-128.png` | image | 128 × 128 | 1 |
| `brood-warden-effects-v1` | `brood-warden-effect-atlas-v1-64.png` | 5 × 2 | 64 × 64 | 10 |

Body columns are south, north, east, west. Rows are stalk/idle, attack/wind-up, and hurt/enraged/defeat key poses. All assets use centered pivots.

## Effect frame order

0. Acid projectile.
1. Acid-fan warning/launch wedge.
2. Acid impact.
3. Egg-lay pulse.
4. Cleave warning ring.
5. Active ivory cleave arc.
6. Swarm-rush lane arrow.
7. Swarm-rush burst.
8. Enrage pulse.
9. Defeat burst.

## Final prompt set

The built-in image-generation workflow used the approved Siege Crusher, Scuttler, portrait, and Batch B effects as strict style references.

- **Body sheet:** premium hand-authored-looking high-three-quarter pixel art; exact 4 × 3 grid; purple-black segmented chitin, lime acid sacs/eyes, ivory guarding claws, compact egg-layer abdomen; directional columns S/N/E/W and state rows stalk/attack/frenzy; consistent scale and pivot; isolated cells; flat `#0000ff` chroma; no shadows, text, scenery, UI, or baked effects.
- **Portrait:** square close three-quarter Brood Warden portrait with the same purple-black/lime/ivory identity; both claws and brood sacs visible; readable at 48 pixels; approved portrait pixel density and lighting; flat `#0000ff` chroma; no border, panel, text, scenery, or shadow.
- **Effects:** exact 5 × 2 atlas in the documented frame order; lime acid, purple brood energy, ivory claw motion, restrained glow, crisp isolated pixel clusters; flat `#0000ff` chroma; no grid lines, text, UI, floor shadows, or scenery.

## Source-quality and normalization policy

- Generated source dimensions: body `1448 × 1086`, portrait `1254 × 1254`, effects `1774 × 887`.
- These retained masters exceed the logical runtime dimensions by more than the required 4× source floor.
- `*-chroma.png` files preserve generation provenance and are never loaded by the game.
- Large transparent PNGs are review/edit masters; only `*-128.png` and `*-64.png` files enter the manifest.
- Chroma removal used border sampling, soft matte, despill, and validated fully transparent corners.
- `normalize_atlases.py` applies fixed grid crops, a shared nearest-neighbour body scale, equal cell padding, and stable output dimensions.

Rebuild runtime assets with the workspace Python runtime containing Pillow:

```powershell
& <python-with-pillow> normalize_atlases.py
```

## Review

- Encounter: `?scenario=brood-warden&loadout=vertical`
- Complete gallery: `?mode=gallery&batch=d`
