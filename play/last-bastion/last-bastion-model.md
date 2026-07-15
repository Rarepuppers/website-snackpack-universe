# Last Bastion production plan

## Document purpose

This document tracks decisions, work status, validation gates, and the production workflow for Last Bastion.

The durable game design is in `last-bastion-game.md`. Specific AI model names do not belong in this plan because tools and model availability change. Use the best available coding, planning, image-generation, audio, and testing tools for the task at hand.

## Status definitions

- **Pending:** accepted work that has not started.
- **In progress:** actively being developed or awaiting review.
- **Completed:** finished and verified for the current scope gate.
- **Deferred:** intentionally outside the current scope.
- **Blocked:** cannot proceed without a decision, dependency, or external change.

An item is not completed merely because code or an asset exists. It must meet its stated acceptance criteria.

## Current milestone

**Milestone:** Pre-production and combat prototype

**Milestone status:** In progress

**Current objective:** visually review one-, four-, six-, and twelve-weapon placeholder layouts, then playtest and tune the complete three-wave loop before beginning production sprite work.

## Completed

### Design review and scope correction

**Status:** Completed — 15 July 2026

- Reviewed the original vision and model notes.
- Chose a web-first validation strategy.
- Established manual action shooter as the primary identity.
- Kept survivor-like escalation and roguelite choices as supporting systems.
- Reduced the first playable from the former web MVP to a focused combat prototype.
- Separated combat prototype, vertical slice, web MVP, and future roadmap.
- Selected battlefield interaction as the intended differentiating feature.
- Confirmed Steam and Android as viable future targets after web validation.
- Confirmed that a Godot rewrite is not required merely to release on Steam.

### Document cleanup

**Status:** Completed — 15 July 2026

- Replaced escaped Markdown with valid headings and lists.
- Removed mojibake from the active documents.
- Removed temporary model-ranking advice from the durable plan.
- Consolidated mechanics into the game design document.
- Added measurable scope gates and acceptance criteria.
- Added desktop, gamepad, and future touch-control direction.
- Added data portability, seeded encounter, save-versioning, and platform principles.

### Initial enemy and weapon catalogue

**Status:** Completed — 15 July 2026

- Added Tier 0 nest objects, Tier 1 introductory creatures, Tier 2 pressure variants, and Tier 3 elite seeds.
- Defined basic slime trails as slowing hazards and reserved damage over time for a later toxic variant.
- Separated weapon availability into Neutral, Hero-specific, and Unique classes.
- Added Tier I–III Neutral and Marine weapon lists plus future Medic and Unique seeds.
- Selected three weapon concepts for the first visual review.

### Weapon art-direction samples

**Status:** Completed — 15 July 2026

- Approved the Neutral Tier I Bastion Service Rifle.
- Approved the Marine-specific Tier II Bulwark Rotary Cannon.
- Approved the Unique Event Horizon gravitic weapon.
- Preserved all three concepts under `art/concepts/weapons/`.

### Input-intent and evasive-move foundation

**Status:** Completed — 15 July 2026

- Defined device-independent movement, aim, fire, evasive move, interact, ultimate, and pause intentions.
- Implemented the keyboard and mouse adapter without leaking physical key checks into hero logic.
- Added a pure shared hero state machine and motion controller that synthetic intents can drive in tests.
- Added Marine duration, distance, and invulnerability secondary stats through `EvasiveMoveProfile`.
- Added additive and multiplicative stat resolution for future item, perk, and relic modifiers.
- Added validation preventing negative values or invulnerability longer than the complete evasive move.
- Verified four evasive-state/stat tests plus two synthetic-intent controller tests.

### Placeholder combat-loop implementation

**Status:** Completed — 15 July 2026

- Implemented the Bastion Service Rifle cadence, projectiles, aiming, collision, damage, and modular runtime stats.
- Implemented Scuttlers, six-second Egg Cluster hatching, and telegraphed Brain Blob drift/wind-up/lunge/recovery phases.
- Implemented three deterministic prototype waves and two-second intermissions.
- Implemented player health, contact damage, roll invulnerability, defeat, and prototype victory.
- Implemented XP drops, attraction, collection, level thresholds, and paused upgrade choice UI.
- Implemented six upgrades: Rapid Cycling, Twin Shot, Piercing Rounds, Explosive Payload, Heavy Calibre, and Field Magnet.
- Expanded verification to 12 passing tests across four test files.

### Prototype controls and feedback pass

**Status:** Completed — 15 July 2026

