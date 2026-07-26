# Item Batch P1 — live powerup consolidation

Production candidate art for the six live powerup/status entries: Overcharge, Aegis, Adrenaline, Magnet Pulse, Medkit, and Uranium-Core Rounds.

## Atlas contract

- `powerup-atlas-v1` is a 4-column × 6-row shared master: canonical tile, world-pickup idle, pickup-burst accent, active-status motif.
- `powerup-effects-v1` is a 4-cell shared strip: pickup pulse, pickup confirmation, expiration warning, recovery fade.
- Retained transparent masters remain at source resolution; 384px derivatives are the 4K-preflight review size.
- Runtime derivatives cover 128, 96, 64, 48, and 36px logical use. Copies are in `play/last-bastion/game-assets/`.

## Acceptance gate

Candidate art only. The simulation owns timers, cooldown rings, urgency, stacks, quantities, rarity, disabled states, pickup rules, and all geometry. Do not add item-pool or HUD bindings until 128/96/64/48/36px, grayscale, colour-vision, radial-shadow, and maximum-density reviews pass.

## Steam target

Keep the source and 384px derivatives as canonical review masters for future HD/4K Steam presentation. Never upscale the 36–128px runtime derivatives for showcase use; repaint or regenerate at source resolution when a close-up treatment is required.

`normalize_item_batch_p1.py` restores opaque source color, preserves clean alpha, emits all derivatives, and copies the runtime files deterministically.
