# Last Bastion — content design plan

## Implementation addendum — 11 August 2026

The first recommended content-depth batch is now implemented code-first:

- Elite caches offer three items aligned to the defeated elite's combat identity.
- Mini-boss caches offer a choice between two unowned relics and an eligible upgrade.
- Objective completion owns a small utility-relic pool instead of sharing the generic reward path.
- **Escort** moves a vulnerable drone through three pressured waypoints. **Deny** asks the player to
  destroy three channel anchors before shared corruption reaches 100%. **Collect** places six timed
  recoveries around the arena. All three grant Scrap plus an objective-only relic choice.
- Three additional code-first elites are now live and expedition-eligible: **Ironhide Abomination**
  adapts to repeated damage types, **Splitcaller Weaver** hatches six fragile-pod children, and
  **Voltaic Warden** fires two independently cover-clipped lanes. Their bespoke production bodies and
  the non-colour-only segmented elite marker, four elemental upgrade tiles, and Razorlord/Blightspitter
  effect accents are now live. Batch 77 is complete.

The inventory audit now distinguishes the four hold/interact fixtures from the four actual objective
modes. Deterministic local review routes use `escort-objective`, `deny-objective`, and
`collect-objective` with `?scenario=<id>&loadout=vertical`.

Eligible mid-run combat nodes now seed these three objective modifiers directly into normal expedition
play, at roughly one in four candidates. Victory reward decisions resolve before the expedition build
is persisted, so objective relics and boss artifacts survive the map hand-off.

**Written: 7 August 2026. Status: LIVE — forward plan.**

Covers monsters, weapons (melee and ranged), projectiles, objectives, rewards, artifacts, items,
and stats: a review of what exists, specific fixes for it, and new content proposals. Companion to
`last-bastion-improvement-and-steam-plan-2026-08-07.md`, which owns the engineering, display, and
Steam work. Where the two touch — the difficulty ladder especially — this doc defers to that one.

Every number below was counted from `dev/src/game/` on 7 August 2026, not quoted from a doc.
Several disagree with the counts in `README.md`; the code wins and the README needs updating.

---

## 1. What actually exists

| System | Count | Notes |
|---|---|---|
| Weapons | ~~29~~ **34** | 31 draftable, 1 earned unique, 1 hero-bound, 1 transformation-only |
| Enemy types | **36** | ~20 fightable, 7 mini-bosses, 1 boss, 8 summons/props |
| **Elites** | **7** | four established identities plus ironhide-abomination, splitcaller-weaver, voltaic-warden |
| **Mini-bosses** | **7** | siege-crusher, brood-warden, rift-stalker, synapse-herald, assembly-prime, storm-regent, abomination-prime |
| **Bosses** | **1** | bastion-eater |
| Items | ~~41~~ **47** | Count generated from the live catalogue on 11 Aug 2026 |
| Relics | **14** | `rel-` prefix |
| Artifacts | **12** | `art-` prefix, one equipped at a time |
| **Upgrades** | ~~12~~ **20** | level-up choices — 8 added 7 Aug 2026, see §9 |
| Level stat cards | ~~15~~ **16** | against ~~19~~ **20** stats |
| Powerups | **12** | |
| **Objective fixtures / modes** | **4 / 4** | four hold/interact fixtures; hold/interact, Escort, Deny, and Collect modes |
| Damage types | **5** | physical, fire, shock, cryo, toxic |
| Statuses | **4** | blaze, overload, freeze, corrode — physical has none |
| Player stats | ~~19~~ **20** | `statusBuildupPercent` added 7 Aug 2026 |
| Scrap sources | **10** | |
| Map node types | **9** | |

### Weapons by damage type and pattern

| | physical | fire | shock | cryo | toxic | total |
|---|---|---|---|---|---|---|
| projectile | 6 | **0** | 0 | 0 | 2 | 8 |
| scatter | 1 | 0 | 0 | 1 | 0 | 2 |
| chain | 0 | 0 | 1 | 0 | 1 | 2 |
| melee-sweep | 4 | 2 | 1 | 1 | **0** | 8 |
| beam | 0 | 1 | **0** | 1 | 1 | 3 |
| orbit / orbit-blade | 1 | 0 | 1 | 1 | 0 | 3 |
| deployable | 1 | 0 | 0 | 0 | 0 | 1 |
| **total** | **15** | **3** | **3** | **4** | **4** | **29** |

---

## 2. Review of what exists — the five real problems

### P1. Elites are the weakest system in the game *(highest priority)*

