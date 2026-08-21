# Last Bastion next asset review — 26 July 2026

## Audit result

The code and plans agree that world-object art remains the current production gate; the next held-weapon release-art candidate is now staged for review without enabling its pool.

- Environment room families AD–AJ and Object Batch O1 are accepted.
- The live eight-weapon roster, perks, shop, and current item UI are covered; broad item generation would advertise mechanics that do not exist.
- Seven built weapons and six built enemies remain intentionally held behind art/readability gates.
- The 24-entry `WorldObjectCatalog` is still imported only by its own test. Batch O1 supplies 12 structural families, but placement, interaction, and hazard behavior are not live.
- Boss arenas remain gated until standard-room objects prove safe lanes, cover, transitions, and interaction language.
- The density lab shows a deliberately crowded, dark top-down field. New ground art must remain lower contrast than actors, projectiles, pickups, and code-drawn telegraphs.
- Steam target: preserve the 960x540 simulation contract, present it at exact 2x Full HD and 4x 4K where possible, and re-author only the assets that fail close-view review. Never upscale a runtime PNG as a final HD/4K source.
- Character-select audit: Marine, Medic, Assault, Tactician, and Scout are production-playable hero definitions with complete gameplay sheets and full-height select portraits. Assault and Tactician are earned through parallel 35-mark Armory paths; Scout follows a 45-mark dual-doctrine path. Scout's mechanics, C3 visuals, hero-isolated audio, seeded tuning, close-view, ordinary combat, 56-enemy density, contextual listening, progression, and final release gates are accepted.
- Future secret-roster audit: Alien, Cultist, and Cyborg are not yet playable roster entries or hero definitions. Existing Alien Hive, Cultist transformation, and Cyborg Reclaimer content must not be reused as hero-select promises. Each future hero needs a gameplay contract, full-height select portrait, directional gameplay sheet, equipment/helmet overlays where applicable, and hero-specific UI/audio before appearing as selectable.
- Expedition-map audit: node presentation remains code-native circles, ASCII-safe glyphs, route lines, and labels. Six authored 1536x1024 region plates now bind to matching themes; other themes retain the deterministic fallback. Act progression, fog-of-war, node state, and travel behavior remain code-owned.

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

12. **Object Batch O4 — navigation + cover:** three 2×2 atlases now stage low-profile cover anchors, bridge/threshold transitions, and boundary/doorway framing under `art/production-tests/object-batch-o4/`. Keep placement, collision, walkability, lane semantics, and interaction code-owned until standard-room seam, density, and compact-size review pass.

13. **Object Batch O5 — room dressing:** three 2×2 atlases now stage maintenance, medical/cryogenic, and hive dressing props under `art/production-tests/object-batch-o5/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

14. **Object Batch O6 — structural accents:** three 2×2 atlases now stage ventilation/ductwork, storage/logistics, and power infrastructure dressing under `art/production-tests/object-batch-o6/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

15. **Object Batch O7 — composition accents:** three 2×2 atlases now stage debris/rubble, floor-edge trim, and light-fixture dressing under `art/production-tests/object-batch-o7/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

16. **Object Batch O8 — access + utility:** three 2×2 atlases now stage access hardware, neutral wayfinding lights, and ambient utility props under `art/production-tests/object-batch-o8/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

17. **Object Batch O9 — observation + research:** three 2×2 atlases now stage security/observation, research-lab, and neutral environmental identity props under `art/production-tests/object-batch-o9/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

18. **Object Batch O10 — fabrication + maintenance:** three 2×2 atlases now stage transport/fabrication, maintenance fabrication, and hazard-neutral maintenance props under `art/production-tests/object-batch-o10/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

19. **Object Batch O11 — architectural transitions:** three 2×2 atlases now stage vertical transitions, railings/guardrails, and airlock frames under `art/production-tests/object-batch-o11/`. Keep walkability, collision, transitions, interaction, hazards, rewards, telegraphs, and placement code-owned.

