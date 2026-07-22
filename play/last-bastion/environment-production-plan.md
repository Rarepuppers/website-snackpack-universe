# Last Bastion environment production plan

**Target:** future Steam release at 1920×1080 and 3840×2160 while preserving the crisp 960×540 simulation canvas, combat readability, deterministic layouts, and offline operation.

## Audit conclusion

The current whole-physical-pixel display scaler already presents the 960×540 canvas at exact 2× Full HD and 4× 4K. Existing pixel art therefore stays crisp; the problem is not simple blur. The visible weaknesses at desktop scale are repeated tiles, limited room identity, inconsistent early silhouettes, and insufficient retained detail for later camera or UI changes.

| Priority | Existing art | Decision |
| --- | --- | --- |
| Replace | Batch A generic arena floor/boundary/obstacle presentation | Rebuild as modular 128 px runtime / 256 px retained environment kits with more variants. Preserve collision contracts until layouts are redesigned. |
| Replace | Batch H Emberfall, Toxic Bloom, Void Approach, and Arctic Relay six-tile theme sets | Their 64 px runtime tiles and six-frame palette swaps are useful prototypes, but too repetitive for large desktop arenas. Replace theme-by-theme with the new kit standard. |
| Upgrade when touched | Early 64 px combat effects, pickups, action/weapon tiles, and small world-event motifs | Do not mechanically upscale. Re-author at 128 px runtime with 256–512 px retained masters when their family enters production review. |
| Review, not automatic replacement | Early Batch B–F enemy/weapon sheets | Replace only when gameplay-scale mixed-wave review finds an unclear silhouette, inconsistent pivot, baked telegraph, or visibly weaker animation. Pixel count alone is not a failure. |
| Retain | Recent 128/192 px enemy, machine, mini-boss, terrain, shop, and UI families with large sources | These are already suitable for exact 2×/4× presentation. Fix only demonstrated seams, pivots, contrast, or animation problems. |

Nearest-neighbour enlargement is not a quality upgrade. A weak 64 px source must be re-authored or regenerated; a good 64 px source can remain until its presentation actually fails.

## Modular environment contract

Each major environment kit uses the same four-family baseline:

- **Floor:** 4×4 atlas, 16 opaque tiles, 128 px runtime cells, 256 px retained-master cells. Eight neutral repeatable tiles, four room identifiers, and four rare damage/maintenance variants.
- **Boundary:** 4×2 atlas, eight transparent pieces, 128 px runtime cells, 256 px retained-master cells. North, south, west, east, inner corner, outer corner, gate, breach.
- **Fixtures:** 4×2 atlas, eight transparent props, 192 px runtime cells, 384 px retained-master cells. Collision and interaction footprints remain code-owned.
- **Decals:** 4×2 atlas, eight transparent low-contrast underlays, 128 px runtime cells, 256 px retained-master cells.
- **Optional room family:** door states, animated machinery, hazard overlays, vista/backdrop, or boss-arena centrepiece only when gameplay requires it.

Art never owns collision, damage, cover, room adjacency, objective state, hazard radius, warning geometry, glow timing, or interactability. Avoid baked text, labels, directional arrows, bright warning rings, and lighting that could be mistaken for a combat telegraph.

## Room and level families

Rooms share a kit wherever their construction material is the same. Identity comes from floor variants, fixtures, decals, lighting tint, encounters, and audio—not a separate incompatible tileset for every room name.

### 1. Bastion Science Wing — Batch AD accepted

Science laboratory, lab testing, cryostasis, surgery/alien testing, bio upgrades, chimera experiment, reactor, energy, control/camera, teleporter, and sterile medical research rooms.

Generated, normalized, gallery-bound, and live-theme accepted at native, mixed-density, Full HD 2×, and 4K 4× presentation.

### 2. Bastion Logistics and Defence — Batch AE accepted

Army supply depot, supply room, armoury, weapon racks, shop rooms, high-tech blacksmith, medic outpost, tower-defence command room, barracks, briefing room, loading bay, and emergency bunker.

Generated, normalized, gallery-bound, and live-theme accepted at native, density-capacity, Full HD 2×, and 4K 3× presentation.

### 3. Machine Foundry — Batch AF accepted

Factory, cyborg assembly line, foundry, mining/ore processing, smelter, coolant works, generator hall, conveyor junction, robotics maintenance, scrap compactor, and machine command floor.

Generated, normalized, gallery-bound, and live-theme accepted at native, density-capacity, Full HD 2×, and 4K 3× presentation.

