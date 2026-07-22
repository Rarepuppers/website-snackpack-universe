# Production Asset Batch AH — Surface and Planetary Frontiers

**Status:** Generated, normalized, gallery-bound, and live-theme accepted - 22 July 2026.

Batch AH supplies 16 named terrain identities catalogued across four atlas rows. The renderer selects exactly one terrain frame per room, applies deterministic rotation/mirroring to reduce repetition, and never mixes unrelated biomes in one arena.

## Contracts

| Asset | Grid | Runtime cell | Retained-master cell | Frames |
| --- | ---: | ---: | ---: | ---: |
| `surface-frontier-floor-v1` | 4×4 | 128×128 | 256×256 | 16 |
| `surface-frontier-boundary-v1` | 4×2 | 128×128 | 256×256 | 8 |
| `surface-frontier-fixtures-v1` | 4×2 | 192×192 | 384×384 | 8 |
| `surface-frontier-decals-v1` | 4×2 | 128×128 | 256×256 | 8 |

## Frame maps

- Floors `0–3`, Earth: cracked earth, dirt trail, forest loam, cave stone.
- Floors `4–7`, hostile planet: basalt, ash, frozen ground, toxic marsh.
- Floors `8–11`, war-torn: settlement rubble, canyon, meteor soil, demonic ground.
- Floors `12–15`, additional: grassland, battlefield mud, crystal badlands, blast zone.
- Boundaries: four cardinal ridges, outer/inner corners, bunker entrance, meteor breach.
- Fixtures: dead tree, cave boulder, ruined shelter, alien crystal, frozen boulder, marsh fungus, meteor, obelisk.
- Decals: vehicle ruts, leaves, gravel, ash, snow, marsh residue, rubble, impact scorch.

Code owns terrain selection, layout, collision, destructibility, hazards, weather, interaction, objectives, and timing. Review at `?mode=gallery&batch=ah` or pin a live room with `?theme=surface-frontier&biome=<terrain-id>`. A larger macro-texture/noise pass remains recommended for extreme 3x zoom and future 4K close-camera presentation, especially on frozen ground.
