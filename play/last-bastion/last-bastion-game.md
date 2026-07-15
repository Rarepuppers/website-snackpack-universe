\# Last Bastion



\## Vision



Build \*\*Last Bastion\*\*, a premium browser-based 2D sci-fi survival action RPG.



Humanity has been reduced to a handful of isolated fortresses known as the Last Bastions. Every expedition beyond the walls is a desperate fight for survival against endless alien swarms.



The player chooses a soldier, survives 20 increasingly difficult waves, upgrades their hero and equipment, recruits companions, strengthens the Bastion between missions, and ultimately attempts to save humanity.



The game should feel satisfying, highly replayable, polished, and suitable for commercial release.



\---



\# Core Gameplay Loop



Every run consists of:



1\. Choose a hero.

2\. Choose starting equipment.

3\. Choose starting perk.

4\. Survive a 60-second wave.

5\. Collect XP, gold, relics and loot.

6\. Level up.

7\. Choose upgrades.

8\. Travel to the next encounter using a branching campaign map.

9\. Repeat for up to 20 waves.

10\. Defeat the final boss and defend the Last Bastion.



Every run should be different.



\---



\# Design Goals



Gameplay should emphasize:



\- constant movement

\- satisfying combat

\- overwhelming alien swarms

\- meaningful progression

\- difficult decisions

\- build diversity

\- replayability



The player should constantly become stronger while enemies become more dangerous.



\---



\# Heroes



Launch with six heroes.



\- Marine

\- Medic

\- Assault

\- Tactician

\- Scout

\- Sniper



Each hero should have:



\- unique passive ability

\- unique ultimate

\- unique starting equipment

\- unique perk pool

\- different stat growth

\- three flavour quotes selected randomly each run



Example base stats:



Strength

Agility

Intelligence

Luck



Health

Stamina

Energy



Critical Chance

Critical Damage

Evasion

Movement Speed



\---



\# Controls



WASD or Arrow Keys



Mouse Aim



Left Click

Attack



Space

Roll / Dodge



R

Ultimate Ability



1-6

Quick Slot Items



ESC

Pause



\---



\# Equipment



Weapon slots



\- 3 Light

\- 2 Medium

\- 1 Heavy



Quick Slots



\- 6 consumable slots



Equipment rarity



Common



Uncommon



Rare



Epic



Legendary



Mythic



Unique



Unique items may only be owned once.



\---



\# Character Progression



Every level grants:



\- stat increases

\- one upgrade choice



Upgrade choices should feel exciting rather than generic.



Examples



\+ explosive bullets



\+ orbital drone



\+ chain lightning rounds



\+ bouncing bullets



\+ plasma explosions



\+ poison rounds



\+ auto turret



\+ shoulder missile launcher



\+ teleport dodge



\+ attack speed



\+ summon attack drone



Avoid boring upgrades like simply "+5 damage" unless combined with interesting mechanics.



\---



\# Progression Systems



Implement:



\- Level system

\- Perk system

\- Mutation system

\- Curse / Taint system

\- Companion system

\- Weapon upgrades

\- Relics

\- Passive items

\- Active items



Every system should include both positive and negative trade-offs where appropriate.



\---



\# World



Camera



Compact top-down.



Maps



Initially open arenas.



Later maps include:



\- rocks

\- walls

\- bunkers

\- barricades

\- rivers

\- lava

\- traps

\- laser fences

\- minefields



Some arenas shrink.



Some expand.



Some contain objectives.



\---



\# Enemies



Create many enemy archetypes.



Examples



\- melee swarmers

\- ranged spitters

\- flying aliens

\- shield units

\- exploding enemies

\- psychic enemies

\- summoners

\- giant tanks

\- bosses



Enemies should have varied movement, attacks and behaviours.



\---



\# Campaign



Between waves present a branching campaign map.



Possible nodes



Combat



Elite Combat



Boss



Shop



Treasure



Event



Survivor Rescue



Rest



Upgrade Bunker



Mystery



Relic



Merchant



This system should resemble a branching campaign rather than a linear sequence.



\---



\# Base Management



Between missions the player may upgrade:



\- walls

\- bunker

\- command centre

\- laboratory

\- armoury

\- workshop

\- companion quarters



These upgrades affect future runs.



\---



\# UI



Include:



Main Menu



Character Select



Loadout Screen



Campaign Map



Gameplay HUD



Inventory



Character Sheet



Weapon Screen



Pause Menu



Victory Screen



Defeat Screen



Statistics Screen



Use a polished modern pixel-art presentation with satisfying animations and feedback.



\---



\# Art Direction



Generate original artwork using image generation.



Style



\- colourful pixel art

\- modern lighting

\- premium indie quality

\- readable silhouettes

\- satisfying VFX

\- detailed UI



Generate:



heroes



aliens



weapons



companions



tilesets



icons



particles



UI



backgrounds



bosses



\---



\# Audio



Generate placeholders for:



music



ambient sounds



weapon sounds



explosions



UI sounds



enemy sounds



voice effects



\---



\# Statistics



Track:



highest wave



