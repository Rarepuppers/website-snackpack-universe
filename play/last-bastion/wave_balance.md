# Last Bastion wave balance

## Document purpose

This is the numeric design for encounter pressure: what spawns, how tough it is, what it pays, and how all of that grows wave over wave. The durable design lives in `last-bastion-game.md`; implementation status lives in `last-bastion-model.md`. Numbers here are **proposals for the step 35 tuning pass** unless a row is marked implemented.

**Status:** Draft v2 — 18 July 2026 (v1 17 July). Nothing in this document is implemented yet; the current build still uses prototype numbers (Service Rifle 10 damage, ~8–20 enemies per wave, `level × 4` XP thresholds). v2 adds the short-timed-wave pacing model, starting-health rule, elite cadence, and the weapon acquisition schedule.

## Design intent

Last Bastion is a manual shooter first, so it must not become Brotato with a cursor. The target feel:

- **You cannot kill everything.** From roughly wave 3 the arena carries more health than the player's damage-per-second can clear. Survival, positioning, and target priority decide the wave, not extermination.
- **Kills are the resource.** Enemies pay XP and Scrap, so choosing *which* enemies to kill under pressure is the core economic decision.
- **Numbers must be legible.** With a starting weapon at 2 damage per bullet, every upgrade is visible in the floating damage numbers. A 40% damage upgrade reads as 2 → 3, not 10 → 14 lost in noise.
- **Growth is authored, not exponential.** Wave scaling uses explicit per-wave multipliers so a bad curve is a data fix, not an emergent mystery.

## Numeric precision

Percentage upgrades are only meaningful if the numbers underneath them are not rounded to death. At 2 damage per bullet, a `+15%` bonus is worth 0.3 — invisible under integer maths, and three such upgrades would round to nothing.

**The rule: calculate in full floating point, round only for display.**

| Layer | Precision | Reason |
| --- | --- | --- |
| Simulation state (damage, health, armour, shields, speed) | Full float, no rounding | Every percentage bonus compounds honestly |
| Damage application | Full float | 2.1 damage against 4.3 health leaves 2.2 |
| **Display** — floating damage numbers, HUD health/shield, stat cards, tooltips | **1 decimal**, trailing `.0` trimmed (`2.1`, `4`, `12.5`) | Readable at a glance, still shows upgrade effects |
| Comparison/debug readouts (stat screen "exact" toggle, tests) | 3 decimals | Diagnosing rounding drift and verifying tuning |

Consequences the implementation must honour:

- The existing **1-damage minimum** in `mitigateDamage` becomes a **0.1 minimum**, or heavy armour would erase small-calibre weapons entirely at the new scale.
- Health bars and numbers may show `0.4` remaining; enemies die at `health <= 0` exactly, never at a rounded zero.
- Damage-over-time already ticks fractionally (`damagePerSecond × delta`) — that stays, and now displays consistently.
- A **round-half-up** helper (`formatStat(value, decimals)`) is the single display path, so no two surfaces can disagree about what 2.05 is.
- Tests assert with `toBeCloseTo` at 3 decimals rather than exact integers.

## Fractional projectiles

Upgrades, relics, items, and downgrades should be able to move projectile count by fractions — `+0.5 projectiles` is a natural half-step between "nothing" and "a whole extra bullet", and it lets a downgrade take *half* a projectile back.

**Rule: a fractional projectile count is resolved per shot by a deterministic accumulator, never by a random roll.**

```text
carry += fractionalPart(projectileCount)      # e.g. 0.5
shots  = floor(projectileCount)               # e.g. 1
if carry >= 1: shots += 1; carry -= 1
```

At 1.5 projectiles the pattern is **1, 2, 1, 2** — exactly as specified, and stable rather than streaky. At 1.25 it is 1, 1, 1, 2. At 2.75: 2, 3, 3, 3.

Rules:

- The accumulator is **per weapon instance**, so two Service Rifles at 1.5 do not lock into the same rhythm; seed each instance's carry at `instanceId × 0.37 mod 1` so they interleave.
- It is **deterministic** — no RNG — so a seeded run reproduces exactly and tests can assert the sequence.
- Floor is **1 projectile** for any weapon with a count above 0: a downgrade may take a weapon to 0.6 (pattern 1, 0, 1, 1, 0…) only if the design explicitly wants skipped shots; otherwise clamp to a minimum of 1 per shot.
- The same accumulator pattern serves any future fractional-count mechanic (extra chain arcs, extra pellets), so it lives in one shared helper.
- The stat card displays the raw fractional value (`1.5 projectiles`), not the rounded one — the player should understand why the rhythm alternates.

## Damage baseline

The starter weapon anchors the whole scale.

