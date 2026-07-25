# Last Bastion — content-debt plan (placebo pickups, dead stats, held content)

Scoped 25 July 2026 after a full audit of the project `.md` docs against `dev/src/game/`. The Brotato
overhaul (`last-bastion-shop-economy-plan.md`) is complete across all five phases; this plan covers what
that audit found sitting behind it.

## Context

The audit found a consistent failure mode rather than a list of missing features: **content that is
authored, shipped, granted to the player, and does nothing.** A relic drops, its name and description
promise an effect, `resolveRelicModifiers` sets the field — and no combat site ever reads it. The player
cannot tell the difference between that and a working pickup, which is precisely why it survived this
long. Eight of the game's pickups are in that state, plus one level-up card and one whole economy stat.

This is worth fixing before any new system is built: new content added on top of a layer of placebos
makes the placebos harder to find, not easier.

**Not in scope:** art and audio asset production (Codex + imagegen, landing this week). Where a code
gate exists purely because art is pending, this plan prepares the change and stops short of flipping it.

---

## P0 — bugs shipped during the 25 July session (fix first, both small)

Both were introduced by the Brotato overhaul work and both are live.

1. **`lvl-engineering` is a level-up card that does nothing.** `content/levelStatCatalog.ts:59` authors
   "Field Engineering" (+5 `engineering`) and `:72` puts it in `LEVEL_STAT_ORDER`, so it *is* offered.
   `engineering` has **zero read-sites** in `combat/`. A player can spend a level on it and get no
   effect whatsoever. The only structures in the game are Assembly Prime's enemy-side fabricated
   drones, so there is no player consumer to wire it to.
   **Fix: remove the card from `LEVEL_STAT_ORDER`** (keep the definition and the block field, both
   harmless) until an engineering item exists. One line.

2. **The `curse` economy is unreachable.** `curse` is read in `drawScrapShopOffers`, `grantWeightedItem`
   and `shopProfiles.rarityDrawWeight`, but **nothing in the game writes it** — not an item, not a card,
   not a relic, not a transformation. The measured "curse 100" column in `last-bastion-log.md` came from
   a probe injecting the value directly; it describes a code path no player can enter, and the log
   entry presents it as if it described the game. That claim needs correcting as part of this fix.
   **Fix: grant `curse` from the two cursed items** — Cursed Idol and Blood Pact
   (`content/itemCatalog.ts:86-87`) are the natural carriers and already carry the `risk` tag. Adding
   `curse: 15`–`25` to their `statModifiers` makes the trade-off real: taking cursed power visibly
   degrades your future shop stock. Data-only; the weighting already works.
   Consider also a `luck`-negative / `curse`-positive Church-profile item so the Church has something
   thematically its own to sell.

---

## Track A — make granted content real (the chosen next track)

**Eight pickups are placebos.** Every one is granted to real players today.

### Relics (5 of 6 dead or half-dead)

| Relic | Field(s) with zero combat reads | Hook |
| --- | --- | --- |
| Stabiliser Gyro | `movingSpreadMultiplier` (0.65) | Multiply spread at the fire site when the player is moving |
| Salvaged Capacitor | `chainArcEveryNthAttack` (5), `chainArcDamage` (2) | Attack counter → reuse the existing `chain-arc` event path Tesla Coil already drives |
| Hunter's Beacon | `eliteMarkedEarlier`, `eliteBonusDamageAfterMiss` (0.15) | Elite-mark timer; damage bonus after a missed shot |
| Field Lattice | `healthPickupSlowPulse` | Pulse on the health-pickup collection branch |
| Kinetic Greaves | `evasiveDistanceMultiplier` (1.25), `evasiveRecoveryMultiplier` (1.2) | `HeroMotionController` — the only one outside `CombatSimulation` |
| Blast Baffle | `selfExplosiveDamageMultiplier` (0.5) — *`explosionRadiusMultiplier` is live* | Halve self-inflicted explosion damage |

### Artifacts (3 of 7 dead)

| Artifact | Field(s) with zero combat reads | Hook |
| --- | --- | --- |
| Event Horizon Core | `implosionEverySeconds` (8) | Periodic implosion pulse |
| Broodbreaker Seal | `eggDeathDamage` (4), `preventHatchDuringCrack` | Egg-cluster death damage; suppress hatch during crack |
| Last Bastion Protocol | `criticalHealthBraceFormation` | Brace formation at critical health |

