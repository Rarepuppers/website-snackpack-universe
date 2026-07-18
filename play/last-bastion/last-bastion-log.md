# Last Bastion completed-work log

This is the archive of finished, verified work, split out of `last-bastion-model.md` on 18 July 2026 so the tracker reads as a plan. Both Claude and Codex treat this file as the authoritative record of what is already implemented: check here before re-planning or re-generating anything, and append each newly completed checkpoint here (newest at the bottom) with its date, scope, and verification evidence.

Numbered-step completion notes remain inline in the model file's "Revised implementation order"; production batch statuses remain in its "Production batch status" section until a later archival pass.

## Completed checkpoints — archived 18 July 2026

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
- **Monsterdex** is a real dex: aliens read `??????` until encountered and hide their stats until 10 kills, driven by the game's own save (`last-bastion-save` on the same origin). The bestiary is now recorded by the game (see the dedicated entry below), so the dex fills in from real play.
- Entries carry a status badge (live / designed / concept), which makes the codex double as a content tracker: 7 heroes, 32 weapons across 7 classes/families, 22 monsters, 17 upgrades, 7 perks, 10 powerups/shrines, 9 relics/artifacts, 8 ammo kits, 8 damage types, 6 damage-over-time effects.
- Two design decisions recorded on the page: **Alien/Energy/Void are weapon *families*, not slot classes** (they cut across Light/Medium/Heavy so the five-slot rack design survives), and **all weapon names are original** — the archetypes requested (Glock, AK47) are live trademarks, and the project's own rule already forbids close resemblance to existing franchises, so they became the SP-9 Sidearm and Marauder AR.
- Verified in the browser on the published path: all ten tabs render, no console errors, monsters hidden by default, filters and the placeholder fallback working.

**Pending follow-ups this creates:**

- Link the codex from the game's main menu (step 37) and from the arcade hub.
- Generate the tile batch (see "The tile contract" in `last-bastion-content.md`).

### Bestiary recording (Monsterdex data)

**Status:** Completed — 17 July 2026

- Extended `progress` with `bestiary: Record<string, { seen, kills }>`, keyed by **bestiary key** — elite kind, mini-boss kind, or enemy type — so a Carapace Scuttler is its own dex entry rather than an ordinary Scuttler. `seen` reveals an alien's name; `kills` reveal its stats at 10.
- No schema version bump: the field is additive and `normalizeSave` treats a missing or malformed bestiary as an empty dex, so **pre-dex saves keep their run history** instead of being discarded. Malformed individual rows are dropped without losing the save.
- `enemy-spawned` and `enemy-defeated` now carry `bestiaryKey`. Because `spawnEnemy` emits the spawn event *before* `spawnElite`/`spawnMiniBoss` apply their rank, those paths re-tag the event they just caused — without this a Carapace Scuttler registered as a plain Scuttler on sight. A rules test guards it.
- The scene accumulates counts in memory and flushes once per wave and at run end, rather than writing to localStorage on every kill — a busy wave produces hundreds of events and storage writes are synchronous.
- Lab and stress routes never record, matching the existing rule for run outcomes: review tools do not touch player progress.
- The codex derives the save key from its own entry ids (`mon-<key>`), a contract guarded by a test in the game suite; it also shows kill progress (`3/10 kills to reveal stats`) so the dex reads as a goal.
- Verification evidence: 256 tests across 24 files (11 new dex rules), TypeScript, production build, HTTP smoke.

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


### Codex v2 data pass (step 42)

**Status:** Completed — 18 July 2026

