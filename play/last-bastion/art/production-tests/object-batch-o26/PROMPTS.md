# Object Batch O26 — Generation Prompts

Generated 2026-07-26 with the built-in imagegen tool. Each prompt requested a premium hand-painted 3D 2×2 atlas, one isolated prop per quadrant, flat `#00ff00` background, no text/logos/UI/characters/weapons/pickups/fire/smoke/sparks/particles/arrows/telegraphs/collision markers/gameplay values, and 4K Steam source quality.

## Fabrication / safety

Safety barrier post; face-shield station; spill-containment tray; lockout-tagout cabinet with blank face.

## Habitat / commons

Communal table with stools and blank trays; drink dispenser with blank panel; abstract geometric wall-art panel; folding privacy screen.

## Communications / infrastructure

Antenna junction cabinet with blank face; signal cable distribution box; relay mast base; fiber splice case.

## Extraction and normalization

```powershell
$py='C:\Users\Mark\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$helper='C:\Users\Mark\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py'
& $py $helper --input fabrication-safety-v1-chroma.png --out fabrication-safety-v1-alpha-extracted.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
& $py $helper --input habitat-commons-v1-chroma.png --out habitat-commons-v1-alpha-extracted.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
& $py $helper --input communications-infrastructure-v1-chroma.png --out communications-infrastructure-v1-alpha-extracted.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
& $py normalize_object_batch_o26.py
```
