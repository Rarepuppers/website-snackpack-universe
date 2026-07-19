# Production Asset Batch P — Field Medic

Batch P completes the Field Medic presentation gate after Task 47. Retained chroma and alpha masters preserve future 4K reprocessing; deterministic runtime atlases remain compact for the web build.

- `medic-base-spritesheet-v1-96.png` — 4×5 body atlas: idle, move, dodge, hit, defeat; south, north, east, west.
- `medic-helmet-overlay-v1-96.png` — aligned 4×5 modular helmet overlay.
- `injector-carbine-spritesheet-v1-96.png` — ready, pressure, fire, recover ring-weapon strip.
- `injector-carbine-effect-atlas-v1-64.png` — projectile, muzzle, hit, miss, triage, healing wisp, surge, overflow shield.
- `medic-portrait-v1-128.png` — dossier portrait.
- `normalize_batch_p.py` — chroma extraction, fixed anchors, and runtime normalization.

Healing values, sixth-hit cadence, cooldowns, shield limits, projectile geometry, and all UI text remain code-owned.
