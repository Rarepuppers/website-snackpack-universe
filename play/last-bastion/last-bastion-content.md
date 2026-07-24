# Last Bastion content catalogue

## Status

**Version:** 0.2

**Status:** Design draft; weapon concepts approved; unbalanced. Damage types, defensive statistics, Blast Mite, Warp Flanker, and the four powerups have gameplay-critical Batch C production art integrated (16 July 2026).

This document lists early enemies and weapons without implying that all of them belong in the combat prototype. Gameplay data will eventually replace these tables as the implementation source of truth.

## Enemy design rules

- Each early enemy teaches one primary rule.
- Size, health, speed, reach, projectile attacks, and ground denial are separate pressure levers.
- Early variants should change one or two levers, not every statistic simultaneously.
- Dangerous attacks need wind-up, direction, impact, and recovery tells.
- Spawned hazards need visible lifetime and coverage limits.
- Enemy names and silhouettes must be original and avoid close resemblance to existing franchises.

## Enemy tiers

Tiers describe encounter complexity, not merely health.

### Tier 0: Nest objects

| Enemy | Role | Behaviour | Lesson |
| --- | --- | --- | --- |
| Egg Cluster | Stationary delayed threat | Pulses, cracks, then releases one or more small aliens unless destroyed | Target priority and prevention |
| Slime Pod | Stationary hazard | Bursts when damaged or after a warning, leaving a short-lived slow puddle | Arena awareness |

Eggs should be objects with a clear hatch timer rather than passive decoration. Different eggs may later telegraph which creature they contain through colour and silhouette.

The first production Egg Cluster uses four simulation-driven stages: dormant, internally pulsing, heavily cracked, and ruptured/empty. The final stage appears shortly before the cluster is replaced by its spawned Scuttlers so the hatch is readable as an event rather than an unexplained entity swap.

### Tier 1: Early creatures

| Enemy | Role | Behaviour | Lesson |
| --- | --- | --- | --- |
| Scuttler | Basic melee swarmer | Runs directly toward the player and attacks at close range | Keep moving and manage distance |
| Brain Blob | Small psionic alien | Floats slowly, pauses, then performs a clearly telegraphed short lunge or pulse | Read wind-ups before reacting |
| Slime Mite | Slow area-denial creature | Crawls toward the player and leaves a narrow trail that slows movement for a few seconds | Plan movement routes |

The initial prototype should begin with Scuttlers, then introduce Brain Blobs. Slime Mites enter only after basic movement is comfortable.

The first Scuttler production test uses a low shield-shaped coral carapace, violet underside and joints, six running legs, two short grasping claws, pale claw tips, and small yellow sensory markings. Its low broad silhouette distinguishes it from upright heroes and avoids relying on a familiar franchise creature shape. The runtime test uses four facings and a two-pose offset gait cycle.

The first Brain Blob production test uses a violet cerebral mass in a dark coral organic cradle with short sensory tendrils. Its authored states are deliberately different: rounded violet drift, compressed yellow wind-up, horizontally stretched hot-pink lunge, and dim sagging recovery. The sheet faces east and rotates toward the player at runtime.

### Tier 2: Pressure variants

| Enemy | Role | Behaviour | Primary change |
| --- | --- | --- | --- |
| Ripper | Large melee bruiser | Slower approach followed by a long claw sweep | Larger size and reach |
| Razor Scuttler | Fragile interceptor | Locked 0.48 s lane tell, very fast committed dash, then recovery after hit, collision, or miss | Speed |
| Slime Spitter | Ranged pressure | Fires a telegraphed slime glob that creates a temporary puddle | Ranged attack |
| Blast Mite | Kamikaze | Very fast and fragile; arms with a flashing tell at close range and detonates, also exploding on death | Corpse denial and kiting |
| Warp Flanker | Teleporting harasser | Stalks, marks a telegraphed arrival ring near the player, teleports there, and materialises briefly before attacking | 360° awareness |
| Mireback | Mobile ground denial | Leaves a wider persistent trail but turns slowly | Trail coverage |
| Brood Tender | Support/spawner | Accelerates nearby egg hatching and retreats from the player | Target priority |

The Blast Mite and Warp Flanker were implemented functionally on 16 July 2026 (waves 3–5); their directional/state Batch C sprite sheets are integrated.

### Tier 3: Elite concepts

| Enemy | Role | Behaviour |
| --- | --- | --- |
| Crusher | Armoured elite | Charges in a straight line, breaks cover, and is vulnerable during recovery |
| Cerebral Mass | Psionic elite | Projects marked danger zones and shields nearby Brain Blobs |
| Mire Mother | Slime elite | Alternates between spit volleys and laying bounded patches of slowing slime |

Tier 3 concepts are vertical-slice or later material.

## Slime rules

- A direct projectile or creature hit deals clear flat damage.
- Basic lingering slime slows movement but does not also deal damage over time.
- Slime shows its remaining lifetime through shrinking, fading edges, or a consistent dissolve animation.
- The encounter director caps simultaneous slime coverage so the arena always retains a plausible escape route.
- A later toxic variant may apply damage over time, but its colour and effect must be unmistakably different from basic slowing slime.
- Resistance, cleansing, and status combinations are deferred.

## Suggested prototype introduction

1. Wave 1: Scuttlers only.
2. Wave 2: Scuttlers plus visible Egg Clusters.
3. Wave 3: Scuttlers plus Brain Blobs.
4. Later prototype tuning: introduce either the Slime Mite or Slime Spitter, but not both at once.

This sequence lets each wave teach one additional rule.

## Damage types and status effects

Implemented 16 July 2026. Five damage types exist; four of them build a status effect instead of having a separately named "tier two" damage type. Status pressure is therefore mechanical, not a bigger number.

| Damage type | Status built | Status effect |
| --- | --- | --- |
| Physical | — | Knockback/stagger comes from weapon knockback values |
| Fire | Blaze | Damage over time (7/s for 3 s) |
| Shock | Overload | Brief stun (0.8 s) |
| Cryo | Freeze | Heavy slow (35% speed for 2.2 s) |

Presentation contract (18 July 2026): damage numbers and status overlays share one colour language — standard ivory/white physical, **red** fire, **teal** shock/lightning, **blue** cryo/frozen, **green** toxic/poison. Floating damage numbers are toggleable in Settings; the animated status overlays are specified in Batch K below. Magnitudes rescale with the v2 balance pass in `wave_balance.md` (e.g. Blaze 7/s → 0.5/s at the 2-damage baseline).
| Toxic | Corrode | Damage over time plus temporary armour reduction |

Rules:

- Typed damage accumulates buildup equal to post-mitigation damage; at 40 buildup the status triggers and the meter resets. Small enemies usually die before triggering; statuses matter against elites and bosses by design.
- Mini-bosses are immune to hard control (Overload, Freeze) but not to Blaze or Corrode.
- Enemies declare per-type resistance/vulnerability multipliers in the enemy catalogue (for example eggs and slime creatures are vulnerable to Fire; slime is highly resistant to Toxic).
- Chaos/space is deliberately **not** a damage type. Gravitic and exotic behaviour is the signature of Unique weapons such as Event Horizon.

## Defensive statistics

Implemented 16 July 2026 for the hero and every enemy definition. Two separate armour stats exist, Brotato/Warcraft-style:

- **Armour** — percentage reduction with diminishing returns: `reduction = armour / (armour + 15)`. One point is worth ~6.25% at low totals and progressively less afterwards, but it always remains worth stacking for large health pools.
- **Flat damage reduction** — subtracted from each hit after the percentage step, with a floor of 1 damage per hit. Deliberately rarer; reserved for specific builds and units (the Siege Crusher carries 2).

Supporting defensive/secondary stats, all data-driven per hero:

- **Shields** — a pool absorbed before armour and health; recharges after a no-damage delay. Overshield above the maximum (from Aegis effects) persists but does not recharge.
- **Slow resistance** — fraction of incoming slows ignored.
- **Attack speed multiplier** — scales every weapon's fire interval.
- **Hit invulnerability** — the post-hit protection window is now a hero stat (Marine: 0.65 s).
- **Evasive move** — duration, distance, and invulnerability remain the existing three secondary stats.
- **Weapon proficiencies** (light/medium/heavy/unique) and **mineral find %** are reserved fields: proficiencies activate when the catalogue is wide enough to matter, and mineral find stays inert until a currency loop exists.

## Weapon classification

Weapons have two separate classifications:

- **Availability:** Neutral, Hero-specific, or Unique.
- **Power tier:** Tier I, Tier II, or Tier III.

Power tier controls when complexity and build commitment enter the reward pool. It should not be implemented as a simple damage multiplier.

### Availability

#### Neutral weapons

Shared among all heroes. They form the reliable core pool and enable cross-hero build experimentation.

#### Hero-specific weapons

Appear only for a particular hero or through a rare cross-class rule. They reinforce the hero's identity and interact strongly with that hero's passive or ultimate.

#### Unique weapons

Named, run-defining weapons with mechanics that cannot be reproduced by ordinary upgrades. A particular Unique may be owned only once during a run. Unique does not automatically mean universally stronger; it should demand or create a particular build.

## Neutral weapon catalogue

| Tier | Weapon | Behaviour |
| --- | --- | --- |
| I | Bastion Service Rifle | Accurate cursor-aimed automatic rifle; baseline for tuning |
| I | Machine Pistol | Short range, rapid fire, light recoil, low individual impact |
| I | Scattergun | Wide close-range burst with strong knockback |
| I | Patrol Blade | Automatic short melee sweep from its ring position |
| I | Bolt Carbine | Slower accurate projectile that pierces one target |
| II | Arc Carbine | Lightning shot jumps to one nearby enemy |
| II | Grenade Tube | Arcing explosive round with a minimum comfortable range |
| II | Beam Cutter | Tracks the cursor with a brief sustained beam and heat limit |
| II | Guard Drone | Small weapon platform that occupies a ring slot and selects targets automatically |
| II | Cryo Projector | Short cone that builds a slowing effect rather than dealing high burst damage |
| III | Rail Lance | Long wind-up line shot with extreme penetration |
| III | Plasma Repeater | Accelerates while held, creating heat and accuracy trade-offs |
| III | Thunder Coil | Periodic radial discharge strongest when enemies crowd the player |
| III | Micro-Missile Rack | Fires salvos at marked or high-priority targets |

## Marine-specific weapon catalogue

| Tier | Weapon | Behaviour |
| --- | --- | --- |
| I | Suppression Rifle | Sustained fire builds stagger against the same target group |
| II | Bulwark Rotary Cannon | Spins up into heavy automatic fire while reducing movement slightly |
| II | Breach Launcher | Fires a close-range explosive slug that destroys armour and environmental objects |
| III | Siege Driver | Braces briefly, then fires a massive penetrating round with strong recoil |
| III | Bastion Shoulder Rack | Periodically launches a coordinated missile volley while other weapons keep firing |

## Medic-specific weapon seeds

These are recorded for future identity work and are not part of the current prototype.

| Tier | Weapon | Behaviour |
| --- | --- | --- |
| I | Injector Carbine | Damaging needles build a mark that can later trigger a restorative effect |
| II | Remedy Drone | Alternates between attacking a nearby enemy and supporting the Medic |
| II | Defibrillator Arc | Short chain-lightning burst strongest against nearby clustered targets |
| III | Bio-Reclaimer | Converts a limited portion of overkill or marked-enemy damage into recovery resources |

## Unique weapon seeds

| Weapon | Build-defining behaviour |
| --- | --- |
| Event Horizon | Slow gravitic shots pull enemies toward an implosion point before bursting |
| Nestbreaker | Deals exceptional damage to eggs, spawners, and destructible biomass; destroyed nests explode |
| Choir of Static | Every distinct lightning source adds another note to a repeating chain-lightning sequence |
| Last Light | A narrow beam grows stronger as health falls, creating a deliberate risk build |
| Echo Arsenal | Repeats the last non-Unique weapon attack at reduced strength after a delay |

## First visual samples

The first weapon art-direction review covers:

1. Bastion Service Rifle — Neutral, Tier I
2. Bulwark Rotary Cannon — Marine-specific, Tier II
3. Event Horizon — Unique

These concepts test whether Neutral, hero-specific, and Unique weapons can look related while remaining immediately distinguishable.

All three initial weapon concepts were approved on 15 July 2026 and are stored under `art/concepts/weapons/`.

## Balance still required

- Starting and maximum weapon-slot counts
- Whether extra slots are upgrades, hero traits, or run rewards
- Manual versus automatic targeting rules for each family
- Duplicate weapon rules
- Upgrade fusion or evolution rules
- How weapon tier affects reward availability
- Audio and VFX budget at high weapon counts
- Ring layout and visibility at six to twelve weapons

## Production roster and implementation priority

Content enters production in three gates so every new asset proves a gameplay role.

### Weapon production plan

| Gate | Weapon | Class | Role being proved | Visual requirement |
| --- | --- | --- | --- | --- |
| Implemented | Bastion Service Rifle | Neutral I | Accurate automatic baseline | Existing east-facing ring sprite and rifle effect family |
| Functional placeholder | Scattergun | Neutral I | Close spread and knockback | Final wide-barrel ring sprite, pellet burst, impact fan pending Batch B |
| Functional placeholder | Arc Carbine | Neutral II | Automatic targeting and chaining | Final forked-coil sprite, bolt, chain arc, conductive hit pending Batch B |
| Web MVP | Machine Pistol | Neutral I | High cadence and short effective range | Compact silhouette and restrained muzzle effect |
| Implemented | Patrol Blade | Neutral I | Automatic nearest-target orbit-position melee sweep every 2.5 s | Batch F1 folded/ready/sweep/recovery ring poses, crescent/impact family, and cadence tile integrated |
| Implemented + Batch F2 | Bolt Carbine | Neutral I | Slow two-target piercing line projectile | Four-state long receiver, bright bolt, penetration wakes, first/terminal impacts, cadence tile |
| Implemented + Batch F4 | Grenade Tube | Neutral II | Compact projectile and area damage | Four-state drum launcher, grenade, fuse/bounce/warning family, blast and cover impact |
| Web MVP | Guard Drone | Neutral II | Autonomous targeting | Folded/deployed poses, targeting line, drone shot |
| Functional + Batch F3 | Bulwark Rotary Cannon | Marine II | Hero identity and rapid suppression; final heat trade-off pending | Approved concept converted to idle/spin/fire/heat states with reusable tracer and impact family |
| Web MVP rare | Event Horizon | Unique | Pull-and-implode build | Approved concept, gravitic projectile, pull field, implosion |
| Later | Remaining catalogue | Mixed | Expansion after MVP evidence | Generate only when its behaviour is scheduled |

The vertical slice contains three weapons total: Service Rifle, Scattergun, and Arc Carbine. The Web MVP target is nine ordinary/hero weapons plus one Unique. Twelve visible slots remain technical capacity, not the expected inventory size.

Weapon implementation precedes final art for each family. Shared data must define targeting mode, attack pattern, range, cooldown or heat, projectile/hit shape, muzzle anchor, effect IDs, audio IDs, and upgrade tags. Duplicate weapons are allowed only if copies can diverge meaningfully; otherwise a duplicate reward upgrades the owned copy.

### High-quality weapon design standard

A production-worthy weapon needs more than a different damage number. Before art production, every weapon brief must lock:

- one readable combat promise and one meaningful limitation;
- targeting mode, cadence/heat/charge behaviour, range, hit geometry, damage type, and upgrade hooks;
- ring silhouette at gameplay scale plus idle, anticipation, firing, recoil/recovery, and exceptional states;
- muzzle, projectile or trace, trail, enemy impact, cover impact, signature proc, and audio family;
- a square tile motif that remains identifiable beneath a cooldown shadow at 48–64 pixels;
- whether it belongs on the active action bar, passive cadence strip, or neither.

### First premium weapon design slate

These designs refine the approved Web MVP roster. Names remain functional until gameplay approval; art is generated only after each behaviour contract exists.

