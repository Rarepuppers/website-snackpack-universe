# Batch AK decals

Low-contrast compositing underlays for the eight boss-arena identities: maintenance oil, colosseum scoring, reactor coolant, hive residue, void dust, foundry soot, military scrape, and rubble abrasion.

The atlas is 4×2 with stable cell order. Retained transparent source and 256px per-cell preflight derivative remain here; runtime 128/64px derivatives are copied to `game-assets/`.

These decals are presentation-only. They must remain lower contrast than actors, projectiles, pickups, and code telegraphs; they do not define collision, hazards, targets, ranges, room state, or warnings.

`normalize_batch_ak_decals.py` rebuilds the master, runtime derivatives, and contact sheet deterministically.