**11 August update:** the existing four now all have signature behavior: Carapace charge/armour timing,
Razorlord's faster locked dash, Blightspitter's 2 m / 7 s denial puddles, and Matriarch's Rain of Spines.
Threat 1 adds one elite patrol to ordinary combat nodes; Threat 2 adds two distinct sequential patrols.
Ironhide Abomination, Splitcaller Weaver, and Voltaic Warden are now code-complete, expedition-eligible,
and locally testable. Their bespoke bodies and non-colour-only segmented elite marker are now live;
the four elemental upgrade tiles and supporting Razorlord/Blightspitter effect accents are now live.
Batch 77 is complete.

Seven elite kinds are live, but `eliteKindsForWave` is still a hardcoded ten-wave table where only waves 4, 6, 7,
8, and 9 produce elites at all. Three consequences:

- **Elites are stat-buffed base enemies**, not distinct threats. Carapace Scuttler is the only one
  with bespoke behaviour (the charge). Razorlord and Blightspitter are a coin-flip between two
  "fast elite" slots.
- **The cadence cannot express difficulty.** The function takes `(waveNumber, roll)` and returns a
  fixed list. The Phase 4 difficulty ladder needs elites to scale — more per wave, earlier, and
  in combinations — and there is no parameter to do it with.
- **Waves 1–3, 5, and 10 have no elite at all**, so the mid-run rhythm is flat.

**Fix, in order:** (a) change the signature to `eliteKindsForWave(waveNumber, roll, threatTier)`
so the ladder has a lever — do this *with* T4.1, not before; (b) give each existing elite one
signature behaviour so the four read as distinct; (c) add elites in §3.

### P2. One boss for a twenty-node campaign

Every expedition ends with the Bastion Eater. Seven mini-bosses rotate by depth, and then the
finale is always the same fight. This is the single biggest repetition problem in the run, and it
gets worse the moment the difficulty ladder gives players a reason to replay.

**Fix:** two more bosses, one per faction, selected by the region the final node sits in. See §3.

### P3. The damage-type economy is lopsided in both directions

Physical is **52% of all weapons** (15 of 29). Meanwhile the *enemy* side is built almost entirely
around shock: of 24 enemies carrying resistances, **13 are shock entries** — every machine is
shock-weak at 1.4–1.5×. But there are only **three shock weapons**, and one of them is a melee
baton.

So the game asks "bring shock to the Machine Foundry" and then barely lets you. Specific holes:

- **Fire has no ranged projectile weapon at all** — it is a beam and two melee weapons.
- **Shock has no beam.**
- **Toxic has no melee.**
- 12 of 36 enemies have no resistance profile at all, so damage type is meaningless against them.

**Fix:** the three weapons in §3 that close those holes are worth more than any six new weapons
that do not. Also give the corrupted-human family a resistance profile — they are the faction with
none, which makes fire and toxic feel inert for a third of the game.

### P4. Status buildup is scalable only from three hard-coded places

*(Corrected 7 Aug 2026 — an earlier draft of this section claimed nothing scaled buildup at all.
That was wrong; the narrower finding below is the real one.)*

Four statuses, all gated on `STATUS_BUILDUP_THRESHOLD = 8`. Buildup **can** be scaled, but only by:

- the **Element Primer** relic (`statusBuildupMultiplier = 2`),
- three element upgrades (`incendiary` fire ×1.2, `cryo-coating` cryo ×1.2, `chain-lightning`
  shock +0.1),
- one transformation choice (`corrodeBuildupMultiplier`).

What is missing is a **`PlayerStatBlock` entry**. That block is the single resolved surface combat
reads, and it is what the **41-item shop economy** and the **15 level-up stat cards** feed. So the
two systems the player interacts with most cannot influence status application at all — you can
only get it from one specific relic or by taking the matching element upgrade.

`elementalDamagePercent` scales elemental *damage* and is fully wired, which makes the omission
easy to miss: elemental builds scale, but their *status* output does not.

**Fix:** add `statusBuildupPercent` to `PlayerStatBlock` (§6) and fold it in beside the three
existing multipliers at the single application site in `damageEnemy`. Small change, opens status to
the whole item and level-card economy, and costs no new art.

### P5. Upgrades are thin and unevenly distributed

Twelve upgrades for a whole run, split **8 offensive / 2 defensive / 1 support / 1 scavenger**
(an earlier draft of this line said "nine offensive, three defensive" — miscounted). Element
coverage is
incendiary (fire), cryo-coating (cryo), chain-lightning (shock) — and **nothing for toxic**, which
has four weapons. Level-up is the most frequent decision in the game and it repeats fast.