| Weapon | Combat identity and limitation | Timing/UI | Production visual brief |
| --- | --- | --- | --- |
| Machine Pistol | Mobile close-range bullet hose; blooms into poor accuracy during long bursts, then rapidly settles | Automatic, ~0.10 s shots; no cadence sweep unless overheated | Compact charcoal receiver, ivory muzzle block, burgundy grip, orange chamber ticks; tight muzzle needle, small brass-white tracers, restrained impacts; tile motif is a diagonal compact receiver with three orange cadence marks |
| Patrol Blade | Orbit-mounted mono-blade that sweeps the nearest flank; strong crowd peel but cannot hit beyond its short arc | Automatic 2.5 s sweep; passive cadence tile | Broad ivory cutting edge on a burgundy/bronze pivot, visible folded and extended poses; crescent anticipation line, clean cyan-white cut, sparks on armour; tile motif is one curved blade crossing a quarter-circle arc |
| Bolt Carbine | Slow precision bolt pierces one enemy and rewards lining targets; punishing when fired into empty space | Cursor-aimed or aim-locked 1.8 s shot; compact cadence tile | Long narrow receiver with cyan capacitor spine and ivory rails; bright core projectile, narrow penetration wake, distinct first/second impact; tile motif is a luminous bolt passing through two offset plates |
| Grenade Tube | Arcing area denial with a minimum comfortable range; excels at groups but is awkward point-blank | Automatic target selection, 4 s cycle; passive cadence tile with landing/no-target state | Short heavy drum launcher, amber range lamp, separate lobbed grenade; landing reticle, bounce tick, expanding orange/ivory blast; tile motif is a round grenade above a shallow arc |
| Guard Drone | Deploys from the ring and independently covers an exposed side; lower direct damage and vulnerable during redeploy | Automatic fire; 8 s redeploy if displaced/destroyed; passive status tile | Folded shield-like pod opening into a compact three-fin drone; cyan target ray, disciplined single shots, return trail; tile motif is a triangular drone eye inside three fins |
| Bulwark Rotary Cannon | Marine signature heavy weapon: deliberate spin-up becomes sustained suppression but reduces movement and generates heat | Hold-to-fire active weapon or automatic doctrine choice; active tile shows spin/heat rather than ordinary cooldown | Approved heavy multi-barrel silhouette with obsidian body, bronze armour collar, ivory barrel tips, orange heat vents; staged spin sparks, dense tracer rhythm, heat shimmer; tile motif is a six-barrel face with a segmented heat ring |
| Event Horizon | Unique slow gravitic orb pulls enemies inward and implodes; low frequency and dangerous if aimed where no enemies remain | Aim-and-activate, 16 s cooldown; premium active tile | Approved asymmetric gravitic weapon with cyan-violet containment core; lensing projectile, thin orbit lines, dark pull field, white-violet implosion; tile motif is a black core eclipsing a broken cyan ring |

Recommended behavior-first order is **Patrol Blade → Bolt Carbine → Grenade Tube → Bulwark Rotary Cannon → Event Horizon**. Patrol Blade proves timed melee and the passive cadence strip; Bolt Carbine proves piercing readability; Grenade Tube proves arcs and landing warnings; the Rotary Cannon proves heat/hold UI; Event Horizon then combines aiming, long cooldown, field control, and premium presentation.

### Weapon and action-tile art batch contract

Do not generate a generic icon sheet before the behavior prototypes decide which states are real. When a weapon passes its lab, produce its gameplay asset family and tile together:

- **Gameplay set:** ring weapon states plus projectile/trace and effect mini-atlas.
- **Tile set:** one canonical **128 × 128 runtime tile** for Codex, shop, loadout, hotkey, perk, consumable, status, and HUD use. Compact HUD surfaces render that same asset at 64, 48, or 36 logical pixels; do not author a lower-resolution replacement. Rarity/class frames and optional charge/disabled motifs are separate overlays. Cooldown shadows, numbers, key labels, charge pips, selection borders, and ready pulses remain code-driven.
- **Consistency:** tiles use the same material palette and signature shape as the visible ring weapon, but simplify detail and strengthen negative space for small-size recognition.
- **Review:** show tiles at 128, 96, 64, 48, and 36 pixels, with 0%, 50%, and 85% cooldown coverage, grayscale, and common colour-vision simulations before acceptance.

### Standard monster production plan

| Gate | Monster | Role | Signature pressure | Required authored states |
| --- | --- | --- | --- | --- |
| Implemented | Scuttler | Basic swarmer | Direct pursuit | Existing gait A/B × four facings, spawn, hit, death |
| Implemented | Egg Cluster | Nest object | Delayed hatch priority | Existing dormant, pulse, crack, rupture |
| Implemented | Brain Blob | Telegraph attacker | Wind-up and short lunge | Existing drift, wind-up, lunge, recovery |
| Vertical slice | Slime Spitter | Ranged area denial | Glob creates bounded slowing puddle | Production directional/state sheet, glob, target, and puddle art integrated |
| Vertical slice | Blast Mite | Kamikaze | Armed flashing tell, detonation on contact or death | Production sheet: chase gait, armed flash, detonation burst |
| Vertical slice | Warp Flanker | Teleporting harasser | Telegraphed arrival ring and materialise window | Production sheet: stalk, dissolve, arrival ring, materialise shimmer |
| Production lab | Ripper | Melee bruiser | Locked 2.55 m frontal claw cone after 0.62 s wind-up; 1.1 s punish window | Production 4 × 4 pursuit/wind-up/sweep/recovery sheet and dedicated 4 × 2 effects integrated in Batch D2 |
| Production lab | Razor Scuttler | Interceptor | 2.6–7.5 m acquisition, locked 0.48 s tell, 9.5 m/s committed dash, then punishable recovery | Production D4 directional body, warning accent, dash trail, reason-specific impacts, stagger, and defeat; exact code lane remains authoritative |
| Web MVP | Brood Tender | Support | Speeds eggs and retreats | Move, channel, interrupted, hit/death |
| Later | Mireback | Mobile denial | Wide trail but slow turning | Deferred until slime coverage proves fair |

Egg Clusters remain encounter objects rather than a moving archetype. The vertical slice has three moving enemies (Scuttler, Brain Blob, Slime Spitter) plus eggs. The Web MVP adds Ripper, Razor Scuttler, and Brood Tender as encounter-budget options; not every wave uses all of them.

The functional Ripper behavior gate uses 72 health, 8 armour, 1.7 m/s pursuit, low contact damage, and an 18-damage frontal sweep. Direction locks when the tell begins, allowing the Marine to dodge behind or beyond the cone. The Ripper remains stationary through its active sweep and recovery, creating a deliberate damage window. It stays out of normal waves until its review lab passes gameplay-scale readability.

The Razor Scuttler behavior gate uses 16 health and fast 3.35 m/s positioning but deals no ordinary contact damage. It can begin a dash only from 2.6–7.5 metres, locks one lane through a 0.48-second warning, then commits at 9.5 m/s for at most 0.55 seconds. A dash deals one impact only. Hitting the Marine, crashing into walls/cover, or missing produces a stationary recovery; cover crashes create the longest punish window. Production Batch D4 now supplies directional pursuit, wind-up, dash, and recovery frames plus authored warning, launch, trail, player-hit, cover-crash, miss-skid, stagger, and defeat effects. It remains excluded from ordinary waves until the production lab passes timing and lane-readability review.

Projectile-enemy coverage currently exists through the Slime Spitter: it fires a visible hostile glob that can strike the Marine or cover and produces a bounded puddle. Future ranged enemies must receive separate projectile, warning, impact, and optional trail sprites; do not bake shots into body frames. **Codex asset note:** when a new projectile enemy is implemented, queue its body sheet and projectile/effect mini-atlas together so gameplay never ships with an invisible or generic enemy shot.

### Projectile visual contract

Projectile presentation exists on both sides of combat and must stay mechanically truthful.

- **Enemy shots:** the Slime Spitter has a glob, target warning, cover/player impact, and puddle lifecycle; the Brood Warden has acid fan projectiles and impact; the Quillback has a separate rotation-neutral spike, fan accents, and distinct cover/flesh impacts. Any knife thrower must likewise ship with a readable knife projectile, throw tell, optional motion glint, cover spark, and Marine impact in the same production batch.
- **Marine weapons:** the Service Rifle has muzzle, tracer/projectile, normal/critical impact, and explosive impact; Scattergun pellets and Arc Carbine bolts/chains use distinct authored families. Each future weapon definition must name muzzle, projectile or hitscan trace, trail if needed, target impact, cover impact, and signature proc effect IDs. Hitscan weapons still need a short-lived line/tracer and endpoint response so a miss is legible.
- **Fairness:** hostile projectiles use a warmer danger outline and readable wind-up; friendly projectiles use the weapon-family palette. Projectile art never changes collision radius, speed, pierce, homing, or fan geometry, which remain simulation-owned.

### Steam-ready asset resolution contract

Every size below is a **logical runtime cell**, not the generation size. Retain a clean layered or transparent edit master at **4× each logical dimension** (for example, a 128 px tile keeps a 512 px master). Generate oversized, normalize deterministically, preserve pivots and safe padding, and downscale with nearest-neighbour sampling. A 4K display changes camera/UI scale; it does not justify scaling a 64 px source beyond its intended logical footprint.

| Asset family | Canonical logical size | Retained master | Notes |
| --- | ---: | ---: | --- |
| Codex, shop, loadout, perk, hotkey, consumable, status, and HUD tile | **128 × 128** | 512 × 512 | One source for every surface; compact HUD draws it at 36–64 px. No text, cooldown, binding, rarity, or timer baked in |
| Ring weapon state | 128 × 128 | 512 × 512 | Use 160–192 only for intentionally oversized Heavy/Unique silhouettes; stable muzzle and pivot anchors across states |
| Standard bullet/tracer or knife | 32 × 32 or 64 × 32 | 128 × 128 or 256 × 128 | Keep long traces in a rectangular cell; rotation-neutral projectile art is preferred |
| Distinct energy bolt, glob, shard, or turret round | 64 × 64 | 256 × 256 | Includes readable core and team-colour/danger edge; collision stays smaller and code-owned |
| Grenade, rocket, mine, heavy or boss projectile | 96 × 96; boss signature 128 × 128 | 384 × 384; 512 × 512 | Preserve empty padding so rotation and trails do not clip |
| Muzzle, trail segment, hit, cover impact | 64 × 64 standard; 96 × 96 signature | 256 × 256; 384 × 384 | Boss/arena impacts may use 128–192 px, split into overlays when possible |
| Turret or deployable | 128 × 128 | 512 × 512 | Large emplacement 160–192 px; barrel/head may be a separate rotating layer |
| Trap or world pickup | 96 × 96 small; 128 × 128 standard | 384 × 384; 512 × 512 | Arena-scale trap/hazard anchor 192 px; warning radius remains code-drawn |
| Swarmer / tiny monster | 64 × 64 | 256 × 256 | Must remain readable in packs without excessive emissive noise |
| Common monster | 96 × 96; large common 128 × 128 | 384 × 384; 512 × 512 | Prefer a shared family grid and stable ground contact |
| Elite | 128–160 px square | 512–640 px square | Requires silhouette addition and telegraph, not only scale/palette |
| Mini-boss | 192 × 192 | 768 × 768 | Separate portrait at 512 × 512; split weapons/limbs if animation benefits |
| Boss | 256 × 256; final/arena boss 320–384 px | 1024 × 1024; 1280–1536 px | Modular body, damage states, attacks, and shadows avoid wasteful giant sheets |
| Status/body overlay | 64 × 64 common; 128 px elite; 192–256 px boss | 4× logical | Prefer reusable tiled/composited flames, frost, shock, poison, and void layers |
| Telegraph/decal | 128 px local; 256 px arena-scale | 512 px; 1024 px | Geometry, fill percentage, radius, timing, and safe zone remain code-authoritative |

Atlas guidance: align cells to 16 px, group by one actor or effect family, and target 2048 × 2048 atlases for web with 4096 × 4096 allowed for the future desktop build after GPU-memory testing. Never place the entire roster in one atlas. Each manifest records logical size, master scale, pivot, muzzle/foot anchors, safe padding, filter mode, frame names, and intended draw-size range.

### Corrupted human outbreak family — promoted in Task 62

This family introduces recognisable human silhouettes corrupted by the same biomass without replacing the alien roster. Keep silhouettes tragic and threatening rather than gory; torn kit, asymmetry, black-red growth, and sick cyan infection light carry the corruption.

| Unit | Role | Core behaviour | Readability and production needs |
| --- | --- | --- | --- |
| Infected Survivor | Fast swarm common | Erratic stamina-limited sprints, brief staggered hesitation before a group rush, low health, no ranged attack | **Task 62 promoted:** six replace equal-cost Scuttlers in Wave 3; later waves rise to 8–12 without changing pursuit pressure share |
| Corrupted Marine | Ranged skirmisher | 0.72s locked tell → visible 6 m/s knife → cover/player/expiry impact → 0.65s recovery and 2.8s cooldown | **Task 62 promoted:** one replaces an equal-cost Quillback from Wave 4; late waves cap at two, with off-screen ring/chevron warnings and the global ranged-windup cap |
| Abomination | Large specialist tank | Slow shamble → locked 0.9s / 1.55m terrain-damaging slam → 1.35s vulnerable recovery → repeat cooldown | **Task 62 promoted:** first appears in Wave 7 and expedition budget 140; one to two replace equal-cost specialist packages, preserving threat and pressure shares |

**Abomination Prime Task 66D accepted gate:** the 920-health, three-flat-reduction, Toxic-resistant corrupted-human apex uses a deterministic no-immediate-repeat scheduler for a locked 1.8-metre ground slam, a breakable biomass grab, and one regenerating thrown-biomass hazard. Slam deals 4.2 base player damage and 180 terrain damage. Grab acquisition is limited to 4.6 metres with a 5.5-metre hard break; its latch deals 1.6 base damage and pulls at 1.25 m/s while dodge, cover/range loss, or 32 post-mitigation damage force exposed recovery. Throw uses a real lobbed projectile and one collision-safe 2.1-metre hazard for 4.5 seconds; landing deals 3.1 base player damage and 160 terrain damage, then the hazard deals 1.1 base damage at a 0.8-second cadence. Biomass regenerates after 5.5 seconds. Every move requires sampled player-radius escape space. Final-20% pressure changes windup/recovery timing only—not radii, damage, hazard lifetime, grab threshold, simultaneous hazards, or move count. The isolated route, standard reward/rank, ten-unit cap, owner cleanup, mobility, and Full HD/4K presentation tests pass. Production art and event audio are authorized below; random-pool promotion remains held.

Controller movement and aim use separate scaled radial dead zones: 0.18 for movement, preserving low-speed steering, and 0.25 for aim, suppressing reticle drift. Values inside the dead zone resolve to zero; the remaining magnitude is rescaled continuously to 0–1. These are input rules, not enemy tuning, and must remain testable without Phaser.

### Later biome enemy families

Elemental and malevolent entities are viable if translated into Last Bastion's science-fantasy universe rather than introduced as unrelated fantasy monsters. Each family enters through one complete biome or encounter package and remains excluded from live spawning until its behavior, counters, telegraphs, and production assets are implemented.

| Family | Standard enemies | Elite | Mini-boss/boss | Combat identity |
| --- | --- | --- | --- | --- |
| Magma breach | Cinder Grub, Magma Spitter | Obsidian Brute | Molten Behemoth | Slow lava lanes, delayed eruptions, armour that cracks under sustained damage; fire zones must be capped and visibly expire |
| Cryo incursion | Rime Skitter, Cryo Elemental | Glacier Warden | Frost Giant | Chill buildup, shard lanes, temporary ice cover, heavy telegraphed slams; ordinary chill slows but never chain-freezes the player |
| Void dominion | Null Wisp, Umbral Stalker | Dread Archon | Malevolent Archon | Marks, projectile fans, short warps, temporary vision/space pressure; avoids unavoidable darkness or control loss |
| Luminar Ascendancy | Shard Sentinel, Beam Acolyte | Aegis Warden | Radiant Sovereign | Advanced-technology alien race: rechargeable energy shields that must be broken before health damage, thin precision beam lanes with long visible charge, disciplined two- or three-unit formations; shields always show their state and never regenerate mid-fight without a readable recharge tell |
| Machine uprising | Scrap Skitterer, Turret Crawler | Sentinel Hulk | Foundry Mind | Robots/cyborgs/rogue AI: predictable mechanical patterns the player can learn exactly, deployable stationary turrets with capped count and visible arcs, armour-heavy bodies weak to Shock/Overload; a destroyed machine may leave briefly hazardous sparking wreckage but never an invisible hazard |

The Luminar Ascendancy and Machine uprising are the faction seeds for the future sector campaign described in `last-bastion-game.md` ("Sector campaign — future multi-map structure"); the Corrupted human outbreak family above is the third campaign faction that already has a full design.

### Summoners, rogue science, and machine uprising expansion

Summons are encounter pressure reserved in advance, never free extra threat. A summoner owns a finite charge count, a hard live-child cap, an interruptible or punishable creation phase, and a cleanup rule. Summoned units cannot summon again. Director tests must prove the advertised live-unit and threat ceilings still hold after every hatch or fabrication.

| Unit | Rank/role | Behavior gate | Counterplay and production hold |
| --- | --- | --- | --- |
| Nest Weaver | Alien standard/specialist summoner | Mobile breeder locks a placement point, lays a destructible egg pod, then remains exposed; an egg that survives its visible countdown hatches a small fixed payload | Maximum two live pods per Weaver and one Weaver in an early encounter; eggs and offspring consume reserved threat/live slots; no chain spawning; art requires carry, lay, exhausted recovery, egg countdown, hatch, interrupted hatch, and defeat states only after route/cap tests pass |
| Storm Savant | Rogue scientist ranged specialist | Experimental coil and psionic technology reads as magic/lightning: it plants visible conductive nodes, locks a finite chain path, then discharges along those exact segments | Nodes are destructible, locked chains never retarget, hops and simultaneous paths are capped, cover interaction is explicit, and at least one walkable escape lane remains; line shape, node glyph, pulse cadence, and audio communicate danger without relying on cyan colour |
| Scrap Skitterer | Android common | Small predictable rush drone with a brief acceleration tell and Shock vulnerability | No death explosion by default; sparking wreck expires visibly and cannot hide under crowds |
| Arc Warden | Android ranged specialist | Charges a narrow fixed electrical lane, then fires once and repositions | Long charge, fixed aim, endpoint marker, and cover interception; never chains from the player to an unseen target |
| Cyborg Reclaimer | Cyborg support bruiser | Three finite four-health patches; deterministically walks to the most damaged eligible machine, locks a 1.25-second channel, then enters exposed recovery | Bright single encounter-wide tether; owner damage or 7.5 m separation interrupts without spending the patch; cannot heal itself, another Reclaimer, non-machines, dead/full units, mini-bosses, or bosses; never overheals |
| Foundry Fabricator | Android summoner | Three charges, two live children max; locks a 1.6s six-health pad to create one 12s drone or 16s stationary turret | Drone reserves one slot/2 threat and turret one slot/3 threat before channel; owner or pad interruption refunds exactly; children cannot fabricate; owner exit safely powers down only owned children; turret locks a 0.55s code-native lane out to 9.5m and intact cover blocks its shot |

