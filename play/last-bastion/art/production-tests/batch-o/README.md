# Production Asset Batch O — Rift Stalker

**Status:** Generated, normalized, and integrated — 19 July 2026

Batch O replaces the Rift Stalker behavior-gate ellipse with a reusable mini-boss body, event-authored effects, and portrait. Untouched chroma sources, clean-alpha masters, deterministic normalization, and fixed runtime derivatives are retained together for future Steam packaging and repainting.

## Runtime contracts

| Stable ID | Runtime file | Grid | Logical cell | Frames |
| --- | --- | ---: | ---: | ---: |
| `rift-stalker-v1` | `rift-stalker-spritesheet-v1-128.png` | 4 × 4 | 128 × 128 | 16 |
| `rift-stalker-effects-v1` | `rift-stalker-effect-atlas-v1-64.png` | 4 × 2 | 64 × 64 | 8 |
| `rift-stalker-portrait-v1` | `rift-stalker-portrait-v1-128.png` | image | 128 × 128 | 1 |

Body columns are south, north, east, and west. Rows are cloaked stalk, marked pounce wind-up, committed warp strike, and exhausted frenzy/recovery. Runtime alpha owns cloak visibility; the source body remains opaque.

Effect order is warp-out shimmer, warp-in burst, decoy mark glyph, pounce impact, blade-slash arc, frenzy aura tick, defeat collapse, and rift afterglow. Telegraph geometry, hit tests, timing, and damage remain code-owned.

## Source-quality and normalization policy

- Generated source dimensions: body `1254 × 1254`, effects `1774 × 887`, portrait `1254 × 1254`.
- The effect and portrait masters exceed the 4× runtime source floor. The body retains the maximum built-in sheet resolution and is never reconstructed from the runtime atlas.
- `*-chroma.png` files preserve built-in generation provenance. Full-resolution transparent PNGs are the review/edit masters.
- Chroma extraction used border sampling, soft matte, and despill; corners and cell gaps were visually validated.
- `normalize_atlases.py` uses proportional grid crops, connected-component cleanup for the body, shared nearest-neighbour body scale, and stable centered pivots.

Rebuild with a Python runtime containing Pillow:

```powershell
python normalize_atlases.py
```

## Review

- Gallery: `?mode=gallery&batch=o`
- Encounter: `?scenario=rift-stalker&loadout=vertical`
- Placeholder comparison: add `&art=placeholder`
