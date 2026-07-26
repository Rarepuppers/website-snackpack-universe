# Batch AK ambient atmosphere

Presentation-only ambient accents for boss arenas: cool steam, maintenance dust, forge embers, reactor heat shimmer, void motes, hive spores, military ash, and neutral particulate wash.

The atlas is 4×2 with stable cell order. Retained transparent source and 256px per-cell preflight derivative remain here; runtime 128/64px derivatives are copied to `game-assets/`.

These accents are optional background layers, not combat effects. They must remain lower contrast than actors and code telegraphs and may not define hazards, ranges, targets, timing, collision, or damage.

`normalize_batch_ak_atmosphere.py` rebuilds the master, runtime derivatives, and contact sheet deterministically.
