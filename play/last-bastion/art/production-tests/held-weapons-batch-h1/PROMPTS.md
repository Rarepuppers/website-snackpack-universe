# Held Weapons Batch H1 — prompt record

Generated with the built-in image generation tool on 2026-07-26. Both renders used a flat `#FF00FF` chroma-key background, then local alpha extraction with soft matte/despill. Existing Last Bastion event and weapon atlases were reference images for palette, silhouette language, and polish only.

## Body atlas

Exact 6-row × 4-column atlas. Rows: Railspike, Seeker Swarm, Cryo Lance, Tesla Coil, Flamethrower, Sawblade. Columns: folded/idle, charge or spin-up, active/fire posture, recovery/cooldown. Clean weapon silhouettes, generous cell padding, no player/hand/tether, no UI, no gameplay geometry, and no text.

## Effects atlas

Exact 6-row × 4-column atlas with columns onset, travel-or-active, result, recovery. Effects match each weapon's behavior: piercing rail, homing micro-missiles, narrow cryo beam, chained Tesla arcs, short wide flame cone, and orbiting sawblade motion/cut sparks. Effects remain separate from target circles, radii, reticles, hitboxes, timers, damage areas, and HUD.

## Rebuild

Run `normalize_held_weapons_batch_h1.py` with the bundled workspace Python to regenerate the transparent masters, 384px preflight derivatives, 128px runtime atlases, and contact sheet deterministically.
