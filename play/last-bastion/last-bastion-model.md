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

**Current objective:** run the consolidated creator playtest (see "Plan review — 17 July 2026"), then execute the content-enablement pass that folds already-approved weapons and enemies into the normal run, then behavior-prototype Event Horizon's aim, pull-field, implosion, and 16-second active-tile contract before generating its Unique production family.

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

### Leveled upgrade system with elemental paths

**Status:** Completed — 17 July 2026; balance numbers pending the step 35 tuning pass

- Every upgrade is now leveled with per-level effects and capped maximums; offer cards display the level being bought ("Chain Lightning II") with that level's description, and maxed upgrades leave the offer pool.
- Incendiary and Cryo Coating are mutually exclusive elemental paths. Incendiary: convert → hotter/more frequent Blaze → blazing aliens detonate on death (fire chain reactions). Cryo: convert → harder/more frequent Freeze → longer, near-total freezes.
- Chain Lightning levels add one arc plus a shock-buildup bonus, with per-bounce damage decay (70%, 49%, 34%…) so extra bounces trade depth for coverage.
- Explosive Payload levels grow both radius and splash percentage; the remaining upgrades stack their stated effect per level.
- The simulation gained a player-side status-tuning layer (buildup-rate multipliers per damage type, Blaze bonus damage, freeze speed/duration overrides, combustion-on-death) that future relics and hero passives can also drive.
- Snapshot exposes owned upgrade levels for future HUD/run-summary use; the offer draw preserves the original deterministic spread and skips ineligible entries.

### Categorized upgrade slots and Requisition rewards

**Status:** Completed — 17 July 2026; slot counts and elite cadence pending the step 35 tuning pass

- Every upgrade carries a category (Offensive/Defensive/Support/Scavenger); offer cards display it. Logistics and further categories are reserved until the catalogue can populate them.
- The Marine starts balanced at 3/2/1/1 (7 slots); hero definitions own the distribution so the Medic can lean Support and the Assault Offensive.
- New upgrades consume a slot in their category; leveling owned upgrades never does. Full categories stop offering new entries, forcing breadth-versus-depth build decisions.
- Elite upgrade caches now open a Requisition decision: +1 slot in one of up to three seeded category options. A shared hard cap of 12 total slots applies; capped caches fall back to experience.
- Snapshot exposes per-category used/capacity for the future dossier, HUD, and run-summary screens.
- Verification evidence: 169 tests across 20 files (six new slot rules), TypeScript validation, production build, HTTP smoke, and a clean browser boot.

### Codex knowledge hub (`last-bastion-codex.html`)

**Status:** Completed — 17 July 2026; content grows as systems land

- Built the encyclopedia at `play/last-bastion/last-bastion-codex.html`: a self-contained static page (no build step, ships on GitHub Pages immediately) using the game's palette rather than the cream site theme, because tiles must read here exactly as they do in the shop and character select.
- Ten tabs: Characters, Weapons, Monsterdex, Upgrades, Perks, Powerups & Shrines, Relics & Artifacts, Ammo, Damage Types, Damage Over Time. Search across everything, per-tab filters, and deep links (`#weapons`).
- **The tile contract is the point.** Every entry renders `game-assets/tiles/<id>-v1.png` over a procedural placeholder and removes the image if it 404s, so Codex art upgrades the page with zero code change — and the same stable ids serve the game's character select, shop, and placement modal. Each tile prints its id, so the page doubles as the generation worklist.
- **Monsterdex** is a real dex: aliens read `??????` until encountered and hide their stats until 10 kills, driven by the game's own save (`last-bastion-save` on the same origin). The game does not record a bestiary yet — see the pending item below — so today everything reads undiscovered and "Reveal all" is the design view.
- Entries carry a status badge (live / designed / concept), which makes the codex double as a content tracker: 7 heroes, 32 weapons across 7 classes/families, 22 monsters, 17 upgrades, 7 perks, 10 powerups/shrines, 9 relics/artifacts, 8 ammo kits, 8 damage types, 6 damage-over-time effects.
- Two design decisions recorded on the page: **Alien/Energy/Void are weapon *families*, not slot classes** (they cut across Light/Medium/Heavy so the five-slot rack design survives), and **all weapon names are original** — the archetypes requested (Glock, AK47) are live trademarks, and the project's own rule already forbids close resemblance to existing franchises, so they became the SP-9 Sidearm and Marauder AR.
- Verified in the browser on the published path: all ten tabs render, no console errors, monsters hidden by default, filters and the placeholder fallback working.

