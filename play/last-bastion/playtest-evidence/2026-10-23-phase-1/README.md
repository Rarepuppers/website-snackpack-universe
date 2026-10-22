# Phase 1 acceptance start — 23 October 2026

Supporting evidence only; [CURRENT-PLAN](../../CURRENT-PLAN.md) owns the sole active queue.
Mark approved the phased recommendations and beginning Phase 1, then stated that no human
testing is available now. No human or physical-device row is closed by this work.

## Provenance

Checkout at start: `3a1073c6`, following audio implementation `a5313291`.
Prepared identity: `web-2026.10.22-audio-controls`, save schema 16, simulation compatibility 3.
The intervening commit changes only `tests/visual/arcade-audio-mute.spec.mjs`.
Existing About/privacy/social and unrelated website edits remain outside this work. The verifier
reports a dirty checkout; its result is not an exact-clean-tree or published/package claim.

## Executable work

Run the existing full verifier once at this checkpoint:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-last-bastion.ps1 -Json play/last-bastion/playtest-evidence/2026-10-23-phase-1/verification.json
```

`verification.txt` retains console output; `verification.json` records lane outcomes/provenance.
Host execution is needed for the local browser server and temporary test caches previously
blocked by the sandbox. No production executable packaging occurs in this command.

Coverage reviewed against the existing production tests:

| Phase 1 area | Executable evidence | What it cannot establish |
|---|---|---|
| Live sound controls | Production WebAudioSynth tests; real-browser settings automation and retry source-stop regression | Audible clicks, loudness, warning recognition or speaker/headphone quality |
| Observed play | Mode/start/map/combat/debrief routes and production simulation regressions | Runs 1–5, fun, comprehension, fairness or replay motivation |
| Combat readability | TelegraphRules, WorldObjectRuntime, TerrainVisualState and existing real browser floor/inspect routes | Safe-lane perception, dense earned-rack occlusion or floor acceptance in motion |
| Animation/equipment | HeroMotionController and EnemyVisualState mappings; hero gallery/manifest browser checks | Continuous pose registration and equipment attachment acceptance across facings |
| Accessibility/input | Native semantics, focus, settings, help, capture, records and simulated gamepad browser cases | Spoken screen-reader output or physical pad/hot-plug acceptance |
| Save/device reliability | LocalSaveStore; visible read-failure/retry; import cancellation/export; offline/renderer boots; desktop-host tests | Current packaged bytes, hardware pacing, physical display/audio/input, real Steam cloud conflicts |

Do not rerun passing checks merely to fill the time waiting for a tester. No runtime change or
new regression has been demonstrated by this coverage review. Earlier audit captures remain
dated evidence, not fresh visual observations from this session.

## First available human session

1. Use an isolated profile/exported save and record build, commit, tester, display, input and output device.
2. Listen while changing master/SFX and Sound during rotary, damage and reward; restore, retry,
   exit and blur/resume. Record cue/time and clicks, stale tails or lost warnings. Do not assume
   pause silences all short tails: the existing policy allows them to finish.
3. Complete Run 1 exactly as the [worksheet](../../ACCEPTANCE-WORKSHEET-2026-10-17.md) specifies;
   capture first unexplained damage and any failed choice. Diagnostics do not substitute for earned runs.
4. Record accept/correct/defer for the relevant animation/readability issues with motion clips.
5. Return actual AT/controller results when those devices/testers become available.

Claude packages only on specific assignment. Hardware owner tests the exact resulting manifest/hash;
Steam owner supplies real partner/client access. No push, deploy, package, submission, generated
assets, floor-default change or fleet dependency maintenance is authorized by this acceptance start.

## Result

Fresh full verifier **PASS in 122.2 seconds** at `3a1073c6`: 1,790 unit tests / 313 files,
51 browser cases and 31 desktop-host tests; static/content/image/text/boundary checks,
25 published-output matches, HTTP/offline and site JavaScript checks also pass.
No new automated defect reproduced. Build warnings about classic script tags and chunk size
remain visible in the raw log; they are not new measured gameplay/performance failures.
The root portfolio runner was not repeated for these documentation-only changes; its prior
20/20 result remains dated in the 22 October audio-controls evidence, not a fresh Phase 1 result.
Human listening, Runs 1–5, motion/readability, actual AT/controller and hardware/Steam: **NOT RUN**.
