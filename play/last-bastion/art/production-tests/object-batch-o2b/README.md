# World Object Production Batch O2B — control surfaces

Started 26 July 2026. This package extends O2 with non-colliding overlays: web-slow surface language, ice fracture/degradation, and quiet post-hazard recovery decals.

## Runtime contract

- Three transparent 4×4 atlases at 128×128 per frame.
- Three deterministic 384×384-per-cell retained derivatives plus untouched generated sources and immutable alpha-extraction inputs.
- Web-slow rows are fill, straight edge, convex corner, and concave corner; columns are four subtle loop phases.
- Ice rows are fresh frost, hairline cracks, deep branching fracture, and settled shards; columns progress from fresh to residue.
- Recovery rows are extinguished ember scorch, cooled lava crust, dried toxic residue, and collapsed web; columns fade from fresh residue to nearly gone.
- Safe-edge masks are deliberately code-native geometry. Do not generate raster masks for simple deterministic shapes.

Collision, slow strength, damage, radius, placement, safe lanes, timing, activation, navigation, and telegraphs remain code-owned. These files do not authorize enabling `WorldObjectCatalog` placement.

## Acceptance status

Production candidate, not gameplay-accepted. Inspect at maximum-density gameplay scale, grayscale, colour-vision simulations, and on at least two floor families before binding. Recovery decals must never be mistaken for active hazards; ice overlays must never imply a new collision body.

## Steam/4K note

The clean-alpha sheets are the canonical raster sources and the 384-cell files are deterministic nearest-neighbour derivatives. Keep all sources and prompts. If desktop close-view inspection requires more detail, repaint individual accepted frames at 512×512 or larger while preserving IDs, pivots, footprints, and frame order.
