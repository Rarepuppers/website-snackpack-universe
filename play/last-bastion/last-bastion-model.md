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

**Current objective:** creator-playtest and tune the implemented five-wave vertical slice with its gameplay-critical Batch C presentation.

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

### Representative Scuttler pipeline

**Status:** Completed — 15 July 2026; gameplay-scale approval pending under the art-pipeline gate

- Established an original low crustacean-like silhouette with six running legs, two short grasping claws, coral carapace, violet joints, pale claw tips, and yellow sensory markings.
- Produced a transparent 4 × 2 sheet using 64 × 64 logical cells.
- Added south, north, east, and west facings with alternating gait poses.
- Integrated runtime facing and independently offset gait timing behind the `?art=marine` preview switch.
- Preserved the placeholder triangle renderer for direct comparison.

### Egg Cluster and Brain Blob production-state pipeline

**Status:** Completed — 16 July 2026; gameplay-scale approval pending under the art-pipeline gate

- Added a four-stage Egg Cluster sheet: dormant, pulsing, cracked, and ruptured/empty.
- Connected Egg Cluster frames to normalized six-second hatch progress.
- Added a four-state Brain Blob sheet: drift, yellow wind-up, directional lunge, and exhausted recovery.
- Connected Brain Blob frames directly to its simulation phase and rotated the east-authored attack toward the player.
- Added portable visual-state mapping helpers with five focused tests.
- Expanded verification to 35 passing tests across seven test files.

### Defensive statistics and damage-type foundation

**Status:** Completed — 16 July 2026; balance tuning pending playtest

- Added a shared `DefenceProfile` stat schema (`dev/src/game/stats/DefenceStats.ts`) used by heroes and enemies.
- Implemented dual armour by design: percentage armour with diminishing returns (`armour / (armour + 15)`, ~6.25% for the first point) plus a rarer flat per-hit reduction applied after the percentage step with a 1-damage floor.
- Implemented shields absorbed before armour and health, with recharge delay/rate; Aegis overshield persists but does not recharge.
- Promoted hit invulnerability (0.65 s), attack speed, and slow resistance to hero stats; reserved weapon proficiency (light/medium/heavy/unique) and mineral-find fields until they can matter.
- Added five damage types (Physical, Fire, Shock, Cryo, Toxic) on weapons, per-enemy resistance multipliers, and status buildup (threshold 40) triggering Blaze, Overload, Freeze, and Corrode with authored rules; mini-bosses resist hard control only.
- Weapons now declare displayName, description, weapon class, and damage type (Arc Carbine is the first Shock weapon).

### Five-wave vertical slice, rewards, powerups, and new enemies

**Status:** Completed — 16 July 2026; encounter tuning and creator playtest pending

- Expanded the run to five seeded waves: wave 3 adds Blast Mites, wave 4 adds Warp Flankers plus the Carapace elite, wave 5 is the Siege Crusher finale with escorts.
- Added a generic pending-decision flow (upgrade / weapon chest / supply depot) sharing one overlay; the simulation pauses during any decision.
- Weapon Chest after waves 1 and 3 offers unowned catalogue weapons and falls back to an upgrade choice when everything is owned.
- Supply Depot after waves 2 and 4 offers Patch Up (heal 45), Field Armoury (immediate upgrade choice), or Aegis Lattice (25 shield).
- Implemented the timed powerup system: one seeded pickup per wave from wave 2 (Overcharge, Magnet Pulse, Adrenaline, Aegis cycle), 12-second ground lifetime, HUD buff timers and shield readout.
- Implemented the Blast Mite (kamikaze: armed flashing tell, detonation on proximity or death) and Warp Flanker (stalk, telegraphed arrival ring, teleport, materialise window); their state-authored Batch C sheets are integrated.
- Verification evidence: TypeScript check, 81 tests across twelve files (up from 63), production build, and the HTTP smoke pass with 19 asset checks and 11 review routes.

### Gamepad, local persistence, and representative audio hooks

**Status:** Completed — 16 July 2026; physical-controller feel test pending (no controller was available in the implementation environment)

- Added a pure twin-stick gamepad mapper (`dev/src/game/input/GamepadIntentMapper.ts`): left stick move, right stick aim with fire past a 0.5 threshold (or R1/R2), south button dodge/restart, start pause, scaled radial deadzone, and keyboard-JustDown-style edge triggering — all unit-tested without a controller.
- Keyboard/mouse and gamepad merge in the existing intent adapter; whichever device actively provides a vector wins, so both can be used interchangeably mid-run. The Phaser gamepad plugin is enabled in the game config.
- Added versioned local persistence (`dev/src/game/save/LocalSaveStore.ts`): schema v1 with settings (screen shake, sound) and progress (runs finished, victories, best wave). Corrupt or foreign-version payloads fall back to defaults; storage failures degrade to in-memory. Run outcomes autosave on victory/defeat for normal runs only (never for stress or scenario routes).
- `?shake=0|1` and `?sound=0|1` persist settings until a real settings screen exists; the screen-shake setting now gates every camera shake. Verified in-browser: the versioned save is written and reloaded.
- Added representative audio: a pure combat-event → cue map (`dev/src/game/audio/AudioCueMap.ts`) covering rifle fire, impacts, alien deaths, explosions, player damage, dodge, XP, level-up, statuses, powerups, boss moments, and UI confirm, played through a lazy WebAudio placeholder synthesizer with per-frame duplicate suppression. Production audio files later replace cues via the same event → id lookup.
- Verification evidence: TypeScript check, 94 tests across fifteen files, production build, and the HTTP smoke pass.

