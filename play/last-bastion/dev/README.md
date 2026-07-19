# Last Bastion web prototype

## Commands

```powershell
npm.cmd run dev
npm.cmd run verify
```

The production build is emitted to the parent `/play/last-bastion/` route.

## Review routes

- `/play/last-bastion/` — styled normal ten-wave run with authored elite cadence, seeded mini-boss selection, and the Bastion Eater finale
- `/play/last-bastion/?art=placeholder` — code-shape comparison renderer
- `/play/last-bastion/?helmet=0` — styled Marine without the removable helmet
- `/play/last-bastion/?weapons=1`, `4`, `6`, or `12` — selected weapon-ring count
- `/play/last-bastion/?loadout=vertical` — Service Rifle, Scattergun, and Arc Carbine production-art loadout
- `/play/last-bastion/?loadout=scattergun` or `?loadout=arc-carbine` — isolate one new weapon behaviour
- `/play/last-bastion/?loadout=bolt` — Bolt Carbine two-target penetration, terminal impact, and missed-shot cadence lab
- `/play/last-bastion/?loadout=bulwark` — Bulwark Rotary Cannon rapid-tracer and heavy-weapon presentation lab
- `/play/last-bastion/?loadout=grenade` — Grenade Tube projectile, fuse-expiry, direct-hit, splash, and explosion lab
- `/play/last-bastion/?scenario=slime-spitter&loadout=vertical` — hostile-glob, slowing-puddle, and three-weapon review lab
- `/play/last-bastion/?scenario=carapace-elite&loadout=vertical` — directional armour, charge recovery, and guaranteed elite-reward lab
- `/play/last-bastion/?scenario=siege-crusher&loadout=vertical` — mini-boss phases, cover destruction, boss bar, and arsenal-cache lab
- `/play/last-bastion/?scenario=brood-warden&loadout=vertical` — four-move Brood Warden, egg priority, acid fan, enrage, and swarm-rush lab
- `/play/last-bastion/?scenario=rift-stalker&loadout=vertical` — cloaked stalk, decoy-mark warp pounce, rift-spike fan, close slash, and final-20% chained-warp frenzy lab (placeholder body until Batch O)
- `/play/last-bastion/?scenario=ripper&loadout=vertical` — long-reach melee cone, locked wind-up, dodge-behind, and recovery-punish lab
- `/play/last-bastion/?scenario=razor-scuttler&loadout=vertical` — locked dash lane, cover crash, one-hit safety, and miss-recovery lab
- `/play/last-bastion/?scenario=quillback&loadout=vertical` — locked 1/3/5 spike fans, close-range retreat, and dodge-gap readability lab
- `/play/last-bastion/?scenario=spinewheel&loadout=vertical` — locked heading, wall/cover rebounds, speed decay, repeat-hit safety, and recovery-punish lab
- `/play/last-bastion/?scenario=tether-bloom&loadout=vertical` — non-damaging pull, cover blocking, dodge/damage breaks, and single-controller lab
- `/play/last-bastion/?scenario=bastion-eater&loadout=vertical` — three-phase final-boss, exposed-node damage windows, cover breach, tendril, egg, and last-stand lab
- `/play/last-bastion/?stress=4` — normal four-weapon mixed-enemy readability stress scene
- `/play/last-bastion/?stress=12` — twelve-weapon capacity/performance stress scene
- `/play/last-bastion/?scenario=density-capacity&debug=1` — deterministic Density Director v3 scene with 56 live enemies, bounded ranged wind-ups/projectiles, and live capacity telemetry
- `/play/last-bastion/?mode=gallery` — production art frame, pivot, scale, state, and equipment gallery
- `/play/last-bastion/?mode=gallery&batch=a` — all 52 Production Asset Batch A runtime frames
- `/play/last-bastion/?mode=gallery&batch=b` — all 63 Production Asset Batch B runtime visuals
- `/play/last-bastion/?mode=gallery&batch=c` — 60 gameplay-critical Production Asset Batch C visuals
- `/play/last-bastion/?mode=gallery&batch=d` — all 23 Brood Warden Production Asset Batch D1 visuals
- `/play/last-bastion/?mode=gallery&batch=d2` — all 24 Ripper Production Asset Batch D2 visuals
- `/play/last-bastion/?mode=gallery&batch=d3` — all 41 Bastion Eater Production Asset Batch D3 visuals
- `/play/last-bastion/?mode=gallery&batch=e1` — all 20 Quillback Production Asset Batch E1 visuals
- `/play/last-bastion/?mode=gallery&batch=e2` — all 24 Spinewheel Production Asset Batch E2 visuals
- `/play/last-bastion/?mode=gallery&batch=e3` — all 24 Tether Bloom Production Asset Batch E3 visuals
- `/play/last-bastion/?mode=gallery&batch=f1` — Patrol Blade, action-bar, and timed-status Production Asset Batch F1
- `/play/last-bastion/?mode=gallery&batch=f2`, `f3`, or `f4` — Bolt Carbine, Bulwark Rotary Cannon, or Grenade Tube production families
- Add `debug=1` to the normal or stress route for collision labels and live entity/effect counts.
- Add `theme=bastion-standard|emberfall|toxic-bloom|void-approach|arctic-relay` to pin an arena background theme; without it each load draws one from the pool.
- Decision overlays support arrows/WASD/left-stick navigation, Enter/Space/pad-A confirm, and digits 1–4 quick pick; disabled Shop rows are skipped and cannot be confirmed.
- Add `size=100..300` to preview the planned game-size setting; the canvas always snaps to whole physical pixels.

