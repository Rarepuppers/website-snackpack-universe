# UI Batch U1 — shell chrome

Status: reusable U1 primitive set complete and accepted for local testing.

This batch establishes the text-free technical frame language for Last Bastion's
front-end shell. Labels, icons, focus behavior, and accessibility remain code-owned.

## Sources and prompt intent

- `ui-panel-source-v1.png`: ImageGen source for one orthographic empty panel frame.
- `ui-button-source-v1.png`: ImageGen source for one orthographic empty command button.
- Tool mode: image generation (`imagegen`), not image editing.
- Prompt intent: dark navy-black gunmetal, restrained cyan navigation accents,
  tiny amber status lights, clipped corners, no text or perspective.

The generator returned RGB files with a baked checker preview. Source files are
retained for provenance, but are never loaded by the game.

## Runtime contract

- `ui-panel-frame-v1-256.{png,webp}` uses 48 px nine-slice margins.
- `ui-panel-{recessed,raised,emphasis}-v1-256.{png,webp}` provides explicit
  content, card, and modal weights using the same 48 px margins.
- `ui-button-{idle,hover,selected,pressed,disabled}-v1-320x120.{png,webp}`
  uses 48 px left/right and 36 px top/bottom nine-slice margins.
- `ui-focus-brackets-v1-128.{png,webp}` is a non-colour-only selection overlay.
- `ui-header-plate-v1-512x96.{png,webp}` is a text-free section-title backing.
- `ui-divider-rule-v1-512x16.{png,webp}` is a stretchable section divider.
- Runtime PNGs contain real alpha and stable versioned filenames.
- WebP files are lossless optional delivery companions; PNG remains the fallback.

Regenerate with:

```powershell
python normalize_ui_batch_u1.py
```

The normalizer removes the baked checker, crops, resamples, derives explicit
button states, and writes deterministic dimensions. Never overwrite `v1` with a
different design; create `v2` instead.