**Fix:** eight more upgrades (§5), completing the element set and adding a support/economy line.

### Smaller notes

- **Items skew offensive**: 20 offence tags against 9 defence. The `risk` tag is on 19 of 41 —
  nearly half the pool is conditional, which makes drafting feel samey.
- **Objectives are one verb.** All four kinds are "stand near a thing and hold". Gate, button,
  turret console, trap console differ in *result*, not in *play*.
- **Rewards do not vary by source.** Ten scrap sources feed one currency; elite caches, chests, and
  mini-boss rewards resolve into the same pools. Beating a mini-boss should not feel like opening a
  crate.
- **README content counts are wrong** — it says 47 items and 29 weapons; the code says 41 and 29.

---

## 3. New monsters

Proposed to fill *behavioural* gaps rather than raise the count. Each names the gap it fills.

### Standard enemies (4)

| Name | Faction | Gap it fills | Behaviour |
|---|---|---|---|
| **Cinder Tick** | Alien | No enemy that punishes standing still | Slow, burrows, erupts a fire pool under the player's *current* position after a 1.1 s tell. Forces movement without being a chaser. |
| **Bulwark Drone** | Machine | No enemy that protects others | Projects a directional shield in front of one nearby ally; the shield blocks from its facing only, so flanking is the counter. Shock-weak like all machines. |
| **Pallid Choirman** | Corrupted | Corrupted family has no ranged support | Channels a slow AoE that heals corrupted allies and applies a small armour buff. Interruptible: taking damage during the channel cancels it. |
| **Mire Crawler** | Alien | Toxic has almost no enemy-side presence | Leaves a lingering corrode trail; harmless on contact, dangerous as terrain denial. Pairs with the new toxic weapons to make the type legible. |

### Elites (3 new, plus behaviour for the existing 4)

Elites should be a base enemy **plus one rule that changes how you fight it**, not a stat block.

- **Ironhide Abomination** — Abomination that gains armour each time it is hit by the same damage
  type twice in a row. Punishes single-weapon builds; rewards the rack.
- **Splitcaller Weaver** — Nest Weaver whose pods hatch six hatchlings instead of the ordinary
  three, but whose pods are visibly weaker. A DPS-check elite.
- **Voltaic Warden** — Arc Warden that chains its beam to a second target. Makes the machine
  faction's signature threat readable at elite tier.

Behaviour to add to the existing four: **Razorlord** gets a short untargetable dash (currently just
fast); **Blightspitter** leaves a corrode puddle where it dies; **Quillback Matriarch** already has
Rain of Spines and is fine; **Carapace Scuttler** is fine.

### Bosses (2 new) — SHIPPED CODE-FIRST 11 AUG 2026

- **The Choir** (Alien Hive) — three linked Brain-Blob-scale bodies sharing one health pool.
  Killing one does not end the fight; it accelerates the other two. Phase change at 50%: the
  survivors merge, arena floods with hazard.
- **Foundry Sovereign** (Machine) — a stationary boss that is *not* the threat itself: it
  fabricates and buffs waves, and the fight is about deciding whether to burn the summons or rush
  the core. Shock-weak, so the machine-faction damage lesson pays off at the finale.

Selecting the finale boss by the final node's region theme turns the existing region system into
run variety at zero extra systems cost.

The shared-health Choir transition, outside-safe-radius flood, Sovereign fabrication escalation,
Shock weakness, owned-child lifecycle, deterministic regional selection, Lab routes, HUD/audio
feedback, boss rewards, and victory handling are live. Production bodies, portraits, phase frames,
merge/hazard accents, and fabrication/buff effects shipped in Batch 78–79 on 11 August 2026. The
remaining gate is observed balance testing, especially flood pressure and summon-clear versus
core-rush viability.

---

## 4. New weapons

**Tier 1 — close the damage-type holes (do these first). SHIPPED 8 Aug 2026.**
Physical fell 52% -> 47% and every element now has both a ranged and a close-quarters option;
`weaponTypeCoverage.test.ts` asserts those properties structurally.

| Name | Class | Type | Pattern | Fills |
|---|---|---|---|---|
| **Emberlance** | medium | fire | projectile | Fire has *no* ranged projectile |
| **Storm Coil Beam** | medium | shock | beam | Shock has no beam; machines are shock-weak |
| **Blight Scythe** | light | toxic | melee-sweep | Toxic has no melee |

**Tier 2 — pattern variety (5).** The pattern spread is projectile-and-melee heavy; only one
deployable exists.

