# World Object Production Batch O2 — persistent hazards

Started 26 July 2026. This first O2 delivery establishes the four live persistent hazard families and reusable transition language without enabling the still-dead world-object runtime system.

## Runtime contract

- Two transparent 4×4 atlases at 128×128 per frame.
- Two deterministic 384×384-per-frame retained derivatives plus the untouched generated sources.
- Rows are always slime, toxic, fire, lava.
- Loop columns are four stable-footprint internal animation phases.
- Transition columns are interior fill, straight edge, convex quarter, and concave inner corner. Runtime rotation supplies the other orientations.
- Shape language remains distinct without colour: organic serration for slime, broken triangular perimeter for toxic, jagged starburst for fire, heavy angular crust for lava.
- Animation may change bubbles, ripples, embers, and fissures but must not pulse the gameplay footprint.

Damage, slow strength, collision, radius, placement, safe lanes, duration, activation, navigation, and telegraphs remain code-owned. These files do not authorize enabling `WorldObjectCatalog` placement.

## Files

- `world-hazards-loop-v1-chroma.png` — untouched generated source.
- `world-hazards-loop-v1-alpha-extracted.png` — immutable helper-despilled alpha extraction used as a deterministic build input.
- `world-hazards-loop-v1.png` — clean-alpha source.
- `world-hazards-loop-v1-384.png` — retained normalized derivative.
- `world-hazards-loop-v1-128.png` — runtime derivative.
- `world-hazards-transitions-v1-chroma.png` — untouched corrected generated source.
- `world-hazards-transitions-v1-alpha-extracted.png` — immutable helper-despilled alpha extraction used as a deterministic build input.
- `world-hazards-transitions-v1.png` — clean-alpha source.
- `world-hazards-transitions-v1-384.png` — retained normalized derivative.
- `world-hazards-transitions-v1-128.png` — runtime derivative.
- `object-batch-o2-contact-sheet.png` — QA sheet.
- `normalize_object_batch_o2.py` — deterministic edge-weighted colour restoration, normalization, validation, runtime copy, and contact-sheet builder. Opaque pixels retain the generated palette while partially transparent edge pixels retain chroma despill.
- `PROMPTS.md` — generation provenance and art constraints.

## Acceptance status

Production candidate, not yet gameplay-accepted. Chroma extraction, cell isolation, frame ordering, and retained/runtime derivatives are complete. Before binding in code, inspect all four families at maximum-density gameplay scale, grayscale, deuteranopia/protanopia simulation, and on at least two floor families. The current content-debt audit confirms world objects are not live, so no asset binding should imply that hazard gameplay exists.

## Steam/4K note

The clean-alpha generated sheets are the canonical raster sources; the 384-cell files are deterministic nearest-neighbour production derivatives, not repainted source detail. Keep the sources and prompts permanently. If Steam review calls for camera-close inspection beyond the current top-down scale, repaint individual accepted hazard frames at 512×512 or larger while preserving atlas IDs, pivots, footprints, and frame order.
