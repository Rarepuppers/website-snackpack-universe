# Last Bastion — weapon release + content expansion plan

> **STATUS — SUPERSEDED, 31 July 2026.** Historical. Every "current state" number below is
> now wrong, and its proposals shipped.
>
> - All four asks are answered. Weapons: 21 → **29** (28 draftable + Event Horizon earned);
>   the seven added on 31 July closed the elemental matrix. Items **47**, relics **14**,
>   artifacts 12, world objects **29**.
> - Sentry Stake shipped as the first `deployable`, which gave the `engineering` stat the
>   consumer it had been reserved for; Corrosive Lobber and Rime Cleaver shipped as designed.
> - Breacher's Wedge and Coolant Loop shipped. So did Structural Pillar and Scrap Seam.
> - The §2.5 powerup bug was worse than recorded: not only were 4 of 12 consumables absent
>   from the wave cycle, the cycle restarted at index 0 every node, so the campaign could
>   only ever reach the first four. Both halves are fixed.
> - `WorldObjectCatalog` is no longer dead data — placement, hazards, and the interaction
>   verb are all live.
>
> **Still open from this doc:** the 4-slot rack question (now 4 slots against 28 draftable
> weapons — weapon-chest banish/reroll remains the recommended answer, and is unbuilt), and
> the deferred shield pylons / escape lifts / hostile turret emplacements.
>
> Kept for its design rationale. For current state read `dev/src/game/`; for what to build
> next read `README.md`.

Scoped 26 July 2026. Four asks: (1) make every weapon playable, (2) decide whether more
weapons/items/artifacts/consumables are warranted, (3) design the remaining big world objects,
(4) collect the other improvements worth doing alongside.

Current state *(as scoped, 26 July — see STATUS above)*: 21 weapons authored, **8 obtainable**.
26 shop items, 9 relics, 12 artifacts, 12 consumables. `WorldObjectCatalog` has 24 entries and
is imported by nothing but its own test.

---

## Part 1 — Release all 21 weapons (the actual ask)

### 1.1 The flip itself

`content/weaponCatalog.ts:517` — `HELD_WEAPONS_IN_POOL = false` → `true`. Pool goes 8 → 20.
That single constant feeds both acquisition routes (`buildWeaponChestDecision`
`CombatSimulation.ts:2872` and the shop weapon line `:3027`), so nothing else is needed to make
the 12 held weapons obtainable. Update the comment block, which currently says "flip when the art
lands" — the creator decision has changed and the doc should say so rather than look like a slip.

Standing project rule was "no placeholder art ships" (25 July). This flip overrides it for weapons.
The cost is tile/silhouette fidelity, not function — §1.3 keeps that cost small.

### 1.2 Event Horizon needs a real Unique path

`UNIQUE_SLOT_WEAPONS` is held separately and correctly: it is `weaponClass: "unique"`, and there is
no unique-slot concept anywhere except `WeaponClass` proficiency (`hero/HeroDefinition.ts:5`).
Dropping it into the ordinary chest would make a 16s-cooldown gravity well a wave-2 common.

Recommended path — **earned, not random**:

- Add `weaponPoolFor(options: { uniqueUnlocked: boolean })` to `weaponCatalog.ts`, returning
  `[...LIVE_WEAPONS, ...(HELD_WEAPONS_IN_POOL ? HELD_WEAPONS : []), ...(uniqueUnlocked ? UNIQUE_SLOT_WEAPONS : [])]`.
  Both call sites read the function, so chest and shop can never disagree — the current duplicated
  `WEAPON_CHEST_POOL.filter(...)` at two sites is exactly how they would drift.
- `uniqueUnlocked` becomes true after the run's **first mini-boss or boss kill**. The sim already
  tracks ranked kills (the rank-kill item grant), so this is a boolean set at that site.
- Shop price for a unique: `SCRAP_SHOP_PRICES.weapon × 3`. It should be a real decision against a
  tier-up.
- Keep `WEAPON_CHEST_POOL` exported as the base pool so existing importers keep compiling.