### Also in Track A

- **Duplication Vat's relic branch is a no-op.** `shrine-duplication-vat` pushes a duplicate relic id
  which `resolveRelicModifiers` folds through a `Set`, so the duplicate is discarded. A live, offered
  choice that does nothing. Either give relics a stacking rule or change the branch to grant a
  *different* relic — the latter is smaller and honest.
- **`EventRequirement` cannot gate on ownership.** Purifier Station and Whispering Cargo let the player
  pick a choice that silently no-ops when they own no relic/upgrade. Add `minRelics` / `minUpgrades`
  beside the existing `minWeapons`.

**Status — Track A complete 25 July 2026** (see `last-bastion-log.md`). All thirteen previously-unread
relic/artifact fields now have combat readers (each was 0 before). Blast Baffle needed a new
`PlayerDamageSource` parameter on `damagePlayer` with six explosive call sites tagged — its original
`selfExplosiveDamageMultiplier` framing was unimplementable (no self-damage mechanic exists), so it
delivers the half of its description that is: incoming explosive damage halved, verified at exactly
3 → 1.5. Hunter's Beacon's `eliteBonusDamageAfterMiss` hangs off the Carapace Scuttler charge ending
out of reach. Duplication Vat, Echo Well and Purifier choices are now ownership-gated via new
`minRelics`/`minUpgrades` requirements, so they can no longer be picked for a silent no-op.
**831 tests pass.**

**Order:** P0 → the four cheap `CombatSimulation` relic hooks → Blast Baffle → the three artifacts →
Kinetic Greaves (touches `HeroMotionController`) → Duplication Vat → `EventRequirement`.

**Testing posture** (creator direction, standing): a small number of high-value tests — one per hook
proving the granted relic changes an observable outcome, not a test per field.

---

## Prepared but held — flip when the art lands this week

Creator decision 25 July: **scope now, flip on delivery.** No placeholder art ships.

- **7 of 15 weapons are unobtainable.** Railspike, Seeker Swarm, Cryo Lance, Tesla Coil, Flamethrower,
  Sawblade, Event Horizon are fully built and tested but absent from `WEAPON_CHEST_POOL`
  (`content/weaponCatalog.ts:353`), which is also the shop's weapon source — so the Blacksmith
  liberation profile cannot reach them either. Seven complete combat subsystems (beam, orbit,
  orbit-blade, homing, gravity well) are unreachable in play. **The flip is one constant.**
  Note there is still no Unique-slot acquisition path at all, which Event Horizon needs.
- **6 built enemies appear in no wave.** Nest Weaver, Storm Savant, Scrap Skitterer, Arc Warden, Cyborg
  Reclaimer, Foundry Fabricator have behaviour files, catalog entries and steering roles, and are
  reachable only via `?scenario=`. `buildDensityWave` / `lateWaveComposition`
  (`combat/DensityDirector.ts`) list none of them, and `buildBudgetDensityWave` reuses the same
  templates, so expedition nodes never field them either. **The flip is composition rows plus a threat
  rebalance** — the rebalance is the real work and can be done now.

---

## Backlog — ranked, not this session

1. **World objects / "the battlefield fights back"** — `arena/WorldObjectCatalog.ts` (24 theme-filtered
   obstacles, hazards, interactables) is imported by **nothing but its own test**. The only live
   interactable in the game is the power switch / electric fence. This is a stated design pillar in
   `last-bastion-game.md` and it is entirely dead code. Large: placement into `ArenaDefinition`,
   interaction-verb resolution, hazard ticks, HUD prompts. Art for 12 of them already shipped (Batch O1).
