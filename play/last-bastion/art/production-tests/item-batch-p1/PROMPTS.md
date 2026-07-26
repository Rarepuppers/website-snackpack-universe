# Item Batch P1 — prompt record

Generated with the built-in image generation tool on 2026-07-26. Renders used a flat `#FF00FF` chroma-key background and local soft-matte/despill alpha extraction. Existing Batch C reward art and Batch F1 Uranium art were style references only.

## Powerup atlas

Exact 6-row × 4-column atlas. Rows: Overcharge, Aegis, Adrenaline, Magnet Pulse, Medkit, Uranium-Core Rounds. Columns: canonical tile, world pickup idle, pickup burst accent, active status motif. Shared silhouettes remain recognizable across all four columns; no text, timer ring, quantity, rarity frame, HUD panel, or gameplay geometry.

## Shared effects strip

Exact 1-row × 4-column generic strip: restrained pickup pulse, confirmation sparkle, expiration warning flicker, recovery fade. The strip is reusable across all six items and leaves timing, duration, and urgency to code.

## Rebuild

Run `normalize_item_batch_p1.py` with the bundled workspace Python to regenerate transparent masters, 4K-preflight derivatives, runtime sizes, and the contact sheet.
