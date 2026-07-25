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

**Status — Phase 2 functionally complete 24 July 2026** (increments A + B, see log). Landed:
`content/itemCatalog.ts` with **27 items** across 5 rarities (10 carrying real downsides — Glass Cannon,
Sniper Scope, Bulwark Plating, Overclock Module, the cursed Blood Pact…), `foldItemStats`, purchasable
`shop-item:<id>` offers priced by rarity and drifting +8%/wave of depth, `ownedItemIds` persisted on both
the run build and combat snapshot, `refreshPlayerStats()` making purchases take effect mid-run (armour
reconciled by **delta**, max HP recomputed and healing for the gain), `grantItem()` as the reward path for
events/caches, offer count **3 → 4** (`SCRAP_SHOP_OFFER_COUNT`), and the **ban** verb completing
lock/reroll/ban/sell parity. **800 tests pass.** Deferred: behavioural (non-stat) items, and luck/curse
actually bending rarity draws — the rarity weighting itself is still uniform-random over candidates.

## Phase 3 — the loop + level-ups on the shared vocabulary

Scoped in detail 25 July 2026 after a read of the shop, save and level-up paths. Phase 3 splits into
three increments that must land in this order — **3A is a prerequisite, not a nicety.**

### 3A — fix the item persistence hole (blocker, do first)

**Phase 2's items do not survive a single node transition today.** Every node change is a real
`window.location.href` page load (`game/config.ts:59` boots exactly one scene from `?screen=`), so all
cross-node state has to round-trip through `LocalSaveStore`. `PrototypeScene.expeditionBuildFromSnapshot`
(`scenes/PrototypeScene.ts:4138`) *does* write `ownedItemIds` into the build, but `LocalSaveStore` has
**zero references to `ownedItemIds` or `itemStats`** — `ExpeditionSave["build"]` (`save/LocalSaveStore.ts:71`)
does not declare them and `readBuild()` (`:362`) rebuilds the build field-by-field, so both are silently
dropped on the next page load. An item bought at the column-3 shop is gone by column 4. A shop at every
node multiplies that by eight, so this lands first.

- Add `ownedItemIds?: readonly string[]` and `itemStats?: Partial<PlayerStatBlock>` to
  `ExpeditionSave["build"]`, and read them in `readBuild` — follow the existing `readBuildRewards()`
  (`:395`) sanitising pattern: filter `ownedItemIds` through `isItemId` (`content/itemCatalog.ts:96`),
  and clamp `itemStats` to finite numbers on keys present in `NO_PLAYER_STATS` (`ITEM_STAT_KEYS`,
  `itemCatalog.ts:120`, is exactly the whitelist).
- `expeditionBuildFromSnapshot` must also start carrying `itemStats` (it carries neither `itemStats`
  nor `carriedConsumables` nor `bonusLifestealPerKill` today) — 3C needs `itemStats` as the carrier for
  level-up stat grants.
- Bump `SaveData.version` 9 → 10. Keep the degrade-to-null contract: absent fields simply omit, so
  v9 saves round-trip unchanged.
- **Persist shop bans.** `shopBannedIds` (`combat/CombatSimulation.ts:1283`) is documented as
  "never restocks for the rest of this run" but lives only on the sim instance, so it is really
  per-node. With eight shops that becomes very visible — carry it on the build snapshot + save
  alongside `ownedItemIds`. Lock and reroll stay per-visit (offers are redrawn each node anyway).

### 3B — a shop after every cleared node

The gate is one function. `finishExpeditionWave` (`CombatSimulation.ts:7939`) already queues
`openScrapShopVisit()` before flipping `status = "victory"`, but only when
`campaignOffersShop(encounter.column)` — and `CAMPAIGN_SHOP_COLUMNS = [3, 5]`
(`expedition/CampaignTuning.ts:9`) means **exactly two shops per run**. Safe nodes (supply-depot /
weapon-cache) route through the same `finishExpeditionWave`, so widening the gate covers them for free.

