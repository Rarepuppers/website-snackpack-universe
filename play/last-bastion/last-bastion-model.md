For a project like Last Bastion, I'd separate the job into planning, implementation, and asset creation, because no single model is best at all three.



My recommendation

1\. Planning \& architecture: GPT-5.6



Use GPT-5.6 to create and refine:



Game Design Document (GDD)

Technical architecture

Folder structure

Entity/component system

Data formats (heroes, weapons, enemies, perks)

Long-term roadmap



It excels at keeping a large, interconnected design coherent.



2\. Building the game: Codex + GPT-5.6



This is what OpenAI used in the showcase because it's a strong combination for software projects.



Use it to:



Build the game incrementally

Refactor code

Add new systems

Generate tests

Improve performance

Fix bugs

Continue iterating over many sessions



For this kind of project, I'd set the reasoning effort to High most of the time.



Use Max only for bigger architectural tasks, such as:



designing the save system

implementing procedural generation

pathfinding

AI behavior trees

large refactors



Using Max for every prompt will generally cost more and often won't produce proportionally better results.



3\. Artwork: ImageGen



Use ImageGen for:



heroes

enemies

weapons

icons

UI

splash screens

marketing art

loading screens



I'd generate assets in batches so they share a consistent visual style.



What about Luna, Sol, and Terra?



OpenAI hasn't published an official mapping like:



Luna = best for games

Sol = best for coding

Terra = best for design



so there isn't an authoritative recommendation for this specific use case.



Based on their intended positioning:



GPT-5.6 remains the safest choice for a large coding project.

Luna is likely a good choice when you want fast, creative writing (dialogue, lore, item descriptions, flavor text).

Sol may be useful for balanced reasoning tasks, but I wouldn't switch away from GPT-5.6 for the core game unless you've compared the outputs yourself.

Terra may also be capable, but there isn't enough public guidance to recommend it over GPT-5.6 for a months-long software project.

For your game specifically



Since you mentioned this will likely become one of your flagship projects, I'd use this workflow:



Task	Recommended model

Game architecture	GPT-5.6

Phaser/TypeScript code	Codex + GPT-5.6

Refactoring	Codex + GPT-5.6

Bug fixing	Codex + GPT-5.6

Hero and enemy artwork	ImageGen

Music and sound placeholders	GPT-5.6 

Item descriptions, lore, flavor text	Luna or GPT-5.6

Balancing weapons and perks	GPT-5.6

One suggestion



I wouldn't ask the model to build the entire game in one prompt. Instead, use your LAST\_BASTION.md as the persistent design document and have Codex work through milestones, for example:



Core engine (movement, shooting, enemies)

Wave system

XP and leveling

Weapons

Perks

Branching campaign map

Companions

Base upgrades

Bosses

Polish, effects, and balancing



\# Controls



Movement



\- WASD

\- Arrow Keys



Aim



\- Mouse



Attack



\- Left Mouse Button (default)

\- Optional Auto Fire



Interact



\- E key

\- Left Mouse Button may also interact with nearby objects when appropriate.

\- Interaction should always prioritize the closest valid object.

\- Interactions should feel immediate and responsive.



Roll / Dodge



\- Space



Ultimate Ability



\- R



Quick Slots



\- 1-6



Pause



\- ESC



\# Interactive World



The battlefield should contain both interactive and non-interactive objects.



These make every arena feel unique and encourage movement.



Examples:



Interactive



\- Shrines

\- Doors

\- Elevators

\- Consoles

\- Supply Crates

\- Ammo Crates

\- Medical Stations

\- Generators

\- Escape Pods

\- Survivor Cages

\- Power Switches

\- Control Panels

\- Ancient Alien Relics

\- Timed Objectives

\- Beacons

\- Teleporters



Non-Interactive



\- Walls

\- Rocks

\- Trees

\- Wrecked Vehicles

\- Barricades

\- Rubble

\- Buildings

\- Pillars



Some environmental objects can be destroyed.



Destroying them may reveal:



\- loot

\- gold

\- relics

\- survivors

\- hidden passages

\- enemies



\# Environmental Hazards



Hazards should be varied and create interesting tactical decisions.



Examples



Fire



\- applies Burning



Lava



\- instant damage

\- Burning



Electric Floor



\- Lightning damage



Poison Pool



\- Poisoned



Toxic Gas



\- Poisoned



Arrow Traps



\- dodgeable projectiles



Spike Traps



\- timed



Laser Walls



\- predictable movement



Minefields



\- explode when triggered



Acid Pools



\- armour reduction



Ice



\- slippery movement



Mud



\- slows movement



Quicksand



\- movement penalty



Dark Fog



\- reduced vision



Alien Biomass



\- continuously spawns enemies



Some hazards may be destroyed.



Others may be activated or disabled.



Some are permanent.



Others activate on timers.



\# Status Effects



Status effects should interact with one another.



Examples



Burning



\- Damage over time



Wet



\- Extinguishes Burning

\- Increases Lightning damage taken



Frozen



\- Reduced movement

\- Increased damage from melee attacks



Poisoned



\- Damage over time



Bleeding



\- Damage while moving



Shocked



\- Brief stun

\- Chain lightning between nearby enemies



Mud



\- Reduced movement

\- Increased Lightning resistance



Radiation



\- Random mutations



Curse



\- Random negative effects



Fear



\- Reduced accuracy



Haste



\- Increased movement

\- Increased attack speed



Shielded



\- Damage reduction



Stealth



\- Enemies lose target temporarily



Status effects should combine naturally.



Examples



Wet + Lightning = severe damage



Wet removes Burning.



Burning removes Frozen.



Poison + Burning creates Toxic Flames.



Frozen enemies hit by explosives shatter.



These interactions should reward experimentation.



\# Shrines



Shrines are optional risk-versus-reward events.



Most shrines affect only the current wave.



Types



Combat Shrine



Challenge Shrine



Healing Shrine



Curse Shrine



Mutation Shrine



Relic Shrine



Fortune Shrine



Blood Shrine



Technology Shrine



Ancient Shrine



Most shrine rewards last for one wave.



Some rare shrines last for three waves.



Three-wave blessings always include a drawback.



Examples



+50% Weapon Damage

\-20% Movement Speed



+100% Critical Chance

Enemies move faster



+Double XP

Half Healing



+Infinite Ammo

Reduced Accuracy



Legendary Shrines



Very rare.



Grant permanent bonuses for the remainder of the run.



These should feel exciting and memorable.



\# Dynamic Events



Random events may occur during a wave.



Examples



Meteor Shower



Alien Reinforcements



Supply Drop



Survivor Rescue



Orbital Strike



Acid Rain



Darkness



EMP Pulse



Radiation Storm



Boss Arrival



Power Surge



Earthquake



Most events should require the player to react immediately.



\# Gameplay Philosophy



Movement should always be interesting.



Whenever possible, encourage players to move rather than stand still.



Every arena should present meaningful tactical decisions through enemies, hazards, objectives, environmental interactions, shrines and events.



The battlefield itself should become another "enemy" the player must learn to master.



\# AI Director



The game should dynamically adjust each wave using an AI Director.



The Director controls:



\- enemy composition

\- elite spawns

\- environmental hazards

\- shrine placement

\- events

\- mini-bosses

\- loot drops

\- survivor encounters



The goal is to maximize variety while remaining fair.



No two runs should feel identical.





