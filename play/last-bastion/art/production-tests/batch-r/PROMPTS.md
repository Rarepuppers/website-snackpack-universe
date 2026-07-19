# Batch R prompt provenance

Generation mode: built-in image generation, 19 July 2026. Existing Batch A and Emberfall obstacle atlases were supplied as strict style references. Flat chroma backgrounds were removed with the installed imagegen skill helper using border sampling, soft matte, and despill.

## Destructible terrain

Create one exact 4-column by 7-row production pixel-art sprite sheet. Columns: intact, damaged, critical, destroyed. Rows: brittle metal fence, cargo crate, low barricade, natural boulder, power conduit, reinforced cover, brittle alien biomass. Match Last Bastion's isometric three-quarter perspective, chunky readable silhouettes, military science-fiction materials, crisp pixel clusters, restrained navy/charcoal/ivory palette, teal utility lights, and warm damage accents. Preserve each row's perspective, scale, footprint, camera, lighting, and identity across all columns. Damage is structural and cumulative; destroyed states are low knee-height rubble with an obvious traversable central gap. One centred prop per equal cell, bottom-centre aligned, generous padding, no clipping or overlap. Perfectly flat solid `#00ff00` background. No labels, UI, health bars, cast shadows, floor, gore, watermark, or collision markers. Exactly 28 props.

## Material effects

Create one exact 4-column by 2-row pixel-art VFX sheet. Frame order: bullet chip, melee spark, acid hiss, frost crack, explosive fracture, heavy collapse, dust settle, salvage glint. Match Batch R's crisp 64×64-readable pixel language. One isolated effect per equal cell with generous negative space. Perfectly flat solid `#ff00ff` background. No props, characters, floor, text, UI, watermark, or cast shadows. Exactly eight effects.