| Weapon | Damage per bullet | Cadence | Effective DPS |
| --- | ---: | ---: | ---: |
| Bastion Service Rifle (starter) | **2** | 0.14 s | ~14 |
| Scattergun | 1 × 5 pellets | 0.72 s | ~7 |
| Arc Carbine | 3 (+70%/49% decayed arcs) | 0.62 s | ~5 direct |
| Bolt Carbine | 5 (pierces 2) | 1.8 s | ~3 per target |
| Grenade Tube | 4 direct + 2 splash | 4.0 s | ~1.5 single, high vs groups |
| Bulwark Rotary Cannon | 2 | 0.08 s spun up | ~25 while stationary |
| Patrol Blade | 4 | 2.5 s | ~1.6 automatic |

Rescaling rule: every existing weapon's damage is divided by ~5 from today's values and enemy health follows, so relative balance is preserved while the readable range starts at 2. Status magnitudes rescale in the same pass (e.g. Blaze 7/s → **0.5/s for 3 s**; the durations and the Freeze slow percentage are unchanged), and enemy-to-player damage rescales to the 10-health model in the table below. Telegraph damage thresholds rescale with it. Multi-hit weapons keep low per-hit numbers on purpose — a Scattergun blast reading `1 1 1 1 1` communicates "five pellets landed" better than one `7`.

**Damage numbers (confirmed 18 July 2026):** small floating numerals at the impact point, damage-type coloured — **standard ivory/white for normal/physical, red for fire, blue for frozen/cryo, teal for lightning/shock, green for poison/toxic** — crits/weak points larger, healing ticks small green with a `+`. Pooled like existing effects, capped (~40 concurrent) with overflow merged into a single number per enemy per 100 ms so a twelve-weapon build cannot bury the arena in text. Setting: Damage numbers On/Off.

## Monster health, armour, and speed

Wave 1 values, tuned so the starter rifle kills a Scuttler in **2 bullets** (~0.3 s) and the wave is comfortable:

| Enemy | Health | Armour | Shield | Speed (m/s) | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| Scuttler | 4 | 0 | 0 | 2.35 | The unit every other number is judged against |
| **Swarm Scuttler** (new) | 2 | 0 | 0 | 4.2 | Zergling rush: outruns the Marine, dies to one bullet, arrives in packs of 8–12 |
| Blast Mite | 2 | 0 | 0 | 3.6 | Dies to one bullet; the threat is its detonation |
| Razor Scuttler | 3 | 0 | 0 | 3.35 | Fragile interceptor |
| Brain Blob | 6 | 0 | 0 | 0.9 | Telegraph teacher |
| Slime Spitter | 7 | 0 | 0 | 1.15 | Ranged pressure |
| Quillback | 9 | 1 | 0 | 1.4 | First armour the player meets |
| Spinewheel | 12 | 1 | 0 | 7.0 rolling | Ricochet disruptor |
| Warp Flanker | 5 | 0 | 0 | 1.4 | Teleporting harasser |
| Tether Bloom | 10 | 0 | 0 | 0 | Stationary control |
| Ripper | 14 | 2 | 0 | 1.6 | Bruiser |
| Egg Cluster | 7 | 0 | 0 | 0 | Objective, not a threat |
| Carapace Scuttler (elite) | 45 | 3 front | 0 | 1.85 | Elite multiplier ≈ 3.5× base family |
| **Razorlord** (fast elite) | 30 | 1 | 0 | 4.6 / 11 dash | Cannot be outrun; dodge or kill |
| **Blightspitter** (fast elite) | 40 | 1 | 0 | 2.4 | Repositions aggressively between volleys |
| **Quillback Matriarch** (elite) | 50 | 2 | 0 | 1.4 | Rain-of-spines attack; the first "look at the ground" elite |
| Siege Crusher (mini-boss) | 600 | 2 flat | 0 | 1.25 | 45–90 s fight target |
| Brood Warden (mini-boss) | 540 | 2 flat | 0 | 1.4 | |
| Bastion Eater (final boss) | 2 400 | armour shutters | 0 | — | 3–5 min fight target |

### Per-wave scaling

Applied to the base values above at spawn time; **authored, not compounding surprises**:

| Statistic | Growth per wave | Cap | Rationale |
| --- | --- | --- | --- |
| Health | `base × (1 + 0.28 × (wave − 1))` | none | Linear-ish; wave 10 ≈ 3.5× wave 1 |
| Armour | `base + floor(wave / 3)` | 8 | Diminishing armour formula means +1 stays meaningful |
| Shield | 0 until wave 5, then `2 × (wave − 4)` on Quillback/Ripper/elites only | 20 | Introduces the shield-break rhythm late, and only on units that read as "technological" |
| Speed | `base × (1 + 0.03 × (wave − 1))` | ×1.35 | Kept small: speed is the least fair pressure lever |
| Contact damage | `base × (1 + 0.15 × (wave − 1))` | ×3 | See the damage table below |

Elites use family base × 3.5 health and gain wave scaling on top. Mini-bosses and the final boss do **not** take wave scaling — their fights are authored.

