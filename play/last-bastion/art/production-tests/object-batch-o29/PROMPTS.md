# Object Batch O29 — Generation Prompts

Generated 2026-07-26 with built-in imagegen. All prompts requested premium hand-painted 3D 2×2 atlases, one isolated prop per quadrant, flat `#00ff00` background, no text/logos/UI/characters/weapons/pickups/fire/smoke/sparks/particles/arrows/telegraphs/collision markers/gameplay values, and 4K Steam source quality.

## Thermal / climate control

Wall heat exchanger; floor circulation unit; insulated coolant manifold; thermal blanket rack.

## Learning / education

Classroom workbench; powered-off lesson projector; science demonstration bench; abstract block map board.

## Personal / quarters

Bunk alcove; personal locker bank; fold-down writing desk; bedside utility shelf.

## Extraction

Use `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill` for each `*-chroma.png`, then run `normalize_object_batch_o29.py`.