**Pending follow-ups this creates:**

- Add a `progress.bestiary` map (`{ [enemyType]: killCount }`) to the save schema so the Monsterdex fills in from real play. Small change to `LocalSaveStore` plus a kill hook in the scene.
- Link the codex from the game's main menu (step 37) and from the arcade hub.
- Generate the tile batch (see "The tile contract" in `last-bastion-content.md`).

### Weapon tiles, precision, and wave-balance design pass

**Status:** Design completed — 17 July 2026; all of it is proposal, none implemented

- **Weapon tiles, slots, and inventory** (`last-bastion-game.md`): weapons become tiles placed into typed rack slots (Light/Medium/Heavy/Unique/All) via a placement modal on every buy, pickup, or reward; a 4-slot inventory holds what cannot be equipped; discard is always available; shops sell tiles back at 50%; two identical same-tier tiles merge into the next tier (+60% damage plus one behavioural step, freeing a slot). Drag-and-drop is layered over a navigate-and-confirm model so keyboard and gamepad reach parity. Hero rack profiles join `upgradeSlots` as the second half of hero identity. This also answers the catalogue's long-standing "what do duplicate weapons do" question.
- **Numeric precision** (`wave_balance.md`): calculate in full float, display one decimal, debug at three; the mitigation floor drops from 1 to 0.1. This is what makes percentage upgrades meaningful at a 2-damage baseline.
- **Fractional projectiles**: a deterministic per-weapon-instance accumulator turns 1.5 projectiles into the sequence 1, 2, 1, 2 with no RNG, so items, relics, and downgrades can move counts in half-steps and seeded runs stay reproducible.
- **Speed tiers and the zergling rule**: explicit Rush/Standard/Slow/Static/Burst tiers; rush-tier enemies must outrun the Marine *and* die to one bullet. Adds the **Swarm Scuttler** (4.2 m/s, 2 HP, packs of 8–12) plus three fast/elite variants (**Razorlord**, **Blightspitter**, **Quillback Matriarch**), capped at one fast elite per wave.
- **Unique attacks and telegraphs**: ground slam (expanding ring), rain of spines (impact reticles), sweeping arc (clockwise fill), line beam, radial pulse — with a fairness contract (≥0.7 s tell above 20 damage, decals under actors, max two big telegraphs, edge markers for off-screen attackers, rain never covering >35% of the arena).
- **Hero level packages** (`last-bastion-game.md` + magnitudes in `wave_balance.md`): every level-up grants an automatic stat package per hero — the Marine gets +1 to all primaries and +1 Light proficiency — which finally activates the reserved `weaponProficiencies` field (+1 = +4% class damage). The package is the floor; upgrade choices remain the build.
- **The per-wave squeeze** is now stated explicitly: monsters gain ~28% health, periodic armour, and ~15% contact damage per wave while the player gains one package plus their choices, so no single axis (damage, survival, breadth, economy) can solve a run.
- Added verification rules 8–15 and a 10-step implementation order so the rescale lands as one deliberate pass rather than piecemeal.
- Codex briefs queued: **Batch I** (weapon tiles, five slot-class frames, tier borders, discard bin, merge indicator, placement modal, shop surfaces) and **Batch J** (Swarm Scuttler, Razorlord, Blightspitter, Quillback Matriarch bodies plus the telegraph decal atlas).

### Physical-pixel display scaling and settings design

**Status:** Completed — 17 July 2026 (scaling); settings screen remains a step 37 build item

