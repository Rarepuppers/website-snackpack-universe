# World Object Production Batch O3A — small interactables

Started 26 July 2026. This package supplies five small control-surface families for the world-object interaction layer.

## Runtime contract

- One transparent 5×5 atlas at 128×128 per frame.
- One deterministic 384×384-per-cell retained derivative plus untouched generated source and immutable alpha-extraction input.
- Rows: supply chest, gate button, control panel, turret console, trap console.
- Columns: idle, ready, active, disabled/cooldown, completed/opened.
- State changes are communicated through physical pose, switch position, dish posture, lid state, and restrained cyan/orange accents.

Interaction timing, prompts, ownership, collision, damage, rewards, linked systems, navigation, and accessibility language remain code-owned. The atlas does not authorize enabling `WorldObjectCatalog` placement.

## Acceptance status

Production candidate, not gameplay-accepted. Inspect at maximum-density gameplay scale, grayscale, colour-vision simulations, controller interaction distance, and against at least two floor families. The small control panels intentionally use abstract screen marks; any future readable UI belongs in live code-rendered text, never this atlas.

## Steam/4K note

The clean-alpha sheet is the canonical raster source and the 384-cell file is a deterministic nearest-neighbour derivative. Keep the source and prompt provenance. For desktop close-view inspection, repaint individual accepted states at 512×512 or larger while preserving IDs, pivots, footprints, and state order.
