# Production Asset Batch F1

**Status:** Generated, normalized, and integrated — 17 July 2026

Batch F1 establishes the first production weapon-and-action-UI family: Patrol Blade gameplay states, dedicated melee effects, action-bar motifs, and Uranium-Core Rounds kit/status art. Large chroma sources, transparent review masters, deterministic nearest-neighbour normalization, and fixed runtime assets remain together for future Steam packaging and revision.

## Runtime contracts

| Runtime asset | Grid | Cell | Frame order |
| --- | ---: | ---: | --- |
| `patrol-blade-spritesheet-v1-96.png` | 4 × 1 | 96 × 96 | folded idle, ready/anticipation, committed sweep, recovery |
| `patrol-blade-effect-atlas-v1-64.png` | 3 × 2 | 64 × 64 | anticipation arc, active crescent, flesh impact, armour impact, cover impact, ready glint |
| `action-tile-atlas-v1-64.png` | 3 × 2 | 64 × 64 | combat roll, Bastion Barrage, Patrol Blade, Uranium-Core Rounds kit, empty consumable, empty active |
| `uranium-core-rounds-status-v1-64.png` | 1 | 64 × 64 | compact three-round timed-status motif |

All timing, hit geometry, cooldown wedges, circular duration rings, numeric seconds, bindings, charges, disabled states, and ready pulses remain code-driven.

## Quality and portability

- Built-in image generation used the approved Batch B weapon/effects, Batch C reward/UI, and Batch D4 effect masters as strict style references.
- The generated masters are roughly 16–25 times larger than their runtime cells and retain pixel clusters, material separation, and edit headroom for a future higher-resolution Steam renderer.
- Chroma sources preserve generation provenance. Transparent masters preserve the approved full-resolution artwork. Only normalized `*-64.png` and `*-96.png` files load at runtime.
- Pure-blue chroma was removed with the installed soft-matte/despill workflow. Transparent corners, subject coverage, safe padding, and cell isolation were visually verified.
- The Last Bastion palette remains consistent: charcoal machinery, warm ivory edges, burgundy structure, aged bronze pivots, cyan energy, restrained orange feedback, and vivid lime uranium tips.

## Prompt contract

- **Patrol Blade:** original east-authored orbit mono-blade; exact four-state row; stable mount/pivot; warm-ivory edge, burgundy arm, bronze pivot, charcoal housing, cyan seam; no trail, character, text, UI, shadow, or scenery.
- **Effects:** exact 3 × 2 atlas containing the six named events; distinct flesh/armour/cover reads; restrained bloom; no weapon, blood, gore, UI, shadow, or scenery.
- **Action motifs:** exact 3 × 2 atlas containing roll, ultimate, blade, uranium kit, empty consumable, and empty active; text-free motifs with safe padding beneath code-rendered cooldown masks.
- **Status icon:** compact circular three-round uranium silhouette with lime crystalline tips and cyan clasp; no baked timer ring, text, radiation symbol, panel, or border.

Rebuild runtime assets with the workspace Python runtime:

```powershell
& <python-with-pillow> normalize_atlases.py
```