- Diagnosed the residual softness: snapping the Phaser zoom to a whole number is not enough, because a display with a fractional `devicePixelRatio` (Windows at 125% reports 1.25) turned a CSS zoom of 2 into **2.5 physical pixels per canvas texel**, and the browser resampled the remainder.
- Added `rendering/DisplayScaling.ts`: choose a whole **device-pixel** scale N and derive the CSS zoom (`zoom = N / dpr`), so one texel always covers exactly N × N physical pixels. Verified live at dpr 1.25: canvas 1536 × 864 CSS = 1920 × 1080 physical = exactly 2.0 device pixels per texel.
- Text now rasterises at `uiTextResolution()` (the active device scale) instead of a hardcoded 2, so glyph textures are authored at physical-pixel density rather than upscaled by the pixel-art filter.
- `devicePixelRatio` is not stable — it can settle after boot and changes when a window moves between monitors with different scaling. The scale is therefore applied at `postBoot`, re-applied once on the next frame and shortly after, on every resize, and on a `matchMedia` resolution-change watcher.
- `?size=100..300` previews the planned game-size setting ahead of the settings screen.
- Designed the settings screen in `last-bastion-game.md`: Gameplay (auto-fire default with a mid-run toggle hotkey, auto-use skills off by default, aim assist, pause-on-decision), Display (game size 100–300% snapping to exact device scales, screen shake, damage numbers, FPS), Audio (master/music/SFX), Controls (rebinding, deadzone, vibration), and recommended Accessibility options (colour-blind telegraphs, reduced flash, high-contrast HUD, hold-vs-tap dodge).
- Verification evidence: 245 tests across 23 files (11 new scaling rules), TypeScript, production build, HTTP smoke, and a live browser measurement confirming whole-device-pixel mapping.

### Expedition map generator (step 38 core)

**Status:** Completed — 17 July 2026; map screen, save schema v2, and node→encounter wiring remain

- Added the pure, Phaser-free seeded generator (`dev/src/game/expedition/ExpeditionMap.ts`): 20 nodes across 8 columns and 3 lanes, one drop site, one Bastion Eater terminus, and edges that only reach the next column straight or one lane up/down, so no route doubles back.
- Node-type budget per map: 2 Elite, 2 Mini-boss, 2 Supply Depot, 2 Weapon Cache, remainder Combat. Each node carries a seeded theme id from the arena pool, so background variety is half-procedural exactly as designed.
- Fairness rules enforced and tested across seven seeds: columns 0–1 stay ordinary combat; a Supply Depot is always reachable before any Mini-boss; Mini-bosses never appear before column 3; no path steps directly from one Elite/Mini-boss into another; every node is reachable; no route dead-ends; every route reaches the boss in exactly 8 encounters.
- Added `reachableNodes`, `traversableNodeIds`, `expeditionNodeById`, and `routeLengthRange` helpers for the map screen and future save/restore.
- The rules tests immediately caught a placement-order defect (Mini-boss legality depends on an already-placed Supply Depot, but the danger-first sort placed Mini-bosses before any depot existed, silently dropping them from every map). Fixed by anchoring the first Supply Depot in the earliest assignable column before dangerous placements run.
- Verification evidence: 238 tests across 22 files (66 new map rules), TypeScript validation, production build, 51 asset checks, and 36 review routes.

### Decision-menu input, crisp integer scaling, and arena theme pool

**Status:** Completed — 17 July 2026; creator visual check on a high-resolution monitor pending

- Decision overlays (upgrades, weapon chest, supply depot, requisition) are now fully keyboard/gamepad navigable: arrows or WASD or the left stick move the highlight, Enter / Space / pad-A confirms, digits 1–3 quick-pick, and an on-panel hint documents it. Mouse hover and the selection highlight share one state.
- Fixed the pointer-mismatch bug: the overlay previously used `scrollFactor(0)`, but Phaser hit-tests interactive objects in world space, so hover/click zones drifted once the follow camera scrolled. The overlay now tracks the camera's world-view centre each frame, keeping panel and hit areas identical.
- Replaced fractional `Scale.FIT` stretching with `Scale.NONE` plus an integer zoom snapped to the window (1×, 2×, 3×…): fractional upscales smear pixel art even with `image-rendering: pixelated`, which was the blur reported on high-resolution Firefox. Letterboxing at odd window sizes is the accepted trade; a native-resolution presentation pass (hi-res canvas, zoomed world camera, separate UI layer) remains future work if smoother text is wanted — this is a configuration matter, not an engine limitation.
- Added the arena theme pool (`rendering/arenaThemes.ts`): five seeded tint/backdrop themes (Bastion Perimeter, Emberfall Ruin, Toxic Bloom, Void Approach, Arctic Relay) over the shared floor/boundary/obstacle atlases, drawn per page load and pinnable with `?theme=<id>`. This is the first half-procedural step of the expedition map's per-node background variety; authored per-world floor sets are a queued Codex batch.
- Themes are presentation-only and never touch simulation state.

