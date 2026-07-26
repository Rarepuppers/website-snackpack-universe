# Shop Keepers — Generation Prompt

Generated 2026-07-26 with built-in imagegen. One 7-column × 4-row atlas: columns Blacksmith, Gunsmith, VND-R, Clinician, Medic-Sister, Curator, Fence; rows are four subtle idle frames. Flat `#00ff00` background, distinct silhouettes, navy/charcoal base palette with signature accents, no text/logos/prices/offers/UI/counter or transaction symbols, and 4K Steam source quality.

Extraction used `remove_chroma_key.py --key-color '#00ff00' --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`. `normalize_shop_keepers.py` splits and centers each keeper into a four-frame 128×256 sheet.
