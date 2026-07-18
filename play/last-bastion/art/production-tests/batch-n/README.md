# Task 36 — Aurum Hoarder and 128 px tile production batch

Task 36 replaces the Aurum behavior-lab ellipse with production body art, adds event-authored effects and cache presentation, and establishes the first 128 × 128 runtime tile family under the 512 × 512 retained-master contract.

## Runtime contracts

| ID | Runtime file | Grid | Cell | Frames |
| --- | --- | --- | --- | --- |
| `aurum-hoarder-v1` | `aurum-hoarder-spritesheet-v1-96.png` | 4 × 3 | 96 × 96 | 12 |
| `aurum-hoarder-effects-v1` | `aurum-hoarder-effect-atlas-v1-64.png` | 4 × 2 | 64 × 64 | 8 |
| `aurum-tiles-v1` | `aurum-tile-atlas-v1-128.png` | 4 × 2 | 128 × 128 | 8 |

Body columns are south, north, east, and west. Rows are intact forage, armour-broken forage, and flee.

Effect order is arrival, armour break, secured Scrap, flee activation, flee trail, edge escape, defeat, and supply-cache drop.

Tile order is Scrap, Aurum Supply Cache, Hoarder Codex, treasure event, armour break, escape warning, Shop Scrap, and locked treasure event. Text, bindings, prices, cooldown shadows, timers, selection, disabled tint, and lock logic remain code-owned.

The normalizer also exports eight stable individual 128 px tiles. `aurum-hoarder-codex-tile-v1-128.png` is copied to the static Codex contract as `game-assets/tiles/mon-aurum-hoarder-v1.png`; the atlas remains the Phaser/runtime source.

## Source retention

Each generated chroma source and clean-alpha master is retained beside the deterministic nearest-neighbour normalization script. The two 2 × 2 tile masters provide more than 512 source pixels per tile before the 128 px runtime derivative. Body generation retains the maximum built-in source resolution and is never reconstructed from the 96 px runtime atlas.

## Review

- Complete gallery: `?mode=gallery&batch=n`
- Behavior lab: `?scenario=aurum-hoarder&loadout=bulwark`
- Placeholder comparison: add `&art=placeholder`