20. **Object Batch O12 — habitat + identity:** three 2×2 atlases now stage habitat/life-support, communications/network, and storage identity props under `art/production-tests/object-batch-o12/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

21. **Object Batch O13 — faction dressing:** three 2×2 atlases now stage machine-foundry, cryogenic-lab, and hive/void themed props under `art/production-tests/object-batch-o13/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

22. **Object Batch O14 — energy + ruins + flora:** three 2×2 atlases now stage neutral energy anchors, ruin ornaments, and controlled flora growth under `art/production-tests/object-batch-o14/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

23. **Object Batch O15 — common + vehicle bay:** three 2×2 atlases now stage crew/common-room, vehicle-bay, and recycling/waste props under `art/production-tests/object-batch-o15/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

24. **Object Batch O16 — medical + emergency + security:** three 2×2 atlases now stage medical-response, emergency-support, and security-support props under `art/production-tests/object-batch-o16/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

25. **Object Batch O17 — logistics + fabrication:** three 2×2 atlases now stage logistics-storage, fabrication-room, and power-fabrication props under `art/production-tests/object-batch-o17/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

26. **Object Batch O18 — habitation + recreation + communications:** three 2×2 atlases now stage habitation, recreation-common, and communications props under `art/production-tests/object-batch-o18/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

27. **Object Batch O19 — command + navigation + archive:** three 2×2 atlases now stage command-center, navigation-observation, and archive-records props under `art/production-tests/object-batch-o19/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

28. **Object Batch O20 — engineering + life support + exterior service:** three 2×2 atlases now stage engineering-control, life-support, and exterior-service props under `art/production-tests/object-batch-o20/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

29. **Object Batch O21 — transit + loading + security perimeter:** three 2×2 atlases now stage transit-access, loading-freight, and security-perimeter props under `art/production-tests/object-batch-o21/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

30. **Object Batch O22 — civic + agricultural + utility:** three 2×2 atlases now stage civic-community, agricultural-hydroponic, and utility-room props under `art/production-tests/object-batch-o22/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

31. **Object Batch O23 — laboratory + power + docking:** three 2×2 atlases now stage laboratory, power-distribution, and docking-service props under `art/production-tests/object-batch-o23/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

32. **Object Batch O24 — command support + crew care + emergency egress:** three 2×2 atlases now stage command-support, crew-care, and emergency-egress props under `art/production-tests/object-batch-o24/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

33. **Object Batch O25 — research + maintenance + weather utility:** three 2×2 atlases now stage research-support, maintenance-staging, and weather-utility props under `art/production-tests/object-batch-o25/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

34. **Object Batch O26 — fabrication safety + habitat commons + communications infrastructure:** three 2×2 atlases now stage fabrication-safety, habitat-commons, and communications-infrastructure props under `art/production-tests/object-batch-o26/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

35. **Object Batch O27 — civic market + memorial cultural + surface salvage:** three 2×2 atlases now stage civic-market, memorial-cultural, and surface-salvage props under `art/production-tests/object-batch-o27/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

36. **Object Batch O28 — robotics support + water treatment + expedition field gear:** three 2×2 atlases now stage robotics-support, water-treatment, and expedition-field-gear props under `art/production-tests/object-batch-o28/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

37. **Object Batch O29 — thermal climate + learning education + personal quarters:** three 2×2 atlases now stage thermal-climate, learning-education, and personal-quarters props under `art/production-tests/object-batch-o29/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

38. **Object Batch O30 — construction staging + geology survey + quiet recreation:** three 2×2 atlases now stage construction-staging, geology-survey, and quiet-recreation props under `art/production-tests/object-batch-o30/`. Keep them decorative and art-gated; interaction, collision, hazards, rewards, and placement remain code-owned.

39. **Authorized Storm Savant follow-up — body + node + effects:** a 4×9 body sheet, 6-state node strip, and 4×2 effects atlas are now staged under `art/production-tests/batch-storm-savant/`. The remaining queue is behavior-gated enemy follow-ups (Scrap Skitterer, Arc Warden, Cyborg Reclaimer, Foundry Fabricator), seven specialty shop keepers, and conditional legacy weapon VFX/audio; gameplay geometry, timings, and ownership remain code-owned.

