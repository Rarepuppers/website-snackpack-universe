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

**Milestone:** Road to the playable 20-node expedition (Web MVP)

**Milestone status:** In progress — plan consolidated 19 July 2026 (see "Plan review — 19 July 2026" below)

**Current objective:** the mechanical half of Task 33 is done (61/61 review routes swept clean via `dev/review-harness.html`), and Tasks 36–39 are implemented as of 19 July 2026. The creator sitting still owes visual/feel judgement across the queued combat, shell, map, and held world-theme items. Next code work can proceed into Tasks 45–48 while Batch G1/G2/O generation remains held for creator review.

## Completed

Completed checkpoint entries are archived in `last-bastion-log.md` (the completed-work history for both Claude and Codex). Record every newly finished checkpoint there with its date and verification evidence; this file keeps only the plan.

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

33. **Consolidated creator review session.** One sitting through the queued review routes with a written pass/fail per item: normal run, `stress=4`, mini-boss labs (`siege-crusher`, `brood-warden`), enemy labs (`ripper`, `quillback`, `spinewheel`, `tether-bloom`, `razor-scuttler`), weapon labs (`patrol`, `bolt`, `bulwark`, `grenade`), `bastion-eater`, the F1–F4 galleries, and the Batch K gallery/crowd readability check. Output: an approved list and a rejected/retune list.
34. **Content-enablement pass.** **Completed 17 July 2026.** The Weapon Chest now draws a seeded three-option subset from `WEAPON_CHEST_POOL` (all seven implemented weapons; `VERTICAL_SLICE_WEAPON_IDS` remains for the `?loadout=vertical` review route). Waves 3–5 now field the behavior-gated roster: wave 3 adds one Quillback and one Ripper; wave 4 adds two Razor Scuttlers, one Tether Bloom, one Spinewheel, and one Ripper alongside the Carapace elite; wave 5 escorts the pooled mini-boss with Razor Scuttlers and a Quillback. Counts are deliberately conservative pending the step 35 tuning pass, and the creator review (step 33) can still strike any item from the pool or waves as a one-line data change. Verification: 158 tests across 18 files, TypeScript, production build, 51 asset checks, 36 review routes, clean browser boot.
35. **Single tuning pass with measurable targets:** 10–15 minute run length, at least three recognisably different builds, no unavoidable damage in waves 1–3, death causes readable, wave-5 mini-boss fight 45–90 seconds. Revisit XP curve, wave counts on the larger arena, and reward cadence together. **The numeric design lives in `wave_balance.md`. Implemented 18 July 2026:** the 2-damage/10-health rescale; non-compounding wave scaling; ten-wave timed threat director and full cap ladder; fractional projectiles; baseline regeneration; Marine level packages and live proficiencies; Swarm/elite speed tiers and cadence; code-authoritative telegraphs; and a deterministic XP reference trace that reaches the level 9–12 target. Creator feel, run-time, and crowd-readability review remains open.
36. **Rift Stalker behavior gate** to complete the three-entry mini-boss pool (cloaked stalk, marked pounce, close slash, final-20% frenzy), then its production batch.
37. **Front-end shell behavior gate.** Title, main menu, How to Play, Settings, and character-select screens as a code-native screen-flow state machine with placeholder panels, per the "Front-end shell and expedition structure" design added to `last-bastion-game.md` on 17 July 2026. Settings bind to the existing `LocalSaveStore`; the Lab card surfaces the existing review routes in-game. **Completed 19 July 2026** (see `last-bastion-log.md`): the bare URL is the front door, review parameters still boot combat directly, and the deploy/Lab hand-off navigates to the target route so each mode boots one scene. Creator layout/copy review queued; Batch G art stays held until it passes.
38. **Expedition map behavior gate.** Generator **completed 17 July 2026**; map screen and save schema v2 **completed 19 July 2026** (see `last-bastion-log.md`): `?screen=map` renders the starchart with code-native medallions, route lines, intel card, and dropship travel in scout mode; schema v2 autosaves on every arrival, resumes on load, and carries a typed build-snapshot slot reserved for Task 39. Creator layout review queued; Batch G2 medallion art held until then.
39. **Node → encounter wiring. Completed 19 July 2026.** Combat and Elite nodes use the existing depth-indexed threat plans, Mini-boss nodes deterministically draw from all three authored fights, safe nodes reuse the Supply Depot and Weapon Cache decision overlays, and the Boss node runs the Bastion Eater. Arrival is persisted as pending and only victory commits the node and carried schema-v2 build; defeat clears the expedition. Quick Drop remains a separate ten-wave arcade route. Tasks 48–49 subsequently completed multi-wave pacing and full-route campaign tuning.
40. **Production Asset Batch G1/G2** (title, menu, dossier, starchart, medallions — briefs in `last-bastion-content.md`) only after steps 37–38 pass creator review with placeholders.
41. **Event Horizon behavior gate** (existing step 32), so the first Unique lands in an already-tuned game.
42. **Codex v2 data pass — final planning step, runs before step 33. Completed 18 July 2026** (see `last-bastion-log.md`); the data-driven-from-catalogs rendering remains the long-term goal. Update `last-bastion-codex.html` to the v2 numeric design so the playtest session reviews against the intended numbers: (a) every monster, elite, mini-boss, and boss with health, armour, shield, speed tier, contact/attack damage, XP, and threat cost; (b) every weapon with fire rate/cadence, damage per projectile or per sweep, projectile count, pierce/chain/pellet rules, and — for radius weapons — centre and edge blast damage per the falloff rule; (c) weapon upgrade paths (tiers, merge gains, elemental paths) with concrete per-level stats; (d) all perks/upgrade choices with their leveled values and slot categories. Long-term the codex should render from the same data catalogs the simulation uses (`enemyCatalog`, `weaponCatalog`, `upgradeCatalog`) so it can never drift; for this pass a generated static refresh is acceptable.
43. **Status-effect presentation gate.** Floating damage numbers with the shared colour language (ivory physical, red fire, teal shock, blue frozen, green toxic) and Settings toggle are complete. Production Asset Batch K replaced the placeholder status reads with persistent Blaze/Overload/Freeze/Corrode loops on 18 July 2026; creator crowd/readability review is queued. Healing ticks remain part of step 35's pacing/rescale work.

Recommendation for a later documentation pass: move the completed checkpoint entries (now the majority of this file) into a separate `last-bastion-log.md` archive so this tracker reads as a plan again. **Done 18 July 2026** — checkpoint entries now live in `last-bastion-log.md`; batch statuses and numbered-step notes remain here until a later archival pass.

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
33. Consolidate every future Codex, shop, loadout, perk, hotkey, consumable, status, and HUD tile on the 128 × 128 runtime / 512 × 512 master contract; regenerate legacy 64/96 px tiles only as their families are revisited. **Completed 18 July 2026 as the production contract; legacy families remain intentionally migration-on-touch.**
34. Implement the density-director v3 lab: data-driven pursuit/standoff/chase-and-fire profiles, 65–75% pursuit composition, raised 18/24/32/42/46/52/56 live caps, projectile-pressure budget, pooling, and seeded capacity telemetry. **Completed 18 July 2026 across the ten-wave run:** full live-cap ladder, 56-enemy deterministic capacity lab, eight reusable steering profiles, two-wind-up/six-projectile ordinary ranged limits, friendly/hostile simulation projectile pools, debug telemetry, authored late-wave elite cadence, and rules tests.
35. Implement and rules-test the Aurum Hoarder with placeholder art, non-blocking escape, partial armour-break Scrap, a guaranteed valid supply-cache reward, Codex discovery, and boss/tutorial exclusions. **Completed 18 July 2026. The forced lab and pure eligibility contract shipped first; ordinary-wave spawning was subsequently enabled by the verified Scrap Shop follow-on below.**
36. After Tasks 33–35 pass, generate the next 128 px tile batch and the Aurum Hoarder body/effect/cache family from retained 4× masters; review at 1080p, 1440p, and 4K with 75–150% UI scale. **Completed 18 July 2026: 12-frame directional body sheet, eight-frame event/effect atlas, eight 128 px tiles, Codex tile, manifest/runtime bindings, gallery route, retained generation masters/prompts, and automated contracts. The gallery passed 1080p visual inspection and the 4K/150% route loaded without warnings.**

