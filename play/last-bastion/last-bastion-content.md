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
- **Tile set:** 64 × 64 authored icon, rarity/class frame variant only when needed, and optional charge/disabled overlay motifs. Cooldown shadows, numbers, key labels, charge pips, selection borders, and ready pulses remain code-driven.
- **Consistency:** tiles use the same material palette and signature shape as the visible ring weapon, but simplify detail and strengthen negative space for small-size recognition.
- **Review:** show tiles at 64, 48, and 36 pixels, with 0%, 50%, and 85% cooldown coverage, grayscale, and common colour-vision simulations before acceptance.

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

### Corrupted human outbreak family — post-Web-MVP candidate

This family introduces recognisable human silhouettes corrupted by the same biomass without replacing the alien roster. Keep silhouettes tragic and threatening rather than gory; torn kit, asymmetry, black-red growth, and sick cyan infection light carry the corruption.

| Unit | Role | Core behaviour | Readability and production needs |
| --- | --- | --- | --- |
| Infected Survivor | Fast swarm common | Erratic short sprints, brief hesitation before a group rush, low health, no ranged attack | Two gait phases, crouched rush tell, stumble/recovery, defeat; capped pack size and spawn cadence prevent body-block walls |
| Corrupted Marine | Ranged skirmisher | Repositions around cover, raises one arm for a locked knife throw, throws a slow visible blade, then must retrieve/reform it or endure a long cooldown | Directional body states plus separate knife, hand glint, throw arc accent, cover/player impacts, and disarm/stagger; never fires from off-screen without an edge warning |
| Abomination | Large elite tank | A swollen composite humanoid assembled from several infected bodies; slow shamble, telegraphed body slam, short biomass grab lane, and a vulnerable recovery after overcommitting | Large 128–160 px body, clear limb grouping, attack tells that extend beyond the mass, cover impact, stagger, and non-gory collapse; use as an elite before any boss version |

The future **Abomination Prime** mini-boss may build on the elite only after the base Abomination is playtested. It should add one arena-scale move—such as tearing off and throwing a regenerating biomass chunk—plus phase timing and a boss portrait, rather than only increasing health and size. The thrown chunk requires its own warning, projectile, landing impact, lingering hazard state, and expiry art.

### Later biome enemy families

Elemental and malevolent entities are viable if translated into Last Bastion's science-fantasy universe rather than introduced as unrelated fantasy monsters. Each family enters through one complete biome or encounter package and remains excluded from live spawning until its behavior, counters, telegraphs, and production assets are implemented.

| Family | Standard enemies | Elite | Mini-boss/boss | Combat identity |
| --- | --- | --- | --- | --- |
| Magma breach | Cinder Grub, Magma Spitter | Obsidian Brute | Molten Behemoth | Slow lava lanes, delayed eruptions, armour that cracks under sustained damage; fire zones must be capped and visibly expire |
| Cryo incursion | Rime Skitter, Cryo Elemental | Glacier Warden | Frost Giant | Chill buildup, shard lanes, temporary ice cover, heavy telegraphed slams; ordinary chill slows but never chain-freezes the player |
| Void dominion | Null Wisp, Umbral Stalker | Dread Archon | Malevolent Archon | Marks, projectile fans, short warps, temporary vision/space pressure; avoids unavoidable darkness or control loss |

Recommended order after the Web MVP is **Magma breach → Cryo incursion → Void dominion**. Magma reuses the established hazard and armour systems, Cryo adds controlled terrain/status depth, and Void is reserved until teleport/projectile readability is proven. Each family should start with two standards and one elite; only then should its mini-boss enter the seeded pool.

### Additional pressure-archetype recommendations