- Re-key the gate on **node type** rather than column: `campaignOffersShop(type, column)` → true for
  every node except `boss` (the boss node navigates straight to `?screen=summary`, so a shop there is
  dead UI). Shrine/Event nodes bypass combat entirely via `ExpeditionEventScene.commitOutcome`
  (`:147`) and are out of scope for 3B — they keep their own reward flow.
- `projectCampaignRoutes` (`CampaignTuning.ts:57`) uses the same predicate for route projection, so it
  updates in lockstep; `CampaignTuning.test.ts:22-26` asserts `route.shopVisits === CAMPAIGN_SHOP_COLUMNS.length`
  and becomes the affordability guard instead (see below).
- **Economy re-tune.** Eight shops on two shops' worth of income is a shop full of things you cannot
  buy. Guaranteed node-clear income is `15 + 5*column` for combat/elite (`campaignNodeClearScrap`,
  `CampaignTuning.ts:18`), ≈210 scrap across a full route, against common items at 15 and rare at 55
  (`ITEM_RARITY_BASE_PRICE`) drifting +8%/wave (`itemPrice`, `CombatSimulation.ts:2773`). Rather than
  guess, make the projection assert it: extend `CampaignRouteProjection` with a
  `scrapPerShopVisit` figure and let `CampaignTuning.test.ts` hold the line that every route can afford
  at least one common-tier purchase per visit. Tune `campaignNodeClearScrap` until that passes rather
  than tuning by feel.
- The forced `shop-repair` in offer slot 0 (`drawScrapShopOffers`, `:2780`) already guarantees healing
  when hurt; with a shop everywhere that is now the campaign's *primary* heal source, which is a
  balance improvement, not a regression — but `healingOpportunities` in the route projection needs to
  stop double-counting it against depots.
- **No new scene.** The shop is a decision overlay inside `PrototypeScene.syncDecisionOverlay`
  (`:3859`, `isShop` branch at `:3880`), and the sim hard-freezes while a decision is queued
  (`:1489`). Keeping the hook inside `finishExpeditionWave` means the existing UI, input, art and
  keeper sprite all come along unchanged. Hooking `completeCurrentNode` on the map side instead would
  mean building a decision overlay into `ExpeditionScene`, which has none — explicitly rejected.
- **Known limitation to accept:** a shop opened mid-`PrototypeScene` is not autosaved (the run
  autosaves between encounters only), so closing the tab inside a shop replays the node. Same
  contract as today, just more surface. Not worth mid-fight save plumbing in this phase.

### 3C — level-up stat cards on the shared vocabulary

Today a level-up offers **three upgrade cards** from `content/upgradeCatalog.ts` via
`buildUpgradeDecision()` (`CombatSimulation.ts:2503`) — a deterministic level-indexed scan over
`UPGRADE_ORDER`, no RNG. Those 12 upgrades bypass `PlayerStatBlock` entirely: `applyUpgrade` (`:2265`)
mutates weapon runtime stats and `this.defence` directly. There is no stat choice anywhere. When every
upgrade is maxed or locked, `buildUpgradeDecision` returns `null` and **the level-up is silent** — a
dead end worth closing.

- New `content/levelStatCatalog.ts`:
  `LevelStatCard { id, name, description, statKey: keyof PlayerStatBlock, amount, tag }`, one card per
  stat in the shared vocabulary — Harvesting, Crit Chance, Ranged / Melee / Elemental Damage, Global
  Damage, Max HP, Armour, Move Speed, Attack Speed, Dodge, HP Regen, Lifesteal, Engineering, Luck,
  Range. Small permanent bumps (`+2%` crit, `+4%` ranged, `+3` max HP, `+1` armour…), Brotato-shaped.
  Because `NO_PLAYER_STATS` (`stats/PlayerStatBlock.ts:70`) is the enumeration source for the fold
  loop, any stat in the block is card-eligible with no extra wiring.
