# Batch AK macro material trio

Three large HD/4K-oriented material batches for close-view arena polish:

- `industrial-macro-v1`: clean/coolant reactor and clean/soot foundry plates.
- `hive-void-macro-v1`: clean/wet hive and clean/corrupted void plates.
- `military-colosseum-macro-v1`: clean/scarred military and clean/cracked colosseum stone.

Each is a 2×2 atlas with 384px-per-cell preflight, plus 256/128px runtime derivatives copied to `game-assets/`. Use these as tileable surface alternatives, not gameplay markers. Collision, cover, telegraphs, hazards, and room rules remain code-owned.

`normalize_batch_ak_macro_trio.py` rebuilds all three atlases deterministically.
