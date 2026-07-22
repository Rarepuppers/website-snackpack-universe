# Last Bastion transformation-path production plan

## Decision

Transformation is an optional, run-local specialization layered over the selected hero, normal XP upgrades, weapon tiers, and pre-run perk. A single exposure never locks the player. The third aligned choice commits the run to that family; later aligned choices unlock Ascended and Apex stages.

This plan does not add transformation rooms, offers, statistics, save fields, UI, art, or combat effects. The first implementation boundary is the pure Affinity model under `dev/src/game/transformations/`.

## Affinity and commitment

| Affinity | Stage | Rule |
| --- | --- | --- |
| 0 | None | No contact with the family |
| 1 | Exposed | Minor benefit/scar; reversible at an authored purge service |
| 2 | Adapted | Strong warning: the next aligned choice commits the run |
| 3-4 | Transformed | Family locked; other path offers close; off-path minor exposures remain inactive scars |
| 5-6 | Ascended | Select one major branch ability or upgrade it |
| 7 | Apex | Select the capstone/final scar; no further Affinity |

Repeated levels of the same aligned perk are legal and each adds one Affinity. Different choices in the same family also contribute. Before commitment the player may carry exposure in several families and may purge one whole uncommitted family. A committed family cannot be purged. Commitment resets at the end of the expedition; account progression may unlock choices but never permanently assigns a path.

## Active six-path scope

### Mutagenic Evolution

- Sites: unstable liquid pool, mutation vial rack, surgery platform.
- Identity: regeneration, maximum-health adaptation, reactive organs, biological retaliation.
- Branches: Regenerator, Juggernaut, Reactive Organism.
- Scar space: weaker shielding, reduced conventional healing, or a bounded unstable response.

### Alien Symbiosis

- Sites: symbiote tank, egg chamber, chimera nursery, biomass cradle.
- Identity: toxic/acid output, feeding, tendrils, carapace, alien mobility.
- Branches: Toxic Brood, Predatory Tendrils, Carapace Host.
- Scar space: fire vulnerability, biomass hunger, or reduced armour compatibility.

### Cybernetic Ascension

- Sites: cybernetics chair, assembly cradle, neural replacement chamber.
- Identity: targeting, attack cadence, shielding, drones, automated systems.
- Branches: Targeting Suite, Drone Controller, Shield Lattice.
- Scar space: Shock/EMP vulnerability, weaker organic healing, slower evasive recovery.

### Void Initiation

- Sites: forbidden circle, anomaly lens, void obelisk, damaged stargate.
- Identity: gravity wells, warps, implosions, entropy, health-for-power decisions.
- Branches: Rift Walker, Gravity Adept, Entropy Channeler.
- Scar space: lower maximum health, reduced pickup efficiency, controlled instability.

### Bastion Super-Soldier

- Sites: training centre, shooting range, enhancement chair, combat-simulation pod.
- Identity: conventional weapon proficiency, armour discipline, recoil control, ordnance.
- Branches: Heavy Gunner, Vanguard, Demolitionist.
- Scar space: heavier movement, longer ability recovery, reduced exotic/support efficiency.

### Psionic Operative

- Sites: psionic amplifier, sensory-deprivation tank, neural focus chamber.
- Identity: controlled neural power without void corruption: telekinesis, weak-point marks, projectile manipulation, foresight.
- Branches: Psionic Sniper, Telekinetic, Battle Seer.
- Scar space: mental strain, concentration interruption, reduced armour.

Psionic geometry uses clean line-of-sight, vectors, marks, kinetic shapes, pale gold, cyan, and white. Void geometry uses anomalies, dark cores, violet fractures, lensing, and spatial instability. The two families must not share names, effects, or silhouettes merely because both appear supernatural.

## Choice and warning contract

Every transformation decision must show the exact benefit, exact scar, current Affinity, resulting stage, purge eligibility, and whether the selection commits the run. At 2/3 Affinity the confirmation explicitly lists every family that will close. Controller confirmation uses a deliberate hold; Leave remains available. Random pools display all possible paired outcomes and probabilities before commitment. Controlled chambers may charge Scrap to stabilize or select the result.

No scar may invert controls, hide telegraphs, delete equipment, permanently disable primary fire, create unavoidable damage, or make healing/shops unusable. A path should be net-positive while forcing a recognisably different build.

## Active paired-choice numeric preflight

The inert data contract is `dev/src/game/transformations/TransformationChoiceCatalog.ts`. Every choice has three ranks; listed numbers are total values at ranks I/II/III and replace rather than compound with the earlier rank.

