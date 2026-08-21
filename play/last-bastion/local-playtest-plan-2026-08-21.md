# Last Bastion — local playtest gate

**Created:** 21 August 2026  
**Purpose:** close the five-observed-run gate before Threat Tiers 3–11, dailies, leaderboards, or more permanent progression are expanded.

## Readiness baseline

- `npm run verify` passes: image audit, combat-boundary audit, generated content inventory, typecheck, 1,572 tests across 279 files, production build, HTTP smoke test, and offline boot.
- Desktop `npm run typecheck` and `npm test` pass: 28 tests across save recovery, bridge validation, display policy, packaging, Steam Input, Steamworks fallback, and the desktop protocol.
- Windows unpacked packaging completes on Electron 43.4.0. Packaged renderer acceptance remains open:
  the Codex managed host exits in Electron's pre-app `IsSandboxedProcess` path with `0xC0000005`,
  including on Electron 42.9.0 and 43.3.0. Run `npm run smoke:package:win` and the visible executable
  from an ordinary local PowerShell session before attributing this host-policy crash to game code.
- Live browser boot reaches Title and Main Menu at the canonical 960×540 logical render size without console errors or warnings. Full HD uses an exact 1920×1080 backing buffer; the 4K display contract remains an exact 4× presentation. The title now has a dedicated text-free 3840×2160 master rather than enlarging and cropping the 3:2 expedition map plate.
- This is ready for **local gameplay and balance testing**. It is not yet a paid-Steam-release candidate: packaged-window/live-Steam acceptance, creator-led visual/audio review, and the observed-run gate remain open.

## Start

```powershell
cd C:\snackpack-universe\website-snackpack-universe\play\last-bastion\dev
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/play/last-bastion/`.

Before the first observed run, use a clean browser profile or record the existing Career/Armory state. Do not clear a real save merely to make a test tidy.

## Five-run matrix

| Run | Hero | Threat | Input | Display | Primary question |
|---|---|---:|---|---|---|
| 1 | Marine or Medic | 0 | Keyboard/mouse | 960×540 | Does onboarding teach movement, evade, damage, and wave clear without blocking play? |
| 2 | Same hero | 1 | Gamepad | 1920×1080 | Is the first elite patrol understood, readable, and worth its reward? |
| 3 | Same hero | 2 | Keyboard/mouse | 1280×800 | Are two distinct patrols plus the faster pulse train fair on a 16:10/Deck-shaped viewport? |
| 4 | Any unlocked alternate hero | highest unlocked | Gamepad | 2560×1440 or ultrawide | Do hero identity, rack constraints, objective verbs, and status cues remain legible? |
| 5 | Any unlocked hero | highest unlocked | weaker available machine | fullscreen/native host if available | Does a complete run hold frame pacing and recover cleanly from pause, focus loss, and resume? |

If Threat 1 or 2 is still locked, earn it normally; do not mutate the save. Extra deterministic review routes may diagnose a finding, but they do not count as observed campaign runs.

## Record after every run

The Records screen now exposes outcome, progress, hero, kills, Command Marks, and either the defeat cause, dominant incoming threat, or strongest weapon. Add the qualitative evidence below immediately after play:

| Field | Observation |
|---|---|
| Completion / node reached | |
| Run duration | |
| Dominant threat or defeat cause | |
| Most confusing moment | |
| First unfair-looking hit | |
| Elite modifier understood without explanation? | Yes / No — why? |
| Objective instruction understood within 5 seconds? | Yes / No — why? |
| Reward choice felt meaningful? | Yes / No — why? |
| Frame hitch, input loss, audio issue, or layout defect | |
| One thing the player wanted to do but could not | |

## Pass thresholds

Do not expand Threat Tiers 3–11 until all of these are true:

- At least 4 of 5 runs reach the intended tier modifier and the player can describe it without being told.
- No repeated unavoidable damage source appears in 2 or more runs without an understood counter.
- No objective fails because its verb, timer, target, or reward is unclear.
- Keyboard/mouse and gamepad both complete a run without an input dead end.
- No critical console error, missing asset, save loss, resume failure, or persistent frame-pacing failure occurs.
- Every confusion note is triaged as fix-now, monitor, or intentional learning curve.

## Immediate implementation order after evidence

1. Fix repeated comprehension or fairness failures from the five runs.
2. Re-run the exact failed tier/hero/input combination.
3. Complete packaged Electron window acceptance and a Steam-down/offline boot.
4. Commission or promote only the art/audio proven missing during play; do not expand decorative prop batches.
5. If the slice passes, define Threat Tiers 3–5 before 6–11, then validate again.

## Asset regeneration and expansion decisions

These are identity/readability tasks, not a reason to pause the five-run gate. Keep stable runtime
IDs, logical sizes, pivots, frame order, and code-rendered labels when replacing art.

### High priority — new art required

1. **Weapon identity tiles:** author dedicated 128×128 runtime tiles from retained 512×512-or-larger
   masters for the 24 player-visible weapon identities that currently borrow one of the eight Batch I
   frames. `auxiliary-drone` is an internal supporting identity and does not need a player-facing tile.
   Preserve the existing eight accepted tiles and the standalone Marauder tile unless close-view
   testing finds a concrete defect. Deliver additions in three reviewable eight-tile atlases rather
   than replacing the whole catalogue in one image-generation pass.
2. **Power-up pickup and HUD identities:** author six dedicated, text-free frames for Siege Loader,
   Phase Jacket, Hunter Optics, Last Stand Stimulant, EMP Charge, and Butcher's Serum. They currently
   reuse the four Overcharge/Aegis/Magnet Pulse/Adrenaline reward motifs with colour as the primary
   distinction. Keep Medkit and Uranium-Core Rounds on their existing dedicated presentations.
3. **UI instruction diagrams:** replace the four `[ DIAGRAM ]` placeholders only after each page's
   teaching copy survives the observed-run comprehension review. Diagrams must depict the actual
   remappable inputs and never bake key labels into the bitmap.

### Conditional — regenerate only after a failed review

1. **Six expedition map plates:** review the current 1536×1024 Bastion Logistics, Alien Hive,
   Machine Foundry, Science Wing, Void Approach, and Arctic Relay plates at Full HD and 4K. If a plate
   softens, repeats visibly, or loses route-line contrast, re-author it at **3840×2560 (3:2)** while
   retaining its stable ID and 1536×1024 logical contract. Do not convert these map plates to 16:9;
   the shell deliberately crops the 3:2 plate behind code-owned routes and panels.
2. **Early 64 px environment/effect families:** regenerate only the exact floor, boundary, obstacle,
   pickup, or effect family that fails a 56-enemy density, seam, grayscale, colour-vision, or 4K
   close-view check. Exact integer scaling is not itself a defect and does not justify repainting.
3. **Theme expansion:** do not add another floor theme until the existing six map regions and current
   combat themes demonstrate distinct navigation, hazards, or encounter language. A palette swap
   without a gameplay role is optional polish, not production content.

### Already resolved

- The title no longer enlarges the 1536×1024 map plate. It uses a dedicated text-free 3840×2160
  master and optimized WebP, with all language and controls rendered in code.
- Recent character, enemy, boss, object, terrain, shop, and status families retain source masters at
  sufficient scale. Do not regenerate them without an observed silhouette, extraction, seam, or
  readability failure.
