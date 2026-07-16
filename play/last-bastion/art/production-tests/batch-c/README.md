# Production Asset Batch C

Batch C begins with gameplay contracts already implemented in the five-wave vertical slice. Relic, Artifact, and Shrine art remains deferred until those systems can consume and validate the assets.

## Locked gameplay-critical contracts

| Stable ID | Grid | Logical cell | Frame count | Frame order |
| --- | ---: | ---: | ---: | --- |
| `blast-mite-v1` | 4×3 | 64×64 | 12 | columns S/N/E/W; rows chase, armed, detonation |
| `warp-flanker-v1` | 4×3 | 96×96 | 12 | columns S/N/E/W; rows stalk, warp wind-up/dissolve, materialise |
| `batch-c-rewards-v1` | 4×4 | 64×64 | 16 | weapon chest states; Supply Depot states; four powerups; four HUD powerup icons |
| `batch-c-effects-v1` | 5×4 | 64×64 | 20 | statuses; fence; Bastion Barrage; reserved combat feedback |

Reward atlas rows:

- 0–3: Weapon Chest closed, available, opening, claimed.
- 4–7: Supply Depot available, active, used, disabled.
- 8–11: Overcharge, Aegis, Magnet Pulse, Adrenaline world pickups.
- 12–15: matching compact HUD icons in the same order.

Effect atlas rows:

- 0–4: Blaze, Overload, Freeze, Corrode, shield-hit shimmer.
- 5–9: fence switch ready, switch active, pylon, energized beam segment, fence zap.
- 10–14: Bastion Barrage launch ring, projectile, explosive impact, cooldown-ready pulse, radial volley burst.
- 15–19: Blast Mite warning ring, Blast Mite detonation, Warp arrival ring, Warp dissolve particles, Warp materialise shimmer.

All sheets use transparent runtime output, nearest-neighbour scaling, centered pivots, no baked text, and state selection driven by simulation truth.