- **Caltrop Launcher** (light, physical, deployable) — scatters area-denial that persists.
- **Mag-Tether** (medium, shock, chain-projectile) — pulls two chained enemies toward each other.
- **Frostbloom Mine** (heavy, cryo, deployable) — proximity freeze field.
- **Cinder Fan** (heavy, fire, scatter) — short cone, applies blaze across a spread.
- **Rotary Sawpair** (heavy, physical, orbit-blade) — a second orbit-blade so the pattern has a
  choice in it.

**Tier 3 — a second unique (1).** One unique for a whole game is thin now that Event Horizon is
reachable. **Null Chorus** (unique, shock): fires nothing; suppresses all enemy ranged windups in a
radius while held, draining a charge meter. A defensive unique to contrast Event Horizon's
offensive one.

**Melee-specific note.** Melee is 8 of 29 and reasonably served, but every melee weapon is a
`melee-sweep`. A **melee thrust** pattern (narrow, long, pierces) would differentiate the family
more than another sweep would — worth adding as a pattern before adding more melee weapons.

---

## 5. New upgrades, items, relics, artifacts

### Upgrades (+8, completing the set)

Element completion: **Corrosive Rounds** (toxic, the missing element), **Blaze Cascade** (blaze
spreads on death), **Deep Freeze** (freeze duration + shatter bonus), **Overload Arc** (overload
chains once).
Defensive/support: **Reactive Plating** (armour after taking a hit), **Field Medic Protocol**
(pickups heal), **Scrap Magnet** (economy), **Ordnance Racks** (deployable count +1).

### Items (+10, weighted to fix the offence/defence skew)

Seven defensive/sustain, three economy. Deliberately **no new `risk` items** — that tag is already
on 19 of 41 and is why drafting feels repetitive. Priority is unconditional, legible effects at
common and uncommon rarity, where the pool is thinnest (8 commons for a whole run).

### Relics (+4) and Artifacts (+2)

Relics should key off the new systems so they have something to interact with: one status-buildup
relic, one deployable relic, one objective-completion relic, one boss-damage relic. Artifacts:
**Choir Fragment** (drop from The Choir) and **Sovereign Core** (drop from Foundry Sovereign) —
tying artifacts to the new bosses gives both a reason to exist.

---

## 6. Stats

Add three, all of which unlock build decisions that currently cannot be made:

1. **`statusBuildupPercent`** — the P4 fix. Scales buildup toward the threshold of 8, folded in
   beside the existing relic/upgrade/transformation multipliers rather than replacing them, so
   Element Primer and the element upgrades keep working exactly as they do.
2. **`cooldownReductionPercent`** — nothing currently scales ultimate or deployable cooldowns, so
   those systems have no progression axis at all.
3. **`pickupRadiusMetres`** — currently only the `field-magnet` upgrade touches it, as a binary.
   Making it a stat lets items and level cards contribute.

Then add the three matching level stat cards, taking 15 → 18 against 22 stats.

**Do not add** a shield stat to `PlayerStatBlock` — `maxShieldBonus` already lives in transformation
modifiers, and duplicating it across two systems is how they drift.

---

## 7. Objectives and rewards

### Objectives — add verbs, not consoles

All four existing kinds are "hold near a thing". Three new verbs:

- **Escort** — a slow drone crosses the arena; it dies, you fail. Turns a defence game into a
  movement game for one encounter.
- **Deny** — enemies channel something; interrupting is the objective. Inverts the usual pressure.
- **Collect** — timed pickups spawn across the arena, forcing you off the safe lane.

Each is one encounter modifier, reusable on any combat node, so they multiply the existing 20-node
map rather than adding nodes.

### Rewards — make the source legible

Today ten scrap sources feed one currency and the reward pools barely differ. Proposal:

| Source | Should reward |
|---|---|
| Ordinary kills | Scrap only (unchanged) |
| **Elite defeat** | Guaranteed item choice from a **narrowed** pool matching the elite's damage type |
| **Mini-boss defeat** | Choice of relic or upgrade, alongside the existing depth-scaled Scrap |
| **Boss defeat** | Three-artifact choice replacing the generic item roll |
| **Objective complete** | The *only* source of the new objective-keyed relic |
| Supply chest | Consumables and scrap (unchanged) |

The principle: **every reward source should have one thing only it gives.** That is what makes a
player route toward it. Right now they are interchangeable, so routing is arbitrary.

Tie-in with the improvement plan: rewards are also where **G2 meta-progression** currency should
enter, and where the **difficulty ladder** should scale — higher tiers narrow reward choice rather
than reducing it, so the run stays winnable but less flexible.

