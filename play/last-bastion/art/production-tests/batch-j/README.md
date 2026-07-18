# Batch J — speed-tier enemies and telegraph decals

Batch J replaces behavior-gate placeholders for the Swarm Scuttler, Razorlord, Blightspitter, and Quillback Matriarch, then adds decorative hostile-warning art over simulation-owned telegraph geometry.

## Runtime contracts

| ID | Runtime file | Grid | Cell | Frames |
| --- | --- | --- | --- | --- |
| `swarm-scuttler-v1` | `swarm-scuttler-spritesheet-v1-64.png` | 4 × 2 | 64 × 64 | 8 |
| `razorlord-v1` | `razorlord-spritesheet-v1-96.png` | 4 × 4 | 96 × 96 | 16 |
| `blightspitter-v1` | `blightspitter-spritesheet-v1-96.png` | 4 × 3 | 96 × 96 | 12 |
| `quillback-matriarch-v1` | `quillback-matriarch-spritesheet-v1-128.png` | 4 × 4 | 128 × 128 | 16 |
| `telegraph-large-v1` | `telegraph-large-atlas-v1-128.png` | 4 × 2 | 128 × 128 | 8 |
| `telegraph-small-v1` | `telegraph-small-atlas-v1-64.png` | 4 × 3 | 64 × 64 | 12 |
| `telegraph-danger-fill-v1` | `telegraph-danger-fill-v1-64.png` | 4 × 1 | 64 × 64 | 4 |

Swarm columns are south, north, east, west; rows are pursuit and pack rush. Elite columns are four animation beats. Razorlord rows are pursuit, wind-up, dash, recovery. Blightspitter rows are positioning, wind-up, recovery. Matriarch rows are positioning, crown-charge, launch, recovery.

Large telegraph frames are ground slam 25/50/75/100%, then sweeping arc 25/50/75/100%. Small frames are rain reticle ×4, radial pulse ×3, edge marker, beam tell ×3, and rain impact. Danger-fill frames are four low-contrast hatch variants.

## Source retention

Every built-in image-generation chroma source and clean-alpha retained master is stored beside `normalize_batch_j.py`. Runtime derivatives use nearest-neighbour reduction and are never treated as source art.

The raster sheets never own collision, attack radius, arc, target placement, beam length, timing, damage, or the two-major-warning cap. Those remain in `TelegraphRules.ts` and `CombatSimulation.ts`.

## Review

- J1 bodies: `?mode=gallery&batch=j1`
- J2 decals: `?mode=gallery&batch=j2`
- Live ten-wave run: `/play/last-bastion/`
- Placeholder comparison: add `&art=placeholder`

