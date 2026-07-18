# Codex, perk, and hotkey tile art preflight (Batch I)

Batch I1–I3 are production-complete after the weapon placement behavior gate passed on 18 July 2026. Retained chroma masters produce deterministic transparent weapon/perk/hotkey atlases, the complete slot/tier/discard/merge family, and placement/shop surfaces. Cooldown shadows, key labels, stats, prices, tiers, selection, and legality remain code-owned.

## Generated families

- `codex-weapon-tiles-v1-96-chroma.png`: eight 96px weapon tiles for Codex/shop surfaces.
- `perk-tiles-v1-64-chroma.png`: eight 64px perk motifs.
- `hotkey-action-tiles-v1-64-chroma.png`: eight 64px action/hotkey motifs, including empty and disabled states.

All masters use the established Last Bastion tile language, flat magenta chroma, no baked text/numbers/bindings, and strong silhouettes for cooldown-shadow and grayscale review. Normalize to transparent runtime atlases only after the tile behavior gate is approved.

## Runtime promotion

- Run `normalize_batch_i.py` with Pillow to regenerate all three atlases.
- Review all 24 frames at `?mode=gallery&batch=i`.
- Review the weapon atlas in context at `?scenario=weapon-gate`.
- Review I2 at `?mode=gallery&batch=i2` and I3 at `?mode=gallery&batch=i3`.
- The I3 salvage counter is retained for the expedition Shop node; the verified five-wave Scrap Shop keeps its N2 terminal panel.