## Speed tiers

Speed is the pressure lever players feel most, so it is authored in explicit tiers rather than drifting per enemy. The Marine moves at **5.25 m/s** — that is the yardstick.

| Tier | Speed | Rule | Members |
| --- | ---: | --- | --- |
| **Rush** | 3.4–4.2 | Faster than a walking player *can outrun in a straight line* only briefly; must be fragile (≤3 HP at wave 1) and must die to one bullet from any weapon | Razor Scuttler 3.35, Blast Mite 3.6, **Swarm Scuttler (new) 4.2** |
| Standard | 2.0–2.6 | The bulk; you outrun them, but not while shooting | Scuttler 2.35 |
| Slow | 0.8–1.6 | Trades speed for reach, range, or health | Brain Blob, Spitter, Quillback, Ripper |
| Static | 0 | Position denial | Tether Bloom, Egg Cluster |
| **Burst** | 7.0–9.5 | Only inside a committed, telegraphed dash — never sustained | Spinewheel roll 7.0, Razor dash 9.5, Crusher charge 8.4 |

**The zergling-rush rule:** rush-tier enemies exist to break kiting patterns, so they must be *lethal to ignore and trivial to kill*. The new **Swarm Scuttler** (4.2 m/s, 2 HP, 3 contact damage, cost 1) is the purest expression — it arrives in packs of 8–12, outruns the Marine, and dies to a single bullet. It is the enemy that punishes a player who is only backpedalling, and the reason Scattergun/Patrol Blade builds have a job.

**Fast elites.** Elites inherit their family's tier but a subset are deliberately faster than their base, so "elite" never just means "bigger health bar":

| Elite | Base family | Speed change | Effect on play |
| --- | --- | --- | --- |
| Carapace Scuttler | Scuttler | 1.85 (slower) | Trades speed for frontal armour — flank it |
| **Razorlord** (new) | Razor Scuttler | **4.6 sustained, 11 dash** | Cannot be outrun; must be dodged or killed |
| **Blightspitter** (new) | Slime Spitter | 2.4 (2× base) | Repositions aggressively; you cannot camp one lane |
| Synapse Brain | Brain Blob | 0.9 (unchanged) | Stays slow; threat is the marked zone |

At most **one fast elite per wave** — two simultaneously removes the player's ability to disengage anywhere, which crosses from hard into unfair.

## Unique attacks and on-screen telegraphs

Every attack that can take more than ~1 damage (a tenth of a fresh Marine) must announce itself on the ground, in world space, at its true geometry. The rule from the projectile contract holds: **art reinforces the warning, code owns it.**

| Attack | Owner | Telegraph shown on screen | Timing |
| --- | --- | --- | --- |
| Frontal cone sweep | Ripper *(implemented)* | Exact filled cone, 2.55 m, locked direction | 0.62 s wind-up → 0.2 s active → 1.1 s recovery |
| Charge lane | Siege Crusher, Razor *(implemented)* | Lane line to impact point | 0.7 s / 0.48 s lock |
| Spike fan | Quillback *(implemented)* | Fan lines with visible gaps | Scales 1 → 3 → 5 shots |
| **AoE ground slam** | **Crusher (enraged), Abomination** | **Expanding ring decal** on the floor showing the final radius, filling from centre as the wind-up completes | 0.8 s tell → hit at ring completion → 1.3 s recovery |
| **Rain of spines (arrow-rain)** | **Quillback Matriarch (new elite)** | **Cluster of small crosshair decals** marking each impact point ~1.2 s before landing, each with a shrinking reticle | 1.2 s from launch to landing |
| **Sweeping arc** | **Brood Warden (enraged)** | **Swept arc decal** that fills clockwise through the swing so the player reads which side is safe | 0.7 s tell → sweep along the fill |
| **Line beam** | **Future Herald** | Thin bright line that thickens to full width at the moment of fire | 1.0 s tell |
| Radial pulse | Brain Blob / Synapse | Circle outline at true radius, pulsing inward | 0.45 s |

Telegraph rules (fairness contract):

- Colour is **hostile-warm** (orange→red as the tell completes) and never reuses the player's teal/cyan family.
- Decals are drawn **under actors**, above the floor, so a crowd never hides the warning.
- Minimum tell for anything over 2.5 damage (a quarter of a fresh Marine) is **0.7 s**; the player's roll is 0.55 s with 0.25 s invulnerability, so every big attack is dodgeable by reacting to the tell.
- **Off-screen attackers must not hit an unwarned player.** With the scrolling arena, any telegraph originating outside the camera view shows an edge marker at the screen boundary.
- Simultaneous big telegraphs are capped at **2**; the encounter director delays a third rather than stacking three unreadable overlays.
- Rain-type attacks never cover more than ~35% of the arena's traversable area, guaranteeing a safe route.

## Per-level stat package magnitudes