---

## 8. Asset batches for Codex

Numbered from 76 to append to `asset-next-production-review-2026-07-26.md`. All existing quality
floors apply — text-free, stable IDs, retained masters, no baked numbers or telegraphs. **Nothing
here should be produced before its mechanics contract exists in code**, which is the rule the
silhouette heroes exist to enforce.

- **76 — Monster Batch M3: four standard enemies.** Cinder Tick, Bulwark Drone, Pallid Choirman,
  Mire Crawler. Per enemy: 4-direction × state body sheet on the established column order, plus a
  2×2 onset/dissipate effects atlas. Gated on behaviour landing.
- **77 — Elite Batch E1: three elites + four upgrades.** Bodies for Ironhide Abomination,
  Splitcaller Weaver, Voltaic Warden, plus an **elite marker treatment** that reads at 30+ enemy
  density and is not colour-only (colour-vision modes ship). Also the dash/puddle effects for the
  Razorlord and Blightspitter behaviour additions.
- **78 — Boss Batch B2: The Choir. COMPLETE 11 AUG 2026.** Three linked bodies, merge transition frames, arena hazard
  accents, portrait, runtime wiring, gallery, and live-lab QA.
- **79 — Boss Batch B3: Foundry Sovereign. COMPLETE 11 AUG 2026.** Core body, fabrication states, summon-buff effects,
  portrait, runtime wiring, gallery, and live-lab QA.
- **80 — Weapon Batch W2: the three hole-filling weapons.** Emberlance, Storm Coil Beam, Blight
  Scythe — body, tile, and behaviour-matched VFX each. Highest-value weapon art in the queue.
- **81 — Weapon Batch W3: pattern-variety five + Null Chorus.** Same package per weapon. Includes
  the first **melee-thrust** VFX language if that pattern is approved.
- **82 — Objective Batch J1: three new verbs.** Escort drone body and damage states, deny-channel
  telegraph, collect-pickup states and expiry. Geometry, timing, and radii stay code-owned.
- **83 — Reward Batch R2.** Distinct frames per reward source so the player can tell a mini-boss
  reward from a chest at a glance: elite cache, mini-boss relic plinth, boss artifact pedestal,
  objective reward marker.
- **84 — Item/Upgrade tiles.** 10 item tiles, 8 upgrade tiles, 4 relic tiles, 2 artifact tiles, at
  the canonical 128 px tile contract. These also feed the codex, which is code-enforced against
  drift.

Audio follow-ups ride the existing S-series conventions: per-weapon fire cues for batches 80–81,
boss stingers for 78–79, objective success/fail cues for 82.

---

## 9. Sequencing

```
1. DONE 7 Aug  P4 status-buildup stat + P3 corrupted-human resistances
2. DONE 7 Aug  P5 upgrades (+8)
3. DONE 8 Aug  Weapon Tier 1 (3 hole-fillers)  — art still open, batch 80
4. DONE 11 Aug Existing elite signatures + threat-tier patrol cadence
5. DONE 11 Aug Reward source differentiation (elite, mini-boss, objective) -> batch 83 art open
6. DONE 11 Aug New elite mechanics, bodies, marker, elemental tiles and effect accents -> batch 77 complete
7. DONE 11 Aug Objectives: Escort, Deny and Collect code-complete -> batch 82 art open
8. Bosses (2)                              -> batches 78, 79
9. Standard monsters (4)                   -> batch 76
10. Weapon Tier 2/3, items, relics, artifacts -> batches 81, 84
```

Steps 1 and 2 were pure data, unlocked build variety with **no art dependency at all**, and shipped
on 7 August 2026 — see the log for what each landed and the two latent bugs they exposed
(`applyUpgrade` had no exhaustiveness guard, and `buildUpgradeDecision`'s offer scan was hard-coded
to a twelve-entry catalogue). Steps 8-10 remain open. Step 6 and Batch 77 are complete: mechanics,
production bodies, elite marker, four elemental upgrade tiles, and the Razorlord/Blightspitter effect
accents are all live.

### Gates

- No new enemy, elite, or boss art before its behaviour is code-complete and has a review route,
  matching how every existing enemy shipped.
- Every new weapon needs a codex entry — `content/codexDrift.test.ts` fails the build otherwise.
- New content must not raise the physical share of the weapon pool; the point is to correct it.
- Reward changes need a balance pass in `wave_balance.md` before they ship, since narrowing pools
  changes the run's power curve.
