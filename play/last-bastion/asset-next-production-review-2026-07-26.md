# Last Bastion next asset review — 26 July 2026

## Audit result

The code and plans agree that the next production gate is world-object art, not another character, weapon, environment, or boss batch.

- Environment room families AD–AJ and Object Batch O1 are accepted.
- The live eight-weapon roster, perks, shop, and current item UI are covered; broad item generation would advertise mechanics that do not exist.
- Seven built weapons and six built enemies remain intentionally held behind art/readability gates.
- The 24-entry `WorldObjectCatalog` is still imported only by its own test. Batch O1 supplies 12 structural families, but placement, interaction, and hazard behavior are not live.
- Boss arenas remain gated until standard-room objects prove safe lanes, cover, transitions, and interaction language.
- The density lab shows a deliberately crowded, dark top-down field. New ground art must remain lower contrast than actors, projectiles, pickups, and code-drawn telegraphs.

## Priority queue

1. **Object Batch O2A — persistent live hazards:** slime, toxic, fire, lava loop sheets and reusable transition pieces. Started in `art/production-tests/object-batch-o2/`.
2. **Object Batch O2B — control surfaces:** web slow overlay, ice-fracture/degradation overlay, extinguished/scorched recovery decals, and neutral safe-edge masks. Generate only after O2A passes mixed-floor and colour-vision review.
3. **Object Batch O3A — core interactions:** supply chest, gate button, control panel, turret console, trap console. Each needs idle/ready/active/disabled/completed or opened states without text.
4. **Object Batch O3B — large objective anchors:** monster teleporter, stargate, cryogenic tube, weapon-upgrade station. Include preview/charge/cooldown layers but keep timing, radius, ownership, and prompts code-owned.
5. **Held-weapon release art:** Railspike, Seeker Swarm, Cryo Lance, Tesla Coil, Flamethrower, Sawblade. Produce body/state/VFX/tile families, then flip `HELD_WEAPONS_IN_POOL`. Event Horizon waits for a Unique-slot acquisition path.
6. **Held-enemy wave release review:** the machine-faction art exists, so this is primarily mixed-wave acceptance and tuning. Nest Weaver needs a placement/budget decision rather than more art.
7. **Item Batch P1:** consolidate the six live powerup/status motifs only if maximum-density review shows the mixed legacy atlas is unclear.
8. **Item Batch P2:** renew Service Rifle, Scattergun, and Arc Carbine onset/travel/result/recovery VFX.
9. **Transformation identity tiles:** blocked until the irreversible-choice comprehension gate and Cybernetic placeholder pilot pass.
10. **Boss arenas (Batch AK):** generate after O2/O3 tactics pass 45–90-second encounters.

## Quality floor for every new raster asset

- Keep untouched generated source, clean-alpha source, prompt provenance, deterministic normalizer, runtime derivative, frame map, and contact sheet.
- Author no text, controller bindings, cooldowns, radii, health, collision, rewards, or telegraphs into art.
- Evaluate at logical gameplay size first, then inspect the retained source for cell bleed, extraction damage, inconsistent lighting, chroma fringe, and unstable footprints.
- Preserve stable IDs, frame order, pivots, footprints, attachment points, and runtime rotation rules so future 512+ repaints can replace imagery without rewriting gameplay.
- For a Steam/4K close-view pass, repaint accepted individual frames at 512×512 or larger from retained references; never upscale a runtime PNG and call it a new source.