### Twelve upgrades, Marine passive/ultimate, and the electric-fence signature interaction

**Status:** Completed — 16 July 2026; balance and feel tuning pending playtest

- Expanded the upgrade rotation from six to twelve: the original six plus Incendiary Rounds (weapons convert to Fire), Cryo Coating (Cryo conversion), Chain Lightning (+1 arc on any weapon), Adrenal Servos (+12% move speed), Composite Plating (+3 armour), and Shield Capacitor (+15 recharging shield). Conversions and stat picks exercise the damage-type and defence systems.
- Implemented the Marine passive **Entrenched**: standing still for one second grants +3 armour until moving, surfaced on the HUD.
- Implemented the Marine ultimate **Bastion Barrage**: R or the top gamepad button fires a twelve-projectile radial explosive volley on a 24-second cooldown with HUD readiness, camera flash, and an audio cue.
- Implemented the signature battlefield interaction: a power switch (interact key/button within range) energizes an arena fence line for six seconds; enemies crossing take continuous Shock damage that builds toward Overload, and the fence recharges over eighteen seconds. The fence is data-driven per arena (`ArenaDefinition.fence`); arenas without one simply have no interactable.
- Batch C presentation supplies authored pylons, switch states, energized beam, zap feedback, and the live proximity prompt.
- Verification evidence: TypeScript check, 103 tests across sixteen files, production build, and the HTTP smoke pass.

### Scrolling arena, sharp UI, and Siege Crusher enrage

**Status:** Completed — 16 July 2026; creator scale/readability and balance review pending

- Expanded the Bastion arena from exactly one viewport to 45 × 25.3125 metres (1.5× the viewport on each axis), added distributed cover, and enabled smooth bounded camera follow with a dead zone.
- Made combat HUD, boss bar, controls, pause/result panels, and decision overlays camera-fixed.
- Raised live HUD/decision text texture resolution, adopted a desktop monospace stack with controlled stroke, and replaced heavily stretched level-up card bitmaps with sharp scalable panel/button surfaces.
- Increased Siege Crusher base pursuit speed and added health-tier tuning: radial slam unlocks at 50% health; the final 20% shortens tells/recovery and raises movement, charge, sweep, shockwave radius, and damage.
- Locked the future seeded mini-boss pool to fully implemented candidates only: Siege Crusher, Brood Warden, and Rift Stalker are the initial design targets, each with two to four moves and documented enrage behavior.
- Confirmed the Slime Spitter as the current projectile enemy and added a durable Codex instruction to produce body plus projectile/warning/impact assets together for every future ranged enemy.
- Added the Steam-portable asset quality floor to the art bible: retained high-resolution masters, reproducible normalization, non-stretched UI contracts, and 1080p-safe dynamic text.
- Verification evidence: 106 tests across 16 files, TypeScript validation, production build, 23 asset checks, and 12 review routes.

### Seeded mini-boss pool and Brood Warden encounter

**Status:** Completed — 16 July 2026; production art and creator balance review queued

- Expanded the live seeded mini-boss pool from Siege Crusher alone to two mechanically complete entries: Siege Crusher and Brood Warden. Rift Stalker remains design-only and cannot be selected.
- Added the Brood Warden as a slightly faster 2,700-health encounter with four telegraphed moves: close guarding cleave, acid projectile fan, capped egg placement, and a one-time half-health swarm rush.
- Added final-20-percent frenzy tuning with shorter tells/recovery, faster movement, wider cleave, five acid shots, three eggs, and a six-add rush.
- Reused the established egg hatch, hostile-projectile/cover collision, generic mini-boss reward, boss HUD, telegraph, event, audio, and deterministic scenario systems.
- Added a dedicated `scenario=brood-warden` review route with a distinct temporary code-art silhouette and dynamic boss identity; it intentionally does not reuse the Siege Crusher portrait.
- Rules coverage locks pool selection boundaries, health thresholds, the half-health rush/add count, and the complete cleave/acid/egg move cycle.
- Verification evidence: 110 tests across 16 files, TypeScript validation, production build, 23 runtime asset checks, and 13 review routes.

### Ripper behavior gate

**Status:** Completed — 16 July 2026; production art integrated and creator gameplay-scale review queued

- Added the Ripper as a 72-health, lightly armoured melee bruiser with slower pursuit and low incidental contact damage.
- Implemented a locked-direction 0.62-second wind-up, 2.55-metre frontal cone sweep, 18 sweep damage, short active phase, and 1.1-second stationary recovery window.
- Added a deterministic `scenario=ripper` lab, exact cone telegraph, sweep event/audio feedback, and `RIPPER LAB` HUD identity.
- Replaced the phase-driven prototype shape with the Production Batch D2 directional/state sheet plus authored spawn, sweep, and defeat effects. The exact code-driven cone remains authoritative for fair hit detection and warning geometry.
- Kept the Ripper out of ordinary waves until creator review confirms its tell, reach, dodge-behind behavior, and recovery punishment are readable at gameplay scale.
- Rules coverage verifies cone front/back/side/range boundaries and the pursuit → wind-up → sweep → recovery sequence.
- Verification evidence: 114 tests across 16 files, TypeScript validation, production build, 28 runtime asset checks, and 16 review routes.

