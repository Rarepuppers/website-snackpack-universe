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

### Task 35 — player growth, speed tiers, telegraphs, and ten-wave XP gate

**Status:** Completed — 18 July 2026; Batch J1/J2 ready for generation

- Added 0.2 HP/s baseline regeneration on visible three-second ticks, the complete Marine per-level health/armour/damage/speed/support package, and live class proficiency multipliers shared by projectile and melee damage.
- Added the wave-two Swarm Scuttler pack plus live Carapace, Razorlord, Blightspitter, and Quillback Matriarch factories. Expanded Quick Drop to ten authored waves with 52/56 late caps, guaranteed wave 6–9 elites, no more than one fast elite, and the Bastion Eater finale.
- Added code-authoritative ground-slam, rain-of-spines, sweeping-arc, beam, radial-pulse, and off-screen-warning contracts. Crusher and Warden timing/hit geometry now match their warnings; Matriarch rain uses a measured five-reticle layout below the 35% arena ceiling.
- Retuned the quadratic XP path with rank-aware XP and a deterministic ten-wave reference trace constrained to the level 9–12 target.
- Verification at implementation checkpoint: TypeScript and 328 tests across 41 files passed; full production build and HTTP smoke followed in the final gate.

### Production Asset Batch J — Swarm, elites, and hostile telegraph decals

**Status:** Completed — 18 July 2026; creator gameplay-scale review queued

- Generated and retained chroma-key sources plus clean-alpha masters for the Swarm Scuttler, Razorlord, Blightspitter, Quillback Matriarch, large hostile warnings, small warning/effect decals, and danger-fill variants. Rejected the first sweeping-arc source because its full-circle composition could imply danger outside the authored 120-degree sector; the accepted v2 source keeps a legible safe side.
- Added deterministic normalization into seven runtime atlases totaling 76 frames, stable manifest IDs, exact sheet-contract tests, J1/J2 galleries, smoke routes, and a deterministic `?scenario=batch-j&loadout=vertical` live review lab.
- Integrated all four body families with simulation-owned state mapping. Added an explicit Matriarch launch phase and rain-impact event so presentation follows behavior rather than decorative clocks.
- Layered J2 decals beneath code-authoritative ground-slam, sweep, rain, radial, beam, and edge-warning geometry. The placeholder-art switch removes raster decals while leaving functional warnings intact, preserving a portable simulation/presentation boundary for a future Steam renderer.
- Verification: TypeScript and 332 tests across 41 files passed before the final production verify run. Retained sources, prompt history, frame maps, and the normalizer live under `art/production-tests/batch-j/`.

### Rift Stalker behavior gate (Task 36)

**Status:** Completed — 19 July 2026; creator timing/readability review queued; Production Batch O integrated later the same day