| Working name | Role | Recommended behavior | Escalation | Anti-frustration rules |
| --- | --- | --- | --- | --- |
| Spinewheel — production lab | Ricochet disruptor | Locks one heading during a 0.70 s warning, curls into a spinning shell, then reflects from walls and surviving cover | Base gate rolls at 7 m/s, makes two rebounds with 15% speed loss each, then exposes a 1.50 s recovery; later encounters may raise speed and allow three or four | Production E2 body/shell/effects integrated; 0.75 s per-enemy repeat-hit lockout; never spawns already rolling beside the player; excluded from waves pending review |
| Quillback — production lab | Ranged lane controller | Locks aim during a visible charge and fires slow readable spikes | Starts with one aimed spike, graduates to three, then five across a fixed 64° arc | Production E1 body/projectile/effects integrated; wind-up/recovery increase with count; retreats inside 4.5 m and cannot charge below 4.75 m; fans never home |
| Tether Bloom — production lab | Non-damaging control plant | Clear-line acquisition within 3.5 m, locked 0.70 s warning, then a 1.15 m/s additive pull for up to 1.8 s | Later encounters may modestly raise acquisition range but never exceed the hard 5 m tether cap or extend pull duration | Production E3 body/effects integrated; player retains movement/fire; cover, 5 m separation, dodge/roll, or 28 post-mitigation damage breaks it; one reserving/controlling Bloom maximum; 3.2 s recovery |

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
| Siege Crusher — vertical slice | Arena-geometry breaker | Charge, claw sweep, cover shockwave; gains radial slam at 50%, faster/wider frenzy at 20% | Production art integrated; tuning open |
| Brood Warden — vertical-slice pool | Spawn-priority test | Egg placement, guarding cleave, acid volley; 50% swarm rush; faster/larger frenzy at 20% | Production encounter and Batch D1 art integrated; tuning review open |
| Rift Stalker | Mobility/projectile test | Warp strike, projectile fan, decoy mark; 20% chained warp | Web MVP candidate |
| Synapse Herald | Telegraph mastery | Lunge chain, marked danger zones, temporary Brain Blob link | Later pool expansion |

The initial random pool should grow only through fully implemented bosses, with no immediate repeat when run history is available. The eligible five-wave pool now contains Siege Crusher and Brood Warden; Rift Stalker remains excluded until its complete behavior and rules tests exist. Codex must implement and rules-test each complete move set before generating its production sprites.

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

Suggested timed effect families for later review:

| Effect | Source | Duration | Rule | Icon motif |
| --- | --- | ---: | --- | --- |
| Uranium-Core Rounds | Special ammunition kit / ordnance cache | 12 s | +25% direct ring-weapon damage; refresh only | Three luminous penetrator tips |
| Siege Loader | Heavy ordnance kit | 10 s | Slow weapons cycle 30% faster; no movement bonus | Bronze loader claw around a shell |
| Phase Jacket | Shrine blessing / rare pickup | 8 s | First hit is ignored, then the effect ends | Split cyan armour plate |
| Hunter Optics | Recon kit | 15 s | Elites are marked and take +15% direct weak-point damage | Amber reticle over a horned silhouette |
| Last Stand Stimulant | Emergency kit | 6 s | Movement and firing speed increase, but no invulnerability change | Red-white injector chevrons |

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
| Passive/ultimate/kit card icons (Entrenched, Bastion Barrage, Uranium-Core reuse) | Existing tile art + code shapes | Entrenched: boots planted on a braced hex plate; Bastion Barrage: twelve-ray radial burst over a shoulder rig; keep the established 64 × 64 tile language identifiable under a 50% cooldown shadow |
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

## Batch H — world background themes (queued for Codex)

**Status:** Design brief — 17 July 2026. The runtime already supports per-arena themes (`dev/src/game/rendering/arenaThemes.ts`): five seeded tint/backdrop variations over the shared Batch A floor, boundary, and obstacle atlases, previewable with `?theme=bastion-standard|emberfall|toxic-bloom|void-approach|arctic-relay`. Tints prove the pipeline; authored world sets replace them one world at a time once the expedition map assigns node themes.

Per world, generate as one batch (reusing the Batch A tile contract: stable IDs, 64 px logical floor tiles, nearest-neighbour normalization, retained ≥4× masters, no baked text):

| Asset | Notes for imagegen |
| --- | --- |
| Floor atlas (6 frames) | Clean base, two subtle variants, seam, damaged panel, contamination edge — in the world's material language (ember-scorched plating, overgrown toxic biomass, void-touched stone, frost-crusted alloy) |
| Boundary atlas (8 frames) | Same silhouettes as Batch A so collision reads identically; world materials and lighting only |
| Obstacle re-dress (4 frames, optional per world) | Barricade/crate/conduit/biomass in world materials; collision footprints unchanged |
| Backdrop accent decals (4–6 sprites) | Large soft ground stains, glow pools, crack clusters laid under gameplay at low contrast |

Acceptance: enemy, projectile, pickup, and telegraph readability must beat the backdrop in every theme (peak backdrop contrast below actor contrast), verified in the gallery against the Wave 4 mixed roster. The theme pool per world is intentionally larger than one authored set so node backgrounds stay half-procedural: same world, seeded variant.