- Rescaled `last-bastion-codex.html` to the Brotato-style v2 balance model from `wave_balance.md`: all seven hero cards now carry 7.5–15 health with a new Regen stat row (Marine 10 health, 0.2/s as a 0.6 tick every 3 s); every monster, elite, mini-boss, and boss card's damage-to-player rescaled to the 1–3 early / 5 cap range; Tether Bloom sever threshold 28 → 5.5.
- Damage-type colour language updated to the confirmed mapping (ivory physical, red fire, blue cryo, teal shock, green toxic) with the swatches and card text updated; DoT magnitudes rescaled (Blaze 0.5/s, Corrode 0.3/s, Unmake 0.4/s); Shield Capacitor path rescaled to +2 per rank.
- Radius weapons (Grenade Tube, Siege Rocket Rack, Singularity Charge, Event Horizon) and the Blast Mite now state centre → edge blast damage per the new explosion falloff rule.
- Added the Burrower (standard, designed) and Sink Maw (elite, concept) underground-ambusher entries to the Monsterdex.
- Verification: page loads with zero console errors; 24 monster entries render; hero card shows the new health/regen stats in the browser pane.

### Precision + display foundation (wave-balance implementation order, step 1)

**Status:** Completed — 18 July 2026

First implementation slice of the v2 balance model — the layer that makes every later number judgeable, landed before the rescale so tuning has a legible readout.

- **`formatStat` helper** (`dev/src/game/stats/formatStat.ts`): the single display path — round-half-up with an epsilon guard against binary-float ties (2.05 → `2.1`), trailing zeros trimmed (`4.0` → `4`), `DISPLAY_DECIMALS = 1` / `DEBUG_DECIMALS = 3`. Simulation still calculates in full float; only display rounds.
- **Mitigation floor 1 → 0.1** (`DefenceStats.ts`, new `MITIGATION_FLOOR` constant): at the 2-damage baseline a 1-damage floor would erase small-calibre weapons against heavy armour; the floor scales down with the numbers.
- **Damage-type colour language** (`DAMAGE_TYPE_COLOURS` in `damageTypes.ts`): standard ivory, fire red, shock teal, cryo blue, toxic green — one source of truth, hex-matched to the codex swatches.
- **Floating damage numbers** (`dev/src/game/rendering/FloatingDamageNumbers.ts`): pooled Phaser text, ~40 live cap with oldest-recycled, and a per-enemy 100 ms merge window so a multi-projectile burst reads as one growing total instead of burying the arena in text. The merge/cap decision is the pure, unit-tested `findMergeIndex` helper; the `enemy-hit` frame event now carries `damage`, `damageType`, and `enemyId` to drive it.
- **Setting + toggle** (`LocalSaveStore`): `damageNumbersEnabled` (default on) with a `?damage=0|1` lab override until the Settings screen exists.
- **Verification:** 268 tests across 26 files pass (formatStat, mitigation-floor, merge-helper, and save-default cases added); `tsc --noEmit` clean; production build clean; the game boots and runs live firing at `?stress=4&damage=1` with zero console/runtime errors. On-screen colour/legibility of the numbers remains the standing manual review gate (automated canvas capture is unavailable in this environment).

### Production Asset Batch K: persistent status overlays

**Status:** Completed — 18 July 2026; creator crowd/readability review queued

- Generated independent Steam-retained animation strips for Blaze, Overload, Corrode, and Freeze, using the established Batch C effects as the style reference. Retained four chroma provenance sources, four full-resolution transparent edit masters, exact prompts, and deterministic normalization.
- Built the stable 192 x 192 `status-overlays-v1` runtime atlas: 15 authored 48 x 48 frames plus one transparent reserved cell. The four loops retain deliberately different rhythms: flicker, strobe/dark beat, lazy bubbles, and near-static shimmer.
- Integrated one persistent overlay layer per active enemy status, including simultaneous-status support and proportional elite/boss scaling. Simulation buildup, timing, stacking, immunity, damage, tint, hitboxes, and telegraphs remain authoritative.
- Added a deterministic `?mode=gallery&batch=k` review route showing frame order, animated 64 px reads, and elite scaling; updated the content brief, production tracker, asset manifest contract, HTTP smoke coverage, and source documentation.
- Verification: 269 tests across 26 files, clean TypeScript, production build, 52 explicit runtime-art HTTP checks, 37 review routes, transparent-atlas inspection, and live Phaser gallery review with zero browser warnings or errors.

