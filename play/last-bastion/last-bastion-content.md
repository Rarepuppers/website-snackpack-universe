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