40. **Authorized Scrap Skitterer follow-up — body + effects:** a 4×8 directional/state body sheet and 4×2 onset/dissipate effects atlas are now staged under `art/production-tests/batch-scrap-skitterer/`. The compact wreck, sparse effects, and non-explosive identity are preserved; rush timing, warning lane, collision, damage, Shock weakness, wreck lifetime, and cap remain code-owned.

41. **Authorized Arc Warden follow-up — body + effects:** a 4×8 directional/state body sheet and 4×2 onset/dissipate effects atlas are now staged under `art/production-tests/batch-arc-warden/`. The narrow emitter, fixed footprint, and vented recovery remain readable; aim lock, beam geometry, endpoint, timing, cover clipping, damage, Shock weakness, and cooldown remain code-owned.

42. **Authorized Cyborg Reclaimer follow-up — body + effects:** a 4×9 directional/state body sheet and 4×2 onset/dissipate repair effects atlas are now staged under `art/production-tests/batch-cyborg-reclaimer/`. The broad silhouette, repair arm, reservoir, and recovery states remain readable; target eligibility, tether, patch count, healing, interruption, and cooldown remain code-owned.

43. **Authorized Foundry Fabricator follow-up — body + pad + drone + turret + effects:** the five-family package is staged under `art/production-tests/batch-foundry-fabricator/`: 4×9 Fabricator body, 6-state fabrication pad, 4×7 drone, 4×8 turret, and 4×2 shared effects. Charges, reservations/refunds, pad interruption, child cleanup, turret tells, cover blocking, timing, and collision remain code-owned.

44. **Specialty shop keeper batch — seven presentation sheets:** Blacksmith, Gunsmith, VND-R, Clinician, Medic-Sister, Curator, and Fence now have four-frame 128×256 idle sheets under `art/production-tests/batch-shop-keepers/`. Prices, offers, specialty labels, counter layout, and transaction behavior remain code-rendered.

45. **Item Batch P2 refresh — legacy weapon VFX:** Service Rifle, Scattergun, and Arc Carbine now have refreshed 2×2 onset/travel/result/recovery candidates under `art/production-tests/item-batch-p2-refresh/`. The Scattergun impact was regenerated to remove gore and use mechanical/armour/cover feedback only. Hit geometry, damage areas, chain paths, timing, and status buildup remain code-owned.

46. **Audio Batch S1 validation:** the existing 24 production WAV masters pass format/peak/duration checks, with the Bulwark loop accepted. Runtime binding is complete; remaining work is qualitative mix approval only.

47. **Audio Batch S2 complete:** eight mono 48 kHz/24-bit WAV masters have approved OGG Vorbis and MP3 fallback derivatives under `dev/src/game/audio/runtime/batch-s2/` and `game-assets/`. The derivative-required audit passes; final listening and transient-edge review remain.

48. **Audio Batch S3 complete:** 16 mono 48 kHz/24-bit WAV masters have approved OGG Vorbis and MP3 fallback derivatives under `dev/src/game/audio/runtime/batch-s3/` and `game-assets/`. The derivative-required audit passes; final listening and transient-edge review remain.

49. **Steam Full HD/4K readiness:** recent 128/192px enemy, machine, mini-boss, terrain, shop, and UI families are retained. The next selective upgrades are the generic/64px early environment and combat families only where 1080p/4K close-view review exposes repetition, weak silhouettes, seams, or insufficient detail. Keep the 960x540 world-unit, pivot, frame, and UI contracts unchanged.

50. **Character-select showcase batch:** Marine and Medic have paired full-height, text-free select portraits under `art/production-tests/batch-character-select/`; Assault, Tactician, and Scout's accepted C3 portraits are wired beside them. Reserve Alien/Cultist/Cyborg for a later secret-roster batch. Portraits are retained at 1024x1536 for Steam close-view use, with gameplay sheets remaining separate.

