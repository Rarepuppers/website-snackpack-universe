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
| Razor Scuttler | Fragile interceptor | Very fast approach with low health and a short recovery after missing | Speed |
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
| Web MVP | Patrol Blade | Neutral I | Orbit-position melee sweep | Four readable sweep poses and crescent trail |
| Web MVP | Bolt Carbine | Neutral I | Slow piercing line projectile | Long receiver, bright bolt, penetration wake |
| Web MVP | Grenade Tube | Neutral II | Arcing area damage | Stub launcher, grenade, warning marker, blast |
| Web MVP | Guard Drone | Neutral II | Autonomous targeting | Folded/deployed poses, targeting line, drone shot |
| Web MVP | Bulwark Rotary Cannon | Marine II | Hero identity, spin-up, movement trade-off | Approved concept converted to idle/spin/fire ring states |
| Web MVP rare | Event Horizon | Unique | Pull-and-implode build | Approved concept, gravitic projectile, pull field, implosion |
| Later | Remaining catalogue | Mixed | Expansion after MVP evidence | Generate only when its behaviour is scheduled |

The vertical slice contains three weapons total: Service Rifle, Scattergun, and Arc Carbine. The Web MVP target is nine ordinary/hero weapons plus one Unique. Twelve visible slots remain technical capacity, not the expected inventory size.

Weapon implementation precedes final art for each family. Shared data must define targeting mode, attack pattern, range, cooldown or heat, projectile/hit shape, muzzle anchor, effect IDs, audio IDs, and upgrade tags. Duplicate weapons are allowed only if copies can diverge meaningfully; otherwise a duplicate reward upgrades the owned copy.

### Standard monster production plan

| Gate | Monster | Role | Signature pressure | Required authored states |
| --- | --- | --- | --- | --- |
| Implemented | Scuttler | Basic swarmer | Direct pursuit | Existing gait A/B × four facings, spawn, hit, death |
| Implemented | Egg Cluster | Nest object | Delayed hatch priority | Existing dormant, pulse, crack, rupture |
| Implemented | Brain Blob | Telegraph attacker | Wind-up and short lunge | Existing drift, wind-up, lunge, recovery |
| Vertical slice | Slime Spitter | Ranged area denial | Glob creates bounded slowing puddle | Production directional/state sheet, glob, target, and puddle art integrated |
| Vertical slice | Blast Mite | Kamikaze | Armed flashing tell, detonation on contact or death | Production sheet: chase gait, armed flash, detonation burst |
| Vertical slice | Warp Flanker | Teleporting harasser | Telegraphed arrival ring and materialise window | Production sheet: stalk, dissolve, arrival ring, materialise shimmer |
| Functional placeholder | Ripper | Melee bruiser | Locked 2.55 m frontal claw cone after 0.62 s wind-up; 1.1 s punish window | Production 4 × 4 move/wind-up/sweep/recovery sheet and dedicated effects pending Batch D2 |
| Web MVP | Razor Scuttler | Interceptor | Fast commit followed by punishable miss | Fast gait, leap/charge tell, miss recovery, death |
| Web MVP | Brood Tender | Support | Speeds eggs and retreats | Move, channel, interrupted, hit/death |
| Later | Mireback | Mobile denial | Wide trail but slow turning | Deferred until slime coverage proves fair |

Egg Clusters remain encounter objects rather than a moving archetype. The vertical slice has three moving enemies (Scuttler, Brain Blob, Slime Spitter) plus eggs. The Web MVP adds Ripper, Razor Scuttler, and Brood Tender as encounter-budget options; not every wave uses all of them.

The functional Ripper behavior gate uses 72 health, 8 armour, 1.7 m/s pursuit, low contact damage, and an 18-damage frontal sweep. Direction locks when the tell begins, allowing the Marine to dodge behind or beyond the cone. The Ripper remains stationary through its active sweep and recovery, creating a deliberate damage window. It stays out of normal waves until its review lab passes gameplay-scale readability.

Projectile-enemy coverage currently exists through the Slime Spitter: it fires a visible hostile glob that can strike the Marine or cover and produces a bounded puddle. Future ranged enemies must receive separate projectile, warning, impact, and optional trail sprites; do not bake shots into body frames. **Codex asset note:** when a new projectile enemy is implemented, queue its body sheet and projectile/effect mini-atlas together so gameplay never ships with an invisible or generic enemy shot.

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
| Spinewheel | Ricochet disruptor | Telegraphs its heading, curls into a spinning shell, then rebounds from walls and solid cover | Base version makes two rebounds; later encounters raise speed and allow three or four, followed by a longer vulnerable rest | Loses roughly 15% speed per bounce; one enemy cannot hit the same player more than once per 0.75 s; never spawns already rolling beside the player |
| Quillback | Ranged lane controller | Locks aim during a visible charge and fires slow readable spikes | Starts with one aimed spike, graduates to a three-shot fan, then a five-shot fan over a fixed 60–70° arc | Fire interval increases with projectile count; close-range firing is disabled or forces retreat; fans leave intentional dodge gaps and never silently home |
| Tether Bloom | Non-damaging control plant | Roots in place, telegraphs a tendril, then pulls a nearby player slowly for about 1.6–2 s | Later encounters modestly increase acquisition range from roughly 3.5 m toward a hard 5 m cap, not pull duration | Dodge/roll breaks the tether; dealing a defined break threshold also frees the player; only one tether may control a player; failed/broken grabs incur a long cooldown |

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

Implemented 16 July 2026 with placeholder diamond pickups: one seeded powerup spawns per wave from wave 2, lasts 12 seconds on the ground, and shows an active-buff timer on the HUD. Production pickup art and HUD icons are outstanding.

- **Overcharge:** 60% faster weapon cycling for 6 seconds; orange lightning icon.
- **Aegis:** grants a 25-point shield pool absorbed before health; cyan hexagonal icon.
- **Magnet Pulse:** attracts nearby XP and expands pickup range for 6 seconds; blue-white field icon.
- **Adrenaline:** 35% movement boost for 5 seconds without changing invulnerability duration; red chevron icon.

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

- Pending: 4 × 4 directional/state body sheet at 96 × 96 logical cells and a dedicated 4 × 2 melee-effect atlas at 64 × 64 logical cells.
- Mechanics are complete; retain ≥4× masters, prompt provenance, transparent review assets, deterministic normalization, pivots, and frame maps.

### Batch D3 — remaining Web MVP enemies and final boss

- Razor Scuttler, Brood Tender, approved elite attachments, and telegraphs/effects.
- The Bastion Eater body layers, attack overlays, phase damage states, arena breach assets, entrance/defeat presentation, and boss reward vault.

Batch C and Batch D1 are complete. Batch D2 is eligible after the Ripper behavior gate; D3 remains gated behind the vertical-slice creator playtest and placeholder final-boss implementation.