- **Where the grants land:** accumulate into `this.baseItemStats`, which
  `resolveCurrentPlayerStats()` (`:2353`) already merges with the item fold before calling
  `resolvePlayerStats`. Then call `refreshPlayerStats()` (`:2369`) — mandatory, because `armourFlat` is
  delta-reconciled against `appliedItemArmour` and max HP is recomputed-and-healed there. `baseItemStats`
  comes from `ExpeditionBuildSnapshot.itemStats`, which 3A makes round-trip, so level picks persist
  across nodes by construction.
- **Cadence — alternate, with stat cards as the fallback.** Odd levels draw upgrade cards, even levels
  draw stat cards; and stat cards also serve whenever `buildUpgradeDecision()` returns `null`, so a
  maxed build never levels into silence again. This keeps the 12 authored upgrades meaningful instead
  of drowning them, and gives the shared stat language a guaranteed slot every other level.
- **Determinism is a hard constraint.** `buildUpgradeDecision` draws **zero** RNG, and the codebase
  deliberately guards `this.random()` call-order against `combat/ReplayFixture.ts` digests (see the
  `rollCritMultiplier` comment, `:3459`). Stat-card selection uses the same deterministic
  level-indexed scan over a `LEVEL_STAT_ORDER`, not a random draw. Luck-weighted card draws are a
  Deferred item precisely because they would perturb the digest.
- **Two double-apply traps to respect:** `applyLevelGrowth()` (`:8444`) already mutates
  `this.defence.armour` by the growth delta, and `refreshPlayerStats` reconciles `armourFlat` against
  `appliedItemArmour` — an armour card must go through the block and let refresh do the reconciliation,
  never touch `defence.armour` directly. And `adrenal-servos` multiplies `this.moveSpeedMultiplier`
  while a move-speed card adds `moveSpeedPercent`; they compose as multiply-then-add, which is fine but
  should be stated so nobody "fixes" it later.
- **UI:** new `DecisionKind` `"level-stat"` and a matching branch in `syncDecisionOverlay` (`:3859`) —
  the shop's two-column card layout is the closest existing shape to the reference screenshots, so
  reuse that geometry rather than the plain text list. `DecisionOption` carries only
  `id/name/description/cost/affordable` today, so add an optional stat-delta field for the card to
  render current-value → new-value through `stats/formatStat.ts` (`formatStat` names "stat cards" as
  its intended consumer). Body-part card art is a Codex brief, not a code blocker — ship on the
  existing panel art first.
- Note `CombatSnapshot.pendingUpgradeChoices` (`:686`) is produced but consumed by nothing; either feed
  the new overlay from it or delete it, don't leave a third parallel surface.

**Status — Phase 3 complete 25 July 2026** (see `last-bastion-log.md`). 3A landed the save-schema v10 shop
carrier (`ownedItemIds` / `itemStats` / `bannedShopIds`) plus a single `SAVE_SCHEMA_VERSION` constant —
this fixed a live bug where **every purchased item was silently dropped at the next node**. 3B re-keyed
`campaignOffersShop` onto the encounter kind (every node but the boss: 2 shops per run → 4–7) and re-tuned
`campaignNodeClearScrap` to `24 + 7·column` / safe nodes 15, so the poorest route clears ~19 scrap per shop
against a 15-scrap common item, guarded by a `scrapPerShopVisit` floor in `CampaignTuning.test.ts`. 3C added
`content/levelStatCatalog.ts` (15 cards over the shared vocabulary) offered as a **mixed draw** — 3 authored
upgrades + 1 stat card in one decision, creator-chosen over the alternating cadence this plan originally
proposed, because alternating would have halved the rate at which the 12 authored upgrades are acquired.
Grants land in `baseItemStats` via `refreshPlayerStats()`, and the all-stat draw closes the old
silent-level-up dead end. **803 tests pass.** Deferred as written below: luck/curse weighting, behavioural
items, `rangePercent`.

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

Implementation shape, given what 3B establishes:

- **The fight is free.** A liberation node is an ordinary encounter whose wave plan comes from
  `buildExpeditionWavePlan` (`expedition/ExpeditionNodeDirector.ts:27`) plus a themed shop instead of
  the standard one. Add the new types to `ExpeditionNodeType` (`expedition/ExpeditionMap.ts:13`) and
  give them budgets in `combatNodeBudgets` (`:18`) and the parallel formula in
  `ExpeditionEncounter.ts:67` — **both**, they are duplicated today and will desync otherwise.
- **Stock filtering is the only new shop code.** `buildScrapShopCandidates` (`CombatSimulation.ts:2702`)
  already assembles every stock line; give it a stock-profile argument (which of
  repair / upgrades / weapons / items / relics are eligible, and a rarity floor) and let the node type
  choose the profile. Themed shops then become a data table, not new systems.
- Because 3B puts an ordinary shop after *every* node, a liberation node's payoff must be the
  **quality** of stock (rarity floor, guaranteed weapon tier-up, relic tier) rather than merely the
  existence of a shop.
- Map generation must place them without starving the ordinary node budget (`ExpeditionMap.ts:54`);
  target at most one or two liberation nodes per route so they stay an event.
- Black Market's HP-as-currency already exists as an event resolution in `EncounterEventCatalog.ts` —
  reuse that pricing path rather than a second implementation.

**Status — Phase 4 complete 25 July 2026** (see `last-bastion-log.md`). Built as **one `"liberation"`
node type carrying a `shopProfileId`**, not the six node types this table implies — six would have
rippled through every type switch, budget table and presentation map for no gain, while one type plus a
data-driven variant keeps the surface small. New `content/shopProfiles.ts` holds all six themed profiles
(Blacksmith / Science Lab / Bio Lab / Church / Black Market / Special Merchant) as stock flags + item-tag
filter + rarity floor + price multiplier; `buildScrapShopCandidates` reads the profile and filters, so a
themed shop is a data row rather than a second shop. Two liberation nodes per chart, each drawing a
distinct profile, placed with no adjacency rule (their fight is ordinary-strength) and paying combat-node
scrap so you can actually afford the stock they open. **812 tests pass.** Deviations from the sketch
above: the rarity floor and tag filter carry the "premium" weight rather than a guaranteed weapon
tier-up, and Black Market is a discount-plus-rarity-floor profile rather than reusing the HP-as-currency
event path — that pricing model stays with the event where it already works.

## Phase 5 — difficulty pass (elites / mini-bosses / boss)

**This is the big one.** Mini-bosses are currently the *least* threatening late-game encounter, and the
cause is two literals.

### The core bug

`spawnMiniBoss` (`CombatSimulation.ts:1851`) calls `spawnEnemy`, which *does* apply
`waveScaling(this.waveIndex + 1, type, { boss: authoredBoss })` (`:1606`) — and then immediately
overwrites every scaled stat with catalog values (`:1856-1864`):

```
enemy.maxHealth = definition.maxHealth;   enemy.armour = definition.armour;
enemy.maxShield = 0;                      enemy.shield = 0;
enemy.movementSpeedMultiplier = 1;        // :1863
enemy.damageMultiplier = 1;               // :1864
```

`spawnElite` (`:1811`) is **structurally identical except it reads from `scaling`** (`:1842-1843`).
That is the entire delta. And the depth signal is already correct at spawn time —
`plan.directorWaveIndex` is assigned to `this.waveIndex` at `:8074` *before* the spawn, so
`spawnMiniBoss` simply ignores information it already has.

### The fix, in dependency order

1. **Give `waveScaling` a `miniBoss` option** (`combat/WaveScaling.ts:12`) with a gentler curve than
   elite — the telegraph windows are what keep these fights fair, so speed must not outrun the tells.
   Proposal: health `1 + 0.18·offset`, speed cap ~1.2 (elite caps at 1.35), damage cap ~1.6, armour
   reusing the elite bonus. Then have `spawnMiniBoss` write from `scaling` exactly as `spawnElite`
   does.
