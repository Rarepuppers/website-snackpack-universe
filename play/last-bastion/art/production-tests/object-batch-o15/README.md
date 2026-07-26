# Object Batch O15 — Common + Vehicle Bay

Three 2×2 atlas families for everyday room silhouettes:

- `crew-common-v1`: modular bench, blank table, locker-and-seat cubby, rest pod.
- `vehicle-bay-v1`: landing beacon, gantry foot, docking clamp set, empty cargo lift.
- `recycling-waste-v1`: sorting bins, compactor, recycling drum, blank hazardous cabinet.

Each family retains generated chroma source, extracted alpha, restored-color master, 384px-per-cell preflight, and 256px/128px runtime derivatives. The normalizer validates transparent corners and non-empty atlas cells, then copies runtime files into `game-assets/`.

These are decorative and art-gated. Interaction, collision, hazards, rewards, telegraphs, and placement remain code-owned.