### Quillback behavior gate

**Status:** Completed — 16 July 2026; production art integrated and creator gameplay-scale review queued

- Added the Quillback as a 46-health, lightly armoured ranged lane controller with low contact damage and deliberate repositioning.
- Implemented locked-aim volleys escalating from one to three to five spikes across a fixed 64-degree fan. Wider volleys receive longer wind-up and recovery rather than a hidden fire-rate increase.
- Disabled point-blank firing: inside 4.5 metres the Quillback retreats, and it may only begin charging from 4.75–10.5 metres.
- Added continuous spike/player segment collision, cover interception, visible fan-line telegraphs, projectile and impact feedback, audio identity, `QUILLBACK LAB` HUD identity, and a deterministic `scenario=quillback` route.
- Replaced the behavior-gate shapes with Production Asset Batch E1: twelve directional positioning/wind-up/recovery body frames, separate rotated spike projectiles, launch accents, distinct cover/flesh impacts, and defeat presentation. Exact fan paths remain code-driven.
- Kept the Quillback out of ordinary waves until creator review confirms spike speed, dodge gaps, telegraph duration, minimum range, and five-shot pressure are fair at gameplay scale.
- Rules coverage locks the 1 → 3 → 5 escalation, symmetric 64-degree fan with intentional gaps, and close-range retreat rule.
- Verification evidence: 118 tests across 16 files, TypeScript validation, production build, 30 runtime asset checks, and 18 review routes.

### Spinewheel reflection-physics behavior gate

**Status:** Completed — 17 July 2026; production art integrated and creator gameplay-scale review queued

- Added the Spinewheel as a 58-health, lightly armoured ricochet disruptor with low incidental contact damage and deliberately slow pre-attack positioning.
- Implemented a locked-heading 0.70-second warning, 7 m/s roll, deterministic wall and active-cover reflection, exactly two rebounds with 15% speed decay per rebound, a 3.2-second roll safety limit, and a 1.50-second exposed recovery.
- Separated rolling impact from ordinary contact damage and added a 0.75-second per-Spinewheel repeat-hit lockout. Continuous movement-segment testing prevents a fast roll from skipping over the Marine.
- Added typed wind-up, rebound, rolling-hit, and recovery events; synthesized audio identity; exact code-driven heading line; phase styling; `SPINEWHEEL LAB` HUD identity; and deterministic `scenario=spinewheel` review route.
- Replaced the behavior-gate triangle with Production Asset Batch E2: twelve directional positioning/wind-up/recovery body frames, a separate four-phase rotation-neutral closed shell, and authored curl, trail, rebound, impact, recovery, and defeat effects.
- Reflection is isolated in a pure fixed-step module with wall, obstacle-axis, heading-lock, rebound-decay, and complete-cycle rules coverage. Destroyed cover automatically stops participating through the existing active-obstacle contract.
- Kept the Spinewheel out of ordinary waves until creator review confirms warning length, first-pass fairness, rebound readability, impact strength, and recovery duration.
- Verification evidence: 123 tests across 17 files, TypeScript validation, production build, 33 runtime asset checks, and 20 review routes.

### Tether Bloom forced-movement behavior gate

**Status:** Completed — 17 July 2026; Production Asset Batch E3 integrated and creator control/readability review queued

- Added the Tether Bloom as a stationary 52-health, non-damaging control enemy with toxic resistance and no contact attack.
- Implemented clear-line acquisition within 3.5 metres, a locked-target 0.70-second warning, a 1.15 m/s additive pull lasting at most 1.8 seconds, and a hard 5-metre range cap. Movement, aiming, firing, and interaction remain enabled throughout.
- Cover blocks acquisition and severs an active tether. Dodge/roll breaks immediately, while 28 post-mitigation damage accumulated during the grab provides the offensive escape route.
- Enforced one reserving or controlling Bloom per player so simultaneous plants cannot chain or stack forced movement. Success, failed acquisition, range break, damage break, and evasive break all lead to a 3.2-second recovery.
- Added typed wind-up, latch, break-reason, and natural-release events; synthesized audio; code-driven acquisition radius and tendril; `TETHERED` HUD state; `TETHER LAB` identity; and deterministic `scenario=tether-bloom` route.
- Integrated a 16-frame production body sheet across idle, acquisition, channel, and recovery plus eight authored control effects. The long tether, acquisition radius, target point, cover interception, pull, and break geometry remain authoritative code.
- Rules coverage verifies cover intersection, single-controller arbitration, retained movement input, non-damaging operation, evasive break, damage-threshold break, and hard-range cancellation.
- Kept the Bloom out of ordinary waves until creator review confirms the pull feels threatening without feeling like input theft.
- Verification evidence: 129 tests across 17 files, TypeScript validation, production build, 35 runtime asset checks, and 22 review routes.

