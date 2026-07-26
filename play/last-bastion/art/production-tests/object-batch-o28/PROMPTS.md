# Object Batch O28 — Generation Prompts

Generated 2026-07-26 with the built-in imagegen tool. Each prompt requested a premium hand-painted 3D 2×2 atlas, one isolated prop per quadrant, flat `#00ff00` background, no text/logos/UI/characters/weapons/pickups/fire/smoke/sparks/particles/arrows/telegraphs/collision markers/gameplay values, and 4K Steam source quality.

## Robotics / support

Drone charging cradle; robot tool rack; articulated manipulator arm; parts sorting carousel.

## Water / treatment

Filtration tank; purification manifold; condensate collection basin; water-quality sampling cabinet.

## Expedition / field gear

Survey backpack frame; inactive beacon tripod; collapsible field shelter frame; sample transport case.

## Extraction and normalization

```powershell
$py='C:\Users\Mark\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$helper='C:\Users\Mark\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py'
& $py $helper --input robotics-support-v1-chroma.png --out robotics-support-v1-alpha-extracted.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
& $py $helper --input water-treatment-v1-chroma.png --out water-treatment-v1-alpha-extracted.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
& $py $helper --input expedition-field-gear-v1-chroma.png --out expedition-field-gear-v1-alpha-extracted.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
& $py normalize_object_batch_o28.py
```
