# Codex, perk, and hotkey tile art preflight (Batch I)

Batch I is a held production preflight for the Codex/shop tile library and the bottom action bar. The generated masters are not yet wired to runtime because cooldown shadows, key labels, inventory slots, and perk selection states remain code-owned.

## Generated families

- `codex-weapon-tiles-v1-96-chroma.png`: eight 96px weapon tiles for Codex/shop surfaces.
- `perk-tiles-v1-64-chroma.png`: eight 64px perk motifs.
- `hotkey-action-tiles-v1-64-chroma.png`: eight 64px action/hotkey motifs, including empty and disabled states.

All masters use the established Last Bastion tile language, flat magenta chroma, no baked text/numbers/bindings, and strong silhouettes for cooldown-shadow and grayscale review. Normalize to transparent runtime atlases only after the tile behavior gate is approved.