### Razor Scuttler interceptor behavior gate

**Status:** Completed — 17 July 2026; Production Asset Batch D4 and creator timing/readability review queued

- Added a fragile 16-health interceptor with 3.35 m/s positioning speed, no ordinary contact damage, and modest Cryo vulnerability.
- Implemented a locked 0.48-second lane warning followed by a 9.5 m/s, 0.55-second committed dash. The Razor must first reach the 2.6–7.5 metre acquisition band, preventing point-blank instant launches.
- The dash can damage the Marine only once. A player hit, wall/cover crash, or clean miss immediately enters a stationary recovery; cover crashes use the longest 1.4-second punish window.
- Added typed warning, dash, and reason-specific impact events; synthesized audio; code-driven lane rendering; phase-colour placeholder presentation; `RAZOR LAB` identity; and deterministic `scenario=razor-scuttler` route.
- Rules coverage locks warning direction, verifies miss recovery, verifies cover interruption, and proves one-hit dash safety through recovery.
- Kept the Razor out of normal waves until its warning length, speed, collision read, and recovery punish window pass creator review.
- Verification target: 137 tests across 17 files, TypeScript validation, production build, 40 runtime asset checks, and 25 review routes.

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
- Wave 3 adds Brain Blobs with visible colour-state telegraphs before lunging and two Slime Spitters with locked-target glob tells.
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

**Status:** In progress — five-wave implementation and gameplay-critical Batch C presentation complete; creator playtest next

- Test onboarding, control clarity, responsiveness, difficulty, upgrade comprehension, and replay desire.
- Record observed behaviour rather than relying only on verbal feedback.
- Fix critical usability and fairness issues before adding scope.

Exit criterion: multiple testers voluntarily replay and can describe how their second build differed from their first.

### Representative art pipeline test

**Status:** In progress — Marine base-body and first helmet overlay implemented; gameplay-scale review pending

- Completed for first review: Marine base-body gameplay sheet with idle, move, and dodge key poses.
- Completed for first review: one aligned helmet overlay reflected in gameplay.
- Completed for first review: one animated four-facing Scuttler gameplay sheet.
- Completed for first review: simulation-driven Egg Cluster and Brain Blob state sheets.
- Completed: deterministic authored tiled arena floor, boundary set, four obstacle types, collision, and depth rules; damaged obstacle frames are retained for later destruction gameplay.
- Completed for first review: assault-rifle representation plus attachment, recoil, rotation, and depth-sorting rules.
- Completed foundation: four-weapon normal stress route and twelve-weapon capacity stress route.
- Completed foundation: camera-safe HUD, scalable health/XP/roll bars, twelve weapon markers, upgrade cards, and pause/victory/defeat panels.
- Completed: pooled authored muzzle, projectile, impact, damage, death, dodge, XP, level-up, spawn, hatch, explosion, and obstacle-hit effects.

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
9. Implement styled arena, HUD, pooled effects, gallery, and four-/twelve-weapon stress routes. **Completed.**
10. Run the combat-prototype playtest gate and representative gameplay art pipeline.
11. Decide whether to proceed to the vertical slice and higher weapon counts.

## Production batch status

### Large implementation: styled combat presentation and arena foundation

**Status:** Completed — 16 July 2026; automated visual browser capture unavailable in the current environment

- Completed: data-driven manifest with stable IDs, URLs, logical sizes, frame counts, and pivots for all six production-test assets.
- Completed: authored animation/state clocks, hit/death presentation, spawn tells, hatch tells, and shared world-depth rules.
- Completed: deterministic tiled arena with boundary walls, four readable obstacle types, player/enemy collision, and projectile blocking.
- Completed: camera-safe HUD with scalable health, XP, and roll bars; twelve weapon markers; upgrade cards; and pause/victory/defeat panels.
- Completed: bounded effect pool for muzzle flashes, impacts, enemy deaths, XP collection, level-up, roll trails, spawn/hatch bursts, explosions, and obstacle strikes.
- Completed: production-art debug gallery covering every authored frame, manifest pivot, state, and representative 1/4/12 weapon arrangements.
- Completed: deterministic mixed-enemy `stress=4` readability scene and `stress=12` capacity scene.
- Completed: styled renderer is now the default; `art=placeholder` preserves the comparison renderer.
- Verification evidence: 47 passing tests across nine files, TypeScript check, production build, six HTTP route checks, and twelve required-art HTTP checks.

Review routes are documented in `dev/README.md`. The in-app browser runtime could not initialise in the current environment, so final visual acceptance remains a manual review gate rather than an implementation gap.

### Production asset batch A: arena and combat readability

**Status:** Completed and integrated — 16 July 2026; creator gameplay-scale review queued