### Event Horizon Unique art preflight (Batch L)

**Status:** Completed as a held presentation preflight - 18 July 2026; behavior gate still required

- Generated and extracted a four-state 96 x 96 Event Horizon ring weapon sheet, an eight-frame 64 x 64 gravitic projectile/effect atlas, and a 64 x 64 active tile from the approved concept reference.
- Added stable manifest contracts and the `?mode=gallery&batch=eh` review route, while deliberately excluding Event Horizon from normal gameplay and weapon acquisition until step 32.

### Corrupted Human outbreak art preflight (Batch M)

- Generated high-quality held art for the Infected Survivor, Corrupted Marine, Abomination elite, and the Marine knife/projectile/telegraph/impact family using built-in image generation with retained magenta-key sources and prompts.
- Extracted transparent masters and deterministic nearest-neighbour runtime atlases in `art/production-tests/batch-m/`; integrated four manifest contracts and `?mode=gallery&batch=m`.
- Kept all three enemies out of live spawning. Promotion waits on behavior gates for sprint/swarm, knife telegraph/projectile/cooldown, and slam/grab/recovery; Abomination Prime remains future scope.

### Emberfall world-theme art preflight (Batch H)

- Generated high-quality Emberfall floor, boundary, obstacle, and low-contrast decal atlases from the Batch A layout/collision contracts using built-in image generation.
- Extracted transparent masters and deterministic nearest-neighbour runtime atlases in `art/production-tests/batch-h/`; integrated four held manifest contracts and `?mode=gallery&batch=h`.
- Kept theme assignment and draw order unchanged. Creator grayscale/contrast review is required before expanding to Toxic Bloom, Void Approach, or Arctic Relay sets.
- Added the Toxic Bloom variant under `art/production-tests/batch-h/toxic-bloom/`, with four normalized runtime atlases, manifest contracts, and `?mode=gallery&batch=tb`; theme assignment remains unchanged.
- Added Void Approach under `art/production-tests/batch-h/void-approach/`, with four normalized runtime atlases, manifest contracts, and `?mode=gallery&batch=va`; theme assignment remains unchanged.
- Integrated Arctic Relay under `art/production-tests/batch-h/arctic-relay/`, with four normalized runtime atlases, manifest contracts, and `?mode=gallery&batch=ar`; theme assignment remains unchanged.

### Task 35 — Aurum Hoarder behavior gate

**Status:** Completed — 18 July 2026; Production Asset Batch Task 36 completed

- Added the treasure-rank Aurum Hoarder with a three-second forage read, deterministic far-safe edge selection, nine-second flee clock, visible exit marker, negligible contact threat, and one-per-wave enforcement.
- Armour breaks at 75%, 50%, and 25% health each secure 10 Scrap; a defeat secures another 30 and drops exactly one Aurum Supply Cache backed by the existing valid three-choice Supply Depot decision.
- Escape emits no defeat, experience, Scrap, or cache event. Treasure rank is excluded from wave-clear blockers, and a lingering Hoarder is cleanly dismissed before intermission.
- Added explicit spawn eligibility for wave 3 onward with tutorial/final-boss/objective/cap/duplicate exclusions. The later Scrap Shop behavior gate enabled the same contract for seeded ordinary-wave arrivals.
- Added the `?scenario=aurum-hoarder&loadout=bulwark` acceptance route, code-drawn gold/cyan placeholder, flee pulse, armour-break and cache flashes, HUD Scrap readout, Codex/Bestiary event identity, and HTTP smoke coverage.
- Rules coverage locks deterministic eligibility and safe exit selection, one-per-wave, non-rewarding escape, all three partial payouts, 60 total kill payout, unique cache contents, and Bestiary identity.

### Task 36 — Aurum Hoarder production art and 128 px tiles

**Status:** Completed — 18 July 2026; Scrap Shop behavior gate completed

