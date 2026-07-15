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

**Current objective:** finish the technical visual smoke test, add Service Rifle firing, then introduce Scuttlers as the first combat target.

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

### Marine art-direction checkpoint

**Status:** Completed — 15 July 2026

- Approved the first Marine concept and its modern colourful pixel-art direction.
- Approved the compact practical armour language, navy/charcoal base, ivory panels, teal equipment lights, restrained orange accents, and amber visor.
- Preserved the approved concept under `art/concepts/marine-art-direction-v1.png`.
- Established the concept as an art-direction anchor rather than a production sprite sheet.

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
- Choose the gameplay camera angle and base sprite dimensions.
- Define base-body, helmet/hat, and visible-weapon layers.
- Define headgear and weapon attachment points for every direction and animation.
- Define preview rendering, depth sorting, outline, shading, and export rules.
- Define player, enemy, hazard, projectile, and pickup readability rules.
- Define shared animation state names with separate hero-specific body artwork.
- Define movement, dodge/roll/slide, hit, and defeat requirements.

Acceptance criterion: a second artist or generation session can create a compatible asset without guessing the visual rules.

### Modular equipment design

**Status:** In progress

- Support zero to twelve equipped weapon records in the data model.
- Render all equipped weapons around the character using calculated anchors.
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

Remaining before completion: visual runtime check, roll cooldown/readiness feedback, firing, damage feedback, defeat, restart, and pause behaviour.

## Pending

### Combat prototype: enemies and waves

**Status:** Pending

- Swarmer behaviour.
- Spitter behaviour with telegraphed projectiles.
- Seeded three-wave encounter.
- Spawn safety and pressure limits.
- Player damage, invulnerability feedback, and defeat.

Acceptance criterion: enemy combinations create movement decisions without unavoidable damage.

### Combat prototype: dodge

**Status:** Pending

- Directional dodge.
- Cooldown and readable availability.
- Clearly defined invulnerability or damage-reduction rule.
- Feedback that communicates start, active window, and recovery.

Acceptance criterion: testers can learn and intentionally use dodge without reading documentation.

### Combat prototype: XP and upgrades

**Status:** Pending

- XP drops and collection.
- Safe level-up presentation.
- Approximately six transformative upgrade choices.
- Data-driven upgrade definitions with stable IDs.
- Upgrade combinations that visibly change combat.

Acceptance criterion: at least three recognisably different builds can emerge during the short prototype.

### Internal playtest

**Status:** Pending

- Test onboarding, control clarity, responsiveness, difficulty, upgrade comprehension, and replay desire.
- Record observed behaviour rather than relying only on verbal feedback.
- Fix critical usability and fairness issues before adding scope.

Exit criterion: multiple testers voluntarily replay and can describe how their second build differed from their first.

### Representative art pipeline test

**Status:** Pending — begins after combat prototype and art-bible approval

- Marine base-body gameplay sprite and essential animations.
- One aligned helmet/hat overlay reflected in gameplay and the dynamic loadout preview.
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
8. Test two to four simultaneous weapons and their targeting/readability.
9. Run the combat-prototype playtest gate and representative gameplay art pipeline.
10. Decide whether to proceed to the vertical slice and higher weapon counts.
