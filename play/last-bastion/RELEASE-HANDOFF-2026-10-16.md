# Last Bastion release handoff — 16 October 2026

**Prepared build:** `web-2026.10.16-asset-polish`, implementation `17ee207c`.
**State:** local source and published web output verified; not pushed, not deployed, not desktop-packaged.
No further unconditional Patch A implementation items remain. New floors remain opt-in review art.

## Completed evidence

- Full game verifier: 1,777 unit tests / 311 files, 30 browser checks, 28 desktop-host tests,
  smoke/offline and 25 matching published outputs. Subsequent saved-preference regression passed
  with its 51-test targeted suite; the unit suite now contains one additional test.
- All 19 portfolio guards passed on the implementation patch.
- 227-definition frame/alpha audit; optimized derivatives with retained masters and provenance.
- Four additional dense browser checks passed across all palettes at 1080p/4K, with HUD/radar
  scaling and real affinity inspection. See `playtest-evidence/2026-10-16-polish-review/README.md`.

## Remaining ownership and order

1. **Observed presentation/play:** Mark or a human tester completes Runs 1–5 in
   `local-playtest-plan-2026-08-21.md`. Use a real controller and listen to audio. Review Marine,
   Medic and Assault motion, map node states, dense loadouts and the optional floor kit. Close or
   explicitly accept LB-04/LB-07 with evidence. Preserve existing player saves.
2. **Desktop packaging:** hand the build-ready checkout to Claude, the assigned production-build
   owner. Read the root `docs/RELEASING.md` before building. Existing desktop commands below are
   recorded for the build owner, not executed by this work. Check current script/config first.
3. **Hardware/Steam:** test the fresh packaged executable on actual target displays/GPUs, record
   Windows scaling and frame pacing, and verify Steam integration when App ID/partner access exists.
4. **Deployment:** requires an explicit push/deploy request under the standing no-push instruction.
   Review the full nested-repo commit range before pushing: other sessions have unrelated changes.
   After CI, verify served build identity, warm-cache offline upgrade and analytics events.

Build-owner commands from `play/last-bastion/desktop`:

```powershell
npm run package:win
npm run smoke:package:win
```

These commands are an existing-script handoff, not proof of a fresh package. Physical monitor,
controller, audio and Steam checks cannot be replaced by host unit tests or browser screenshots.

## Acceptance decisions still open

- Floor adoption: pilot A/B and `floorpilot=kit` on the standard Bastion review route; production
  default remains unchanged. Hardware/motion acceptance precedes default adoption.
- Native 4K60: target only, no support/performance claim until measured on named hardware.
- Practice and encounter variants: later Patch B, contingent on observed play. No new heroes,
  regions, multiplayer, leaderboards or higher threat tiers are implied by this handoff.
