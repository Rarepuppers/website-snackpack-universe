# Object Batch O13 — Faction Dressing

Three 2×2 atlas families for faction identity in standard rooms and future arenas:

- `machine-foundry-v1`: hydraulic press, furnace housing, parked assembly arm, conveyor roller.
- `cryo-lab-v1`: frost locker, coolant manifold, empty sample rack, thermal conduit coil.
- `hive-void-v1`: resin pillar, dormant cocoon cluster, organic cable nest, void crystal plinth.

Each family retains the generated chroma source, extracted alpha, restored-color master, 384px-per-cell preflight, and 256px/128px runtime derivatives. The normalizer validates transparent corners and non-empty atlas cells, then copies runtime files into `game-assets/`.

These are decorative and art-gated. Interaction, collision, hazards, rewards, telegraphs, and placement remain code-owned.
