# Object Batch O12 — Habitat + Identity

Three 2×2 atlas families for room identity and non-interactive dressing:

- `habitat-lifesupport-v1`: hydroponic planter, air-filter column, bunk module, water recycler.
- `communications-network-v1`: antenna mast, relay box, cable hub, signal repeater pedestal.
- `storage-identity-v1`: archive drawer, tool board, locker bank, blank archive pedestal.

Each family retains generated chroma source, extracted alpha, restored-color master, 384px-per-cell preflight, and 256px/128px runtime derivatives. The normalizer validates transparent corners and non-empty atlas cells, then copies runtime files into `game-assets/`.

These are decorative and art-gated. Interaction, collision, hazards, rewards, telegraphs, and placement remain code-owned.