- Generated and alpha-cleaned retained production masters for the Hoarder's intact, armour-broken, and directional flee body states; arrival, plate break, Scrap burst, flee, trail, escape, defeat, and cache effects; and eight 128 px Codex/shop/event/reward tiles.
- Deterministically normalized the masters into a 12-frame 96 px body sheet, eight-frame 64 px effects atlas, eight-frame 128 px tile atlas, and individual 128 px source tiles. Prompts, chroma sources, transparent masters, frame maps, and the normalization script remain in `art/production-tests/batch-n/`.
- Registered all three atlases in the manifest and bound the authored body/effect frames to the Task 35 simulation events without moving timing, collision, escape geometry, rewards, cooldowns, or text into raster art.
- Added `?mode=gallery&batch=n`, HTTP smoke coverage, the required static Codex tile, and manifest contract tests. The 1080p gallery passed visual review; the 4K route at 150% loaded without console warnings or missing assets.
- Initially kept ordinary-wave Aurum spawning disabled until Scrap had a visible spend loop; the completed Scrap Shop follow-on now enables seeded eligible arrivals while retaining the forced behavior lab.

### Scrap Shop behavior gate

**Status:** Completed — 18 July 2026; expedition Shop-node migration remains future map work

- Activated same-run Scrap from 25% ordinary drops, guaranteed specialist payouts, elite and mini-boss rewards, wave-clear bonuses, and the existing Aurum armour/defeat rewards.
- Added a deterministic intermission Shop after wave-two and wave-four Supply Depots. It presents three distinct live offers—repair, carried Uranium kit, armour, an eligible upgrade, or an unowned weapon—plus an explicit leave action that banks the balance for the next terminal.
- Purchases validate affordability before mutation, deduct the exact displayed price, apply immediately, emit a spend event, and refresh the rack. Unaffordable rows are visibly disabled and skipped by keyboard/controller navigation; mouse and digits 1–4 remain supported.
- Enabled maximum-one seeded Aurum Hoarder arrivals during eligible ordinary waves 3–4 now that every earned Scrap unit has a visible spend path. Tutorials, objectives, full-cap states, duplicates, and the final wave remain excluded.
- Added the `?scenario=scrap-shop&loadout=vertical` acceptance route using the authored 128 px Shop tile, updated HTTP smoke coverage, and locked the economy with five behavior/integration tests.

### Production Scrap Shop UI Batch N2

**Status:** Completed — 18 July 2026; integrated and gameplay-scale reviewed

- Generated and alpha-cleaned six 128 px offer tiles, four 128 px Scrap HUD/effect states, and an empty 1024×576 salvage-terminal panel. The high-resolution chroma sources, transparent masters, exact prompts, frame maps, and deterministic normalizer remain in `art/production-tests/batch-n2/`.
- Registered all three runtime assets in the manifest and integrated them into the live Shop overlay and Combat HUD. The renderer continues to own offer names, descriptions, prices, affordability, selection, input hints, balance, and event timing.
- Added `?mode=gallery&batch=n2`, manifest contracts, required-file smoke coverage, and the review route to the developer guide.
- The 1920×1080 live Shop review caught and fixed an offer-icon draw-order defect. The corrected overlay and gallery passed visual inspection with readable text, clean alpha, distinct silhouettes, and no clipped Shop content.

### Codex/perk/hotkey tile preflight (Batch I)

**Production completed 18 July 2026 (I1–I3).** Retained chroma masters now emit three deterministic tile atlases, a 16-frame slot/tier/discard/merge atlas, 900 × 560 placement panel, 320 × 420 stat card, 1200 × 700 salvage counter, and three action glyphs through `normalize_batch_i.py`. All contracts are manifest-locked and gallery-integrated at `?mode=gallery&batch=i|i2|i3`; the placement panel, weapon tile, stat card, and destination frames are live in `?scenario=weapon-gate`. A 1280 × 720 browser review passed with no runtime warnings. Text, bindings, stats, prices, cooldowns, legal/illegal state, and selection remain code-owned.

