# Production Scrap Shop UI — Batch N2

Completed 18 July 2026 using the built-in image-generation path and local chroma-key alpha extraction.

Runtime contracts:

- `scrap-shop-offer-tile-atlas-v1-128.png` — 3 × 2 atlas, 128 px cells: Field Repair, Uranium-Core Kit, Armour Retrofit, Upgrade Calibration, Weapon Requisition, Sold/Locked.
- `scrap-shop-hud-atlas-v1-128.png` — 2 × 2 atlas, 128 px cells: neutral balance, secured pulse, spent transfer, banked cassette.
- `scrap-shop-panel-v1-1024x576.png` — empty 16:9 Shop terminal panel for code-owned title, prices, rows, selection, affordability, and controls.
- Six individual 128 px offer tiles are exported beside the atlases for future Codex, placement, inventory, or expedition-map consumers.

The transparent edit masters and original magenta-key sources are retained. `normalize_atlases.py` uses nearest-neighbour sampling so the Steam-port masters remain the authority and runtime files are reproducible.

No language, number, price, binding, selection border, affordability tint, sold state, lock logic, or navigation hint is baked into the art. The Sold/Locked frame is only a reusable visual subject; code remains authoritative.