**Follow-on — Scrap Shop behavior gate. Completed 18 July 2026.** Same-run Scrap now comes from ordinary/specialist/elite/mini-boss defeats and wave clears; Supply Depot intermissions expose three seeded usable offers plus an explicit leave/bank action. Purchases refresh the rack and apply immediately, unaffordable rows are disabled, input supports mouse/keyboard/controller, and the verified spend loop enables maximum-one seeded Aurum Hoarder arrivals in eligible waves 3–4. The intermission terminal is intentionally portable to the future expedition Shop node.

**Follow-on — Production Scrap Shop UI Batch N2. Completed 18 July 2026.** The behavior gate now uses a production 1024×576 empty terminal panel, six reusable 128 px offer tiles, and four reusable 128 px Scrap HUD/event states. Live prices, text, balance, selection, affordability, and timing remain code-owned. The gallery and corrected live overlay passed a 1920×1080 gameplay-scale review; retained sources and deterministic normalization are stored under `art/production-tests/batch-n2/`.

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
- Generate each approved weapon's ring states, projectile/effects, and matching canonical 128 × 128 tile as one production batch only after its behavior lab passes.
- **Superseding resolution decision (18 July 2026):** future and regenerated tiles use one 128 × 128 runtime asset with a 512 × 512 retained master; existing 64 × 64 tiles remain historical accepted output and render until their family is revisited.
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

### Event Horizon Unique art preflight (Batch L)

**Status:** Art preflight generated and held from gameplay - 18 July 2026; behavior gate remains step 32

- Retained a four-state 96 x 96 east-facing ring weapon sheet, an eight-frame 64 x 64 gravitic projectile/effect atlas, and a 64 x 64 active tile based on the approved Event Horizon concept.

- Integrated stable manifest IDs and a dedicated `?mode=gallery&batch=eh` review route so the art can be judged at gameplay scale before behavior implementation.
- Kept the family out of the Weapon Chest, normal waves, loadout parsing, and combat renderer. Pull strength, field radius, implosion timing, collision, damage, and cooldown remain unapproved simulation contracts.
- Retained chroma provenance, transparent masters, prompts, exact frame map, and deterministic nearest-neighbour normalizer under `art/production-tests/batch-l/` for future Steam reuse.

### Corrupted Human outbreak art preflight (Batch M)

- Generated and retained Steam-quality body sheets for Infected Survivor (4 × 2 / 96 px), Corrupted Marine (4 × 3 / 96 px), and Abomination (4 × 3 / 128 px), plus an eight-frame 64 px Marine knife/projectile/effect atlas.
- Integrated the four held contracts into the manifest and `?mode=gallery&batch=m`; no live enemy catalog or wave binding is present.
- Next behavior gates are survivor sprint/swarm steering, marine telegraph → slow knife projectile → cover/player impact → recover/cooldown, and abomination slam/grab → vulnerable recovery → collapse. Keep Abomination Prime as a later mini-boss variant.

### Emberfall world-theme art preflight (Batch H)

- Generated and retained four environment atlases: six floor tiles, eight boundary connectors, four obstacle re-dresses, and six subdued Emberfall decals.
- Preserved Batch A collision silhouettes/footprints and integrated held manifest IDs with `?mode=gallery&batch=h`; no default theme assignment or gameplay draw-order change is present.
- Next gate is creator grayscale/contrast review against the mixed Wave 4 roster before adding Toxic Bloom, Void Approach, Arctic Relay, or other world variants.

- Toxic Bloom is now also retained as a parallel four-atlas variant (`?mode=gallery&batch=tb`) with unchanged footprints; keep both themes held until creator contrast review approves the family.
- Void Approach is also retained as a parallel four-atlas variant (`?mode=gallery&batch=va`); keep all world themes held until the contrast review approves a consistent environment language.
- Arctic Relay is now also retained as a parallel four-atlas variant (`?mode=gallery&batch=ar`); all four world themes remain held pending creator review.
### Weapon placement, inventory, and merge behavior gate

**Completed 18 July 2026.** `dev/src/game/equipment/WeaponInventory.ts` is the portable rules boundary for typed rack legality, four-slot class-agnostic stash storage, non-destructive swaps, discard, and identical same-tier merges capped at Tier III. `CombatSimulation` exposes rack/stash state in every snapshot and the deterministic `?scenario=weapon-gate` route drives the same keyboard/controller-compatible decision surface used by other intermissions. Phaser remains presentation-only so a future Steam client can replace the modal without rewriting the state contract or rules tests. Production Batch I1–I3 is now integrated: canonical tiles, typed slots, tier/discard/merge surfaces, placement panel, stat card, salvage counter, and action glyphs all retain code-owned functional overlays.

## Plan review — 19 July 2026: road to the playable 20-node expedition

This review consolidates everything still required for a complete playable game — working map, characters, weapons, perks, upgrades, shop, waves, and the full 20-node expedition ("20 levels": every node on the chart playable, a run traversing 8–11 of them). It extends the numbered order; Tasks 33–43 keep their meaning, and the earlier of them (33, 36–41, 43) remain the immediate queue. Art stays with Codex/imagegen throughout — behavior gates use placeholders and every new art need has a brief in `last-bastion-content.md` before generation.

State of each pillar as of this review:

| Pillar | State | Gap to "playable game" |
| --- | --- | --- |
| Map | Starchart, schema-v3 persistence, node wiring, depth-budgeted encounters, and full-route tuning live | Complete through Task 49 |
| Characters | Marine and Field Medic live with distinct growth, loadouts, passives, ultimates, and production art | Complete through Task 47 / Batch P |
| Weapons | 7 live in chest pool + Event Horizon art held | Tasks 41, plus review of chest weighting in 49 |
| Perks | Seven pre-drop modifiers live with milestone unlocks, persistence, selection, map/combat integration, and canonical 128 px art | Complete through Task 46 / Batch I v2 |
| Upgrades | 12 live with slots/paths; 5 codex entries concept | Concept entries land opportunistically in 49 |
| Shop | Economy v2 live with production UI and Quartermaster | Keeper-speciality expansion remains future scope |
| Waves/rounds | Ten-wave Quick Drop plus tuned depth-budgeted multi-wave expedition encounters | Complete through Task 49 |
| Worlds | Five authored theme families live with deterministic expedition variants | Complete through Task 44; creator contrast review remains |

Numbered steps (continuing from 43):