These are the concrete values behind the `+1` notation in the hero growth table in `last-bastion-game.md`, so the tuning pass can move the whole curve from one place.

| Notation | Concrete effect | Marine at level 10 |
| --- | --- | ---: |
| +1 health | +1 max health | +9 → 19 HP |
| +1 armour | +0.5 armour | +4.5 → 4.5 armour (≈23% reduction) |
| +1 damage | +2% weapon damage (additive) | +18% |
| +1 speed | +1.5% movement speed | +13.5% |
| +1 proficiency (class) | +4% damage with that weapon class | Light +36% |
| +1 support effect | +5% healing/shield from all sources | — |

Sanity check on the Marine: by wave 10 the package alone yields ~136 HP, 4.5 armour, +18% damage and +36% with Light weapons — meaningful, but far less than a focused upgrade path (Composite Plating IV alone is +12 armour). **That ratio is deliberate: the package is the floor, the choices are the build.**

## Monster damage to the player

**Rescaled 18 July 2026 to the Brotato-style 10-health model** (see "Starting player health" in Wave pacing v2). Early enemies deal 1–3 and scale up; damage is split by delivery so avoidance is always the answer:

| Attack class | Wave 1 damage | Examples | Rule |
| --- | ---: | --- | --- |
| Contact (melee body) | 1–2 | Swarm Scuttler 1, Scuttler 1, Brain Blob 1.5, Razor 0 (dash only) | Cheap and frequent; the hit-invulnerability window prevents stacking |
| Committed melee (telegraphed) | 2–3 | Ripper sweep 3, Razor dash 2.5 | Punishes bad positioning; always has a tell and a recovery |
| Ranged | 1–1.6 | Spitter glob 1.5, Quillback spike 1.2, Warden acid 1.6 | Dodgeable in flight; may be blocked by cover |
| Detonation | 3 | Blast Mite 3 | Radius damage with an armed tell; uses the explosion falloff rule |
| Big/boss attacks | 3–5 | Crusher sweep 4, charge 3.5, Eater claw 5 | Never unavoidable; caps at 5 so no single hit exceeds 50% of a fresh Marine |

Wave scaling multiplies these by the contact-damage row above, capped at ×3. A wave-10 Scuttler therefore does ~2.3, not 4+: **the wave should kill you through volume and mistakes, not through one-shot spikes.** Fractional damage is exact under the precision rule (a 1.5 hit on 10 health leaves 8.5, displayed as `8.5`).

### Explosion falloff (new rule, both sides of combat)

Every radius attack — Blast Mite detonation, Grenade Tube blast, explosive weapon impacts, boss slams — deals its **full listed damage inside the inner 40% of the blast radius, falling off linearly to 35% of listed at the outer edge**. Both numbers are stated wherever the attack is documented (e.g. Grenade Tube blast: 2 centre / 0.7 edge), and the codex must list centre and edge damage separately. Falloff is simulation-owned; blast art never implies a different radius.

## Monster spawn budgets

Brotato-style density, adapted: many enemies, arriving continuously, more than the player can clear.

| Wave | Threat budget | Simultaneous cap | Composition |
| ---: | ---: | ---: | --- |
| 1 | 30 | 14 | Scuttlers only — teach movement |
| 2 | 45 | 18 | Scuttlers, Egg Clusters, **first Swarm Scuttler pack** (teaches "you cannot only backpedal") |
| 3 | 65 | 24 | + Brain Blobs, Slime Spitters, Blast Mites, first Quillback |
| 4 | 90 | 30 | + Razor Scuttlers, Tether Bloom, Spinewheel, Ripper, Carapace elite |
| 5 | 120 | 36 | Mini-boss + escorts |
| 6–9 | `90 + 30 × (wave − 5)` | 40 | Mixed roster, second elite from wave 7, at most one **fast** elite per wave |
| 10 | authored | 40 | Final boss |

Rules:

- **Threat budget** is spent on enemy costs (Swarm Scuttler 1, Scuttler 1, Blast Mite 1, Razor 2, Brain Blob 2, Spitter 3, Bloom 3, Quillback 4, Spinewheel 4, Ripper 5, elite 15, fast elite 18, mini-boss 40), so composition can vary at equal pressure.
- **Swarm Scuttlers spawn as packs**, not trickled singles: 8–12 from one edge with a shared arrival tell, so the rush reads as an event.
- **Simultaneous cap** protects performance and readability; the spawner queues the excess rather than dropping it.
- **Continuous trickle**, not front-loaded dumps: the director spawns to keep live pressure near the cap for the wave's duration (v1 targeted 60–90 s per wave — **superseded by the short timed waves in "Wave pacing v2" below**).
- **Fairness invariants:** never spawn within 6 m of the player or inside cover; no more than 2 ranged attackers may hold a wind-up simultaneously; the slime-puddle cap (5) already exists; the arena must always retain a traversable route.
- **Wave end** is a timer, not extermination, from wave 3 onward — leftovers despawn at the boundary with a retreat tell. This is the mechanical statement of "you can't kill them all."

