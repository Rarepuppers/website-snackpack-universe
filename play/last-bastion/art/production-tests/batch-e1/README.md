# Quillback Production Asset Batch E1

**Status:** Generated, normalized, and integrated — 16 July 2026

Batch E1 replaces the Quillback behavior-gate shapes with a reusable production body and projectile/effect set. Large chroma sources, transparent review masters, deterministic normalization, and fixed runtime atlases are retained together.

## Runtime contracts

| Stable ID | Runtime file | Grid | Logical cell | Frames |
| --- | --- | ---: | ---: | ---: |
| `quillback-v1` | `quillback-spritesheet-v1-96.png` | 4 × 3 | 96 × 96 | 12 |
| `quillback-effects-v1` | `quillback-effect-atlas-v1-64.png` | 4 × 2 | 64 × 64 | 8 |

Body columns are south, north, east, west. Rows are positioning/retreat, charged wind-up, and exposed recovery. All assets use centered pivots.

## Effect frame order

0. East-authored individual ivory spike projectile.
1. Charged launch cluster.
2. Three-spike fan launch accent.
3. Five-spike fan launch accent.
4. Hard-cover impact.
5. Flesh impact.
6. Quillback hit burst.
7. Quillback defeat burst.

## Final prompt set

The built-in image-generation workflow used the approved Slime Spitter, Ripper, and Batch B/D2 effect atlases as strict style references.

- **Body sheet:** exact 4 × 3 premium high-three-quarter pixel-art sheet; original squat porcupine-crustacean ranged alien; charcoal and deep-burgundy segmented armour, long warm-ivory launch quills, amber eyes and charge organs; columns S/N/E/W; rows positioning/retreat, bright braced wind-up, and lowered open-rack recovery; consistent scale and pivot; flat `#0000ff` chroma; no shadows, detached projectiles, effects, text, UI, scenery, or overlap.
- **Effects:** exact 4 × 2 atlas in the documented order; separate east-authored ivory spike, charged launch cluster, restrained three/five-fan accents, cover/flesh impacts, hit and defeat bursts; matching charcoal/burgundy/ivory/amber identity; flat `#0000ff` chroma; no creatures, blood, shadows, text, UI, scenery, or overlap.

## Source-quality and normalization policy

- Generated source dimensions: body `1448 × 1086`, effects `1774 × 887`.
- Retained masters exceed the 4× logical-size floor.
- `*-chroma.png` files preserve generation provenance and are never loaded by the game.
- Large transparent PNGs are review/edit masters; only `*-96.png` and `*-64.png` enter the manifest.
- Chroma removal used border sampling, soft matte, despill, and transparent-corner validation.
- `normalize_atlases.py` applies fixed grid crops, shared nearest-neighbour body scale, equal padding, and stable dimensions.
- Runtime fan paths and warning lines remain code-driven; frames 2–3 are launch accents only and cannot redefine collision geometry.

## Review

- Encounter: `?scenario=quillback&loadout=vertical`
- Complete gallery: `?mode=gallery&batch=e1`
