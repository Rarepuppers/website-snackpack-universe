# Scrap Skitterer production package — Batch V

Batch V contains the two authorized Scrap Skitterer production families generated with the built-in image tool.

- `machine-scrap-skitterer-v1`: 4 directional columns × 8 behavior rows at 128×128, 32 frames.
- `machine-scrap-skitterer-effects-v1`: acceleration, rush, impact, and harmless-wreck columns × onset/dissipate rows at 128×128, eight frames.

Untouched `*-chroma.png` sources and clean-alpha masters are retained. `normalize_batch_v.py` crops each authored cell independently, preserves bottom-centre pivots, and emits deterministic nearest-neighbour runtime derivatives plus `batch-v-contact-sheet.png` for QA.

Direction, acceleration timing, committed-rush lane, collision, damage, Shock multiplier, wreck duration, and harmless/non-slowing behavior remain code-owned. No projectile atlas exists.
