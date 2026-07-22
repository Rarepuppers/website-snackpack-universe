# Last Bastion environment prompt library

Use built-in image generation. Project-bound transparent sheets use flat `#FF00FF` chroma, local chroma removal, deterministic normalization, retained sources, and runtime derivatives. Generate one distinct asset family per call.

## Shared visual direction

- Premium chunky hand-authored pixel art; deliberate clusters, not soft painting or photorealism.
- Orthographic 90-degree top-down floors and decals. Fixtures use the established top-down/three-quarter gameplay convention with a clear base footprint.
- Dark military science fiction: Doom brutality, StarCraft readability, Last Bastion navy/gunmetal foundation.
- Floors remain lower contrast than actors, pickups, projectiles, and telegraphs.
- No text, labels, logos, characters, weapons, UI, watermark, baked warning circles, directional arrows, cast shadows across cells, or objects crossing atlas boundaries.
- Keep geometry and lighting neutral. Collision, interaction, damage, glow, animation, and adjacency remain code-owned.

## Floor atlas template

```text
Use case: stylized-concept
Asset type: 4×4 production modular floor atlas for a top-down bullet-hell game at Full HD and 4K
Primary request: sixteen equal edge-to-edge opaque tiles for <KIT>, in exact row-major order: <FRAME MAP>
Composition: mathematically regular 4×4 grid; exactly 90-degree overhead; every cell fills its square; edge-compatible materials; no margin or gutter
Style: premium chunky pixel art, restrained detail, coherent Last Bastion palette
Constraints: no raised props, walls, perspective, text, characters, UI, warning geometry, baked directional light, or high-frequency noise
```

## Boundary atlas template

```text
Use case: stylized-concept
Asset type: 4×2 transparent modular boundary atlas
Primary request: north, south, west, east, inner corner, outer corner, gate, breach for <KIT>
Backdrop: perfectly flat solid #FF00FF; no variation; do not use #FF00FF in subjects
Composition: equal square cells, compatible endpoints and thickness, isolated centred pieces, generous padding
Constraints: no floor beneath pieces, cast shadows, text, characters, UI, perspective, or glow spill
```

## Fixture atlas template

```text
Use case: stylized-concept
Asset type: 4×2 transparent environment-fixture atlas
Primary request: eight collision-readable fixtures for <ROOM FAMILY>, exact row-major frame map <FRAME MAP>
Backdrop: perfectly flat solid #FF00FF; no variation; do not use #FF00FF in subjects
Composition: matching apparent scale, clear base footprint, isolated object per cell, generous padding
Constraints: inactive presentation only; no floor, cast shadow, text, characters, UI, particles, or interaction glow
```

## Decal atlas template

```text
Use case: stylized-concept
Asset type: 4×2 transparent low-contrast under-floor decal atlas
Primary request: eight sparse identifiers for <KIT>, exact row-major frame map <FRAME MAP>
Backdrop: perfectly flat solid #FF00FF; no variation; do not use #FF00FF in subjects
Composition: exact overhead, each motif covers less than half its cell
Constraints: no floor, text, characters, warning lanes/rings, bright saturation, large solid masses, or hazards that could be mistaken for live damage
```

## Batch sequence prompt notes

- **AD Science Wing:** sterile lab panels, cryo frost, surgery ceramic, bio traces, reactor shielding, energy conduits, control cabling, teleporter machinery.
- **AE Logistics:** heavy Bastion deck plate, loading rails, armoury rubber mat, shop/forge inserts, medical-clean panels; fixtures include crates, racks, quartermaster counter, fabricator, medic station, defence console.
- **AF Machine Foundry:** cast iron, assembly tracks, ore grates, furnace shielding, coolant channels; fixtures include conveyor, smelter, ore hopper, robot arm, compactor, generator.
- **AG Alien Hive:** organic membranes over a readable hard substrate, slime, egg anchors, nursery veins, hatchery vents; avoid full-floor wet gloss and telegraph-like circles.
- **AH Surface:** macro patches rather than square panels; cracked soil, trail, roots, cave stone, alien mineral, ash, ice, toxic mud; edge masks must blend terrain types.
- **AI Starship/Void:** ship deck, hangar plate, airlock, bridge, gate dais, transparent-safe void vistas beneath a clearly bounded walkable surface.
- **AJ Containment:** reinforced floor, cell tracks, quarantine seals, dungeon stone/alloy hybrid, cult/demonic corruption kept sparse enough for warnings.
- **AK Arenas:** generate only after encounter geometry is specified; art follows safe lanes, cover anchors, entrances, phase objects, and camera bounds.
