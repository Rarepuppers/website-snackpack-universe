# Object Batch O8 — Access + Utility

Three 2×2 atlas families for room identity and non-interactive utility dressing:

- `access-hardware-v1`: floor hatch, blank control panel, mechanical latch, wall handle.
- `wayfinding-lights-v1`: floor strip, paired light bars, neutral corner housing, blank marker panel.
- `ambient-utility-v1`: sensor mast, hose reel, air scrubber, maintenance tripod light.

Each family retains the generated chroma source, extracted alpha, restored-color master, 384px-per-cell preflight, and 256px/128px runtime derivatives. The normalizer validates transparent corners and non-empty atlas cells, then copies runtime files into `game-assets/`.

These are decorative and art-gated. Interaction, collision, hazards, rewards, telegraphs, and placement remain code-owned.