51. **Expedition map presentation batch:** ASCII-safe node medallions cover all node states, and six authored 1536x1024 region plates now stage under `art/production-tests/batch-map-presentation/` for Bastion Logistics, Alien Hive, Machine Foundry, Science Wing, Void Approach, and Arctic Relay. Matching themes use the plates; other themes retain the seeded fallback. Keep route lines, selection, fog-of-war, cleared state, labels, and travel motion code-owned. Promotion still requires native, Full HD, 4K, grayscale, and colour-vision review.
52. **O3A Steam close-view candidates:** five 1254px transparent close-view candidates for Supply Chest, Gate Button, Control Panel, Turret Console, and Cryogenic Tube now stage under `art/production-tests/object-batch-o3a-steam-close/`. They remain art-gated; runtime IDs, state order, prompts, collision, ownership, and interaction behavior stay code-owned.
53. **Legacy weapon gameplay raster refresh:** Service Rifle, Scattergun, and Arc Carbine now bind to transparent 256x128 derivatives from retained high-resolution sources under `art/production-tests/legacy-weapon-refresh/`. Stable IDs and the 64x32 logical gameplay contract are preserved. Their separate P2 VFX atlases remain art-gated until close-view and maximum-density review.
54. **Legacy enemy raster refresh:** Scuttler, Egg Cluster, and Brain Blob now bind to transparent 256px-cell sheets under `art/production-tests/legacy-enemy-refresh/`. Stable IDs, frame order, logical 64px cells, pivots, and gameplay state contracts are preserved for web and future Steam Full HD/4K builds.
55. **Legacy pickup/action atlas promotion:** Generic pickups, action tiles, and weapon tiles now bind to their retained high-resolution source atlases instead of 64px runtime derivatives. Logical cell sizes, frame counts, pivots, and UI semantics remain unchanged. Item Batch P1 remains gated because it is a semantic content refresh, not a raster-only upgrade.
56. **Core combat effect atlas promotion:** Core combat, Batch B, and Batch C effect sheets now bind to their retained high-resolution source atlases. Logical 64px cells, frame counts, pivots, and timing contracts remain unchanged. Status overlays and telegraph danger fill remain gated where no matching drop-in source atlas exists.
57. **Weapon-specific effect atlas promotion:** Patrol Blade, Bolt Carbine, Bulwark Rotary, Grenade Tube, and Event Horizon now bind to retained high-resolution effect atlases. Stable logical cells, frame counts, pivots, timing, and behavior contracts are preserved.
58. **Telegraph small atlas refresh:** The small telegraph atlas now binds to a transparent 256px-cell 4x3 replacement under `art/production-tests/telegraph-refresh/`, preserving 12 logical 64px frames and code-owned telegraph behavior. Large telegraphs and danger fill remain unchanged pending matching source contracts.
59. **Status overlay atlas promotion:** Burning, Overload, Corrode, and Freeze now bind to a 256px-cell 4x4 atlas rebuilt from retained source strips under `art/production-tests/batch-k/`. The existing 16-frame, 48px logical status contract and code-owned semantics are preserved.
60. **Browser acceptance pass:** Maximum-density combat and the Batch K status gallery loaded from the local web build with no console errors or warnings. Creator review remains open for dense readability, reduced-flash comfort, grayscale, colour-vision, and Full HD/4K scaling.

## Quality floor for every new raster asset

- Keep untouched generated source, clean-alpha source, prompt provenance, deterministic normalizer, runtime derivative, frame map, and contact sheet.
- Author no text, controller bindings, cooldowns, radii, health, collision, rewards, or telegraphs into art.
- Evaluate at logical gameplay size first, then inspect the retained source for cell bleed, extraction damage, inconsistent lighting, chroma fringe, and unstable footprints.
- Preserve stable IDs, frame order, pivots, footprints, attachment points, and runtime rotation rules so future 512+ repaints can replace imagery without rewriting gameplay.
- For a Steam/4K close-view pass, repaint accepted individual frames at 512×512 or larger from retained references; never upscale a runtime PNG and call it a new source.

---

# Addendum — 31 July 2026

## Audit result (addendum)

Three gaps are now the highest-value asset work, ahead of further decorative object batches (O4–O30 already exceed what any placement system consumes).

