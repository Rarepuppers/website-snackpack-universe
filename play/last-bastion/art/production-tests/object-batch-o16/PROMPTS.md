# Object Batch O16 prompts

Generated with the built-in image-generation tool on 2026-07-26. Every prompt requested a strict 2×2 atlas, one isolated prop per quadrant, orthographic 3/4 top-down view, perfectly flat `#00ff00` background, no text/logos/UI/characters/weapons/pickups/fire/smoke/particles/telegraphs/collision markers/gameplay values, fully opaque separated props, and premium painted sci-fi materials suitable for a future Steam HD/4K source.

## Medical response

Field med station with blank screen; folded rescue stretcher; sealed trauma cabinet; wall-mounted first-aid case with blank face.

## Emergency support

Fire-suppression canister rack; emergency shower and eyewash station; portable industrial floodlight; rescue rope reel with rugged housing.

## Security support

Scanner gate module with blank panel; shielded security camera box; retractable barricade post; access turnstile frame.

The chroma sources were processed with `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`; the normalizer restores RGB under alpha and emits runtime derivatives.
