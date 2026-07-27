# Telegraph refresh

The small telegraph atlas was regenerated as a high-resolution 4x3 sheet with 256px cells and transparent alpha. The manifest keeps the existing 12-frame, 64x64 logical contract and frame count; telegraph timing, radius, direction, colour semantics, and ownership remain code-owned.

The source and alpha files retain generation provenance. The `telegraph-small-atlas-v2-256.png` file is the runtime-bound web/Steam preflight derivative. The existing large telegraph atlas and danger-fill atlas remain unchanged because their current source/semantic contracts do not require this replacement yet.
