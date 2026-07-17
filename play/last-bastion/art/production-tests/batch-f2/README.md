# Production Asset Batch F2 — Bolt Carbine

Steam-quality retained masters and deterministic runtime atlases for the Bolt Carbine precision family.

| Runtime asset | Grid | Cell | Frame order |
| --- | ---: | ---: | --- |
| `bolt-carbine-spritesheet-v1-96.png` | 4 × 1 | 96 | idle, charge, fire, recover |
| `bolt-carbine-effect-atlas-v1-64.png` | 4 × 2 | 64 | charge, bolt, travel wake, first impact, penetration wake, terminal impact, cover strike, ready |
| `weapon-tile-atlas-v1-64.png` | 3 × 1 | 64 | Bolt Carbine, Bulwark Rotary Cannon, Grenade Tube |

The source prompt requires an exact east-facing four-state row and eight isolated effects on flat blue chroma. Trajectory, hit ordering, two-target penetration, cooldown, damage, and UI overlays remain code-driven.

Run `normalize_weapon_batches.py` with the workspace Pillow runtime to rebuild F2–F4 runtime files.