## Wave pacing v2 — short timed waves (18 July 2026)

Decision from the 18 July planning pass, following Brotato's proven model: waves are **short, timed, and dense from the first minute**. This answers "should waves be 20 s (waves 1–2) and 30 s (wave 3+) for faster testing?" with *yes — and they should ship that way, not only test that way.* Brotato's precedent (20 s opening waves growing to a 60 s cap) shows short waves are the correct release pacing for this genre, so one duration curve serves both fast iteration and the real game. A run becomes ~10 waves × 20–60 s plus intermissions ≈ 8–12 minutes, matching the step 35 run-length target.

### Wave duration curve

| Wave | Duration | Notes |
| ---: | ---: | --- |
| 1 | 20 s | Scuttlers only — teach movement |
| 2 | 20 s | Eggs plus the first Swarm Scuttler pack |
| 3 | 30 s | Overwhelm begins; timer-end rule active from here |
| 4 | 35 s | Full mixed roster plus first elite |
| 5 | untimed | Mini-boss wave: ends on the kill (45–90 s fight target unchanged) |
| 6 | 40 s | |
| 7 | 45 s | Second elite enters the rotation |
| 8 | 50 s | |
| 9 | 60 s | Endurance peak |
| 10 | untimed | Bastion Eater, authored 3–5 minutes |

Rules:

- The curve is **+5 s per wave from wave 3, capped at 60 s**, stored as authored per-wave data — a bad wave length is a one-line data fix.
- The wave timer is always visible on the HUD; from wave 3 the timer ends the wave (leftovers retreat/despawn per the spawn-budget rules), while full extermination may end waves 1–2 early.
- Durations stay data-driven so a `pace=` review route can halve or double every timer for testing without touching balance numbers.

### Spawn rate, density, and elite cadence

The v1 threat budgets and enemy stat tables stand; what changes is how fast they are spent.

- **Spend rate:** the director targets threat-per-second = wave budget ÷ wave duration. The same budget landing in a third of the time yields roughly **2–3× the v1 density** — this is the requested "more monsters, faster" and it comes from the timer, not from new budget numbers. If a wave still feels thin, raise its budget; never stretch its duration back out.
- **Spawn cadence:** spawn in small pulses every 2–3 seconds rather than a per-frame drip, so arrivals read as events; Swarm Scuttler pack rules are unchanged.
- **Simultaneous caps rise** to carry the density. The next implementation lab targets wave 1 → 18, wave 2 → 24, wave 3 → 32, wave 4 → 42, wave 5 → 46, waves 6–7 → 52, waves 8–9 → 56. These are director ceilings, not guaranteed instant crowds; average occupancy across waves 3+ should remain at least 70% of the relevant cap. The old 44-entity capacity scene becomes a 56-entity web acceptance scene.
- **Elite cadence:** first elite at wave 4 (unchanged); one elite **guaranteed** every wave from wave 6; two elites (at most one fast) from wave 8. The one-fast-elite-per-wave cap is unchanged and non-negotiable.
- **Speed and health:** the v1 stat tables and per-wave scaling formulas are deliberately untouched. Short waves raise pressure through density; raising stats *and* density in the same pass would make cause and effect unreadable in playtests. Revisit stats only after the density change is felt.

### Density director v3 — pursuit majority and smarter ranged units

The arena should feel like a horde pressing inward, not a collection of specialists waiting for turns. Composition and steering follow these rules:

- **65–75% of ordinary threat is pursuit pressure.** Scuttlers, swarmers, infected survivors, and other commons take a direct or lightly separated route toward the Marine. Simple chase is desirable here: the mass itself is the puzzle.
- **15–25% is ranged or standoff pressure.** A standoff shooter maintains a minimum/preferred/maximum range band, retreats when crowded, advances when too far away, and commits only after a readable wind-up. A chase-and-fire shooter keeps advancing and fires on cadence. Artillery repositions to long range and never shoots from an unseen edge without a marker.
- **5–10% is support, control, or elite pressure.** Spawners, tethers, flankers, and elites change target priority, but they do not replace the pursuit body of the wave.
- Direct pursuers receive light local separation and obstacle routing so a pack flows around cover rather than forming an immovable collision wall. Separation must not create a perfect ring around the player.
- The director uses **composition quotas plus threat cost**, preventing a seed from spending the whole wave on ranged units. At most two hostile shooters may be in wind-up and at most six ordinary hostile projectiles may be active initially; capacity tests may raise the projectile budget separately from the monster cap.
- Spawn pulses alternate edges and lanes, with occasional authored pack events. Never materialize inside 6 m, inside cover, in the player's immediate travel vector, or behind an opaque edge without a warning.
- The next tuning pass raises ordinary-wave threat budgets by **25% as a starting candidate**, then records spawned count, average live count, ranged share, projectile occupancy, time at cap, damage taken, and frame time. Keep the increase only if waves 3+ feel crowded without hiding telegraphs or breaking the frame-time target.
- Web acceptance is stable 60 fps on the named reference machine at 56 live enemies, 100 pooled projectiles/effects, and representative drops. The future Steam stretch target is 80–96 live commons with 180 pooled projectiles/effects; it is a performance gate, not a promise to fill every wave to that number.

