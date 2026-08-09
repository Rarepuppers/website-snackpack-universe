# Marauder AR presentation

Dedicated C3 presentation for Assault's hero-bound Marauder AR.

- `marauder-ar-gameplay-v1-256x128.png` is the transparent runtime weapon prop. It retains the existing 64×32 logical gameplay footprint.
- `marauder-ar-effects-v1-64.png` is a four-frame 64px atlas: muzzle, tracer, impact, casing.
- `marauder-ar-tile-v1-128.png` is the standalone HUD, choice, and debrief tile.
- Chroma and alpha masters are retained for reproducibility and later Steam-resolution revisions.
- `normalize_marauder.py` deterministically rebuilds the runtime derivatives.

The weapon remains outside random acquisition pools. These assets do not unlock Assault; C3 still requires accepted hero audio and final in-combat review.