- Arena floor tiles: clean base, two subtle variants, seams, damaged panel, organic contamination edge.
- Boundary set: north/south/east/west walls, inner/outer corners, one closed bulkhead, one damaged breach.
- Obstacles: low barricade, cargo crate, power conduit, alien biomass mound; intact states are active and paired damaged states are reserved for destruction gameplay.
- Character effects: Marine ground shadow, roll trail, protected-frame shimmer, hit flash mask, defeat burst.
- Weapon effects: Service Rifle muzzle flash, tracer/projectile, impact spark, critical impact, explosive impact ring.
- Enemy effects: Scuttler spawn and death burst; Egg pulse glow, crack flash, hatch burst; Brain wind-up aura, lunge streak, recovery particles, death burst.
- Pickups: XP shard with two-frame shimmer, health pickup seed, upgrade/relic pickup placeholder.
- HUD: health frame/fill, XP frame/fill, roll-ready icon/bar, weapon-slot marker, wave banner, three upgrade-card backgrounds, pause/victory/defeat panels.
- Completed contract: stable IDs, transparent backgrounds, intended logical sizes, centered pivot metadata, nearest-neighbour runtime atlases, and no baked text.

Completion evidence:

- Six locked runtime atlases provide 52 frames: floor (6), boundaries (8), obstacles (8), effects (20), pickups (4), and HUD panels (6).
- The manifest records stable IDs, logical sizes, frame counts, centered pivots, and versioned URLs for all Batch A assets.
- Default gameplay now renders authored terrain, walls, obstacles, shadow, projectiles, pickups, event effects, status panels, wave banner, upgrade cards, and run-state modal.
- Placeholder art remains available through `?art=placeholder`; the complete batch is visible at `?mode=gallery&batch=a`.
- Source chroma sheets, transparent extractions, normalized atlases, frame order, and the repeatable normalization script are retained under `art/production-tests/batch-a/`.
- Automated acceptance: 47 unit tests across nine files and TypeScript validation passed before the final production build and HTTP smoke pass.

Batch acceptance criterion: the styled stress scene remains readable with four normal weapons, mixed Wave 3 enemies, active telegraphs, pickups, and simultaneous combat effects. Twelve weapons remain a separate capacity stress case.

## Remaining production roadmap

### Gate 1 acceptance and tuning

**Status:** Pending — creator gameplay-scale review remains open

- Creator review of normal, `stress=4`, `stress=12`, Batch A gallery, and placeholder comparison routes.
- Record movement, aiming, roll timing, weapon-ring readability, enemy tells, pickup visibility, and effect overlap findings.
- Tune the existing three-wave encounter and demonstrate three distinct upgrade builds.
- Close the representative art-pipeline and combat-prototype acceptance gates.

Do not queue Production Asset Batch C until critical readability corrections and the reward-state contracts are known.

### Vertical-slice systems foundation

**Status:** In progress — five-wave implementation and gameplay-critical Batch C presentation complete; creator playtest next

- Completed: replaced Service-Rifle-only assumptions with data-driven targeting, attack-pattern, range, projectile, knockback, and chain contracts.
- Completed: functional Scattergun five-pellet spread/knockback and Arc Carbine nearest-target/chain behaviours.
- Completed: Slime Spitter positioning/wind-up/recovery states, hostile glob projectiles, obstacle impacts, direct-hit damage, and target telegraphs.
- Completed: four-second slowing puddles with visible decay, five-puddle fairness cap, 55% ordinary-movement multiplier, and unaffected evasive displacement.
- Completed: reusable standard/elite rank metadata, Carapace directional armour/facing rules, charge phases, and guaranteed elite upgrade-cache rewards.
- Completed: reusable mini-boss rank, Siege Crusher phase/health presentation, attack telegraphs, destructible-cover state, and guaranteed arsenal reward.
- Completed 16 July 2026: seeded five-wave encounter with intermission rewards (weapon chest and Supply Depot), weapon acquisition with duplicate exclusion, defensive statistics, damage types/statuses, powerups, Blast Mite, and Warp Flanker (see the dedicated completed entries above).
- Completed 16 July 2026: gamepad input, settings/progress persistence, and representative audio hooks (see the dedicated completed entry above).
- Completed 16 July 2026: twelve upgrades, Marine passive and ultimate, and the electric-fence signature interaction — every Gate 2 code inclusion now exists.
- Remaining for Gate 2: creator playtest/tuning of the five-wave slice, a physical-controller feel pass, production audio to replace the placeholder synth cues, and Batch C art.

Acceptance criterion: Scattergun, Arc Carbine, Slime Spitter, Carapace Scuttler, and Siege Crusher function with state-authored production art and automated rules tests before encounter-budget expansion.

Weapon-foundation checkpoint — completed 16 July 2026:

- Mixed loadouts use stable weapon IDs and isolated mutable runtime stats.
- `?loadout=vertical`, `?loadout=scattergun`, and `?loadout=arc-carbine` provide deterministic review routes.
- Ring sprites, projectiles, HUD markers, muzzle events, and chain arcs now use their distinct Batch B families.
- Verification evidence: 53 tests across ten files, TypeScript validation, production build, twelve asset HTTP checks, and seven review-route checks.

Slime-Spitter checkpoint — completed 16 July 2026:

- Wave 3 introduces two Slime Spitters after the existing movement and lunge lessons.
- `?scenario=slime-spitter&loadout=vertical` provides a deterministic hostile-projectile/hazard review lab.
- Simulation snapshots expose hostile projectiles, timed ground hazards, slow state, Spitter phase, and locked target without coupling rules to Phaser.
- Production rendering supplies the directional state sheet, target marker, glob, puddle decay, Marine slow feedback, and debug counts; `art=placeholder` preserves the comparison renderer.
- Verification evidence: 56 tests across ten files plus TypeScript, production build, twelve asset checks, and eight review routes.

