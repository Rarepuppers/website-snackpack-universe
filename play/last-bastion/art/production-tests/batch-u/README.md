# Storm Savant production package — Batch U

Batch U contains the three authorized Storm Savant production families generated with the built-in image tool.

- `storm-savant-v1`: 4 directional columns × 9 behavior rows at 192×192, 36 frames.
- `storm-node-v1`: six lifecycle states at 128×128.
- `storm-effects-v1`: four non-lightning event columns × onset/dissipate rows at 128×128, eight frames.

Untouched `*-chroma.png` sources and clean-alpha masters are retained. `normalize_batch_u.py` crops authored cells independently, preserves bottom-centre pivots, and emits deterministic nearest-neighbour runtime derivatives plus `batch-u-contact-sheet.png` for QA.

Lightning rails, timing rungs, target endpoints, cover-stop markers, hit widths, collision, damage, node placement, and route timing remain code-owned and are deliberately absent from these raster files.
