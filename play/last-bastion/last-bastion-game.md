# Last Bastion

## Document purpose

This is the durable game design document for Last Bastion. It describes the game we are trying to make, the decisions that are currently locked, and the boundaries between the prototype, vertical slice, web MVP, and future releases.

Implementation status belongs in `last-bastion-model.md`. Detailed content lists should eventually live in data files rather than being duplicated here.

Current supporting documents:

- `last-bastion-art-bible.md` — visual rules and animation architecture
- `last-bastion-content.md` — draft enemy and weapon catalogue

## Vision

Last Bastion is a colourful top-down science-fiction action roguelite about expeditions beyond humanity's final fortified settlements.

The player chooses a soldier, enters a hostile arena, survives increasingly dangerous alien attacks, and creates a distinctive combat build from weapons and transformative upgrades. Between encounters, the player makes a small number of meaningful route and resource decisions.

The intended feeling is immediate, responsive, difficult but fair, and capable of producing a genuine "one more run" response.

## Primary game identity

Last Bastion is primarily a manual action shooter with survivor-like escalation and roguelite build choices.

- Movement and aiming are active skills.
- Positioning, dodging, target priority, and battlefield interactions matter.
- Upgrades should alter behaviour, not merely increase numbers.
- Optional auto-aim and auto-fire may be offered for accessibility and touch devices, but desktop combat is designed around manual aiming.
- The branching campaign supports the combat loop; it must not overwhelm or repeatedly interrupt it.

Base management, extensive inventory management, companions, mutations, curses, and a large campaign are future expansion systems, not prerequisites for proving the game.

## Design pillars

### Responsive combat

Movement, aiming, firing, impacts, dodging, and damage feedback must feel immediate. Graphical effects must never make controls unclear or reduce responsiveness.

### Transformative builds

Level-up choices should create recognisably different builds. Interesting examples include ricochets, piercing rounds, chain lightning, orbiting drones, explosive impacts, and a dodge that leaves a damaging decoy.

Small numerical increases may support these mechanics but should rarely be the headline reward.

### The battlefield fights back

Each polished arena should contain at least one readable interactive element. Power switches, defensive turrets, electrical fences, destructible biomass, shrines, traps, and timed objectives can turn movement into tactical decision-making.

This is the intended signature feature that differentiates Last Bastion from a generic arena-survival game.

### Fair escalation

Difficulty should rise through understandable enemy combinations, encounter budgets, arena pressure, and boss mechanics. The game should not secretly punish strong performance or rescue weak performance so aggressively that builds become impossible to evaluate.

### Readable spectacle

Large enemy groups and powerful effects should look exciting while preserving silhouettes, hazards, projectiles, pickups, and safe routes.

## Core loop

The long-term run structure is:

1. Choose a hero and starting loadout.
2. Enter an encounter.
3. Fight, collect XP, and choose upgrades.
4. Collect a clearly useful reward.
5. Choose the next route node.
6. Repeat through escalating encounters.
7. Defeat the final boss or fall during the expedition.
8. Review the run and apply meaningful persistent unlocks.

The prototype and vertical slice intentionally implement only parts of this loop.

## Combat rules

### Desktop controls

- WASD or arrow keys: move
- Mouse: aim
- Left mouse button: fire
- Space: dodge
- R: ultimate ability, once ultimates are implemented
- Escape: pause

Gamepad support is required for the vertical slice. Default bindings should follow common twin-stick conventions.

### Touch controls

Touch is not required for the combat prototype, but the input architecture must support it without changing combat logic.

The anticipated mobile layout is:

- Left virtual stick: move
- Right virtual stick: aim and fire, or optional auto-aim/auto-fire
- Large dodge button
- Large ultimate button

Six mobile quick slots are not part of the current plan. Phone controls must remain legible and comfortable.

### Input architecture

Keyboard, mouse, gamepad, and touch adapters should produce a shared player-intent model:

```text
move direction
aim direction
fire pressed/held
dodge pressed
ultimate pressed
interact pressed
pause pressed
```

Gameplay systems consume these intentions and must not directly depend on a particular physical input device.

## Heroes

### Marine

The Marine is the first playable hero and the baseline used to tune the game.

- Role: durable all-round ranged fighter
- Starting weapon: assault rifle
- Passive: deferred until the base weapon and damage model are proven
- Ultimate: deferred until the base combat loop is proven
- Visual identity: compact, readable sci-fi armour; practical rather than superheroic; strong silhouette at gameplay scale

The Marine and future heroes use modular visual equipment. The base body and armour animation remains stable while equipped headgear and weapons are separate visual layers driven by the same equipment data used by gameplay.