### Razor Scuttler interceptor behavior gate

**Status:** Completed — 17 July 2026; Production Asset Batch D4 integrated and creator timing/readability review queued

- Added a fragile 16-health interceptor with 3.35 m/s positioning speed, no ordinary contact damage, and modest Cryo vulnerability.
- Implemented a locked 0.48-second lane warning followed by a 9.5 m/s, 0.55-second committed dash. The Razor must first reach the 2.6–7.5 metre acquisition band, preventing point-blank instant launches.
- The dash can damage the Marine only once. A player hit, wall/cover crash, or clean miss immediately enters a stationary recovery; cover crashes use the longest 1.4-second punish window.
- Added typed warning, dash, and reason-specific impact events; synthesized audio; code-driven lane rendering; `RAZOR LAB` identity; and deterministic `scenario=razor-scuttler` route.
- Replaced the behavior-gate triangle with Production Asset Batch D4: sixteen directional pursuit/wind-up/dash/recovery bodies plus authored lane accent, launch, speed trail, Marine impact, cover crash, miss skid, stagger, and defeat effects.
- Rules coverage locks warning direction, verifies miss recovery, verifies cover interruption, and proves one-hit dash safety through recovery.
- Kept the Razor out of normal waves until its warning length, speed, collision read, and recovery punish window pass creator review.
- Verification evidence: 138 tests across 17 files, TypeScript validation, production build, 40 runtime art assets, and 26 review routes.

## In progress

### Technical scaffold

**Status:** Completed — build, HTTP smoke, D4 gallery, and live combat-canvas browser checks verified

- Created an isolated Phaser 4.1, TypeScript, Vite, and Vitest project under `dev/`.
- Added development, typecheck, test, build, smoke, and combined verify commands.
- Configured production output for the exact `/play/last-bastion/` GitHub Pages route without deleting design documents or concept art.
- Built the tracked `index.html` and hashed `game-assets/` output.
- Verified the route, game root, and compiled JavaScript asset return HTTP 200.
- Visually verified the D4 gallery and live Razor Scuttler combat canvas in the in-app browser with no console errors.

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

**Status:** Implementation superseded and absorbed — 17 July 2026

The placeholder movement/aim/roll prototype has long been replaced by the production movement, camera-follow arena, gamepad merge, and Batch A–F presentation. The only live remainder — creator feel feedback on movement, roll, firing, pressure, and readability — is tracked in the consolidated creator playtest below.

### Early enemies and wave encounter

**Status:** Implementation superseded and absorbed — 17 July 2026

The original three-wave encounter grew into the seeded five-wave vertical slice with intermission rewards, elites, and the mini-boss pool (see the dedicated completed entries). The fairness playtest remainder is tracked in the consolidated creator playtest below.

### XP and upgrade choices

**Status:** Implementation superseded and absorbed — 17 July 2026

Six upgrades grew into the twelve-upgrade rotation exercising damage types and defensive stats. The build-diversity playtest remainder ("three recognisably different short-run builds") is tracked in the consolidated creator playtest below.

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

## Plan review — 17 July 2026

A full review of the three planning documents against the implemented code (157 tests, 36 review routes, art batches A–F4) found the plans broadly accurate but surfaced one structural problem and several gaps. The original eleven-step "Immediate sequence" was fully superseded by the Revised implementation order and has been removed.

### Finding 1 — finished content is not reachable in a normal run (highest priority)

The repository now contains seven weapons and roughly twelve enemy behaviours with production art, but an ordinary player run still experiences only the original three weapons and seven enemies:

