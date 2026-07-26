# Object Batch O5 — Room Dressing

Three 2×2 atlas families for visual richness in standard rooms without introducing new interactions:

- `maintenance-dressing-v1`: cable spool, tool cart, pipe junction, coolant rack.
- `medical-cryogenic-dressing-v1`: cryo canisters, sealed medical case, blank diagnostic monitor, emergency blanket rack.
- `hive-dressing-v1`: dormant egg cluster, resin wall growth, root-and-cable bundle, sealed cocoon pod.

Each family retains the generated chroma source, extracted alpha, restored-color master, 384px-per-cell preflight, and 256px/128px runtime derivatives. The normalizer validates transparent corners and non-empty atlas cells, then copies runtime files into `game-assets/`.

These are art-gated dressing candidates only. Interaction, collision, hazards, rewards, telegraphs, and placement remain code-owned and are not enabled.
