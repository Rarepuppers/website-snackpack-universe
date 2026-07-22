# Production Asset Batch AG — Alien Hive and Infestation

**Status:** Generated, normalized, gallery-bound, and live-theme accepted — 22 July 2026.

Batch AG supplies the modular environment family for alien nests, slime chambers, nurseries, egg rooms, hatcheries, biomass tunnels, spore gardens, feeding pits, queen approaches, corrupted laboratories, and organic ship interiors.

## Contracts

| Asset | Grid | Runtime cell | Retained-master cell | Frames |
| --- | ---: | ---: | ---: | ---: |
| `alien-hive-floor-v1` | 4×4 | 128×128 | 256×256 | 16 |
| `alien-hive-boundary-v1` | 4×2 | 128×128 | 256×256 | 8 |
| `alien-hive-fixtures-v1` | 4×2 | 192×192 | 384×384 | 8 |
| `alien-hive-decals-v1` | 4×2 | 128×128 | 256×256 | 8 |

## Frame maps

- Floors `0–3`: clean chitin, ribbed biomass, sinew lattice, resin armour.
- Floors `4–7`: nest, slime chamber, nursery, egg room.
- Floors `8–11`: hatchery, biomass tunnel, spore garden, feeding pit.
- Floors `12–15`: queen approach, corrupted lab, organic ship, necrotic damage.
- Boundaries: four cardinal sections, outer/inner corners, sphincter gate, organic breach.
- Fixtures: biomass pillar, slime cistern, egg cradle, incubator, spore vent, feeding organ, sentinel carapace, specimen tank.
- Decals: slime, secretion, chitin, veins, spores, footprints, eggshell, necrotic tissue.

Code owns room layout, collision, destructibility, hazard geometry, spawning, animation, glow, interaction, objectives, and timing. Gallery review remains at `?mode=gallery&batch=ag`; deterministic live acceptance uses `?theme=alien-hive&worldseed=0&scenario=density-capacity`.