- The Weapon Chest pool is still `VERTICAL_SLICE_WEAPON_IDS` (Service Rifle, Scattergun, Arc Carbine). Patrol Blade, Bolt Carbine, Bulwark Rotary Cannon, and Grenade Tube exist only behind `?loadout=` labs.
- Ripper, Quillback, Spinewheel, Tether Bloom, and Razor Scuttler are complete with art but appear in no ordinary wave.
- The Bastion Eater exists only behind `?scenario=bastion-eater`.

This is correct gate discipline individually, but collectively it has produced a review pile-up: roughly fifteen items are "queued for creator review" and everything waits behind them. The fix is one consolidated session, not fifteen separate gates.

### Finding 2 — balance debt concentrated in one place

The XP curve (`level × 4`), wave enemy counts, and intermission cadence were tuned for a three-wave, one-screen prototype. The arena is now 1.5× the viewport (lower enemy density), there are twelve upgrades, and reward decisions interrupt more often. No number has been revisited since. Tuning should happen once, after the enablement pass, against measurable targets rather than per-feature.

### Finding 3 — missing small systems the docs imply

- No main menu, character select, or in-game settings surface exists; settings changes require URL parameters even though the versioned save store already persists them.
- Production audio is still the placeholder synthesizer.
- The mini-boss pool holds two of the intended three entries (Rift Stalker remains design-only).
- Weapon proficiency and mineral-find stats remain intentionally inert — correct, no action.

### Proposed next steps (extends the Revised implementation order)

33. **Consolidated creator review session.** One sitting through the queued review routes with a written pass/fail per item: normal run, `stress=4`, mini-boss labs (`siege-crusher`, `brood-warden`), enemy labs (`ripper`, `quillback`, `spinewheel`, `tether-bloom`, `razor-scuttler`), weapon labs (`patrol`, `bolt`, `bulwark`, `grenade`), `bastion-eater`, and the F1–F4 galleries. Output: an approved list and a rejected/retune list.
34. **Content-enablement pass.** **Completed 17 July 2026.** The Weapon Chest now draws a seeded three-option subset from `WEAPON_CHEST_POOL` (all seven implemented weapons; `VERTICAL_SLICE_WEAPON_IDS` remains for the `?loadout=vertical` review route). Waves 3–5 now field the behavior-gated roster: wave 3 adds one Quillback and one Ripper; wave 4 adds two Razor Scuttlers, one Tether Bloom, one Spinewheel, and one Ripper alongside the Carapace elite; wave 5 escorts the pooled mini-boss with Razor Scuttlers and a Quillback. Counts are deliberately conservative pending the step 35 tuning pass, and the creator review (step 33) can still strike any item from the pool or waves as a one-line data change. Verification: 158 tests across 18 files, TypeScript, production build, 51 asset checks, 36 review routes, clean browser boot.
35. **Single tuning pass with measurable targets:** 10–15 minute run length, at least three recognisably different builds, no unavoidable damage in waves 1–3, death causes readable, wave-5 mini-boss fight 45–90 seconds. Revisit XP curve, wave counts on the larger arena, and reward cadence together. **The numeric design now lives in `wave_balance.md` (draft v1, 17 July 2026):** starter rifle rescaled to 2 damage per bullet with all enemy health rescaled to match, authored per-wave health/armour/shield/speed growth, threat-budget spawning with simultaneous caps and Brotato-style overwhelm from wave 3, a steeper XP curve targeting 9–12 levels per run, damage numbers, the Scrap economy (still gated behind the Shop node), and item classes. Its seven verification rules become tests during this pass.
36. **Rift Stalker behavior gate** to complete the three-entry mini-boss pool (cloaked stalk, marked pounce, close slash, final-20% frenzy), then its production batch.
37. **Front-end shell behavior gate.** Title, main menu, How to Play, Settings, and character-select screens as a code-native screen-flow state machine with placeholder panels, per the "Front-end shell and expedition structure" design added to `last-bastion-game.md` on 17 July 2026. Settings bind to the existing `LocalSaveStore`; the Lab card surfaces the existing review routes in-game.
38. **Expedition map behavior gate.** Generator **completed 17 July 2026** (see the dedicated entry above): pure seeded 20-node chart with budget and fairness rules under test. Remaining: the map screen with code-native medallions and route lines, plus save schema v2 carrying mid-run state (map seed, cleared nodes, build, health) with autosave on returning to the map.
39. **Node → encounter wiring.** Combat/Elite/Mini-boss nodes drive the existing arena with budgets by node type and depth; Supply Depot and Weapon Cache reuse the existing decision overlays as full-screen nodes; the Boss node runs the Bastion Eater. The five-wave arcade run remains as "Quick Drop" until the map replaces it.
40. **Production Asset Batch G1/G2** (title, menu, dossier, starchart, medallions — briefs in `last-bastion-content.md`) only after steps 37–38 pass creator review with placeholders.
41. **Event Horizon behavior gate** (existing step 32), so the first Unique lands in an already-tuned game.

