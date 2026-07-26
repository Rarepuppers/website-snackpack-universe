# Object Batch O4 — Navigation + Cover

Three 2×2 atlas families for standard-room lane readability and transition dressing:

- `cover-lane-anchors-v1`: barricade, maintenance crates, reactor cover pod, half wall.
- `bridge-transitions-v1`: catwalk bridge, ramp transition, threshold, gantry segment.
- `boundary-doorway-v1`: doorway frame, blast-door frame, neutral bollard pair, corner pillar.

Each family keeps the untouched generated chroma source, extracted alpha, restored-color master, 384px-per-cell preflight, and 256px/128px runtime derivatives. The normalizer is deterministic and validates transparent corners. Runtime copies are placed in `game-assets/`.

These are art-gated candidates only. Collision, walkability, cover rules, lane semantics, interaction, telegraphs, and placement remain code-owned and are intentionally not enabled.
