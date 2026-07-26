# Object Batch O14 — Energy + Ruins + Flora

Three 2×2 atlas families for neutral arena composition:

- `energy-anchors-v1`: blank hologram projector, inactive energy ring, conduit junction, diffuse beacon.
- `ruin-ornaments-v1`: broken plinth, pillar fragment, toppled arch, machine monument.
- `flora-growth-v1`: planter trough, vine conduit, mossy stone island, sealed fungal pod.

Each family retains generated chroma source, extracted alpha, restored-color master, 384px-per-cell preflight, and 256px/128px runtime derivatives. The normalizer validates transparent corners and non-empty atlas cells, then copies runtime files into `game-assets/`.

These are decorative and art-gated. Interaction, collision, hazards, rewards, telegraphs, and placement remain code-owned.
