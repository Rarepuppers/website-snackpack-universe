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

**Current objective:** run the consolidated creator playtest (now including Batch K status readability), then execute step 35's wave-pacing v2/rescale pass against its measurable targets, then behavior-prototype Event Horizon's aim, pull-field, implosion, and 16-second active-tile contract before generating its Unique production family. The content-enablement pass is already complete.

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
35. **Single tuning pass with measurable targets:** 10–15 minute run length, at least three recognisably different builds, no unavoidable damage in waves 1–3, death causes readable, wave-5 mini-boss fight 45–90 seconds. Revisit XP curve, wave counts on the larger arena, and reward cadence together. **The numeric design now lives in `wave_balance.md` (draft v1, 17 July 2026):** starter rifle rescaled to 2 damage per bullet with all enemy health rescaled to match, authored per-wave health/armour/shield/speed growth, threat-budget spawning with simultaneous caps and Brotato-style overwhelm from wave 3, a steeper XP curve targeting 9–12 levels per run, damage numbers, the Scrap economy (still gated behind the Shop node), and item classes. **18 July 2026 — wave-pacing v2 joins this pass:** short timed waves (20 s waves 1–2, 30 s wave 3, +5 s per wave capped at 60; mini-boss and final-boss waves untimed), per-second threat-budget spending at ~2–3× v1 density, raised simultaneous caps with a required 44-enemy capacity scene, guaranteed elite cadence from wave 6, the Brotato-scale 10-health / 0.2-regen player model with 1–3 early enemy damage, damage-number colours and toggle, the explosion centre/edge falloff rule, and the guaranteed post-wave-1 weapon pick with the wave-band acquisition pool. Implement the pacing skeleton first, then tune stats against it; the verification list in `wave_balance.md` now has 20 rules that become tests during this pass.
36. **Rift Stalker behavior gate** to complete the three-entry mini-boss pool (cloaked stalk, marked pounce, close slash, final-20% frenzy), then its production batch.
37. **Front-end shell behavior gate.** Title, main menu, How to Play, Settings, and character-select screens as a code-native screen-flow state machine with placeholder panels, per the "Front-end shell and expedition structure" design added to `last-bastion-game.md` on 17 July 2026. Settings bind to the existing `LocalSaveStore`; the Lab card surfaces the existing review routes in-game.
38. **Expedition map behavior gate.** Generator **completed 17 July 2026** (see the dedicated entry above): pure seeded 20-node chart with budget and fairness rules under test. Remaining: the map screen with code-native medallions and route lines, plus save schema v2 carrying mid-run state (map seed, cleared nodes, build, health) with autosave on returning to the map.
39. **Node → encounter wiring.** Combat/Elite/Mini-boss nodes drive the existing arena with budgets by node type and depth; Supply Depot and Weapon Cache reuse the existing decision overlays as full-screen nodes; the Boss node runs the Bastion Eater. The five-wave arcade run remains as "Quick Drop" until the map replaces it.
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
34. Implement the density-director v3 lab: data-driven pursuit/standoff/chase-and-fire profiles, 65–75% pursuit composition, raised 18/24/32/42/46/52/56 live caps, projectile-pressure budget, pooling, and seeded capacity telemetry. **Completed 18 July 2026 for the current five-wave prototype: 18/24/32/42/46 live caps, 56-enemy deterministic capacity lab, eight reusable steering profiles, two-wind-up/six-projectile ordinary ranged limits, friendly/hostile simulation projectile pools, debug telemetry, and rules tests. The 52/56 ordinary-wave caps remain for waves 6–9 when the run expands beyond five waves.**
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