2. **Raise the damage clamp for ranked enemies.** `scaleEnemyHit` (`WaveScaling.ts:36`) hard-clamps
   *every* enemy hit to 5, and several mini-boss baselines already sit at 4.4–5
   (`PLAYER_ATTACK_DAMAGE_BASELINES`, `:999`). Without a rank-aware cap, step 1 buys almost nothing on
   the moves that matter. Make the cap a parameter: 5 for standard, higher for mini-boss/boss.
3. **Fix the `authoredBoss` list** at `:1605` — it names `siege-crusher`, `brood-warden`,
   `rift-stalker`, `abomination-prime`, `bastion-eater` but omits `synapse-herald`, `assembly-prime`
   and `storm-regent`, so three apex kinds briefly take real scaling before being overwritten. Latent
   trap; reconcile it before anything depends on the flag.
4. **Size multiplier.** `radiusMetres` is read live from the frozen catalog at six sites and is never
   stored on `EnemyState`, so there is nothing to scale. Add `EnemyState.radiusScale` (default 1),
   route the six reads through one `enemyRadius(enemy)` helper (`:1608`, `:7169`, `:7206`, `:7240`,
   `:5894`, `:8477`), and expose it on the snapshot. On the render side `styleEnemyView`
   (`PrototypeScene.ts:1815`) short-circuits to `batchJScale ?? miniBossSpriteScale(kind)`, so the body
   sprite will **not** grow unless that branch is multiplied by the same factor —
   `MiniBossPresentation.ts:3` and its `[1.25, 1.45]` bound test need updating together, or the hitbox
   and the silhouette drift apart.
5. **Denser escorts.** Rank waves get `waveLiveCap = max(18, enemies.length + 4)` (`:8103`) and escort
   budgets of ×0.6 (mini-boss) / ×0.8 (elite) in `ExpeditionNodeDirector.ts:45-68`. Raise both, and
   remember `buildBudgetDensityWave` filters mini-boss/boss ranks out of budget waves entirely
   (`DensityDirector.ts:196`) — escorts are ordinary units by design.
6. **Bigger rewards.** Mini-boss/elite scrap is flat 40/15 with no depth term (`:7681-7698`); make it
   scale with column and add a guaranteed item/relic grant via the existing `grantItem()` path
   (`:2341`). **The boss currently drops nothing at all** — it has no `miniBossKind`/`eliteKind`, so it
   falls through every reward branch and just sets `status = "victory"` (`:7718`). Mirror every number
   in `CampaignTuning.ts:55-56` and `:84-88` or `projectCampaignRoutes` desyncs. **Done 25 July 2026**,
   including the guaranteed item drop: `grantWeightedItem()` fires on every mini-boss and boss kill,
   rarity-weighted through the same `luck`/`curse` curve the shop uses.

### Explicit non-goal

**Do not compress the telegraphs.** `TelegraphRules.ts:25-32` and the inline `[a,b,c][tier]` windup
arrays have no multiplier hook, and that is the right call: faster + bigger + harder stays fair
*because* the tells stay readable. Adding a windup-compression knob is how this pass turns cheap.

**Status — Phase 5 complete 25 July 2026** (see `last-bastion-log.md`; taken before Phase 4 because it is
self-contained and it was the live problem). `waveScaling` gained a **`miniBoss`** curve — deliberately
gentler than elite (speed cap 1.2 vs 1.35, damage cap 1.6 vs 3) so it can never outrun the fixed
telegraphs — plus a `radiusMultiplier`. `spawnMiniBoss` now writes from that scaling exactly as
`spawnElite` does, replacing the two pinned `= 1` literals. `scaleEnemyHit` takes a cap argument
(`ENEMY_HIT_CAP` 5, `RANKED_ENEMY_HIT_CAP` 8) because several mini-boss baselines already sat at 4.4–5 and
would otherwise have had their scaling clamped away. Size landed as `EnemyState.radiusScale` behind a new
`enemyRadius()` helper covering all eleven per-entity radius reads, mirrored onto the sprite in
`styleEnemyView` so hitbox and silhouette can't drift. The `authoredBoss` list — which silently omitted
three apex kinds — is now `isMiniBossKind()` over a `MINI_BOSS_KINDS` array. Escorts: elite ×0.8 → ×0.9,
mini-boss ×0.6 → ×0.75, rank-wave `liveCap` 18 → 26. Rewards: `rankDefeatScrap(base, depth)` lives in
`CampaignTuning` (so combat and the route projection share one formula), and **the boss now pays out at
all** — it previously fell through every reward branch. **807 tests pass.** Not done: the guaranteed
item/relic grant on a rank kill, and the per-behaviour velocity constants (charge/lunge speeds) are still
authored flat — the shared `movementSpeedMultiplier` covers them, which was the point.