- **Screen chrome is code-drawn and flat.** Every menu card, panel, and button in the shell, pause overlay, decision prompts, shop, map, and debrief is a plain filled rectangle with a 1px stroke. The background plates and typography read well; the containers sitting on them do not. This is the most visible unfinished surface in the game and the first thing a new player sees.
- **There is no music, and two mixer buses are silent.** `audio/MusicDirector.ts` and `audio/AudioMixer.ts` are complete and tested but consume nothing, because no music or ambience files exist. The Music and Ambience volume sliders were removed from Settings on 31 July precisely because they controlled nothing. They go back the moment these assets land.
- **Future heroes still need presentation.** Assault, Tactician, and Scout have complete released C3 presentation. Alien/Cultist/Cyborg remain reserved with nothing to show. A locked slot still needs to look deliberate.

## Priority queue (addendum)

61. **UI Batch U1 — panel and button chrome (highest priority).** The core nine-slice container language, replacing flat rectangles everywhere. Required families:
    - **Panel frame**, three weights: `recessed` (backing for content wells), `raised` (menu cards, shop cards), `emphasis` (modal/decision prompts). Nine-slice with a 48px corner and 16px repeatable edge at source resolution.
    - **Button**, five states in one atlas row per weight: `idle`, `hover`, `selected`, `pressed`, `disabled`.
    - **Selection accent**: a focus ring or corner-bracket set that reads at a glance against both `raised` and `emphasis`, since keyboard and gamepad navigation are primary.
    - **Header plate** and **divider rule** for section titles and list separation.
    - **Corner brackets / trim** as separable pieces, so code can compose a frame without a bespoke asset per screen.

    Keep the existing dark technical palette and the terminal/monospace character of the current shell — this is a refinement of what is there, not a restyle. Author **no text, no labels, no icons, no key bindings**. Layout, wording, focus order, and state logic remain code-owned. Nine-slice corner and edge sizes must be stated in the frame map, because code slices on those numbers. Stage under `art/production-tests/ui-batch-u1/`.

62. **UI Batch U2 — screen-specific surfaces.** Built from U1's language once it is accepted, for the surfaces whose shape U1 does not cover:
    - Combat HUD backing plates (health/XP/wave cluster, weapon ring surround, radar bezel, status tray).
    - Decision and shop card frames, including an `affordable` vs `too expensive` treatment that is **not colour-only** (colour-vision modes are a shipped setting).
    - Pause overlay scrim and its menu panel.
    - Debrief/run-summary panels and the chart well.
    - Expedition map node card and intel card frames.
    - Encounter event card frame (the FTL-style choice cards).

    Same rules as U1: text-free, no baked numbers, no telegraphs. Stage under `art/production-tests/ui-batch-u2/`.

63. **Music Batch M1 — six layers.** `audio/MusicDirector.ts` already defines the exact set and the transition rules; compose to that contract:

    | Layer | Trigger | Form |
    |---|---|---|
    | `title` | Shell/menu screens | Seamless loop, sparse, no percussion build |
    | `calm` | Enemy density at or below 35% of live cap, held 4s | Seamless loop, low intensity |
    | `intensity` | Enemy density at or above 65% of live cap, held 2s | Seamless loop, must layer over `calm` at the same tempo/key |
    | `boss` | Boss present — switches immediately, no hysteresis | Seamless loop, distinct from `intensity` |
    | `victory` | Encounter won | One-shot sting, may resolve into a short loop |
    | `defeat` | Run ended | One-shot sting, no loop |

    `calm` and `intensity` swap frequently mid-fight, so they must be **the same tempo and key and share a bar grid** — the director crossfades, it does not wait for a phrase boundary. Deliver stems where a layer is additive. `boss` may break key. Nothing may include a stinger that assumes a fixed wave length.

    Format: stereo 48 kHz/24-bit WAV masters, plus OGG Vorbis and MP3 fallback derivatives, matching the S2/S3 pipeline. Stage masters under `art/production-tests/audio-batch-m1/` and derivatives under `dev/src/game/audio/runtime/batch-m1/`.