44. **World-theme enablement. Completed 19 July 2026.** All five worlds now select their authored floor, boundary, obstacle, and low-contrast decal families in live combat. Expedition hand-offs carry a deterministic lighting seed with three restrained variants per world. Per-world neutral washes keep terrain subordinate; Arctic Relay receives the strongest dimming. The Batch J mixed-roster comparison and a real seed-4418 map deployment passed across all worlds with no console warnings.
45. **Shop keepers and economy v2. Completed 19 July 2026.** The shop remains a between-wave intermission. Each visit now exposes one depth-priced paid reroll, one offer lock that survives that reroll, and weapon selling at 50% of total tier value while protecting the player's final active weapon. The same flat decision contract supports keyboard, controller, and pointer input. Batch Q's six-frame Quartermaster ships behind the production counter; retained chroma/alpha masters and the 128×256 runtime atlas live under `art/production-tests/batch-q/`. Future direction, design-only for now: **shop specialties** — Blacksmith merge/tier services, Gunsmith weapons, VND-R kits/ammo, Clinician augments, Medic-Sister healing, Curator relics/Artifacts, and Fence high-tier black-market offers. Specialties enter production only after their dependent systems exist.
46. **Perk system behavior gate. Completed 19 July 2026.** Character Select resolves one persisted pre-drop perk from seven canonical definitions. Records milestones unlock the pool; Veteran, Scrapper, Quartermaster, Fast Learner, Gunsmith, Survivor, and Pathfinder modify only their owned run/map boundaries. Save schema v3 adds nodes-cleared progress and selected perk persistence. Batch I v2 supplies seven distinct canonical 128 px tiles in Character Select, the gallery, and Codex.
47. **Medic hero gate. Completed 19 July 2026.** The second playable hero ships with +2 health/+1 armour/+2 Light/+1 support growth, a 2 Light/1 All rack, the toxic Injector Carbine, sixth-hit Triage Loop healing, and the 20-second Emergency Surge heal/overflow-shield ultimate. Character selection persists the hero into Quick Drop and expedition encounters. Production Batch P is live in gameplay and `?mode=gallery&batch=p`.
48. **Node-budget encounter director. Completed 19 July 2026.** Combat nodes run three or four exact-budget waves by column depth; Elite nodes run two reduced-budget leads then a kill-owned seeded elite/cache wave; Mini-boss nodes run one 60% arena wave then their seeded authored fight; the Boss node remains the unchanged Bastion Eater. Internal waves use a two-second transition without returning to the map, and the existing node Scrap reward is divided across those waves rather than multiplied. Safe nodes stay decision-owned. Quick Drop still uses its independent ten-wave definitions unchanged.
49. **Campaign tuning pass — the 20-node difficulty curve. Completed 19 July 2026.** The third onboarding column is capped at 45/65/90 threat before the four-wave midgame. Every eight-node route receives post-encounter Scrap Shops in zero-based columns 3 and 5; Field Repair is guaranteed in wounded expedition stock, safe nodes pay 10 Scrap, and safe-node decisions cannot resolve before selection. A deterministic sweep across every route from 100 map seeds locks two shops, at least two recovery opportunities, 55+ guaranteed Scrap, a projected level 9–20 boss-entry band, all eight live weapons in the chest pool, and three distinct reference builds below the 120-second stationary Bastion Eater benchmark.
50. **Run summary and Records. Completed 19 July 2026.** Victory and defeat now hand off to a code-native debrief with mode, hero, level, nodes/wave reached, kills, earned and banked Scrap, per-weapon damage, final weapon tiers, upgrade levels, and perks unlocked by that run. Save schema v4 carries cross-node expedition metrics and lifetime runs, victories, best wave/column, best expedition depth, nodes, kills, damage, and Scrap. The main-menu Records card opens a full persisted ledger backed by the same data. `?screen=summary&summarydemo=1` is the non-mutating populated review route.
51. **Production Asset Batch O — Rift Stalker set. Completed 19 July 2026.** Integrated a 16-frame directional/state body sheet, eight event-authored effects, and a dossier portrait. High-resolution chroma and transparent masters, prompt provenance, and deterministic nearest-neighbour normalization are retained under `art/production-tests/batch-o/`; the live encounter and `?mode=gallery&batch=o` use the fixed runtime derivatives.
52. **Codex live-sync rule (standing).** Whenever a gate flips content from designed to live (or new content enters design), update `last-bastion-codex.html` statuses and its Roadmap tab in the same commit. The codex is the public progress tracker; it must never lag the shipped game by more than one commit.
53. **Fire-control accessibility gate. Completed 19 July 2026.** Save schema v5 persists Auto-fire / Manual with Auto-fire as the default. `T` and pad R3 toggle the setting immediately in combat; cursor/right-stick aim remains independent from mouse/trigger fire. Cursor weapons obey the selected mode, while the auto-targeting Arc Carbine and cadence-owned Patrol Blade intentionally remain autonomous. The top-right code-native HUD chip reports `T/R3 AUTO` or `MANUAL`; URL review overrides are `?autofire=1|0`.
54. **Destructible-terrain health gate. Completed 19 July 2026.** Replaced the two-hit boss-only obstacle state with numeric durability, source-authored damage events, conditional 1.5-second mini HP bars, player projectile/melee and enemy projectile rules, mini-boss charge rules, and route-preservation tests. Added fence, boulder, and reinforced-cover definitions before Batch R art. Batch R remains the production-art follow-up and must preserve code-owned collision/health behavior.
55. **Production Asset Batch R — destructible terrain. Completed 19 July 2026.** Produced and integrated the seven-row, four-state terrain family locked in `last-bastion-content.md`: fence, crate, barricade, boulder, conduit, reinforced cover, and biomass. Retained chroma/alpha masters, deterministic normalization, frame map, bottom-centre pivots, stable manifest IDs, runtime derivatives, gallery coverage, gameplay bindings, and eight material effects. Collision footprints, durability, 75%/35% thresholds, HP bars, hit flashes, debris lifetime, and route opening remain code-owned. The 960×540 gallery plus 1920×1080 and 3840×2160 browser passes showed no clipping or console warnings.
56. **Combat silhouette and player-hit feedback gate. Completed 19 July 2026.** Player hits now emit a larger ivory negative-damage number with a dark-red outline, isolated from enemy-number merging. Save schema v6 persists Reduced flash; camera flashes become short code-native outline pulses while screen shake remains independently configurable. The `?scenario=batch-j&rims=1` A/B lab adds thin actor rims and damage-family projectile halos, with `rims=0` as control and `flash=0` as the reduced-flash review route. Full-HD comparison found the treatment clean but only modestly clearer, so rims/halos remain opt-in lab instrumentation rather than a universal default; authored silhouettes stay unchanged.
57. **Mini-boss mobility/threat pass. Completed 19 July 2026.** Siege Crusher, Brood Warden, and Rift Stalker now use deterministic range-aware orbit setup movement: they close from long range, peel out of crowding range, and traverse laterally between locked attacks. Their authored bodies render at tested 1.25–1.34 gameplay scales while collision remains simulation-owned. Existing charge/cleave/mark tells, fixed attack directions, dodge routes, and stationary punishable recoveries remain intact; regression review caught and corrected an over-wide Brood orbit before completion. Existing sheets remain sufficient, so no speculative art extension was produced.
58. **Survivor movement gate. Completed 20 July 2026.** The Batch M Infected Survivor now has a lab-only eight-unit pack with 1.2 seconds of sprint stamina, 5.15 m/s peak speed, frame-rate-independent acceleration/deceleration, staggered hesitation, finite recovery, and forward-floored separation steering that cannot settle into an orbiting crowd ring. Pack-cap and angular escape-lane tests protect routes. Gamepad movement uses a responsive 0.18 radial dead zone while aim retains a drift-resistant 0.25 dead zone; both rescale the remaining stick range. The production body is live in `?scenario=infected-survivor`, but normal wave promotion remains held until the Corrupted Marine and Abomination gates pass. Browser checks preserved the 960×540 simulation canvas at exact 2× Full HD and 4× 4K presentation.
59. **Corrupted Marine telegraph gate. Completed 20 July 2026.** The Batch M Marine now repositions in a 1.5–8.5 m combat band, locks the player's position behind a 0.72-second line-and-ring tell, throws a visible 6 m/s knife, then enters a 0.65-second recovery and 2.8-second cooldown. The projectile never homes: perpendicular movement produces a deterministic expiry miss, while cover intercepts it. Player, cover, and expiry impacts emit source-Marine telemetry with actual player damage. Body rows and all eight knife/effect frames are live in `?scenario=corrupted-marine`; normal-wave promotion remains held for the Abomination behavior gate and off-screen warning review.
60. **Accessibility and display gate. Completed 22 July 2026.** A simulation-space title-safe rectangle anchors the major HUD edges and projects exactly at 960×540, Full HD, and 4K. Reduced flash is persisted; focus/visibility loss pauses without auto-resuming; every major danger family has a unique non-colour shape signature; and floating combat text is capped at 24 labels while protecting player-damage/heal feedback. Save schema v7 adds validated per-action keyboard and standard-gamepad bindings: ten keyboard actions and six controller actions can be rebound from Settings, duplicate inputs swap rather than shadow, old saves receive accessible defaults, and combat HUD/help labels use the active mapping. Creator physical-controller and colour-vision feel review remains recommended but is no longer an implementation blocker.
61. **Steam readiness gate. Completed 22 July 2026.** Simulation remains independent from Phaser presentation behind a desktop-sized viewport contract. Replay format v1 covers fixed-step combat, choices, equipment, seeded expedition descriptors, and an order-sensitive three-encounter chain digest. The production build has an executable offline audit with no remote startup dependencies. Retry-safe achievement events, deterministic cloud conflict resolution, and an injected Steamworks bridge now cover achievement queries/unlocks, one stats commit, and a versioned cloud slot without adding a Steam SDK dependency to the browser build. Selecting a desktop wrapper, initializing its real SDK, and packaging remain release-track integration rather than gameplay-foundation blockers.
62. **Corrupted Human family completion gate. Completed 22 July 2026.** The three Batch M roles are live in isolated and mixed labs with deterministic movement, knife, off-screen warning, slam, recovery, terrain, cap, and escape-lane coverage. Promotion changes no authored budget or pressure share: six Survivors replace Scuttlers in Wave 3; one Marine replaces an equal-cost Quillback from Wave 4; Wave 7 is the first Abomination, replacing an equal-cost specialist package. Late waves cap at 12 Survivors, two Marines, and two Abominations. Expedition budgets inherit the same thresholds at 65/90/140 while route budgets and node topology remain unchanged. Full HD and 4K mixed review found readable silhouettes, warnings, and dodge space with no overflow or console warnings. Abomination Prime remains deferred.
63. **Nest Weaver alien-summoner gate. Completed 22 July 2026.** The live simulation now has a mobile standoff Weaver with three finite placement charges, a locked 0.85-second placement tell, a stationary 1.4-second recovery, and no attack shortcut during either committed phase. Each owner may hold two simultaneous nine-health pods. Every six-second pod reserves its immediate two threat, all three future hatchling threat, and three future live slots before placement; destroying it refunds the future reservation, while surviving consumes it once and hatches exactly three non-summoning rush children. A dedicated 18-live-unit route, code-native placement geometry and six-pip clock, deterministic destruction/hatch/cap tests, and a clean Full HD browser pass complete the behavior gate. Batch T's production Weaver body, six-state pod, and paired onset/dissipate effects are live; event audio remains queued after Batch S1, and the distinct hatchling body remains conditional on silhouette playtesting.
64. **Storm Savant science-lightning gate. Completed 22 July 2026.** The live Savant deploys two deterministic, collision-free six-health conductive nodes and locks a 1.15-second lightning tell with at most two hops. Committed segments never retarget. Intact cover clips the first intersecting segment, marks a square stop, and blocks every downstream hop; destroying any locked node cancels discharge and forces a 1.7-second vulnerable overload recovery. Player-radius hit geometry, sampled escape-lane validation, one-discharge tests, an 18-unit route cap, and a clean Full HD route pass complete the gate. The code-native double-rail ladder, circular node endpoint, and square cover-stop signatures remain gameplay-owned. Production Savant/node/effect/audio assets are authorized under `last-bastion-content.md`; no raster lightning or projectile atlas is permitted.
65. **Machine uprising family gate. Completed 22 July 2026.** The Shock-weak machine family now includes the Scrap Skitterer common, Arc Warden ranged specialist, Cyborg Reclaimer support bruiser, and Foundry Fabricator summoner. The Fabricator reserves one slot plus exact two-threat drone or three-threat turret cost before a 1.6-second channel; enforces three charges and two live children per owner; exposes a six-health destructible pad; refunds fully on owner/pad interruption; creates one 12/16-second non-fabricating child; and powers down owned children on owner exit. The stationary turret locks a colour-independent 0.55-second lane, cannot retarget after warning, is blocked by intact cover, and then enters recovery. A deterministic mixed-machine route, reservation telemetry, expiry/cleanup and cap-preservation tests, plus clean Full HD/4K presentation complete the family gate. Exact Fabricator/pad/drone/turret art and event audio are authorized in `last-bastion-content.md`; lane geometry remains code-owned.
66. **Mini-boss roster expansion. Behavior/presentation gates completed 22 July 2026; production acceptance pending.** Grow beyond the initial three only from accepted standard/elite families. **66A Synapse Herald behavior/presentation gate completed 22 July 2026:** the 560-health, armour-two Herald has a deterministic seeded three-move scheduler with no immediate repeats; exactly three locked marked zones; a two-target lunge chain that gains exactly one third target below 20%; and one four-second, seven-metre link to the nearest ordinary Brain Blob that grants 45% incoming-damage mitigation until the Blob dies, invalidates, or leaves range. Tells and recoveries shorten at 50% and 20%, but marked-zone coverage never grows. Its isolated ten-unit route, standard mini-boss reward/rank contracts, mobility regression, and Full HD/4K code-native presentation pass. Production body/effect/portrait/audio work is authorized, but random-pool promotion remains held until the production silhouette passes mixed-wave review and a representative build proves a 45–90 second fight. **66B Assembly Prime behavior/presentation gate completed 22 July 2026:** its deterministic no-repeat scheduler owns three fully warned rotating lanes, exact Foundry-compatible slot/threat reservations for three finite fabrications and at most two owned children, a ten-health interruptible pad, and one deterministic one-use recall of the lowest-lifetime owned drone. Recall creates no unit and reserves no pressure. Final-20% timing becomes faster but lane count, charges, children, slots, and threat remain unchanged. Live route/cap tests, reward preservation, same-entity recall, mobility, and Full HD/4K presentation pass. Its production package is authorized while pool promotion remains held for production-art and fight-duration acceptance. **66C Storm Regent behavior/presentation gate completed 22 July 2026:** its 760-health, reduction-two body owns exactly three finite targetable six-health nodes; schedules fixed cover-clipped chains, interruptible node overcharges, and locked close coil bursts without immediate repeats; preserves sampled player-radius escape space; and gains timing pressure only below 20%. Live ownership, damage, cleanup, interruption, reward/cap, mobility, and Full HD/4K presentation pass. Its four-family production package and event-driven audio are authorized while pool promotion remains held for production-art and fight-duration acceptance. **66D Abomination Prime behavior/presentation gate completed 22 July 2026:** the 920-health, reduction-three Prime schedules a locked terrain-damaging slam, one breakable forced-movement grab reservation, and one real lobbed projectile feeding a finite owner-bound hazard. Damage, terrain, grab breaks/pull, cleanup, isolated route, reward/cap, shared mobility, and Full HD/4K presentation tests pass; frenzy changes timing only. Its four-family production package and event-driven audio are authorized while pool promotion remains held for production-art and fight-duration acceptance. Every candidate needs two to four distinct moves, seeded no-immediate-repeat selection, a guaranteed reward, off-screen warnings, a punishable recovery, and its own behavior lab before production art or pool promotion.
67. **Production Audio Batch S. S1 preflight and validator implemented 22 July 2026; production masters pending.** Replace representative synth tones with event-addressed 48 kHz / 24-bit retained masters and normalized web/Steam derivatives. **S1 priority:** distinct fire/attack families for all eight implemented weapons, with separate Bulwark Rotary start/loop/end. **S2:** Corrupted Marine knife warning/throw/cover/flesh impacts, Abomination windup/slam/recovery, and one restrained Survivor rush cue. **S3:** shared enemy flesh/armour/cover impacts, player hit/shield break, XP/pickup, level-up, chest/shop/UI confirm, and boss phase/reward stingers. Keep music, ambience, voice barks, and future enemy sounds out of S1 so combat readability can be approved first. Audio IDs are stable in `AudioCueMap.ts`; `ProductionAudioCatalog.ts` now locks 24 exact S1 stems, duration envelopes, priority, maximum voices, minimum retrigger intervals, and the Bulwark start/seamless-loop/end topology. The live synth fallback obeys the same anti-stacking policy, and the shared versioned JSON manifest drives a WAV validator for presence, RIFF/PCM structure, mono 48 kHz/24-bit format, duration, −1 dBFS peak, unexpected files, and Bulwark loop seams. Production files replace synthesis without changing simulation events and bind only after complete-family waveform and mix acceptance.
68. **Production Asset Batch T — Nest Weaver. Completed 22 July 2026.** Generated and integrated the exact three-family package authorized by Task 63: a 32-frame directional/behavior body at 192×192, six stable 128×128 pod lifecycle states, and eight 128×128 event-effect frames arranged as four onset/dissipate pairs. Untouched chroma output, clean-alpha masters, deterministic nearest-neighbour runtime atlases, prompt provenance, frame contracts, and a contact sheet are retained under `art/production-tests/batch-t/` for future Steam reprocessing. All effects now play as onset/dissipate pairs; gallery and live routes pass native 960×540, Full HD, and 4K review without clipping or browser errors. Placement geometry, countdown, HP bars, collision, timing, reservations, and hatch payload remain code-owned.

