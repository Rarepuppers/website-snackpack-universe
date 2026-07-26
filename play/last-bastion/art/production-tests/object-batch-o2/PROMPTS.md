# Object Batch O2 generation prompts

Generated with the built-in image-generation tool on 26 July 2026. Image 1 in the loop prompt was the Object Batch O1 contact sheet, used only for camera, material, palette restraint, and gameplay-scale readability. The transition prompt additionally used the accepted loop sheet as the exact hazard-family anchor.

## Shared direction

Premium hand-painted top-down/isometric-leaning science-fiction sprite art for a dark roguelike bullet hell. Crisp low-profile silhouettes, realistic materials, strong grayscale shape cues, restrained internal detail, and generous cell-safe margins. No text, UI, creatures, floor scene, cast shadow, smoke cloud, aura, bloom halo, target marker, or baked gameplay radius. Sources use a flat `#FF00FF` chroma background for local removal.

## Loop atlas

Create an exact 4×4 atlas. Rows: viscous violet/teal alien slowing slime with bone-white organic rim; acidic yellow-green toxic chemical pool with dark olive scum and broken triangular perimeter; hot orange industrial fire/ember patch over blackened residue with jagged starburst perimeter; white-yellow/orange molten lava inside nearly black angular cooling crust. Columns are four seamless animation phases of the same hazard and footprint. Only internal bubbles, ripples, compact flame/ember motion, and magma fissures advance; no size pulsing. Preserve one centered isolated patch per cell.

Untouched built-in output was copied to `world-hazards-loop-v1-chroma.png`.

## Transition atlas

Create an exact 4×4 atlas preserving the loop atlas materials, colours, lighting, and camera. Rows remain slime, toxic, fire, lava. Columns: seamless interior fill; straight horizontal outer edge with hazard below; small convex quarter-piece; large concave three-quarter piece with the upper-left quarter missing. Runtime rotates pieces. The first attempt made the corner geometries too similar, so a precise edit changed geometry only and preserved the four hazard identities.

Untouched corrected built-in output was copied to `world-hazards-transitions-v1-chroma.png`.
