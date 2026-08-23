# Last Bastion — playtest evidence

Screenshots and captures from creator-observed local runs. Referenced by defect ID from
`presentation-defect-plan-2026-08-23.md` and by the asset briefs Codex works from.

This is documentation, not a web asset. Confirm it stays out of the sitemap, related-games, and
image-optimisation generators before committing.

## Conventions

- One folder per session: `YYYY-MM-DD-run-N/`.
- File name starts with the defect ID: `LB-04-helmet-offset-facing-east.png`.
- Add the display resolution to the name when the defect is resolution-dependent
  (`LB-09-blurry-menu-text-3840.png`).
- Never crop away the surrounding UI — the surrounding UI is the context.
- Keep the raw capture. Do not re-encode, downscale, or convert to WebP.

## Sessions

| Session | Build | Display / input | Defects |
|---|---|---|---|
| `2026-08-23-run-0` | local dev, pre-fix | 1920×1080 windowed, keyboard/mouse | LB-01 … LB-12 |

### 2026-08-23-run-0 — expected files

| File | Defect |
|---|---|
| `LB-01-no-visible-tracer-1920.png` | Marine's default rifle shows no projectile |
| `LB-03-crate-no-feedback-1920.png` | Crate opens with no animation or reward readout |
| `LB-04-helmet-offset-facing-east.png` | Modular helmet oversized / off-head by facing |
| `LB-05-title-outside-plate.png` | "LAST BASTION" hangs out of the menu header plate |
| `LB-06-perk-tiles-overflow.png` | Character-select perk grid overflows the dossier panel |
| `LB-07-map-no-node-icons.png` | Expedition map: ASCII glyphs, soft plate, no medallions |
| `LB-09-blurry-menu-text-3840.png` | Shell text rasterised at 1× and upscaled |
| `LB-11-levelup-card-clipped.png` | Level-up card text crosses its own border and the hint line |

LB-02 (power-up inspect) and LB-08 (map node hover) are absence-of-feature findings; a still frame
adds nothing, so none is expected.