69. **Production Asset Batches U, V, and W — Storm Savant, Scrap Skitterer, and Arc Warden. Completed 22 July 2026.** Batch U supplies the exact 36-frame Savant body, six-state conductive node, and eight non-lightning effects. Batch V supplies the exact 32-frame Skitterer body and eight restrained acceleration/rush/impact/wreck effects. Batch W supplies the exact 32-frame Arc Warden body and eight charge/discharge-origin/impact/recovery effects. All retain untouched chroma sources, clean-alpha masters, deterministic nearest-neighbour atlases, prompts, normalizers, and contact-sheet QA. Bodies and effects are bound to live simulation events while lightning, warning lanes, timing rungs, endpoints, target/cover-stop geometry, collision, damage, and timing remain code-owned.

70. **Production Asset Batch X — Cyborg Reclaimer. Completed 22 July 2026.** Supplies the exact 36-frame directional/state support-bruiser body and eight tether-origin/repair-completion/interruption/recovery effects. Untouched chroma sources, clean-alpha masters, deterministic 192×192 and 128×128 runtime atlases, prompts, adaptive normalizer, and contact-sheet QA are retained. Live body phases and onset/dissipate effects are event-bound while target eligibility, selection, tether geometry, ranges, link ownership, repair amount, finite patches, health mutation, interruption, collision, damage, Shock behavior, and timing remain code-owned.

