# Tactician C3 prompt provenance

Mode: built-in image generation.

References:

- `../batch-character-select/marine-select-portrait-v1-1024x1536.png` — style, franchise, lighting, scale, and composition reference only.
- `../batch-character-select/medic-select-portrait-v1-1024x1536.png` — style, franchise, lighting, scale, and composition reference only.
- `../../concepts/weapons/event-horizon-v1.png` — Event Horizon weapon identity reference.
- `../batch-character-c3-assault/assault-base-spritesheet-v1-chroma-master.png` — gameplay sheet layout, scale, poses, camera, and pixel rendering only.

## Select portrait v1

```text
Use case: stylized-concept
Asset type: Last Bastion game character-select portrait, production identity anchor
Primary request: Create the Tactician hero, a battlefield-control and target-priority specialist from the same Bastion military as Marine and Medic.
Subject: One full-body human combat tactician in a calm forward-facing three-quarter neutral hero pose. Slender disciplined silhouette; segmented command armour; high structured collar; compact sealed angular helmet with a narrow violet-cyan visor; dark navy undersuit; muted gunmetal and deep slate armour; restrained violet markings; cyan sensor lights; compact sensor fin. Hold the referenced Event Horizon low and safely at the side with its black core and broken violet-cyan containment ring visible.
Style/medium: Match the polished high-resolution painterly pixel-art portraits and grounded sci-fi military realism.
Composition/framing: Exact 1024x1536 portrait orientation; entire figure visible; centered; generous safe padding; weapon fully in frame.
Scene/backdrop: Restrained dark navy Bastion corridor presentation and floor treatment.
Constraints: text-free; no UI, logo, watermark, extra character, medical crosses, orange Assault markings, oversized Marine shoulders, exposed face, or alien features. Preserve a distinct silhouette.
```

## Gameplay body sheet v1

```text
Use case: stylized-concept
Asset type: Last Bastion top-down action-game character gameplay sprite-sheet master
Primary request: Create a clean 12-frame Tactician gameplay sprite sheet in an exact 4-column by 3-row grid.
Subject: The exact sealed-helmet Tactician identity anchor without a weapon in hand. Keep the slender slate/gunmetal armour, high collar, violet visor, sensor fin, violet markings, and cyan sensor lights consistent.
Frame order, exact: columns SOUTH/front, NORTH/back, EAST/right-facing profile, WEST/left-facing profile. Row 1 IDLE; row 2 MOVING; row 3 EVASIVE ROLL. Exactly one complete character per cell and 12 total.
Style/medium: Match the Assault sheet's camera, outline, detail density, shading, and readable 96-pixel footprint without copying its design.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background with no shadows, gradients, texture, floor, or grid lines.
Constraints: no weapon, text, UI, logo, watermark, props, exposed face, missing frames, extra frames, or #ff00ff in the character.
```