### 1.3 Readability stopgap — the part that makes them *playable*, not merely obtainable

Flipping alone means **13 of 21 weapons render as the Bastion Service Rifle in the weapon ring**
(`scenes/PrototypeScene.ts:4345`, `weaponAssetId` falls through to `service-rifle-v1`) and share
one of two HUD tiles (`ui/WeaponTileFrames.ts` — 7 weapons on frame 7, 6 on frame 1). A player
running Flamethrower + Sawblade + Machete would see three identical rifles. Cheap fixes, no art:

- `weaponColor` (`PrototypeScene.ts:4323`) — `default:` currently returns ivory. Return the
  `DAMAGE_TYPE_COLOURS` entry for the weapon's damage type instead. Instantly separates fire /
  shock / cryo / toxic tools.
- `canonicalWeaponTileFrame` — map the unassigned 13 by **attack pattern** rather than one shared
  slot: melee-sweep → 1 (blade), beam/orbit/orbit-blade → the closest existing motif, projectile →
  7. Same placeholder budget, far better grouping.
- `ui/CooldownPresentation.ts` — extend the two-letter code switch to all 21 ids (`FA`, `PS`, `BM`,
  `SB`, `CK`, `MC`, `RS`, `SS`, `CL`, `TC`, `FT`, `SW`, `EH`). This is the only per-weapon text the
  HUD has and it costs nothing.
- Make `weaponAssetId` an explicit `Record<WeaponId, …>` with the rifle as a *named* fallback rather
  than an if-chain that silently swallows every new id. Adding weapon 22 should be a type error, not
  a rifle.

### 1.4 Balance regression the flip introduces

`buildScrapShopCandidates` pushes **one candidate per unowned weapon**. At 8 weapons that is at most
7 entries in the draw; at 20 it is up to 19, against ~26 item candidates. The rarity-weighted draw
(`:3070`) has no per-category cap, so weapon offers will visibly crowd items out of a 5-offer shop —
the Brotato economy's whole texture.

**Fix as part of the flip:** seeded-sample the weapon candidates down to 2–3 per shop visit before
they enter the draw. Note the RNG-stream warning already in that function: the number of `random()`
calls is part of the replay digest, so sample with a fixed call count, and expect
`ReplayFixture.test.ts` to need a regenerated digest.

### 1.5 Tests and verification

- `content/weaponCatalog.test.ts:52` asserts `event-horizon` is not in the pool — restate as "not in
  the base pool; present once unique is unlocked".
- `expedition/CampaignTuning.test.ts:50` is already parametrised on the constant (`20 : 8`) and
  passes either way. Good.
- `combat/MeleeWeapons.test.ts` covers the six close-quarters entries; add one integration test that
  a chest drawn with the gate open can offer a held weapon and that equipping it fires.
- `CAMPAIGN_REFERENCE_BUILDS` (`CampaignTuning.ts:160`) is three builds from the live eight. Add a
  fourth — a melee/close-quarters reference — or the campaign pacing model keeps projecting only
  ranged DPS against a rack that is now half melee.
- `content/codexDrift.test.ts` cross-checks catalogues against the codex both ways. It will flag the
  newly-live weapons unless their codex entries move off `concept`/`designed`. Budget for that copy.
- `npm run typecheck` + `npx vitest run` in `dev/`, then a browser pass: `PrototypeScene.ts:4049`
  parses a `?weapons=` route, so each new weapon can be booted directly for a screenshot.

---

## Part 2 — More weapons, items, artifacts, consumables?

**Recommendation: no new weapons beyond three, no new artifacts, yes to a narrow item pass.**
The rack is not short of entries; it is short of *distinct art and distinct roles*. Adding a 22nd
weapon while 13 render as the same rifle makes the rack worse, not richer. The three below are
proposed only because each fills a hole that no existing entry covers.

### 2.1 Weapons — three, each justified by an empty cell

