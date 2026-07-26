# World Object Production Batch O3B — objective anchors

Started 26 July 2026. This package supplies four larger anchors for future world-object rooms.

## Runtime contract

- One transparent 5×4 atlas at 128×128 per frame.
- One deterministic 384×384-per-cell retained derivative plus untouched generated source and immutable alpha-extraction input.
- Rows: monster teleporter, stargate, cryogenic tube, weapon-upgrade station.
- Columns: idle, ready, active/charging, disabled/cooldown, completed/settled.
- State changes use alignment, aperture energy, coolant glow, shutters, clamps, and physical machine pose.

Interaction timing, prompts, ownership, collision, damage, rewards, destinations, linked systems, navigation, and safe lanes remain code-owned. The atlas does not authorize enabling `WorldObjectCatalog` placement.

## Acceptance status

Production candidate, not gameplay-accepted. Inspect at maximum-density room scale, grayscale, colour-vision simulations, controller interaction distance, and against at least two environment families. The cryogenic tube is intentionally empty in every state; any rescued or hostile occupant needs a separate authored asset and behavior gate.

## Steam/4K note

The clean-alpha sheet is the canonical raster source and the 384-cell file is a deterministic nearest-neighbour derivative. Keep the source and prompt provenance. For desktop close-view inspection, repaint individual accepted states at 512×512 or larger while preserving IDs, pivots, footprints, and state order.
