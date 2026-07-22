# Production Asset Batch AE — Bastion Logistics and Defence

**Status:** Generated, normalized, gallery-bound, and live-theme accepted — 22 July 2026.

Batch AE supplies the modular material and fixture family for supply depots, armouries, weapon racks, quartermaster shops, high-tech blacksmith/armour fabrication, medic outposts, tower-defence command rooms, loading bays, and bunkers.

## Contracts

| Asset | Grid | Runtime cell | Retained-master cell | Frames |
| --- | ---: | ---: | ---: | ---: |
| `bastion-logistics-floor-v1` | 4×4 | 128×128 | 256×256 | 16 |
| `bastion-logistics-boundary-v1` | 4×2 | 128×128 | 256×256 | 8 |
| `bastion-logistics-fixtures-v1` | 4×2 | 192×192 | 384×384 | 8 |
| `bastion-logistics-decals-v1` | 4×2 | 128×128 | 256×256 | 8 |

## Frame maps

- Floors `0–3`: heavy clean, alternate, cargo grid, service plate.
- Floors `4–7`: supply/loading, armoury, shop, forge/fabrication.
- Floors `8–11`: medic, defence command, loading rails, bunker.
- Floors `12–15`: cracked, amber edge, oil/scuffs, drain.
- Boundaries: north, south, west, east, inner corner, outer corner, cargo gate, breach.
- Fixtures: supplies, weapon rack, shop counter, forge, medic station, defence console, cargo loader, ammunition cabinet.
- Decals: trolley tracks, cargo scraps, casings, oil/boots, medic wash, weld scorch, command cable, bunker fragments.

Code owns room layout, collision, cover, destructibility, inventory, shop state, healing, interaction, objectives, hazards, lighting, animation, and timing. Gallery review remains available at `?mode=gallery&batch=ae`; deterministic live acceptance uses `?theme=bastion-logistics&worldseed=0&scenario=density-capacity`.
