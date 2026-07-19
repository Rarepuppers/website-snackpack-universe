# Canonical perk tile refresh — Task 46

Generated with the built-in image-generation workflow on 19 July 2026, using the original Batch I perk strip as a material/style reference. The new 4×2 master contains seven canonical motifs in gameplay order and one reserved transparent cell:

1. Veteran — command star and service chevrons.
2. Scrapper — salvage gear-coin and metal shard.
3. Quartermaster — three-by-three supply grid.
4. Fast Learner — rising arrow through rank bars.
5. Gunsmith — crossed forge hammers and tier spark.
6. Survivor — heart protected by a half-shield.
7. Pathfinder — branching tactical route and destination.
8. Reserved transparent cell.

The retained chroma master is converted with the image-generation skill's shared chroma-removal helper. `normalize_canonical_perks.py` produces the deterministic 512×256 runtime atlas of eight 128px cells. Locks, milestone progress, selection, text, and focus treatment remain code-owned.