All four expansion mini-boss behavior/presentation gates now pass: **Synapse Herald**, **Assembly Prime**, **Storm Regent**, and **Abomination Prime**. Their production packages are authorized independently, but none enters the random pool until its production silhouette survives 960×540, Full HD, and 4K mixed-family review and a representative intended loadout records a readable 45–90-second fight across at least three seeded runs.

Recommended order after the Web MVP is **Magma breach → Cryo incursion → Void dominion**. Magma reuses the established hazard and armour systems, Cryo adds controlled terrain/status depth, and Void is reserved until teleport/projectile readability is proven. Each family should start with two standards and one elite; only then should its mini-boss enter the seeded pool.

### Additional pressure-archetype recommendations

| Working name | Role | Recommended behavior | Escalation | Anti-frustration rules |
| --- | --- | --- | --- | --- |
| Spinewheel — production lab | Ricochet disruptor | Locks one heading during a 0.70 s warning, curls into a spinning shell, then reflects from walls and surviving cover | Base gate rolls at 7 m/s, makes two rebounds with 15% speed loss each, then exposes a 1.50 s recovery; later encounters may raise speed and allow three or four | Production E2 body/shell/effects integrated; 0.75 s per-enemy repeat-hit lockout; never spawns already rolling beside the player; excluded from waves pending review |
| Quillback — production lab | Ranged lane controller | Locks aim during a visible charge and fires slow readable spikes | Starts with one aimed spike, graduates to three, then five across a fixed 64° arc | Production E1 body/projectile/effects integrated; wind-up/recovery increase with count; retreats inside 4.5 m and cannot charge below 4.75 m; fans never home |
| Tether Bloom — production lab | Non-damaging control plant | Clear-line acquisition within 3.5 m, locked 0.70 s warning, then a 1.15 m/s additive pull for up to 1.8 s | Later encounters may modestly raise acquisition range but never exceed the hard 5 m tether cap or extend pull duration | Production E3 body/effects integrated; player retains movement/fire; cover, 5 m separation, dodge/roll, or 28 post-mitigation damage breaks it; one reserving/controlling Bloom maximum; 3.2 s recovery |
| Burrower — design | Underground ambusher | Fights as an ordinary melee creature on the surface, but on a repeating cycle it digs in (visible dig tell), becomes untargetable, charges toward the player as a readable moving ground ripple, then erupts under a locked warning ring for area damage before resuming normal melee | Base gate: one burrow cycle roughly every 9 s with a single eruption; later encounters may shorten the cycle, speed the ripple, or add one feint stop before the real eruption — never an eruption without its locked ring | Ripple is always visible and slightly slower than the Marine's run speed so walking away works; the eruption ring locks its position ~0.7 s before impact, so a dodge or a normal walk-out escapes it; underground time is capped (~3 s) with forced surfacing at the cap; it cannot dig under boundary walls, only open floor; long post-eruption recovery is the punish window; at most one active ripple per wave until readability is proven in a crowd |

The Burrower teaches "the floor itself can attack" without unfair damage: every phase — dig-in, travel, eruption — has its own tell, and the eruption uses the same locked-position rule as the Ripper sweep and Razor Scuttler lane. Recommended entry point is the Web MVP wave pool or the first post-MVP biome, after Tether Bloom's forced-movement lessons are accepted. If the sector campaign proceeds, the Burrower is the recommended **signature unit of the Evolved Brood sector** — it gives "same faction, harder" a visibly new mechanic rather than only bigger numbers. Suggested elite: **Sink Maw** (digs a short-lived collapse zone at its eruption site that slows anyone standing in it — never a pit, never loss of control).

**Codex asset note (Burrower, art only after its behavior gate passes):** one directional body sheet covering surface pursuit, dig-in, underground-to-eruption burst, melee attack, recovery, stagger, and defeat, plus a ground-effects mini-atlas in the same batch: dig-in dust burst, looping mound/ripple trail (3–4 frames, readable against all five arena themes), eruption dirt burst, and a fading collapsed-hole decal. The eruption warning ring itself reuses the code-drawn telegraph plus the J2 radial-pulse decal; art never defines the radius. Suggested imagegen direction: a heavy chitinous digger in the established coral-and-violet alien language — broad shovel-blade foreclaws, low armoured wedge head, dirt-caked carapace ridge, hot-yellow sensory markings; silhouette must read as "digger" beside the Scuttler's "runner" and the Ripper's "bruiser".

These are stronger as complementary roles than as raw-stat variants. Recommended implementation order is **Quillback → Spinewheel → Tether Bloom**: Quillback reuses the hostile-projectile system, Spinewheel adds reusable reflection physics, and Tether Bloom comes last because forced movement needs the most careful input and accessibility testing. Suggested elites are Thorn Crown (denser but slower fan), Siege Wheel (one cover-breaking rebound and pronounced rest), and Anchor Bloom (two target candidates but still one tether per player).

### Elite monster plan

Elites retain a standard monster's role, add one mechanic, use approximately 2.5–4× durability, and should take roughly 15–30 seconds to defeat. They receive a silhouette attachment, emissive markings, one added telegraph, and a guaranteed reward; a palette swap alone is insufficient.

| Elite | Base family | Added rule | Reward |
| --- | --- | --- | --- |
| Carapace Scuttler — functional placeholder | Scuttler | Frontal armour; vulnerable rear and post-charge window | Guaranteed upgrade cache |
| Volatile Spitter | Slime Spitter | Three-glob fan with capped puddle coverage | Upgrade plus ordnance-cache chance |
| Synapse Brain | Brain Blob | Marks one delayed danger zone during wind-up | Upgrade or relic when relics are active |
| Broodguard | Egg/Brood | Shields one nearby egg until interrupted | Weapon or upgrade chest |

Only the Carapace Scuttler is required for the first elite implementation. Others enter after their base enemy is accepted.

### Mini-boss plan

Mini-bosses use bespoke silhouettes, two to four attacks, a short entrance, a boss bar, and a guaranteed high-value reward. A run selects one eligible mini-boss from a seeded pool rather than always spawning the same fight. Each boss may gain speed, damage, or one new attack at 50% health and may enter a stronger but still readable frenzy in the final 20%. The target is a 45–90 second fight.

| Mini-boss | Encounter identity | Attacks | Production gate |
| --- | --- | --- | --- |
| Siege Crusher — vertical slice | Arena-geometry breaker | Charge, claw sweep, cover shockwave; gains radial slam at 50%, faster/wider frenzy at 20% | Production art and Task 57 mobility pass integrated |
| Brood Warden — vertical-slice pool | Spawn-priority test | Egg placement, guarding cleave, acid volley; 50% swarm rush; faster/larger frenzy at 20% | Production Batch D1 and Task 57 mobility pass integrated |
| Rift Stalker | Mobility/projectile test | Warp strike, projectile fan, decoy mark; 20% chained warp | Production Batch O and Task 57 mobility pass integrated |
| Synapse Herald | Telegraph mastery | 560 HP/2 armour; exactly three locked danger zones; two-target lunge chain plus exactly one final-20% target; nearest ordinary Brain Blob link grants 45% mitigation for at most 4s/7m and breaks on invalidation | Behavior/presentation accepted; art authorized; random pool held for production silhouette and 45–90s fight gate |
| Assembly Prime | Machine-summoner mastery | 720 HP/3 flat reduction; three fully warned locked rotating lanes; three Foundry-compatible finite fabrications through a 10-health interruptible pad; maximum two owned children; one deterministic one-use recall of the lowest-lifetime owned drone; final-20% faster timing with unchanged lane/charge/child/slot/threat caps | Behavior/presentation accepted and production package authorized; pool held for production silhouette and 45–90s fight gate |
| Storm Regent | Conductive arena puzzle | Live gate: 760 HP/2 flat reduction; three finite six-health targetable nodes; one fixed cover-clipped chain with at most two hops, one destructible-node overcharge, or one locked 2.8m coil burst; every pattern requires sampled player-radius escape space; committed node destruction cancels; final-20% changes timing only | Behavior/presentation accepted and production package authorized; pool held for production silhouette and 45–90s fight gate |
| Abomination Prime | Corrupted-human apex | Live gate: 920 HP/3 reduction; locked 1.8m terrain-damaging slam; dodge/cover/range/32-damage breakable grab; one real lobbed projectile and owner-bound 2.1m/4.5s hazard with 5.5s regeneration; sampled escape space; final-20% timing only | Behavior/presentation accepted and production package authorized; pool held for production silhouette and 45–90s fight gate |

The initial random pool should grow only through fully implemented bosses, with no immediate repeat when run history is available. The eligible pool now contains all three entries: Siege Crusher, Brood Warden, and Rift Stalker (behavior gate and Production Batch O completed 19 July 2026 — cloaked stalk, decoy-mark warp pounce, rift-spike fan, close slash, final-20% chained-warp frenzy). Codex must implement and rules-test each complete move set before generating its production sprites.

Task 57 locks the shared movement contract: setup phases use deterministic range-aware orbiting instead of direct pursuit, but authored attack windups, locked directions, impact geometry, and recoveries never inherit that steering. Runtime sprite scales are Siege Crusher 1.34, Brood Warden 1.30, and Rift Stalker 1.25; these are presentation values only and must not alter collision radii or dodge lanes.

Brood Warden implementation contract: 2,700 health, 1.55 m/s base pursuit, guarding cleave at close range, a three-shot acid fan, two-egg placement capped at six live eggs, and a one-time four-add swarm rush unlocked at 50% health. Its final 20% uses shorter tells/recovery, higher movement, a wider/harder cleave, five acid shots, three eggs, and a six-add/faster rush. All attacks retain visible windups.

### Final boss plan

The Web MVP ships with one final boss: **The Bastion Eater**, a giant alien siege organism built around the game's arena and swarm identity.

1. **Breach phase:** telegraphed claw lanes and charges damage cover; exposed head nodes create damage windows.
2. **Brood phase:** the boss anchors and grows a limited number of eggs while sweeping safe lanes with biomass tendrils.
3. **Last stand:** fewer summons, faster readable combinations, and expanding breach zones; never an unavoidable full-arena attack.

The fight targets 3–5 minutes and ends the run in victory. It may unlock an Artifact for future runs, but must not award an unusable current-run item after the final fight. Required art includes a 192–256 pixel logical body, separate damageable head/node overlays, phase damage states, claw/tendril attacks, breach decals, portrait/banner, boss bar treatment, entrance, defeat, and victory-vault presentation.

The deterministic `scenario=bastion-eater` production lab now implements the three-phase contract. Breach alternates locked claw lanes and cover-breaking charges; Brood anchors for a safe-inner-ring tendril sweep and capped egg growth; Last Stand uses faster combinations and targeted breach zones without a full-arena hit. The boss's armour shutters reduce incoming damage outside recovery, while exposed-node recovery is the full-damage window. Defeat ends the encounter in victory and presents the authored vault rather than a current-run reward.

Future boss seeds such as a Mire Sovereign or Choir Mind remain names only until a second biome is justified. They are not part of the MVP art batch.

## Rewards, interactables, and run objects

| Object | Purpose | Rule | Initial scope |
| --- | --- | --- | --- |
| Weapon chest | Adds or replaces a weapon | Presents 2–3 weapon choices after combat; no unusable duplicates | Vertical slice — implemented 16 July 2026 (after waves 1 and 3; falls back to upgrades when all weapons are owned) |
| Upgrade chest | Improves the current build | Elite version guarantees higher-impact options | Vertical slice |
| Ordnance cache | Temporary combat power | Replaces ammo boxes; grants rapid cycling, explosive shots, or drone support briefly | Web MVP |
| Supply depot | Between-wave recovery decision | Choose one: heal, reroll, or repair/refresh; limited uses | Vertical slice — implemented 16 July 2026 (after waves 2 and 4: Patch Up heal, Field Armoury upgrade, or Aegis Lattice shield) |
| Supply drop | In-combat optional objective | Telegraphs landing, then requires holding or clearing a small zone | Web MVP |
| Powerup | Short-lived immediate effect | Four types maximum: Overcharge, Aegis, Magnet Pulse, Adrenaline | Web MVP after pickup timers exist |
| Collectible | Feeds an implemented economy | XP and health now; Scrap only when a same-run shop exists | As supporting system exists |
| Relic | Run-long passive modifier | One copy unless stated; changes a rule or build tag | Web MVP route rewards |
| Artifact | Named run-defining reward | One equipped; earned before the final fight from a mini-boss, rare shrine, or major event | Web MVP |
| Shrine | Explicit risk/reward choice | Shows cost and result before confirmation; one use | Web MVP route/interactable |
| Aurum Hoarder | Optional in-wave treasure creature | Rare durable scavenger tries to escape; killing it awards Scrap and a guaranteed supply cache | Post-density-gate encounter event |

Traditional ammunition is not tracked. “Ammo boxes” become **Ordnance Caches**, preserving the military fantasy without adding reload inventory bookkeeping.

### Powerup set

Implemented 16 July 2026: one seeded powerup spawns per wave from wave 2, lasts 12 seconds on the ground, and shows an active-buff timer on the HUD. Production pickup art and basic HUD icons are integrated; the next HUD pass adds the circular remaining-time component and tooltip/inspection states.

- **Overcharge:** 60% faster weapon cycling for 6 seconds; orange lightning icon.
- **Aegis:** grants a 25-point shield pool absorbed before health; cyan hexagonal icon.
- **Magnet Pulse:** attracts nearby XP and expands pickup range for 6 seconds; blue-white field icon.
- **Adrenaline:** 35% movement boost for 5 seconds without changing invulnerability duration; red chevron icon.

### Temporary kit and shrine effects

Use the same top-left timed-status contract for short powerups regardless of whether they came from a world pickup, activated kit, ordnance cache, or shrine. Source affects acquisition, not how active duration is communicated.

First proposed special kit:

- **Uranium-Core Rounds:** all equipped ring weapons deal 25% more direct weapon damage for 12 seconds. It does not multiply Bastion Barrage, ground hazards, status damage-over-time, companion damage, or environmental effects. Re-acquiring it refreshes the timer to 12 seconds rather than stacking to 50% or extending beyond 12 seconds.
- **World presentation:** sealed black-and-bronze ammunition case with three luminous chartreuse penetrator tips and a clear pickup glow. Do not use text or a realistic regulatory radiation label on the world object.
- **HUD icon:** three converging chartreuse/ivory bullet tips over a dark armour plate. The triangular grouping remains recognizable under a 75% radial shadow; the circular timer ring and number are runtime UI.
- **Feedback:** one brief weapon-ring pulse on activation, a restrained green-white tracer accent while active, and a soft final-three-second warning. Preserve each weapon's original damage-type colour so the buff does not falsely imply Toxic conversion.

Implemented 24 July 2026: Siege Loader, Phase Jacket, Hunter Optics, and Last Stand Stimulant joined the seeded field-drop rotation alongside Overcharge/Magnet Pulse/Adrenaline/Aegis (`POWERUP_WAVE_CYCLE` in `CombatSimulation.ts`), so all four kits below are now live game rules, not proposals. World/HUD art for the three not yet illustrated (Hunter Optics, Last Stand Stimulant) is still outstanding — see `item-ui-asset-production-plan.md`.

| Effect | Source | Duration | Rule | Icon motif |
| --- | --- | ---: | --- | --- |
| Uranium-Core Rounds | Special ammunition kit / ordnance cache | 12 s | +25% direct ring-weapon damage; refresh only | Three luminous penetrator tips |
| Siege Loader | Heavy ordnance kit | 10 s | Slow weapons (≥1s base cycle) fire 30% faster; no movement bonus | Bronze loader claw around a shell |
| Phase Jacket | Shrine blessing / rare pickup | 8 s | First hit is ignored, then the effect ends | Split cyan armour plate |
| Hunter Optics | Recon kit | 15 s | Elites are marked and take +15% direct weak-point damage | Amber reticle over a horned silhouette |
| Last Stand Stimulant | Emergency kit | 6 s | +25% movement and +25% firing speed; no invulnerability change | Red-white injector chevrons |

Timed effects should change a decision or create a brief power window. Avoid maintaining a large list of minor `+5%` timers that forces the player to read the HUD instead of the arena.

### First relic set

