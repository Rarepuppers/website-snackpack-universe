# Stash persistence — 27 October 2026

G1 implemented locally as `web-2026.10.27-stash-persistence`, save schema 17.
Simulation compatibility remains 3: recorded standalone replay inputs are unchanged.

The schema carries `weaponStash`, an ordered array of weapon IDs/tiers and null slots.
Combat reconstruction assigns fresh encounter-local instance IDs after the active rack;
stash weapons are never added to the firing loadout. Pre-17 saves with no stash remain
empty: previously lost weapons cannot be recovered. Invalid IDs/tiers become empty slots;
input is bounded to seven slots (base four plus the shipped Logistician bonus).
Occupied bonus slots survive a smaller perk on resume; empty excess capacity does not.

Production paths reviewed: combat snapshot → completeCurrentNode → PrototypeScene save;
ExpeditionScene travel save; ExpeditionEventScene and EncounterEventCatalog spread build
fields; LocalSaveStore clones/normalizes the stash; PrototypeScene supplies the saved build
to CombatSimulation. Rack/event reward behavior is unchanged.

## Verification

- Full verifier passed all four lanes in 195.2 seconds; see verification.json/txt.
- 59 browser checks, including saved expedition → build inspector → page reload showing
  the tier-2 Scattergun. This is seeded renderer evidence, not an observed earned run.
- All 23 portfolio guards passed (portfolio.txt).
- Final typecheck and eight stash integration cases passed separately after strengthening
  the sequential travel test and adding event/save-write-failure recovery coverage.
- Covers accepted Store choice, repeated travel/reload, tiers, holes, unique runtime IDs,
  no auto-equipping, merge, sale/no resurrection, full 4/6/7-slot stashes, perk changes,
  schema-16 migration, invalid data, event preservation and failed-write retry.

No human, controller, audio, hardware, real power-loss or Steam-cloud acceptance.
No push, deployment or executable packaging. Claude remains the assigned packaging owner.
The original failed witness remains in ../2026-10-26-gameplay-review/.
