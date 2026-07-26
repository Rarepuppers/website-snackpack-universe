# Object Batch O30 — Generation Prompts

Generated 2026-07-26 with built-in imagegen. All prompts requested premium hand-painted 3D 2×2 atlases, one isolated prop per quadrant, flat `#00ff00` background, no text/logos/UI/characters/weapons/pickups/fire/smoke/sparks/particles/arrows/telegraphs/collision markers/gameplay values, and 4K Steam source quality.

## Construction / staging

Modular scaffold tower; inactive material lift; construction-panel rack; tool-and-fastener cart.

## Geology / survey

Inactive core-sample drill rig; rock sample sorting table; seismic sensor tripod; mineral specimen cabinet.

## Quiet / recreation

Analog game table; inactive music listening console; reading nook bench; tabletop craft station.

## Extraction

Use `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill` for each `*-chroma.png`, then run `normalize_object_batch_o30.py`.