### 4. Alien Hive and Infestation — Batch AG accepted

Alien nest, slime chamber, nursery, egg room, hatchery, biomass tunnel, spore garden, feeding pit, queen approach, corrupted laboratory, and organic ship interior.

Generated, normalized, gallery-bound, and live-theme accepted at native, density-capacity, Full HD 2×, and 4K 3× presentation.

### 5. Surface and Planetary Frontiers - Batch AH accepted

Cracked earth, earth trail, forest, caves, alien planet, ash waste, frozen ground, toxic marsh, ruined settlement, canyon, meteor scar, and demonic ground. Natural kits use irregular edge masks and larger macro-variation so they do not read as square indoor panels.

Generated, normalized, gallery-bound, and live-theme accepted. Each room deterministically selects one of 16 named terrain frames; rotation/mirroring reduces repeated motifs without mixing terrain identities. Future 4K close-camera polish should add macro-variation to frozen ground and other fine-grain natural surfaces.

### 6. Starship, Void, and Transit - Batch AI accepted

Spaceship corridors, hangar, airlock, cargo deck, bridge, observation room, space-void platform, teleporter room, stargate chamber, hyperspace machinery, and derelict ship. The playable surface always remains readable; space/void vistas sit below it and never become collision ambiguity.

Generated, normalized, gallery-bound, and live-theme accepted. Four deterministic floor families - operational, command, energy transit, and derelict - prevent ornate single-frame repetition while keeping space-vista imagery bounded inside readable architecture.

### 7. Containment and Underworld - Batch AJ accepted

Prison, brig, quarantine, dungeon, containment vault, specimen cages, execution chamber, abandoned bunker, cult chamber, and corrupted demonic facility.

Generated, normalized, gallery-bound, and live-theme accepted as institutional wing, containment vault, dungeon depths, and infernal facility families. All four pass density, native, 2x, and 3x readability review.

### 8. Boss arenas and Colosseum — Batch AK

Build arenas after their boss mechanics are locked. Required layouts: circular Colosseum, four-pillar crucible, segmented reactor ring, hive-heart chamber, void/stargate dais, foundry forge, ruined military parade ground, and multi-lane siege arena. Arena art must expose safe lanes, cover, objective anchors, edges, and recovery windows without pre-baking live warning geometry.

## Recommended additional spaces

- Entrance/airlock and extraction rooms that orient the player.
- Treasure/reward vaults with strong but non-combat silhouettes.
- Challenge, shrine, rescue, escort, survival, and holdout rooms.
- Secret maintenance passages and one-way breach shortcuts.
- Lore/observation rooms that provide a short pressure break.
- Elite ambush rooms and destructible-cover rooms.
- Transition rooms that visually blend two adjacent kits.

## Theme objects, hazards, and interactions

The environment system now requires a second layer above floors: theme-filtered obstacles, hazards, and interactables. The canonical 24-object contract and production rules are in `world-object-production-plan.md`. Produce structural/destructible art first, then hazard transitions, then multi-state interaction art. Prove these standard-room tactics before Batch AK boss arenas.

## Production order and gates

1. Batch AD Science Wing establishes the contract and gallery preflight.
2. Prove floor seams, repetition, actor contrast, and fixture scale at native, Full HD, and 4K.
3. Batch AE Bastion Logistics reworks the generic starting environment.
4. Batch AF Machine Foundry supports the completed machine family.
5. Batch AG Alien Hive supports nest, slime, egg, and hatchery encounters.
6. Batch AH natural/planetary kits prove irregular outdoor tiling.
7. Batch AI starship/void/transit proves layered playable-ground versus vista readability.
8. Batch AJ containment/underworld adds prison and demonic variants.

Object Batch O1 now provides the first cross-theme tactical-prop layer above these floors: 12 structural families and 48 intact-to-destroyed frames. The environment kits remain responsible for room identity; O1 objects provide reusable cover and route-changing silhouettes without baking gameplay state into the floor art.
9. Batch AK boss arenas follows accepted 45–90-second boss fights.
10. Run physical-controller, colour-vision, maximum-density audio, seam, repetition, and performance reviews before Steam packaging.

Every kit must pass: exact dimensions and alpha, no magenta fringe, deterministic frame order, 3×3 seam mosaic, 45×26-tile repetition view, grayscale actor/telegraph contrast, native/1080p/4K gallery, live maximum-density fight, and offline build verification.
