# Spinewheel Production Asset Batch E2

**Status:** Generated, normalized, and integrated — 17 July 2026

Batch E2 replaces the Spinewheel behavior-gate shape with a reusable production body, rotation-neutral shell animation, and dedicated effect set. Large chroma sources, transparent review masters, deterministic normalization, and fixed runtime atlases are retained together.

## Runtime contracts

| Stable ID | Runtime file | Grid | Logical cell | Frames |
| --- | --- | ---: | ---: | ---: |
| `spinewheel-v1` | `spinewheel-spritesheet-v1-96.png` | 4 × 3 | 96 × 96 | 12 |
| `spinewheel-shell-v1` | `spinewheel-shell-spin-v1-96.png` | 4 × 1 | 96 × 96 | 4 |
| `spinewheel-effects-v1` | `spinewheel-effect-atlas-v1-64.png` | 4 × 2 | 64 × 64 | 8 |

Body columns are south, north, east, west. Rows are positioning, heading-lock wind-up, and exposed recovery. The shell frames are successive rotation phases with a centered pivot and stable circular footprint.

## Effect frame order

0. Curl-in accent.
1. Rolling trail segment.
2. Hard-wall rebound spark.
3. Destructible-cover rebound chip.
4. Marine impact burst.
5. Speed-loss pulse.
6. Recovery break-open accent.
7. Defeat burst.

## Final prompt set

The built-in image-generation workflow used the approved Quillback, Ripper, and Quillback-effect sources as strict style references.

- **Body sheet:** exact 4 × 3 premium high-three-quarter pixel-art sheet; original low radial armoured trilobite/urchin alien; charcoal segmented carapace, burgundy joints/core, ivory hooked rim spines, amber eyes and heat seams; columns S/N/E/W; rows positioning, compressed heading-lock wind-up, and split-shell recovery; stable scale/pivot; flat blue chroma; no shadow, rolling blur, trail, telegraph, effects, text, UI, scenery, or overlap.
- **Shell strip:** exact 4 × 1 strip preserving the body identity; four closed rotation phases with equal diameter and centered pivot; no face, legs, core, blur, trail, shadow, text, UI, scenery, or overlap.
- **Effects:** exact 4 × 2 atlas in the documented order; charcoal/burgundy/ivory/amber identity; no creature bodies, gore, shadows, text, UI, scenery, or overlap.

## Source-quality and normalization policy

- Retained generated chroma masters and large transparent review/edit masters exceed the 4× logical-size floor.
- `*-chroma.png` files preserve generation provenance and are never loaded by the game.
- Only the `*-96.png` and `*-64.png` outputs enter the manifest.
- Chroma removal used border sampling, soft matte, despill, and transparent-corner validation.
- `normalize_atlases.py` applies fixed grid crops, shared nearest-neighbour body/shell scale, equal padding, and stable dimensions.
- Runtime heading, collision reflection, movement, and rebound count remain code-driven; art only reinforces the authoritative behavior.

## Review

- Encounter: `?scenario=spinewheel&loadout=vertical`
- Complete gallery: `?mode=gallery&batch=e2`
