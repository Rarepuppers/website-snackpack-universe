# Last Bastion web prototype

## Commands

```powershell
npm.cmd run dev
npm.cmd run verify
```

The production build is emitted to the parent `/play/last-bastion/` route.

## Review routes

- `/play/last-bastion/` — styled normal three-wave run
- `/play/last-bastion/?art=placeholder` — code-shape comparison renderer
- `/play/last-bastion/?helmet=0` — styled Marine without the removable helmet
- `/play/last-bastion/?weapons=1`, `4`, `6`, or `12` — selected weapon-ring count
- `/play/last-bastion/?stress=4` — normal four-weapon mixed-enemy readability stress scene
- `/play/last-bastion/?stress=12` — twelve-weapon capacity/performance stress scene
- `/play/last-bastion/?mode=gallery` — production art frame, pivot, scale, state, and equipment gallery
- `/play/last-bastion/?mode=gallery&batch=a` — all 52 Production Asset Batch A runtime frames
- Add `debug=1` to the normal or stress route for collision labels and live entity/effect counts.

## Architecture

- `arena/` owns portable arena geometry and collision resolution.
- `assets/` owns stable asset IDs, logical sizes, frame contracts, and pivots.
- `combat/` owns deterministic gameplay state and events.
- `effects/` owns pooled transient rendering.
- `rendering/` maps portable state to Phaser presentation.
- `ui/` owns the camera-safe HUD and run-state panels.
- `scenes/AssetGalleryScene.ts` is the production-art validation surface.

Placeholder rendering remains available as a comparison tool, but styled production-test art is the default renderer.