- Added Escape pause/resume without advancing the combat simulation.
- Added Enter restart after victory or defeat with complete entity and UI cleanup.
- Added a universal provisional 0.75-second roll recovery without changing the three hero secondary stats.
- Added roll readiness text and a visible recovery bar.
- Added typed combat events for firing, impacts, defeats, explosions, player damage, XP collection, and level-ups.
- Added placeholder muzzle flashes, impact flashes, death bursts, explosion rings, camera shake, and level-up flash.
- Expanded verification to 15 passing tests across four test files.

### Marine art-direction checkpoint

**Status:** Completed — 15 July 2026

- Approved the first Marine concept and its modern colourful pixel-art direction.
- Approved the compact practical armour language, navy/charcoal base, ivory panels, teal equipment lights, restrained orange accents, and amber visor.
- Preserved the approved concept under `art/concepts/marine-art-direction-v1.png`.
- Established the concept as an art-direction anchor rather than a production sprite sheet.

### Modular weapon-ring foundation

**Status:** Completed — 15 July 2026

- Added a stable loadout model supporting zero to twelve independently identified weapon instances.
- Added isolated mutable runtime stats and firing cooldowns for every equipped weapon.
- Added a pure circular layout with expanding radius and front/behind depth ordering.
- Made projectile and muzzle origins match each weapon's visible ring position.
- Added `?weapons=0` through `?weapons=12` review parameters; values outside the range are safely clamped.
- Kept one weapon as the default and twelve as an architectural capacity rather than a balance target.
- Expanded verification to 30 passing tests across six test files.

### Representative Marine layer pipeline

**Status:** Completed — 15 July 2026; visual gameplay-scale approval pending under the art-pipeline gate

- Generated and extracted a transparent 4 × 3 Marine base-body sheet from the approved concept direction.
- Standardised the production test on 96 × 96 logical cells with south, north, east, and west facings.
- Added idle, movement contact, and compact dodge key poses for every facing.
- Kept boots and the close-fitting default head layer in the base body while excluding weapons.
- Generated a separate twelve-frame Bastion helmet-and-visor overlay registered to the same grid.
- Integrated both sheets behind `?art=marine`, with `helmet=0` providing a direct modularity comparison.
- Converted the approved Bastion Service Rifle direction into a separate 64 × 32 gameplay asset used by every visible weapon instance in the art preview.
- Preserved source, chroma-key, extracted, and gameplay-sized assets under `art/production-tests/`.

## In progress

### Technical scaffold

**Status:** In progress — build and HTTP smoke verified; visual browser smoke pending

- Created an isolated Phaser 4.1, TypeScript, Vite, and Vitest project under `dev/`.
- Added development, typecheck, test, build, smoke, and combined verify commands.
- Configured production output for the exact `/play/last-bastion/` GitHub Pages route without deleting design documents or concept art.
- Built the tracked `index.html` and hashed `game-assets/` output.
- Verified the route, game root, and compiled JavaScript asset return HTTP 200.
- The in-app browser runtime could not initialise in the current environment, so visual canvas execution remains to be checked manually or in a later browser session.

Acceptance criterion remaining: visually load the canvas and confirm there are no runtime console errors.

### Art bible version 1

**Status:** In progress

- Record the approved Marine palette, armour language, silhouette, and pixel treatment.
- Completed for representative test: high three-quarter camera and 96 × 96 logical cells.
- Define base-body, helmet/hat, and visible-weapon layers.
- Define headgear and weapon attachment points for every direction and animation.
- Define preview rendering, depth sorting, outline, shading, and export rules.
- Define player, enemy, hazard, projectile, and pickup readability rules.
- Define shared animation state names with separate hero-specific body artwork.
- Define movement, dodge/roll/slide, hit, and defeat requirements.

Acceptance criterion: a second artist or generation session can create a compatible asset without guessing the visual rules.

### Modular equipment design

**Status:** In progress

- Completed: support zero to twelve equipped weapon records in the data model.
- Completed: render all equipped weapons around the character using calculated anchors.
- Completed: give every weapon independent runtime stats, cooldown, projectile origin, recoil pulse, and typed firing identity.
- In progress: evaluate one-, four-, six-, and twelve-weapon spacing and combat readability at gameplay scale.
- Use the same equipment state for gameplay, in-game visuals, and the loadout preview.
- Render helmets and hats as directional overlays aligned to the base-body animation.
- Keep boots visually baked into the base body even if footwear becomes an equipment category later.
- Treat twelve weapons as supported capacity; prove one weapon first and two to four weapons next.
- Define readable layout expansion, depth sorting, recoil, and targeting rules before enabling high weapon counts.
- Keep the dodge action contract shared while allowing hero-specific roll, slide, or dash presentation.
- Store evasive-move duration, distance, and invulnerability duration as hero secondary stats.
- Permit future items, perks, relics, and other systems to modify resolved values without mutating hero base data.

Review criteria:

