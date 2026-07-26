# Held Weapons Batch H1

Production candidate atlases for the six behavior-live held weapons currently held out of the chest pool pending art/audio acceptance.

## Atlas contract

- Both atlases are 4 columns × 6 rows.
- Rows: Railspike, Seeker Swarm, Cryo Lance, Tesla Coil, Flamethrower, Sawblade.
- Body columns: folded/idle, charge or spin-up, active/fire posture, recovery/cooldown.
- Effects columns: onset, travel-or-active, result, recovery.
- `*-v1.png` is the retained transparent master; `*-v1-384.png` is the 4K-preflight derivative; `*-v1-128.png` is the current runtime derivative.
- Runtime copies are in `play/last-bastion/game-assets/`.

The source chroma-key renders and alpha-extraction intermediates remain in this folder for reproducibility. `normalize_held_weapons_batch_h1.py` restores opaque source color, preserves despilled edge alpha, emits derivatives, and copies the runtime atlases.

## Acceptance gate

These are candidate art only. Do not wire gameplay or chest-pool availability until each weapon passes close-view silhouette/readability review, effect timing review, audio pairing, and a 128px in-game readability pass.

No player, enemy, target ring, reticle, range radius, hitbox, timer, damage field, or HUD geometry is baked into the art. Runtime code remains unchanged in this batch.

## Steam target

Retain the source and 384px derivatives for future HD/4K Steam presentation. Runtime 128px atlases are convenience derivatives, not source-of-truth art. If a weapon needs a close-up UI or showcase treatment, repaint at source resolution rather than upscaling the runtime file.