64. **Ambience Batch M2 — nine world families.** One seamless stereo bed per `WorldThemeFamily`: `bastion`, `science`, `logistics`, `foundry`, `hive`, `surface`, `starship`, `containment`, `underworld`. These sit under music on the separate `ambience` bus and must survive being heard for several minutes — no recognisable repeating event, no melodic content that fights `calm`. Same format and pipeline as M1; stage under `art/production-tests/audio-batch-m2/` and `dev/src/game/audio/runtime/batch-m2/`.

65. **UI Audio Batch S4 — the `ui` bus.** Currently silent. Needed: navigation move, confirm, back/cancel, invalid/denied, tab or category change, slider tick, purchase complete, item equipped, pause open, pause close, achievement/discovery toast. Short, dry, non-musical, and quiet enough to fire on every keypress without fatigue — these are the most-repeated sounds in the game. Mono 48 kHz/24-bit masters plus derivatives, matching S1–S3. Stage under `art/production-tests/audio-batch-s4/` and `dev/src/game/audio/runtime/batch-s4/`.

66. **Character Batch C2 — locked, mystery, and reveal plates.** Every roster slot must look intentional, including the ones you cannot pick yet. Three presentation states, at the same 1024x1536 full-height format as the accepted Marine/Medic select portraits:
    - **Locked** — a hero whose identity is known but not yet owned. Use its accepted portrait and exact Armory requirement; Assault, Tactician, and Scout now follow this contract.
    - **Mystery** — a reserved slot whose identity is *not* revealed (Alien, Cultist, Cyborg). Must not disclose the hero: no faction-identifying silhouette, no reuse of Alien Hive, Cultist transformation, or Cyborg Reclaimer imagery. A sealed/redacted plate treatment is the intent.
    - **Reveal** — a short transition frame set the shell can play once when a slot unlocks.

    Also needed: matching small **roster tile** variants of all three states for any compact list.

    Author no unlock conditions, no requirement text, no progress numbers, and no mechanical promises into the art — unlock rules are code-owned and will change. Stage under `art/production-tests/batch-character-c2/`.

67. **Character Batch C3 — the per-hero package for an actual playable hero.** A hero may only leave silhouette state when *all* of the following exist, matching the shipped Marine/Medic contract. Produce this package per hero, in roster order (Assault, then Tactician, then Scout), one hero at a time:
    - Full-height select portrait, 1024x1536, text-free.
    - Directional gameplay sprite sheet on the established four-direction column order (south, north, east, west), covering the same states the Marine sheet covers.
    - Equipment/helmet overlay layers where the hero's silhouette changes with loadout.
    - Roster tile, unlocked state.
    - Hero-specific audio: at minimum damage, evade, and death, consistent with the existing marine/medic cues.

    Gameplay contract — stats, weapon-class rack, starting weapon, ultimate, and unlock rule — is code-owned and must exist **before** the package is produced, not after. Do not begin a hero package until its mechanics are real; that is the mistake the silhouette placeholders were meant to avoid. Stage under `art/production-tests/batch-character-c3-<hero>/`.

## Quality floor for every new audio asset

- Deliver a 48 kHz/24-bit WAV master plus OGG Vorbis and MP3 fallback derivatives; the runtime loads the derivatives and the audit script requires both.
- Stereo for music and ambience, mono for UI and combat SFX, matching batches S1–S3.
- Loops must be sample-accurate and seam-free — verified by looping the file at least four times, not by trusting the editor.
- True-peak below -1 dBFS. Keep music and ambience well under the SFX bed: the mixer applies perceptual gain per bus and combat cues must always cut through.
- No baked silence at the head of a one-shot; the runtime does not trim.
- Author no voice-over, no lyrics, and no recognisable real-world musical quotation.
- State the intended bus (`sfx`, `ui`, `music`, `ambience`) and, for music, the tempo and key in the asset map. `calm` and `intensity` must agree on both.

---

# Addendum — 21 August 2026

The local-test readiness audit found two concrete identity gaps and one conditional 4K refresh.
These sit behind U1 and the missing M1/M2/S4 audio in production urgency, but ahead of additional
decorative props or theme variants.

