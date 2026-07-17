# Last Bastion

## Document purpose

This is the durable game design document for Last Bastion. It describes the game we are trying to make, the decisions that are currently locked, and the boundaries between the prototype, vertical slice, web MVP, and future releases.

Implementation status belongs in `last-bastion-model.md`. Detailed content lists should eventually live in data files rather than being duplicated here.

Current supporting documents:

- `last-bastion-art-bible.md` — visual rules and animation architecture
- `last-bastion-content.md` — draft enemy and weapon catalogue
- `wave_balance.md` — encounter numbers: spawn budgets, monster stats and scaling, damage, XP, Scrap, and items
- `last-bastion-codex.html` — the playable knowledge hub: every hero, weapon, monster, upgrade, relic and damage type as a browsable tile gallery, and the source of the shared tile ids the game reuses in character select and the shop

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

## Front-end shell and expedition structure

Designed 17 July 2026. The game gains a proper front door and replaces "start in the arena" with a run map. The reference feel is a modern card-tile menu (bold diagonal panels, oversized italic type, code-rendered text) executed in the Last Bastion palette: deep navy/charcoal fields, ivory panels, teal equipment light, restrained orange alarm accents. Every screen works with keyboard, mouse, and gamepad, and every label is code-rendered so one art master serves all bindings and languages.

Screen flow:

```text
Title → Main menu → { How to Play | Settings | Lab } 
Main menu → Character select → Expedition map → Encounter ⇄ Map → Final boss → Run summary → Main menu
```

### Title screen

Full-screen backdrop: a lone Marine silhouette on a ridge, weapon ring faintly glowing, facing a horizon crawling with alien silhouettes beneath the last fortified city's search beams. Slow parallax spore drift and a periodic teal scanline sweep keep it alive. Centre: the LAST BASTION logotype; below it a single prompt panel ("PRESS ENTER" / "PRESS START", auto-swapping by last input device); footer strip: "SOLO EXPEDITION • KEYBOARD & CONTROLLER • AUTOSAVES BETWEEN NODES".

### Main menu

A card grid over a dimmed title backdrop:

- **EXPEDITION** (hero card, largest): starts character select. Sub-line shows the current rules chip: "20 NODES • ONE LIFE".
- **HOW TO PLAY**: paged guide.
- **SETTINGS**: audio and comfort.
- **CODEX**: opens `last-bastion-codex.html` — the encyclopedia, and the in-fiction reward for discovery via the Monsterdex.
- **LAB**: the existing gallery and scenario review routes, surfaced in-game instead of URL-only.
- **RECORDS** (small card): persisted progress from the save store — runs finished, victories, best wave/node.
- A "CONTINUE EXPEDITION" card appears only when a mid-run autosave exists.

### How to Play

Three to four pages, each one diagram plus short code-rendered captions: (1) movement, aim, roll invulnerability, Entrenched; (2) ultimate, consumable kit, action bar and cadence strip; (3) damage types and status buildup with the four status icons; (4) the map — node types, one-life rule, autosave.

### Settings

Backed by the existing versioned save store; every change persists immediately and the URL parameters remain as review overrides. Grouped into four tabs so the list never becomes a wall:

**Gameplay**

| Setting | Options | Default | Notes |
| --- | --- | --- | --- |
| Firing | Auto-fire / Manual | **Auto-fire** | Auto-fire holds the trigger whenever a valid target is in range; the aim stick/cursor still chooses direction. A **toggle hotkey** (`T`, pad R3) flips modes mid-run without opening menus, because some weapons (Bolt Carbine, Grenade Tube) reward deliberate shots while the Service Rifle does not. |
| Skills | Auto-use / Manual | **Manual** | Auto-use fires the ultimate and consumable kit on sensible triggers (ultimate when ≥4 enemies are inside its radius; kit when a mini-boss is engaged or health drops below 40%). Manual keeps every activation on the player, which is the intended skill expression. |
| Auto-aim assist | Off / Light / Strong | **Light** | Light applies a small angular snap on cursor/stick aim; Strong targets the nearest enemy. Required for eventual touch play; keep off the default desktop experience beyond Light. |
| Pause on decision | On / Off | **On** | Off lets combat continue during upgrade choices for players who find the pause jarring. |

**Display**