| Proposal | Fills | Cost |
| --- | --- | --- |
| **Sentry Stake** — deployable auto-turret, fires while you kite | The rack has **no deployable**. Also the only thing that would give the `engineering` stat a consumer, which un-blocks the disabled `lvl-engineering` card (`levelStatCatalog.ts:60`) | New `attackPattern: "deployable"` + lifetime/placement in sim. The one real build. |
| **Corrosive Lobber** — arcing shell leaving a toxic puddle | Toxic is one weapon (Injector Carbine, single-target flechettes). No toxic area denial exists at all. | Data-only — reuses `explosionRadiusMetres` + the existing hazard-puddle shape. |
| **Rime Cleaver** — cryo melee, freeze on contact | Cryo is one weapon (Cryo Lance, a beam). Melee builds cannot access freeze. | Pure data, same as the six close-quarters entries. |

Two of three are catalogue entries. Sentry Stake is the only one that earns real engineering time,
and it earns it twice over by resurrecting a dead stat and a dead level-up card.

### 2.2 Items — the axis that is blocked, not the count

26 stat items is enough breadth. What is missing is an entire **axis**: `rangePercent`
(`stats/PlayerStatBlock.ts:41`) has no read site and no granting item, so weapon range is a stat the
game claims and never varies (debt plan item #4).

1. Wire `rangePercent` at the weapon fire sites (multiply `rangeMetres`).
2. Then add 3 items on that axis: **Long Barrel** (+20% range, −8% attack speed, uncommon),
   **Reflex Sight** (+12% range, +6% crit, rare), **Sawn-Off Stock** (−25% range, +25% damage,
   uncommon — the melee/scattergun enabler).
3. Add **1–2 `engineering` items** if Sentry Stake ships, and re-enable `lvl-engineering` in
   `LEVEL_STAT_ORDER` at the same time. Do not re-enable it before there is a consumer.

Total: 5 items, all data, all on axes that currently do nothing.

### 2.3 Artifacts — none

The pool is 12 authored and all 12 now have combat readers as of Track A (25 July). Design called
for 12. It is complete. Adding a 13th is the least valuable content in this document.

### 2.4 Relics — two, to cover the new rack

The 9 relics were written against an 8-weapon ranged rack. Two gaps opened when melee landed:

- **Breacher's Wedge** — terrain damage +100%; destroyed cover briefly staggers adjacent enemies.
  Makes the Maul/Saber `terrainDamageMultiplier` axis a build instead of a footnote.
- **Coolant Loop** — beam and sustained weapons (Cryo Lance, Flamethrower, rotary) gain damage the
  longer they fire without stopping. Nothing in the pool rewards sustained fire.

### 2.5 Consumables — one, plus a distribution fix

12 `PowerupType` entries is plenty. But `POWERUP_WAVE_CYCLE` (`CombatSimulation.ts:1284`) contains
**8 of 12** — `uranium-core-rounds`, `medkit`, `emp-charge` and `butchers-serum` never appear in the
wave cycle and reach the player only via events/other paths. Worth confirming that is deliberate;
if it is not, it is the same placebo failure mode as the held weapons, one layer down.

One new consumable earns its place: **Breach Charge** — instant, destroys all cover in a radius and
damages what was behind it. It is the only consumable that interacts with world objects, which
matters once Part 3 lands.

---

## Part 3 — The remaining big world objects

The catalogue is 24 entries and **dead code**. Nothing places it, nothing ticks hazards, nothing
resolves an interaction. Art Batch O1 shipped 12 structural families; O2 (hazards) and O3A (small
interactions) are production candidates. The gap is runtime, not art.

### 3.1 Runtime foundation (must come before any new object)

This is the real work, and every big object below depends on it:

1. **Placement** — `ArenaDefinition` gains a world-object layer; a deterministic, seeded recipe per
   theme picks from `worldObjectsForTheme()` respecting `maxPerRoom`, `placement`, and the density
   gates in `world-object-production-plan.md` (≥2 routes, 2.5 m lanes, 4 m spawn/exit clearance,
   ≤20% floor).
2. **Damage + state** — objects already carry `durability`; route weapon hits through the existing
   `terrainDamageMultiplier` sites (`CombatSimulation.ts:3378`, `:4170`) and drive the four-state
   atlas columns (intact/damaged/critical/destroyed).
3. **Hazard tick** — `HazardEffect` is fully specified data (slow 0.62, toxic 4/s, fire 6/s, lava
   10/s). One per-frame overlap check against the player, plus enemies where it applies.
4. **Interaction verb** — a hold-to-interact prompt with the authored `seconds`, resolving the seven
   `InteractionEffect` variants. Gate on controller support, since the HUD prompt is new.
5. **Navigation guarantee** — destruction must not strand a pickup or invalidate the only route
   (the plan doc's rule). This needs a test, not a hope.

### 3.2 The four large anchors already in the catalogue (art Batch O3B)

These exist as data with no behaviour spec beyond one line each. Designing them:

| Object | Runtime design |
| --- | --- |
| **Monster Teleporter** (500 HP, 2.0 s disrupt) | Visible spawn cadence with a pre-spawn telegraph; never spawns within 2 m of the player. Two counters: shoot it down (500 HP) or hold the 2 s interrupt. Interrupt is faster but pins you in place next to a spawner — that is the trade. |
| **Stargate** (indestructible, 2.5 s) | Deliberate activation only, never on contact. Should be the room's exit-with-a-cost: activating early skips remaining spawns but forfeits the room's scrap. |
| **Cryogenic Tube** (350 HP, 1.5 s release) | Must show an authored preview of contents — rescue / reward / threat — before the hold completes. A gamble the player opts into with information, not a coin flip. Destroying it instead kills the contents. |
| **Weapon Upgrade Station** (indestructible, 1.25 s) | Player picks **one** weapon; only that weapon disables for exactly 45 s. UI must show weapon, result, countdown and the room-exit policy *before* confirm. Never auto-select, never consume the weapon, never silently pause the timer. |

### 3.3 New big objects worth adding — three

The catalogue is thorough on cover and thin on **objects that change the fight**. Ranked by
gameplay-per-cost:

1. **Fuel Cell / Explosive Barrel** (destructible, ~60 HP, detonates for area damage, chains to
   other cells within 3 m). Cheapest possible "battlefield fights back" — it needs no new verb, only
   a death hook, and it instantly makes cover placement a tactical read instead of scenery. Themes:
   bastion, logistics, foundry, starship. **Do this one first.**
2. **Structural Pillar** (heavy, ~500 HP, on destruction drops rubble: a lasting impassable
   footprint plus impact damage). Turns route-shaping into a player *tool* — the only object that
   lets the player create cover rather than remove it. Pairs directly with the Breaching Maul.
3. **Scrap Seam** (interactable, 2 s harvest, yields scrap scaled by depth, one per room). Connects
   world objects to the economy, gives the "explore the room" impulse a payoff, and is the natural
   carrier for a `harvesting`-stat interaction.

Deliberately **not** proposing: shield pylons, escape lifts, hostile turret emplacements. Each needs
a new ownership/state language, and the plan doc is right that boss arenas stay gated until standard
rooms prove cover, safe lanes and interaction language first.

### 3.4 Order

Foundation (3.1) → Fuel Cell → the O3B anchors as their art lands → Pillar → Scrap Seam.
Do not start any of it in the same increment as the weapon flip; they touch different systems and
the flip needs a clean replay-digest regeneration of its own.

---

## Part 4 — Other recommendations

**Needs a creator decision, blocks tuning:**

- **The 4-slot rack against a 21-weapon, 26-item pool.** Already flagged as an open question in
  `wave_balance.md:442-449` when the pool was 15. The flip makes it acute: most weapons will never
  be seen in a given run, and the chest's "3 of 20 unowned" draw means a build-defining weapon is
  mostly luck. Options: raise to 5–6 slots, add a banish/reroll to the chest, or accept it and lean
  into run variety. Worth deciding before the balance pass, not after.

**Should ship alongside the flip:**

- **The six held enemies** (Nest Weaver, Storm Savant, Scrap Skitterer, Arc Warden, Cyborg Reclaimer,
  Foundry Fabricator) are the identical failure mode — fully built, in no wave, reachable only via
  `?scenario=`. Releasing 12 weapons against an unchanged enemy roster is a one-sided power spike.
  The composition rows are trivial; the threat rebalance is the work.
- **A weapon-chest banish or reroll.** With 20 entries, "three you did not want" is now common.

**Verification debt worth clearing in the same pass** (all pre-existing, all cheap):

- `ReplayFixture` never kills a ranked enemy, so it does not cover the rank-kill `random()` draw —
  and §1.2 hangs the unique unlock off exactly that event. Add a ranked-kill fixture *before*
  wiring the unlock, or the digest guards nothing on the new path.
- Three visual changes were only ever verified as "boots without console errors" (4-row level-up
  panel, scaled late mini-boss, liberation map glyph). One browser pass with screenshots clears all
  three plus the 13 new weapon silhouettes.
- Frame rate was never re-measured after `liveCap` 18 → 26 and the escort budget raises.

**Tech debt that keeps costing:**

- Five parallel modifier systems still resolve alongside the unified `PlayerStatBlock`
  (perk/relic/transformation are inert seams in `resolvePlayerStats`). Every stat touch lands in
  five places — including all five items in §2.2.
- The shop economy (26 items, 7 profiles) and the liberation node type have **no codex entries at
  all**, pinned open by `codexDrift.test.ts`. Authoring, not wiring.

---

## Suggested increments

1. ~~**Weapon release**~~ — §1.1–1.5. **Done 26 July 2026.**
2. ~~**Ranked-kill fixture + unique unlock**~~ — **Done 26 July 2026.**
3. ~~**Held enemies**~~ — **Done 26 July 2026.** No rebalance was needed: the swaps were
   already threat-neutral by construction. Nest Weaver stays out by the documented tuning decision.
4. ~~**`rangePercent` wiring + range items**~~ — **Done 26 July 2026.** Three items, not the
   proposed three-plus-engineering — engineering waits on Sentry Stake.
5. **World-object runtime foundation + Fuel Cell** — §3.1, §3.3.1. The largest, most valuable item.
   **Next.**
6. Everything else, in the order listed.

---

## Landed 26 July 2026

Full detail in `last-bastion-log.md`. Summary of what changed and what it means for the rest of
this plan:

- **All 21 weapons are obtainable.** `HELD_WEAPONS_IN_POOL = true`; `weaponPoolFor({ uniqueUnlocked })`
  is now the single source both acquisition routes read; Event Horizon unlocks on the run's first
  ranked kill and costs 3× in the shop.
- **The shop-crowding regression was fixed with the flip**, not after it: a rotating window of 3
  weapon candidates, RNG-free because `canRerollScrapShop` calls the same builder.
- **Readability stopgap shipped in full** — exhaustive body-asset record, pattern-grouped tiles,
  damage-type colours, per-weapon cooldown codes, and melee sweeps drawn at their real arc/reach.
- **The machine faction is live** (5 of 6; Nest Weaver documented as unplaced).
- **`rangePercent` is wired** to both `rangeMetres` and projectile lifetime, with 3 items.
- **Ranked-kill replay coverage closed**, including a documented LCG quirk (small evenly-spaced
  seeds cluster their first output, so a frame-0 draw does not vary across them).

Still open from this document, unchanged in priority:

- **Part 2 content** — the 3 weapons (Sentry Stake first, since it also resurrects `engineering`
  and its disabled level card), 2 relics, 1 consumable. No new artifacts.
- **Part 3 world objects** — untouched, and now the single largest piece of dead code in the
  project.
- **The 4-slot rack decision** (Part 4) — now acute rather than theoretical: 21 weapons and 29
  items against 4 slots.
- **Screenshots** — the browser pane was unavailable, so the 13 placeholder silhouettes are
  verified as booting, not as visually distinguishable.
