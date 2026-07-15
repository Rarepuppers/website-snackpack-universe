# Production Asset Batch A

**Status:** Completed and integrated — 16 July 2026

This batch replaces the arena, obstacle, combat-effect, pickup, and HUD foundation shapes with authored pixel art while preserving `?art=placeholder` as the comparison renderer. Generated source sheets, extracted transparent sheets, and normalized runtime atlases are retained together so later revisions remain reproducible.

## Runtime atlas contracts

| Asset ID | Runtime file | Grid | Cell | Frames |
| --- | --- | ---: | ---: | ---: |
| `arena-floor-v1` | `arena-floor-atlas-v1-64.png` | 3×2 | 64×64 | 6 |
| `arena-boundary-v1` | `arena-boundary-atlas-v1-64.png` | 4×2 | 64×64 | 8 |
| `arena-obstacle-v1` | `arena-obstacle-atlas-v1-96.png` | 4×2 | 96×96 | 8 |
| `combat-effects-v1` | `combat-effect-atlas-v1-64.png` | 5×4 | 64×64 | 20 |
| `pickups-v1` | `pickup-atlas-v1-64.png` | 4×1 | 64×64 | 4 |
| `hud-panels-v1` | `hud-panel-atlas-v1-256x128.png` | 3×2 | 256×128 | 6 |

All pivots are centered. Runtime resizing uses nearest-neighbour sampling. HUD text, values, meters, and labels remain live game objects rather than baked pixels.

## Frame order

- Floor `0–5`: clean base, subtle variants A/B, seam panel, damaged panel, biomass edge.
- Boundary `0–7`: north, south, west, east, inner corner, outer corner, bulkhead, breach.
- Obstacle `0–3`: intact barricade, crate, conduit, biomass; `4–7`: matching damaged states.
- Effects `0–4`: shadow, roll trail, invulnerability shimmer, Marine hit, Marine defeat.
- Effects `5–9`: muzzle, tracer/projectile, impact, critical impact, explosion ring.
- Effects `10–14`: Scuttler spawn/death, Egg pulse/crack/hatch.
- Effects `15–19`: Brain wind-up, lunge streak, recovery particles, death burst, generic alien pulse.
- Pickups `0–3`: XP shimmer A/B, health cell, relic placeholder.
- HUD `0–5`: Marine status, roll/loadout, wave banner, upgrade card, modal, twelve-slot strip.

## Source and extraction

The `*-chroma.png` files are retained generation outputs. Their transparent `*.png` counterparts preserve full-resolution extracted art. `normalize_atlases.py` converts approved sheets into the locked runtime contracts above. Do not load the chroma or full-resolution source sheets at runtime.

## Validation

- Gameplay: `/play/last-bastion/`
- Batch gallery: `/play/last-bastion/?mode=gallery&batch=a`
- Four-weapon pressure: `/play/last-bastion/?stress=4`
- Twelve-weapon capacity: `/play/last-bastion/?stress=12`
- Shape fallback: `/play/last-bastion/?art=placeholder`

The batch is complete when type checking, unit tests, production build, and HTTP smoke verification pass and the creator accepts gameplay-scale readability.
