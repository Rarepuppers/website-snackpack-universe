# Held Weapons H1 — canonical tile atlas

This completes the held-weapon art candidate family with one canonical tile source for Railspike, Seeker Swarm, Cryo Lance, Tesla Coil, Flamethrower, and Sawblade.

## Contract

- One 3-column × 2-row atlas, stable cell order: Railspike, Seeker Swarm, Cryo Lance, Tesla Coil, Flamethrower, Sawblade.
- Transparent source master plus 384px 4K-preflight derivative retained here.
- Runtime derivatives: 128/96/64/48/36px, copied to `play/last-bastion/game-assets/`.
- The same atlas is intended for Codex, shop, loadout, status, and HUD surfaces; rarity frames, cooldowns, quantities, timers, bindings, and selection remain code-owned.

Do not enable the held-weapon chest pool until the body, VFX, tile, audio, and in-game readability reviews all pass.

`normalize_held_weapon_tiles_h1.py` rebuilds all outputs deterministically.