The approved Marine art-direction concept is the visual anchor for the initial art bible.

### Medic

The Medic is the second planned hero for the web MVP. The Medic must produce a meaningfully different play style rather than simply having more healing.

Additional heroes are future content: Assault, Tactician, Scout, and Sniper.

## Weapons and upgrades

The combat prototype starts with one assault rifle. The vertical slice expands to several simultaneous weapons only after shooting and enemy reactions feel good.

### Visible weapon ring

Equipped weapons appear as separate sprites arranged around the character, inspired by the immediate loadout readability of games such as Brotato. The character may support zero to twelve equipped weapons without requiring twelve hand-drawn variants of every hero animation.

- The hero body and weapon sprites animate independently.
- Each weapon occupies a calculated anchor around the character.
- Weapon position, rotation, recoil, firing effect, and depth sorting are controlled at runtime.
- The layout expands or staggers its radius as the weapon count grows so weapons do not completely overlap.
- Every equipped weapon should be visible during ordinary play unless temporary effects make that impossible.
- The equipment data is the single source of truth for gameplay, the in-game ring, and the loadout preview.
- Supporting twelve weapons is an architectural capacity, not a promise that twelve is the best balance target.

The combat prototype proves one manual weapon. The next implementation step tests two to four simultaneous weapons. Counts above six require explicit readability, targeting, audio, VFX, and performance validation before becoming normal gameplay.

The placeholder implementation now supports zero to twelve independently firing Service Rifle instances. One weapon follows the aim-side anchor; multiple weapons use a fixed circular arrangement whose radius expands with count and whose vertical position controls whether each sprite passes behind or in front of the hero. Review builds can select a count with the `?weapons=` URL parameter. This proves technical capacity only; four weapons remain the next intended gameplay test and twelve is a stress/readability case.

The functional vertical-slice loadout is available with `?loadout=vertical`: the Service Rifle remains cursor-aimed, the Scattergun fires a short-lived five-pellet spread with knockback, and the Arc Carbine automatically selects a nearby enemy and chains from its first impact. Weapon definitions own targeting, attack pattern, range, projectile, knockback, and chain rules. Production Asset Batch B supplies distinct ring sprites, projectiles, muzzle flashes, impacts, and chain effects for the two new families.

Individual weapons may use different behaviours while sharing the visible ring. Examples include cursor-aimed weapons, automatic target-seeking weapons, orbiting contact weapons, and cooldown-driven support devices. The firing rules must remain understandable; adding more visible guns must not turn player choices into unreadable noise.

### Modular equipment appearance

The equipped helmet or hat is a swappable overlay in the in-game sprite and character preview. Every supported head item therefore needs compatible directional views and animation alignment points.

The loadout portrait should be a dynamic preview rendered from the same base body, headgear, and weapon sprites used in gameplay. This allows the preview to reflect zero to twelve weapons without painting a unique portrait for every combination. A separate illustrated dialogue portrait may show the equipped helmet and primary weapon only if one is added later.

Boots may exist as an equipment or stat category later, but they do not change the character's appearance. Keeping footwear baked into the base body avoids another low-value overlay across every direction and animation frame.

### Hero movement and dodge animation

Each hero needs separate body artwork for idle, movement, dodge, hit, and defeat because hero proportions and silhouettes differ. The implementation should reuse animation state names, timing conventions, attachment-point formats, and dodge logic across heroes rather than attempting to reuse one character's pixels.

The prototype uses one movement animation. A separate sprint animation is added only if sprint becomes a mechanically distinct state.

Dodge always has its own animation. All heroes use the same input and shared action contract, while their presentation may differ: a Marine roll, Medic slide, Scout dash, or heavy shoulder rush. A data-driven dodge profile may later vary travel, cooldown, protected frames, or charges without changing the input system.

### Evasive-move secondary stats

Every hero has one evasive move and three base secondary stats:

- Duration in seconds
- Distance in metres
- Invulnerability duration in seconds

The presentation may be a sprint, dodge, roll, slide, dash, or rush, but gameplay always consumes the same three core values. Items, perks, relics, mutations, curses, and hero traits may modify them later.

Invulnerability duration must be zero or greater and may not exceed the total move duration. Metres are engine-independent design units converted through a shared pixels-per-metre constant.

The prototype currently adds a universal 0.75-second recovery after an evasive move. Recovery is a shared prototype rule, not a fourth hero secondary stat. It may be revised or promoted into a modifiable system only after playtesting demonstrates the need.

Initial upgrade families may include:

- Piercing rounds
- Ricochet rounds
- Explosive impact
- Chain lightning
- Faster firing with an accuracy or heat trade-off
- Dodge decoy or damaging dodge trail

Weapon-slot counts, quick-slot inventories, consumables, and rarity tiers are deferred until the game has enough content to justify them.

The web MVP may introduce Common, Uncommon, and Rare rewards, but rarity must communicate a real difference in behaviour or value.

## Enemies

### Prototype

- Swarmer: closes distance directly and teaches movement
- Spitter: maintains range and creates dodgeable projectiles

### Vertical slice

- One additional pressure enemy
- One elite or mini-boss with clearly telegraphed attacks

The functional Slime Spitter supplies the additional ranged pressure role. Its directional production sheet maps positioning, wind-up, and recovery directly to simulation state. It maintains medium distance, locks a ground target, fires an authored hostile glob, and creates a four-second slowing puddle on its target or the first obstacle struck. Puddles slow ordinary movement but not the Marine's evasive displacement, and simultaneous coverage is capped at five.

The first functional elite is the Carapace Scuttler. Its larger four-direction production sheet gives pursuit, wind-up, charge, and recovery distinct silhouettes. It retains the Scuttler pursuit role but adds directional frontal armour and a full-damage recovery window. Direct projectiles striking the front deal 25% damage; rear attacks and all attacks during recovery deal full damage. Its death always drops an elite upgrade cache, proving that elite rewards are guaranteed rather than random.

The functional mini-boss is the Siege Crusher. Its four-direction production sheet exposes stalk, charge, and sweep poses; its portrait appears in the dedicated boss bar. It stalks before selecting attacks by range, locks a charge lane during a 0.7-second tell, performs a broad authored sweep at close range, and enters a 1.15-second punishable recovery. Charges damage cover on first impact and destroy it on the second, removing the obstacle from both rendering and collision while producing an authored debris shockwave. Defeat guarantees an arsenal cache that heals and supplies two upgrade thresholds.

### Web MVP

- Three or four complementary standard archetypes
- Elite variants
- One final boss

Flying, shielding, exploding, psychic, summoning, and giant tank enemies remain future content.

## Encounter direction

Encounters should use seeded threat budgets and explicit fairness rules rather than opaque real-time difficulty adjustment.

An encounter definition may control:

- Enemy types and quantities
- Spawn cadence and valid spawn regions
- Maximum simultaneous pressure
- Elite timing
- Interactive battlefield elements
- Reward budget

Seeds should make bugs and balance problems reproducible. Later director systems may vary encounters within authored constraints.

## Battlefield interactions

The styled combat prototype now uses a deterministic tiled test chamber with boundary walls and four collision footprints: a low barricade, cargo crate, power conduit, and alien biomass mound. Player and enemy movement slide against these footprints, and projectiles stop on impact. These objects currently prove navigation, cover, depth, and readability; they are not yet the signature interactive battlefield system.

The vertical slice must test one signature interaction, such as:

- A power switch that activates an electrical fence
- A defensive turret with limited charge
- Destructible alien biomass that spawns enemies until destroyed
- An explosive environmental object that can damage either side

Future interactions may include shrines, doors, consoles, supply crates, medical stations, survivor cages, teleporters, hazards, destructible cover, and timed objectives.

Status combinations such as Wet plus Lightning are promising future systems, but they should be added only after the core interaction is readable and fun.

## Progression

### During a run

Enemies provide XP. Level-ups pause or safely slow combat and present a small number of meaningful choices. Upgrade presentation must explain the behavioural change clearly.

### Between runs

Persistent currency and relics are deferred until there is something meaningful to spend or unlock. The web MVP must not award purposeless meta-currency.

Future persistent progression may unlock heroes, starting weapons, upgrade families, and new encounter possibilities without making early runs permanently trivial.

## Saving

The prototype does not require saving.

The vertical slice should save settings and basic progress locally. The web MVP should autosave between encounters and version its save schema so future migrations are possible.

Browser storage can be cleared, so the web build must not imply that local saves are equivalent to permanent cloud saves.

## Art direction

The target is modern, colourful pixel art with premium lighting and effects.

Art must prioritise:

- Readable silhouettes at actual gameplay scale
- A consistent top-down or high three-quarter camera angle
- A limited, documented palette
- Consistent sprite dimensions and lighting direction
- Distinct player, enemy, hazard, projectile, and pickup colour families
- Crisp pixel treatment without inconsistent faux-pixel detail
- Effects that communicate timing and damage without hiding gameplay

The first Marine concept was approved as the initial art-direction anchor. The art pipeline test consists of one Marine base-body sprite set, one aligned helmet overlay, visible weapon sprites and anchors, one alien, one terrain set, one HUD panel, and core combat effects.

