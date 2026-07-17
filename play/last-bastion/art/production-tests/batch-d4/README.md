# Razor Scuttler Production Asset Batch D4

Batch D4 replaces the Razor Scuttler behavior-gate triangle with a production body and dedicated interceptor effects. Large chroma sources, transparent review masters, deterministic normalization, and fixed runtime atlases are retained together.

## Runtime contracts

| ID | Runtime file | Grid | Cell | Frames |
| --- | --- | --- | --- | --- |
| `razor-scuttler-v1` | `razor-scuttler-spritesheet-v1-96.png` | 4 × 4 | 96 × 96 | 16 |
| `razor-scuttler-effects-v1` | `razor-scuttler-effect-atlas-v1-64.png` | 4 × 2 | 64 × 64 | 8 |

Body columns are south, north, east, west. Rows are pursuit, compressed wind-up, committed dash, and exhausted/crash recovery.

Effect order is:

0. Lane-warning accent.
1. Launch burst.
2. Speed trail.
3. Marine impact.
4. Cover crash.
5. Miss skid.
6. Recovery stagger.
7. Defeat.

The exact dash lane, distance, collision, and hit test remain code-driven. The authored lane accent reinforces the locked warning but never replaces its authoritative runtime geometry.

## Prompt summary

The built-in image-generation workflow used the approved Spinewheel effects, Carapace Scuttler, and Razor body output as strict style references. The body prompt locked a light wedge-shaped burgundy/charcoal scuttler with ivory mandibles, amber eyes, bronze seams, cyan speed vents, an exact 4 × 4 direction/state grid, and flat blue chroma. The effect prompt locked the eight named gameplay events, an exact 4 × 2 grid, clean separation, distinct player/cover/miss reads, and flat blue chroma. Both prompts excluded text, UI, scenery, baked gameplay geometry, blood, and gore.

## Review

- Complete gallery: `?mode=gallery&batch=d4`
- Deterministic lab: `?scenario=razor-scuttler&loadout=vertical`
- Placeholder comparison: add `&art=placeholder`
