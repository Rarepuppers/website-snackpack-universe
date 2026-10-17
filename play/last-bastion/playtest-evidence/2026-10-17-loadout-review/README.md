# Normal-rack diagnostic review — 17 October 2026

Source checkpoint: `20b82c98`; build `web-2026.10.16-asset-polish`, schema 16.
Five isolated Chromium cases completed with movement and no page errors. These are 2.4-second
keyboard-driven weapon labs on the published local bundle, with sound disabled and DPR 1.
They are not earned campaign runs, dense-combat acceptance, or hardware/controller/audio evidence.

Reviewed the retained 16 October baseline/A/B/kit, map and standard stress captures before capture.
The kit retains its broad dark grid. The map capture shows preview focus and route shapes but
does not demonstrate every node type/state or player comprehension. Neither is newly accepted.

| Capture | Equipped weapons | Display |
|---|---:|---|
| `marine-single.png` | 1 | 1920×1080 |
| `medic-three.png` | 3 | 1920×1080 |
| `marine-four.png` | 4 | 1920×1080 |
| `assault-four.png` | 4 | 1920×1080 |
| `marine-four-4k.png` | 4 | 3840×2160 |

Each JSON records the exact route, identities, movement positions and errors. The selected classes
fit the hero's base rack: Medic light/light/all; Marine light/medium/heavy/all;
Assault medium/medium/heavy/all. Explicit Assault review URLs require `art=c3`; the final capture
uses it. A preliminary fallback-art capture was replaced, not classified as a runtime defect.

Source trace: `hero/{marine,medic,assault,scout,tactician}.ts` defines base racks; `CombatSimulation.ts`
constructs inventory and adds earned `weaponSlotBonus`; `WeaponRingLayout.ts` places bodies;
`PrototypeScene.syncWeapons` applies position, aim and front/back depth. The same layout function
also determines projectile origins. A spacing change could change mechanics and requires care.

Visual finding: three/four-weapon samples leave the head and central body identifiable. Large
weapons cluster beside the Marine and cross the Assault's lower silhouette. This is a review risk,
not sufficient evidence of unreadable play or unavoidable damage. Twelve identical rifles in the
old stress route exaggerate base-rack density; expedition bonus slots mean higher counts cannot
be dismissed as impossible. No weapon spacing, visibility, scale or mechanics changed.

Next evidence: use earned mixed racks in Runs 1–5, including a bonus-slot expedition if obtained.
Record facing, weapon IDs, pose, hostile tell hidden (if any), full-frame capture and motion clip.
Only a named failed combination should trigger an attachment/layering repair. LB-04 remains open:
these samples do not inspect every facing, idle, dodge and hit frame for all three heroes.

Reproduce from the website root (overwrites only this diagnostic's outputs):

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.playwright-browsers'
node play/last-bastion/playtest-evidence/2026-10-17-loadout-review/capture-loadouts.mjs
```

An optional final argument selects one case, for example `assault-four`.