- The player can identify their equipped weapons and headgear without opening inventory.
- The weapon ring remains readable while moving, aiming, firing, dodging, and overlapping enemies.
- The portrait/loadout preview cannot disagree with the in-game equipment state.
- Adding a new weapon or helmet does not require redrawing every hero combination.
- Supporting twelve weapons does not require twelve weapon slots to be enabled in the initial balance.

### Combat prototype: movement, aim, and Marine roll

**Status:** In progress

- Added responsive eight-direction placeholder movement.
- Added mouse aim through the shared intent layer.
- Added an independently rotating placeholder Service Rifle.
- Added the Marine's provisional 0.55-second, 4-metre roll with 0.25 seconds of invulnerability.
- Added arena boundaries and an on-screen state/stat readout.

Remaining before completion: visual runtime check and creator playtest feedback on movement, roll, firing, pressure, and readability.

### Early enemies and three-wave encounter

**Status:** In progress — implementation complete; balance and fairness playtest pending

- Wave 1 introduces Scuttlers.
- Wave 2 adds Egg Clusters that hatch into two Scuttlers after six seconds.
- Wave 3 adds Brain Blobs with visible colour-state telegraphs before lunging.
- Seeded spawn positions make test runs reproducible.
- Contact damage respects the Marine's resolved invulnerability window.

Acceptance criterion remaining: confirm through playtesting that combinations create movement decisions without unavoidable damage.

### XP and upgrade choices

**Status:** In progress — implementation complete; build-diversity playtest pending

- XP pickups attract and collect using a modifiable magnet radius.
- Level-up pauses the simulation and presents three clickable choices.
- Six upgrade definitions modify real weapon or pickup behaviour.
- Upgrade application is data-addressed with stable IDs.

Acceptance criterion remaining: demonstrate at least three recognisably different short-run builds in playtesting.

## Pending

### Internal playtest

**Status:** Pending

- Test onboarding, control clarity, responsiveness, difficulty, upgrade comprehension, and replay desire.
- Record observed behaviour rather than relying only on verbal feedback.
- Fix critical usability and fairness issues before adding scope.

Exit criterion: multiple testers voluntarily replay and can describe how their second build differed from their first.

### Representative art pipeline test

**Status:** In progress — Marine base-body and first helmet overlay implemented; gameplay-scale review pending

- Completed for first review: Marine base-body gameplay sheet with idle, move, and dodge key poses.
- Completed for first review: one aligned helmet overlay reflected in gameplay.
- One alien enemy.
- One terrain set.
- Assault-rifle representation plus attachment, recoil, rotation, and depth-sorting rules.
- A two-to-four weapon loadout readability test before considering higher counts.
- One HUD panel.
- Muzzle flash, impact, damage, death, dodge, XP, and level-up effects.

Acceptance criterion: the styled build remains more readable than the placeholder build during maximum prototype pressure.

## Deferred

The following remain deferred until their preceding scope gates succeed:

- Medic and additional heroes
- Full campaign map
- Shops, relics, rarity tiers, and inventory
- Persistent meta-currency and base management
- Companions, mutations, curses, and active items
- Extensive environmental hazards and status combinations
- Statistics, achievements, and leaderboards
- Steam packaging and platform integrations
- Android packaging, touch UI, billing, and Play Games services
- Godot evaluation or rewrite

## Working rules

- Build one verified system at a time.
- Do not generate large asset batches before the art bible and representative pipeline test are approved.
- Keep content definitions data-driven and use stable IDs from their first implementation.
- Keep rendering and engine-specific scene code separate from portable rules where practical.
- Test at actual gameplay scale; full-resolution concept art does not prove sprite readability.
- Add systems only when they support the current scope gate.
- Update this tracker whenever an item moves between Pending, In progress, Completed, Deferred, or Blocked.
- Record completion dates and the evidence used to accept each item.

## Immediate sequence

1. Complete Art Bible version 1 from the approved Marine direction.
2. Review the three weapon art-direction samples and record the accepted direction.
3. Specify modular base-body, helmet, weapon-ring, preview, and dodge-animation layers.
4. Scaffold the web project and verify nested GitHub Pages output.
5. Implement the input-intent layer and shared hero state machine.
6. Build placeholder movement, Marine roll, and shooting with one visible modular weapon.
7. Add Scuttlers, Egg Clusters, Brain Blobs, waves, XP, and upgrades.
8. Implement the zero-to-twelve weapon-ring foundation and independent weapon firing. **Completed.**
9. Review one-, four-, six-, and twelve-weapon layouts; tune spacing before replacing placeholders. **In progress.**
10. Run the combat-prototype playtest gate and representative gameplay art pipeline.
11. Decide whether to proceed to the vertical slice and higher weapon counts.
