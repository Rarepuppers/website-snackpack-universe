# Last Bastion — Brotato-style shop, economy & stat overhaul (plan)

Creator-directed pivot, scoped 24 July 2026. This is the reference plan for turning
Last Bastion's build progression into a Brotato-shaped loop: a shop after every node,
a rich item economy with positive **and** negative stat trade-offs, weapons bought to
fill slots, and scrap as the central currency. Both Claude and Codex treat this as the
authoritative plan for the overhaul; append status to `last-bastion-log.md` as phases land.

## Two decisions locked by the creator (24 July 2026)

1. **Keep the expedition map; pop a shop after every cleared node.** Do *not* flatten to a
   linear Brotato ladder — the branching map and the Phase 2/3 shrine/event catalogue stay.
   The regular scrap shop is the default post-combat shop; special shops are liberation-fight
   nodes (below).
2. **Full unified player-stat vector, migrated incrementally.** Build one `PlayerStatBlock` as
   the single source of truth and migrate the five existing modifier systems onto it over time,
   rather than bolting on a sixth parallel item-stats bag.

## Why this is mostly consolidation, not green-field

The starting point is further along than it looks:

- **A between-wave shop already exists** — `openScrapShopVisit()` → `buildScrapShopDecision()`
  in `CombatSimulation.ts`. It draws 3 offers from `buildScrapShopCandidates()` (field repair,
  uranium kit, armour retrofit, eligible upgrades, Tier-I weapons under `MAX_EQUIPPED_WEAPONS`),
  and already supports **lock + one paid reroll + sell**, with `shopMode: "offers" | "manage" | "sell"`.
  Prices are a flat `SCRAP_SHOP_PRICES` table; reroll cost is `scrapShopRerollCost(depth)`; weapon
  resale is `scrapShopWeaponSaleValue(tier)`.
- **Five separate build systems**, each a flat bag read at its own combat sites, with no shared
  stat vocabulary:
  - `PerkRunModifiers` (`perks/perkCatalog.ts`): startingLevel, weaponSaleFraction,
    inventoryBonusSlots, earlyExperienceMultiplier, mergeDamageMultiplier, lowHealthDamageMultiplier,
    mapRevealBonusColumns.
  - `RelicRunModifiers` (`content/relicCatalog.ts`): ~20 fields, mostly behavioural hooks plus a few
    numerics (scrapMultiplier, lifestealPerKill, berserkerMaxBonusDamage, shieldRecharge*, explosionRadius…).
  - `TransformationRunModifiers` (`transformations/TransformationRunModifiers.ts`): 14 wired metrics
    (maxHealthMultiplier, movementSpeedMultiplier, armourBonus, maxShieldBonus, shieldRechargeMultiplier,
    fireRateMultiplier, explosionRadiusMultiplier, ultimateCooldownMultiplier, healingReceivedMultiplier,
    pickupRadiusMultiplier, regenerationPerSecondBonus, long/close-range damage, heavyWeaponDamage).
  - **Upgrade effects** (`content/upgradeCatalog.ts`, 12 upgrades applied via a switch in
    `CombatSimulation`): move speed, armour, max shield, status tuning, explosion splash, magnet, etc.
  - **Hero base `DefenceProfile`** (`stats/DefenceStats.ts`) + `levelGrowth`. Note `DefenceProfile`
    already carries a **reserved `mineralFindPercent` (100 = baseline)** — a scrap-gain hook with no
    consumer yet. That is the harvesting/scrap stat's future home.
- **The stat surface is ~half of Brotato's.** Present: max HP, armour, flat damage reduction, max
  shield, attack-speed %, move-speed %, slow resistance, per-class weapon proficiency, an evasive
  dash, per-**kill** lifesteal. **Absent: crit (chance + multiplier), a global %-damage stat, the
  melee / ranged / elemental damage buckets, % dodge, luck, curse, harvesting/scrap-gain,
  engineering, and %-of-damage lifesteal** — precisely the stats every Brotato item modifies.
