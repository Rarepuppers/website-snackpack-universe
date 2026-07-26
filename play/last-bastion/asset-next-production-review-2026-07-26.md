# Last Bastion next asset review — 26 July 2026

## Audit result

The code and plans agree that world-object art remains the current production gate; the next held-weapon release-art candidate is now staged for review without enabling its pool.

- Environment room families AD–AJ and Object Batch O1 are accepted.
- The live eight-weapon roster, perks, shop, and current item UI are covered; broad item generation would advertise mechanics that do not exist.
- Seven built weapons and six built enemies remain intentionally held behind art/readability gates.
- The 24-entry `WorldObjectCatalog` is still imported only by its own test. Batch O1 supplies 12 structural families, but placement, interaction, and hazard behavior are not live.
- Boss arenas remain gated until standard-room objects prove safe lanes, cover, transitions, and interaction language.
- The density lab shows a deliberately crowded, dark top-down field. New ground art must remain lower contrast than actors, projectiles, pickups, and code-drawn telegraphs.

## Priority queue

1. **Object Batch O2A — persistent live hazards:** slime, toxic, fire, lava loop sheets and reusable transition pieces. Started in `art/production-tests/object-batch-o2/`.
2. **Object Batch O2B — control surfaces:** web slow overlay, ice-fracture/degradation overlay, and extinguished/scorched recovery decals are now production candidates under `art/production-tests/object-batch-o2b/`. Safe-edge masks remain code-native geometry; mixed-floor and colour-vision acceptance remain open.
3. **Object Batch O3A — core interactions:** the supply chest, gate button, control panel, turret console, and trap console atlas is now a production candidate under `art/production-tests/object-batch-o3a/`. Gameplay acceptance and code binding remain open; all states are text-free and physical.
4. **Object Batch O3B — large objective anchors:** the monster teleporter, stargate, cryogenic tube, and weapon-upgrade station atlas is now a production candidate under `art/production-tests/object-batch-o3b/`. Preview/charge/cooldown states are physical and text-free; timing, radius, ownership, destinations, and prompts remain code-owned.
5. **Held-weapon release art:** Railspike, Seeker Swarm, Cryo Lance, Tesla Coil, Flamethrower, Sawblade. Batch H1 now stages body/state and behavior-matched VFX atlases under `art/production-tests/held-weapons-batch-h1/`, with the canonical tile atlas under `held-weapons-batch-h1-tiles/`; runtime derivatives are copied to `game-assets/`. Keep `HELD_WEAPONS_IN_POOL` off until close-view, audio, and in-game readability review pass. Event Horizon waits for a Unique-slot acquisition path.
6. **Held-enemy wave release review:** the machine-faction art exists, so this is primarily mixed-wave acceptance and tuning. Nest Weaver needs a placement/budget decision rather than more art.
7. **Item Batch P1:** a six-item consolidation candidate is now staged under `art/production-tests/item-batch-p1/`, including canonical tiles, pickup states, active-status motifs, and shared pickup/expiration effects. Keep it art-gated until the maximum-density and compact-size readability review passes.
8. **Item Batch P2:** a three-row legacy VFX candidate is now staged under `art/production-tests/item-batch-p2/` for Service Rifle, Scattergun, and Arc Carbine. Keep existing bindings until compact-size and maximum-density review passes.
9. **Transformation identity tiles:** blocked until the irreversible-choice comprehension gate and Cybernetic placeholder pilot pass.
10. **Boss arenas (Batch AK):** centerpiece art is staged under `art/production-tests/batch-ak/`, with modular boundary/fixture support under `batch-ak-support/`, a 4×4 floor candidate under `batch-ak-floor/`, low-contrast decals under `batch-ak-decals/`, optional atmosphere accents under `batch-ak-atmosphere/`, themed entrance gates under `batch-ak-gates/`, non-playable vista plates under `batch-ak-vistas/`, a three-part follow-up support package under `batch-ak-followup-trio/`, and three HD/4K macro-material families under `batch-ak-macro-trio/`; full arena layouts remain gated behind seam, density, and 45–90-second tactics review.

12. **Object Batch O4 â€” navigation + cover:** three 2Ã—2 atlases now stage low-profile cover anchors, bridge/threshold transitions, and boundary/doorway framing under `art/production-tests/object-batch-o4/`. Keep placement, collision, walkability, lane semantics, and interaction code-owned until standard-room seam, density, and compact-size review pass.

13. **Object Batch O5 â€” room dressing:** three 2Ã—2 atlases now stage maintenance, medical/cryogenic, and hive dressing props under `art/production-tests/object-batch-o5/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

14. **Object Batch O6 â€” structural accents:** three 2Ã—2 atlases now stage ventilation/ductwork, storage/logistics, and power infrastructure dressing under `art/production-tests/object-batch-o6/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

15. **Object Batch O7 â€” composition accents:** three 2Ã—2 atlases now stage debris/rubble, floor-edge trim, and light-fixture dressing under `art/production-tests/object-batch-o7/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

16. **Object Batch O8 â€” access + utility:** three 2Ã—2 atlases now stage access hardware, neutral wayfinding lights, and ambient utility props under `art/production-tests/object-batch-o8/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

17. **Object Batch O9 â€” observation + research:** three 2Ã—2 atlases now stage security/observation, research-lab, and neutral environmental identity props under `art/production-tests/object-batch-o9/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

18. **Object Batch O10 â€” fabrication + maintenance:** three 2Ã—2 atlases now stage transport/fabrication, maintenance fabrication, and hazard-neutral maintenance props under `art/production-tests/object-batch-o10/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

## Quality floor for every new raster asset

- Keep untouched generated source, clean-alpha source, prompt provenance, deterministic normalizer, runtime derivative, frame map, and contact sheet.
- Author no text, controller bindings, cooldowns, radii, health, collision, rewards, or telegraphs into art.
- Evaluate at logical gameplay size first, then inspect the retained source for cell bleed, extraction damage, inconsistent lighting, chroma fringe, and unstable footprints.
- Preserve stable IDs, frame order, pivots, footprints, attachment points, and runtime rotation rules so future 512+ repaints can replace imagery without rewriting gameplay.
- For a Steam/4K close-view pass, repaint accepted individual frames at 512×512 or larger from retained references; never upscale a runtime PNG and call it a new source.
