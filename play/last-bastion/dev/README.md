# Last Bastion web prototype

## Commands

```powershell
npm.cmd run dev
npm.cmd run verify
```

The production build is emitted to the parent `/play/last-bastion/` route.

## Review routes

- `/play/last-bastion/` — styled normal five-wave run with seeded mini-boss selection
- `/play/last-bastion/?art=placeholder` — code-shape comparison renderer
- `/play/last-bastion/?helmet=0` — styled Marine without the removable helmet
- `/play/last-bastion/?weapons=1`, `4`, `6`, or `12` — selected weapon-ring count
- `/play/last-bastion/?loadout=vertical` — Service Rifle, Scattergun, and Arc Carbine production-art loadout
- `/play/last-bastion/?loadout=scattergun` or `?loadout=arc-carbine` — isolate one new weapon behaviour
- `/play/last-bastion/?scenario=slime-spitter&loadout=vertical` — hostile-glob, slowing-puddle, and three-weapon review lab
- `/play/last-bastion/?scenario=carapace-elite&loadout=vertical` — directional armour, charge recovery, and guaranteed elite-reward lab
- `/play/last-bastion/?scenario=siege-crusher&loadout=vertical` — mini-boss phases, cover destruction, boss bar, and arsenal-cache lab
- `/play/last-bastion/?scenario=brood-warden&loadout=vertical` — four-move Brood Warden, egg priority, acid fan, enrage, and swarm-rush lab
- `/play/last-bastion/?scenario=ripper&loadout=vertical` — long-reach melee cone, locked wind-up, dodge-behind, and recovery-punish lab
- `/play/last-bastion/?scenario=quillback&loadout=vertical` — locked 1/3/5 spike fans, close-range retreat, and dodge-gap readability lab
- `/play/last-bastion/?scenario=spinewheel&loadout=vertical` — locked heading, wall/cover rebounds, speed decay, repeat-hit safety, and recovery-punish lab
- `/play/last-bastion/?scenario=tether-bloom&loadout=vertical` — non-damaging pull, cover blocking, dodge/damage breaks, and single-controller lab
- `/play/last-bastion/?stress=4` — normal four-weapon mixed-enemy readability stress scene
- `/play/last-bastion/?stress=12` — twelve-weapon capacity/performance stress scene
- `/play/last-bastion/?mode=gallery` — production art frame, pivot, scale, state, and equipment gallery
- `/play/last-bastion/?mode=gallery&batch=a` — all 52 Production Asset Batch A runtime frames
- `/play/last-bastion/?mode=gallery&batch=b` — all 63 Production Asset Batch B runtime visuals
- `/play/last-bastion/?mode=gallery&batch=c` — 60 gameplay-critical Production Asset Batch C visuals
- `/play/last-bastion/?mode=gallery&batch=d` — all 23 Brood Warden Production Asset Batch D1 visuals
- `/play/last-bastion/?mode=gallery&batch=d2` — all 24 Ripper Production Asset Batch D2 visuals
- `/play/last-bastion/?mode=gallery&batch=e1` — all 20 Quillback Production Asset Batch E1 visuals
- `/play/last-bastion/?mode=gallery&batch=e2` — all 24 Spinewheel Production Asset Batch E2 visuals
- `/play/last-bastion/?mode=gallery&batch=e3` — all 24 Tether Bloom Production Asset Batch E3 visuals
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

The normal arena is larger than the viewport and uses bounded camera follow. HUD and decision UI remain camera-fixed; live text renders at higher texture resolution and decision cards use scalable surfaces rather than stretched bitmap panels.