Recommendation for a later documentation pass: move the completed checkpoint entries (now the majority of this file) into a separate `last-bastion-log.md` archive so this tracker reads as a plan again. Not done in this pass to avoid disrupting in-flight references.

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
23. Generate and integrate Production Asset Batch D4 for the Razor Scuttler after behavior approval. **Completed 17 July 2026; creator gameplay-scale review queued.**
24. Define the bottom active-action bar, passive weapon-cadence strip, cooldown-shadow rules, accessibility treatment, and the first premium weapon briefs. **Completed 17 July 2026; behavior prototypes and UI wireframe next.**
25. Implement the action-bar/cadence-strip behavior gate with code-native placeholder tiles, then prototype Patrol Blade timing before generating the first weapon-and-tile art batch. **Completed 17 July 2026; creator timing/layout review queued.**
26. Upgrade the existing temporary-buff HUD into a top-left circular-timer tray and add a deterministic Uranium-Core Rounds kit lab before producing timed-status icon art. **Completed 17 July 2026; creator timing/layout review queued.**
27. Generate and integrate Production Asset Batch F1 for Patrol Blade, action tiles, and Uranium-Core Rounds after Tasks 25–26 pass creator review. **Completed 17 July 2026; creator gameplay-scale review queued.**
28. Implement and rules-test the Bolt Carbine piercing/readability behavior gate before generating Production Asset Batch F2. **Completed 17 July 2026; creator timing/readability review queued.**
29. Generate, normalize, integrate, gallery-test, and verify Production Asset Batch F2 for the Bolt Carbine after behavior approval. **Completed 17 July 2026.**
30. Produce and integrate Production Asset Batch F3 for the Bulwark Rotary Cannon, including reusable ballistic tracers and impacts. **Completed 17 July 2026; final spin-up/heat tuning remains a behavior pass.**
31. Produce and integrate Production Asset Batch F4 for the Bastion Grenade Tube, including projectile, fuse, bounce, warning, blast, and cover-impact presentation. **Completed 17 July 2026; future arcing/minimum-range tuning remains behavior work.**
32. Implement and rules-test Event Horizon's pull-field and implosion behavior before producing its Unique weapon family.

### Production Asset Batch D4: Razor Scuttler interceptor

**Status:** Completed — 17 July 2026; creator gameplay-scale review queued

- Completed one 4 × 4 directional/state body sheet at 96 × 96 cells: pursuit, compressed wind-up, committed dash, and exhausted/crash recovery across south, north, east, and west.
- Completed one 4 × 2 effect atlas at 64 × 64 cells: lane-warning accent, launch burst, speed trail, Marine impact, cover crash, miss skid, recovery stagger, and defeat.
- Kept the exact dash lane, distance, collision, and hit test code-driven. Chroma provenance, large transparent masters, stable pivot/scale, prompts, frame map, clean alpha, and deterministic normalization are retained under `art/production-tests/batch-d4/`.

### Weapon action bar and premium design pass

**Status:** Behavior gate completed — 17 July 2026; creator timing/layout review queued

