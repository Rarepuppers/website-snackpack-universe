# Object Batch O7 — Composition Accents

Three 2×2 atlas families for non-interactive room composition:

- `debris-rubble-v1`: armor plate, pipe/cable, concrete rubble, bent metal shards.
- `floor-trims-v1`: threshold, corner trim, damaged tile edge, raised grate border.
- `light-fixtures-v1`: recessed light, wall sconce, floor beacon, hanging utility lamp.

Each family retains the generated chroma source, extracted alpha, restored-color master, 384px-per-cell preflight, and 256px/128px runtime derivatives. The normalizer validates transparent corners and non-empty atlas cells, then copies runtime files into `game-assets/`.

These are decorative and art-gated. Interaction, collision, hazards, rewards, telegraphs, and placement remain code-owned.