| Path / choice | Boon I/II/III | Scar I/II/III |
| --- | --- | --- |
| Mutant - Regenerative Glands | +0.12/0.18/0.24 health/s after 4 seconds safe | -15/22/30% shield recharge |
| Mutant - Dense Tissue | +12/18/25% maximum health | -4/6/8% movement speed |
| Mutant - Reactive Blood | 3/4/5 retaliation damage, five-second cap | -8/12/16% healing received |
| Alien - Acidic Secretions | +20/30/40% Corrode buildup | +10/15/20% Fire damage received |
| Alien - Feeding Tendrils | 0.15/0.22/0.30 nearby-kill healing, rate capped | -10/15/20% conventional healing |
| Alien - Symbiotic Carapace | +2/3/4 armour | +8/12/16% evasive cooldown |
| Cybernetic - Targeting Suite | +15/25/35% projectile speed and -10/15/20% spread | +15/25/35% Shock buildup received |
| Cybernetic - Shield Lattice | +1.5/2.5/3.5 maximum shield | -10/15/20% health healing |
| Cybernetic - Auxiliary Drone | 1/1.5/2 damage every 3.5 seconds | +5/8/12% ultimate cooldown |
| Void - Rift Step | +12/20/28% evasive distance | -6/9/12% maximum health |
| Void - Gravity Adept | 1.2/1.5/1.8 m pull pulse every eighth attack | -10/15/20% pickup radius |
| Void - Entropy Channeler | -10/15/20% ultimate cooldown | -8/12/16% healing received |
| Super-Soldier - Heavy Gunner | +12/20/28% Heavy-weapon damage | -4/6/8% movement speed |
| Super-Soldier - Vanguard Conditioning | +2/3/4 armour | -6/9/12% evasive distance |
| Super-Soldier - Demolitions Doctrine | +15/25/35% explosion radius | -5/8/11% fire rate |
| Psionic - Psionic Sniper | +15/25/35% damage beyond 8 m | -8/12/16% damage inside 3 m |
| Psionic - Telekinetic Focus | 0.8/1.2/1.6 m non-stunning push every tenth attack | -1/2/3 armour |
| Psionic - Battle Seer | -10/15/20% evasive cooldown | -0.5/1/1.5 maximum shield |

These are preflight values, not live balance. Trigger rate caps, elite/boss resistance, qualifying-attack rules, stat clamping, and interaction with existing hero growth must be behavior-tested before any resolver applies them.

## Future-only seventh path: Church of the Designed Arrival

**Planning backlog only. Do not add this path to the active catalog, Affinity offers, save schema, room generator, Codex, UI, or asset queue.**

The fictional Church of the Designed Arrival believes the invasion and portals are intentional revelation. The broad path is one Zealot/Cultist transformation family that splits only after commitment, preventing several nearly identical cult paths.

- Early identity: fanatic resolve, alien-relic interaction, damage bonuses while wounded, and dangerous devotion stacks.
- Commitment name: Zealot of the Arrival.
- Possible post-commitment doctrines:
  - **Portal Prophet:** anomaly prediction, portal manipulation, and summoned marked zones; scar increases instability near closed portals.
  - **Xenotheurge:** channels alien biology and toxic relics; scar makes conventional medicine less effective.
  - **Martyr of First Contact:** gains power while wounded and protects allies/objectives; scar limits shielding and safe healing bursts.
  - **Demonbound Heretic:** accepts infernal power from corrupted portals; scar introduces a visible, bounded possession pressure meter.
- Presentation: improvised Bastion vestments, alien fragments used as relics, portal diagrams, ritualized military hardware, and an original fictional icon language. Avoid direct copies of real-world religions or familiar franchise cult uniforms.
- Narrative tension: Church rooms can contain believers, defectors, evidence, false miracles, and competing interpretations. The game does not confirm that their theology is true merely because portals contain exploitable power.

Promotion from backlog requires the six active paths to pass balance/readability review and requires a distinct mechanical role not already covered by Alien Symbiosis or Void Initiation.

## Implementation sequence

1. **Completed:** six-path design contract and pure 0-7 Affinity/commitment model with no runtime integration.
2. **Completed:** 18 concrete paired boon/scar choices, three ranks each, with numeric-budget and catalog-integrity validation.
3. **Completed:** expedition-build persistence, save-schema-v8 migration/sanitization, combat carry-through snapshots, run-summary/debrief state, cloud-schema checks, and Codex-facing presentation snapshots. No effects are applied.
4. **Completed 23 July 2026:** code-native warning, hold-to-confirm, purge, commitment, and path-closed presentation in an isolated, in-memory decision lab. Standard selections require a short deliberate hold; the third aligned choice uses a distinct 1.25-second permanent-commitment warning; releasing resets progress; cancellation never mutates Affinity; committed paths refuse purge. No save or stat resolver is called.
5. **Next:** implement Cybernetic Ascension as the first placeholder-only behavior pilot.
6. Run build-diversity, controller, accessibility, and irreversible-choice comprehension reviews.
7. Implement the other five families one at a time.
8. Generate chamber/site states, tiles, effects, and modular body overlays only after behavior acceptance.
9. Reassess the Church of the Designed Arrival; it remains deferred unless it adds a new play pattern.

## Explicitly deferred

- Transformation rooms and expedition nodes.
- Stat application and combat effects.
- Live expedition offers and room placement.
- Production runtime decision UI outside the isolated lab.
- Purge service costs and placement.
- Transformation artwork, icons, body overlays, effects, and audio.
- Church/Zealot/Cultist implementation of any kind.

## Persistence contract

- Transformation state is carried as ordered path progress with code-owned choice history; Affinity is derived from valid choices rather than trusting stored totals.
- Save schema v8 migrates versions 1-7. Builds without transformation data receive the empty state.
- Invalid paths, cross-family choices, ranks above three, Affinity above seven, duplicate path rows, and the future-only Church family are removed or clamped without discarding the surrounding expedition.
- A valid committed path must have at least three valid choices. Off-path exposure is clamped to two after commitment.
- Combat snapshots carry the state unchanged but do not resolve any boon or scar.
- Run summaries retain the final state; `createTransformationCodexSnapshot` provides stable names, stages, commitment, and per-choice ranks for debrief/Codex consumers.
