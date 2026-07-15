# Last Bastion content catalogue

## Status

**Version:** 0.1

**Status:** Design draft; weapon concepts approved; unbalanced

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
| Mireback | Mobile ground denial | Leaves a wider persistent trail but turns slowly | Trail coverage |
| Brood Tender | Support/spawner | Accelerates nearby egg hatching and retreats from the player | Target priority |

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
| Functional placeholder | Slime Spitter | Ranged area denial | Glob creates bounded slowing puddle | Final idle/move, aim, spit, hit/death, glob, and puddle art pending Batch B |
| Web MVP | Ripper | Melee bruiser | Long claw reach after wind-up | Move, sweep tell, active sweep, recovery, hit/death |
| Web MVP | Razor Scuttler | Interceptor | Fast commit followed by punishable miss | Fast gait, leap/charge tell, miss recovery, death |
| Web MVP | Brood Tender | Support | Speeds eggs and retreats | Move, channel, interrupted, hit/death |
| Later | Mireback | Mobile denial | Wide trail but slow turning | Deferred until slime coverage proves fair |

Egg Clusters remain encounter objects rather than a moving archetype. The vertical slice has three moving enemies (Scuttler, Brain Blob, Slime Spitter) plus eggs. The Web MVP adds Ripper, Razor Scuttler, and Brood Tender as encounter-budget options; not every wave uses all of them.

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

Mini-bosses use bespoke silhouettes, two or three attacks, a short entrance, a boss bar, and a guaranteed high-value reward. They have no more than one phase transition and target a 45–90 second fight.

| Mini-boss | Encounter identity | Attacks | Production gate |
| --- | --- | --- | --- |
| Siege Crusher | Arena-geometry breaker | Telegraph charge, broad claw sweep, debris shockwave; exposed after collision | Vertical slice |
| Brood Warden | Spawn-priority test | Places eggs, guards them, enrages briefly when a hatch is prevented | Web MVP |
| Synapse Herald | Telegraph mastery | Lunge chain, marked danger zones, temporary Brain Blob link | Web MVP or later |

Siege Crusher is the recommended first mini-boss because it reuses arena collision and damaged-obstacle work while creating a new combat rhythm.

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
| Weapon chest | Adds or replaces a weapon | Presents 2–3 weapon choices after combat; no unusable duplicates | Vertical slice |
| Upgrade chest | Improves the current build | Elite version guarantees higher-impact options | Vertical slice |
| Ordnance cache | Temporary combat power | Replaces ammo boxes; grants rapid cycling, explosive shots, or drone support briefly | Web MVP |
| Supply depot | Between-wave recovery decision | Choose one: heal, reroll, or repair/refresh; limited uses | Vertical slice signature interaction candidate |
| Supply drop | In-combat optional objective | Telegraphs landing, then requires holding or clearing a small zone | Web MVP |
| Powerup | Short-lived immediate effect | Four types maximum: Overcharge, Aegis, Magnet Pulse, Adrenaline | Web MVP after pickup timers exist |
| Collectible | Feeds an implemented economy | XP and health now; Scrap only when a same-run shop exists | As supporting system exists |
| Relic | Run-long passive modifier | One copy unless stated; changes a rule or build tag | Web MVP route rewards |
| Artifact | Named run-defining reward | One equipped; earned before the final fight from a mini-boss, rare shrine, or major event | Web MVP |
| Shrine | Explicit risk/reward choice | Shows cost and result before confirmation; one use | Web MVP route/interactable |

Traditional ammunition is not tracked. “Ammo boxes” become **Ordnance Caches**, preserving the military fantasy without adding reload inventory bookkeeping.

### Powerup set

- **Overcharge:** faster weapon cycling briefly; orange lightning icon.
- **Aegis:** absorbs one hit or grants a brief shield pool; cyan hexagonal icon.
- **Magnet Pulse:** attracts nearby XP and temporarily expands pickup range; blue-white field icon.
- **Adrenaline:** movement and evasive recovery boost without changing invulnerability duration; red chevron icon.

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

- Weapon and upgrade chest closed/open/claimed states.
- Supply depot idle/available/used/damaged states and three choice icons.
- Health pickup refinement plus four powerup pickup/HUD icons.
- Relic, Artifact, and shrine frames; six relic icons, three Artifact icons, and three shrine state sets.
- Supply-drop pod descent shadow, landed, unlocking, open, and exhausted states.

### Batch D — Web MVP enemies and final boss

- Ripper, Razor Scuttler, Brood Tender, approved elite attachments, and telegraphs/effects.
- Brood Warden if encounter testing needs a second route mini-boss.
- The Bastion Eater body layers, attack overlays, phase damage states, arena breach assets, entrance/defeat presentation, and boss reward vault.

Do not generate Batch C until the reward/interactable state model exists, or Batch D until the five-wave vertical slice and Siege Crusher fight pass their playtest gates.