Carapace-Elite checkpoint — completed 16 July 2026:

- Elite state is orthogonal to base enemy type, allowing an upgraded Scuttler to retain existing movement/render contracts without becoming a duplicate standard archetype.
- Frontal direct-projectile damage is reduced to 25%; rear hits and the post-charge recovery window take full damage.
- The elite cycles through pursuit, visible wind-up, committed charge, and 1.05-second recovery states.
- Defeat guarantees an elite upgrade cache; collection enters the existing deterministic three-choice upgrade flow.
- `?scenario=carapace-elite&loadout=vertical` isolates armour, flanking, charge timing, and reward collection.
- Production presentation uses the larger state-authored body and authored armour impact; the pulsing reward cache remains a Batch A pickup until reward-state art is defined.
- Verification evidence: 59 tests across ten files plus TypeScript, production build, twelve asset checks, and nine review routes.

Siege-Crusher checkpoint — completed 16 July 2026:

- Mini-boss rank and kind are separate from standard and elite definitions, with snapshot-driven phase, health, facing, and attack direction.
- Siege Crusher cycles through entrance, stalk, charge tell, committed charge, sweep tell, sweep, and 1.15-second recovery states.
- Charge impacts damage cover, create debris shockwaves, and destroy cover after the second impact; destroyed obstacles leave collision as well as rendering.
- The HUD exposes a dedicated boss health/phase bar and the world renderer exposes charge lanes, sweep radius, phase colour, shockwaves, and damaged/destroyed obstacle states.
- Defeat guarantees a mini-boss arsenal cache that heals 30 health and grants two upgrade thresholds.
- `?scenario=siege-crusher&loadout=vertical` isolates the complete fight and reward loop with the Crusher sheet, portrait, sweep, shockwave, armour, and defeat effects.
- Verification evidence: 62 tests across ten files plus TypeScript, production build, twelve asset checks, and ten review routes.

### Production Asset Batch B: vertical-slice combat roster

**Status:** Completed and integrated — 16 July 2026; creator gameplay-scale review queued

- Two weapon families: Scattergun and Arc Carbine, including ring sprites, icons, projectiles, impacts, and signature effects.
- Slime Spitter directional/state art, glob projectile, slowing puddle stages, and dissolve effect.
- Carapace Scuttler elite silhouette/telegraph additions.
- Siege Crusher mini-boss body and attacks, portrait, boss bar treatment, obstacle damage, entrance, hit, and defeat effects.
- Gallery coverage, stable manifest contracts, gameplay integration, stress routes, and HTTP asset verification.

Completion evidence:

- Seven runtime assets provide 63 visuals: two weapon images, 12 Spitter frames, 16 Carapace frames, 12 Crusher frames, 20 signature-effect frames, and one Crusher portrait.
- Production gameplay now uses distinct Scattergun and Arc Carbine ring sprites/projectiles/muzzle effects; state-authored Spitter, Carapace, and Crusher sheets; authored slime/armour/sweep/shockwave/defeat effects; and the Crusher HUD portrait.
- Creature sheets use shared nearest-neighbour scale, stable four-direction column order, state-driven row selection, and cleaned cell boundaries.
- Source chroma sheets, transparent masters, runtime assets, frame contracts, prompt summary, and the repeatable normalizer are retained under `art/production-tests/batch-b/`.
- `?mode=gallery&batch=b` displays the complete batch; deterministic scenario routes isolate the Spitter, Carapace, and Crusher behaviours.
- Automated acceptance: TypeScript, 63 tests across ten files, production build, 19 asset HTTP checks, and 11 route checks passed.

### Vertical-slice reward and interaction loop

**Status:** Mostly completed — 16 July 2026

