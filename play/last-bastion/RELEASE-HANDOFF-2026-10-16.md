# Last Bastion release handoff — 16 October 2026

**Latest prepared local build (27 October):** `web-2026.10.27-shop-polish`, schema 17,
simulation compatibility 3. G4 verification is recorded in
[shop-polish evidence](playtest-evidence/2026-10-27-shop-polish/README.md). Not pushed or packaged.
Older prepared-build entries below are historical. Physical-device and Steam gates remain open.


**Latest prepared local build (27 October):** `web-2026.10.27-build-effects`, schema 17,
simulation compatibility 3. G3 passes full verification and all 23 portfolio guards; see
[build-effect evidence](playtest-evidence/2026-10-27-build-effects/README.md). Not pushed or packaged.
Older prepared-build entries below are historical; real AT/hardware/Steam gates remain open.


**Latest prepared local build (27 October):** `web-2026.10.27-transformation-offers`, schema 17,
simulation compatibility 3. G2 passes full verification and 23 portfolio guards; see
[offer evidence](playtest-evidence/2026-10-27-transformation-offers/README.md). Not pushed or packaged.
Earlier prepared-build entries below are historical. Human/hardware/Steam gates remain open.


**Current prepared local build (27 October):** `web-2026.10.27-stash-persistence`, schema 17,
simulation compatibility 3. G1 passes full game verification and all 23 portfolio guards;
[stash evidence](playtest-evidence/2026-10-27-stash-persistence/README.md). Not pushed or packaged.
Older executables do not support schema 17; retain a pre-upgrade backup for rollback testing.
Human/hardware/Steam acceptance stays open; Claude owns specifically assigned packaging.
The prepared-build entries below are historical.


**Current prepared local build (24 October review):** `web-2026.10.25-decision-labels`, adding minimum-size
shop layout, keyboard corrections, pagination and measured shop-label centring. See [current evidence](playtest-evidence/2026-10-25-decision-coverage/README.md)
and CURRENT-PLAN. Full game/portfolio checks pass; no human/device/Steam acceptance or publication.
Claude remains the separately assigned packaging owner. Prepared-build notes below are historical.

**Prepared local build — audio continuation:** `web-2026.10.22-audio-controls`. AUDIO-02 is
implemented: active gain/mute, rotary-tail cancellation and scene/retry cleanup. Use
[completed scope](archive/AUDIO-CONTROLS-IMPLEMENTATION-2026-10-22.md) and
[current evidence](playtest-evidence/2026-10-22-audio-controls/README.md). Listening and all
physical/Steam/release gates remain open; Claude owns separately assigned packaging.
The audit and older prepared-build sections below are historical.

**22 October audit:** see [CURRENT-PLAN](CURRENT-PLAN.md) and the [fresh audit](archive/AUDIT-REVIEW-2026-10-22.md).
Runtime checkpoint `4238b130` passes all game verification lanes; the new portfolio run passes 20/20.
Active-voice volume/mute persistence is reproduced (AUDIO-02) and needs correction/acceptance before
audio release sign-off. No runtime fix, package, deployment or human/device acceptance is supplied
by this documentation audit. Older results below remain dated history.

**Prepared local build (22 October):** `web-2026.10.22-controls-records`, adding native control
rebinding/records and capture isolation fixes on top of `5974c948`. Use the
[completed record](archive/CONTROLS-RECORDS-IMPLEMENTATION-2026-10-22.md) and
[current evidence](playtest-evidence/2026-10-22-controls-records/README.md). Claude owns the next
assigned package; no executable/publication or real AT/controller acceptance is supplied here.

**Earlier local build (22 October):** `web-2026.10.22-help-accessibility`, adding native
How to Play instructions/navigation and diagram descriptions to the 21 October implementation.
See the [completed scope](archive/HELP-ACCESSIBILITY-IMPLEMENTATION-2026-10-22.md) and
[earlier evidence](playtest-evidence/2026-10-22-help-accessibility/README.md). Use the newer
controls/records checkpoint above when packaging; the evidence below remains historical.
No new executable, publication or human/AT acceptance is supplied by this patch.

**Earlier local build (21 October):** `web-2026.10.21-menu-review`, implementation `637f6ec8` + `6472ceeb`;
package provenance tooling remains `f7506ea2`. New source/output is not pushed or packaged.
Gallery defects and the semantic title/menu/settings slice are implemented. Full verifier passes:
1,783 unit / 41 browser / 31 desktop-host, smoke/offline and 25 matching outputs. This includes
native import/gamepad and the corrected 4K composition regression. Human/assistive-technology
acceptance remains open.

**Earlier published build:** `web-2026.10.17-qa-readiness`, runtime `4675b9ab`.
**State (updated 17 October):** browser release pushed and served; live identity, privacy route and
warmed offline boot verified. Website CI and Pages passed on `31139871`. Desktop is not packaged.
No further unconditional Patch A implementation items remain. New floors remain opt-in review art.

Earlier 17 October continuation: QA-01 local session reports and QA-02 package provenance are complete.
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
4. **Browser release:** publication was explicitly authorized on 17 October; the reviewed range
   is pushed and served. Live identity/privacy and warmed offline boot are verified. Dashboard
   owner still verifies event receipt, individual-pageview settings and next-local-day return;
   measurement start date remains unset. Passing CI/Pages evidence is linked from CURRENT-PLAN.

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