| Relic | Build effect |
| --- | --- |
| Stabiliser Gyro | Spread narrows while moving |
| Salvaged Capacitor | Every fifth non-melee attack gains a small chain arc |
| Blast Baffle | Reduced self/explosive damage; slightly larger explosions |
| Hunter's Beacon | Elites are marked earlier and take bonus damage after telegraphed misses |
| Field Lattice | Picking up health creates a short slowing pulse |
| Kinetic Greaves | Longer evasive distance but slightly longer recovery |

### First Artifact set

| Artifact | Run-defining effect |
| --- | --- |
| Event Horizon Core | Periodically turns the next projectile impact into a pull-and-implode event |
| Broodbreaker Seal | Destroyed eggs damage nearby aliens and cannot hatch during their final crack window |
| Last Bastion Protocol | At critical health, weapons brace into a tighter, faster formation; long cooldown |

### First shrine set

| Shrine | Choice |
| --- | --- |
| Shrine of Steel | Lose maximum health to gain a weapon slot or strengthen one owned weapon |
| Shrine of the Hunt | Add an elite to the next encounter for a guaranteed relic reward |
| Shrine of Echoes | Duplicate an ordinary upgrade but add a visible cooldown penalty to that effect family |

Treasure chests are reward presentation, not a separate currency. Relic fragments, Scrap, keys, and meta-currency remain disabled until their spend/use loop exists and is visible.

### Aurum Hoarder — themed treasure creature

The golden-goblin role becomes the **Aurum Hoarder**, a squat alien salvage carrier plated in scavenged brass-gold armour with an overfilled cyan credit core and supply canisters. It belongs to Last Bastion's military science-fantasy language rather than appearing as a literal fantasy goblin.

- It is an optional **treasure** encounter and never counts toward wave completion. A distinctive arrival sting, edge marker, gold-cyan shimmer, and escape bar make the opportunity readable in a crowd.
- It has roughly **4–6× the durability of a same-wave common**, moderate armour, little or no contact damage, and evasive zig-zag/flee steering. It moves quickly enough to demand pursuit but remains catchable without a movement build.
- After a short forage phase it chooses a visible exit edge. Damage breaks armour plates at thresholds and drops small partial Scrap rewards, so an escape is disappointing rather than all-or-nothing.
- A kill grants a large Scrap payout plus one guaranteed **supply cache** drawn from an explicit loot table. Gold is visual language only; do not add a second currency while Scrap already owns the shop loop.
- Maximum one per eligible wave; excluded from tutorials, boss introductions, and layouts without a safe pursuit route. Initial tuning: eligible from wave 3, 8–12% chance per ordinary wave, with run-level bad-luck protection considered only after telemetry.
- Drops are magnetized or banked at wave end so the reward cannot vanish under a despawn transition. Its loot table never contains an item the current build cannot use.
- Production family completed in Task 36: 4 × 3 directional/state body sheet at 96 px logical cells (intact forage, armour-broken forage, flee across south/north/east/west), eight-frame 64 px gold-cyan event/effect atlas, and eight 128 px Codex/shop/event/reward tiles including the supply cache. Defeat, Scrap burst, trail, and escape presentation are non-gory; timing and reward rules remain code-owned.

## Visual production batches after Batch A

### Batch B — vertical-slice combat roster

- Scattergun and Arc Carbine ring sprites, effects, projectiles, icons, and upgrade-card icons.
- Slime Spitter directional/state sheet, slime glob, impact, slowing-puddle stages, and dissolve edge.
- Carapace Scuttler elite overlay/state additions.
- Siege Crusher body, charge/sweep/recovery states, boss portrait/bar, debris shockwave, and obstacle-damage effects.

### Batch C — rewards and battlefield interaction

The gameplay-critical Batch C subset was completed on 16 July 2026: Blast Mite and Warp Flanker sheets, reward/powerup atlas, status presentation, electric-fence set, and Bastion Barrage effects are normalized and integrated.

- Completed: Weapon Chest closed/available/open/claimed states.
- Completed: Supply Depot available/active/used/disabled states.
- Completed: four powerup pickup/HUD icon pairs.
- Deferred until implemented: Relic, Artifact, and Shrine frames/icons.
- Deferred until implemented: Supply Drop descent, landed, unlocking, open, and exhausted states.

### Batch D1 — Brood Warden production set

- Completed: 128 × 128 logical body sheet, 128 × 128 boss portrait, and 64 × 64 effects atlas covering every implemented attack, tell, impact, enrage, hit, and defeat state.
- Completed: retained masters exceed four times logical size and normalize through a documented nearest-neighbour pipeline.

### Batch D2 — Ripper production set

- Completed: 4 × 4 directional/state body sheet at 96 × 96 logical cells and a dedicated 4 × 2 melee-effect atlas at 64 × 64 logical cells.
- Completed: retained ≥4× masters, prompt provenance, transparent review assets, deterministic normalization, pivots, frame maps, manifest contracts, gameplay bindings, and D2 gallery.

### Batch D3 — Bastion Eater final boss

- Completed: 12-frame 192 × 192 phase body, eight 192 × 192 closed/exposed node states, 12 boss effects, eight breach/vault objects, and a 256 × 256 portrait.
- Completed: deterministic Breach, Brood, and Last Stand behavior; locked warnings; cover damage; safe-inner-ring tendril; capped eggs; targeted breach zones; exposed-node damage windows; victory transition; gallery and review route.
- Razor Scuttler, Brood Tender, and additional elite attachments remain separate future batches gated by their own implemented behaviors.

Batch C, D1, D2, and the Bastion Eater D3 set are complete. Remaining Web MVP enemies still require behavior gates before art.

### Batch E1 — Quillback production set

- Completed: 4 × 3 directional positioning/wind-up/recovery body sheet at 96 × 96 logical cells.
- Completed: dedicated 4 × 2 atlas at 64 × 64 logical cells for the separate spike projectile, charge/fan accents, cover/flesh impacts, hit, and defeat.
- Code remains authoritative for the exact 64° fan paths and telegraph lines; generated effects must support rather than replace those fairness contracts.

## Batch G — front-end shell and expedition map asset briefs

**Status:** Design brief only — 17 July 2026. Do not generate until the screen-flow and map-generator behavior gates pass with code-native placeholders. The screen design lives in `last-bastion-game.md` ("Front-end shell and expedition structure"). All text, bindings, numbers, timers, and selection states remain code-rendered; artwork must contain no baked text. Retain ≥4× masters per the Steam-quality floor.

### Batch G1 — title, menu, and character select

| Asset | Placeholder until generated | Description for imagegen |
| --- | --- | --- |
| Title backdrop (1920 × 1080 master) | Flat navy gradient + code vignette | Lone Marine silhouette on a dark ridge, faint teal weapon-ring glow, horizon crawling with low alien silhouettes beneath ivory search beams from a distant fortified city; deep navy/charcoal sky, restrained orange alarm lights; painterly pixel-art finish matching the approved Marine palette |
| LAST BASTION logotype (transparent master) | Code-rendered bold italic text | Heavy condensed italic wordmark, ivory face with charcoal outline and teal underline sweep; separate small "SNACKPACK UNIVERSE" byline lockup; no other text |
| Menu card set (6 backgrounds, 512 × 320 masters) | Flat colour rectangles with code labels | Diagonal-cut panel faces in six family colours (navy hero card, teal, magenta, green, violet, orange) with subtle grid texture, worn edge highlights, and one corner glyph zone kept empty for code-drawn icons |
| Menu corner glyphs (6, 64 × 64) | Code shapes | Single-weight ivory glyphs: play chevron, question mark, gear, flask, medal, dropship — readable at 32 px |
| Hero dossier frame (960 × 720 master) | Code rectangle panel | Ivory-edged charcoal dossier board with teal blueprint grid, riveted corners, and clear zones for the live-assembled Marine sprite, stat bars, and passive/ultimate cards |
| Passive/ultimate/kit card icons (Entrenched, Bastion Barrage, Uranium-Core reuse) | Existing tile art + code shapes | Entrenched: boots planted on a braced hex plate; Bastion Barrage: twelve-ray radial burst over a shoulder rig; use the canonical 128 × 128 tile contract and keep it identifiable at 64/48/36 px under a 50% cooldown shadow |
| Locked-hero silhouettes (Medic + 3 slots, 256 × 512) | Darkened rectangles | Back-lit charcoal silhouettes with one teal rim light each: Medic (angular pack + injector staff), Assault (broad pauldrons), Tactician (antenna array), Scout (light hood, long optic); clearly non-final, no faces |

### Batch G2 — expedition map

| Asset | Placeholder until generated | Description for imagegen |
| --- | --- | --- |
| Starchart backdrop (2400 × 1080 master, scrolls horizontally) | Dark panel + code grid | Wide alien-terrain survey chart from orbit: navy-black ground haze, faint contour lines, biomass stains growing denser toward the right edge where the Bastion Eater nests; left edge shows the last city's light halo |
| Node medallions (8 types × 4 states, 96 × 96) | Code circles with letters | Round brass-and-ivory medallions with distinct silhouettes: crossed rifles (Combat), horned skull (Elite), large claw (Mini-boss), medical cross crate (Supply Depot), open weapon case (Weapon Cache), alien monolith (Shrine — future), question glyph (Event — future), devouring maw (Boss). States: dormant/grey, reachable/teal ring, current/pulsing ivory, cleared/dimmed with claw-mark stamp. Stamp and rings may be separate overlays |
| Route line set | Code lines | Dashed ivory route segments, a brighter teal "chosen path" variant, and a small directional chevron; tileable |
| Dropship traveler token (64 × 64, 4 frames) | Code triangle | Compact teal-and-ivory dropship seen from above with a two-frame engine flicker and a landing variant |
| Node intel card frame (320 × 180) | Code rectangle | Small charcoal intel card with ivory header bar and a torn-corner note aesthetic; body zone left empty for code text |
| Run-summary board (1200 × 800 master) | Code panel | Debrief board: charcoal field, large ivory header zone, three stat plaques, and separate victory laurel / defeat cracked-visor emblems |

### Batch G acceptance rules

- Every medallion type must be distinguishable at 48 px in grayscale and under common colour-vision simulations.
- The backdrop must not fight node readability: peak backdrop contrast stays below medallion contrast.
- Gallery route `?mode=gallery&batch=g1` / `g2` must display every asset and state before menu integration replaces placeholders.

## The tile contract (codex ⇄ game)

**Status:** Live — 17 July 2026. `last-bastion-codex.html` is the encyclopedia and the tile gallery: characters, weapons, monsters, upgrades, perks, powerups, shrines, relics, artifacts, ammo, damage types, and damage-over-time effects all render from one data set.

Every entry declares a **stable tile id** and the page renders:

```html
<img src="game-assets/tiles/<id>-v1.png" onerror="this.remove()">
```

over a procedural placeholder (glyph + family tint). **When Codex drops a real tile into `game-assets/tiles/`, the codex upgrades itself with no code change** — and the same id is what the game's character select, shop, and weapon-placement modal request. One asset, every surface.

Tile contract:

- **128 × 128 canonical runtime cell**, transparent background, centred subject with safe padding. Codex, shop, loadout, hotkey, perk, consumable, status, and HUD surfaces all request this asset and may draw it smaller.
- Nearest-neighbour normalization and retained **512 × 512 (≥4×) masters**, exactly like every other batch. Existing accepted 64/96 px production art remains valid historical output, but every future tile batch and any regenerated legacy tile uses the 128 px contract.
- **No baked text, numbers, bindings, cooldown shadows, rarity frames, or selection states** — all code-drawn overlays.
- Id prefixes: `hero-`, `wpn-`, `mon-`, `upg-`, `perk-`, `pow-`, `rel-`/`art-`, `ammo-`. The codex prints each id under its tile, so generating art is a matter of reading the page.
- One extra id: `unknown-v1.png` — the Monsterdex silhouette shown for undiscovered aliens.

Priority order for generation: heroes (7) → live weapons (7) → live monsters (12) → upgrades (12) → everything else.

## Batch I — weapon tiles, slots, and inventory UI (queued for Codex)

**Status:** I1–I3 production completed 18 July 2026. The passed tile/inventory behavior gate consumes the deterministic transparent weapon atlas, typed slot/stash/discard/merge surfaces, placement modal, and stat card. Perk/hotkey atlases, salvage-counter backdrop, and shop glyphs are gallery-integrated for their later consumers. The system is designed in `last-bastion-game.md` ("Weapon tiles, slots, and inventory"); prices and merge rules are in `wave_balance.md`. Text, numbers, bindings, cooldowns, prices, selection, and legality remain code-drawn overlays. Retained chroma masters and the reproducible normalizer live under `art/production-tests/batch-i/`.

### I1 — weapon tiles

One **128 × 128** tile per weapon. Existing 64 × 64 cadence motifs are legacy assets and should be regenerated from the new 512 px master when their family is revisited; meanwhile they may remain integrated. Each canonical tile shows the weapon's signature silhouette on a neutral plate, using the same material palette as its ring sprite so a player links tile to gun instantly.

| Tile | Motif |
| --- | --- |
| Bastion Service Rifle | Straight rifle profile, ivory rails, three orange chamber ticks |
| Machine Pistol | Compact charcoal receiver at a diagonal, burgundy grip |
| Scattergun | Wide twin-barrel face, brass shell collar |
| Patrol Blade | Curved ivory blade crossing a quarter-circle arc |
| Bolt Carbine | Luminous cyan bolt passing through two offset plates |
| Arc Carbine | Forked coil with a cyan arc leaping between tines |
| Grenade Tube | Round grenade above a shallow arc |
| Guard Drone | Triangular drone eye inside three fins |
| Bulwark Rotary Cannon | Six-barrel face with a segmented bronze heat ring |
| Event Horizon | Black core eclipsing a broken cyan ring |

### I2 — slot frames and tier treatment

| Asset | Description |
| --- | --- |
| Slot frames (5 × 112 × 112) | Empty rack frames per class, each with a distinct corner cut and colour key: **Light** teal thin frame, **Medium** ivory standard, **Heavy** bronze heavy-cornered, **Unique** violet with a broken-ring motif, **All** neutral steel with all four corner styles blended. Each needs empty / hover / legal-drop / illegal-drop / occupied variants |
| Tier borders (3 × 112 × 112 overlays) | Tier I plain steel, Tier II bronze with one notch, Tier III gold with two notches and a subtle inner glow. Overlays composite onto any tile |
| Inventory slot (112 × 112) | Smaller, dimmer stash frame — visually subordinate to rack slots |
| Discard bin (128 × 128) | Open disposal chute, 3 states: idle, hover-armed (orange), consumed |
| Merge indicator (64 × 64) | Two chevrons converging into one, plus a "merge available" pulse ring |
| Drag ghost (overlay) | Soft teal glow + drop shadow applied under a lifted tile |

### I3 — placement and shop surfaces

**Shop subset status — completed 18 July 2026:** Batch N2 supplies the live Scrap Shop's empty 1024×576 terminal panel, six canonical 128 px offer tiles, and four 128 px Scrap HUD/effect states. The larger expedition counter backdrop, placement modal, weapon stat card, sell/buy/merge glyphs, and full inventory/merge interaction remain queued for their behavior gate.

| Asset | Description |
| --- | --- |
| Placement modal frame (900 × 560) | Charcoal panel with ivory header zone, a left tile-presentation well, a right rack/inventory grid area, and a discard corner. Diagonal-cut Last Bastion styling |
| Weapon stat card (320 × 420) | Card back for the incoming weapon: art well at top, empty rows for code-drawn stats, class ribbon zone |
| Shop counter backdrop (1200 × 700) | Salvage-depot interior: crates, a scarred workbench, hanging lamps, an empty central zone for tiles |
| Sell / buy / merge glyphs (3 × 48 × 48) | Scrap coin with a down arrow; coin with an up arrow; two-into-one chevrons |

**Acceptance:** each weapon tile is identifiable at 128, 96, 64, 48, and 36 px, in grayscale, and beneath a 50% cooldown shadow; slot frames are distinguishable by silhouette alone (not colour alone) for colour-blind players; legal/illegal drop states differ in shape, not just hue.

## Batch J — new enemies and telegraph decals

**Status:** Production assets generated, normalized, manifest-locked, and integrated — 18 July 2026; creator gameplay-scale review queued. J1 supplies 52 body frames across the Swarm Scuttler and three elite families. J2 supplies 24 supporting decal frames. **All telegraph geometry remains code-drawn and authoritative** — the raster decals reinforce warnings, never define them.

### J1 — new enemy bodies

| Enemy | Sheet | Description |
| --- | --- | --- |
| **Swarm Scuttler** | 4 × 2 @ 64 × 64 | Smaller, leaner Scuttler cousin built for speed: stretched low body, four long sprinting legs, thin coral shell, hot-yellow sensory streak. Must read as *fragile and fast* beside the standard Scuttler at a glance — thinner silhouette, brighter accent |
| **Razorlord** (fast elite) | 4 × 4 @ 96 × 96 | Razor Scuttler with elongated blade-limbs, a scarred carapace crest, and violet emissive joints; pursuit / wind-up / dash / recovery rows |
| **Blightspitter** (fast elite) | 4 × 3 @ 96 × 96 | Slime Spitter with an over-sized pressurised gland sac and running posture rather than a squat one; positioning / wind-up / recovery |
| **Quillback Matriarch** (elite) | 4 × 4 @ 128 × 128 | Larger Quillback with a raised spine crown that fans open for the rain attack; positioning / crown-charge / launch / recovery |

