# Assault C3 prompt provenance

Mode: built-in image generation.

References:

- `../batch-character-select/marine-select-portrait-v1-1024x1536.png` — style,
  franchise, lighting, scale, and composition reference only.
- `../batch-character-select/medic-select-portrait-v1-1024x1536.png` — style,
  franchise, lighting, scale, and composition reference only.

## Select portrait v1

```text
Use case: stylized-concept
Asset type: Last Bastion game character-select portrait, production identity anchor
Input images: Image 1 and Image 2 are style, franchise, lighting, scale, and composition references only; generate a new third hero, do not edit or combine the existing heroes.
Primary request: Create the Assault hero, an aggressive mid-range specialist from the same Bastion military as the reference Marine and Medic.
Subject: One full-body human combat soldier in a confident forward-facing three-quarter neutral hero pose. Distinct Assault identity: leaner and more mobile than the Marine, angular medium armour, reinforced asymmetric right shoulder, compact breaching plates, short sealed combat helmet with a narrow amber visor, dark navy undersuit, charcoal armour, restrained burnt-orange assault markings, small cyan equipment lights. Hold the Marauder AR low and safely at the side: a compact hard-cycling medium assault rifle with a chunky receiver and short barrel. No medical crosses. No oversized heavy-Marine shoulder plates. No exposed face.
Style/medium: Match the references' polished high-resolution pixel-art / painterly pixel-rendered game portrait, material detail, edge treatment, and grounded sci-fi military realism.
Composition/framing: Exact portrait orientation matching the references, entire figure visible from helmet to boots, centered, similar body scale, generous safe padding, boots near the lower edge, weapon fully in frame.
Scene/backdrop: Same restrained dark navy Bastion corridor presentation backdrop and floor treatment as the references, without copying their exact geometry.
Lighting/mood: Cool cyan rim light with restrained warm amber visor and orange accents; purposeful, fast, aggressive, readable silhouette.
Color palette: deep navy, charcoal, muted gunmetal, ivory only as tiny hardware highlights, burnt orange accents, cyan equipment lights, amber visor.
Constraints: text-free; no name, role, UI, stats, border, logo, watermark, insignia text, extra character, cape, backpack silhouette, medical symbols, glowing magic, alien features, or exposed face. Preserve a distinct silhouette from both reference heroes. This portrait will be downsampled and used at 1024x1536.
```

## Gameplay body sheet v1

```text
Use case: stylized-concept
Asset type: Last Bastion top-down action-game character gameplay sprite-sheet master
Input images: Image 1 is the Assault identity anchor and must control armour, helmet, visor, asymmetric shoulder, palette, proportions, and personality. Image 2 is a sheet-layout, sprite-scale, pose readability, and pixel-rendering reference only; do not copy the Marine design.
Primary request: Create a clean 12-frame Assault gameplay sprite sheet in an exact 4-column by 3-row grid.
Subject: The same sealed-helmet Assault from Image 1, without a weapon in hand because weapons render separately. Lean athletic military silhouette, charcoal angular medium armour, reinforced asymmetric right shoulder, deep navy undersuit, burnt-orange markings, narrow amber visor, small cyan equipment lights.
Frame order, exact: columns are SOUTH/front, NORTH/back, EAST/right-facing profile, WEST/left-facing profile. Row 1 is IDLE standing. Row 2 is MOVING/run stride. Row 3 is EVASIVE ROLL in the corresponding direction. Exactly one complete character per cell, exactly 12 characters total, no header, no labels, no separators.
Style/medium: Polished painterly pixel-art game sprites matching Image 2's camera angle, outline weight, detail density, shading, and readable 96-pixel gameplay footprint; consistent character identity in every frame.
Composition/framing: perfectly even four-by-three grid, generous equal cell margins, each figure centered on the same foot/pivot baseline within its cell, no overlap or clipping, identical scale across frames.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local background removal. Background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, grid lines, or lighting variation.
Lighting/mood: neutral game lighting baked consistently across every frame; amber visor and cyan/orange accents remain readable at small scale.
Constraints: do not use #ff00ff anywhere in the character; crisp edges; no cast shadow; no contact shadow; no weapon; no text; no UI; no logo; no watermark; no extra props; no medical crosses; no exposed face; no pose outside its cell; do not add or omit frames. Keep the armour design identical to Image 1 in all twelve frames.
```

## Breach Module overlay v1

```text
Use case: stylized-concept
Asset type: modular equipment overlay sprite-sheet master for the Last Bastion Assault hero
Input images: Image 1 is the exact Assault equipment identity. Image 2 is the exact 4-column by 3-row body sheet whose directions, poses, scale, and cell placement this overlay must follow.
Primary request: Create an overlay-only 12-frame sheet for Assault's optional Breach Module. Show only the added equipment pieces in each frame: a compact angular helmet brow/shroud around the amber visor, a small reinforced plate/rail on the asymmetric right shoulder, and a slim matching forearm breaching plate. Do not draw the underlying head, body, limbs, undersuit, boots, or base armour.
Frame order, exact: columns SOUTH/front, NORTH/back, EAST/right-facing profile, WEST/left-facing profile. Row 1 IDLE, row 2 MOVING/run, row 3 EVASIVE ROLL. Overlay pieces must follow the precise orientation and pose shown in the corresponding Image 2 cell. Exactly 12 overlay groups total.
Style/medium: Match Image 2's painterly pixel-art resolution, outline weight, lighting, and small-gameplay readability. Charcoal/gunmetal modules with restrained burnt-orange marks, tiny cyan hardware lights, and amber visor opening where visible.
Composition/framing: exact even 4-by-3 grid matching Image 2; each overlay group positioned where it belongs on the corresponding body, with the same scale and cell margins; no labels or grid lines.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background. One uniform color, no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Constraints: overlay equipment only; do not include a complete character silhouette; do not fill torso, arms, legs, hands, or boots; no weapon; no text; no UI; no logo; no watermark; do not use #ff00ff in the equipment; crisp separated edges; no extra frames; do not change the armour identity.
```