- **Weapons have no crit fields and no damage-type damage buckets.** `weaponDamageMultiplier(weaponClass)`
  is per-class only. Crit and the melee/ranged/elemental split must be added to the weapon-damage math.
- **Mini-bosses don't scale.** Elites run through `waveScaling(wave, type, {elite:true})`
  (speed/damage/armour/shield/health all scale). Mini-bosses (`spawnMiniBoss`) are pinned at
  `movementSpeedMultiplier = 1`, `damageMultiplier = 1`, and catalog-fixed `radiusMetres` — so late-game
  they are the *least* threatening thing, the opposite of "challenging and rewarding".

## Phase 1 — the unified `PlayerStatBlock` (the enabler)

Single source of truth combat reads once, that every source folds into. New module, e.g.
`stats/PlayerStatBlock.ts`:

- A flat resolved block with the full superset: existing defensive/offensive stats **plus** the
  missing Brotato ones — `percentDamage`, `meleeDamagePercent`, `rangedDamagePercent`,
  `elementalDamagePercent`, `critChance`, `critMultiplier`, `dodgePercent`, `lifestealPercent`
  (%-of-damage-dealt heal), `rangePercent`, `hpRegenPerSecond`, `maxHpFlatBonus`, `maxHpPercent`,
  `luck`, `curse`, `harvesting`/`scrapGainPercent`, `engineering`.
- `resolvePlayerStats(sources)` folds hero base + level growth + perks + relics + transformations +
  upgrades + **items** into one block. Additive stats sum; multiplicative stats multiply; guard rails
  (floors) as `RelicRunModifiers`/`TransformationRunModifiers` already do.
- **Migration is incremental and non-breaking:** stand the block up, keep every existing resolver
  producing its own bag, and migrate `CombatSimulation` read-sites from the individual bags to
  `this.stats.*` one stat at a time. Each migrated stat gets a test proving the value matches the
  old path before the old read is removed.
- **New weapon-damage math** rides along: add `critChance`/`critMultiplier` roll to the damage sites,
  and route weapon damage through the melee/ranged/elemental bucket (`attackPattern`/`damageType`
  decide which bucket a weapon draws from). Wire `harvesting`/`scrapGainPercent` into `secureScrap`
  via the reserved `mineralFindPercent`.

Player-invisible on its own, but everything after it becomes a data entry.

**Status — first increment landed 24 July 2026** (see `last-bastion-log.md`): `stats/PlayerStatBlock.ts`
(block + `NO_PLAYER_STATS` + `resolvePlayerStats` + `outgoingDamageMultiplier`), `itemStats?` carry hook on
`ExpeditionBuildSnapshot`, `this.playerStats` resolved once at combat construction, and the four damage
stats the brief names (global `damagePercent` + melee/ranged/elemental buckets) plus **crit** (per-hit
roll at all 5 direct-hit sites, RNG-guarded so the replay digest is unchanged) wired end to end and
tested. Purely additive so far — the five existing systems still resolve/read exactly as before.

**Status — Phase 1 combat wiring complete 24 July 2026** (second increment, see log): the survival and
economy stats are now wired end to end too — max HP (flat + %), flat armour, dodge (RNG-guarded),
move/attack speed, HP regen, %-of-damage lifesteal, and harvesting (scrap gain). Every combat-relevant
stat a Brotato item would touch now flows through `itemStats`. **781 tests pass.** Still reserved/not
wired: `rangePercent` (needs per-weapon range scaling) and `luck`/`curse`/`engineering` (shop-side, land
with Phase 2). **Deferred cleanup:** the five legacy modifier systems still resolve/read in parallel;
folding their numerics onto the block and retiring the duplicate reads is a later pass — the vector is the
single source of truth for *new* stats today, not yet the *only* source for old ones.

## Phase 2 — item catalog + shop expansion

- `ItemDefinition { id, name, rarity, price, tags, statModifiers: Partial<PlayerStatBlock>, effects? }`.
  Rarity (common / uncommon / rare / legendary / cursed) gates appearance rate (bent by luck/curse)
  and price. Behavioural `effects` reuse the same hook shape relics already use.