The styled foundation uses a manifest for every production-test asset's stable ID, logical dimensions, frame contract, and pivot. A dedicated gallery displays every frame and representative weapon-ring counts. The normal combat route uses styled art by default, while the placeholder renderer remains available for comparison. Four weapons define the ordinary readability stress case; twelve weapons remain a separate capacity test.

Modular character art must define shared attachment points for the head and weapon ring. Base-body animations must not move these anchors unpredictably. Equipment previews must be assembled from production sprite layers rather than generated as unique images for every possible loadout.

## Audio direction

Early development may use placeholders. The vertical slice needs representative rifle fire, impacts, alien hits/deaths, dodge feedback, level-up feedback, UI sounds, and one music loop.

Audio should reinforce timing and impact rather than merely add noise.

## Scope gates

### Gate 1: Combat prototype

Target run length: approximately 5 to 10 minutes.

Included:

- Marine
- Assault rifle
- Swarmer and spitter
- Movement, aiming, firing, damage, death, and dodge
- Three short waves
- XP collection and level-ups
- Approximately six transformative upgrade choices
- Placeholder shapes or temporary sprites and audio

Excluded:

- Campaign map
- Inventory and equipment screens
- Rarity and loot systems
- Shops and relics
- Persistent progression and saving
- Finished artwork
- Boss

Exit criterion: multiple testers understand the controls quickly and voluntarily replay the build.

### Gate 2: Vertical slice

Target run length: approximately 10 to 15 minutes.

Included:

- Five waves
- Marine with a defined passive and ultimate
- Three weapons
- Three standard enemy types
- One elite or mini-boss
- Approximately twelve meaningful upgrades
- One shop or rest decision
- One signature battlefield interaction
- Representative final-quality art, UI, audio, and VFX
- Gamepad support
- Local settings and progress save

Exit criterion: the build communicates Last Bastion's identity, runs reliably, and receives strong replay feedback from external testers.

### Gate 3: Web MVP

Included:

- Marine and Medic
- Ten waves
- Three or four standard enemy archetypes plus elites
- One final boss
- A small branching route with Combat, Elite, Shop, Rest, and Boss nodes
- Useful relics and persistent unlocks
- Main menu, character select, gameplay HUD, pause, route, shop/rest, victory, and defeat screens
- Autosave between encounters
- Keyboard/mouse and gamepad support
- A complete, coherent art and audio pass

Exit criterion: the complete web loop produces a reliable "one more run" response and provides enough real player evidence to consider a commercial edition.

## Future roadmap

Possible post-MVP systems include additional heroes and biomes, environmental status combinations, companions, mutations, curses, active items, extensive relics, base management, more route nodes, statistics, achievements, leaderboards, and additional bosses.

These are backlog items, not promises. They enter production only when the preceding scope gate succeeds.

## Platform strategy

### Web first

The first release target is the SnackPack Universe website. The game should be a self-contained TypeScript project compiled to static files for GitHub Pages.

### Steam after validation

A successful web game can be packaged as a desktop application without immediately rewriting it in another engine. A Steam edition would require excellent gamepad support, offline behaviour, reliable saves, display and audio settings, accessibility options, and substantially polished content.

A Godot rewrite is considered only when a proven requirement justifies it, such as performance, native tooling, console targets, or maintainability at a larger content scale.

### Android after touch validation

Android is technically viable through a native web container, but only after dedicated touch controls, lifecycle handling, phone/tablet layouts, and mid-range-device performance are proven. A desktop web build placed unchanged in a mobile wrapper is not an acceptable release.

## Technical principles

- Use TypeScript with a current supported Phaser release and Vite.
- Verify the current Phaser version and required plugin compatibility when scaffolding; do not permanently lock this document to an obsolete major version.
- Keep hero, weapon, enemy, upgrade, encounter, and reward definitions data-driven with stable IDs.
- Separate portable rules and calculations from Phaser scene and rendering code where practical.
- Use a versioned save schema.
- Make encounter randomness seedable for testing.
- Pool high-volume objects such as projectiles, pickups, and enemies when profiling shows it is needed.
- Measure performance on representative low- and mid-range hardware.
- Prioritise playability, then performance, polish, content, and only then additional systems.

## Success criteria

Last Bastion succeeds when it is:

- Immediately understandable
- Responsive and satisfying
- Difficult but fair
- Distinctive because the battlefield participates in combat
- Highly replayable through genuinely different builds
- Readable during large encounters
- Structured so new content can be added without rewriting core systems