AI profiles are data, not bespoke branches per species: `pursuer`, `rushPack`, `chaseAndFire`, `standoffShooter`, `artillery`, `flanker`, `supportAnchor`, and `treasureFlee`. Each profile exposes preferred range, retreat range, lead amount, repath cadence, line-of-sight rule, and attack commitment state. Enemy definitions choose and tune a profile while their special attacks remain separate state machines.

### Aurum Hoarder reward event

The Aurum Hoarder is a rare optional treasure creature, paid from an event reserve rather than the normal threat budget. It does not count toward the simultaneous combat cap or wave clear, but the director must defer its arrival if adding it would exceed the tested entity ceiling.

- Eligibility begins at wave 3; maximum one per eligible ordinary wave; never during a tutorial, mini-boss, final boss, or forced objective.
- Initial durability target is 4–6× a same-wave common with moderate armour, negligible contact damage, and a catchable `treasureFlee` profile. Threshold armour breaks pay partial Scrap before escape.
- A kill awards a large Scrap bundle plus one guaranteed supply cache. Use Scrap rather than introducing “gold”; the creature's gold-brass plating communicates rarity without fragmenting the economy.
- It exits through a telegraphed arena edge after a short forage window and never blocks wave completion. Drops are banked or magnetized before the transition.
- Required tests cover seeded spawn eligibility, one-per-wave, boss/tutorial exclusion, non-blocking wave end, partial rewards, valid cache loot, safe exit selection, and deterministic save/Codex discovery.

### Starting player health and regeneration

**Rescaled 18 July 2026 to Brotato-style numbers.** The Marine starts at **10 health**; early enemies deal 1–3 damage and scale up. This puts player health on the same readable scale as the 2-damage starter rifle and 4-health Scuttler — every number in the game now lives in the same single-digit-to-tens range.

- **Regeneration:** the Marine's baseline is **0.2 health per second, applied as one 0.6 tick every 3 seconds**. Regen never pauses in combat; its slowness is the balance. The `+1 support effect` package point and future Regeneration upgrades raise the per-second amount, never the tick rate — the 3-second cadence is a design constant so healing always reads as discrete visible ticks (small green `+0.6` floating text, same pipeline as damage numbers).
- Health is still balanced in **hits endured**:

| Wave | Typical contact hit | Hits a fresh unupgraded Marine endures |
| ---: | ---: | ---: |
| 1 | 1 | 10 |
| 5 | ~1.6 | ~8 (with level-package health gains) |
| 9 | ~2.2 | ~6–7 |

- **Floor rule:** a levelled-but-undefended Marine must never drop below ~5 endured contact hits, and no single attack exceeds **5 damage (50% of a fresh Marine)** — and anything above 2.5 must carry the full 0.7 s telegraph.
- If 20-second opening waves feel too safe, cut the wave 1–2 budgets rather than player health — the first forty seconds are the hook, and dying in them teaches nothing.
- Future heroes differentiate by health and regen baseline (a tanky hero might start at 13–15 with the same regen; the Medic seed below 10 but with stronger support scaling). The Marine's 10 health / 0.2 regen is the tuning yardstick and does not move during this pass.

### Starting weapons and the acquisition schedule

- **Starting loadout:** Bastion Service Rifle only (2 damage per bullet — the anchor of the whole damage scale), one occupied rack slot, all others empty.
- **Guaranteed first pick:** the wave 1 intermission always offers a Weapon Cache — pick one of three seeded Tier I tiles from the early pool. This is the genre's "second weapon by minute one" moment and the first build decision.
- **Pool by wave band:**

| Wave band | Cache/shop weapon pool |
| --- | --- |
| After wave 1, waves 2–3 | Tier I: Scattergun, Patrol Blade, Arc Carbine — low-complexity horde tools |
| Waves 4–6 | + Bolt Carbine, Grenade Tube; Tier II tiles may appear from wave 5 |
| Waves 7–9 | + Bulwark Rotary Cannon; Tier II common, Tier III by merge only |
| Any wave | Hero-specific weapons appear only for their hero at +25% tier price; **Uniques (Event Horizon) are never pool items** — mini-boss vault or Artifact only |

- Rationale: the early pool is what a panicking new player can use without aiming discipline; precision (Bolt) and commitment (Grenade, Bulwark) weapons arrive once armour, elites, and crowds exist to justify them. Weapon prices are unchanged from the tile-economy table.

### Verification additions (extends the numbered plan above)

