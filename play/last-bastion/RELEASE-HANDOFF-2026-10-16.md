# Last Bastion release handoff — 16 October 2026

**Prepared build:** `web-2026.10.17-qa-readiness`, runtime `4675b9ab`, package tooling `f7506ea2`.
**State:** local source and published web output verified; not pushed, not deployed, not desktop-packaged.
No further unconditional Patch A implementation items remain. New floors remain opt-in review art.

Latest continuation: QA-01 local session reports and QA-02 package provenance are complete.
Full game verifier passed in 82.4 seconds: 1,781 unit / 31 browser / 31 desktop-host tests,
smoke/offline and 25 matching published outputs. Use [QA readiness](QA-READINESS.md) for commands.
Claude's next Windows packaging run now writes/checks a package manifest; return it with the
separate renderer smoke log. No executable has been refreshed by these host tests.

Earlier 17 October preparation, before QA tooling: unchanged asset-polish runtime/output verified at
`20b82c98` (1,778 unit / 30 browser / 28 desktop-host tests). The
[acceptance worksheet](ACCEPTANCE-WORKSHEET-2026-10-17.md) gives the exact package/evidence return
contract for the build owner and human testers. No fresh executable, deployment, Steam acceptance
or live measurement start date was produced. The original evidence below remains historical.

## Earlier asset-polish evidence (historical)

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
