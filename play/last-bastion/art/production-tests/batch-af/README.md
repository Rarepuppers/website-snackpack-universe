# Production Asset Batch AF — Machine Foundry

**Status:** Generated, normalized, gallery-bound, and live-theme accepted — 22 July 2026.

Batch AF supplies the modular environment family for foundries, mining and ore processing, factories, cyborg assembly lines, generator halls, coolant works, and scrap processing.

## Contracts

| Asset | Grid | Runtime cell | Retained-master cell | Frames |
| --- | ---: | ---: | ---: | ---: |
| `machine-foundry-floor-v1` | 4×4 | 128×128 | 256×256 | 16 |
| `machine-foundry-boundary-v1` | 4×2 | 128×128 | 256×256 | 8 |
| `machine-foundry-fixtures-v1` | 4×2 | 192×192 | 384×384 | 8 |
| `machine-foundry-decals-v1` | 4×2 | 128×128 | 256×256 | 8 |

## Frame maps

- Floors `0–3`: clean plate, alternate plate, factory grid, service seam.
- Floors `4–7`: factory, cyborg assembly, ore grate, foundry heat shield.
- Floors `8–11`: smelter, coolant channel, generator conductor, conveyor junction.
- Floors `12–15`: cracked plate, slag scorch, oil/coolant stains, scrap drain.
- Boundaries: four cardinal sections, outer/inner corners, blast gate, molten breach.
- Fixtures: conveyor, ore crusher, smelter, assembly arm, coolant pump, generator, compactor, maintenance station.
- Decals: ore, shavings, oil, coolant, weld scorch, slag, cables, conveyor scuffs.

Code owns layout, collision, destructibility, conveyor motion, machinery animation, hazards, glow, interaction, objectives, and timing. Gallery review remains at `?mode=gallery&batch=af`; deterministic live acceptance uses `?theme=machine-foundry&worldseed=0&scenario=density-capacity`.