16. **Durations:** each wave matches the authored duration table; from wave 3 the timer, not extermination, ends the wave.
17. **Density:** live enemy count averages ≥70% of the simultaneous cap across waves 3+ on a reference seed, and never exceeds the cap; pursuit threat remains 65–75% and ranged threat remains within its quota.
18. **Elite cadence:** elites appear exactly per schedule across many seeds; no wave ever holds two fast elites.
19. **First pick guaranteed:** wave 1 always ends in a three-option Tier I weapon offer, and the pool respects the wave-band table.
20. **Capacity:** the 56-enemy web capacity scene holds the frame-time budget on named reference hardware; the separate Steam stretch scene proves 80–96 only before those caps are enabled.

## Experience and levelling

| Enemy | XP | Notes |
| --- | ---: | --- |
| Swarm Scuttler | 1 | A cleared pack is worth ~10 — rushes pay |
| Scuttler / Blast Mite | 1 | |
| Razor / Brain Blob / Warp Flanker | 2 | |
| Spitter / Tether Bloom | 3 | |
| Quillback / Spinewheel | 4 | |
| Ripper | 6 | |
| Egg Cluster | 2 | Prevention still pays |
| Elite | 25 | Plus the guaranteed Requisition cache |
| Fast elite | 30 | Higher risk, higher pay |
| Mini-boss | 60 | Plus the arsenal cache |

**Threshold curve:** `threshold(level) = 5 + 4 × level + level²/2` (level 1→2 costs 9, 5→6 costs 38, 10→11 costs 95). Today's `level × 4` is far too flat once waves pay hundreds of XP. Target: **9–12 levels per full 10-wave run**, which matches the 7–12 upgrade slots so a player fills their build by the finale without every slot maxing out.

XP shards drop at the kill point, attract within the magnet radius, and **persist for the whole wave** (currently permanent) so the Scavenger category and Field Magnet have real value under pressure.

## Scrap (money)

Scrap is the same-run shop currency. **It stays disabled until the Shop node exists** — the working rule against awarding unusable currency still holds. When enabled:

| Source | Scrap |
| --- | ---: |
| Ordinary kill | 1 (25% chance) — small and noisy on purpose |
| Quillback / Spinewheel / Ripper | 2 |
| Elite | 15 |
| Mini-boss | 40 |
| Wave clear bonus | `10 + 5 × wave` |
| Unused wave time | 1 per 5 s remaining — rewards efficient clearing |

The **Mineral Find %** stat (already reserved in `DefenceStats`) multiplies all Scrap gain; 100% is baseline. This is what finally activates the Scavenger slot category as a real build axis.

Expected income across a 10-wave run ≈ 400–550 Scrap. Shop prices should target: weapon 60–120, upgrade re-roll 15, slot requisition 90, heal 40.

### Weapon tile economy

Prices for the tile/inventory system designed in `last-bastion-game.md`:

| Weapon tier | Buy | Sell (50%) | Merge cost |
| --- | ---: | ---: | ---: |
| Tier I | 60 | 30 | free (2 identical tiles → 1 Tier II) |
| Tier II | 120 | 60 | free (2 identical → 1 Tier III) |
| Tier III | 220 | 110 | — (tier cap) |
| Hero-specific | +25% of tier | 50% | as tier |
| Unique | 300 | 150 | never merges |

Rack expansion (a new weapon slot) costs **150** at a shop, or arrives free from Shrine of Steel at a maximum-health cost. Inventory expansion is not purchasable — 4 stash slots is a design constant, because unlimited hoarding removes the discard decision.