71. **Production Asset Batch Y — Foundry Fabricator family. Completed 22 July 2026.** Supplies the exact five-family package: 36-frame Fabricator, six-state pad, 28-frame drone, 32-frame turret, and eight local onset/dissipate event effects. Retained chroma/alpha masters, deterministic 192×192/128×128 derivatives, prompts, adaptive normalizer, and contact-sheet QA are complete. Live bodies and event effects are bound while reservations, pad durability/progress, charges, ownership, lifetimes, caps, target locks, turret lane/range, cover blocking, collision, damage, and timing remain code-owned.

72. **Standard machine-family mixed-wave silhouette gate. Completed 22 July 2026.** The deterministic Foundry lab now places Fabricator, Reclaimer, damaged Arc Warden, and two Scrap Skitterers before producing its pad, airborne drone, and square-base turret beneath the unchanged eight-live-unit cap. Native 960×540, Full HD, and true 4K live-browser review preserves distinct height, breadth, footprint, elevation, emitter/barrel, repair-tether origin, warning-lane origin, pad visibility, child visibility, HUD edges, and title safety without warnings. Expanded mini-boss production art is now unblocked; random-pool promotion remains separately gated by representative 45–90-second seeded fights.

73. **Production Asset Batch Z - Synapse Herald. Completed 22 July 2026.** Supplies the exact three-family package: 40-frame 192 px directional/state body, eight 128 px local onset/dissipate effects, and one 256 px portrait. Chroma/alpha masters, deterministic derivatives, prompts, normalizer, and contact-sheet QA are retained under `art/production-tests/batch-z/`. Live body phases and local event accents are bound while lunge paths, marked-zone geometry, synapse tether/rings, locking, mitigation, collision, damage, health bars, warnings, and timing remain code-owned. Random-pool promotion remains held for mixed ordinary Brain Blob silhouette review and representative 45-90-second seeded fights.

74. **Production Asset Batch AA - Assembly Prime. Completed 22 July 2026.** Supplies the exact four-family package: 44-frame 192 px directional/state body, six-state 128 px reinforced command pad, eight 128 px local onset/dissipate effects, and one 256 px portrait. Chroma/alpha masters, deterministic derivatives, prompts, source-aware normalizer, and contact sheet are retained under `art/production-tests/batch-aa/`. Live body phases, simulation-derived pad progress, and local events are bound while existing Foundry children remain shared and lanes, beads, endpoints, pad/recall geometry, reservations, collision, damage, health bars, warnings, and timing remain code-owned. Random-pool promotion remains held for mixed-machine multi-resolution review and representative 45-90-second seeded fights.

75. **Production Asset Batch AB - Storm Regent. Completed 22 July 2026.** Supplies the exact four-family package: 44-frame 192 px directional/state command body, six-state 128 px Regent-specific conductive node, eight 128 px local onset/dissipate effects, and one 256 px portrait. Untouched chroma sources, clean-alpha masters, deterministic derivatives, prompts, verified irregular-row normalizer, and contact sheet are retained under `art/production-tests/batch-ab/`. Live body phases, owner-aware node state/criticality, and chain-origin, node-overcharge, coil-discharge, and interruption effects are event-bound while chain rails/hops/endpoints, cover stops, target/overcharge/coil rings and ticks, ownership, collision, damage, health bars, warnings, and timing remain code-owned. Random-pool promotion remains held for multi-resolution mixed-wave review and three representative 45-90-second seeded fights.

76. **Production Asset Batch AC - Abomination Prime. Completed 22 July 2026.** Supplies the exact four-family package: 52-frame 192 px directional/state apex body, eight-frame 128 px projectile/hazard lifecycle, eight 128 px local onset/dissipate effects, and one 256 px portrait. The rejected 11-row body attempt and accepted overshoot source are retained with clean-alpha masters; deterministic normalization selects the exact ordered 13-row contract and final collapsed defeat. Live phases, rotating flight frames, active hazard lifecycle, slam/grab/tear/landing/defeat events, and a separate hazard-art layer are bound while slam/throw circles and timing marks, landing blocks, grab tether/ring, trajectory, hazard radius, collision, terrain damage, forced movement, health bars, and scheduler timing remain code-owned. Random-pool promotion remains held for mixed Corrupted Human multi-resolution review and three representative 45-90-second seeded fights.

Sequencing note: Tasks 44–50, 53–76, Batches T/U/V/W/X/Y/Z/AA/AB/AC, and Production Audio Batch S1 are complete. No authorized production-art package remains in the current recommended order. Next are the expanded mini-boss mixed-wave/multi-resolution and three-seed 45–90-second fight acceptances, followed by physical-controller, colour-vision, and maximum-density audio review immediately before Steam packaging. Keep the sector campaign deferred until the single-sector MVP succeeds.

77. **Full HD/4K environment renewal and room-family plan — accepted 22 July 2026.** The dedicated roadmap and audit live in `environment-production-plan.md`; reusable generation contracts live in `environment-prompts.md`. Early Batch A and Batch H arena/theme art is scheduled for authored replacement because its six-frame 64 px presentation creates repetition and weak room identity at desktop scale, not because whole-pixel 4K scaling is blurry. Recent 128/192 px production families remain accepted unless a mixed-wave review demonstrates a specific silhouette, pivot, contrast, seam, or animation failure. Eight modular kit groups now cover Science Wing, Bastion Logistics, Machine Foundry, Alien Hive, Surface/Planetary, Starship/Void, Containment/Underworld, and boss arenas/Colosseum. Batch AD Science Wing establishes the new 16-floor/eight-boundary/eight-fixture/eight-decal contract with 128/192 px runtime cells and 256/384 px retained masters; code retains all gameplay ownership. Gallery/live multi-resolution acceptance remains before theme promotion.

78. **Environment Batches AD and AE — Science Wing accepted; Logistics preflight complete 22 July 2026.** Science Wing is a live deterministic theme and passed native, high-density, Full HD 2×, and 4K 4× review without losing actor, projectile, pickup, telegraph, or HUD contrast. Batch AE now supplies the same 40-frame modular contract for supply, armoury, shop, forge, medic, defence command, loading, and bunker rooms, with retained chroma/alpha sources, 256/384 px masters, 128/192 px runtime atlases, prompts, normalizer, seam mosaic, contact sheet, manifest contracts, and gallery route. Logistics remains preflight-only until its own live mixed-density/multi-resolution gate passes; Batch AF Machine Foundry follows that acceptance.

79. **Environment Batch AE accepted and Batch AF Machine Foundry preflight complete — 22 July 2026.** Bastion Logistics is now the deterministic `bastion-logistics` live theme and passes ordinary combat, density-capacity, Full HD 2×, and 4K 3× presentation with crisp whole-pixel scaling and readable actors, projectiles, danger colours, pickups, and HUD. Batch AF supplies 16 foundry/factory/ore/assembly/coolant floor tiles, eight modular boundaries, eight conveyor/crusher/smelter/assembly/pump/generator/compactor/maintenance fixtures, and eight subtle decals. It retains source/chroma, clean alpha, 256/384 px masters, 128/192 px runtime atlases, prompts, deterministic normalizer, seam mosaic, contact sheet, manifest contracts, and `?mode=gallery&batch=af`. Machine Foundry remains preflight-only until its live mixed-density/multi-resolution gate passes; Batch AG Alien Hive follows.