2. ~~**Transformation payoff**~~ — **Done 25 July 2026.** Was 13 of 27 metrics unhooked; now 4, each
   explicitly explained and guarded. Eight wired: retaliation-damage, nearby-kill-healing,
   evasive-cooldown, evasive-distance, weapon-spread, projectile-speed, corrode-buildup and
   telekinetic-push-distance. **Two audit claims were wrong and are corrected:** `corrode-buildup` is a
   *boon on buildup dealt*, not a "received" scar — it was trivially wireable and had been misfiled; and
   the recommendation to *cut* the unattachable metrics was wrong, because `fire-damage-received` and
   `shock-buildup-received` are **scars**, so deleting them would strictly buff their paths. They stay,
   documented. Original text follows for reference: 13 of 27 metrics have no hook. Martyr (Church) and Telekinetic (Psionic)
   have **inert headline boons**, so committing to those paths is cosmetic. Retaliation-damage and
   nearby-kill-healing are cheap and rescue two paths. The three "received elemental buildup" metrics
   are unattachable (the player never takes statuses) and should be **cut from the catalogue**, not
   deferred, so the balance budget stops counting phantom value.
3. **5 designed artifacts never authored** — Overclock Core, Chrono Capacitor, Bastion Beacon, Null
   Field, Warp Anchor. Pool is 7, design calls for 12. Death-revive (Bastion Beacon) is the only
   structurally hard hook.
4. **`rangePercent` unwired** — inert but harmless (no card, no item grants it). Blocks the whole
   range-item design axis. Multiply weapon range at the fire sites, then add 1–2 range items.
5. **In-combat transformation HUD** — Affinity is debrief-only, so the player cannot see how close they
   are to the 3-Affinity commit threshold at the moment it matters.
6. ~~**Codex drift**~~ — **Guarded 25 July 2026, partially fixed.** The "build-time generator" idea was
   **wrong and was not built**: the codex is a hand-authored design bible whose 39 `concept` + 20
   `designed` entries describe content that does not exist in code, so generating it from the catalogs
   would have deleted the design backlog. Built `content/codexDrift.test.ts` instead, which cross-checks
   both directions. It found 6 undocumented weapons, 4 undocumented *working* artifacts, and 9
   relic/artifact entries still marked `designed` after being wired — all now fixed. **Still open and
   pinned by the guard: the 26-item shop economy, 7 shop profiles and the liberation node type have no
   codex entries at all.** That is authoring in the creator's voice, not wiring.
7. **Settings / accessibility gaps** — auto-aim assist (explicitly "required for eventual touch play"),
   audio sliders, colour-blind-safe telegraphs, pause-on-decision, FPS, display scale. `SETTINGS_ROWS`
   only handles booleans today, so non-boolean settings need new machinery first.
8. **Task 96 QoL** — pause-menu restart/abandon, seed copy, codex discovery toast, build-lean labels.
9. **Legacy modifier cleanup** — five parallel systems still resolve alongside the unified block;
   `resolvePlayerStats` treats perk/relic/transformation as inert seams. Pure tech debt, but it is why
   every future stat touch lands in five places.

---

## Verification debt (carry forward, cheap)

- **`ReplayFixture` no longer covers ranked kills.** The rank-kill item grant added a `random()` draw on
  mini-boss/boss death; the digest still passes only because the fixture never kills a ranked enemy.
  Adding a ranked-kill fixture closes a real coverage hole.
- **Three visual changes were never seen.** The 4-row level-up panel (a layout refactor), the scaled
  late-game mini-boss silhouette, and the liberation map glyph were all verified only as "boots without
  console errors" — screenshots were unavailable. One browser pass with screenshots clears all three.
- **Frame rate after the cap raise.** `wave_balance.md:444` asks whether the raised simultaneous caps
  hold frame rate; Phase 5 then raised rank-wave `liveCap` 18 → 26 and escort budgets 96→108 / 108→135
  without re-running it.
- **Open tuning questions never closed** (`wave_balance.md:442-449`) — most pointed now: *"Is a 4-slot
  inventory the right size once six or more weapons are in the pool?"* The pool is 15 weapons and 27
  stackable items against a 4-slot rack. Worth a creator decision.

---

## How this gets verified

- `npm run typecheck` and `npx vitest run` in `dev/` after each increment (818 tests at plan time).
- Each relic hook gets one test proving the *granted relic* changes an observable outcome — a test on
  the modifier field alone would have passed for all eight placebos.
- Browser pass via `preview_start` + `?scenario=` routes for anything visual, with screenshots if the
  pane is available.