- Use four large bottom-centre active tiles for dodge, ultimate, consumable, and active perk/relic or manual heavy weapon.
- Add a separate compact passive cadence strip for slow automatic weapons and periodic perks; do not label automatic attacks with misleading hotkeys.
- Render cooldown shadow, numeric time, charge pips, binding text, disabled/no-target treatment, and ready pulse in code so one tile master supports keyboard and gamepad.
- Start behavior production with Patrol Blade, then Bolt Carbine, Grenade Tube, Bulwark Rotary Cannon, and Event Horizon.
- Generate each approved weapon's ring states, projectile/effects, and matching 64 × 64 tile as one production batch only after its behavior lab passes.
- Implemented a four-slot bottom action bar with keyboard bindings, disabled empty slots, code-rendered radial cooldown shadow, and numeric cooldown labels.
- Implemented a compact passive cadence strip that includes automatic weapons at or above the 1.5-second threshold without assigning false hotkeys.
- Implemented Patrol Blade as a 2.5-second automatic nearest-target melee sweep with a short forward arc, cover blocking, physical damage, and knockback; `?loadout=patrol` is the deterministic behavior-review route.
- Verification evidence: 144 tests across 18 files, TypeScript validation, production build, 40 runtime asset checks, 27 review routes, and browser review at 960 × 540 with no console errors.

### Temporary powerup and kit tray

**Status:** Behavior gate completed — 17 July 2026; creator timing/layout review queued

- Place active temporary effects in a top-left tray with circular remaining-time ring, radial shadow, and numeric countdown.
- Keep unused activatable kits on the bottom action bar; move their effect to the top-left tray only after activation.
- Reuse the tray for timed shrine blessings and wave-long effects, but keep permanent/run-long modifiers out of it.
- Prototype Uranium-Core Rounds as a 12-second, +25% direct ring-weapon-damage window with refresh-not-stack behavior and explicit exclusions.
- Create high-quality status icons only after the timer, stacking, inspection, wrapping, expiry, and accessibility states pass the code-native UI lab.
- Implemented a reusable six-slot top-left status tray with authored icons, code-rendered circular remaining-time rings, numeric tenths, urgent final-three-second treatment, wrapping, and clean expiry.
- Implemented Uranium-Core Rounds as a consumable `Q`/B-Circle kit, a 12-second +25% direct ring-weapon damage effect, and refresh-not-stack timed buff; secondary chain, explosion, ultimate, and environmental damage remain excluded.
- Added deterministic review routes: `?loadout=patrol&kit=uranium` for the ready kit and `?loadout=patrol&buff=uranium` for the active tray state.

### Production Asset Batch F1: Patrol Blade, action tiles, and timed status

**Status:** Completed — 17 July 2026; creator gameplay-scale review queued

- Completed one Patrol Blade ring sheet at 96 × 96 cells: folded idle, ready/anticipation, active sweep, and recovery. The east-authored runtime frames rotate with the weapon ring.
- One Patrol Blade effect atlas at 64 × 64 cells: anticipation arc, active crescent, flesh hit, armour hit, cover sparks, and ready glint. Hit geometry and cooldown remain code-driven.
- One action-tile atlas at 64 × 64 cells: combat roll, Bastion ultimate, Patrol Blade cadence, Uranium-Core Rounds kit, empty consumable, and empty active slot. Bindings, cooldown shadow, time text, charges, disabled state, and ready pulse remain code-driven overlays.
- One Uranium-Core Rounds status icon master at 64 × 64 with a clean circular silhouette suitable for the 36–44 pixel top-left tray. The circular timer, radial shadow, countdown, refresh feedback, and expiry flash remain code-driven.
- Acceptance: each motif is identifiable at gameplay scale beneath a 50% cooldown shadow, maintains clean alpha and safe padding, and has a deterministic gallery/review route before replacing placeholders.
- Retained four large chroma provenance sources and four full-resolution transparent edit masters, each roughly 16–25 times larger than its runtime cell, for future higher-resolution Steam rendering and revision.
- Deterministic normalization, connected-component cleanup, exact frame maps, prompt contracts, and source/runtime separation are documented under `art/production-tests/batch-f1/`.
- Integrated the blade states, active crescent, action motifs, uranium kit/status art, and `?mode=gallery&batch=f1` review route while preserving code-authoritative cooldowns, rings, bindings, timing, geometry, and damage.
- Verification evidence: 149 tests across 18 files, TypeScript validation, production build, 44 runtime art checks, 30 review routes, and browser review of the gallery/ready/active states at 1280 × 720 with no console warnings or errors.

### Bolt Carbine piercing/readability behavior gate