Merged weapons gain **+60% damage and one behavioural step** over the tier below, which is why merging two Tier I tiles beats holding both in separate slots (2 × 100% = 200% of a tile's damage across two slots, versus 160% in one slot plus a freed slot for something new). The merge is a *tempo* choice, not a strict upgrade — that tension is the point.

## Items

Distinct from upgrades: **upgrades are chosen from level-ups and consume slots; items are found, bought, or dropped and do not.**

| Item class | Acquisition | Effect | Cap |
| --- | --- | --- | --- |
| Consumable kit | Ordnance cache, shop | One-shot activatable (Uranium-Core Rounds and friends) | 1 carried (bottom bar) |
| Powerup | World pickup | Timed buff (implemented) | 4 types |
| Relic | Route reward, shrine | Run-long passive rule change | 6 per run |
| Artifact | Mini-boss, rare shrine | One equipped run-defining effect | 1 |

Item drops must never be *required* to survive a wave — they raise the ceiling, they don't hold the floor. Wave 1–2 drop nothing but XP and health, so the first minutes stay clean.

## Verification plan

Each of these is a rules test, not a vibe:

1. **Starter clarity:** a wave-1 Scuttler dies to exactly 2 Service Rifle bullets.
2. **No one-shots:** no single attack at any wave exceeds 5 damage (50% of a fresh 10-health Marine) after all scaling.
3. **Overwhelm curve:** from wave 3, total spawned health exceeds a reference build's damage output for the wave duration (the player cannot clear it).
4. **Budget respected:** live enemy count never exceeds the simultaneous cap; the budget is spent within ±10%.
5. **Fair spawns:** no spawn within 6 m of the player or inside an obstacle, across many seeds.
6. **Levelling target:** a scripted reference run reaches level 9–12 by wave 10.
7. **Scrap stays off** until a shop exists (guard test).
8. **Precision:** `2.1` damage against `4.3` health leaves exactly `2.2` (3-decimal assertion); mitigation floors at 0.1, never 1.
9. **Fractional projectiles:** a weapon at 1.5 emits the deterministic sequence 1, 2, 1, 2 across four shots; two instances of the same weapon do not share a rhythm.
10. **Rush rule:** every rush-tier enemy dies to one bullet from any wave-1 weapon and moves faster than the Marine.
11. **Fast-elite cap:** no wave spawns two fast elites simultaneously.
12. **Telegraph fairness:** every attack above 20 damage has a tell of ≥0.7 s; at most two big telegraphs are active at once; rain attacks never cover >35% of traversable area.
13. **Slot legality:** a weapon can only be placed in a slot accepting its class; a swap never destroys a tile; a full rack plus full inventory always still offers discard.
14. **Merge rules:** only identical id and tier merge; tier caps at III; Uniques never merge; a merge frees exactly one slot.
15. **Level packages:** a level-10 Marine has exactly the values in the package-magnitude table (guards accidental curve drift).

## The per-wave squeeze

The whole document exists to produce one loop: **each wave the monsters gain more than you do, unless you spend your rewards well.** Concretely, per wave the arena gains ~28% health, +1 armour every third wave, ~15% contact damage, and a larger budget — while the player gains one level package (small), one or two upgrade choices, and periodically a weapon or a Requisition slot.

That maths is deliberately slightly against the player, which forces the real decision every wave:

- **More damage** (upgrade a weapon, merge tiles, take Heavy Calibre) — keeps kill speed ahead of health growth.
- **More survival** (Composite Plating, Shield Capacitor, Patch Up) — keeps you alive as contact damage climbs.
- **More breadth** (a Requisition slot, a new weapon) — raises your ceiling but pays nothing this wave.
- **More economy** (Scavenger, Mineral Find) — pays later, costs now.

A player who only takes damage dies to wave 7 contact volume; a player who only takes armour cannot clear wave 8's health pool before the timer and gets ground down. **The tuning pass succeeds when no single axis solves the run.**

## Implementation order (when this document is green-lit)

This is a large, cross-cutting change. Suggested sequencing so nothing lands half-done:

1. **Precision + display** (`formatStat`, 0.1 floor, damage numbers) — visible immediately, unblocks judging every later number. **Implemented 18 July 2026** (see `last-bastion-log.md`): shared `formatStat` round-half-up helper, mitigation floor lowered 1 → 0.1, and pooled floating damage numbers with the confirmed type colours and a `damageNumbersEnabled` setting (`?damage=0|1`).
2. **Rescale weapons and enemies** to the 2-damage baseline in one data pass; keep existing rules tests passing by updating expected values together.
3. **Per-wave scaling** table + threat-budget spawner with caps and the timer-based wave end.
4. **Fractional projectiles** helper (shared accumulator).
5. **Level packages** + live `weaponProficiencies`.
6. **Speed tiers**: Swarm Scuttler, fast elites.
7. **New telegraphs**: ground slam, rain of spines, sweeping arc (code-drawn first, Batch J art after).
8. **XP curve** re-tune, then measure the reference run.
9. **Weapon tiles/inventory/merge** — the biggest UI piece; needs the shop node, so it lands with the map's Shop work.
10. **Scrap**, only once the shop exists.

## Open questions for the tuning pass

- ~~Does wave duration (60–90 s) hold on the 45 × 25 m arena, or does the bigger space need a higher simultaneous cap to feel dense?~~ **Resolved 18 July 2026:** short timed waves (20/20/30 + 5 s per wave, capped 60) with raised caps — see "Wave pacing v2". The open part is now empirical: do the raised caps hold frame rate (verification 20)?
- Should elites scale with the wave, or stay authored like mini-bosses? Current proposal scales them; playtest may disagree.
- ~~Is 2 damage per bullet too granular once Heavy Calibre III lands?~~ **Resolved 17 July 2026:** the precision rule (calculate in float, display 1 decimal) makes `2 → 4.9` correct and readable rather than a rounding problem.
- Do fractional projectiles below 1 (skipped shots) ever feel good, or should the floor always be 1?
- Is a 4-slot inventory the right size once six or more weapons are in the pool?
- Should merging be free (tempo cost only) or cost Scrap? Current proposal: free, because the slot opportunity cost is already the price.
