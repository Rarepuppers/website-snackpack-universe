# Event Horizon Unique art preflight (Batch L)

This is a Steam-quality production preflight for the approved Event Horizon concept. It is deliberately held from normal gameplay until the Event Horizon behavior gate proves aim, pull-field, implosion, cooldown, and active-tile timing.

## Runtime contracts

- `event-horizon-v1`: 4-frame east-authored 96 x 96 ring weapon sheet (ready, charge, fire, recover), pivot `(0.18, 0.5)`.
- `event-horizon-effects-v1`: 4 x 2 64 x 64 atlas, frames 0-7: gravitic orb, travel wake, field seed, active field, implosion charge, implosion burst, distortion impact, ready glint.
- `event-horizon-tile-v1`: 64 x 64 premium active tile motif, black core eclipsing a broken cyan ring.

The art does not define projectile speed, field radius, pull strength, collision, damage, cooldown, or target selection. Those remain simulation-owned. The gallery is available at `?mode=gallery&batch=eh`; no normal-run binding is added in this preflight.

## Source retention and rebuild

The three `*-chroma.png` files are untouched generated sources. Transparent masters are retained beside them. `normalize_event_horizon.py` creates exact nearest-neighbour runtime sheets and tile. The approved concept at `art/concepts/weapons/event-horizon-v1.png` remains the strict silhouette/material reference.

Creator review should check weapon-ring readability, projectile recognition against the arena, implosion contrast, tile recognition at 64/48/36 px under cooldown shadow, and colour-blind/grayscale separation before behavior integration.