## Deferred

- ~~**`luck` / `curse` bending rarity draws.**~~ **Done 25 July 2026.** The stated blocker — "this
  changes `this.random()` call order and will invalidate `ReplayFixture` digests" — turned out not to
  hold: the uniform draw spent **exactly one `random()` per offer**, and a cumulative-weight pick spends
  one too. Changing *which* candidate is picked is safe; only changing *how many* draws happen is not.
  `rarityDrawWeight(rarity, luck, curse)` + `NON_ITEM_DRAW_WEIGHT` live in `content/shopProfiles.ts`;
  `shopOfferDrawWeight` maps an offer id to its weight. Measured over 400 seeded shops: neutral gives a
  clean descending curve (394/205/76/9 common→legendary, where it was flat); luck 150 lifts legendaries
  ~11x and rares ~3.7x while leaving commons untouched (luck is applied per rarity *rank*); curse 100
  collapses good stock (legendary 9→0, rare 76→8) while raising cursed stock 24→40 — a genuine
  trade-off knob. **The claim that `buildWeaponChestDecision` and `buildSlotRequisitionDecision`
  "deserve the same treatment" is withdrawn** — it was written without checking the data. Weapons carry
  no rarity, only `weaponClass`, and all 8 entries in `WEAPON_CHEST_POOL` are light/medium/heavy peers
  with no `unique` among them; the slot draw picks between four upgrade *categories*. Neither has a
  rarity dimension for luck to bend, so weighting them would mean inventing a distinction the data does
  not have. They stay uniform deliberately.
- **Behavioural (non-stat) items** — `ItemDefinition.effects` reusing the relic hook shape; no items
  use it yet.
- **`rangePercent`** — still unwired, needs per-weapon range scaling.
- **`engineering`** — wired as a stat but no turret/structure item exists to consume it.
- ~~**`mineralFindPercent`**~~ **Retired 25 July 2026** — removed from `DefenceProfile` and both hero
  definitions. It had zero read-sites and duplicated `harvestingPercent`, which is the live scrap-gain
  stat read in `secureScrap`.
- **Legacy modifier cleanup** — the five pre-existing systems still resolve and read in parallel with
  the block; `resolvePlayerStats` treats `perk` / `relic` / `transformation` as inert no-op seams
  (`PlayerStatBlock.ts:115-129`). Folding their numerics onto the block is a later pass.

## Economy notes

Scrap becomes the universal currency: kills + wave-clears + the new harvesting/scrap-gain stat all feed
it (via the reserved `mineralFindPercent`); bump base yield so purchases feel frequent. Prices scale by
wave × rarity; reroll / lock / ban costs; sell/recycle values. Rewards of scrap are now the primary
between-fight payout, so combat-scrap sources and the harvesting stat both matter.

## Sequencing intent

Stat vector first (nothing visible, but makes everything after cheap), then the item catalog + shop
verbs, then the loop + level-up integration, then the special-shop liberation nodes, then the difficulty
pass. Each phase is behaviour-first + tested; art/UX briefs to Codex as usual.

**Testing posture (creator direction, 25 July 2026):** keep the suite lean from here — a small number of
high-value tests per increment (the persistence round-trip, the shop-per-node gate, the route
affordability guard, the mini-boss scaling delta), **not** a test per stat or per catalogue entry. The
suite is already at ~800 tests; Phases 3–5 should add tens, not hundreds.