- Implemented the third mini-boss as a pure simulation state machine: cloaked stalk (55% incoming damage while cloaked or warping), decoy-mark warp pounce (the mark records the Marine's position at tell start, so moving escapes the strike), a 3-spike rift fan on arrival (5 in frenzy, reusing the hostile quill-spike projectile contract), a telegraphed 50°-half-arc close slash, and a final-20% frenzy that chains one extra warp per cycle with faster tells.
- Damage baselines joined the authored hostile table (pounce 3.5, slash 3/4, spike 1.4) under the five-damage ceiling; 520 health, flat reduction 2, cryo resistance 0.75, flanker steering.
- The mark renders as a major radial-pulse telegraph at the marked point and the slash as a major sweeping-arc, both through the existing code-authoritative telegraph channel; landing on an obstacle safely cancels the teleport.
- Seeded the three-entry mini-boss pool (`selectMiniBossForRoll` now maps thirds) and the 40-threat boss cost; `?scenario=rift-stalker&loadout=vertical` began as the deterministic placeholder-art route and now carries Batch O production presentation.
- Verification: TypeScript clean, 338 tests across 42 files (6 new Rift Stalker rules tests covering pool membership, the full phase cycle, marked-point escape, cloak mitigation vs recovery punish, frenzy-only chained warps, and the 5-spike frenzy fan), production build, HTTP smoke (51 review routes), and a live browser boot of the scenario with no console errors. The ten-wave reference trace passed unchanged.

### Task 33 — consolidated review, mechanical sweep

**Status:** Automated layer completed — 19 July 2026; creator visual/feel judgement remains the open gate

- Built `dev/review-harness.html`: a same-origin dev-server page that boots every documented review route sequentially in an iframe, hooking window errors, unhandled rejections, and console.error, then sampling the canvas for render activity.
- Swept all 61 routes — every combat lab, weapon lab, stress scene, world theme, and production-art gallery: **61/61 passed** with a live canvas, active rendering, and zero runtime errors.
- The creator sitting now only owes the subjective half (readability, timing, feel) with a written approve/retune list per item; no route is mechanically broken.

### Task 37 — front-end shell behavior gate

**Status:** Completed — 19 July 2026; creator layout/copy review queued; Batch G art held until then

- Implemented the code-native screen flow as a pure, unit-tested state machine (`dev/src/game/shell/ScreenFlow.ts`): Title → Menu → How to Play (4 pages) / Settings / Lab / Character select, with keyboard, mouse, and standard-mapping gamepad intents and side effects returned as data.
- `ShellScene` renders placeholder panels in the Last Bastion palette: title with breathing prompt and footer strip, six-card menu grid (EXPEDITION rules chip, RECORDS totals from the save store), paged How to Play with diagram placeholders, Settings rows bound live to `LocalSaveStore` (persist immediately, URL overrides intact), a Lab card surfacing ten review routes in-game, and a hero dossier with the Marine's real passive/ultimate/growth data plus locked Medic and three silhouette slots.
- The bare URL is now the front door; every review parameter still boots straight into combat, `?screen=game` forces a direct run, and `?screen=title` forces the shell. Deploy and Lab hand off by navigating to the target route — each mode boots exactly one scene, which sidesteps a Phaser 4 scene-manager queue stall found during verification and stays correct once the expedition map carries run state through the save store.
- Fixed a real input defect found in browser verification: the Phaser keyboard plugin can deliver capture-list keys twice (immediate + frame queue), double-stepping menus; the shell now owns a single window keydown listener removed on shutdown.
- Verification: TypeScript clean, 346 tests across 43 files (8 new ScreenFlow rules tests), production build, HTTP smoke, and a live browser walkthrough: title → menu → settings toggle persisted to localStorage and restored → locked-Medic confirm refused → Marine deploy into the running ten-wave combat route, with zero console errors.

### Task 38 — expedition map screen and save schema v2

**Status:** Completed — 19 July 2026; creator layout review queued; Batch G2 medallion art held until then; node → encounter wiring is Task 39

- Added `expedition/ExpeditionRun.ts`: pure mid-run state over the tested chart generator — traversal legality (`moveTo` refuses any node not directly reachable), cleared-node accumulation, boss completion, presentation classification (current / reachable / cleared / open / unreachable), and resume validation that degrades tampered or foreign state to "no run in progress".
- Extended `LocalSaveStore` to schema version 2: an `expedition` slot carrying map seed, current node, cleared nodes, and a typed build snapshot (health, shield, level, XP, Scrap, weapon tiers, upgrade levels) reserved for Task 39. Version-1 saves migrate in place, preserving settings, progress, and the Monsterdex; malformed expedition data degrades safely; the codex's bestiary reader is version-agnostic and unaffected.
- Built `ExpeditionScene` (`?screen=map`): code-native starchart with route lines, per-type medallion glyphs, pulsing current node, teal reachable glow, dimmed cleared stamps, greyed unreachable branches, an intel card (node type, region theme, threat hint, column), a dropship flight token, keyboard/mouse traversal, and an expedition-complete panel. `&mapseed=N` reviews a deterministic fresh chart; without it the scene resumes the autosave or rolls a new seed. Travel is "scout mode" until encounters wire in.
- Autosave writes on every arrival and clears on completion. A hidden-tab check during verification exposed a boundary flaw — state advance living inside a render-loop tween — which was corrected: the run state and autosave now advance immediately on the wall clock and the dropship flight is pure decoration, honouring the simulation/presentation split.
- Verification: TypeScript clean, 355 tests across 44 files (6 ExpeditionRun rules tests, 3 schema-v2 save tests, existing v1 fixtures passing through migration untouched), production build, HTTP smoke, and a live browser walkthrough on seed 2026: three-hop traversal with per-arrival autosave confirmed in localStorage, resume from a bare `?screen=map` at the exact position, full traversal to the Bastion Eater node in 8 hops, and autosave cleanup on completion — with zero console errors, all while the tab was background-paused.

### Task 39 — node to encounter wiring

**Status:** Completed — 19 July 2026; campaign multi-wave director completed in Task 48

- Added the pure `ExpeditionEncounter` contract: every chart node deterministically resolves to an existing Combat, Elite, Mini-boss, Supply Depot, Weapon Cache, or Bastion Eater encounter, with theme, seed, depth index, and node-type threat budget kept out of Phaser presentation.
- Changed traversal from “arrival equals clear” to a crash-safe pending-node lifecycle. The map autosaves before deployment; reload resumes the unresolved encounter; only victory appends the node to `clearedNodeIds`; defeat clears the run. Invalid or edited encounter URLs cannot create a free Quick Drop or skip a node.
- Restored and recommitted health, shield, level, XP, Scrap, equipped weapon tiers, and upgrade levels through schema v2. Tier II/III carried weapons retain their 1.6×/2.56× damage steps, and upgrade effects are deterministically replayed before the next encounter begins.
- Combat/Elite nodes bridge to the existing depth-indexed density plans, Mini-boss nodes draw deterministically from Siege Crusher, Brood Warden, and Rift Stalker, safe nodes resolve through the existing full-screen decisions, and the terminus runs the Bastion Eater. Quick Drop remains unchanged at `?screen=game`; Task 48 now supplies the live multi-wave node pacing.
- Added lifecycle, deterministic mapping, build-restoration, safe-node, and depth-budget tests; updated the Codex roadmap from designed to live.

### Task 44 — world-theme enablement

**Status:** Completed — 19 July 2026; all five authored world families live

- Promoted Emberfall, Toxic Bloom, Void Approach, and Arctic Relay from gallery-only preflights into the arena renderer. Each theme now selects its authored six-frame floor, eight-frame boundary, four-frame obstacle, and six-frame low-contrast decal atlas while retaining Batch A collision footprints.
- Added deterministic three-variant lighting per world through the expedition encounter seed. URLs carry `worldseed` separately from mutable build state; the same node always receives the same presentation.
- Placed sparse decals below gameplay and added per-world neutral readability washes. Arctic Relay receives the strongest wash and darker terrain tint because its frost alloy has the highest grayscale luminance.
- Reviewed the Batch J mixed roster, projectiles, HUD, obstacles, and warnings in all five worlds, then deployed seed 4418 from the map into its assigned Emberfall variant. Every route loaded without console warnings and actor/projectile silhouettes remained readable.
- Added theme-family, variant, and expedition-route contracts. Collision, hit tests, telegraph geometry, and simulation remain unchanged.

### Production Asset Batch O — Rift Stalker

**Status:** Completed — 19 July 2026; creator gameplay-scale review queued

- Generated a cohesive 16-frame body sheet, eight-frame combat-effect atlas, and dossier portrait using the established Last Bastion mini-boss art direction. The faceless forward crest, four blade legs, charcoal chitin, violet rift seams, and pale-cyan glints remain consistent across all three masters.
- Preserved untouched green-key generation sources and full-resolution clean-alpha masters. The effect and portrait sources exceed the 4× runtime floor; the body retains the maximum built-in sheet resolution and is never reconstructed from its 128 px derivative.
- Added deterministic nearest-neighbour normalization, stable manifest IDs, exact contract tests, a complete `?mode=gallery&batch=o` route, directional/state-driven body mapping, runtime-owned cloak alpha, and authored mark/warp/pounce/slash/frenzy/defeat effects.
- Combat timing, warning geometry, projectiles, collision, and damage remain simulation-owned. Placeholder rendering remains available with `&art=placeholder` for comparison.

### Task 48 — expedition node-budget encounter director

**Status:** Completed — 19 July 2026; full-route balance observation moves to Task 49

- Added a pure zero-based column contract for 3/3/4/4-wave node budgets: 30/45/65, 65/90/120, 65/90/120/140, then 120/140/160/180 in the final approach.
- Ordinary expedition waves adapt proven Quick Drop pressure compositions to exact budgets without importing mini-boss or boss ranks. Elite and Mini-boss nodes reserve their authored target for a separate kill-owned terminal wave; Boss nodes remain a single authored fight.
- Internal waves receive short intermissions and one shared node reward apportioned across the encounter, preventing the new wave count from multiplying Scrap. Safe nodes remain decision-owned and Quick Drop remains unchanged.
- Rules and integration coverage lock the budget curve, exact spending, rank exclusions, special terminal waves, and elite-node progression through reward collection.

### Canonical perk tile refresh — Batch I v2

**Status:** Completed — 19 July 2026; creator 1080p/4K scale review queued

- Generated seven distinct 128 px production tiles for Veteran, Scrapper, Quartermaster, Fast Learner, Gunsmith, Survivor, and Pathfinder, retaining the chroma master, clean-alpha master, prompt, and deterministic normalizer.
- Integrated the atlas into character selection, the Batch I gallery, the manifest contract, and the browser Codex. The eighth atlas cell is intentionally reserved for future expansion.

### Task 49 — 20-node campaign tuning pass

**Status:** Completed — 19 July 2026; creator full-route feel review queued

- Lowered the protected third-column combat curve from 65/90/120 to 45/65/90 while preserving the four-wave midgame and 180-threat final approach.
- Added guaranteed post-encounter Scrap Shops in zero-based columns 3 and 5, ensuring every eight-node route has two spend decisions. Wounded expedition shops always stock Field Repair; safe nodes now pay 10 Scrap, and their full-screen decision blocks victory until chosen.
- Added `CampaignTuning`, a Phaser-free route projector that enumerates seeded paths, estimates XP at a documented 70% timed-wave clear, totals deterministic Scrap/recovery access, and benchmarks three distinct late builds against the Bastion Eater.
- Swept every route generated by seeds 1–100: two shops, at least two recovery opportunities, 55+ guaranteed Scrap, projected boss entry at levels 9–20, all eight live weapons in the chest pool, and all three reference builds below the 120-second stationary boss benchmark.

### Task 50 — run summary and Records

**Status:** Completed — 19 July 2026; creator 1080p/4K presentation review remains welcome

- Added run-owned combat metrics for kills, gross Scrap earned, and actual post-mitigation damage by weapon. Expedition encounters merge those metrics across node hand-offs; Quick Drop records the current combat session.
- Added the victory/defeat debrief with hero, level, progress, kills, Scrap, per-weapon damage, final weapon tiers, upgrade levels, and newly unlocked perks. The deterministic `?screen=summary&summarydemo=1` route previews a populated result without modifying the save.
- Migrated local persistence to schema v4 and added lifetime runs, victories, best expedition depth, kills, damage, and Scrap. The main-menu Records card now opens the full ledger instead of acting as a label.
- Kept the summary and Records presentation code-native for resolution-independent 1080p/4K output. Browser review at 1280×720 found no clipping, overlaps, or console errors.

### Task 53 — fire-control accessibility gate

**Status:** Completed — 19 July 2026; creator controller-feel review remains welcome

- Migrated local persistence to schema v5 with Auto-fire enabled by default and a first-class Settings row. Older saves inherit the accessible default without losing progress or expedition state.
- Added the in-run `T` / pad-R3 toggle and a compact top-right Auto/Manual HUD chip. Mouse/cursor and right-stick aim remain independent from click/trigger fire in Manual mode.
- Locked autonomous exceptions to the auto-targeting Arc Carbine and cadence-owned Patrol Blade. Every cursor weapon follows Auto-fire or requires its trigger in Manual mode.
- Added input-edge, weapon-policy, simulation-mode, save migration, and persistence coverage. Browser review confirmed both HUD states at gameplay scale with zero console errors.

### Tasks 54–55 — numeric destructible terrain and Production Batch R

**Status:** Completed — 19 July 2026; creator combat-feel review remains welcome

- Replaced the two-hit obstacle counter with typed 50–500 durability, source-authored player projectile/melee and hostile projectile/mini-boss damage, remaining-health events, 1.5-second conditional bars, collision removal at zero, and route-preservation coverage.
- Locked code-owned terrain presentation thresholds at full / below 75% / below 35% / zero and mapped all seven obstacle kinds to stable intact, damaged, critical, and destroyed frames.
- Generated and retained Batch R's exact 4×7 prop family plus 4×2 material-effect family. Untouched chroma sources, clean alpha masters, normalized 4× retained masters, deterministic nearest-neighbour outputs, frame map, prompts, and contact-sheet QA live under `art/production-tests/batch-r/`.
- Integrated bottom-centre terrain pivots, material hit/collapse effects, persistent low destroyed rubble, manifest contracts, gallery coverage, and Codex live status. Collision, HP, thresholds, world tint, hit flash, debris timing, and bars remain simulation/runtime-owned.
- Verification: 407 tests across 54 files, TypeScript, no console warnings in the live Siege Crusher lab or Batch R gallery, and clean 960×540, 1920×1080, and 3840×2160 presentation passes.

### Task 56 — combat silhouette and player-hit feedback

**Status:** Completed — 19 July 2026; rims and projectile halos retained as opt-in review instrumentation

- Added a distinct larger ivory negative-damage number with a dark-red outline for damage received by the player. It uses its own merge identity so incoming hits cannot collapse into enemy damage totals.
- Migrated persistence to schema v6 and added a first-class Reduced flash setting. Level-up, ultimate, and player-hit camera flashes become restrained code-native outline pulses; screen shake remains an independent preference.
- Added `?scenario=batch-j&rims=1` for thin sprite-following actor rims and damage-family projectile halos, `rims=0` for the control, and `flash=0` for deterministic reduced-flash review.
- Full-HD A/B review found no silhouette mud or console warnings, but the readability improvement was modest. The experiment remains opt-in and no authored sprite was changed or given a baked universal outline.

### Task 57 — mini-boss mobility and threat

**Status:** Completed — 19 July 2026; existing production sheets approved at gameplay scale

- Replaced straight-line setup pursuit with a deterministic range-aware orbit shared by Siege Crusher, Brood Warden, and Rift Stalker. The bosses close from long range, peel away when crowded, and add lateral arena traversal between attacks.
- Locked presentation-only body scales to 1.34, 1.30, and 1.25 respectively. Collision radii, telegraph geometry, and damage checks remain simulation-owned.
- Kept windups, attack directions, warp marks, dodge lanes, and punishable recoveries stationary/locked. Regression testing exposed an over-wide Brood Warden orbit that skipped its cleave branch; its preferred band was corrected before completion.
- Added pure steering, deterministic handedness, opening lateral-travel, and scale-band contracts. Live encounter review covered Emberfall, Toxic Bloom, and Void Approach with the existing sheets; no art extension was necessary.

### Task 58 — Infected Survivor movement

**Status:** Completed — 20 July 2026; dedicated behavior lab live, normal-wave promotion held for family completion

- Promoted the Batch M Infected Survivor body into `?scenario=infected-survivor` with an authored eight-unit pack while leaving Quick Drop and expedition compositions unchanged.
- Added 1.2 seconds of sprint stamina, 5.15 m/s peak speed, frame-rate-independent 11 m/s² acceleration, 14 m/s² deceleration, staggered hesitation, and finite recovery. The two production gait rows animate from simulation-owned velocity and phase.
- Added forward-floored pack separation: local avoidance may fan the group, but every steering vector retains at least 55% pursuit intent so survivors cannot settle into an orbiting crowd ring. Pack-cap and angular-gap tests preserve a broad escape lane.
- Split controller radial dead zones by role: 0.18 movement for low-speed steering and 0.25 aim for drift resistance, with continuous rescaling outside both zones.
- Browser review confirmed clean pack/cover traversal and readable silhouettes in Emberfall, Toxic Bloom, and Void Approach. The canvas remained internally 960×540 and scaled exactly to 1920×1080 and 3840×2160 without page overflow.

### Task 59 — Corrupted Marine knife lifecycle

**Status:** Completed — 20 July 2026; dedicated behavior lab live, normal-wave promotion held for Task 62

- Added `?scenario=corrupted-marine` with two Batch M Marines using their authored guard, knife-windup, and recovery rows plus the complete knife/effect atlas.
- Locked the combat sequence to 0.72s line-and-ring tell → 6 m/s non-homing knife → player, cover, or expiry impact → 0.65s recovery → 2.8s cooldown. Projectile-budget pressure extends the tell instead of silently dropping the attack.
- Added source-Marine impact telemetry with actual player damage. Cover and expiry events explicitly report zero player damage, while the ordinary damage event remains the single source of health loss.
- Added deterministic stationary-hit, perpendicular-dodge, cover-intercept, projectile-speed, phase-cycle, and repeat-cooldown tests. Full-HD browser review confirmed readable body states, locked lines, target rings, impact feedback, and no presentation overlap.
- Added Task 62 as the family-completion gate for Abomination behavior, off-screen Marine warnings, mixed-wave tuning, and eventual normal-run promotion; Abomination Prime remains deferred.

### Enemy-roster expansion plan — summoners, rogue science, and machines

**Status:** Designed — 20 July 2026; behavior gates precede production art and wave promotion

- Added Task 63 for the Nest Weaver, a mobile alien summoner that lays destructible timed egg pods. Pods and hatchlings consume reserved threat/live slots, cannot chain-spawn, and remain under hard per-owner and encounter caps.
- Added Task 64 for the Storm Savant, a mad xenotechnician whose coil/psionic apparatus presents as magic-lightning while using locked conductive-node paths, destructible counters, finite hops, colour-independent geometry, and vulnerable overload recovery.
- Added Task 65 for a Machine uprising roster: Scrap Skitterer, Arc Warden, Cyborg Reclaimer, and the finite-charge Foundry Fabricator summoner. Repair/fabrication channels are interruptible and machine children never recurse.
- Added Task 66 to expand the mini-boss pool only from proven families: Synapse Herald, Assembly Prime, Storm Regent, then Abomination Prime. Every candidate retains the existing behavior-lab, no-immediate-repeat, reward, warning, recovery, and 45–90 second gates.

### Task 60A — accessibility and display foundations

**Status:** Implemented — 20 July 2026; per-action keyboard/controller remapping remains before Task 60 completion

- Added a pure simulation-space UI safe-area contract and moved the combat HUD's major edge anchors inside it. Exact projection tests cover the 960×540 base, 1920×1080 Full HD, and 3840×2160 4K.
- Added lifecycle-safe window-blur/document-hidden listeners. Losing focus always pauses and returning focus never resumes automatically; scene shutdown removes both listeners.
- Added one unique geometry signature for each major telegraph family and used its edge weight/markers in code-drawn warnings, so danger identity does not rely on hue.
- Reduced floating combat text from 40 to 24 concurrent labels. Ordinary outgoing numbers recycle first, while player-damage and healing feedback are preserved; same-enemy 100 ms merging remains active.
- Verification: TypeScript clean, 435 tests across 59 files, production build green, and exact no-overflow Full HD/4K browser measurements. Existing Vite output-directory and large-chunk warnings remain unchanged.

### Task 60B — persisted control remapping

**Status:** Completed — 22 July 2026; Task 60 accessibility/display gate closed

- Added one portable control-binding contract based on stable browser key codes and standard gamepad button names rather than Phaser-specific save values. Ten keyboard actions and six controller actions are independently remappable.
- Added a two-column Control Bindings screen under Settings with keyboard/controller switching, capture overlays, Escape cancellation, and automatic collision swaps so one physical input never silently triggers two gameplay actions.
- Migrated saves to schema v7. Versions 1–6 inherit accessible defaults; malformed individual bindings fall back safely while valid custom assignments persist.
- Routed active bindings through `KeyboardMouseInput`, `GamepadIntentMapper`, action tiles, fire-mode chip, combat footer, and How to Play copy. Controller edge triggering, separate movement/aim dead zones, mouse aim/fire, and fixed menu navigation remain unchanged.
- Verification: TypeScript clean, 442 tests across 60 files, production build and smoke test green. Full-HD browser QA covered Settings navigation, capture overlay, persistence into combat labels, exact no-overflow presentation on a 1.25 DPR display, default restoration, and zero console warnings.

### Task 61A — fixed-step replay and compatibility contract

**Status:** Implemented — 22 July 2026; Task 61 remains in progress

- Added replay format v1 with an explicit simulation-compatibility version, safe-integer world seed, canonical 1/60-second step, and compact repeated-input spans. Replay code depends on `CombatSimulation` and `PlayerIntent`, never Phaser presentation.
- Added strict rejection for unknown replay formats, changed simulation-rule versions, noncanonical timesteps, invalid seeds, and invalid frame spans instead of attempting unsafe best-effort playback.
- Added a deterministic Corrupted Marine fixture covering movement, sustained fire, and a one-frame evade edge. Its canonical snapshot hashes to committed digest `346f7115`; seed or input divergence produces a different digest.

### Task 61B — decision-aware replay and offline boot contract

**Status:** Implemented — 22 July 2026; Task 61 remains in progress

- Extended replay format v1 with one-frame decision choices and an optional seeded expedition encounter descriptor. Canonical digests now include pending decisions and equipped weapon state; fixtures cover weapon placement and expedition combat setup.
- Added an executable production-build audit that rejects external document resources, remote imports/assets, and remote startup calls, then verifies every referenced `/game-assets/` file exists locally. The current build resolves 110 local asset references with zero missing or remote startup dependencies.
- Wired the audit into `npm run verify` after build and smoke verification so offline regressions fail the normal gate.

### Task 61C — platform progress and cloud conflict policy

**Status:** Implemented — 22 July 2026; Task 61 remains in progress

- Added stable platform-neutral achievement IDs and pure unlock events for first run, first victory, wave ten, expedition victory, 100 kills, and 1,000 kills. Callers pass acknowledged IDs so platform retries remain idempotent.
- Added a deterministic schema-v7 cloud-save resolver. Revision, timestamp, and device ID provide a total ordering; preferences and active-run state follow the preferred envelope while monotonic career and bestiary values merge by maxima to avoid duplicate-run inflation.
- Divergent simultaneous expeditions are explicitly reported for future UI handling, and unknown save schemas fail closed. Steam Input/Steamworks transport and acknowledgement adapters remain the final Task 61 integration spike.

### Task 61D — Steamworks bridge and chained replay spike

**Status:** Completed — 22 July 2026; Task 61 closed

- Added an injected Steamworks bridge for canonical achievement queries/unlocks, one batch stats commit, and the versioned `last-bastion-save-v7.json` cloud slot. Failed commits acknowledge nothing and remain safe to retry; duplicate and already-unlocked events are suppressed.
- Added strict cloud-envelope parsing before platform data reaches conflict resolution. Malformed JSON, invalid revisions/timestamps/device IDs, and unsupported save schemas fail closed.
- Added an order-sensitive three-encounter expedition replay chain covering 720 fixed frames and committed digest `592fb73a`. Reversing encounter order changes the chain digest.
- Kept all bridge calls behind injected interfaces, so the web build has no Steam SDK dependency. Real SDK initialization and packaging can be selected with the desktop wrapper without changing simulation, progress, or cloud rules.

### Task 62A — Abomination phase contract

**Status:** Implemented — 22 July 2026; Task 62 remains in progress

- Added a pure deterministic Abomination phase machine: shamble outside range, lock the target on a 0.9-second slam windup, emit exactly one committed impact, hold a 1.35-second vulnerable recovery, then enforce a repeat cooldown.
- Movement is disabled through tell, impact, and recovery; the locked impact point never follows later player movement. Combat integration, authored Batch M row selection, Marine off-screen warnings, and mixed-wave promotion remain next.

### Task 62B — live Abomination slam lab

**Status:** Implemented — 22 July 2026; Task 62 remains in progress

- Added the Abomination as an eight-threat specialist with 34 health, two armour, a 1.2 m/s shamble, and the retained 4 × 3 / 128 px Batch M body sheet.
- Integrated the pure phase contract into `CombatSimulation`. The dedicated lab locks a persistent nested-ring/cardinal-bracket target for 0.9 seconds, commits exactly one 1.55 m slam for 2.6 base damage, then exposes the authored 1.35-second recovery and repeat cooldown.
- Routed slam overlap into Task 54 numeric terrain durability as the distinct `enemy-slam` source for five damage. The impact never retargets after warning lock.
- Wired shamble, attack, and recovery phases to all three authored body rows, added the lab route and HUD label, and added stationary-hit, perpendicular-dodge, single-impact, recovery, and terrain-damage regression coverage.
- Full HD browser review confirmed a readable shape-coded marker, clean family silhouettes, exact 960 × 540 to 1920 × 1080 scaling, and zero console warnings. The 4K pass scaled exactly to 3840 × 2160 with no overflow or warnings.

### Task 62C — mixed outbreak and off-screen Marine warnings

**Status:** Implemented — 22 July 2026; normal/expedition promotion remains

- Added canonical introduction, crossfire, and overrun plans at 10/22/32 threat. Their 8/10/12 live caps admit no more than two Marines, introduce the Abomination only after the first role-pair wave, and contain no foreign family or recursive-spawn path.
- Added `?scenario=corrupted-human` with six Survivors, two Marines, and one Abomination. One Marine begins outside the camera while inside its legal attack range, exercising the same locked knife lifecycle as the isolated lab.
- Added a warm ring-and-directional-chevron edge marker for off-screen Marine windups while retaining the world-space knife line and target ring. Full HD browser review showed the marker clearly at the lower edge with readable mixed silhouettes and no warnings; 4K had no overflow or console warnings.
- Added event-aware placeholder audio IDs for all eight implemented weapons and the Marine/Abomination threat sequence. These IDs are the stable replacement seam for Production Audio Batch S.

### Asset-generation audit — next production order

**Status:** Planned — 22 July 2026

- Do not generate more Task 62 sprites or projectiles: Batch M already covers every live body row, knife projectile/travel wake, warning accent, and cover/player impact. Keep Abomination slam radius, Marine line, countdowns, and edge markers code-native.
- Generate Production Audio Batch S next: S1 eight weapon attack families (Bulwark Rotary uses start/loop/end), S2 Corrupted Human warning/throw/impact/recovery cues, then S3 shared impacts, pickups, progression, UI, and boss stingers.
- After Task 63 egg lifecycle tests pass, generate Nest Weaver bodies plus pod/hatch effects as one visual batch. No free-flying projectile is required; placement target and hatch clock remain code-native. Storm Savant art follows its locked-node behavior test and uses code-drawn lightning paths rather than rasterized hit geometry.

### Task 62D — conservative normal and expedition promotion

**Status:** Completed — 22 July 2026; Task 62 closed

- Promoted the family through equal-threat substitutions rather than additive difficulty. Survivors replace Scuttlers, Marines replace four-threat Quillbacks, and Abominations replace eight-threat specialist packages, preserving every existing wave budget and ordinary pressure share.
- Quick Drop introduces six Survivors in Wave 3, one Marine in Wave 4, and the first Abomination in Wave 7. Late waves never exceed 12 Survivors, two Marines, or two Abominations; the final boss wave remains untouched.
- Expedition generation inherits the same authored templates: budget 65 introduces Survivors, 90 introduces a Marine, and 140 introduces the first Abomination. Node budgets, route topology, terminal elite/mini-boss/boss waves, and exact-budget filling remain unchanged.
- Added deterministic wave-by-wave family counts, pursuit/ranged-share bounds, enemy caps, exact threat totals, expedition thresholds, and route-budget preservation tests. Production Audio Batch S remains the parallel asset track; Task 63 Nest Weaver is the next gameplay gate.

### Task 63A — Nest Weaver reservation and pod lifecycle

**Status:** Implemented — 22 July 2026; Task 63 remains in progress

- Added a pure code-first summoner contract with three finite placement charges and a hard two-live-pod cap per owner.
- Placement reserves the pod's immediate two threat plus three future one-threat hatchlings and all three future live slots before a pod may be created. Insufficient charges, owner capacity, encounter live capacity, or threat budget rejects placement explicitly.
- Added nine-health destructible pods with a visible-contract six-second countdown. Surviving pods hatch one fixed three-unit payload exactly once; hatchlings carry `canSummon: false`, preventing recursive chains.
- Destroying a pod before hatch releases all reserved future slots and threat. Live simulation, placement telegraph, recovery, pod HUD, and route/cap integration remain before the Nest Weaver visual batch is authorized.

### Task 63B — Nest Weaver live behavior and route gate

**Status:** Completed — 22 July 2026; Task 63 closed

- Integrated a mobile support-range Weaver with a locked 0.85-second placement point, finite three-charge package budget, hard two-pod owner cap, and 1.4-second stationary recovery. Killing a Weaver during windup refunds its pending child reservation.
- Added ordinary destructible nine-health pods, visible six-pip countdowns, exact three-child hatches, and small non-recursive rush hatchlings. Pod destruction refunds the three reserved future slots/threat; successful hatch consumes them once.
- Added the deterministic `?scenario=nest-weaver&loadout=vertical` route with an 18-unit cap, code-native placement/countdown geometry, exhaustive catalog/director mappings, and 1080p review. The route showed readable locked placement and countdown language with no console warnings.
- Verification: TypeScript and 477 tests across 69 files pass, including live placement/recovery, destruction interruption, exact hatch payload, recursion prevention, and reserved-footprint cap coverage. The exact production body/pod/effect/audio package is now authorized; distinct hatchling art remains conditional.

### Task 64A — Storm Savant locked-chain boundary

**Status:** Implemented — 22 July 2026; Task 64 in progress

- Added pure six-health conductive nodes and a locked chain contract with a 1.15-second tell, maximum two hops, one discharge edge, and 1.7-second vulnerable overload recovery.
- Committed segments retain their original coordinates even if nodes move; no discharge-time homing or retargeting exists. Destroying any locked node cancels the attack and immediately forces overload recovery.
- Added player-radius segment geometry and sampled escape-lane validation. Focused TypeScript and four deterministic chain, cancellation, geometry, and lane tests pass.

### Task 64B–C — cover-aware placement and live Storm Savant route

**Status:** Completed — 22 July 2026; Task 64 closed

- Added deterministic collision-free two-node placement that refuses layouts without a player-sized sampled escape lane. Each node has six health and existing conditional enemy-health presentation.
- Intact cover clips the first intersecting chain segment at its exact entry point and prevents downstream propagation. Locked coordinates remain fixed through the warning and one discharge; destroying either node cancels the attack into 1.7 seconds of overload recovery.
- Integrated the 16-health Shock-resistant Savant, nodes, 2.5-damage chain, interruption telemetry, code-native double-rail ladder/rungs, circular node markers, square cover-stop markers, and dedicated `?scenario=storm-savant&loadout=vertical` route.
- Focused live and pure coverage passes nine tests. Full HD browser review caught a low-contrast rail and prompted the final outlined ladder signature; the revised route is readable without colour and reports no console warnings. Production Savant/node/effect/audio assets are now authorized; raster lightning remains prohibited.

### Task 65A — Scrap Skitterer movement boundary

**Status:** Implemented — 22 July 2026; Task 65 in progress

- Added the first machine-family pure behavior: a stationary 0.55-second acceleration tell locks direction before a finite 0.65-second 6.8 m/s rush. Player movement cannot retarget a committed rush.
- Rush completion forces 0.9 seconds of hard braking and a 2.3-second repeat cooldown before ordinary approach resumes.
- Added a 1.8-second visible wreck contract with `damagesPlayer: false`; no hidden death explosion or damaging corpse is permitted. TypeScript, three focused cadence/locking/wreck tests, and diff hygiene pass.

### Task 65B — Scrap Skitterer live route gate

**Status:** Completed — 22 July 2026; Task 65 continues with Arc Warden

- Integrated the four-health Shock-weak machine common with collision-safe committed rushes. Player contact deals 2.2 damage once; cover obstruction and natural rush expiry terminate safely into the same hard-brake recovery.
- Added an exact eight-unit lab cap, source-authored warning/rush/impact telemetry, code-native directional warning rails, phase-readable bodies, and 1.8-second machine wrecks. Wrecks remain visible but cannot damage or slow the player and expire independently from slowing-slime caps.
- Focused pure/live coverage passes eight tests for direction locking, cadence, cover/player/miss braking, 50% Shock weakness, harmless wreck lifetime, and route cap. TypeScript and the 494-test suite pass; Full HD browser review preserves clear play space and HUD readability with no console warnings.
- The exact Scrap Skitterer body/effect/audio package is now authorized in `last-bastion-content.md`. Arc Warden is next; no other machine-family artwork is authorized yet.

### Task 65C — Arc Warden fixed-beam implementation

**Status:** Implemented — 22 July 2026; presentation acceptance and production-art authorization pending

- Added the Shock-weak, armour-two ranged specialist with standoff repositioning and committed stationary attack phases: 1.05-second charge, one 0.12-second discharge, 0.85-second recovery, and 2.4-second repeat cooldown.
- The narrow 8.5-metre lane stores its origin, direction, and endpoint at charge start. Player movement cannot retarget it; the first intact cover intersection becomes a terminal square stop and no downstream chain exists.
- Added source-authored warning/discharge/hit telemetry, player-radius beam geometry, a two-Warden route, code-native double rails and timing rungs, diamond free endpoint, square cover endpoint, phase-readable placeholder body, HUD title, Lab entry, and review-route documentation.
- Verification passes TypeScript, 502 tests across 75 files, production build, HTTP smoke, and offline audit with 89 art assets, 51 routes, 110 local references, and zero remote startup dependencies. Full HD/4K route review remains the behavior gate before Arc Warden art/audio is authorized.

### Task 65D — Arc Warden presentation acceptance

**Status:** Completed — 22 July 2026; Arc Warden production package authorized

- Full HD and 4K review accepted the dark-backed cyan double rails, non-colour timing rungs, diamond free endpoint, phase-readable rectangular Warden silhouette, and stable HUD/title-safe scaling under simultaneous weapon effects.
- Strengthened the lab so one Warden begins with a long authored lane into intact west biomass while the second demonstrates a free endpoint. The square cover stop is now guaranteed, visibly terminates before the player, and cannot be confused with the free diamond.
- Normal Warden acquisition still obeys the 3.4–9.5 metre behavior range; the prelocked long lane is isolated to presentation QA. Production body/effect/audio requirements are now authorized in `last-bastion-content.md`; beam rails and endpoints remain code-native.

### Task 65E — Cyborg Reclaimer repair boundary

**Status:** Implemented — 22 July 2026; live integration and production-art authorization pending

- Added a pure finite support contract with three four-health patches, a 1.25-second locked channel, 1-second exposed recovery, 3.2-second repeat cooldown, 6.5-metre acquisition range, and 7.5-metre hard tether break.
- Deterministic targeting prioritizes lowest health ratio, then distance, then stable entity ID. Self, another Reclaimer, non-machines, dead/full-health units, mini-bosses, and bosses are rejected before channel acquisition.
- The encounter supplies the active-link owner, preventing multiple simultaneous repair tethers. Incoming Reclaimer damage, invalidation, death, full healing, or excessive range interrupts without consuming a patch; successful completion caps at missing health and consumes exactly one charge.
- Five focused selection, exclusivity, no-overheal, interruption, range, and exhaustion tests pass. Full verification now passes TypeScript and 507 tests across 76 files plus production build, HTTP smoke, and offline audit. Live movement/tether/route integration remains before production assets are authorized.

### Task 65F — Cyborg Reclaimer live and presentation gate

**Status:** Completed — 22 July 2026; Reclaimer production package authorized

- Integrated the 18-health, armour-three, Shock-weak support bruiser. Seeking movement closes on damaged ordinary machines; channel and recovery are stationary. Actual incoming mitigated damage marks the live channel for interruption before its next repair tick.
- Successful completion applies capped health directly to the locked live target and emits source/target/amount telemetry. Damage and invalid/range breaks emit distinct interruption reasons without spending a patch; multiple live Reclaimers still yield at most one channel.
- Added one Reclaimer, one Arc Warden, and four Scrap Skitterers to a deterministic six-unit lab with three pre-damaged allies. The HUD/Lab/parser route and code-native rounded body, dark-backed green tether, four yellow progress beads, and circle-plus target signature are live.
- Nine focused pure/live tests and the full 511-test suite across 77 files pass, along with TypeScript, production build, HTTP smoke, and offline audit. Full HD/4K review found the support relationship readable beside beam lanes and rush arrows. Exact Reclaimer body/effect/audio assets are now authorized; Foundry Fabricator is next.

### Task 65G — Foundry Fabricator reservation lifecycle

**Status:** Implemented — 22 July 2026; live integration and production-art authorization pending

- Added three finite fabrication charges and a hard two-live-child owner cap. A drone reserves one live slot plus two threat; a turret reserves one live slot plus three threat before channel start. Charges, owner cap, encounter live cap, and remaining threat reject with explicit reasons.
- A locked 1.6-second fabrication channel owns a visible-contract six-health pad. Owner damage or pad destruction interrupts into 1.4 seconds of recovery, spends no charge, creates no child, and returns the complete reservation exactly once.
- Successful completion consumes one charge and creates exactly one non-fabricating payload: a 12-second drone or 16-second turret. Re-stepping cannot duplicate it. Owner-exit cleanup identifies only that owner's children for safe power-down.
- Five focused reservation, cap, completion, recursion, interruption/refund, and cleanup tests pass. Full verification passes TypeScript and 516 tests across 78 files plus production build, HTTP smoke, and offline audit. Live pad/child/accounting/route integration remains before art or audio authorization.

### Task 65H — Foundry Fabricator live and presentation gate

**Status:** Completed — 22 July 2026; Task 65 Machine uprising complete

- Integrated the 22-health armour-three Shock-weak Fabricator, targetable six-health pad, 12-second pursuit drone, and 16-second stationary turret. Live reservation telemetry tracks slots and threat independently from existing Nest reservations; pad destruction and owner damage refund exactly once without spending a charge.
- Successful fabrication consumes the reservation into one owner-tagged non-recursive child. Children expire safely, and owner defeat removes pending pads, releases pending reservations, and powers down only owned children. Pads remain targetable but do not consume encounter live-unit capacity.
- Replaced the turret's initial instant hit with a locked 0.55-second colour-independent double-rail warning, timing rungs, and endpoint circle. The shot cannot retarget after warning, uses player-radius line geometry, stops dealing damage through intact cover, and enters a visible recovery.
- Added the dedicated mixed-machine route, HUD/Lab/parser entry, code-native Fabricator/pad/drone/turret silhouettes, reservation/cap snapshots, and five live tests covering pad HP/refund, owner interruption, alternating children, non-recursion, turret warning/discharge, cleanup, and the eight-unit ceiling.
- Full verification passes TypeScript, 521 tests across 79 files, production build, HTTP smoke, and offline audit. Full HD review caught and corrected an over-close pad offset; the widened placement and final turret lane pass Full HD/4K with no new console errors. Exact five-family Foundry art and event-audio requirements are now authorized in `last-bastion-content.md`. Task 66A Synapse Herald is next.

### Task 66A — Synapse Herald behavior and presentation gate

**Status:** Behavior/presentation completed — 22 July 2026; production package authorized, random-pool promotion held

- Added a pure seeded scheduler with entrance/setup/windup/action/recovery phases, no immediate move repeats, unavailable-link skipping, and target locking at windup. Normal lunge chains lock two targets and final-20% chains add exactly one third; marked zones always lock exactly three arena-clamped positions with no frenzy coverage growth.
- The four-second synapse link deterministically selects the nearest ordinary Brain Blob with a stable-ID tie break, excludes elites/bosses, grants the Herald 45% incoming-damage mitigation, and breaks immediately on death, invalidation, or seven-metre separation. Fifty- and twenty-percent thresholds shorten tells/recoveries without adding hazards.
- Integrated the 560-health, armour-two mini-boss, standard rank/reward/status contracts, setup orbit, one-hit-per-step lunge collision, three-zone eruption, link lifecycle telemetry, off-screen warnings, HUD/Lab/parser route, ten-unit scenario ceiling, and snapshot diagnostics. The initial three-member random mini-boss pool is intentionally unchanged.
- Added code-native colour-independent danger circles/plus signs, dark-backed alternating lunge path and endpoint rings, and dark-backed link line/target ring. Full HD and 4K review found all three move families readable with no console errors; gameplay geometry remains code-owned.
- Full verification passes TypeScript, 533 tests across 81 files, production build, HTTP smoke, and offline audit. Exact Herald body/effect/portrait and event-audio requirements are authorized in `last-bastion-content.md`. Pool promotion waits for production-silhouette mixed-wave review and a representative 45–90-second fight; Task 66B Assembly Prime is next.

### Task 66B — Assembly Prime pure behavior boundary

**Status:** Implemented — 22 July 2026; live integration and production-art authorization pending

- Added a seeded entrance/setup/windup/action/recovery scheduler for rotating lanes, fabrication, and a one-use drone recall. Legal moves never immediately repeat; if every alternative is cap- or resource-blocked, Prime waits instead of silently repeating an attack.
- Rotating lane control locks and exposes exactly three origins/directions at windup and never retargets after warning. Fifty- and twenty-percent thresholds shorten tells, lane execution, and recovery without adding lanes or pressure.
- Fabrication calls the proven Foundry reservation boundary for exact one-slot/two-threat drone or one-slot/three-threat turret accounting. Three finite charges, two owned children, live cap, reserved slots, and remaining threat are enforced before the ten-health pad appears. Owner damage or pad destruction refunds the complete reservation without spending a charge.
- Successful assembly creates exactly one finite 12-second drone or 16-second turret with `canFabricate: false`. The one recall deterministically chooses the lowest-lifetime owned live drone, then stable ID, and creates/reserves nothing. Live integration must relaunch that same entity without healing or extending its lifetime.
- Six focused tests cover deterministic selection/waiting, lane target lock, exact reservations, single-spawn ownership, pad/owner interruption, recall ownership and tie-breaking, frenzy invariants, and child-cap blocking. Full verification passes TypeScript, 539 tests across 82 files, production build, HTTP smoke, and offline audit. Assembly Prime remains outside the pool and all production art/audio remains blocked until its live behavior and presentation gate passes.

### Task 66B — Assembly Prime live behavior integration

**Status:** Implemented — 22 July 2026; presentation accepted below

- Integrated the 720-health, three-flat-reduction Shock-weak mini-boss with standard rank, guaranteed arsenal-cache reward, HUD/Lab/parser route, ten-unit ceiling, and no random-pool promotion.
- Live fabrication reserves the same global slot/threat telemetry as Foundry, exposes a real ten-health pad, refunds exactly on pad/owner interruption, and consumes into one owner-tagged finite non-recursive drone or turret. Owner defeat releases pending pressure and removes its pad/children.
- The one recall moves the same lowest-lifetime owned drone entity to Prime and relaunches it toward the player without cloning, healing, extending lifetime, or changing reservation telemetry.
- Rotating-lane windup exposes all three fixed directions before action. Each lane discharges exactly once, respects intact-cover blocking, uses player-radius segment collision, and final-20% timing adds no lane. Code-native dark backing, alternating amber/cyan rails, and non-colour timing beads are wired for presentation review.
- The full gate passes TypeScript, 545 tests across 83 files, production build, HTTP smoke, and offline audit. A shared mobility regression caught the first spawn pressing into west biomass; relocating the authored lab spawn restores a readable opening orbit without weakening the movement threshold. Art/audio authorization remains blocked until Full HD/4K review.

### Task 66B — Assembly Prime presentation acceptance

**Status:** Completed — 22 July 2026; production package authorized, random-pool promotion held

- Full HD and 4K review accepted the broad placeholder silhouette, stable boss HUD, targetable reinforced pad, and same-entity recall relationship under concurrent Arc Warden, Scrap Skitterer, weapon, damage-number, and obstacle pressure. No browser console warnings or errors occurred.
- All three lane directions remain visible before discharge through dark backing, alternating amber/cyan rails, and three white non-colour timing beads per lane. The rails remain individually traceable through mixed-machine silhouettes and do not obscure the boss bar.
- The recall tether remains readable when the drone reaches the player cluster, while the pad target ring and body remain distinguishable near terrain. Production art must preserve those anchors rather than rasterizing gameplay geometry.
- Exact Prime body, reinforced pad, effects, portrait, and event-audio requirements are authorized in `last-bastion-content.md`. Existing Foundry drone/turret bodies and sounds are reused; no projectile atlas or Prime-only child family is permitted. Pool promotion waits for production mixed-machine review and a representative 45–90-second fight. Task 66C Storm Regent is next.

### Task 66C — Storm Regent pure behavior boundary

**Status:** Implemented — 22 July 2026; live integration and production-art authorization pending

- Added a deterministic entrance/setup/windup/action/recovery scheduler for chain strike, node overcharge, and close coil burst. Legal moves never immediately repeat; after all node counters are destroyed, Regent waits rather than repeating its only remaining coil pattern.
- Regent owns exactly three deterministic finite six-health conductive nodes in the standard open layout. Chain strike selects live nodes deterministically, locks no more than the existing two-hop cap, clips permanently at first intact cover, and never retargets after warning.
- Node overcharge locks one live node and a 1.6-metre danger radius. Destroying its committed node or any committed chain node cancels before discharge and forces exposed recovery. Nodes are never replaced or healed by the scheduler.
- The 2.8-metre close coil burst locks to Regent's position at windup. Chain, overcharge, and coil availability all require at least one sampled player-radius escape point; final-20% pressure shortens windup/recovery only and cannot add nodes, hops, radius, or simultaneous patterns.
- Seven focused Regent tests plus six inherited Savant tests cover deterministic finite placement, no-repeat waiting, target locking, two-hop bounds, cover stops, destruction cancellation, overcharge ownership, escape lanes, and frenzy invariants. Full verification passes TypeScript, 552 tests across 84 files, production build, HTTP smoke, and offline audit. Task 66C live integration is next; all Regent art/audio remains blocked.

### Task 66C — Storm Regent live behavior integration

**Status:** Implemented — 22 July 2026; Full HD/4K presentation acceptance pending

- Integrated the 760-health, two-flat-reduction Shock-resistant mini-boss with three real owner-tagged six-health Storm node entities, standard rank and guaranteed arsenal-cache reward, HUD/Lab/parser route, ten-unit ceiling, and no random-pool promotion.
- Live state synchronizes node damage/destruction into the pure scheduler before every step. Destroying a committed chain or overcharge node cancels before discharge into exposed recovery; defeating Regent removes only its owned live nodes.
- Chain strike uses the locked cover-clipped segments and player-radius geometry. Node overcharge uses its committed node and 1.6-metre radius; coil burst uses Regent's locked windup position and 2.8-metre radius. Each committed action emits exactly one warning and one discharge/interruption event.
- Code-native presentation exposes dark-backed cyan chain rails, three white square timing beads per segment, circular live-node endpoints, amber square cover stops, and dark-backed radial rings with eight non-colour ticks for overcharge/coil. Node health bars remain conditional and gameplay-owned.
- Five live tests plus the pure and shared mobility suites cover exact targetable node ownership, immediate interruption, one-resolution-per-pattern, safe coil damage geometry, owner cleanup, reward/pool preservation, and the ten-unit route. Full verification passes TypeScript, 558 tests across 85 files, production build, HTTP smoke, and offline audit.

### Task 66C — Storm Regent presentation acceptance and production authorization

**Status:** Completed — 22 July 2026; random-pool promotion deliberately held

- Reviewed the deterministic Storm Regent Lab in the in-app browser at 1920×1080 and 3840×2160. The boss HUD, conditional node bars, dark-backed cyan chain language, white timing beads, endpoint circles, amber cover stops, node-overcharge ring, and coil ring/radial ticks remain readable over the arena without clipping or console warnings.
- Authorized exactly four retained-master visual families: the directional Regent body, six-state conductive node, two-frame impact/effect family, and portrait. Chain rails, hops, cover stops, target/radius rings, timing ticks, collision, health, damage, and phase timing remain code-owned; no projectile atlas is permitted.
- Authorized event-driven Regent audio after Batch S1: chain escalation/discharge, node warning/discharge/interruption/destruction, coil charge/burst, recovery, hurt, entrance/reward, and defeat cues. Loops must stop immediately on interruption and may not encode variable simulation timing.
- Random-pool promotion remains blocked until production assets pass 960×540/Full HD/4K mixed-enemy readability and a representative intended loadout records a 45–90-second kill across at least three seeded fights. Task 66D Abomination Prime pure behavior is next.

### Task 66D — Abomination Prime pure behavior boundary

**Status:** Implemented — 22 July 2026; live integration and all production authorization pending

- Added a deterministic entrance/setup/windup/action/recovery scheduler for locked ground slam, breakable biomass grab, and regenerating thrown biomass. Legal moves never immediately repeat; when only the previous move remains legal, Prime waits instead of bypassing the rule.
- Ground slam locks one 1.8-metre target. Grab acquires within 4.6 metres, hard-breaks beyond 5.5 metres, and enters exposed recovery on dodge, cover/line loss, range loss, or 32 post-mitigation active-grab damage.
- Thrown biomass locks one collision-safe landing point, creates at most one 2.1-metre hazard for 4.5 seconds, and restores throw availability only after the 5.5-second regeneration clock. Hazard expiry and regeneration are deterministic simulation state rather than animation timing.
- All three moves require sampled player-radius escape space. Final-20% pressure shortens tells/recovery only and cannot change radii, grab threshold, hazard lifetime, regeneration, simultaneous-hazard count, or move count.
- Seven focused Prime tests plus the inherited base Abomination tests pass. Full verification passes TypeScript, 565 tests across 86 files, production build, HTTP smoke, and offline audit. Task 66D live integration is next; all Prime art/audio remains blocked.

### Task 66D — Abomination Prime live behavior integration

**Status:** Implemented — 22 July 2026; Full HD/4K presentation acceptance pending

- Integrated the 920-health, three-flat-reduction, Toxic-resistant mini-boss with a 1.25 m/s setup orbit, standard mini-boss rank and arsenal-cache reward, HUD/Lab/parser route, ten-unit ceiling, and no random-pool promotion.
- Ground slam locks its warning point, deals 4.2 base player damage plus 180 numeric terrain damage, resolves once, and enters recovery. Grab shares the global forced-movement reservation, deals 1.6 base latch damage, pulls at 1.25 m/s, and breaks on evade, cover, hard range, expiry, or 32 post-mitigation damage.
- Thrown biomass now exists as a real lobbed enemy projectile before landing. It deals 3.1 base impact damage plus 160 terrain damage, creates exactly one owner-bound 2.1-metre/4.5-second hazard, and ticks for 1.1 base damage every 0.8 seconds. Defeating Prime removes its active grab, projectile, and hazard without touching unrelated entities.
- Added code-native placeholder presentation: a large distinct body silhouette, dark-backed slam/throw circles with eight non-colour timing ticks, a dark-backed grab tether/target ring, a visible biomass projectile, and a pulsing finite hazard. Exact production assets remain blocked.
- Five live tests plus the seven pure tests and shared mobility suite cover proposed durability, flat reduction, one-resolution slam and terrain impact, grab pull/damage interruption, real projectile-to-hazard transition, owner cleanup, reward/pool preservation, and the four-unit route under its ten-unit ceiling. Full verification passes TypeScript, 571 tests across 87 files, production build, HTTP smoke, and offline audit. Presentation review is next.

### Task 66D — Abomination Prime presentation acceptance

**Status:** Completed — 22 July 2026; random-pool promotion deliberately held

- Reviewed the deterministic Abomination Prime Lab at 1920×1080 and native 3840×2160. The boss HUD, conditional health presentation, grab tether/target, directional biomass projectile, finite hazard, and title-safe layout remain readable without clipping or browser console warnings.
- The review caught a colour-only overlap between slam and throw circles. Slam now owns inward radial timing ticks while throw owns eight white perimeter landing blocks; grab retains its dark-backed tether and target ring. The projectile is now a directional rectangle rather than a generic circular bullet, preserving non-colour move recognition before production art.
- Authorized exactly four retained-master visual families: the directional Prime body, projectile/hazard biomass family, event effects, and portrait. All target/radius/timing geometry, trajectories, collision, terrain damage, forced movement, hazard lifetime, health bars, and phase timing remain code-owned.
- Authorized event-driven Prime audio after Batch S1, prioritizing slam warning/impact, grab acquire/latch/break variants, and throw/landing/hazard expiry. Loops must cut immediately on interruption, owner defeat, or expiry and may not encode variable simulation timing.
- Random-pool promotion remains blocked until production assets pass mixed Corrupted Human review at 960×540, Full HD, and 4K and a representative intended loadout records a 45–90-second kill across at least three seeded fights. With all Task 66 behavior/presentation gates complete, Production Audio Batch S1 is the next implementation priority; authorized mini-boss art packages may proceed independently.

### Task 67 S1 — production weapon-audio preflight

**Status:** Contract implemented — 22 July 2026; production recording and sample binding pending

- Added a typed Batch S1 production catalog covering all eight implemented weapons through their existing simulation cue IDs. It locks 24 unique master stems: three dry variants for each non-rotary weapon plus exact Bulwark Rotary start, seamless loop, and cancellation-safe end assets.
- Locked per-family duration envelopes, criticality, maximum simultaneous voices, and minimum retrigger intervals. The existing WebAudio fallback now enforces the same voice/retrigger policy, reducing rapid-fire stacking and preserving headroom before samples arrive.
- Added automated coverage for all eight cue bindings, unique stems, duration bounds, concurrency/retrigger decisions, and rotary topology. Added the canonical 48 kHz / 24-bit mono source, OGG/MP3 derivative, ≤ −1 dBTP, dry-mix, loop-seam, and maximum-density acceptance handoff under `audio/production/batch-s1/README.md`.
- No synthetic placeholder was relabelled as production audio and no missing runtime file was referenced. Next is generating/recording the 24 masters, running automated waveform validation, then binding only complete approved families behind synth fallback.
- Moved the production contract into a shared versioned JSON manifest consumed by both runtime policy and tooling. Added `npm run audio:validate:s1` with RIFF/WAVE parsing, PCM/channel/sample-rate/bit-depth checks, duration envelopes, −1 dBFS peak enforcement, unexpected-file rejection, and a −42 dBFS Bulwark loop-seam discontinuity limit. Synthetic fixtures verify compliant, malformed, stereo, over-duration, over-peak, and broken-loop cases. Candidate masters are still absent by design, so production recording remains next.

### Task 68 — Production Asset Batch T: Nest Weaver

**Status:** Completed — 22 July 2026

- Generated three retained production families through the built-in image generator: the exact 4×8 directional/state Weaver sheet, six-state pod sheet, and 4×2 onset/dissipate effects atlas. Preserved untouched chroma output and clean-alpha masters, then emitted deterministic 192×192/128×128 nearest-neighbour runtime atlases plus prompt provenance, normalizer, frame contract, and contact sheet under `art/production-tests/batch-t/`.
- Integrated stable `nest-weaver-v1`, `nest-pod-v1`, and `nest-effects-v1` manifest contracts. Live presentation maps facing and phase to the authored body, maps hatch progress to stable pod states, and pairs every lay, hatch, interruption, and defeat onset with its matching dissipate frame. Placement lines/rings, countdown pips, conditional pod HP bars, reservations, collision, timing, and hatch payload remain code-owned.
- Added a complete `?mode=gallery&batch=t` review route and manifest regression coverage. Presentation review at native 960×540, 1920×1080, and 3840×2160 caught and corrected one gallery heading collision; final gallery and live lab retain title-safe HUD placement, readable mixed-family silhouettes, clear pod/bar separation, and no browser warnings or errors.
- Hatchlings continue to reuse `swarm-scuttler-v1`; a distinct hatchling body stays evidence-gated. Production Audio Batch S1 remains the primary next task. The independent visual order is Storm Savant, Scrap Skitterer, then the remaining machine family before mini-boss cosmetics.

### Task 67 S1 — production weapon audio complete

**Completed:** 22 July 2026

- Generated all 24 dry, mono 48 kHz / 24-bit PCM weapon masters from fixed, reviewable recipes: three mechanically interchangeable variants for each standard weapon and distinct Bulwark start, seamless loop, and cancellation-safe end stems.
- Derived all 24 OGG and all 24 MP3 runtime assets. The production player prefers OGG, falls back to MP3 on decode failure, and retains the existing oscillator cue when neither production format is ready.
- Bound all seven one-shot families with deterministic A/B/C rotation behind the catalogued retrigger and voice limits. Bulwark now holds one loop across repeated fire events and transitions through its end stem after firing stops.
- Expanded `audio:validate:s1` to reject missing/malformed derivatives, duplicate masters, hot three-millisecond edges, invalid PCM format/rate/depth/channel count, duration violations, unsafe peaks, and rotary seam discontinuities. The gate passes 24/24.
- Full TypeScript/build and a live browser weapon-gate boot completed without console warnings or errors. The final maximum-density listening and accessibility review remains grouped with the physical-controller, colour-vision, and fight-duration pass before Steam packaging, as planned.
- Next: Production Asset Batch U — Storm Savant body, conductive nodes, and non-lightning effects. Do not rasterize the code-owned lightning rails or cover-stop geometry.

### Production Asset Batch U — Storm Savant complete

**Completed:** 22 July 2026

- Generated and retained the exact 4×9 Storm Savant body, 6×1 conductive-node lifecycle, and 4×2 non-lightning effects families with untouched chroma sources, clean-alpha masters, deterministic runtime atlases, prompts, normalizer, and contact-sheet QA.
- Bound the Savant and node atlases to live simulation states. Charge, discharge, overload collapse, movement facings, node charge/critical states, and inert destruction now use production silhouettes; `storm-effects-v1` is registered for event presentation.
- Kept lightning rails, timing rungs, circular endpoints, square cover stops, hit widths, collision, damage, and projectiles out of the raster package as required.
- Manifest contracts, 581 tests, typecheck, and production build pass.
- Next: Scrap Skitterer production body/effects.

### Production Asset Batch V — Scrap Skitterer complete

**Completed:** 22 July 2026

- Generated the exact 4×8 low triangular android body and 4×2 restrained mechanical-effects package through the built-in image workflow. Retained untouched chroma sources, clean-alpha masters, deterministic runtime atlases, prompts, adaptive row normalizer, and contact-sheet QA under `art/production-tests/batch-v/`.
- QA caught the generator's non-uniform vertical row spacing before integration; normalization now detects authored alpha row bands, preventing split legs or orphaned fragments while retaining the untouched source.
- Bound approach/scuttle, acceleration, committed rush, hard brake, inert wreck, and all four onset/dissipate effect pairs. The warning lane, target direction, collision, damage, Shock weakness, wreck lifetime, and harmless behavior remain code-owned.
- Added `?mode=gallery&batch=v`; manifest contracts, 582 tests, typecheck, production build, smoke, offline boot, and Batch S1 audio validation pass.
- Next: normal machine-family art begins with Arc Warden, then Cyborg Reclaimer, then Foundry Fabricator/pad/drone/turret.

### Production Asset Batch W — Arc Warden complete

**Completed:** 22 July 2026

- Generated the exact 4×8 directional/state Arc Warden body and 4×2 restrained electrical/mechanical effects package through the built-in image workflow. Retained untouched chroma sources, clean-alpha masters, deterministic 128×128 runtime atlases, prompts, normalizer, and contact-sheet QA under `art/production-tests/batch-w/`.
- Bound idle/stride, lane charge, discharge recoil, vented recovery, hurt, and defeat body states to the live Arc Warden. Charge, discharge-origin, cover/player impact, and recovery vent effects play as onset/dissipate pairs from simulation events.
- Preserved code ownership of the warning lane, timing rungs, target/cover-stop geometry, projectile and hit width, collision, damage, Shock weakness, facing, and phase timing. No beam geometry is rasterized into the authored package.
- Added `?mode=gallery&batch=w`; manifest contracts, 583 tests, typecheck, and production build pass.
- Next: Cyborg Reclaimer production body and non-gameplay-geometry effects, followed by Foundry Fabricator/pad/drone/turret.

### Production Asset Batch X — Cyborg Reclaimer complete

**Completed:** 22 July 2026

- Generated the exact 4×9 broad cyborg body and 4×2 local repair-effects package through the built-in image workflow. Retained untouched chroma sources, clean-alpha masters, deterministic 192×192/128×128 runtime atlases, prompts, adaptive-row normalizer, and contact-sheet QA under `art/production-tests/batch-x/`.
- Bound walking, repair-channel bracing, exhausted recovery, target-lock origin, repair completion, interrupted-link spark, and recovery vent presentation to the live simulation. Effect families play as onset/dissipate pairs.
- Preserved code ownership of target eligibility and selection, encounter-wide tether geometry, acquisition/break range, active-link exclusivity, repair amount, patch count, health mutation, interruption, collision, timing, and Shock weakness.
- Added `?mode=gallery&batch=x`; manifest contracts, 584 tests, typecheck, and production build pass.
- Next: Foundry Fabricator production body, pad, drone, turret, and local effects.

### Production Asset Batch Y — Foundry Fabricator family complete

**Completed:** 22 July 2026

- Generated all five authorized retained-master families: 36-frame Fabricator, six-state pad, 28-frame drone, 32-frame turret, and eight onset/dissipate local effects. Preserved untouched chroma sources, alpha masters, deterministic runtime atlases, prompts, adaptive normalizer, and contact-sheet QA under `art/production-tests/batch-y/`.
- Bound Fabricator movement/channel/recovery, stable live pad, drone flight/power-down, turret tracking/warning/recovery, fabrication start/completion/interruption, and turret muzzle presentation to simulation state and events.
- Kept reservations, pad health/placement/progress, charges, child ownership/lifetimes/caps, target locks, turret lane/range, cover blocking, collision, damage, and timing code-owned. No projectile or warning geometry was rasterized.
- Added `?mode=gallery&batch=y`; manifest contracts, 585 tests, typecheck, and production build pass.
- Next: mixed standard-machine silhouette review at 960×540, Full HD, and 4K before any expanded mini-boss artwork.

### Standard machine-family mixed-wave silhouette acceptance

**Completed:** 22 July 2026

- Extended the deterministic Foundry Fabricator lab to include a Cyborg Reclaimer and a damaged Arc Warden alongside the Fabricator and two Scrap Skitterers. Fabrication still supplies the pad, airborne drone, and square-base turret beneath the existing eight-live-unit cap.
- Reviewed the live authored family at native 960×540, 1920×1080, and true 3840×2160 canvas presentation with manual fire enabled to preserve the encounter. Fabricator height/asymmetry, Reclaimer breadth/organic torso, Warden rectangular emitter, Skitterer low rush profile, pad footprint, drone elevation, and turret base/barrel remain distinguishable in motion.
- Repair tether and turret/Arc warning origins remain readable without relying on body colour. Pads and children remain visible beside both heavy bodies, HUD/title-safe edges remain intact, and all three browser passes produced no warnings or errors.
- The standard-enemy prerequisite for expanded mini-boss artwork now passes. Next production package: Synapse Herald body, local effects, and portrait. Random-pool promotion still waits for representative 45–90-second seeded fight acceptance.

### Production Asset Batch Z - Synapse Herald complete

**Completed:** 22 July 2026

- Generated the exact 40-frame directional/state Herald body, eight local onset/dissipate effects, and 256 px dossier portrait through the built-in image workflow. Retained untouched chroma sources, clean-alpha masters, deterministic 192 px/128 px/256 px derivatives, prompts, normalizer, and contact-sheet QA under `art/production-tests/batch-z/`.
- Bound entrance, alternating orbit, lunge wind-up/commit, marked-zone channel, synapse-link channel, and recovery presentation to live simulation state. Lunge-origin, zone-eruption, link-lock, and link-break effects play as onset/dissipate pairs; the portrait and every runtime frame are exposed in `?mode=gallery&batch=z`.
- Preserved code ownership of lunge paths, marked-zone circles and timing marks, link tether/rings, target locking, damage mitigation, collision, health bars, warnings, and phase timing. The Herald remains excluded from random mini-boss promotion pending mixed ordinary Brain Blob silhouette review and representative 45-90-second seeded fights.
- Manifest contracts, TypeScript, focused Herald behavior tests, and production build validation pass. Next production package: Assembly Prime body, local effects, child-compatible accents, and portrait.

### Production Asset Batch AA - Assembly Prime complete

**Completed:** 22 July 2026

- Generated the exact 44-frame directional/state command chassis, six-state reinforced pad, eight local onset/dissipate effects, and 256 px portrait through the built-in image workflow. Retained untouched chroma sources, clean-alpha masters, deterministic derivatives, prompt provenance, source-aware normalizer, and contact-sheet QA under `art/production-tests/batch-aa/`.
- Contact-sheet review rejected equal-height body slicing before integration; the retained master uses a regular authored cadence with beams and smoke bridging some gutters, so the normalizer now locks verified source row boundaries and emits all 44 intact cells.
- Bound entrance/orbit, lane lock/fire, pad deployment, fabrication, recall, and recovery states. The reinforced pad advances from simulation-derived channel progress; lock, completion, recall, and shutdown effects play as onset/dissipate pairs. Existing Foundry drone and turret bodies remain shared.
- Preserved code ownership of lane rails/beads/endpoints, cover clipping, pad targeting/progress rings, recall tether/ring, reservations, collision, damage, health bars, warnings, and timing. Native 960x540 gallery and mixed-machine lab review passed without console warnings.
- TypeScript and 50 focused manifest/behavior/combat tests pass. Random-pool promotion remains blocked pending 960x540/Full HD/4K mixed review and representative 45-90-second seeded fights. Next production package: Storm Regent body, conductive nodes, local effects, and portrait.

### Production Asset Batch AB - Storm Regent complete

**Completed:** 22 July 2026

- Generated the exact 44-frame directional/state command body, six-state Regent-specific conductive node, eight local onset/dissipate effects, and 256 px portrait through the built-in image workflow. Retained untouched chroma sources, clean-alpha masters, deterministic derivatives, prompt provenance, verified irregular-row normalizer, and contact-sheet QA under `art/production-tests/batch-ab/`.
- Contact-sheet review caught equal-height body slicing before integration; the generator authored deeper entrance/energized rows and compact recovery/defeat rows, so the normalizer now locks verified alpha boundaries and emits all 44 intact cells.
- Bound entrance/orbit, chain lock/discharge, node-overcharge channel, coil charge/discharge, and recovery states. Regent-owned nodes now use their separate dormant/armed/relay/warning/critical/destroyed atlas, while Savant nodes retain Batch U art. Chain-origin, node-overcharge, coil-discharge, and node-interruption effects play as onset/dissipate pairs at simulation event positions.
- Preserved code ownership of chain rails/hops/endpoints, cover-stop squares, node target/overcharge rings, coil circumference/ticks, owner linkage, collision, damage, health bars, warnings, and timing. `?mode=gallery&batch=ab` exposes every runtime frame and `?scenario=storm-regent&loadout=vertical` remains the live acceptance route.
- Random-pool promotion remains blocked pending mixed-wave review at 960x540, Full HD, and 4K plus three representative 45-90-second seeded fights. Next production package: Abomination Prime body, biomass projectile/hazard, local effects, and portrait.

### Production Asset Batch AC - Abomination Prime complete

**Completed:** 22 July 2026

- Generated the 52-frame directional/state apex body, eight-frame biomass projectile/hazard lifecycle, eight local onset/dissipate effects, and 256 px portrait through the built-in image workflow. Retained chroma sources, clean-alpha masters, deterministic derivatives, prompt provenance, normalizer, and contact-sheet QA under `art/production-tests/batch-ac/`.
- Rejected the first body output because it authored only eleven rows. The replacement included every requested pose plus one redundant late hurt/recovery band; both sources remain retained, and the documented normalizer selects the exact ordered 13-row contract plus final collapsed defeat without merging gameplay states.
- Bound entrance/shamble, slam, grab, break recoil, biomass tear/throw, and recovery phases. The real biomass projectile now alternates directional flight frames under simulation rotation; fresh/pulsing/collapsing hazard art sits above the existing code-native radius outline. Slam rupture, grab latch/break, biomass tear, landing compression, and defeat effects are event-driven.
- Preserved code ownership of slam/throw circumferences and timing marks, landing blocks, grab tether/ring, projectile trajectory, hazard radius/timing, collision, terrain damage, forced movement, conditional health bars, and scheduler timing. `?mode=gallery&batch=ac` exposes every runtime frame and `?scenario=abomination-prime&loadout=vertical` remains the acceptance route.
- Random-pool promotion remains blocked pending mixed Corrupted Human review at 960x540, Full HD, and 4K plus three representative 45-90-second seeded fights. All currently authorized expanded mini-boss artwork is now complete.

### Environment renewal plan and Production Asset Batch AD - Science Wing

**Completed:** 22 July 2026

- Audited the existing display and asset contracts for a future Full HD/4K Steam port. Exact whole-pixel 2×/4× scaling is already correct; the environment problem is limited variants, repetition, and weak room identity rather than blur. Batch A and Batch H environment families are scheduled for authored replacement, early 64 px combat/UI motifs upgrade when their family is revisited, and recent 128/192 px production families remain accepted unless a specific review fails.
- Added `environment-production-plan.md` and `environment-prompts.md`. Eight modular kit groups cover the Science Wing, Bastion Logistics, Machine Foundry, Alien Hive, Surface/Planetary, Starship/Void, Containment/Underworld, and boss arenas/Colosseum while avoiding a separate incompatible tileset for every room name.
- Generated Batch AD through four built-in image-generation calls: a 16-tile Science Wing floor, eight cardinal/corner/gate/breach boundaries, eight lab/cryo/reactor/control/specimen/surgery/camera/teleporter fixtures, and eight restrained under-floor decals. Retained 256/384 px masters and 128/192 px runtime derivatives, chroma/alpha provenance, exact prompts, deterministic normalizer, contact sheet, and seam mosaic under `art/production-tests/batch-ad/`.
- Registered all 44 frames and added `?mode=gallery&batch=ad`; collision, interaction, destructibility, hazards, adjacency, objectives, lighting, and timing remain code-owned. Exact dimensions/alpha, repeated-tile visual review, 590 tests, TypeScript, production build, 93-asset HTTP smoke, 52 review routes, and 194-reference offline audit pass.
- Next environment package after Science Wing live/multi-resolution acceptance: Batch AE Bastion Logistics and Defence, replacing the generic starting environment with supply depot, armoury, weapon racks, shop/blacksmith, medic, command, loading-bay, and bunker identities.