80. **Environment Batch AF accepted and Batch AG Alien Hive preflight complete — 22 July 2026.** Machine Foundry is now the deterministic `machine-foundry` live theme and passes ordinary combat, density-capacity, Full HD 2×, and 4K 3× presentation. Batch AG supplies 16 chitin/biomass/nest/nursery/hatchery/spore/queen/organic-ship floors, eight modular hive boundaries, eight biomass/slime/egg/incubator/spore/feeding/sentinel/specimen fixtures, and eight restrained organic decals. Untouched source/yellow-chroma files, helper-derived clean alpha, 256/384 px masters, 128/192 px runtime atlases, prompts, deterministic normalizer, seam mosaic, contact sheet, manifest contracts, and `?mode=gallery&batch=ag` are retained. Alien Hive remains preflight-only until its live mixed-density/multi-resolution gate passes; Batch AH Surface and Planetary Frontiers follows.

81. **Environment Batch AG accepted and Batch AH Surface Frontiers preflight complete — 22 July 2026.** Alien Hive is now the deterministic `alien-hive` live theme and passes ordinary combat, density-capacity, Full HD 2×, and 4K 3× presentation with muted organic terrain beneath red enemies, orange shots, cyan pickups, and HUD. Batch AH supplies 16 floors partitioned into Earth, hostile-planet, war-torn, and additional-frontier rows, plus eight natural ridge boundaries, eight tree/cave/shelter/crystal/ice/fungus/meteor/obelisk fixtures, and eight restrained ground decals. Source/chroma, helper-derived alpha, 256/384 px masters, 128/192 px runtime atlases, prompts, deterministic normalizer, seam mosaic, contact sheet, manifest contracts, and `?mode=gallery&batch=ah` are retained. Live promotion is blocked until the renderer selects one biome row per room; Batch AI Starship, Void, and Transit follows after that gate.

82. **Environment Batch AH accepted and Batch AI Starship/Void/Transit preflight complete - 22 July 2026.** Surface Frontier now selects exactly one of 16 named terrain identities per room and uses deterministic tile transforms to reduce repetition without biome mixing; representative density and intended-camera reviews preserve combat readability. Extreme 3x close-camera review still exposes finite-source repetition on frozen ground, recorded for a later 4K macro-texture pass. Batch AI supplies 16 opaque ship, transit, void-platform, teleporter, stargate, hyperspace, damaged, and derelict floor frames; eight hull/airlock/breach boundaries; eight cargo, bridge, observation, teleporter, gate, drive, and pod fixtures; and eight restrained decals. Source/chroma files, helper-derived alpha, retained 256/384 px masters, 128/192 px runtime atlases, prompts, deterministic normalizer, seam mosaic, contact sheet, manifest contracts, and `?mode=gallery&batch=ai` are retained. Live promotion is the next gate, followed by Batch AJ Containment and Underworld.

83. **Environment Batch AI accepted and Batch AJ Containment/Underworld preflight complete - 22 July 2026.** Starship Transit initially failed live review when ornate single frames repeated as full-room grids. The accepted implementation groups the atlas into four coherent four-frame families - operational, command, energy transit, and derelict - and passes density, native, 2x, and 3x presentation with directional architecture unrotated. Batch AJ supplies 16 prison/quarantine/containment/bunker/dungeon/ritual/volcanic/infernal floors, eight walls/corners/gates, eight cage/pod/console/restraint/brazier/obelisk/bunker fixtures, and eight sparse decals. Yellow-chroma sources, corrected explicit-key decal alpha, retained masters/runtime sheets, prompts, normalizer, seam mosaic, contact sheet, manifest contracts, and `?mode=gallery&batch=aj` are retained. Batch AJ live promotion is next; Batch AK boss arenas remain gated on proven boss mechanics.

84. **Environment Batch AJ accepted and theme-object contract implemented - 22 July 2026.** Containment/Underworld is now the deterministic `containment-underworld` live theme with institutional, containment, dungeon, and infernal four-frame families; all pass density, native, 2x, and 3x review. `WorldObjectCatalog.ts` defines 24 theme-filtered obstacles, hazards, interactables, and hybrids with explicit movement/projectile collision, destructibility or deliberate indestructibility, footprints, room caps, placement roles, hazard strength, and interaction effects. The catalog includes broken walls, racks, chests, lockers, rocks, boulders, mounds, overgrowth, trees, webs, ice blocks, gates, slime/toxic/fire/lava, buttons, monster teleporters, stargates, control/turret/trap panels, cryogenic tubes, and a weapon station that disables only the selected weapon for exactly 45 seconds. Dedicated structural, hazard, and multi-state interaction art now precedes gated boss-arena production.

85. **World Object Production Batch O1 completed - 22 July 2026.** Three dedicated 4x4 transparent atlases supply 48 structural damage-state frames at 192 px runtime and 384 px retained-master resolution. Military rows cover broken wall, weapon rack, equipment locker, and reinforced gate; natural rows cover boulder, earth mound, tree, and ice block; organic rows cover overgrowth, web mass, biomass node, and alien crystal. All use fixed intact/damaged/critical/destroyed columns, stable footprints, and low-profile destroyed states. Twelve catalog definitions now own exact atlas-row bindings, including two newly formalized hive/surface obstacles, while HP, thresholds, collision, cover, interaction, navigation, drops, effects, and audio remain code-owned. Source/chroma, clean alpha, prompts, normalizer, contact sheet, manifest tests, runtime copies, and `?mode=gallery&batch=o1` are retained. Object Batch O2 hazards follows; boss arenas remain gated.

86. **Transformation Affinity foundation - completed 22 July 2026; runtime integration deferred.** `transformation-path-production-plan.md` defines six active run-local families: Mutagenic Evolution, Alien Symbiosis, Cybernetic Ascension, Void Initiation, Bastion Super-Soldier, and Psionic Operative. A Phaser-free model now advances None/Exposed/Adapted/Transformed/Ascended/Apex at 0/1/2/3/5/7 Affinity, permits repeated aligned choices, commits whichever family reaches three first, retains minor off-path exposure, blocks further off-path advancement, allows uncommitted purge, refuses committed purge, and caps at seven. The fictional Church of the Designed Arrival is recorded only as a future seventh-path concept with post-commitment doctrines; it has no active catalog id, offers, saves, rooms, UI, art, or gameplay hooks. Concrete boon/scar numbers, persistence, UI, rooms, behavior, and assets remain the next gated sequence.

87. **Transformation paired-choice preflight - completed 22 July 2026; effects remain inert.** `TransformationChoiceCatalog.ts` defines exactly three choices for each of the six active paths and three replacement-total ranks for every boon and scar. The 18 pairs cover regeneration, health, retaliation, Corrode, feeding, carapace, targeting, shielding, drone cadence, rift movement, gravity, entropy, Heavy proficiency, armour, demolitions, psionic range, telekinesis, and danger prediction. Typed metrics, operations, units, fixed trigger rules, rank lookup, abstract rank-I benefit/scar budgets, branch coverage, monotonic rank growth, and future-Church exclusion are tested. No resolver applies these numbers; persistence, UI, rooms, combat behavior, art, audio, and Zealot content remain absent.

88. **Transformation persistence and snapshot gate - completed 22 July 2026; effects remain inert.** Expedition builds, combat snapshots, node completion, autosaves, cloud schema checks, final run summaries, the debrief demo, and Codex-facing snapshots now carry normalized transformation state. Local-save schema v8 migrates versions 1-7 to an empty safe state when data is absent. Sanitization derives Affinity from valid active-catalog choices, enforces family membership, three ranks per choice, seven total points, unique path rows, a real three-point commitment, and at most two off-path points after locking; malformed and future-only Church data is discarded without losing the surrounding expedition. The combat simulation copies but never resolves the state, preserving the no-live-effects gate. An isolated warning/confirmation/purge decision lab is next.

89. **Item/UI asset audit and transformation decision safety gate - completed 23 July 2026.** `item-ui-asset-production-plan.md` records exact live coverage: eight canonical weapon tiles, seven perk tiles, current shop offers, hotkeys, rack/stash/tier surfaces, six powerup types, one activatable kit, and no conventional ammo, wearable armour, non-weapon equipment, or general consumable inventory. It authorizes powerup consolidation and three older live-weapon VFX renewals while deferring unused armour/ammo/equipment/relic art. The isolated `?screen=transformation-lab` route now exercises all six paths and 18 paired choices against an in-memory demo: the third aligned choice receives a distinct permanent-lock warning and 1.25-second hold, releasing resets progress, cancellation is mutation-free, uncommitted exposure has a separate purge hold, committed paths refuse purge, keyboard/controller/pointer controls are explicit, and no combat effect or save write exists. Cybernetic placeholder behavior is next.

