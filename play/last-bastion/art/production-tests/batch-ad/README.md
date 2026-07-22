# Production Asset Batch AD — Bastion Science Wing

**Status:** Generated and normalized — 22 July 2026; gallery and live-theme acceptance pending.

Batch AD establishes the Full HD/4K modular environment contract and covers laboratory, testing, cryostasis, surgery, bio-upgrade, reactor, energy, control, camera, and teleporter room identities without baking room logic into art.

## Contracts

| Asset | Grid | Runtime cell | Retained-master cell | Frames |
| --- | ---: | ---: | ---: | ---: |
| `science-wing-floor-v1` | 4×4 | 128×128 | 256×256 | 16 |
| `science-wing-boundary-v1` | 4×2 | 128×128 | 256×256 | 8 |
| `science-wing-fixtures-v1` | 4×2 | 192×192 | 384×384 | 8 |
| `science-wing-decals-v1` | 4×2 | 128×128 | 256×256 | 8 |

The runtime derivatives are copied to `game-assets/`. Untouched built-in generation outputs, chroma sources, clean-alpha masters, deterministic normalizer, exact prompts, and contact sheet remain here.

## Frame maps

- Floors `0–3`: clean, alternate, anti-slip grid, service seams.
- Floors `4–7`: testing, cryostasis, surgery/testing, bio upgrades.
- Floors `8–11`: reactor, energy, control, teleporter.
- Floors `12–15`: cracked, emergency trim, bio-contamination edge, drain/access.
- Boundaries `0–7`: north, south, west, east, inner corner, outer corner, gate, breach.
- Fixtures `0–7`: lab bench, cryopod, reactor conduit, control console, specimen tank, surgery station, server/camera stack, inactive teleporter.
- Decals `0–7`: tracks, frost, biomass, cable, scorch, glass, wash/drain, broken interface trace.

## Ownership

Art owns appearance only. Code owns room selection, adjacency, collision, destructibility, interaction, health, hazards, warning geometry, animation, lighting/glow, objective state, and gameplay timing.

## Acceptance

- Exact dimensions and RGBA transparency where required.
- No chroma fringe or clipped fixture silhouette.
- 3×3 seam mosaic and full-arena repetition review.
- Grayscale actor, pickup, projectile, and telegraph contrast.
- Native 960×540, Full HD, and 4K gallery/live review.
- Maximum-density performance and offline build verification.
