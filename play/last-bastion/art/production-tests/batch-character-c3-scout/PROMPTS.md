# Scout C3 prompt provenance

Generated with the built-in image generation tool on 9 Aug 2026. The complete prompts are retained below.

## Select portrait

Use case: stylized-concept. Production hero-select identity portrait for Last Bastion. Create one full-height,
text-free Scout: slim athletic reconnaissance soldier, visibly lighter than a Marine, close-fitting dark tactical
hood over a compact sealed helmet, narrow icy-cyan visor, and a distinctive long low-profile optical sensor along
one side of the hood. Use lightweight charcoal/deep-navy armour, flexible joints, compact utility equipment,
small cyan lights, and restrained pale-sand identification stripes. Hold a slim Arc Carbine low and separate from
the body. Premium modern pixel-art illustration in a dark navy industrial corridor; full body and weapon inside a
vertical 2:3 frame. No exposed face, text, logo, watermark, cape, fantasy armour, or franchise resemblance.

Built-in source:
`C:\Users\Mark\.codex\generated_images\019fdfc6-479b-7333-95eb-3412c764ccd5\exec-fc4576e3-e15d-4652-bd61-563c37e7417a.png`

## Gameplay sheet

Use case: stylized-concept. Create a clean 12-frame Scout body sheet in an exact 4×3 grid on a perfectly flat
solid `#ff00ff` chroma background. Preserve the portrait identity without a weapon: slim body, close hood, sealed
helmet, icy-cyan visor, long side optic, lightweight charcoal/navy armour, cyan lights, pale-sand stripes. Columns
are south/front, north/back, east/right, west/left. Rows are idle, fast run, and low compressed forward dash.
Exactly one centred full-body figure per cell, consistent scale and baseline, high three-quarter gameplay view.
No text, labels, borders, shadows, extra frames, weapon, cape, cloak tails, magenta character pixels, or glow trail.

Built-in source:
`C:\Users\Mark\.codex\generated_images\019fdfc6-479b-7333-95eb-3412c764ccd5\exec-7d6e9616-f5fe-4755-b923-834c4f033383.png`

## Extraction and normalization

The generated sheet is retained as `scout-base-spritesheet-v1-chroma-master.png`. The installed image-generation
skill helper removed its sampled magenta border with soft matte and despill into
`scout-base-spritesheet-v1-alpha-master.png`. `normalize_c3_scout.py` validates transparent corners, normalizes
each source cell independently into the shared 4×3 96 px runtime contract, encodes the portrait WebP, and derives
the roster tile.
