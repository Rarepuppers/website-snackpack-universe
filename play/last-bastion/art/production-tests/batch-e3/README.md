# Tether Bloom Production Asset Batch E3

**Status:** Generated, normalized, and integrated — 17 July 2026

Batch E3 replaces the Tether Bloom behavior-gate placeholder with a reusable production body sheet and dedicated control-effect atlas. Large chroma sources, transparent review masters, deterministic normalization, and fixed runtime atlases are retained together.

## Runtime contracts

| Stable ID | Runtime file | Grid | Logical cell | Frames |
| --- | --- | ---: | ---: | ---: |
| `tether-bloom-v1` | `tether-bloom-spritesheet-v1-96.png` | 4 × 4 | 96 × 96 | 16 |
| `tether-bloom-effects-v1` | `tether-bloom-effect-atlas-v1-64.png` | 4 × 2 | 64 × 64 | 8 |

Body columns are four animation phases, not facings. Rows are rooted idle, acquisition wind-up, active channel, and exhausted recovery.

## Effect frame order

0. Acquisition pulse.
1. Target endpoint.
2. Latch knot.
3. Taut-line travelling accent.
4. Evasive sever.
5. Damage sever.
6. Recovery wilt.
7. Defeat burst.

## Final prompt set

The built-in image-generation workflow used the approved Slime Spitter, Quillback, Spinewheel, and Spinewheel-effect sources as strict style references.

- **Body sheet:** exact 4 × 4 premium high-three-quarter pixel-art sheet; original stationary alien controller with a low radial charcoal root crown, burgundy and royal-violet fleshy petals, lime sensory sacs, magenta psychic core, and ivory hook filaments; columns are temporal phases; rows are idle, acquisition, channel, and recovery; stable scale/pivot; flat pure-blue chroma; no detached tether, radius, player, shadow, text, UI, scenery, or overlap.
- **Effects:** exact 4 × 2 atlas in the documented order; lime acquisition language, violet-magenta tether language, distinct cyan evasive and orange damage sever cues, restrained recovery fragments, and a non-gory defeat burst; no long beam, creature body, player, text, UI, scenery, or overlap.

## Source-quality and normalization policy

- Retained generated chroma masters and large transparent review/edit masters exceed the 4× logical-size floor.
- `*-chroma.png` files preserve generation provenance and are never loaded by the game.
- Only the `*-96.png` and `*-64.png` outputs enter the manifest.
- Chroma removal used border sampling, soft matte, edge contraction, despill, and transparent-corner validation.
- `normalize_atlases.py` applies fixed grid crops, shared nearest-neighbour body scale, equal padding, and stable dimensions.
- Runtime tether line, target point, range, line-of-sight, cover interruption, pull force, and break conditions remain code-driven; art reinforces the authoritative behavior.

## Review

- Encounter: `?scenario=tether-bloom&loadout=vertical`
- Complete gallery: `?mode=gallery&batch=e3`