### J2 — telegraph decal atlas (64 × 64 cells unless noted)

| Decal | Description |
| --- | --- |
| Ground-slam ring (128 × 128, 4 frames) | Hostile-warm expanding ring, filling from centre; frames show 25/50/75/100% charge |
| Rain-of-spines reticle (4 frames) | Small shrinking crosshair marking one impact point; frames = countdown |
| Rain impact burst | Spine striking ground with a dust ring |
| Sweeping-arc fill (128 × 128, 4 frames) | Arc segment filling clockwise so the safe side is legible |
| Line-beam tell (3 frames) | Thin line thickening to full width |
| Radial pulse (3 frames) | Circle outline contracting inward |
| Edge warning marker (48 × 48) | Screen-boundary chevron for off-screen attackers, with a direction notch |
| Danger fill texture (tileable) | Low-contrast hatch used inside any warning zone |

**Acceptance:** every decal must be legible under a crowd of 30+ enemies, in grayscale, and against all five arena themes; warm hostile palette only (never the player's teal/cyan family); no decal may imply a radius different from the code-driven one.

Delivered as seven stable manifest assets: `swarm-scuttler-v1`, `razorlord-v1`, `blightspitter-v1`, `quillback-matriarch-v1`, `telegraph-large-v1`, `telegraph-small-v1`, and `telegraph-danger-fill-v1`. The live renderer layers decals below the authoritative code geometry, preserves the placeholder-art switch, and maps Matriarch launch/impact events explicitly. Review frame order at `?mode=gallery&batch=j1` and `?mode=gallery&batch=j2`; review all four live bodies and active telegraphs at `?scenario=batch-j&loadout=vertical`. Retained chroma sources, transparent masters, prompt provenance, and deterministic normalization live under `art/production-tests/batch-j/`.

## Batch K — status-effect overlay animations

**Status:** Production assets generated, normalized, and integrated — 18 July 2026; creator crowd/readability review queued. Enemies (and the Marine, where statuses apply to the player) need an at-a-glance animated overlay for each active status, matching the damage-number colour language in `wave_balance.md`: **red fire, teal lightning/shock, green poison/toxic, blue slowed/frozen**. Code owns status logic, timing, and tinting; this batch supplies small looping overlay sprites drawn above the afflicted body. Each overlay must read on a 64 px enemy in a 30+ crowd and never obscure the enemy's own attack tells.

| Overlay | Loop | Description for imagegen |
| --- | --- | --- |
| **Burning (Blaze)** | 4 frames @ 48 × 48 | Small licking flame tongues with rising ember flecks, red-orange core with a warm glow edge; anchored to the body's upper half, flickering asymmetrically so it reads as fire and not a static icon |
| **Shock (Overload)** | 4 frames @ 48 × 48 | Teal-white jagged arc filaments crawling over the silhouette with brief bright pops; one frame nearly dark so the crackle strobes; pairs with the code-driven stun pose |
| **Poisoned/Toxic** | 4 frames @ 48 × 48 | Sickly green rising bubbles and a thin dripping film, slow lazy loop, clearly slower rhythm than fire so the two never read alike in grayscale |
| **Slowed/Frozen (Freeze)** | 3 frames @ 48 × 48 | Pale-blue crystalline rime creeping from the ground contact upward with tiny glinting facets; mostly static with a subtle shimmer — cold should feel *still*, opposed to fire's flicker |

Acceptance: one shared atlas with stable IDs; transparent backgrounds and clean alpha; each overlay identifiable in grayscale by motion rhythm alone (flicker / strobe / lazy bubble / near-still shimmer); scales to 96–160 px elites and bosses without redraw (render larger or tile, do not stretch blur); combined with code tint on the body sprite (warm for Blaze, desaturated blue for Freeze) rather than replacing it. Status durations, stacking, and immunity remain simulation-owned.

Delivered as the stable 4 x 4 `status-overlays-v1` atlas: Blaze frames 0-3, Overload 4-7, Corrode 8-11, Freeze 12-14, and transparent reserved frame 15. Full-resolution transparent masters, chroma provenance, prompt contracts, and deterministic normalization are retained under `art/production-tests/batch-k/`; `?mode=gallery&batch=k` previews frame order, live animation rhythm, normal-enemy scale, and elite scale.

## Batch L - Event Horizon Unique art preflight

**Status:** Art preflight generated and gallery-integrated - 18 July 2026; held from normal gameplay until the Event Horizon behavior gate passes.

The approved Event Horizon concept now has a retained production family: a four-state east-facing 96 x 96 ring weapon sheet, an eight-frame 64 x 64 gravitic projectile/effect atlas, and a 64 x 64 active tile. The frame map is ready for the behavior prototype: ready, charge, fire, recover; gravitic orb, travel wake, field seed, active field, implosion charge, implosion burst, distortion impact, ready glint; and the black-core/broken-ring tile motif.

## Batch M - Corrupted Human outbreak art preflight

**Status:** Art preflight generated and gallery-integrated - 18 July 2026; held from live spawning until the Infected Survivor, Corrupted Marine, and Abomination behavior gates pass.

The family now has retained production art for an Infected Survivor fast-swarm body, a Corrupted Marine knife-thrower body, a large Abomination elite body, and a dedicated eight-frame knife/projectile/telegraph/impact atlas. Projectile travel, throw timing, cover/player collision, stagger, slam/grab lanes, and defeat timing remain simulation-owned. The review route is `?mode=gallery&batch=m`; Abomination Prime remains a future mini-boss expansion.

The preflight is intentionally presentation-only. Aim, projectile speed, pull-field radius/strength, implosion timing, collision, damage, 16-second cooldown, and active-tile state remain unimplemented and code-authoritative when the behavior gate begins. Review at `?mode=gallery&batch=eh`; do not add the Unique to the Weapon Chest or normal waves.

## Batch H — world background themes (queued for Codex)

**Status:** Production-enabled — 19 July 2026. All five arena families now render their authored floor, boundary, obstacle, and decal atlases in combat, previewable with `?theme=bastion-standard|emberfall|toxic-bloom|void-approach|arctic-relay`. Expedition nodes supply a deterministic `worldseed` for three restrained lighting variants per world. Low-opacity decals render beneath gameplay and a neutral world-specific wash protects actor and telegraph contrast.

Per world, generate as one batch (reusing the Batch A tile contract: stable IDs, 64 px logical floor tiles, nearest-neighbour normalization, retained ≥4× masters, no baked text):

| Asset | Notes for imagegen |
| --- | --- |
| Floor atlas (6 frames) | Clean base, two subtle variants, seam, damaged panel, contamination edge — in the world's material language (ember-scorched plating, overgrown toxic biomass, void-touched stone, frost-crusted alloy) |
| Boundary atlas (8 frames) | Same silhouettes as Batch A so collision reads identically; world materials and lighting only |
| Obstacle re-dress (4 frames, optional per world) | Barricade/crate/conduit/biomass in world materials; collision footprints unchanged |
| Backdrop accent decals (4–6 sprites) | Large soft ground stains, glow pools, crack clusters laid under gameplay at low contrast |

Acceptance: enemy, projectile, pickup, and telegraph readability must beat the backdrop in every theme (peak backdrop contrast below actor contrast), verified in the gallery against the Wave 4 mixed roster. The theme pool per world is intentionally larger than one authored set so node backgrounds stay half-procedural: same world, seeded variant.

### Emberfall world-theme art preflight

**Status:** Generated, gallery-integrated, and live in expedition assignment — 19 July 2026.

The first world set now has a 3 × 2 floor atlas, 4 × 2 boundary atlas, 2 × 2 obstacle re-dress, and 3 × 2 low-contrast decal atlas. Batch A collision silhouettes and footprints remain unchanged. Review at `?mode=gallery&batch=h`; live assignment, draw order, lighting variation, and contrast washes remain code-owned.

The Toxic Bloom variant mirrors the same four contracts with dark teal alloy, muted violet growth, restrained lime bioluminescence, and six subdued underlays. It passed live mixed-roster review and is enabled; review remains at `?mode=gallery&batch=tb`.

Void Approach mirrors the contracts with void-touched slate, indigo fractures, restrained cyan light, and violet anomaly accents. It passed live mixed-roster review and is enabled; review remains at `?mode=gallery&batch=va`.

Arctic Relay mirrors the contracts with frost-crusted alloy, pale cyan ice, restrained blue relay light, and snow/ice underlays. It is enabled with a stronger neutral wash and darker terrain tint after the live contrast pass; review remains at `?mode=gallery&batch=ar`.

## Batch O — Rift Stalker production set (generated, normalized, and integrated 19 July 2026)

Reuses the mini-boss contracts proven by Siege Crusher and Brood Warden (chroma sources, ≥4× retained masters, deterministic normalization, no baked text; all timing and hit geometry stay code-owned).

| Asset | Sheet | Description for imagegen |
| --- | --- | --- |
| Body sheet | 4 × 4 @ 128 × 128 | A tall, blade-legged void-touched stalker: matte charcoal chitin split by thin violet rift-light seams, long forward-raked skull crest, four stilt legs ending in single points. Rows: cloaked stalk (semi-translucent, low posture), marked pounce wind-up (crest flares, seams brighten), committed warp strike (stretched motion silhouette), exhausted frenzy (seams overbright, posture ragged) |
| Effect atlas | 4 × 2 @ 64 × 64 | Warp-out shimmer, warp-in burst, decoy mark glyph, pounce impact, blade-slash arc, frenzy aura tick, defeat collapse, rift afterglow |
| Portrait | 128 × 128 | Head-and-crest three-quarter portrait with one violet rim light, matching the Siege Crusher/Brood Warden portrait treatment |

## Batch P — Medic hero production set (generated, normalized, and integrated 19 July 2026)

Mirrors the Marine's modular contract exactly: same base-body sheet dimensions, animation state rows, attachment points, and helmet-overlay system, so all headgear and ring weapons remain shared.

| Asset | Description for imagegen |
| --- | --- |
| Medic base-body sheet | Marine-proportioned figure in lighter composite armour, ivory panels with teal medical chevrons, angular backpack with two visible injector cylinders; identical row/state layout to the Marine sheet (idle, move, dodge, hit, defeat, all facings) |
| Medic helmet overlay | Closed visor with a horizontal teal sensor slit and a small chevron crest; aligned to the shared attachment points in every facing |
| Injector Carbine ring weapon | Slim carbine with an under-slung vial magazine glowing soft green; ready/fire/recover states at the shared 96 px ring-weapon contract |
| Portrait | 128 × 128 dossier portrait matching the Marine portrait treatment |

The retained family lives under `art/production-tests/batch-p/`: 20-frame 4×5 body and aligned helmet masters/runtime sheets, a four-state 96px Injector Carbine, eight 64px projectile/support effects, and a 128px dossier portrait. Chroma sources and transparent alpha masters are retained for future 4K reprocessing; `normalize_batch_p.py` deterministically produces the web atlases. Live review: `?mode=gallery&batch=p` or deploy the Medic from Character Select. Triage cadence, healing, shield overflow, damage, cooldown, projectile geometry, text, and HUD remain code-owned.

## Canonical perk tile completion (generated and integrated 19 July 2026)

The Task 46 refresh replaces generic Character Select motifs with seven canonical 128 × 128 tiles keyed in codex order: Veteran star/chevron, Scrapper salvage coin, Quartermaster pack grid, Fast Learner rising arrow, Gunsmith crossed hammers, Survivor heart/shield, and Pathfinder branching route. A high-resolution chroma master, transparent alpha master, deterministic normalizer, prompt provenance, and an eighth reserved transparent runtime cell live under `art/production-tests/batch-i/`. The original generic strip remains retained for provenance; live Character Select and `?mode=gallery&batch=i` use `canonical-perk-tiles-v2`. Locked-state dimming, unlock text, selection, and milestone progress remain code-owned.

## Batch G2 addendum — Shop node medallion

The expedition map's node medallion set (Batch G2) gains one entry: a **Shop node medallion** matching the existing medallion contract — circular bronze-ivory token with the salvage-terminal silhouette (counter + hanging tools) and a teal rim when reachable. No text.

## Batch Q — shop keepers and shop dressing (Quartermaster complete 19 July 2026)

The Scrap Shop stays a between-wave intermission (decision 19 July 2026). This batch gives it a face: a keeper character standing behind the existing Batch N2 salvage counter, drawn from a small pool so repeat visits feel varied. Keepers are pure presentation — prices, offers, rerolls, and legality remain code-owned — but each keeper's design should foreshadow the future speciality system.

Shared contract: each keeper is one 4-frame idle loop at **128 × 256** (chroma source, ≥4× retained master, transparent runtime extraction, no baked text), composed to sit behind the counter line of `scrap-shop-panel-v1` without covering the offer row. One optional 2-frame "transaction nod" adds acknowledgement on purchase. Palette: deep navy/charcoal clothing with one signature accent per keeper; silhouettes must stay distinct at 50% scale.

| Keeper | Future speciality | Description for imagegen |
| --- | --- | --- |
| **The Quartermaster** | General stock (default keeper) | Stocky human veteran in a worn bastion supply vest, magnetic tally board under one arm, teal service stripes; friendly but tired posture |
| **The Blacksmith** | Merge/tier services | Broad figure in a scorched apron over powered armour arms, compact forge-torch on the counter, ember-orange accent glow |
| **The Gunsmith** | Weapons | Wiry human with a jeweller's loupe headset, disassembled rifle parts laid in a neat row, brass accent |
| **VND-R** | Kits and ammo | Boxy service android with a rounded vendor-unit torso, fold-out tray arms, soft cyan face display that blinks a price glyph |
| **The Clinician** | Cyborg upgrades / augments | Tall cyborg surgeon, one chromed articulated arm, clean ivory coat, green cross-circuit accent |
| **The Medic-Sister** | Healing centre | Calm figure in Medic-adjacent ivory armour with teal chevrons (visually related to the Batch P Medic, clearly not the hero), injector cylinders racked behind |
| **The Curator** | Relics and Artifacts | Slender robed figure with a floating monocle drone, violet accent, one shrouded relic case on the counter |
| **The Fence** | Black market | Hooded reptilian-silhouetted alien in a patched long coat, glinting eyes, red accent, goods half-hidden under the counter cloth |

The Quartermaster presentation gate is live: four idle frames plus two transaction-nod frames at 128×256, with 1536×1024 chroma and alpha masters retained in `art/production-tests/batch-q/`. The remaining seven keepers stay queued until their specialty mechanics are ready; they are not blockers for the base shop.

## Batch R — destructible battlefield props (Task 55 completed 19 July 2026)

Batch R is a neutral, reusable prop family for the numeric-health terrain system. It may receive restrained world tinting at runtime, but silhouettes and material identity must survive unchanged across all five themes. The canonical atlas is `destructible-terrain-v1`: **4 columns × 7 rows, 128×128 logical cells, 28 frames**. Columns are always **intact, damaged, critical, destroyed**. Rows are always **brittle fence, cargo crate, barricade, boulder, power conduit, reinforced cover, brittle biomass**. Stable ordering is mandatory because gameplay binds by frame index.

| Row | Durability | World-space footprint | Visual state requirements |
| --- | ---: | --- | --- |
| Brittle fence | 50 | 3.0×0.55 m | intact rails; one snapped rail; mostly severed with a readable gap; low non-blocking wreckage |
| Cargo crate | 100 | 1.7×1.7 m | square sealed crate; dented corner; split panels; compact collapsed pile |
| Barricade | 240 | 3.2×0.8 m | low defensive wall; chipped face; exposed supports; breached centre with flattened ends |
| Boulder | 500 | 2.2×1.8 m | solid asymmetrical rock; first fracture; deep structural split; low rubble footprint |
| Power conduit | 500 | 1.2×2.6 m | insulated industrial unit; cracked casing; exposed dead cabling; collapsed inert chassis |
| Reinforced cover | 420 | 3.0×1.0 m | plated firing cover; armour stripped; buckled frame; clear central breach |
| Brittle biomass | 55 | 2.4×1.4 m | fibrous alien mound; torn membrane; failing core; flattened dry remains, no gore spray |

Damage-state selection is code-owned: intact at full health, damaged below 75%, critical below 35%, destroyed at 0. Art must not imply a narrower collision shape before destruction. The destroyed frame must sit below knee height and read as non-blocking; it may remain visible as decoration while collision is removed. Every row shares a bottom-centre pivot and a documented visual baseline. No cast shadow extends beyond the cell; runtime supplies the common contact shadow, hit flash, HP bar, tint, debris motion, and fade.

Supporting atlas `destructible-terrain-effects-v1` is **4×2 at 64×64**: bullet chip, melee spark, acid hiss, frost crack, explosive fracture, heavy collapse, dust settle, salvage glint. Effects are material feedback only and never define hit geometry. Bullet/melee/elemental damage may reuse one prop state; damage type must not multiply the 28-frame terrain contract.

Production package under `art/production-tests/batch-r/` must contain exact final prompts, untouched chroma sources, transparent ≥4× alpha masters, deterministic normalizer, frame map with indices/pivots/baselines, `destructible-terrain-v1-128.png`, `destructible-terrain-effects-v1-64.png`, contact-sheet QA, and a README recording generation mode and approvals. Chroma removal must leave transparent corners and no fringe. Runtime outputs use nearest-neighbour downsampling with no smoothing.

Acceptance: each state is recognisable at gameplay zoom in a mixed crowd; damaged and critical remain the same prop identity; destroyed frames cannot be mistaken for active cover; HP bars do not overlap the sprite at any footprint; no frame clips its cell; grayscale silhouettes remain distinct; and screenshots pass at internal 960×540 plus presentation 1920×1080 and 3840×2160. Add `?mode=gallery&batch=r`, asset-contract tests, gameplay binding tests, production build, and HTTP asset smoke checks. Player-damage numbers, auto-fire state, actor outlines, projectile halos, terrain HP bars, collision, and durability remain code-rendered and require no raster variants.

Batch Q2 (later, with the speciality system): one 128 × 128 speciality sign tile per keeper for the shop header, same canonical tile contract as Batch I.

Acceptance: all eight keepers read as distinct silhouettes behind the counter at gameplay scale; none of them clash with the offer tiles' readability; the Quartermaster ships first and alone is sufficient for the presentation gate.

## Production Audio Batch S — next asset priority

No additional Task 62 body, weapon, projectile, or attack atlas is required. Batch M already supplies the three Corrupted Human bodies and the Marine's knife, travel wake, throw accents, and cover/player impacts. The Abomination slam zone, Marine locked line, off-screen direction marker, collision radius, and terrain overlap remain code-native so art cannot disagree with damage.

### S1 — implemented weapon identity

**Preflight and validator implemented 22 July 2026:** the shared `manifest.json` and `ProductionAudioCatalog.ts` lock all eight stable simulation cue IDs to 24 uniquely named source assets, duration envelopes, mix priority, maximum voices, and minimum retrigger intervals. The live synth fallback obeys those anti-stacking limits. `npm run audio:validate:s1` rejects missing/unexpected masters, malformed RIFF data, non-PCM encoding, wrong channel/rate/depth, unsafe peaks, invalid duration, and discontinuous Bulwark loops. `audio/production/batch-s1/README.md` is the canonical generation, normalization, rotary-loop, and acceptance handoff. Production recordings and runtime sample binding remain pending; do not replace synthesis piecemeal before a complete family passes the checks below.

Generate dry, transient-forward **48 kHz / 24-bit WAV masters** with peak-safe normalized OGG derivatives for web and retained WAV/OGG options for Steam. Keep tails short, remove baked arena reverb, and avoid limiting that destroys layering headroom.

| Family | Required production cues |
| --- | --- |
| Service Rifle | single shot with compact mechanical tail |
| Scattergun | heavy blast plus short action clack; no long cinematic boom |
| Arc Carbine | electrical launch distinct from chain-arc impact |
| Patrol Blade | powered swing/air cut, without a guaranteed flesh hit baked in |
| Bolt Carbine | charged precision launch, separate from first/terminal impacts |
| Bulwark Rotary Cannon | spin/start, seamless sustain loop, release/end; cadence must layer without clipping |
| Grenade Tube | mechanical thump; explosion remains a separate impact cue |
| Injector Carbine | light pneumatic/energy report distinct from Service Rifle |

Use three tightly matched dry variants for every non-rotary family. Bulwark Rotary instead owns exactly one start, one sample-accurate seamless loop, and one cancellation-safe end, for **24 required masters total**. Retain mono 48 kHz / 24-bit WAV masters, then derive matching-stem OGG and MP3 runtime files only after ≤ −1 dBTP, duration, channel, loop-seam, and no-clipping checks pass. Review each family in isolation and in a 60-second maximum-density combat mix; player-hit, shield-break, boss-warning, and reward cues must remain intelligible above routine fire.

### S2 — Corrupted Human threat language

Generate Marine knife warning, throw/whoosh, cover impact, and armour/flesh impact; Abomination low windup, heavy slam, and exhausted recovery; and one restrained Survivor pack-rush cue. Warning cues must be audible but shorter/quieter than impact cues, remain identifiable in mono, and never encode timing that differs from simulation. Avoid constant individual zombie barks in six-to-eight-unit packs.

### S3 — shared feedback

Generate a small material library for flesh, armour, shield, brittle cover, reinforced cover, pickup/XP, level-up, chest/shop confirmation, player damage, and boss/reward stingers. Use two or three tightly matched variants only where repetition is frequent. UI and progression cues may be stereo; positional combat cues should remain mono-ready for future Steam spatial mixing.

### Production Asset Batch T — Nest Weaver

**Completed 22 July 2026:** Task 63's reservation, interruption, hatch, route-cap, and presentation gates pass. Batch T produced and integrated exactly three retained-master families:

- `nest-weaver-v1`: 4 columns (down, left, right, up) × 8 rows (carry idle, carry stride A, carry stride B, lay windup, lay release, exhausted recovery, hurt, defeat), 32 logical 192×192 cells. Preserve one unambiguous forward head/mandible direction, a visibly carried egg mass only in rows 1–5, empty/open forelimbs in recovery, and a bottom-centre ground pivot. Lay windup and release must not enlarge gameplay range.
- `nest-pod-v1`: 6 columns × 1 row, 128×128 cells in stable order: fresh, counting, critical, hatch-open, interrupted-collapse, destroyed. Fresh/counting/critical retain the same footprint and centre; critical damage must read through silhouette cracks as well as colour. Hatch-open is an animation state, not a collision expansion. Interrupted and destroyed must be visually distinct at 960×540.
- `nest-effects-v1`: 4 columns × 2 rows, 128×128 cells. Columns are lay secretion, hatch burst, interruption, Weaver defeat; rows are onset and dissipate. Effects may cross cell bounds only inside transparent padding and may not contain target circles, countdown marks, damage areas, text, or baked shadows.

Retain untouched generator output, clean-alpha masters, deterministic runtime derivatives, prompt/source notes, frame map, and a contact sheet. Reuse `swarm-scuttler-v1` for the hatchling initially; authorize a distinct two-row hatchling body only if 960×540 mixed-wave review shows target-priority confusion. Placement point, connecting line, countdown ring/pips, conditional health bar, reservation marker, and hatch radius stay code-native. No projectile atlas is required.

Acceptance passed at native 960×540, 1920×1080, and 3840×2160. The live route uses production Weaver facing/state frames, stable pod lifecycle states, and all four onset/dissipate effect pairs without obscuring code-owned warnings or bars. Untouched chroma output, clean-alpha masters, deterministic runtime atlases, prompts, normalizer, frame notes, and contact sheet are retained in `art/production-tests/batch-t/` for future Steam reprocessing.

Nest Weaver production audio is also authorized, after Audio Batch S1: one placement lock, one wet/mechanical lay, three sparse countdown escalation notes (not six repetitive ticks), hatch, pod destroyed/interrupted, and exhausted recovery. Every cue must map to an existing simulation event and remain mono-readable.

### Authorized visual follow-up — Storm Savant

**Authorized 22 July 2026:** deterministic placement, cover interception, node destruction, fixed-hit geometry, escape-lane, route-cap, and Full HD presentation gates pass. Produce exactly three retained-master families:

- `storm-savant-v1`: 4 columns (down, left, right, up) × 9 rows (idle, stride A, stride B, node deploy, chain charge, discharge recoil, overload collapse, hurt, defeat), 36 logical 192×192 cells. The coil/psionic apparatus must read as dangerous science rather than a wizard staff. Charge and discharge may brighten or open the apparatus but cannot enlarge the gameplay footprint. Overload must visibly collapse the silhouette in every facing.
- `storm-node-v1`: 6 columns × 1 row, 128×128 cells in stable order: deploying, idle, charged, critical, disrupted, destroyed. Charged and critical need silhouette differences independent of colour. Every live state shares one centre and collision footprint; disruption/destruction cannot resemble a still-active endpoint.
- `storm-effects-v1`: 4 columns × 2 rows, 128×128 cells. Columns are node deploy spark, Savant coil charge, discharge origin flash, overload vent; rows are onset and dissipate. Do not include lightning paths, target rails, endpoint circles, cover-stop squares, hit widths, text, baked shadows, or projectile shapes.

Retain untouched generator output, clean-alpha masters, deterministic runtime derivatives, prompt/source notes, frame map, and contact-sheet QA. The double-rail ladder, timing rungs, cover clipping, circular endpoint, square stop marker, collision, and damage remain code-native. No projectile atlas is required.

Storm Savant audio is authorized after Batch S1 and the Nest Weaver cues: node deploy, a three-stage escalating chain tell, one discharge crack, node hit, node destroyed/interruption, and overload recovery. Timing accents must follow simulation events and remain distinct in mono; do not bake the 1.15-second duration into an inflexible recording.

### Authorized visual follow-up — Scrap Skitterer

**Authorized 22 July 2026:** committed-rush collision, player/cover/miss termination, Shock weakness, harmless wreck lifetime, eight-unit cap, dedicated-route, and Full HD presentation gates pass. Produce exactly two retained-master families:

- `machine-scrap-skitterer-v1`: 4 columns (down, left, right, up) × 8 rows (idle, scuttle A, scuttle B, acceleration tell, committed rush, hard brake, hurt, defeat), 32 logical 128×128 cells. Use a low triangular android silhouette with a clearly readable forward sensor/wedge. Acceleration may compress and brighten the chassis but cannot change collision width; committed rush must lean along the facing; hard brake must throw the mass backward. Defeat ends in a compact low wreck silhouette that cannot resemble a live rushing unit.
- `machine-scrap-skitterer-effects-v1`: 4 columns × 2 rows, 128×128 cells. Columns are acceleration sparks, rush wake, cover/player impact, wreck spark; rows are onset and dissipate. Effects contain no warning rails, target arrows, damage areas, text, baked shadows, or collision outlines. The wreck-spark loop must remain sparse enough for eight simultaneous deaths and must never imply a damaging explosion.

Retain untouched generator output, clean-alpha ≥4× masters, deterministic nearest-neighbour runtime derivatives, prompt/source notes, frame map, pivots/baselines, and contact-sheet QA. Locked direction, tell/rush/brake timing, warning lane, collision, damage, Shock multiplier, wreck duration, and harmless/non-slowing rules remain code-owned. No projectile atlas is required. Do not generate Arc Warden, Reclaimer, Fabricator, turret, or Assembly Prime assets until their own behavior gates pass.

Scrap Skitterer audio is authorized after Batch S1, Nest Weaver, and Storm Savant: one restrained pack-scuttle loop, acceleration tell, rush pass, cover impact, player/armour impact, defeat clatter, and sparse wreck crackle. Cues must map to existing warning/rush/impact/wreck events, remain mono-readable, and avoid eight fully layered scuttle loops; the mixer should select or group nearby pack motion.

### Authorized visual follow-up — Arc Warden

**Authorized 22 July 2026:** fixed-aim locking, first-cover termination, single-discharge ownership, narrow player-radius geometry, Shock weakness, two-specialist cap, deterministic free/cover endpoint demonstrations, and Full HD/4K presentation gates pass. Produce exactly two retained-master families:

- `machine-arc-warden-v1`: 4 columns (down, left, right, up) × 8 rows (idle, stride A, stride B, lane charge, discharge recoil, vented recovery, hurt, defeat), 32 logical 128×128 cells. Use a disciplined rectangular android silhouette with a narrow forward emitter and two asymmetric shoulder insulators so facing survives without colour. Charge may brace/open the emitter but cannot widen the collision footprint; recovery must visibly sag or vent in every facing. Do not bake a beam, endpoint, target reticle, or cover marker into the body.
- `machine-arc-warden-effects-v1`: 4 columns × 2 rows, 128×128 cells. Columns are emitter charge, discharge-origin flash, cover/player impact spark, recovery vent; rows are onset and dissipate. No frame may include lane rails, timing rungs, a target diamond, cover square, damage width, text, baked shadow, or projectile travel shape.

Retain untouched generator output, clean-alpha ≥4× masters, deterministic nearest-neighbour runtime derivatives, prompt/source notes, frame map, pivots/baselines, and contact-sheet QA. Aim lock, beam length/width, timing, cover clipping, damage, endpoint geometry, Shock multiplier, recovery, and cooldown remain code-owned. No projectile atlas is required. Do not generate Reclaimer, Fabricator, turret, or Assembly Prime assets until their own behavior gates pass.

Arc Warden audio is authorized after Batch S1 and the previously authorized enemy cue packages: one restrained reposition servo, a three-stage charge escalation, one discharge crack, separate cover and player/armour impacts, recovery vent, and defeat shutdown. Timing accents follow existing warning/discharge events; do not bake the 1.05-second duration into an inflexible recording, and keep positional combat cues mono-readable.

### Authorized visual follow-up — Cyborg Reclaimer

**Authorized 22 July 2026:** deterministic target choice, finite patches, single-link exclusivity, live health restoration, damage/range interruption, no-overheal and forbidden-target rules, mixed-machine cap, and Full HD/4K presentation gates pass. Produce exactly two retained-master families:

- `machine-cyborg-reclaimer-v1`: 4 columns (down, left, right, up) × 9 rows (idle, stride A, stride B, target acquisition, repair channel, interrupted recoil, exhausted recovery, hurt, defeat), 36 logical 192×192 cells. Use a broad rounded cyborg silhouette combining an organic armoured torso with one unmistakably mechanical repair arm and asymmetric backpack reservoir. Acquisition points the repair arm without extending gameplay range; channel braces both feet; interruption snaps the arm/tether housing back; recovery visibly vents or slumps. Do not bake a tether, target ring, health symbol, text, or healing area into the body.
- `machine-cyborg-reclaimer-effects-v1`: 4 columns × 2 rows, 128×128 cells. Columns are tether-origin lock, repair-completion pulse, interrupted-link spark, recovery vent; rows are onset and dissipate. No frame may include the connecting tether, progress beads, target circle-plus, damage radius, health bar, numbers, baked shadow, or projectile travel shape.

Retain untouched generator output, clean-alpha ≥4× masters, deterministic nearest-neighbour runtime derivatives, prompt/source notes, frame map, pivots/baselines, and contact-sheet QA. Target eligibility, selection order, acquisition/break range, channel/recovery/cooldown timing, active-link ownership, repair amount, patch count, health mutation, interruption, and tether geometry remain code-owned. No projectile atlas is required. Do not generate Fabricator, drone, turret, Assembly Prime, or Foundry Mind art until their own behavior gates pass.

Cyborg Reclaimer audio is authorized after Batch S1 and the previously authorized enemy cue packages: one heavy servo step family, target lock, a short loopable repair-channel bed, patch completion, link interruption snap, recovery vent, hurt, and defeat shutdown. The channel bed must loop/cut cleanly so simulation interruption remains immediate; do not bake the 1.25-second duration into a fixed cue. Keep tether and interruption cues mono-readable and sparse enough for mixed-machine encounters.

### Authorized visual follow-up — Foundry Fabricator package

**Authorized 22 July 2026:** finite charges, exact slot/threat reservation and refund, destructible pad interruption, non-recursive timed children, owner cleanup, fixed turret tell/cover blocking, eight-unit mixed route, and Full HD/4K presentation gates pass. Produce exactly five retained-master families:

- `machine-foundry-fabricator-v1`: 4 columns (down, left, right, up) × 9 rows (idle, stride A, stride B, pad placement, fabrication channel, interrupted recoil, recovery vent, hurt, defeat), 36 logical 192×192 cells. Use a heavy industrial android silhouette with asymmetric manipulator arms and a visible but compact internal forge. Placement/channel poses may deploy tools without extending collision or implying a larger pad. Do not bake the pad, countdown, turret lane, child, text, or health bar into the body.
- `machine-foundry-pad-v1`: 6 columns × 1 row, 128×128 cells in stable order: deploy, early channel, mid channel, late channel, disrupted, completed. Every live state shares one low circular footprint and centre. Progress must read by silhouette/mechanical extension as well as colour; disrupted/completed frames cannot resemble a targetable live pad.
- `machine-foundry-drone-v1`: 4 columns × 7 rows (idle hover, flight A, flight B, contact attack, hurt, timed power-down, destroyed), 28 logical 128×128 cells. Preserve a small forward-pointing silhouette distinct from the lower Scrap Skitterer. Timed shutdown must fold inward without looking explosive or leaving a damaging wreck.
- `machine-foundry-turret-v1`: 4 columns × 8 rows (deploy, tracking, lane charge, fire recoil, recovery, hurt, timed power-down, destroyed), 32 logical 128×128 cells. Use a compact square base and directional barrel/emitter readable without colour. Rotation cannot enlarge collision. Do not bake warning rails, rungs, endpoint circles, range, or hit width into the body.
- `machine-foundry-effects-v1`: 4 columns × 2 rows, 128×128 cells. Columns are pad-deploy sparks, fabrication completion, interruption shatter, and turret muzzle flash; rows are onset and dissipate. No frame may contain pad countdown geometry, turret rails/rungs, target circles, damage width, projectile travel, text, health bars, or baked shadows.

Retain untouched generator output, clean-alpha ≥4× masters, deterministic nearest-neighbour runtime derivatives, prompt/source notes, frame map, pivots/baselines, and contact-sheet QA. Charges, reservations, pad HP/placement/progress, child owner/lifetime/caps, turret target lock, 0.55-second timing, 9.5m acquisition, cover blocking, damage, and warning-lane geometry remain code-owned. No projectile atlas is required. Assembly Prime and Foundry Mind artwork remains blocked until their own mini-boss behavior gates pass.

Foundry audio is authorized after Batch S1 and the previously authorized machine packages: Fabricator servo/forge idle, pad placement clamp, short loopable fabrication channel, completion stamp, owner-hit interruption, pad-destroyed interruption, drone hover/contact/power-down, turret lock escalation, single discharge, recovery servo, child destruction, Fabricator hurt, and Fabricator shutdown. Channel and warning beds must loop or cut immediately on simulation events; do not bake the 1.6-second or 0.55-second timings into fixed recordings. Prioritize the pad warning, interruption split, turret lock, and turret discharge before movement ambience.

### Authorized visual follow-up — Synapse Herald package

**Authorized 22 July 2026:** deterministic no-repeat selection, locked-target rules, exact three-zone coverage, normal/frenzy lunge counts, ordinary-Blob-only link selection and break conditions, damage mitigation, ten-unit route cap, reward/rank preservation, and Full HD/4K presentation gates pass. Produce exactly three retained-master families:

- `synapse-herald-v1`: 4 columns (down, left, right, up) × 10 rows (entrance, orbit A, orbit B, lunge windup, committed lunge, marked-zone channel, synapse-link channel, exposed recovery, hurt, defeat), 40 logical 192×192 cells. Use a tall asymmetric psychic-alien silhouette with one unmistakable forward crown/emitter and a distinct trailing mantle. Lunge and channel poses may stretch internally but cannot enlarge collision, attack range, or zone coverage. Do not bake target paths, zones, link lines, endpoint rings, text, or health bars into the body.
- `synapse-herald-effects-v1`: 4 columns × 2 rows, 128×128 cells. Columns are lunge-origin flare, marked-zone eruption, synapse-link lock, and link-break snap; rows are onset and dissipate. Effects contain no chain path, target ring, plus marker, danger-zone circumference, link tether, timing marks, damage width, text, or baked shadow.
- `synapse-herald-portrait-v1`: one clean 256×256 square portrait with the crown/emitter and asymmetric mantle readable at 64×64. Keep the face/crown inside the centre safe area and omit title text, frame, boss bar, target reticle, and background telegraph geometry.

Retain untouched generator output, clean-alpha ≥4× masters, deterministic nearest-neighbour runtime derivatives, prompt/source notes, frame map, pivots/baselines, and contact-sheet QA. The three circles and plus signs, lunge chain/path and endpoint rings, link line/target ring, target locking, hit geometry, mitigation, phase timing, off-screen warnings, and conditional boss/target health bars remain code-owned. Reuse the existing Brain Blob body; do not generate a special linked-Blob variant unless mixed-wave review proves the code-native ring insufficient. No projectile atlas is required.

Synapse Herald audio is authorized after Batch S1 and the previously authorized enemy cue packages: entrance stinger, restrained orbit movement, three-stage lunge escalation with individual dash accents, marked-zone warning and eruption, link lock, a short loopable link bed, target/range break snaps, exposed recovery, hurt, and defeat/reward stingers. Link and warning beds must cut immediately when simulation events break them; do not bake the 0.9-second entrance, 4-second link, or variable frenzy timings into fixed recordings. Prioritize lunge warnings, zone eruption, link lock/break, and recovery before movement ambience.

Random-pool promotion remains blocked until the production body/effects pass a mixed ordinary-Brain-Blob encounter at 960×540, Full HD, and 4K, and a representative intended loadout records a 45–90-second kill without unreadable no-repeat scheduler sequences. Assembly Prime's behavior and presentation gates now pass; its separately scoped production package is authorized below.

### Authorized visual follow-up — Assembly Prime package

**Authorized 22 July 2026:** deterministic no-repeat scheduling, exact Foundry-compatible reservations/refunds, targetable pad interruption, finite non-recursive child creation, same-entity recall, owner cleanup, three locked cover-blocked lane discharges, ten-unit route, mini-boss reward/rank preservation, mobility, and Full HD/4K presentation gates pass. Produce exactly four retained-master families:

- `assembly-prime-v1`: 4 columns (down, left, right, up) × 11 rows (entrance, orbit A, orbit B, lane lock, sequential lane fire/recoil, pad deploy, fabrication channel, drone recall channel, exposed recovery, hurt, defeat), 44 logical 192×192 cells. Use a broad industrial command chassis with an asymmetric forge shoulder, three distinct emitter vanes, and one articulated recall arm. Lane and channel poses may deploy internal machinery but cannot enlarge collision, lane width, fabrication range, or recall range. Do not bake pads, children, rails, timing beads, tethers, target rings, text, or health bars into the body.
- `assembly-prime-pad-v1`: 6 columns × 1 row, 128×128 cells in stable order: deploy, early channel, mid channel, late channel, disrupted, completed. It must read as a reinforced command pad distinct from the six-health Foundry pad while preserving the same low centre and collision footprint across all live states. Ten-health durability must read through silhouette armour loss as well as colour; disrupted/completed states cannot resemble a targetable live pad.
- `assembly-prime-effects-v1`: 4 columns × 2 rows, 128×128 cells. Columns are three-emitter lock origin, fabrication completion stamp, recall lock/snap, and Prime shutdown; rows are onset and dissipate. No frame may contain lane rails, timing beads, endpoints, pad progress rings, recall tether, target circle, damage width, text, health bars, or baked shadows.
- `assembly-prime-portrait-v1`: one clean 256×256 portrait with the forge shoulder, emitter vanes, and recall arm readable at 64×64. Keep the command face inside the centre safe area and omit title text, frame, boss bar, child silhouettes, and telegraph geometry.

Retain untouched generator output, clean-alpha ≥4× masters, deterministic nearest-neighbour runtime derivatives, prompt/source notes, frame map, pivots/baselines, and contact-sheet QA. Reuse `machine-foundry-drone-v1` and `machine-foundry-turret-v1`; do not create Prime-only child bodies. The three dark-backed alternating amber/cyan rails, white timing beads, cover clipping, hit width, pad target ring/tether, recall tether/ring, reservations, conditional health bars, and all phase timing remain code-owned. No projectile atlas is required.

Assembly Prime audio is authorized after Batch S1 and the previously authorized machine packages: entrance/reward stingers, restrained heavy orbit servo, three-stage lane lock escalation, three individually indexed emitter discharges, pad deploy clamp, short loopable fabrication bed, completion stamp, separate owner-hit and pad-destroyed interruption snaps, recall lock, recall pull/relaunch, exposed recovery vent, hurt, and shutdown. Reuse Foundry drone/turret movement and attack cues. Channel and warning beds must cut immediately on simulation interruption; do not bake the 1.6-second fabrication, variable lane timing, or recall duration into fixed recordings.

Random-pool promotion remains blocked until the production Prime/pad/effects pass mixed-machine review at 960×540, Full HD, and 4K and a representative intended loadout records a 45–90-second kill. The acceptance run must confirm the production body never hides a pad, child, lane origin, or recall target and that no-repeat selection remains legible across at least three seeded fights.

### Authorized visual follow-up — Storm Regent package

**Authorized 22 July 2026:** deterministic no-repeat scheduling, exactly three finite owner-bound nodes, target locking, two-hop and first-cover limits, committed-node cancellation, sampled escape space, owner cleanup, ten-unit route, reward/rank preservation, mobility, and Full HD/4K presentation gates pass. Produce exactly four retained-master families:

- `storm-regent-v1`: 4 columns (down, left, right, up) × 11 rows (entrance, orbit A, orbit B, chain lock, chain discharge, node-overcharge channel, coil charge, coil discharge, exposed recovery, hurt, defeat), 44 logical 192×192 cells. Use a tall insulated command silhouette with an asymmetric conductor crown, one grounded trailing cable, and a compact chest coil that remain readable without colour. Attack poses may energize or extend internal conductors but cannot enlarge collision, chain reach, node radius, or coil radius. Do not bake nodes, rails, endpoints, cover stops, rings, timing marks, text, or health bars into the body.
- `storm-conductive-node-v1`: 6 columns × 1 row, 128×128 cells in stable order: dormant, armed, chain relay, overcharge warning, critical, destroyed. Preserve one low circular footprint and bottom-centre pivot across every live state. The six-health critical state must read through a broken outer insulator as well as colour; destroyed cannot resemble a live target or leave a collision-sized wreck. Do not bake the 1.6-metre overcharge radius, chain direction, owner tether, countdown, or health bar into the node.
- `storm-regent-effects-v1`: 4 columns × 2 rows, 128×128 cells. Columns are chain-origin arc, node-overcharge discharge, coil-discharge flash, and node-interruption shatter; rows are onset and dissipate. Effects may reinforce impact timing but cannot contain chain rails, hop geometry, endpoint circles, amber cover stops, node/coil circumference, radial timing ticks, damage width, text, or baked shadows.
- `storm-regent-portrait-v1`: one clean 256×256 portrait with the conductor crown, grounded cable, and chest coil readable at 64×64. Keep the face and crown inside the centre safe area and omit title text, frame, boss bar, nodes, lightning paths, and telegraph geometry.

Retain untouched generator output, clean-alpha ≥4× masters, deterministic nearest-neighbour runtime derivatives, prompt/source notes, frame map, pivots/baselines, and contact-sheet QA. The dark-backed cyan chain rails, white timing beads, endpoint circles, amber cover-stop squares, node target/overcharge rings, coil ring and radial ticks, target locking, cover clipping, hit geometry, conditional node health bars, damage, and all phase timing remain code-owned. No projectile atlas is required.

Storm Regent audio is authorized after Batch S1 and the previously authorized enemy packages: entrance/reward stingers, restrained orbit transformer hum, three-stage chain-lock escalation, individually readable one-hop and two-hop discharge accents, node-overcharge warning loop and discharge, coil charge loop and burst, committed-node interruption snap, exposed-recovery grounding hiss, hurt, node destruction, and defeat. Warning/charge beds must loop or cut immediately on simulation interruption; do not bake variable frenzy timing into fixed recordings. Prioritize chain escalation/discharge, node warning/interruption, coil charge/burst, and recovery before movement ambience.

Random-pool promotion remains blocked until the production Regent/node/effects pass mixed-enemy review at 960×540, Full HD, and 4K and a representative intended loadout records a 45–90-second kill. The acceptance run must confirm the body never hides a node, relay endpoint, cover stop, or coil boundary and that all three moves remain distinguishable without relying on colour across at least three seeded fights.

### Authorized visual follow-up — Abomination Prime package

**Authorized 22 July 2026:** deterministic no-repeat scheduling, locked slam/throw targets, terrain damage, breakable forced movement, real projectile travel, finite owner-bound hazard, sampled escape space, cleanup, ten-unit route, reward/rank preservation, mobility, and Full HD/4K presentation gates pass. Produce exactly four retained-master families:

- `abomination-prime-v1`: 4 columns (down, left, right, up) × 13 rows (entrance, shamble A, shamble B, slam windup, slam impact, grab windup, grab channel, grab break recoil, biomass tear, biomass throw/release, exposed recovery, hurt, defeat), 52 logical 192×192 cells. Use a massive asymmetric corrupted-human apex silhouette, clearly larger than the base Abomination, with one regenerating biomass shoulder/arm and a readable grab limb/throw socket in every facing. Attack poses may compress or extend within the cell but cannot enlarge collision, slam radius, grab range, or throw reach. Do not bake rings, ticks, tethers, target marks, hazards, text, or health bars into the body.
- `abomination-prime-biomass-v1`: 4 columns × 2 rows, 128×128 cells in stable order. Row one is torn-chunk launch, directional flight A, directional flight B, and landing compression; row two is fresh hazard, active pulse, expiry collapse, and inert residue. Flight must read as a directional tumbling mass rather than a circular bullet; live hazard states must retain one low centre while collapse/residue cannot resemble a damaging active pool. Do not bake an arc, landing circle, damage radius, countdown, collision outline, or health bar into any frame.
- `abomination-prime-effects-v1`: 4 columns × 2 rows, 128×128 cells. Columns are slam-origin rupture, grab latch/snap, biomass tear/release, and exposed-recovery/defeat rupture; rows are onset and dissipate. Effects may reinforce event timing but cannot contain slam/throw circumferences, radial ticks, landing blocks, grab tether/target ring, projectile path, hazard boundary, damage width, text, or baked shadows.
- `abomination-prime-portrait-v1`: one clean 256×256 portrait with the asymmetrical biomass shoulder, grab limb, and corrupted face readable at 64×64. Keep the face and biomass silhouette inside the centre safe area and omit title text, frame, boss bar, projectile, hazard, target mark, and telegraph geometry.

Retain untouched generator output, clean-alpha ≥4× masters, deterministic nearest-neighbour runtime derivatives, prompt/source notes, frame map, pivots/baselines, and contact-sheet QA. The dark-backed slam circle with inward radial ticks, throw circle with eight perimeter landing blocks, grab tether/target ring, projectile trajectory/rotation, hazard radius/pulse/expiry, collision, terrain damage, forced movement, conditional health bars, and all scheduler timing remain code-owned. Reuse existing Corrupted Human ordinary bodies for route adds; no Prime-only Survivor, Marine, or base-Abomination variants are permitted.

Abomination Prime audio is authorized after Batch S1 and the previously authorized enemy packages: entrance/reward stingers, restrained heavy shamble, slam warning and impact, grab acquire, short loopable latch, distinct dodge/damage/cover-or-range break snaps, biomass tear and throw, brief flight whoosh, landing impact, hazard loop/pulse/expiry, exposed recovery, hurt, and defeat. Warning, latch, and hazard beds must loop or cut immediately on simulation interruption, owner defeat, or expiry; do not bake variable frenzy timing, 4.5-second hazard lifetime, or 5.5-second regeneration into fixed recordings. Prioritize slam warning/impact, grab lock/latch/break, and throw/landing/hazard-expiry readability before movement ambience.

Random-pool promotion remains blocked until the production Prime/biomass/effects pass mixed Corrupted Human review at 960×540, Full HD, and 4K and a representative intended loadout records a 45–90-second kill. The acceptance run must confirm the large body never hides the grab target, slam/throw signature, airborne biomass, hazard edge, cover, or ordinary-family silhouette and that all three moves remain distinguishable without relying on colour across at least three seeded fights.

## Briefs added by the 23 July 2026 plan review

These support Tasks 92 and 94 in `last-bastion-model.md`. Same rules as every batch: no baked text/numbers/bindings/rings; all timers, prices, and selection states are code-drawn; retain ≥4× masters; nearest-neighbour runtime normalization. **Generate only after the dependent behavior gate passes** — the Shrine/Event node systems (Task 94) and the transformation decision (Task 93) must be live-or-cut first.

### Audio Batch S4 — music and ambience (Task 92)

The Batch S SFX plan (S1–S3) deliberately excludes music and ambience; this batch fills that gap and is treated as a shippability requirement, not polish. Deliver loopable **OGG** web derivatives from retained lossless masters (WAV/FLAC), seamless loop points marked, −14 LUFS integrated target for music beds and −18 LUFS for ambience so combat SFX stay on top. Everything must duck cleanly under the S1–S3 cues; music never masks a boss-warning or player-hit cue. Keep loops short enough to stream on first load (≤ ~90 s bodies) and mixable — no baked-in one-shots inside a loop.

| Cue | Role | Notes |
| --- | --- | --- |
| Menu / title theme | Slow, ominous-but-hopeful synth-orchestral bed under the title and menus | One 60–90 s loop; a quieter variant for the character-select/dossier screen |
| Expedition-map theme | Sparse, tense "planning between drops" bed | One loop; lower energy than combat, reads as a breather |
| **Combat bed — adaptive two-layer** | Per-world driving loop split into a **calm layer** (low enemy pressure) and a **swarm layer** (added percussion/bass/lead) the engine crossfades on live enemy count / wave-timer pressure | Author both layers on the same grid and tempo so they sum without phase issues. One shared pair can serve all worlds initially; per-world timbre swaps (Science Wing = cold synth, Alien Hive = organic percussion, Machine Foundry = industrial metallic) are a later enrichment |
| Boss theme | Higher-stakes loop for Bastion Eater and promoted mini-bosses | One loop with a short non-looping intro sting; a faster "final phase / frenzy" variant |
| Victory sting | ~4–6 s non-looping resolve on the debrief victory board | Pairs with the code-native laurel emblem |
| Defeat sting | ~4–6 s non-looping fall on the debrief defeat board | Restrained, not comedic |
| Per-world ambience beds (×5) | Very low, non-melodic room tone under the combat bed: Science Wing hum, Logistics dull machinery, Machine Foundry forge roar, Alien Hive wet organic pulse, Surface wind | Mono-ready for future spatial mixing; must not encode combat timing |

Acceptance: the calm↔swarm crossfade is inaudible as a seam and rises/falls with pressure; music is intelligible under a 60-second maximum-density SFX mix without burying player-hit, shield-break, boss-warning, or reward cues; every loop is gapless.

### Expedition decision-node art (Task 94)

Adds the two reserved node types and their reward pool to the live map. Node medallions extend the Batch G2 contract (round brass-and-ivory, 96 × 96, four states: dormant/grey, reachable/teal ring, current/pulsing ivory, cleared/dimmed claw-stamp; distinguishable at 48 px in grayscale and under colour-vision simulation).

| Asset | Motif |
| --- | --- |
| Shrine node medallion | Alien monolith / standing stone with a single lit rune slot — reads as "bargain" not "combat" |
| Event node medallion | Question glyph over a torn survey-note corner — reads as "unknown / choose" |
| Shrine card frame (960 × 540 master) | Charcoal ritual-alcove interior with an empty central plinth zone for the code-drawn cost/result panel; restrained violet rim light. Diagonal-cut Last Bastion styling |
| Event card frame (960 × 540 master) | Charcoal field-report board, ivory header bar, torn-corner note aesthetic, empty body zone for code text and choice buttons |

### Relic and Artifact tiles (Task 94 reward pool)

Canonical **128 × 128** tile contract (`rel-`/`art-` id prefixes, transparent, centred subject, neutral plate, no rarity frame — that is a code overlay). Each must read at 128/96/64/48/36 px, in grayscale, and under a 50% shadow. Motifs follow the existing designs in "First relic set" / "First Artifact set" above.

| Tile | Motif |
| --- | --- |
| Stabiliser Gyro | Gimballed gyroscope ring, ivory rails, faint motion-blur arc |
| Salvaged Capacitor | Scarred cylindrical capacitor with a cyan arc leaping between two terminals |
| Blast Baffle | Angled vented baffle plate deflecting an orange blast wedge |
| Hunter's Beacon | Amber reticle ring over a small horned elite silhouette |
| Field Lattice | Hexagonal green-white med-lattice with a soft outward pulse ring |
| Kinetic Greaves | Armoured boot with a teal motion streak trailing the heel |
| Event Horizon Core (artifact) | Black sphere eclipsing a broken cyan accretion ring — matches the Event Horizon weapon family |
| Broodbreaker Seal (artifact) | Cracked violet egg bisected by an ivory bastion sigil |
| Last Bastion Protocol (artifact) | A tight ivory weapon-ring formation snapping inward around a red core |

Acceptance: relic/artifact tiles are silhouette-distinct from weapon tiles (no gun profiles), and each artifact tile visually ties to the run-defining effect it grants.

## Content-expansion design — 23 July 2026 (creator-directed)

Expansion brief: ~44 new events (Slay the Spire / FTL inspiration, Last Bastion twist), ~9 new artifacts, ~6 new weapons, and a Blood Market that trades HP / max HP for items and transformation. Execution phases and decisions are in `last-bastion-model.md` ("Content-expansion plan — 23 July 2026"). All events ship as pure data + tests in `EncounterEventCatalog.ts`, keep the mandatory Leave choice, and calibrate HP costs to the real 10-19 HP scale (base 10, +1/level). Cheap outcome types exist today; medium/big ones are added in Phases 2-3.

### New events (44), grouped by family

**Merchant / trade** (FTL beacons, StS Merchant)
- Black Market Fence - buy a black-market relic/artifact at a premium, or sell one.
- Weapon Smuggler - trade 2 weapons -> 1 of the next tier (`transmogrifyWeapon`; live 24 July 2026 as `event-weapon-smuggler`).
- Ammo Runner - cheap consumable kits, bulk discount.
- Scrap Broker - convert HP <-> scrap (blood-market lite).

**Shrine / altar** (StS Golden Shrine, Transmogrifier, Duplicator, Purifier, Upgrade Shrine)
- Altar of Ash - pray for scrap, or desecrate for a relic + a curse.
- Cryo Shrine - cleanse (`fullCleanse`; live 24 July 2026 as `shrine-cryo`). Scoped as "heal to full + undo any accumulated negative max-health cost" — there is no separate scar/curse/corruption state in code, so this reuses the real `maxHealthBonus` field rather than inventing one.
- Whispering Monolith - answer 3 questions, escalating risk/reward (Knowing Skull).
- Forge of the Fallen - sacrifice a weapon -> random higher-tier weapon (`transmogrifyWeapon`; live 24 July 2026 as `shrine-forge-fallen`, a 3-way weighted gamble between rotary cannon/grenade tube/arc carbine).
- Duplication Vat - copy a weapon or relic (`duplicateWeapon`/`duplicateRelic`; live 24 July 2026 as `shrine-duplication-vat`; relic duplicates have no mechanical stacking bonus yet — see `last-bastion-log.md` 24 July entry).
- Purifier Station - remove an unwanted upgrade or relic (`removeUpgrade`/`purifyRelic`; live 24 July 2026 as `shrine-purifier`, both options pay 20 scrap).
- Requisition Terminal - upgrade one weapon a tier, free.

**Rescue / survivor / NPC** (FTL distress, StS Cleric/Beggar/Dead Adventurer)
- Stranded Squad - rescue -> reward, or a trap -> ambush.
- Deserter's Cache - loot a corpse; risk reanimation ambush.
- The Field Chaplain - pay scrap to heal/purify (Cleric).
- Old Sergeant - give scrap -> a lasting blessing (Beggar).
- Trapped Engineer - free them -> weapon upgrade, or betrayal.
- Refugee Column - escort (ambush) for a relic, or wave them past.

**Machine / tech** (StS Library/Living Wall/Bonfire, FTL automated scout, Scrap Ooze)
- Rogue Server - download data: pick 1 upgrade from several (Library; `pickUpgradeFromSet`; live 24 July 2026 as `event-rogue-server`).
- Assembly Line - mass-produce a chosen consumable x3.
- Overloaded Power Grid - bleed it for scrap; risk shock damage.
- Sentry Standoff - hack / fight / flee a turret.
- Salvage Drone Swarm - fight tiny drones, scrap per kill.
- EMP Cache - disable one weapon 45s (existing weapon-station object) -> big reward.

**Void / cosmic / weird** (FTL sun hazard, StS Wheel/Falling/N'loth/Mind Bloom/Sensory Stone)
- Star's Edge - cross a hazard for a shortcut + reward, taking chip damage.
- Wheel of Fates - spin for one of six outcomes (Wheel of Change).
- The Devourer's Dream - choose a vision: fight elite / relic / heal (Mind Bloom).
- Gravity Well - lose a held item or take damage (Falling).
- Whispering Cargo - trade a relic for a random better one (N'loth; `purifyRelic` + `grantRelic` combined in one choice; live 24 July 2026 as `event-whispering-cargo`).
- Anomaly Reading - free XP / insight (Sensory Stone).

**Discovery / utility** (StS Fountain/Idol/Joust/Lab/Match-and-Keep/Wing Statue)
- Field Hospital - full heal + one cleanse (Divine Fountain).
- Golden Idol - grab treasure, spring a trap (damage/ambush).
- The Joust - bet scrap on a coin-flip duel.
- Abandoned Lab - grab 2-3 consumables.
- Supply Cache Lockout - luck minigame -> keep items (Match and Keep).
- Beacon of the Lost - heal, but pick up a curse; or leave (Wing Statue).

**Blood Market / Transformation** (StS Vampires/Face Trader + creator brief; Phase 3 — all 8 cards below live 24 July 2026)
- Blood Market - trade current HP for scrap/a relic/a random field kit. Live as `event-blood-market`; authored as a normal one-shot event, not an actual repeating map node — there is no "recurring node" mechanic in code.
- Vampire Coven - pay max HP -> lifesteal (Alien Symbiosis feeding). Live as `event-vampire-coven` (`maxHealth` cost + the existing `grantLifesteal` outcome — no path/Affinity involved, matching this doc's own note that Vampire Coven isn't a real transformation path).
- Fleshcraft Vat - pay max HP -> Alien Affinity + mutation boon. Live as `event-fleshcraft-vat` (`grantTransformationAffinity` into Alien Symbiosis's Predatory Tendrils).
- Cybernetics Bay - pay max HP or a weapon -> Cyborg Affinity + augment. Live as `event-cybernetics-bay`, two choices (Targeting Suite via max HP, Shield Lattice via a sacrificed weapon).
- The Designed Arrival - pay HP/a relic -> Cultist Affinity + doctrine (Church of the Designed Arrival). Live as `event-designed-arrival` — see "New seventh transformation path" below; this event grants the real path, not a placeholder.
- Void Rift - step through -> Void Affinity + a scar. Live as `event-void-rift` (Rift Walker's own scar, built into the choice, is the cost — no extra outcome needed).
- Super-Soldier Serum - pay scrap + HP -> Bastion Super-Soldier Affinity. Live as `event-super-soldier-serum` (Heavy Gunner).
- Mutagen Pool - bathe -> Mutagenic Affinity + random stat swing. Live as `event-mutagen-pool`, a 3-way weighted gamble across Mutagenic Evolution's three choices, reusing the existing weighted-branch engine.
- Chimera Experiment - swap one stat for another (Face Trader; `swapStat`; live 24 July 2026 as `event-chimera-experiment` — authored as a standalone event since the mechanic itself doesn't need the Blood Market infrastructure this family is otherwise gated behind).

### New seventh transformation path: Church of the Designed Arrival (24 July 2026)

The transformation system originally shipped with six paths and a test that explicitly excluded a "Church" path as future-only. The creator's call on 24 July 2026 was to build it for real rather than keep deferring it. `cultist-doctrine` joined `TransformationPathCatalog.ts` with three choices in `TransformationChoiceCatalog.ts`, all meeting the same balance-budget contract (scar ≥ 10, boon/scar ratio 1.45-2.0) as the other six paths' 18 choices:
- **Zealot** (`zealous-fervor`) - boon: +6/10/14% fire rate. Scar: -1/2/3 armour.
- **Martyr** (`martyrs-resolve`) - boon: +3/4/5 retaliation damage on taking a hit (same mechanic as Mutagenic Evolution's Reactive Organism). Scar: -10/15/20% healing received.
- **Oracle** (`oracle-sight`) - boon: +15/25/35% pickup radius. Scar: -5/8/11% max health.

`TransformationRunModifiers.ts` (new file, `dev/src/game/transformations/`) resolves whichever path is committed (3+ Affinity) into a flat modifier bag, the same shape as `RelicRunModifiers`. It is consumed in `CombatSimulation.ts` for max health, movement speed, armour, max shield, shield recharge rate, fire rate, blast radius, ultimate cooldown, healing received (regen/medkit/supply depot), pickup radius, passive regen-per-second, long/close-range damage, and heavy-weapon damage - 14 of the catalogue's 27 effect metrics. The rest (retaliation damage, nearby-kill healing, the three "received" elemental-buildup metrics - the player never takes status effects from enemies at all, so these have no hook to attach to - drone shot damage, gravity-pulse radius, telekinetic push distance, weapon spread, projectile speed, evasive distance/cooldown) are left unconsumed for now, on the same "carry now, wire later" basis over half of `RelicRunModifiers`'s own fields already use.

### New artifacts (9) - slot into RelicRunModifiers (Phase 1, cheap)

| Artifact | Effect |
| --- | --- |
| Overclock Core | Fire rate ramps as you kill, resets when you stop firing |
| Aegis Reactor | Shield recharges faster and starts sooner after damage |
| Scavenger's Manifest | Doubles Scrap gained |
| Berserker's Chip | Rising damage as health drops (max at critical) |
| Chrono Capacitor | The evasive move also refunds a short cooldown |
| Symbiote Heart | Small lifesteal on kills |
| Bastion Beacon | Revive once per run at low health |
| Null Field | Ignore the first hit of each wave |
| Warp Anchor | Taking a big hit blinks you a short distance and drops a decoy |

### New weapons (6 + Event Horizon) - behavior gates + art batches (Phase 4, art-gated)

Scoping note (24 July 2026): "behavior gates" undersold this phase. Only Railspike reuses an existing attack pattern; the other five plus Event Horizon each need a genuinely new attack-pattern subsystem that doesn't exist in `CombatSimulation.ts` today - Sawblade needs a persistent orbiting hitbox (nothing "orbits" currently), Tesla Coil needs an orbiting passive chain-zap emitter (today's chain logic only fires off a travelling projectile), Cryo Lance needs a sustained beam with tick damage (everything today is discrete per-`fireIntervalSeconds` shots), Flamethrower needs a continuous damage-over-time cone (scatter is discrete pellets, not a held cone), Seeker Swarm needs in-flight retargeting (every projectile's velocity is fixed at spawn), and Event Horizon needs an aim-and-activate charge/pull-field/implosion state machine. See `last-bastion-log.md`'s Phase 4 entries for whichever of these have since landed.

| Weapon | Class | Concept |
| --- | --- | --- |
| Railspike | Heavy (see note) | Slow charged piercing lance through a whole lane. **Behavior live 24 July 2026** as `railspike` (`weaponCatalog.ts`): reuses the existing pierce+projectile pattern (like Bolt Carbine, just slower/harder/pierces more), so no new attack-pattern engineering was needed. Classed `heavy` not `unique` — the doc's "Heavy/Unique" was ambiguous and `WeaponClass` only supports one slot; `unique` is reserved for a true one-off like Event Horizon. Held out of `WEAPON_CHEST_POOL`/Batch I tile art/production audio pending its own art and audio batches (fallback synth cue is wired; placeholder tile frame reuses the rifle's). |
| Seeker Swarm | Light | Volley of homing micro-missiles. **Behavior live 24 July 2026** as `seeker-swarm`: added a new `homingTurnRateRadiansPerSecond` stat field (default 0, so every other weapon is unaffected) and a `steerProjectileTowardNearestEnemy` step in `updateProjectiles` that turns a projectile's velocity toward whichever live enemy is nearest, capped at the stat's turn rate per second. First new attack-pattern-adjacent mechanic of Phase 4 — everything else in the catalog still fires in a straight line. Held out of `WEAPON_CHEST_POOL`/tile art/production audio pending its own art batch, same as Railspike. |
| Cryo Lance | Medium | Sustained freeze beam building Freeze. **Behavior live 24 July 2026** as `cryo-lance`: first weapon with a new `attackPattern: "beam"` — continuous per-frame tick damage in a narrow forward cone (reuses `pointInsideRipperSweep`'s cone test at a much narrower half-angle than melee), bypassing the fire-interval cooldown entirely so it ticks every held frame. Cryo damage type feeds the existing Freeze-buildup system unmodified — no new status code needed. Held out of `WEAPON_CHEST_POOL`/tile art/production audio pending its own art batch. |
| Tesla Coil | Light | Orbiting coil that arcs Shock to nearby enemies. **Behavior live 24 July 2026** as `tesla-coil`: new `attackPattern: "orbit"` — a passive, autonomous (`firesAutomatically`) emitter with no aim direction; on each interval it zaps the nearest enemy in range then arcs to further nearby enemies (up to `chainCount`), each hop at 70% of the last hop's damage, mirroring the existing travelling-projectile chain falloff. Does nothing when nothing is in range (no wasted zaps). Held out of `WEAPON_CHEST_POOL`/tile art/production audio pending its own art batch. |
| Flamethrower | Heavy | Short fire cone building Blaze. **Behavior live 24 July 2026** as `flamethrower`: reuses Cryo Lance's `attackPattern: "beam"` mechanic unchanged — the only difference is a much wider `meleeArcRadians` (0.9 vs. 0.16) and a shorter range, since a "beam" and a "cone" turned out to be the same continuous-cone-tick mechanic at different widths. Prompted a small refactor: the beam's cone half-angle moved from a fixed module constant to reading each weapon's own `meleeArcRadians` field. Held out of `WEAPON_CHEST_POOL`/tile art/production audio pending its own art batch. |
| Sawblade | Medium | Orbiting contact blade (physical). **Behavior live 24 July 2026** as `sawblade`: new `attackPattern: "orbit-blade"`. Unlike Tesla Coil's instant periodic zap, the blade is a genuinely persistent moving hitbox — a new `orbitAngleRadians` field on `EquippedWeaponState` advances every active frame, the blade's swept position is `player + orbitRadiusMetres * (cos, sin)(angle)`, and any enemy touching that specific moving point (not a cone, not player-proximity) takes continuous contact damage. Held out of `WEAPON_CHEST_POOL`/tile art/production audio pending its own art batch. |
| Event Horizon | Unique | Held preflight art - pull-and-implode gravitic field. **Behavior live 24 July 2026** as `event-horizon`, closing out Phase 4: a slow single projectile (3 m/s, 16s cooldown) that on touching an enemy or expiring skips its usual instant hit entirely and instead spawns a new `EventHorizonFieldState` — a delayed field that pulls every enemy within `pullRadiusMetres` toward its centre for `pullFieldDurationSeconds`, then implodes once for `projectileDamage` within `explosionRadiusMetres` and disappears. New `eventHorizonFields` array + `EventHorizonFieldSnapshot` on `CombatSnapshot` so it's independently renderable/testable, parallel to the existing `groundHazards`. Its Batch L art (four-state ring, 8-frame effect atlas, dedicated tile) was already produced ahead of time and is exempt from the shared Batch I weapon-tile atlas `canonicalWeaponTileFrame` maps everything else into. Being Unique class, it was never going to be in `WEAPON_CHEST_POOL` regardless — there's still no dedicated Unique-slot acquisition path in code, so for now it's reachable only via `startingWeaponIds` in dev/test contexts. |