total XP



kills



headshots



gold



relics



damage dealt



damage taken



weapons collected



companions rescued



time survived



\---



\# Leaderboards



Not required for MVP.



Add to backlog.



When implemented:



\- highest wave

\- total XP

\- kills

\- gold

\- relics



\---



\# Saving



Runs should autosave.



Meta progression should persist.



Player settings should persist.



\---



\# Deployment



The project lives in a public GitHub repository.



The game is deployed automatically through GitHub Pages to a custom domain.



Do not depend on proprietary hosting solutions.



Use web-compatible technologies.



\---



\# Development Strategy



Always prioritize:



1\. Playability

2\. Performance

3\. Polish

4\. Content

5\. Additional systems



Never sacrifice responsiveness for graphical effects.



When requirements conflict, choose the solution that produces the most fun, polished, replayable experience.



Continue improving the game autonomously until it is commercially polished and ready for release.



\# Success Criteria



The finished game should feel like:



\- "one more run"

\- immediately understandable

\- difficult but fair

\- highly replayable

\- visually polished

\- satisfying to level up

\- satisfying to defeat large enemy swarms

\- capable of supporting hundreds of future weapons, perks, heroes and enemies without major refactoring



Whenever uncertain, choose the design that increases replayability, build variety, player satisfaction and long-term extensibility.







\####



Option 1: free Web game first, these are all optional, if you have a better plan do that instead

example https://www.snackpackuniverse.com/play/last-bastion



HTML5

TypeScript

Phaser 3

GitHub

GitHub Pages

Custom domain



option 2: future end goal (very far off, just letting you know) If this proves to be a success, In the future is it possible to port to godot, re-create and create assets and release on steam?



\---



\# MVP Scope



The full vision above is the north star. The MVP is the smallest version of it that is fun, complete, and shippable. Everything not listed below is deferred to Phase 2/3.



\## MVP Heroes



\- Marine

\- Medic



Fully realized: unique passive, unique ultimate, unique starting equipment, unique perk pool, three flavour quotes.



\*\*Phase 2:\*\* Assault, Tactician, Scout, Sniper.



\## MVP Content



\- 1 biome (open arena, no environmental hazards yet)

\- 10 waves (not 20)

\- 1 boss



\*\*Phase 2:\*\* additional biomes, hazards (rivers, lava, minefields, laser fences, shrinking/expanding arenas), waves 11-20, additional bosses.



\## MVP Progression Systems



\- Level system

\- Perk system

\- Relics



\*\*Phase 2:\*\* Mutation system, Curse / Taint system, Companion system, Weapon upgrades, Passive items, Active items.



\## MVP Equipment



\- Rarity: Common, Uncommon, Rare

\- Weapon slots: 3 Light, 2 Medium, 1 Heavy (unchanged)

\- Quick slots: 6 (unchanged)



\*\*Phase 2:\*\* Epic, Legendary, Mythic, Unique rarities.



\## MVP Campaign Map



Node types:



\- Combat

\- Elite Combat

\- Boss

\- Shop

\- Rest



\*\*Phase 2:\*\* Treasure, Event, Survivor Rescue, Upgrade Bunker, Mystery, Relic, Merchant.



\## MVP Base Management



Cut entirely for MVP. Meta progression persists (gold/relics carry between runs) but base upgrade screens (walls, bunker, command centre, laboratory, armoury, workshop, companion quarters) are Phase 2.



\## MVP UI



\- Main Menu

\- Character Select

\- Loadout Screen

\- Campaign Map

\- Gameplay HUD

\- Inventory

\- Pause Menu

\- Victory Screen

\- Defeat Screen



\*\*Phase 2:\*\* Character Sheet, Weapon Screen, Statistics Screen.



\## MVP Enemies



\- 3-4 melee/ranged swarmer archetypes

\- 1 boss



\*\*Phase 2:\*\* flying, shield, exploding, psychic, summoner, giant tank archetypes, additional bosses.



\## MVP Art \& Audio



\- Core art pipeline proven on 2 heroes, 1 enemy set, 1 tileset, core UI

\- Placeholder audio for combat, UI, and one music track



\*\*Phase 2:\*\* full hero/alien/companion/boss roster, additional tilesets, full music/ambient/voice pass.



\## MVP Statistics



\- highest wave

\- kills

\- gold

\- time survived



\*\*Phase 2:\*\* full stat tracking (XP, headshots, relics, damage dealt/taken, weapons collected, companions rescued).



\## Explicitly Deferred (already noted, kept for completeness)



\- Leaderboards — not required for MVP, backlog only.

\- Godot / Steam port — future consideration only, not in scope for MVP or Phase 2/3.



\## Definition of Done for MVP



The MVP is complete when a player can: pick 1 of 2 heroes, choose starting equipment/perk, survive 10 waves across a branching map with 5 node types, level up with meaningful perk choices, collect Common-Rare loot and relics, defeat 1 boss, and see a Victory/Defeat screen — with autosave and persistent meta-currency. If that loop feels like "one more run," MVP is done and Phase 2 begins.



\---

