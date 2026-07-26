# Object Batch O6 — Structural Accents

Three 2×2 atlas families for standard-room infrastructure dressing:

- `ventilation-ducts-v1`: vent housing, duct elbow, grated vent panel, exhaust stack.
- `storage-logistics-v1`: cargo pallet, supply bin, stacked panels, freight dolly.
- `power-infrastructure-v1`: transformer, battery cabinet, cable junction cover, capacitor column.

Each family retains the generated chroma source, extracted alpha, restored-color master, 384px-per-cell preflight, and 256px/128px runtime derivatives. The normalizer validates transparent corners and non-empty atlas cells, then copies runtime files into `game-assets/`.

These are decorative and art-gated. Interaction, collision, hazards, rewards, telegraphs, and placement remain code-owned.