**Status:** Completed — 17 July 2026; creator timing/readability review queued

- Implemented a manual cursor-aimed precision carbine with a deliberate 1.8-second cadence, 18-metre reach, 12 metres/second bolt speed, and 22 physical damage per target.
- Each bolt penetrates exactly one enemy: the first and second contacts receive damage and distinct impact events, while a third aligned target remains untouched.
- Firing into an empty lane still commits the full cooldown, preserving the intended high-stakes aim contract.
- Added separate code-native first-hit and terminal second-hit flashes, a long cyan bolt silhouette, a distinct weapon-ring placeholder, and a dedicated synthesized impact cue without borrowing final F2 art.
- Added the deterministic `?loadout=bolt` behavior-review route and smoke coverage.
- Verification evidence: 152 tests across 18 files, TypeScript validation, production build, 44 runtime art checks, 31 review routes, and a live `?loadout=bolt` canvas review passed.

### Production Asset Batch F2: Bolt Carbine precision family

**Status:** Completed — 17 July 2026; creator gameplay-scale review queued

- One 4 × 1 Bolt Carbine ring sheet at 96 × 96 cells: idle, charge/aim settle, fire/recoil, and recover/vent.
- One 4 × 2 projectile/effect atlas at 64 × 64 cells: charge glint, precision bolt, travel wake, first-target impact, penetration wake, terminal second-target impact, cover strike, and ready glint.
- One 64 × 64 Bolt Carbine cadence tile built to remain identifiable beneath a 50% cooldown shadow.
- Keep trajectory, hit ordering, penetration count, cooldown, damage, and timer overlays code-authoritative; the batch supplies presentation only.
- Integrated all four weapon states, the authored bolt projectile, first and terminal impacts, cover strike, dedicated cadence motif, `?mode=gallery&batch=f2`, and `?loadout=bolt`.

### Production Asset Batch F3: Bulwark Rotary Cannon

**Status:** Completed — 17 July 2026; creator gameplay-scale review queued

- Preserved the approved heavy six-barrel concept across idle, spin-up, firing, and heated-recovery ring states.
- Added an eight-frame effect atlas containing a spin ring, reusable ballistic tracer, muzzle flash, casing, soft-target impact, armour ricochet, vent heat, and ready glint.
- Integrated a functional rapid-fire heavy-cannon lab at `?loadout=bulwark` and a deterministic `?mode=gallery&batch=f3` presentation review.
- Fire rate, damage, collision, knockback, and cooldown remain code-authoritative. A later behavior pass must decide the final spin-up, heat, and movement trade-off before balance lock.

### Production Asset Batch F4: Bastion Grenade Tube

**Status:** Completed — 17 July 2026; creator gameplay-scale review queued

- Created an original compact revolver grenade launcher with idle, armed, firing, and open-cylinder reload states.
- Added a dedicated grenade projectile, fuse trail, bounce spark, warning pulse, explosion core, blast ring, cover strike, and ready glint.
- Implemented direct-hit and splash damage, fuse-expiry detonation, cover detonation, compact knockback, `?loadout=grenade`, and `?mode=gallery&batch=f4`.
- Projectile flight, explosion radius, hit exclusion, splash multiplier, damage, knockback, and cooldown remain code-authoritative. Future arcing/minimum-range tuning can reuse the retained art without regeneration.

### F2–F4 Steam-port asset retention

- Retained seven large chroma provenance sources, seven full-resolution transparent edit masters, seven normalized runtime atlases, exact frame maps, prompt contracts, and one deterministic rebuild script.
- Runtime delivery totals 12 weapon-state frames, 24 projectile/effect frames, and three cooldown motifs. Generic ballistic tracers are reusable; the Bolt and Grenade families use bespoke projectile sprites.
- Built-in image generation used the established Last Bastion weapon, action-tile, and approved Bulwark concept art as strict references. No text, bindings, cooldown masks, collision geometry, or gameplay timing is baked into the artwork.
- Verification evidence: 157 tests across 18 files, TypeScript validation, production build, 51 explicit runtime-art HTTP checks, 36 deterministic review routes, transparent-master inspection, and exact-resolution runtime-atlas inspection passed.