- Generated three high-quality held tile families under `art/production-tests/batch-i/`: eight 96px Codex weapon tiles, eight 64px perk tiles, and eight 64px hotkey/action tiles.
- Retained magenta-key masters and prompt contract; runtime normalization and manifest integration wait for the tile/inventory behavior gate so cooldown shadows, bindings, numbers, selection, and disabled states remain code-authoritative.

### Cooldown timer visibility option

- Added persisted `cooldownTimersEnabled` setting, defaulting to `true`, with the existing settings override hook `?timers=0|1`.
- The circular cooldown shadow remains enabled regardless of timer visibility; `?timers=0` hides numeric tile timers while preserving the radial cooldown state.
- Retained three chroma sources, three transparent masters, prompt provenance, exact frame maps, and `normalize_event_horizon.py` under `art/production-tests/batch-l/`.
- Acceptance evidence: transparent-alpha inspection and exact-resolution runtime-art inspection passed. The behavior gate owns aim, pull, implosion, damage, collision, and cooldown acceptance.

### Task 35 — 2-damage combat rescale

**Status:** Completed — 18 July 2026; per-wave scaling and timed pacing remain next

- Rescaled all seven implemented weapons around the 2-damage Service Rifle anchor, including five 1-damage Scattergun pellets, decayed 3-damage Arc chains, the 5-damage Bolt, 4/2 Grenade direct/splash, 2-damage Bulwark cadence, and 4-damage Patrol Blade.
- Moved the full live enemy roster to the authored health/armour/speed table, including 4-health Scuttlers, the 45-health Carapace elite, 600/540-health mini-bosses, and the 2,400-health Bastion Eater with simulation-owned shutters.
- Rescaled the Marine to 10 health and converted hostile contact, ranged, detonation, elite, mini-boss, and boss attacks to the 1–5 range. Shields, heals, ultimate damage, fence damage, combustion, status buildup, Blaze, and Corrode moved in the same pass so no old-scale combat subsystem remained hidden.
- Added a centralized hostile-attack baseline and rules tests for exactly two starter bullets per Scuttler, the five-damage one-hit ceiling, and status magnitude/buildup. Updated behavior expectations without removing their state, reward, resistance, mitigation, or timing assertions.
- Verification: 308 tests across 34 files passed before the full production verify run.

### Task 35 — per-wave scaling and timed threat director

**Status:** Completed — 18 July 2026; later-wave cadence remains future ten-wave expansion

- Added one tested non-compounding scaling contract for ordinary enemy health, armour, eligible shields, movement speed, and outgoing damage. Values are materialized onto each enemy at spawn; elite scaling is reapplied after rank assignment, while mini-bosses and the Bastion Eater remain authored encounters.
- Rebuilt the five-wave director around exact threat costs and budgets of 30/45/65/90/120, distributed in readable 2.5-second pulses under the existing 18/24/32/42/46 live caps and pursuit-led ordinary-threat quotas.
- Waves 3 and 4 now remain active for their full 30/35-second timers even when the arena is briefly empty, then retreat leftovers without kill rewards. Waves 1–2 remain teaching clears and wave 5 remains an untimed mini-boss kill.
- Added enemy shield absorption, per-enemy scaled speed/damage state, timer and threat telemetry, a visible timed-wave countdown, and debug budget/spend output. Rules tests lock exact budgets, pulse scheduling, scaling formulas, boss exclusions, the five-damage cap, and timer-owned completion.

### Task 35 — deterministic fractional projectiles

**Status:** Completed — 18 July 2026

- Added a shared fractional-projectile resolver with deterministic carry rather than random rounding. Every equipped weapon instance owns its carry, initialized from its stable instance id, including newly acquired and newly placed rack weapons.
- Projectile firing uses the resolved integer count for centered spread while stat cards retain the authored fractional value. Positive weapons retain a one-projectile floor unless a future mechanic explicitly enables skipped shots.
- Tests lock canonical fractional rhythms and prove duplicate weapon instances do not share a firing phase.