68. **Weapon identity tile completion:** 24 player-visible identities still borrow one of the eight
    Batch I frames. Author three reviewable eight-tile atlases at 128×128 runtime resolution from
    512×512-or-larger retained masters. Do not regenerate the accepted eight Batch I tiles or the
    standalone Marauder tile without a specific close-view failure. `auxiliary-drone` remains an
    internal supporting identity and is outside the player-facing tile count.
    **Batch 68A complete (21 August 2026):** dedicated stable frames now cover Railspike, Seeker
    Swarm, Cryo Lance, Tesla Coil, Flamethrower, Sawblade, Combat Knife, and Machete. Event Horizon's
    already-authored tile was also restored to the shared mapper and route preloads. That leaves 15
    borrowed player-facing identities for 68B–68C; 68C may be a seven-frame atlas rather than
    manufacturing an unnecessary identity to fill an eighth slot.
    **Batch 68B complete (21 August 2026):** stable dedicated frames now cover Fire Axe, Shock
    Baton, Breaching Maul, Plasma Saber, Corrosive Lobber, Scourge Repeater, Bile Lance, and Rime
    Cleaver. The first Fire Axe source was rejected before promotion because it read as a fantasy
    double-axe; the retained replacement is a single-headed rescue tool. Seven borrowed identities
    remain for Batch 68C.
    **Batch 68C complete (21 August 2026):** Hoarfrost Scatter, Glacier Ward, Tether Harpoon,
    Sentry Stake, Emberlance, Storm Coil Beam, and Blight Scythe now own a deliberate seven-frame
    atlas. The weapon identity tile programme is complete: every player-facing weapon selects either
    its accepted original tile or a dedicated identity. `auxiliary-drone` remains internal-only.
69. **Power-up identity completion:** author dedicated pickup/HUD frames for Siege Loader, Phase
    Jacket, Hunter Optics, Last Stand Stimulant, EMP Charge, and Butcher's Serum. They currently
    reuse four generic reward frames. Preserve Medkit and Uranium-Core Rounds and keep names,
    durations, bindings, stack state, and timers code-owned.
    **Complete (21 August 2026):** all six now share a deliberate six-frame 128 px atlas across
    world pickups, collection bursts, and timed HUD status slots. The mapper is typed and tested,
    while labels, timers, urgency rings, duration, and behavior remain code-owned. Review the atlas
    at `?mode=gallery&batch=powerup-identity`.
70. **Conditional expedition-plate refresh:** review all six 1536×1024 map plates at Full HD and 4K.
    Re-author only failed plates at 3840×2560, preserving their 3:2 composition, stable IDs, and
    1536×1024 logical contract. Do not convert them to title-style 16:9 art; shell and route overlays
    intentionally crop the plate.
71. **UI Batch U1 reusable primitives complete:** retained ImageGen panel/button sources, a
    deterministic alpha-cleaning normalizer, one transparent panel frame, and five explicit button
    states now stage under `art/production-tests/ui-batch-u1/`. The selected state is wired behind the
    title confirmation, idle/selected/hover/pressed states now back main-menu cards, and the panel
    frame surrounds How to Play. `?uichrome=legacy` remains the A/B fallback, while `?flow=<screen>`
    can open every shell screen directly for deterministic visual review. Browser review confirmed
    clean button and large-panel scaling. Deterministic recessed, raised, and emphasis panel weights,
    non-colour-only focus brackets, a header plate, divider rule, and a real disabled deploy treatment
    are now integrated as stable runtime assets. U1 is complete. Keep screen-specific U2 surfaces
    behind observed playtest findings; no further item identity batch is currently required.

Do not blanket-regenerate early 64 px floor, boundary, obstacle, pickup, or effect families. Exact
integer pixel-art scaling is expected. A family earns regeneration only through a named seam,
silhouette, extraction, repetition, grayscale, colour-vision, density, or 4K close-view failure.
Likewise, a new theme must add navigation, hazard, or encounter language; a palette-only theme is
optional polish.