| Setting | Options | Default | Notes |
| --- | --- | --- | --- |
| Game size | Fit (default) / 100% / 150% / 200% / 250% / 300% | **Fit** | Drives `planDisplayScale`. Every option still snaps to whole physical pixels — the percentage picks the target size and the engine chooses the nearest exact device scale, so no option can reintroduce fractional blur. Fit uses the largest exact scale the window allows. |
| Screen shake | On / Off | On | Already implemented. |
| Damage numbers | On / Off | On | See `wave_balance.md`; floating numbers are how the player reads damage growth. |
| Show FPS | On / Off | Off | Debug overlay for performance reports. |

**Audio** — Master / Music / SFX sliders (0–100), replacing today's single sound toggle once production audio lands.

**Controls** — binding list per device with remapping, gamepad deadzone (the mapper already exposes it), and vibration on/off.

**Accessibility** (recommended additions, not yet designed in detail): colour-blind-safe telegraph palette, reduced-flash mode (caps camera flashes and combustion bursts), high-contrast HUD, and hold-vs-tap for the evasive move. These are cheap to honour now and expensive to retrofit later.

### Character select

Solo, so this is a hero dossier rather than a versus grid:

- Left: large hero render (the Marine's modular base + helmet layers, live-assembled — the same sprites as gameplay, oversized).
- Right: dossier panel — role line, three stat bars (health/armour/speed), passive and ultimate cards with icons, starting weapon with its ring sprite, and the helmet on/off toggle the engine already supports.
- Roster rail below: Marine (playable), Medic ("IN DEVELOPMENT" lock treatment), and three darkened silhouette slots (Assault, Tactician, Scout) that communicate future breadth without promising dates.
- Confirm advances to the expedition map.

### Expedition map — the 20-node run

Replaces stage select entirely. A horizontal, left-to-right starchart in the spirit of FTL's sector map crossed with Slay the Spire's branching lanes:

- **Topology:** 20 nodes in ~8 columns across 3 lanes. Node 1 is the drop site; node 20 is the Bastion Eater. Edges connect only to the next column (straight or one lane up/down), so every route is 8–11 encounters — a player sees roughly half the map per run, which fuels replay.
- **Node types and budget per map:** Combat (majority), Elite ×2 (guaranteed cache), Mini-boss ×1–2 (drawn from the seeded pool), Supply Depot ×2 (the existing heal/armoury/shield decision as a safe node), Weapon Cache ×2 (the existing chest as a node), and the Boss terminus. Shrine and Event nodes are reserved future types and render as design placeholders until their systems exist.
- **Generation rules (seeded, pure, unit-tested):** no two Elite/Mini-boss nodes adjacent on any path; at least one Supply Depot reachable before the first Mini-boss; every lane rejoins before the boss; the seed reproduces the exact map for bug reports.
- **Presentation:** current node pulses; reachable next nodes glow teal with connecting route lines; visited nodes dim with a claw-mark "cleared" stamp; unreachable branches grey out. Hovering/selecting a node shows a small intel card (type, threat hint, reward hint). A small dropship token animates along the chosen edge.
- **Persistence:** the save schema versions up to carry mid-run state (map seed, cleared nodes, hero build, health/shield); autosave happens on returning to the map, honouring the existing "browser storage is not cloud storage" rule.
- **Encounter mapping:** Combat/Elite/Mini-boss nodes run the existing arena simulation with encounter budgets chosen by node type and column depth; Supply Depot and Weapon Cache reuse the existing decision overlays full-screen; the Boss node runs the Bastion Eater scenario.

### Implementation phasing

Behavior-first, matching the working rules: (1) a screen-flow state machine with code-native placeholder panels for every screen; (2) the pure seeded map generator with rules tests; (3) save schema v2 and node→encounter wiring; (4) only then the Batch G art families (briefs in `last-bastion-content.md`). The five-wave arcade run remains available as a "Quick Drop" until the map fully replaces it, then becomes a lab route.

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
- Passive: **Entrenched** — holding position for 1 second grants bonus armour until moving (implemented 16 July 2026; showcases the armour stat and rewards deliberate positioning)
- Ultimate: **Bastion Barrage** — a radial explosive volley on a 24-second cooldown, fired with R or the top gamepad face button (implemented 16 July 2026)
- Visual identity: compact, readable sci-fi armour; practical rather than superheroic; strong silhouette at gameplay scale

The Marine and future heroes use modular visual equipment. The base body and armour animation remains stable while equipped headgear and weapons are separate visual layers driven by the same equipment data used by gameplay.

The approved Marine art-direction concept is the visual anchor for the initial art bible.

### Medic

The Medic is the second planned hero for the web MVP. The Medic must produce a meaningfully different play style rather than simply having more healing.

Additional heroes are future content: Assault, Tactician, Scout, and Sniper.

### Hero level-up growth

Designed 17 July 2026. Every level-up grants an **automatic stat package** in addition to the upgrade choice. The choice is the interesting decision; the package is the hero's quiet identity — it means two heroes who take identical upgrades still play differently by wave 10, and it stops early levels feeling like "one small upgrade and nothing else".

Growth is expressed in primary stats and **weapon-class proficiency** (the `weaponProficiencies` field already reserved in `HeroDefinition`, which becomes live with this system). Proficiency is a percentage damage bonus to weapons of that class: `+1 proficiency = +4% damage with that class`.

| Hero | Per-level package | Identity |
| --- | --- | --- |
| **Marine** | +1 to every primary stat (health, armour, damage, speed) and **+1 Light proficiency** | Balanced; nothing spikes, nothing lags. The Light lean rewards the flexible starting rack |
| **Assault** | +2 damage, +1 health, **+2 Medium / +1 Heavy proficiency** | Offensive slope; thinner defensively |
| **Medic** | +2 health, +1 armour, **+2 Light proficiency**, +1 support effect | Sustains rather than out-damages |
| **Tactician** | +1 health, +1 armour, **+1 Unique proficiency**, +1 to a rotating stat by level parity | Late-blooming; leans on a Unique weapon |
| **Scout** | +2 speed, +1 damage, **+1 Light proficiency** | Mobility identity, fragile |

Where a "+1" lands on a stat, the concrete magnitude is defined in `wave_balance.md` (for example +1 health = +4 max HP, +1 damage = +2% weapon damage) so the tuning pass can move the whole curve from one table. Packages are hero data, not code branches, so a new hero is a data row.

The level-up panel shows the package alongside the three upgrade cards ("+1 ALL STATS · +1 LIGHT"), so growth is visible rather than silent.

## Weapons and upgrades

The combat prototype starts with one assault rifle. The vertical slice expands to several simultaneous weapons only after shooting and enemy reactions feel good.

### Weapon tiles, slots, and inventory

Designed 17 July 2026. Weapons become **physical tiles the player handles**, in the spirit of Brotato's loadout grid but tied to Last Bastion's slot classes. Acquiring a weapon is a decision, not an automatic upgrade: every new tile forces a placement, a swap, or a refusal.

**Weapon slot classes.** The hero's rack is a row of typed slots, and a weapon may only sit in a slot that accepts its class:

| Slot | Accepts | Notes |
| --- | --- | --- |
| Light | Light weapons only | Fast, low per-hit (Machine Pistol, Arc Carbine) |
| Medium | Medium only | The Service Rifle's home |
| Heavy | Heavy only | Scattergun, Bulwark, Grenade Tube |
| Unique | Unique only | Event Horizon and later run-defining weapons; a Unique may never occupy a general slot |
| All | Any class | The flexible slot; deliberately scarce |

The hero definition owns the starting rack, which is the second half of hero identity alongside the upgrade-slot profile (`upgradeSlots`, already implemented). Proposed starts: **Marine** 1 Light / 1 Medium / 1 Heavy / 1 All (balanced); **Assault** 2 Medium / 1 Heavy / 1 All; **Medic** 2 Light / 1 All plus an extra Support upgrade slot. Rack growth is a rare reward (Shrine of Steel, late Requisition, or a shop purchase), never a level-up freebie — the run's weapon count should climb slowly toward the twelve-slot architectural cap without ever assuming it.

**Inventory.** A small stash (proposed **4 slots**, class-agnostic) holds tiles the player wants but cannot equip yet — a Heavy found before a Heavy slot exists, or a duplicate saved for a merge. Inventory weapons do not fire and do not appear on the ring. Full inventory plus full rack means the acquisition screen offers only *swap* or *discard*.

**Acquisition flow.** Buying at a shop, picking a Weapon Cache reward, or a world pickup all route to the same **placement modal**: the incoming tile is presented with its stat card, and the player drags it onto a legal rack slot (highlighted), an inventory slot, or the discard bin. Illegal slots grey out with the reason ("Heavy weapon — needs a Heavy or All slot"). Dropping onto an occupied slot swaps, sending the displaced tile to inventory or, if the stash is full, back to the placement modal so nothing vanishes silently. **Keyboard and gamepad parity is mandatory** — drag-and-drop is a mouse affordance layered over a navigate-and-confirm model (move with arrows/stick, `Enter` to pick up, again to place, `X`/pad-X to discard), never the only way to play.

**Selling.** Shops buy tiles back at a fixed fraction (proposed 50% of purchase price, rounded down; found weapons use a catalogue base price). Selling is the pressure valve that makes the limited rack a decision rather than a wall.

**Merging.** Two identical weapons of the same tier combine into one of the next tier: **two Tier I Service Rifles → one Tier II Service Rifle**, freeing a slot in the process. The merged weapon keeps the family's identity and improves its headline numbers plus one behavioural step (a Tier II Service Rifle gains a small pierce; a Tier II Scattergun gains a pellet). Merging is available at shops and at Supply Depots, and the acquisition modal flags a possible merge when a duplicate arrives. Rules: only identical ids and identical tiers merge, tiers cap at III, and merging never crosses hero-specific or Unique boundaries.

This system also gives duplicate rewards a purpose, which the content catalogue previously listed as an open question ("duplicate weapons are allowed only if copies can diverge meaningfully") — merging is that answer.

Tile art, slot frames, and the placement-modal surfaces are briefed for Codex in `last-bastion-content.md` (Batch I). Every number above is a proposal for the tuning pass in `wave_balance.md`.

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

The Bolt Carbine behavior lab is available with `?loadout=bolt`. It is a manual cursor-aimed precision weapon with a 1.8-second commitment: one slow readable bolt damages the first target, penetrates it, damages the second with stronger terminal feedback, and then stops. A missed shot still consumes the full cadence. This exact two-target contract must remain code-driven when Production Asset Batch F2 replaces the placeholder weapon, bolt, wake, impacts, and cadence tile.

Production weapon labs also expose `?loadout=bulwark` and `?loadout=grenade`. The Bulwark uses a compact reusable ballistic tracer and family-specific muzzle/impact presentation; its final spin-up, heat, and movement penalty remain a future tuning gate. The Grenade Tube uses a bespoke visible shell and detonates on enemies, cover, or fuse expiry with direct and splash damage. Its retained projectile, fuse, bounce, warning, explosion, and cover assets are suitable for a later arcing/minimum-range refinement without regeneration.

Individual weapons may use different behaviours while sharing the visible ring. Examples include cursor-aimed weapons, automatic target-seeking weapons, orbiting contact weapons, and cooldown-driven support devices. The firing rules must remain understandable; adding more visible guns must not turn player choices into unreadable noise.

### Bottom action bar and cadence strip

Use a compact bottom-centre HUD inspired by action bars, but separate **things the player activates** from **automatic weapon timing**. Showing every auto-firing weapon as a hotkey would falsely imply manual control and would become noisy at high weapon counts.

The bottom HUD has two coordinated bands:

1. **Active action bar — up to four large tiles.** Reserved for the evasive move, hero ultimate, consumable, and an active perk/relic or manual heavy weapon. Default keyboard bindings are `Space`, `R`, `Q`, and `E`; gamepad bindings use face/shoulder controls and always replace the displayed keyboard legend when a controller is active.
2. **Passive cadence strip — compact weapon tiles.** Shows slow automatic attacks, charge cycles, heat, reloads, and periodic perks without assigning a hotkey. Weapons below roughly a 1.5-second base cadence normally omit the sweep and show only exceptional states such as overheated, blocked, or no target. Slow attacks at 2.5, 4, or 16 seconds show a clear recharge sweep so the next volley can be anticipated.

Every cooldown tile uses the same information hierarchy:

- Authored icon and family-colour frame identify the action.
- A clockwise dark radial or vertical shadow sweep shows remaining fraction without hiding the silhouette completely.
- Numeric time appears when more than one second remains: whole seconds at 10 seconds or more, one decimal below 10 seconds. The final second uses a bright rim chase rather than rapidly changing decimals.
- A ready tile removes the shadow, raises contrast, and gives one restrained pulse. It does not continuously flash.
- Charges appear as two or three discrete pips. A disabled/no-target state uses a distinct crossed or desaturated treatment rather than looking like cooldown.
- The binding is live text rendered above the tile, never baked into the art. Hold/toggle/automatic behaviour is communicated with a small runtime glyph.

The bar must remain usable at 1280×720 and safe-area aware. Four active tiles at 56–64 logical pixels plus a compact cadence strip fit without competing with combat. At high weapon counts, the cadence strip groups identical weapons and shows the nearest meaningful fire event rather than rendering twelve large tiles.

Accessibility requirements: cooldown cannot rely on darkness or colour alone; numeric time, edge motion, charge pips, and ready sound/haptics provide redundant cues. Provide settings for numeric cooldowns, ready pulses, weapon-cadence strip visibility, and reduced HUD motion.

### Top-left temporary-status tray

Temporary effects that are already active belong in a compact tray beneath or beside the top-left health/status panel. They are not actions and must not occupy hotkey slots.

- Each effect uses a 36–44 pixel authored icon inside a code-rendered circular timer ring.
- A dark clockwise radial wipe communicates elapsed fraction while leaving the centre motif readable. A bright outer arc shows remaining fraction for high-contrast and colour-blind readability.
- Remaining time is centred on or immediately below the icon. Timers under 20 seconds show one decimal (`15.4`); longer timers show whole seconds. The number disappears at expiry rather than displaying a lingering `0.0`.
- At three seconds remaining, the rim changes to a restrained warning pulse and the timer gains contrast. Reduced-motion mode changes only the rim colour/weight and never pulses.
- Hover, focus, or controller inspection shows the effect name, exact modifier, source, and stacking rule. The normal combat view shows icon plus time only.
- New effects append left-to-right, then wrap to a second row. Identical effects occupy one slot; they never create duplicate icons.
- Positive buffs and negative conditions use separate frame treatments so a helpful pickup cannot be confused with poison, slow, or a boss mark.

Source behavior is explicit:

- An instant pickup becomes a top-left timed icon immediately.
- A consumable kit remains on the bottom active bar until used, then its activated effect moves to the top-left tray.
- A timed shrine blessing uses the top-left tray. A wave-long effect may show `WAVE` instead of seconds. A run-long relic, permanent loadout modifier, or shrine bargain belongs in the passive build/inventory presentation and does not pretend to be temporary.
- Picking up the same non-stacking buff refreshes its timer to at least the full base duration; it does not add duration or magnitude unless the effect explicitly says it stacks. Separate compatible buffs may run simultaneously.

The prototype now implements this contract: temporary effects occupy a six-slot top-left tray with authored icons, code-rendered circular remaining-time rings, tenths-of-a-second countdowns, final-three-second urgency, wrapping, and clean expiry. `?loadout=patrol&kit=uranium` exposes the ready consumable; `?loadout=patrol&buff=uranium` exposes the active timed state.

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

### Defensive and offensive statistics

Heroes and enemies share one data-driven stat model (implemented 16 July 2026):

- **Health** plus a **shield** pool absorbed before armour and health; shields recharge after a no-damage delay.
- Two armour stats by design: **Armour** is percentage reduction with diminishing returns (`armour / (armour + 15)`, ~6% per early point, Warcraft/Brotato style, always worth stacking on large health pools); **flat damage reduction** subtracts after the percentage step with a 1-damage floor and is deliberately rarer — reserved for specific builds and units.
- **Slow resistance**, **attack speed multiplier**, and **hit invulnerability duration** (the post-hit protection window, e.g. Marine 0.65 s) are per-hero stats.
- **Weapon proficiencies** (light/medium/heavy/unique classes) and **mineral find %** are reserved schema fields; they activate only when the weapon catalogue and a currency loop respectively make them meaningful.

### Damage types

Five damage types — Physical, Fire, Shock, Cryo, Toxic — where each elemental type builds a status effect (Blaze, Overload, Freeze, Corrode) at a buildup threshold instead of introducing a second named damage tier. Enemies carry per-type resistance multipliers. Mini-bosses resist hard control but not damage-over-time statuses. Chaos/space is not a damage type; exotic behaviour is the signature of Unique weapons. Details live in `last-bastion-content.md`.

### Upgrade levels and elemental paths

Implemented 17 July 2026. Every upgrade is leveled: choosing it again advances it to the next level with a defined effect, so a repeated offer is always a real choice, and the offer card shows the level being bought ("Chain Lightning II") with that level's description. Rules:

- Upgrades stop being offered at their maximum level (most cap at 2–4).
- The two damage-conversion paths are **mutually exclusive**: committing to Incendiary locks out Cryo Coating for the run and vice versa. Choosing an elemental identity is the core build decision.
- Elemental levels advance the *mechanic*, not just a number:
  - **Incendiary Rounds** — I: weapons convert to Fire; II: ignite 20% more often and Blaze burns hotter; III: blazing aliens detonate on death, spreading fire (chain-reaction clears).
  - **Cryo Coating** — I: weapons convert to Cryo; II: freeze 20% more often and freeze slows harder; III: freezes last longer and nearly halt aliens.
  - **Chain Lightning** — each level adds one arc *and* a small shock-buildup bonus from level II; every additional bounce carries less energy (70%, 49%, 34%…), so more bounces means wider but softer coverage.
- The nine remaining upgrades stack their stated effect per level (fire rate, projectiles, pierce, explosion size and splash, damage trade-off, magnet, move speed, armour, shield).

This gives three recognisable archetype families out of one pool — burn-spread, freeze-control, and storm-chain — on top of the physical stat builds, which is the variety-and-skill requirement the level-up screen must satisfy.

### Categorized upgrade slots

Implemented 17 July 2026. Builds are constrained by breadth, not just offer luck:

- Every upgrade belongs to a **category**: Offensive, Defensive, Support, or Scavenger (Logistics and further categories join when the catalogue can populate them). Offer cards show the category.
- Each hero starts with **6–8 slots** distributed by identity. The Marine is balanced: 3 Offensive, 2 Defensive, 1 Support, 1 Scavenger (7 total). The Medic will lean Support and the Assault Offensive when they arrive.
- A **new** upgrade consumes a slot in its category; **leveling an owned upgrade never does**. Once a category is full, no new upgrades from it are offered — you can no longer simply take the best thing on every card, you deepen what you committed to.
- Slots are earned in-run: **elite upgrade caches now open a Requisition choice** (+1 slot in one of up to three offered categories), making elites the run's slot income. A hard cap of **12 total slots** bounds late-game breadth; at the cap, caches fall back to experience.
- The snapshot exposes used/capacity per category for the HUD, character dossier, and run summary.

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

The functional mini-boss is the Siege Crusher. Its four-direction production sheet exposes stalk, charge, sweep, and slam presentation; its portrait appears in the dedicated boss bar. It chooses between a telegraphed charge and broad claw sweep, damages cover on impact, and gains a radial shockwave slam below 50% health. At 20% it enters a faster, harder-hitting frenzy with shorter tells and recovery while preserving readable telegraphs. Defeat guarantees an arsenal cache that heals and supplies two upgrade thresholds.

The seeded five-wave mini-boss pool also contains the mechanically complete Brood Warden. It cycles a guarding cleave, acid projectile fan, and capped egg placement, then unlocks a one-time swarm rush at 50% health. The final 20% accelerates its movement and timings and increases attack volume without removing windups. Its production body sheet, portrait, projectile, attack effects, enrage state, and defeat burst are integrated through reusable manifest contracts; the deterministic review route exposes the complete encounter.

The Bastion Eater final-boss lab implements three deterministic phases. Breach alternates locked claw lanes and cover-breaking charges. Brood anchors for capped egg growth and a biomass-tendril ring with a safe inner pocket. Last Stand accelerates readable combinations and places expanding breach zones at locked targets without ever covering the whole arena. Its armoured nodes reduce damage between attacks; recovery exposes the cyan node crown for full damage. Production Asset Batch D3 supplies the 192-pixel phase body, closed/exposed node states, attack effects, breach decals, portrait, defeat, and victory-vault presentation. Defeat transitions directly to victory rather than dropping an unusable current-run reward.

### Web MVP

- Three or four complementary standard archetypes
- Elite variants
- One final boss

The exploding Blast Mite and teleporting Warp Flanker were pulled forward for waves 3–5 and now use production state sheets. The Slime Spitter is the current hostile-projectile enemy; future ranged archetypes require dedicated projectile and impact sprites. Flying, shielding, psychic, summoning, and giant tank enemies remain future content.

The next functional Web MVP enemy is the Ripper, a slower melee bruiser with a locked-direction claw tell, a long frontal cone rather than circular contact damage, and a pronounced recovery window. Its deterministic lab now uses the Production Batch D2 directional pursuit, wind-up, sweep, and exposed-recovery sheet plus authored spawn, sweep, and defeat effects. The exact code-driven cone remains the warning and hit-test authority. It is intentionally excluded from ordinary waves until gameplay-scale timing and dodge-behind readability are accepted.

The Razor Scuttler behavior gate adds a fragile speed interceptor without relying on unavoidable contact damage. It repositions at 3.35 m/s until it reaches a 2.6–7.5 metre launch band, locks a visible lane for 0.48 seconds, and then commits at 9.5 m/s for at most 0.55 seconds. Its direction cannot track after warning begins. The dash can hit once, stops on walls or cover, and always ends in a stationary recovery; a cover crash creates the longest punish window. Production Asset Batch D4 supplies directional pursuit, compressed wind-up, dash, and recovery bodies plus lane accent, launch, trail, player impact, cover crash, miss skid, stagger, and defeat. The exact lane and collision remain code-authoritative. The deterministic `scenario=razor-scuttler` lab exposes warning, dodge, cover collision, miss, and repeat-hit safety pending creator timing/readability review.

The Quillback behavior gate adds a ranged lane controller without adding homing shots. It locks aim during a visible charge and escalates over repeated attacks from one spike to three and then five across a fixed 64-degree fan. Increased projectile count also increases wind-up and recovery. Inside 4.5 metres it retreats instead of firing, while its 4.75-metre firing floor prevents unavoidable point-blank fans. Production Asset Batch E1 supplies directional positioning, charged wind-up, and exposed-recovery body frames plus separate rotated spike projectiles, launch accents, cover/flesh impacts, and defeat presentation. Exact code-driven warning lines and projectile paths remain authoritative.

The Spinewheel behavior gate adds deterministic ricochet pressure. It captures one heading at the start of a visible 0.70-second warning, rolls at 7 m/s, reflects from arena boundaries and surviving cover, and loses 15% speed on each of two allowed rebounds. A 0.75-second per-Spinewheel repeat-hit lockout prevents overlapping multi-hit damage, while a 1.50-second recovery creates the punish window. A dedicated `scenario=spinewheel` lab exposes the warning line, rebound count, wall/cover interaction, impact feedback, and recovery. Production Asset Batch E2 supplies directional positioning, compressed wind-up, exposed-recovery frames, a separate four-phase closed-shell spin, rolling trail, rebounds, impact, recovery, and defeat effects. Exact heading and reflection geometry remain code-driven.

The Tether Bloom behavior gate adds non-damaging forced movement without taking control away from the player. A rooted Bloom acquires only within 3.5 metres and with clear line-of-sight, locks the target through a visible 0.70-second warning, then adds a 1.15 m/s pull for up to 1.8 seconds while movement, aiming, and firing remain available. Cover or exceeding the hard 5-metre range severs the line. Dodge/roll breaks it immediately, as does dealing 28 post-mitigation damage during the grab. Only one Bloom may reserve or control the Marine at once, and every success, failure, or break incurs a 3.2-second recovery. Production Asset Batch E3 supplies four-phase idle, acquisition, channel, and exhausted-recovery body animation plus dedicated acquisition, target, latch, travelling-tether, sever, recovery, and defeat effects. Exact line-of-sight, tether, target, cover, range, pull, and break geometry remain code-driven. It remains out of normal waves pending review.

The vertical-slice arena is 45 × 25.3125 metres—1.5 times the original viewport in each dimension—and uses smooth camera follow with a dead zone. The entire battlefield is no longer visible at once. Future arenas should usually range from roughly 1.4× to 2× the gameplay viewport unless a deliberately compact encounter needs full visibility.

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

The vertical slice's signature interaction is implemented (16 July 2026): a **power switch that energizes an electrical fence**. Pressing interact at the authored Batch C switch activates the pylon beam for six seconds; enemies crossing it take continuous Shock damage that builds toward an Overload stun, and the switch then recharges.

Other candidate interactions remain future content:

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
