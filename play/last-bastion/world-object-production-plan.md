# Last Bastion world-object production plan

## Decision

Theme-specific obstacles, hazards, and interactables are required. Environment floors provide identity; world objects provide combat routing, cover, risk/reward, optional objectives, and room replayability. Art never owns health, collision, damage, slow strength, activation state, or rewards.

The canonical data contract is `dev/src/game/arena/WorldObjectCatalog.ts`.

## Object tiers

| Tier | Examples | Durability rule | Combat purpose |
| --- | --- | --- | --- |
| Soft destructible | webs, overgrowth, weapon racks | 60-100 HP | quickly open a lane or remove concealment |
| Standard destructible | crates, lockers, trees, ice blocks | 120-240 HP | temporary cover and resource decisions |
| Heavy destructible | walls, mounds, rocks, machinery | 300-700 HP | durable route shaping |
| Breachable mission geometry | reinforced gates | approximately 1,600 HP plus a faster interaction route | objective pressure without permanent soft-locks |
| Indestructible anchor | stargates, upgrade stations | no damage state | room objective or service identity |

High durability is not the same as indestructible. Any object that can block the only exit must have a tested interaction, alternate route, or finite breach path.

## Hazard rules

- Slime slows movement to 62% before resistance; it does not deal damage.
- Toxic pools deal 4 damage per second.
- Fire patches deal 6 damage per second.
- Lava deals 10 damage per second and must have the strongest non-red shape cue.
- Ice blocks are collision obstacles with 180 HP, not invisible slippery floor penalties.
- Normal rooms use at most one dominant persistent hazard family. Elite rooms may combine two only when safe lanes remain obvious.
- Hazards never spawn beneath the player, exits, reward drops, interaction prompts, or required objective anchors.
- Every hazard needs shape/animation cues that remain distinguishable in grayscale and common colour-vision modes.

## Interaction rules

- Gates/buttons: a button opens linked geometry; gates also retain a slow breach option where mission logic requires it.
- Monster teleporters: visible spawn cadence, interruptible two-second shutdown, 500 HP fallback, and no spawn directly on the player.
- Stargates: 2.5-second deliberate activation; never trigger on contact.
- Control panels: explicitly name the linked system and show its affected area before confirmation.
- Weapons/turrets/traps: toggles must clearly distinguish friendly, hostile, disabled, and cooldown states without colour alone.
- Cryogenic tubes: 1.5-second release and an authored preview of whether the contents are rescue, reward, or threat.
- Weapon upgrade station: the player selects one weapon; only that weapon is disabled for exactly 45 seconds. The UI shows the weapon, upgrade result, countdown, and cancellation/room-exit policy before confirmation. Never auto-select a weapon, consume the weapon permanently, or silently pause the timer.

## Placement and density gates

- Preserve at least two traversable combat routes in standard rooms.
- Critical lanes should be at least 2.5 metres wide for player, enemies, and readable projectiles.
- Keep player spawn and mandatory exits clear by at least 4 metres.
- World objects should occupy no more than roughly 20% of ordinary combat floor area before temporary enemy hazards.
- Cap each object per room using the catalog; do not scatter every allowed prop into every matching biome.
- Do not place tall silhouettes over HUD-safe screen edges or telegraph-critical boss lanes.
- Destruction must not strand pickups, invalidate navigation, or remove a required interaction target.

## Recommended production order

1. **Completed - Object Batch O1:** structural/destructible atlases for broken walls, racks, lockers, reinforced gates, boulders, mounds, trees, ice blocks, overgrowth, webs, biomass nodes, and alien crystals, each with intact/damaged/critical/destroyed states. Small rocks may reuse/scaledown the boulder row until density review proves a distinct silhouette is necessary.
2. Hazard atlas: slime, toxic, fire, lava, ice fracture, web slow, and their edge/transition frames.
3. Interaction atlas: gates, buttons, control panels, monster teleporter, stargate, turret/trap consoles, cryogenic tube, and weapon-upgrade station with idle/ready/active/disabled/completed states.
4. Theme binding and deterministic placement recipes.
5. Navigation, colour-vision, controller-interaction, maximum-density, and 45-90-second encounter reviews.

Boss-arena art remains gated. These standard-room tactical objects should be proven first because they establish cover, safe-lane, and interaction language reused by bosses.

## Object Batch O1 acceptance

- Three transparent 4x4 runtime atlases provide 48 frames at 192x192, with 384x384 retained masters.
- Every atlas uses the fixed state columns intact, damaged, critical, destroyed.
- Twelve catalog entries carry explicit asset/row bindings; the remaining catalog entries continue to use code-native or earlier fallback visuals until their batches exist.
- Source/chroma, clean-alpha masters, prompts, deterministic normalizer, runtime copies, and a contact sheet are retained under `art/production-tests/object-batch-o1/`.
- The asset gallery route is `?mode=gallery&batch=o1`.
- Next production package: Object Batch O2 persistent hazards and transition/edge language. Runtime placement and state switching remain a separate implementation gate.