## Plan review — 23 July 2026: the acceptance-and-sensory-completion audit

A full re-read of every planning document against the shipped code (89 completed tasks, ~30 art batches A–AC + AD–AJ environments, ~160 tests, Steam-readiness scaffold, two heroes, eight weapons, twelve upgrades, seven perks, the live 20-node expedition, and an inert six-path transformation system). The engineering is far ahead of where a web MVP needs to be. **The blockers to a finished, shippable game are no longer code — they are (a) a large human-review backlog the build keeps deferring instead of closing, and (b) two whole sensory/decision layers that were designed but never made live.** The five findings below re-order the remaining work around *finishing* rather than *adding*.

### Finding 1 — the acceptance backlog is the real critical path (highest priority)

Roughly two dozen items sit in "creator review queued" or "random-pool promotion held pending mixed-wave review + a representative 45–90-second seeded fight": the four expanded mini-bosses (Synapse Herald, Assembly Prime, Storm Regent, Abomination Prime), the Nest Weaver / Storm Savant / machine family standard promotions, the front-end/map layout-and-copy reviews, and the world-theme contrast pass. Each new task the project completes *adds* to this pile instead of draining it. Until these promotions clear, most of the produced content is unreachable in a normal run — the same "finished content is not reachable" failure mode Finding 1 of the 17 July review called out, now recurring one tier up. **The fix is a dedicated acceptance sprint, not more production.** Nothing new (transformation combat, relics, sector 2) should start until the held pool is either promoted or explicitly cut.

### Finding 2 — audio is the single biggest sensory gap, and music/ambience is entirely unscoped

Every sound in the game is still the placeholder synthesizer. The Batch S plan (S1 weapons, S2 corrupted-human threat, S3 shared feedback) covers *sound effects* only and explicitly excludes music and ambience. There is therefore **no plan at all** for menu music, per-world combat loops, boss themes, victory/defeat stingers, or ambient beds. A game this visually and mechanically complete that plays synth beeps reads as a prototype the instant it is heard — this is the most jarring gap between the current build and a "one more run" product. Recommendation: prioritise producing the S1 masters (the validator already exists), then add a new **Audio Batch S4 — music and ambience** (briefed in `last-bastion-content.md`), including a simple two-layer adaptive-intensity combat bed, which is a very high return for a survivor-like.

### Finding 3 — the transformation system is a large built feature with zero player value; decide its fate now

Six paths, 18 paired boon/scar choices, an Affinity model, a decision-safety lab, and full save-schema-v8 + snapshot plumbing all exist, and every number is inert — no resolver touches combat. It is real design debt: it consumes a schema version and threads through builds, autosaves, cloud validation, and run summaries for no player-facing effect, and "Cybernetic placeholder behavior is next" would sink more time into it before the shippable loop is finished. **This is a fork in the road that needs a decision, not more incremental gates.** Recommendation: time-box a single Cybernetic *live* pilot (one path, resolver wired to combat, played end-to-end) and judge whether transformations earn their complexity against the existing upgrade/perk/relic layers. If yes, schedule the other five paths as a post-MVP content line; if no, freeze the system behind a flag and stop spending schema/plumbing on it. Do not wire all six speculatively.

### Finding 4 — the expedition map is mechanically complete but decision-thin; its missing texture is already designed

The 20-node run works, but every node a player actually meets is Combat, Elite, Mini-boss, Supply Depot, Weapon Cache, or Boss. The two node types that create *interesting route decisions* — **Shrine** (risk/reward bargains) and **Event** (micro-choices) — are still reserved placeholders, and relics/artifacts (the run-defining rewards those nodes would hand out) are designed in the content catalogue but never made live. This is why the map, while solid, does not yet produce the "which way do I go" tension the design pillars promise. It is also the most direct answer to the standing question about richer paths: the highest-value map work is **not** more nodes or longer lanes (the single-sector topology is deliberately FTL-simple and should stay so for the MVP — longer/branchier structure is the already-deferred sector campaign), but making the two designed decision node types and their reward pool live. A cheaper complement is a **lane-modifier layer** (flag a lane as hazardous-but-lucrative) that adds route texture without adding nodes or art.

### Finding 5 — held front-end and map art is ready to promote

Batch G1/G2 (title, menu, hero dossier, starchart backdrop, node medallions, dropship token, run-summary board) has finished briefs and passed-placeholder behavior gates; it was only held pending a creator layout/copy review that never happened. The game currently presents its entire shell in code-native placeholders. Once the layout review in Finding 1's acceptance sprint clears, this art can be generated and dropped in for an immediate, large presentation upgrade with no new engineering.

### Quality-of-life recommendations (small, high-return, mostly code-only)

- **Pause menu with Restart Run / Abandon to Menu** — currently pause is combat-only; a run you can't cleanly restart hurts the "one more run" loop.
- **Seed display + copy on the map and run-summary** — the generator is already seeded and reproducible; surfacing the seed turns bug reports and "run that again" into one click, at near-zero cost.
- **Codex "new discovery" toast** when a monster/weapon/relic is first seen — makes the Monsterdex a live reward instead of a static page, reinforcing the discovery loop the design already claims.
- **Level-up card build summary** — show the resulting archetype lean (burn / freeze / storm / armour) so players read their build forming; the elemental-path data already exists.
- **Damage-per-second / build readout on the debrief** — the run summary has the per-weapon damage split; a one-line "your build" verdict makes it feel like feedback, not a scoreboard.
- **Reduced-motion / photosensitivity confirmation on first boot** — the settings exist (Reduced flash, screen shake); a one-time prompt is a cheap accessibility and store-compliance win before Steam.

### Numbered next steps (continuing from 89)

