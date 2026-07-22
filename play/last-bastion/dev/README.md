# Last Bastion web prototype

## Commands

```powershell
npm.cmd run dev
npm.cmd run verify
npm.cmd run offline
```

The production build is emitted to the parent `/play/last-bastion/` route.

`npm.cmd run offline` audits that built route for remote startup dependencies and verifies every referenced local game asset. Run it after `npm.cmd run build`; the full `verify` command already includes both steps.

## Control remapping

Gameplay bindings can be remapped under **Main Menu → Settings → Control bindings**. Keyboard and standard-gamepad assignments persist in save schema v7; duplicate assignments swap automatically. Combat action tiles, the fire-mode chip, footer, and How to Play copy reflect the active mapping.

## Review routes

- `/play/last-bastion/` — the front-end shell: Title → Menu → How to Play / Settings / Lab / Character select (Task 37 behavior gate; code-native placeholder panels until Batch G). `?screen=title` forces the shell; any review parameter below skips it.
- `/play/last-bastion/?screen=game` — styled normal ten-wave run with authored elite cadence, seeded mini-boss selection, and the Bastion Eater finale
- `/play/last-bastion/?scenario=batch-j&rims=1` — Task 56 actor-rim and projectile-halo A/B lab (`rims=0` is the control; add `flash=0` for reduced-flash feedback)
- `/play/last-bastion/?scenario=infected-survivor&loadout=vertical` — Task 58 sprint-stamina, acceleration, and pack-steering lab (Batch M survivor art)
- `/play/last-bastion/?scenario=corrupted-marine&loadout=vertical` — Task 59 locked knife telegraph, slow projectile, cover/player impact, and cooldown lab
- `/play/last-bastion/?scenario=abomination&loadout=vertical` — Task 62 locked slam marker, committed hit/dodge geometry, terrain damage, vulnerable recovery, and complete Batch M family lab
- `/play/last-bastion/?screen=map` — the tuned playable 20-node expedition (Tasks 38–39, 48–49): selecting a route autosaves a pending node and deploys into depth-budgeted multi-wave Combat, Elite, Mini-boss, Supply Depot, Weapon Cache, or Bastion Eater encounters; every route crosses two campaign shops, and final victory commits the carried build and returns to the map. `&mapseed=N` reviews a deterministic fresh chart
- `/play/last-bastion/?screen=summary&summarydemo=1` — deterministic populated Task 50 run-summary review without changing the local save
- `/play/last-bastion/?screen=game&autofire=0` — Task 53 Manual-fire HUD/input review (`autofire=1` restores the default; both persist)
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
- `/play/last-bastion/?scenario=rift-stalker&loadout=vertical` — production Batch O body/effects, cloaked stalk, decoy-mark warp pounce, rift-spike fan, close slash, and final-20% chained-warp frenzy lab
- `/play/last-bastion/` → Expedition → New expedition — select the live Field Medic, a pre-drop perk, and deploy with the Injector Carbine
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
- Add `theme=bastion-standard|emberfall|toxic-bloom|void-approach|arctic-relay` to pin one of the five live authored arena families. Expedition nodes add a deterministic `worldseed` for one of three restrained lighting variants; terrain decals stay beneath gameplay and a per-world neutral wash protects actor/telegraph contrast.
- Decision overlays support arrows/WASD/left-stick navigation, Enter/Space/pad-A confirm, and digits 1–4 quick pick; disabled Shop rows are skipped and cannot be confirmed.
- Add `size=100..300` to preview the planned game-size setting; the canvas always snaps to whole physical pixels.

- `/play/last-bastion/?scenario=aurum-hoarder&loadout=bulwark` — Aurum Hoarder forage/flee lab with armour-break Scrap, edge-exit marker, and guaranteed supply-cache reward
- `/play/last-bastion/?scenario=scrap-shop&loadout=vertical` — seeded four-row Scrap Shop lab with three live offers, affordability states, repeat purchasing, and explicit leave/bank action
- `/play/last-bastion/?scenario=weapon-gate` — code-native weapon placement lab with typed rack slots, four-slot stash, swap refusal, discard, and merge targets
- `/play/last-bastion/?scenario=batch-j&loadout=vertical` — deterministic J1/J2 live-art lab with the swarm body, three elite bodies, attack cadence, and layered telegraphs

- `/play/last-bastion/?mode=gallery&batch=n` — Task 36 Aurum body/effects/cache family and eight 128 px runtime tiles
- `/play/last-bastion/?mode=gallery&batch=n2` — production Scrap Shop panel, six 128 px offer tiles, and four 128 px Scrap HUD/effect frames
- `/play/last-bastion/?mode=gallery&batch=o` — Rift Stalker body states, encounter effects, and portrait from Production Asset Batch O
- `/play/last-bastion/?mode=gallery&batch=p` — Field Medic body/helmet states, Injector Carbine, support effects, and portrait from Production Asset Batch P
- `/play/last-bastion/?mode=gallery&batch=q` — Quartermaster idle/transaction presentation from Production Asset Batch Q
- `/play/last-bastion/?mode=gallery&batch=j1` — Swarm Scuttler and elite body state sheets
- `/play/last-bastion/?mode=gallery&batch=j2` — code-backed hostile telegraph decals and five-arena contrast strip
- `/play/last-bastion/?mode=gallery&batch=i` — promoted Batch I weapon and hotkey atlases plus the seven canonical Task 46 perk tiles at 128 px
- `/play/last-bastion/?mode=gallery&batch=i2` — Batch I2 rack-class, stash, tier, discard, merge, and drag surfaces
- `/play/last-bastion/?mode=gallery&batch=i3` — Batch I3 placement modal, stat card, salvage counter, and shop glyphs

## Review harness

`/play/last-bastion/review-harness.html` (dev server only) boots every review route above in
sequence inside an iframe, recording runtime errors, console errors, canvas presence, and a
render-activity sample per route. Results appear on the page and in `window.__results` — the
mechanical layer of a consolidated creator review, leaving only visual/feel judgement to do by hand.

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
- `expedition/ExpeditionEncounter.ts` owns the pure node-to-encounter mapping; arrivals remain pending until combat or a safe-node decision succeeds, and mutable build state stays in the schema-v2 save rather than URL parameters.
- `effects/` owns pooled transient rendering.
- `rendering/` maps portable state to Phaser presentation.
- `ui/` owns the camera-safe HUD and run-state panels.
- `equipment/WeaponInventory.ts` owns the portable weapon-tile contract: typed rack legality, four-slot stash placement, non-destructive swaps, discard, and identical same-tier merges capped at Tier III. Combat snapshots expose this state so a future Steam client can replace the Phaser modal without rewriting the rules.
- `platform/PlatformProgress.ts` emits platform-neutral, retry-safe achievement unlock events; a future Steamworks adapter acknowledges IDs only after the platform accepts them.
- `platform/CloudSavePolicy.ts` deterministically resolves save envelopes, preserves the newest preferences/active run, and merges monotonic career and bestiary fields by maxima without double-counting a replayed run.
- `platform/PlatformAdapter.ts` is the injected Steamworks bridge for achievement acknowledgement, stats commit, and the versioned cloud slot. The browser build imports no Steam SDK package.
- `scenes/AssetGalleryScene.ts` is the production-art validation surface.

Placeholder rendering remains available as a comparison tool, but styled production-test art is the default renderer.

The normal arena is larger than the viewport and uses bounded camera follow. HUD and decision UI remain camera-fixed; live text renders at higher texture resolution and decision cards use scalable surfaces rather than stretched bitmap panels.