- Completed: Weapon Chest reward decision (upgrade chest behaviour continues via elite caches and the chest's upgrade fallback).
- Completed: one Supply Depot decision with heal, immediate upgrade, and shield choices.
- Completed: pickup timers and HUD indicators for temporary powerups.
- Pending: decide the same-run shop currency before enabling Scrap; do not award unusable currency (mineral-find stat stays inert until then).
- Pending: validate through playtest that reward choice time improves build planning without repeatedly interrupting combat.

### Production Asset Batch C: rewards, battlefield interaction, and new combat art

**Status:** Gameplay-critical subset completed and integrated — 16 July 2026; creator gameplay-scale review queued

- Completed: 12-frame Blast Mite sheet and 12-frame Warp Flanker sheet with simulation-driven state selection.
- Completed: 16-frame reward atlas covering Weapon Chest, Supply Depot, four world powerups, and four HUD icons.
- Completed: 20-frame effect atlas covering statuses, shield impact, electric fence, Bastion Barrage, Blast Mite, and Warp presentation.
- Completed: production world powerups, decision icons, HUD buff icons, authored switch/pylons/beam, event effects, stable manifest contracts, Batch C gallery, and HTTP asset verification.
- Deferred until consuming systems exist: Supply Drop, six Relics, three Artifacts, and three Shrines. Do not generate inventory or state variants that gameplay cannot validate.
- Acceptance evidence: 104 tests across 16 files, TypeScript validation, production build, 23 asset checks, and 12 review routes.

### Web MVP route and progression loop

**Status:** Deferred until the vertical-slice gate succeeds

- Ten-wave run and small branching route with Combat, Elite, Shop, Rest, Shrine, and Boss nodes.
- Nine ordinary/hero weapons plus Event Horizon as the first Unique.
- Ripper, Razor Scuttler, Brood Tender, and additional approved elites; Brood Warden is already integrated in the vertical-slice pool.
- Run-long Relics, one equipped Artifact, autosave between encounters, menus, route/shop/rest screens, and useful unlocks.
- One complete final boss: The Bastion Eater, with three readable phases and a 3–5 minute target fight.

### Production Asset Batch D1: Brood Warden mini-boss

**Status:** Completed and integrated — 16 July 2026; creator gameplay-scale review queued

- Completed: Steam-quality retained masters exceed 4× logical resolution and normalize to a transparent 128 × 128 body sheet, 128 × 128 portrait, and 64 × 64 effects atlas.
- Completed: four facings across stalk/idle, attack/wind-up, and hurt/enraged/defeat rows with consistent pivots and no baked shadows, text, UI, weapons, or ground effects.
- Completed: ten effect frames cover acid projectile/fan/impact, egg-lay pulse, cleave tell/arc, swarm-rush lane/burst, enrage, and defeat.
- Completed: source prompts, chroma provenance, large transparent masters, frame map, deterministic normalizer, nearest-neighbour runtime outputs, manifest contracts, gameplay bindings, and Batch D gallery are retained.
- Verification evidence: 111 tests across 16 files, TypeScript validation, production build, 26 runtime asset checks, and 14 review routes.

### Production Asset Batch D2: Ripper enemy

**Status:** Completed — 16 July 2026; creator gameplay-scale review queued

- Completed a retained `1448 × 1086` body master, normalized to a 4 × 4 sheet of 96 × 96 cells.
- Directional columns are south, north, east, west; rows are pursuit, wind-up, active sweep, and exposed recovery.
- Completed a retained `1774 × 887` 4 × 2 effect master, normalized to 64 × 64 cells: cone warning, paired-claw glint, active sweep, impact, recovery vulnerability, spawn, hit, and defeat.
- Preserved the final prompts, chroma sources, transparent review masters, deterministic normalizer, pivots, frame map, and nearest-neighbour runtime outputs. The body sheet has no baked shadow, telegraph, text, or UI.
- Integrated stable manifest IDs, gameplay bindings, `batch=d2` gallery coverage, asset-contract tests, production build output, and HTTP smoke checks.

### Production Asset Batch D3: Bastion Eater final boss

**Status:** Bastion Eater subset completed and integrated — 17 July 2026; creator boss-scale/timing review queued

- Completed the Bastion Eater deterministic behavior gate: Breach claw/charge cycle, Brood tendril/egg cycle, accelerated Last Stand combinations, locked warnings, cover damage, capped eggs, safe inner tendril pocket, targeted breach zones, exposed-node damage windows, and victory transition.
- Completed 12 body frames, eight node states, 12 effects, eight breach/vault objects, and one portrait with retained chroma/transparent masters, prompt provenance, deterministic normalization, manifest contracts, gameplay bindings, gallery, and smoke routes.
- Brood Warden and Ripper remain in D1 and D2; D3 does not duplicate them. Remaining Web MVP standard/elite monsters are deferred to behavior-first batches.
- Do not generate second-biome bosses during the Web MVP.
- Verification evidence: 133 tests across 17 files, TypeScript validation, production build, 40 runtime asset checks, and 24 review routes.

### Production Asset Batch E1: Quillback ranged enemy

**Status:** Completed and integrated — 16 July 2026; creator gameplay-scale review queued

- Completed one retained `1448 × 1086` master normalized to a 4 × 3 directional/state sheet of 96 × 96 cells: positioning/retreat, charged wind-up, and recovery across south, north, east, west.
- Completed one retained `1774 × 887` 4 × 2 effect master normalized to 64 × 64 cells: single spike, charged muzzle cluster, three-spike fan accent, five-spike fan accent, cover impact, flesh impact, hit burst, and defeat burst.
- Spikes remain separate east-authored projectiles rotated at runtime; fan geometry and warning lines remain code-driven so visuals cannot disagree with damage paths.
- Preserved final prompts, chroma sources, transparent masters, normalizer, pivots, frame map, nearest-neighbour outputs, manifest contracts, E1 gallery coverage, gameplay bindings, and HTTP verification.

### Production Asset Batch E2: Spinewheel ricochet enemy

**Status:** Completed and integrated — 17 July 2026; creator gameplay-scale review queued

- Completed one 4 × 3 directional body sheet at 96 × 96 cells: positioning, heading-lock wind-up, and exposed recovery across south, north, east, and west.
- Completed one four-frame rotation-neutral shell-spin strip at 96 × 96 cells. Runtime rotation and movement remain code-driven; no direction line, trail, shadow, wall, or arena surface is baked into the shell.
- Completed one 4 × 2 effect atlas at 64 × 64 cells: curl accent, rolling trail segment, wall spark, cover chip, Marine impact, speed-loss pulse, recovery break-open, and defeat burst.
- Retained chroma provenance, large transparent masters, clean alpha, consistent pivots, nearest-neighbour runtime exports, prompts, deterministic normalizer, manifest contracts, E2 gallery, gameplay bindings, and HTTP verification.
- Exact heading telegraph and collision geometry remain code-driven. Production effects reinforce but do not redefine the authoritative path.

### Production Asset Batch E3: Tether Bloom control enemy

**Status:** Completed and integrated — 17 July 2026; creator gameplay-scale review queued

- Completed one 4 × 4 phase-animation sheet at 96 × 96 cells. Rows are rooted idle, acquisition wind-up, active tether channel, and exhausted recovery; columns are four looping animation phases rather than facings because the plant is stationary and the exact tendril direction is code-driven.
- Completed one 4 × 2 effect atlas at 64 × 64 cells: acquisition pulse, target endpoint, latch knot, taut-line travelling accent, evasive sever, damage sever, recovery wilt, and defeat burst.
- Integrated body phases and every authored effect into the deterministic behavior lab while keeping the tendril beam, acquisition circle, target lock, cover interception, and break geometry code-driven.
- Retained large transparent masters, chroma provenance, consistent root pivot, clean alpha, nearest-neighbour runtime exports, the exact prompt set, frame map, deterministic normalizer, manifest contracts, and E3 gallery for Steam-quality reuse.

## Revised implementation order

1. Run and record Gate 1 creator playtest/readability review.
2. Fix critical movement, combat, telegraph, HUD, or asset-scale issues found in that review.
3. Implement generic weapon attack/targeting behaviours with placeholder Scattergun and Arc Carbine. **Completed.**
4. Implement ranged projectiles and bounded slowing hazards with a placeholder Slime Spitter. **Completed.**
5. Implement elite armour/reward rules and placeholder Carapace Scuttler. **Completed.**
6. Implement mini-boss encounter support and placeholder Siege Crusher. **Completed.**
7. Generate, normalize, integrate, gallery-test, and verify Production Asset Batch B. **Completed.**
8. Expand to a five-wave vertical slice with weapon/upgrade rewards and one Supply Depot decision. **Completed 16 July 2026** (with defensive stats, damage types/statuses, powerups, Blast Mite, and Warp Flanker); tuning playtest still open.
9. Generate and integrate the gameplay-critical Production Asset Batch C subset. **Completed 16 July 2026.** Defer Supply Drop/Relic/Artifact/Shrine art until their systems exist.
10. Implement Brood Warden behavior and seed it into the eligible mini-boss pool. **Completed 16 July 2026.**
11. Generate, normalize, integrate, and gallery-test Production Asset Batch D1 for Brood Warden. **Completed 16 July 2026; creator gameplay-scale review queued.**
12. Implement and rules-test Ripper behavior with placeholder presentation. **Completed 16 July 2026; creator timing review queued.**
13. Generate, normalize, integrate, and gallery-test Production Asset Batch D2 for the Ripper. **Completed 16 July 2026; creator gameplay-scale review queued.**
14. Implement and rules-test the Quillback projectile-fan behavior gate. **Completed 16 July 2026; creator gameplay-scale review queued.**
15. Generate and integrate Production Asset Batch E1 for the Quillback after its behavior review. **Completed 16 July 2026; creator gameplay-scale review queued.**
16. Implement and rules-test the Spinewheel reflection-physics behavior gate. **Completed 17 July 2026; creator timing/readability review queued.**
17. Generate and integrate Production Asset Batch E2 for Spinewheel. **Completed 17 July 2026; creator gameplay-scale review queued.**
18. Implement and rules-test the Tether Bloom forced-movement behavior gate. **Completed 17 July 2026; creator control/readability review queued.**
19. Generate and integrate Production Asset Batch E3 for Tether Bloom after behavior approval. **Completed 17 July 2026; creator gameplay-scale review queued.**
20. External-playtest the vertical slice; proceed to route, relic, Artifact, shop/rest, and boss systems only if Gate 2 succeeds. **Creator approval received 17 July 2026.**
21. Implement and verify The Bastion Eater with placeholders before generating Production Asset Batch D3. **Completed 17 July 2026; production art integrated in the same behavior-first pass.**
22. Implement and rules-test the Razor Scuttler interceptor behavior gate. **Completed 17 July 2026; creator timing/readability review queued.**
23. Generate and integrate Production Asset Batch D4 for the Razor Scuttler after behavior approval.

### Production Asset Batch D4: Razor Scuttler interceptor

**Status:** Pending creator approval of the functional behavior lab

- Queue one 4 × 4 directional/state body sheet at 96 × 96 cells: pursuit, compressed wind-up, committed dash, and exhausted/crash recovery across south, north, east, and west.
- Queue one 4 × 2 effect atlas at 64 × 64 cells: lane-warning accent, launch burst, speed trail, Marine impact, cover crash, miss skid, recovery stagger, and defeat.
- Keep the exact dash lane, distance, collision, and hit test code-driven. Retain chroma provenance, large transparent masters, stable pivot/scale, prompts, frame map, clean alpha, and deterministic normalization.
