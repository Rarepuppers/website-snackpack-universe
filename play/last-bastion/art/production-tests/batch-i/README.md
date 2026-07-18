# Codex, perk, and hotkey tile art preflight (Batch I)

Batch I1 is promoted to runtime after the weapon placement behavior gate passed on 18 July 2026. The retained chroma masters now produce deterministic transparent 8 × 128 atlases for weapons, perks, and hotkey/action motifs. Cooldown shadows, key labels, inventory slots, tiers, selection, and legality remain code-owned.

## Generated families

- `codex-weapon-tiles-v1-96-chroma.png`: eight 96px weapon tiles for Codex/shop surfaces.
- `perk-tiles-v1-64-chroma.png`: eight 64px perk motifs.
- `hotkey-action-tiles-v1-64-chroma.png`: eight 64px action/hotkey motifs, including empty and disabled states.

All masters use the established Last Bastion tile language, flat magenta chroma, no baked text/numbers/bindings, and strong silhouettes for cooldown-shadow and grayscale review. Normalize to transparent runtime atlases only after the tile behavior gate is approved.

## Runtime promotion

- Run `normalize_batch_i.py` with Pillow to regenerate all three atlases.
- Review all 24 frames at `?mode=gallery&batch=i`.
- Review the weapon atlas in context at `?scenario=weapon-gate`.
- I2 slot/tier/discard/merge surfaces and I3 placement/shop surfaces remain separate follow-on tasks.
