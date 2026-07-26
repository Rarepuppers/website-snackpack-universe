# Object Batch O27 — Generation Prompts

Generated 2026-07-26 with the built-in imagegen tool. Each prompt requested a premium hand-painted 3D 2×2 atlas, one isolated prop per quadrant, flat `#00ff00` background, no text/logos/UI/characters/weapons/pickups/fire/smoke/sparks/particles/arrows/telegraphs/collision markers/gameplay values, and 4K Steam source quality.

## Civic / market

Vendor stall counter with blank fascia; ration kiosk with blank front; weighing station with blank display housing; stackable market crate rack.

## Memorial / cultural

Memorial plinth with blank inset; circular remembrance wall with blank medallion; reclaimed-machine sculpture; quiet offering shelf with blank ceramic vessels.

## Surface / salvage

Rugged salvage cart; magnetic lifting cradle with blank housing; reclaimed hull-plate stack; sealed salvage drum.

## Extraction and normalization

```powershell
$py='C:\Users\Mark\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$helper='C:\Users\Mark\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py'
& $py $helper --input civic-market-v1-chroma.png --out civic-market-v1-alpha-extracted.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
& $py $helper --input memorial-cultural-v1-chroma.png --out memorial-cultural-v1-alpha-extracted.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
& $py $helper --input surface-salvage-v1-chroma.png --out surface-salvage-v1-alpha-extracted.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
& $py normalize_object_batch_o27.py
```