90. **Acceptance sprint — drain the review backlog (do first).** One structured pass with a written pass/fail per held item: the four expanded mini-bosses each in a mixed wave at 960×540 / Full HD / 4K plus one representative 45–90-second seeded fight; the Nest Weaver, Storm Savant, and machine-family standard promotions into ordinary waves; the front-end shell and expedition-map layout/copy review; and the world-theme contrast pass. Output: an approved-for-promotion list and a cut/retune list. Prepare a review harness/checklist that boots each item directly and records the verdict. **Mini-boss promotion actioned 23 July 2026 (creator-accepted):** `ExpeditionEncounter.ts` now tiers the mini-boss pool by depth — the original three (Siege Crusher, Brood Warden, Rift Stalker) cover mini-boss nodes before column 5, and the four apex bosses (Synapse Herald, Assembly Prime, Storm Regent, Abomination Prime) join from column 5 onward so the 560–920-health fights only land once a rack can answer them. All four were already fully built with production art and tests; they are now reachable in an ordinary run. Their 45–90-second fight feel and mixed-wave silhouette remain a **playtest confirmation** for the creator, not a code gate. 653 tests pass, typecheck clean. The remaining held items (machine/summoner standard-wave promotions, front-end/map layout review, world-theme contrast) are still the human-judgement backlog.
91. **Audio S1 production masters.** Record and bind the 24 S1 weapon masters the validator already gates; review each family in isolation and in a 60-second maximum-density mix before replacing synthesis. Then S2 and S3 in order.
92. **Audio Batch S4 — music and ambience (new).** Menu theme, per-world combat loop with a two-layer adaptive-intensity bed (calm ↔ swarm), a boss theme, and victory/defeat stingers, plus light per-world ambience. Brief in `last-bastion-content.md`. This is a shippability gate, not polish.
93. **Transformation live-pilot decision.** Time-box a single Cybernetic Ascension path wired to combat end-to-end, play it, and decide keep-and-schedule vs. freeze-behind-flag. Do not wire the other five paths until this returns a verdict.
94. **Make Shrine and Event nodes live.** Promote the two reserved node types with their code-native decision surfaces, seed them into the generator (respecting the existing adjacency rules), and light up the first relic set (6) and first artifact (1) from the content catalogue as their reward pool. Art briefs for the Shrine/Event medallions and relic/artifact tiles are in `last-bastion-content.md`.

    **Capability + review lab landed 23 July 2026 (second pass).** The catalogue now has: `shrine`/`event` added to `ExpeditionNodeType`; `expeditionEncounterForNode` resolving those nodes to a specific card via `selectEncounterEvent` (new `eventId` field on the descriptor); map-scene glyphs/labels/intel entries; and a deterministic **review lab at `?screen=event-lab`** (`EncounterEventScene`) — an in-memory, no-save presentation of all 14 cards with requirement-gated choices, deterministic and gamble resolution, a reroll to expose branch variance, and keyboard/controller/pointer parity (mirrors `?screen=transformation-lab`). Verified in-browser: boots clean, resolves choices, applies clamped build deltas, and the Derelict Dropship gamble surfaces all three weighted branches. **Deliberately NOT placed on live charts yet:** the generator budget still excludes shrine/event because resolving one in a real run needs an in-run decision scene *and* the relic / weapon-slot / max-health systems several outcomes grant — placing unresolvable/no-op nodes would break a run and violate the "don't award state gameplay can't validate" rule. `ExpeditionMap.test` asserts they are absent from generated maps for now.

    **Relic/Artifact resolver landed 23 July 2026 (third pass).** `content/relicCatalog.ts` is the single source of truth for the six relic and three artifact ids, definitions (codex copy), and a pure `resolveRelicModifiers(ownedRelicIds, equippedArtifactId)` that folds owned relics plus one equipped artifact into a flat `RelicRunModifiers` bag — exactly the `perkCatalog` → `PerkRunModifiers` pattern combat already reads. Numeric fields (moving spread, self/explosive damage, explosion radius, evasive distance/recovery) and behavioural flags (chain-arc cadence, elite mark/bonus, health-pickup pulse, implosion cadence, egg-death damage, brace formation) are covered; duplicate ids apply once and unknown ids are ignored. `EncounterEventCatalog` now imports its `RelicId`/`ArtifactId`/`RELIC_IDS` from here. 9 resolver tests; magnitudes are tuning-pass proposals bound for `wave_balance.md`.

    **Run-state carrier + save schema v9 landed 23 July 2026 (step 1 of 3).** `ExpeditionBuildSnapshot` now carries optional `relicIds`, `equippedArtifactId`, `maxHealthBonus`, and `weaponSlotBonus` (all additive-optional, exactly like the schema-v8 `transformation` field). `LocalSaveStore` bumped to **v9**: the mid-run build persists and sanitizes the reward carrier (unknown relic/artifact ids dropped, bonuses coerced/floored), pre-v9 saves migrate to empty defaults, and `CloudSavePolicy`/`PlatformAdapter` version constants moved with it. `applyEventResolutionToBuild(resolution)` folds an event's side-effects into the carrier (relics accumulate, last artifact equips, bonuses add) — the bridge the in-run scene will commit. `sanitizeBuildRewards` guards edited data. Browser-verified: an injected realistic **v8** save resumes its expedition cleanly with no console errors and an empty reward carrier. 669 tests pass (+7). **Combat consumption landed 23 July 2026 (step 2 of 3).** `CombatSimulation` now resolves `resolveRelicModifiers` at construction from the starting build's `relicIds`/`equippedArtifactId` and applies: the carried **max-health bonus** (base + level growth + reward, floored at 3 so a costly shrine can't make the hero unplayable, applied in both `restoreExpeditionBuild` and `applyLevelGrowth`); the carried **weapon-slot grants** (extra flexible "all" rack mounts at construction); and the **Blast Baffle** relic's explosion-radius multiplier on friendly projectiles. The `CombatSnapshot` now carries `relicIds`, `equippedArtifactId`, `rewardMaxHealthBonus`, and `rewardWeaponSlotBonus`, and `expeditionBuildFromSnapshot` re-emits them, so rewards survive a combat node. 5 `RelicIntegration` tests lock max-health-with-floor, slot grants, and snapshot carry-through. The remaining relic/artifact behaviours (chain arc, elite mark, health-pickup pulse, evasive distance, self-damage reduction, and the three artifact effects) are resolved-and-available but consumed incrementally in later hooks. **Content recalibration (same pass):** the event catalogue was mis-scaled to a 60-HP demo hero; real `PLAYER_MAX_HEALTH` is 10 with only +1/level (~15–19 mid-run). Health/max-health/shield/heal magnitudes across all events and the lab demo build were rescaled ~5× down (e.g. Shrine of Steel −20→−4 max health, floor 40→10; Spore Bloom −12→−4; heals 20→6). Scrap values were already correct against the shop economy and are unchanged. Browser-verified: combat boots clean with the new wiring, and the lab shows the recalibrated numbers.

    **In-run scene + live promotion landed 23 July 2026 (step 3 — Task 94 COMPLETE).** `ExpeditionEventScene` (`?screen=event`) is the in-run resolution screen: it resumes the run, reads the current shrine/event node and its build, gates choices against the real max health (base + level growth + reward carrier), and on a choice either commits the node via `applyEventResolutionToBuild` + `completeCurrentNode` (persisting the v9 carrier and returning to the map) or, for an `ambush` outcome, persists the build and routes into a synthesized one-wave combat (`ambushEncounterForNode`) that commits the node on victory through the existing combat path. The map hand-off (`ExpeditionScene.launchCurrentEncounter`) sends shrine/event nodes here; `readExpeditionContext` builds the ambush combat when the `ambush` param is present. The generator budget now places **1 shrine + 2 events** per chart (kept out of columns 0–1), and `CampaignTuning`'s worst-case boss-entry floor is 8 (decision routes trade combat XP for choice). Browser-verified end to end: seeded at seed-42 node 7 (Fleshwright), the decision screen resolved accept-graft (health 10→14 heal-to-full, +5 shield), committed the node, and returned to the map with the next nodes selectable and no console errors; the ambush URL boots a real one-wave combat. 681 tests pass. **Shrine and Event nodes are now live in an ordinary run.** Follow-on polish (not blockers): Batch G2 shrine/event medallion art, per-event flavour tuning, and wiring the remaining relic/artifact combat behaviours beyond max-health/slot/explosion-radius.

    **Content foundation landed 23 July 2026:** `EncounterEventCatalog.ts` is the pure, Phaser-free catalog + resolver (mirroring `perkCatalog` and the transformation catalogs) — six shrines (Steel, Hunt, Echoes, Fleshwright Altar, Scrap Reliquary, Void Coin) and eight FTL/StS-style events (Derelict Dropship, Stranded Survivor, Distress Beacon, Dormant Fabricator, Spore Bloom, Abandoned Armoury, Corrupted Medbay, Wandering Quartermaster). Choices support requirement gating (scrap/health/max-health floor/weapon count), deterministic and weighted-random (FTL) outcomes, ambush-combat hooks, and an always-available Leave so a node can never trap the player. Outcomes apply live build fields (health/shield/scrap/experience/weapons) directly and carry not-yet-live effects (max-health delta, weapon slots, relic/artifact ids, upgrade rerolls, next-node modifiers, ambush) in `EventSideEffects` for the run to consume. Relic ids (`rel-*`) and artifact ids (`art-*`) are seeded from the content catalogue. 19 dedicated tests cover catalog integrity, the mandatory Leave, requirement gating, deterministic resolution (floors/caps/clamps), and weighted-branch distribution. **Remaining behavior gate:** add `shrine`/`event` to `ExpeditionNodeType`, seed them into the generator budget under the adjacency rules, extend the save schema to carry side-effects, and build the code-native decision scene (keyboard/controller/pointer parity, like the Supply Depot). The relic/artifact *resolvers* are their own follow-on system — the events already produce the ids to feed them.
95. **Front-end and map art promotion (Batch G1/G2).** Generate and integrate the held title/menu/dossier/starchart/medallion art once Task 90's layout review passes.
96. **QoL pass.** Pause-menu restart/abandon, seed display+copy, codex discovery toast, level-up build-lean label, debrief build verdict, first-boot reduced-motion prompt.
97. **Optional map texture — lane modifiers.** A pure, seeded per-lane flag (hazardous / lucrative) surfaced on the starchart, adding route-decision variety without new nodes or art. Only after Task 94 proves the decision layer lands.

Sequencing intent: **finish before adding.** Tasks 90–92 make the current build reviewable and sensory-complete; 93–94 close the two designed-but-inert layers; 95–96 are the presentation and feel polish that make it a product; 97 is the only genuinely new content and is explicitly last. The sector campaign, additional heroes, and biomes remain deferred until the single-sector MVP earns a "one more run" verdict from external testers.