- **Trade-off items become trivial** once the vector exists: `+15% damage / −10% attack speed`,
  `+3 armor / −8% speed`, `+20 max HP / −15% damage`, `convert 5 max HP → +2 melee damage`, elemental
  vs. physical specialisation items, range-for-damage, etc. — positive **and** negative, Brotato-style.
- **Shop expansion** on top of the existing `buildScrapShopDecision`: 4 offers (from 3), add **ban**
  (the one Brotato shop verb currently missing alongside lock+reroll), item purchases feeding the stat
  vector, weapon purchases emphasising **fill-your-6-slots** and buy-duplicates-to-merge (the merge/tier
  system already exists), sell/recycle for scrap.
- Relics/artifacts become the rare behavioural tier of shop stock, mechanically unchanged.

## Phase 3 — the loop + level-ups on the shared vocabulary

- **Shop after every cleared node** (decision locked): after any combat node resolves, auto-open the
  scrap shop before advancing on the map. Hooks the existing `openScrapShopVisit` into the
  node-completion path (`ExpeditionRun.completeCurrentNode` / the scene flow), not just quick-drop.
- **Level-ups keep the stat-card choice**, redrawn from the unified vocabulary (the reference
  screenshots show body-part cards → Harvesting / Crit / Ranged Damage / Engineering). Small permanent
  stat bumps into the same `PlayerStatBlock` — this is how "level-ups lean into the shop system": one
  shared stat language across level-up, shop, upgrades, relics.

## Phase 4 — special shops as liberation-fight nodes

Special shops are gated behind a normal wave you clear to free the location, then open with themed
premium stock. Reuse existing content as the stock; the fight is the new part (reuse
`buildBudgetDensityWave`). New/repurposed `ExpeditionNodeType`s:

| Liberation node | Opens | Reuses |
| --- | --- | --- |
| Blacksmith | weapon shop: buy / merge / tier-up weapons | weapon inventory + merge (tiers 1–3) |
| Science Lab | upgrades + augments | upgrade catalog + Cyborg affinity |
| Bio Lab | mutations / organic items | Mutagenic + Alien transformation |
| Church of the Designed Arrival | doctrine / faith items, curse↔blessing trades | Cultist path (Phase 3 transformation) |
| Black Market | HP-as-currency shop | already built as a Phase 3 event |
| Special Merchant | rare relics / artifacts | relic / artifact catalog |

## Phase 5 — difficulty pass (elites / mini-bosses / boss)

- **Elite & mini-boss liberation fights:** raise `threatBudget` + `liveCap` for those encounter types
  (`DensityDirector` / `buildBudgetDensityWave`) → denser accompanying swarms, more dangerous.
- **Mini-bosses + boss:** give them `movementSpeedMultiplier > 1` (currently pinned at 1), speed up the
  charge/sweep/slam velocities in their behaviour files, apply `damageMultiplier > 1`, add a **size
  multiplier** to `radiusMetres` (bigger hitbox **and** sprite = menace), and make mini-bosses
  **wave-scale like elites do** (they currently do not). Bigger reward: guaranteed item/relic + scrap.
  Their existing windup telegraphs are what keep faster+bigger+harder fair rather than cheap.

## Economy notes

Scrap becomes the universal currency: kills + wave-clears + the new harvesting/scrap-gain stat all feed
it (via the reserved `mineralFindPercent`); bump base yield so purchases feel frequent. Prices scale by
wave × rarity; reroll / lock / ban costs; sell/recycle values. Rewards of scrap are now the primary
between-fight payout, so combat-scrap sources and the harvesting stat both matter.

## Sequencing intent

Stat vector first (nothing visible, but makes everything after cheap), then the item catalog + shop
verbs, then the loop + level-up integration, then the special-shop liberation nodes, then the difficulty
pass. Each phase is behaviour-first + tested; art/UX briefs to Codex as usual.
