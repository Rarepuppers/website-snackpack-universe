# Production Asset Batch AI - Starship, Void, and Transit

**Status:** Generated, normalized, manifest-bound, gallery-bound, and live-theme accepted - 22 July 2026.

Batch AI supplies coherent starship interiors, transit machinery, void-safe platforms, and derelict variants. Playable floors remain opaque and readable; space vistas only appear inside bounded fixtures or breached hull edges.

## Contracts

| Asset | Grid | Runtime cell | Retained-master cell | Frames |
| --- | ---: | ---: | ---: | ---: |
| `starship-transit-floor-v1` | 4x4 | 128x128 | 256x256 | 16 |
| `starship-transit-boundary-v1` | 4x2 | 128x128 | 256x256 | 8 |
| `starship-transit-fixtures-v1` | 4x2 | 192x192 | 384x384 | 8 |
| `starship-transit-decals-v1` | 4x2 | 128x128 | 256x256 | 8 |

Floors cover corridors, service/cargo/hangar/airlock/bridge/observation decks, void platform, teleporter, stargate, hyperspace machinery, derelict hull, damaged plating, zero-g maintenance, and engine transit. The live theme groups them into operational, command, energy-transit, and derelict families. Code owns collision, vacuum, hazards, interaction, objectives, and timing. Review at `?mode=gallery&batch=ai` or `?theme=starship-transit&room=<family-id>&worldseed=0&scenario=density-capacity`.