- `/play/last-bastion/?scenario=aurum-hoarder&loadout=bulwark` — Aurum Hoarder forage/flee lab with armour-break Scrap, edge-exit marker, and guaranteed supply-cache reward
- `/play/last-bastion/?scenario=scrap-shop&loadout=vertical` — seeded four-row Scrap Shop lab with three live offers, affordability states, repeat purchasing, and explicit leave/bank action
- `/play/last-bastion/?scenario=weapon-gate` — code-native weapon placement lab with typed rack slots, four-slot stash, swap refusal, discard, and merge targets
- `/play/last-bastion/?scenario=batch-j&loadout=vertical` — deterministic J1/J2 live-art lab with the swarm body, three elite bodies, attack cadence, and layered telegraphs

- `/play/last-bastion/?mode=gallery&batch=n` — Task 36 Aurum body/effects/cache family and eight 128 px runtime tiles
- `/play/last-bastion/?mode=gallery&batch=n2` — production Scrap Shop panel, six 128 px offer tiles, and four 128 px Scrap HUD/effect frames
- `/play/last-bastion/?mode=gallery&batch=j1` — Swarm Scuttler and elite body state sheets
- `/play/last-bastion/?mode=gallery&batch=j2` — code-backed hostile telegraph decals and five-arena contrast strip
- `/play/last-bastion/?mode=gallery&batch=i` — promoted Batch I1 weapon, perk, and hotkey/action 128 px runtime tile atlases
- `/play/last-bastion/?mode=gallery&batch=i2` — Batch I2 rack-class, stash, tier, discard, merge, and drag surfaces
- `/play/last-bastion/?mode=gallery&batch=i3` — Batch I3 placement modal, stat card, salvage counter, and shop glyphs

## Codex

`/play/last-bastion/last-bastion-codex.html` is the encyclopedia and tile gallery (characters, weapons,
Monsterdex, upgrades, perks, powerups, relics, ammo, damage types, DoT). It is a static page outside the
Vite app — serve the website root to view it, not the dev server. Every entry requests
`game-assets/tiles/<id>-v1.png` and falls back to a placeholder, so dropping tile art in upgrades both
the codex and the game's future character-select/shop screens.

## Architecture

- `arena/` owns portable arena geometry and collision resolution.
- `assets/` owns stable asset IDs, logical sizes, frame contracts, and pivots.
- `combat/` owns deterministic gameplay state and events.
- `effects/` owns pooled transient rendering.
- `rendering/` maps portable state to Phaser presentation.
- `ui/` owns the camera-safe HUD and run-state panels.
- `equipment/WeaponInventory.ts` owns the portable weapon-tile contract: typed rack legality, four-slot stash placement, non-destructive swaps, discard, and identical same-tier merges capped at Tier III. Combat snapshots expose this state so a future Steam client can replace the Phaser modal without rewriting the rules.
- `scenes/AssetGalleryScene.ts` is the production-art validation surface.

Placeholder rendering remains available as a comparison tool, but styled production-test art is the default renderer.

The normal arena is larger than the viewport and uses bounded camera follow. HUD and decision UI remain camera-fixed; live text renders at higher texture resolution and decision cards use scalable surfaces rather than stretched bitmap panels.
