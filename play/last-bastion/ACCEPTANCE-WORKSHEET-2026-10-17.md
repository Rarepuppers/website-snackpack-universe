# Remaining acceptance worksheet — 17 October 2026

Use with CURRENT-PLAN and the five-run matrix. Human and physical-device results below remain **NOT RUN**.
Mark or an assigned human tester owns observed play; Claude owns production packaging.
This document requests no deployment, scheduled monitoring, Steam upload or cross-chat message.

Current prepared local build is `web-2026.10.23-shop-fit`; it is not published or packaged.
The earlier browser publication below refers to the 17 October QA-readiness build. Use the
[QA readiness instructions](QA-READINESS.md) for opt-in session export and package provenance.
Reports are evidence aids; their presence does not mark any NOT RUN row as passed.

24 October shop correction: at 960×540 and your normal display, read every offered row,
open management, navigate one step at a time and confirm Back with Enter and a physical pad.
Exercise earned purchases, reroll, locks, bans and sales; verify focus, stock and balances.
Record actual readability and transaction outcomes. Automated diagnostic coverage is separate.

23 October event confirmation: hold Select through an event choice and read its result; release
then press Enter/Space or pad A to continue, or use the visible pointer button. Other buttons and
covered cards must not dismiss/change the result. Verify normal event travel and a real ambush
with a disposable save. Automated demo-route coverage does not establish those human results.

22 October audit adds AUDIO-02: an active production sample retains gain after master zero/mute.
The authorized correction is now implemented locally. Specifically listen while muting active rotary/damage/reward cues,
then unmute, pause/blur and restart; record clicks, stale tails and any missing warning. The audit's
instrumented production-class reproduction is not ear acceptance. See CURRENT-PLAN for queue state.

## Observed play: Mark / human tester

Start `npm run dev -- --host 127.0.0.1` in `dev/`, open
`http://127.0.0.1:5173/play/last-bastion/`, and record build identity from Copy Run Details.
Use a separate browser profile or export the existing save before testing. Earn locked tiers/heroes
normally. Diagnostic URLs are for reproducing findings, never substitutes for the five runs.

| Run | Required combination | Result / evidence folder |
|---|---|---|
| 1 | Marine/Medic, Threat 0, keyboard/mouse, 960×540 | NOT RUN |
| 2 | Same hero, Threat 1, physical controller, 1920×1080 | NOT RUN |
| 3 | Same hero, Threat 2, keyboard/mouse, 1280×800 | NOT RUN |
| 4 | Unlocked alternate, highest unlocked threat, controller, 1440p/ultrawide | NOT RUN |
| 5 | Any unlocked hero, highest unlocked threat, weaker machine, complete run | NOT RUN |

For each, copy the existing plan's observation table and add: tester/date; build/commit; browser or
package; GPU/driver; physical display + CSS viewport/backing buffer/DPR/Windows scaling; controller
model and remaps; sound output; saved Career/Armory state; exact weapon IDs/bonus slots; audio and
pause/focus/resume observations; p95/p99/hitches and measurement method. Record confusion/fairness
and the first hidden or unexplained damage source, then classify fix-now / monitor / learning curve.
Store full-frame screenshots and motion clips in `playtest-evidence/YYYY-MM-DD-run-N/`.

Presentation decisions require named evidence and accept/correct/defer with tester/date:

- LB-04: Marine, Medic and Assault; all facings through idle/move/dodge/hit at 960×540, 1080p, 4K.
  Assault diagnostic routes need `hero=assault&art=c3`. Retain sources and identify frame/anchor
  before authorizing a repaint. New normal-rack samples are linked from CURRENT-PLAN.
- LB-07: identify all nine node meanings; preview/focus, armed READY, cleared, closed and route
  direction. Read title/menu/dossier/map/debrief fully at 4K. Confirm through actual map travel.
- Floor: same seed 61061 and standard theme; baseline (omit floorpilot), `floorpilot=a`, `b`, `kit`.
  Compare continuous/dense play at 1080p/4K, grayscale and colour-vision modes. Record seams,
  pickups, hostile tells and implied collision. Keep current default until accepted.
- Loadout: start from the retained normal-rack diagnostics; inspect earned mixed/bonus-slot racks
  during dense play. Identify an actually hidden tell/body pose before changing attachments.

Do not count Runs 1–5 until touched S1/S2 presentation issues are closed or explicitly accepted.
Use the original plan's thresholds; a screenshot or simulated pad input cannot sign this table.

## Semantic menu acceptance: human tester

Title, menu, settings, How to Play, rebinding and records have native semantics locally. Verify with a real screen
reader: heading and control names, selected settings group, checkbox/select/range values,
Tab/Shift+Tab order, one Enter/Space activation, Escape/back focus, save-import cancellation and
privacy/export actions. For How to Play, check all four page headings/instructions, diagram
descriptions, page-change announcements, remapped key/button labels, Previous boundary state,
Next/Return to menu, Back, focus retention and return to the originating menu card. Repeat with
physical controller, resize/DPR and return from other scenes.
For rebinding, verify named action/current value and device state, fixed-stick rows, capture dialog
announcements, invalid-key feedback, Escape/native Cancel, duplicate swaps, reset and focus return.
Keyboard capture keeps Tab/Enter/Space bindable; use Escape or native Cancel to cancel. During
capture, holding the opener must not assign it; release and press a fresh key to bind. During
controller capture, keyboard Tab reaches Cancel; gamepad B is a binding candidate, then resumes
physical menu Back after capture ends. Neither device may navigate menus during the other's capture.
For records, verify career labels/values, empty and legacy history, outcome/hero/progress/threat/date,
Newer/Older boundaries, list reading/scrolling, Back/return focus and unchanged save/progression.
Armory, hero/threat select, LAB, map, debrief and combat remain separate canvas consumers.
Do not sign off whole-game screen-reader support from this limited slice. Store observations and
failures by screen/control under a dated evidence folder; preserve the tester's real save.

## Desktop package: Claude, then hardware tester

Use the current prepared source in [CURRENT-PLAN](CURRENT-PLAN.md) and
[release handoff](RELEASE-HANDOFF-2026-10-16.md), including the 22 October audio-controls patch,
controls/records patch
and How to Play patch
on top of `637f6ec8` + `6472ceeb`; the archived
17 October checkpoint is older. Read root `docs/RELEASING.md` and inspect current changes before
packaging. From `desktop/`:

```powershell
npm run package:win
npm run smoke:package:win
```

Return: source commit, build identity, package time/path, executable SHA-256 and complete smoke log.
Windows packaging now writes `qa-package-manifest.json` and checks its hashes automatically;
return that manifest too. It records actual packaged/staged bytes and relevant dirty inputs.
Packaging rebuilds web output and stages resources; desktop host tests alone do not refresh the exe.
No packaging command was executed by this continuation.

On that exact package, record pass/fail/evidence for visible launch, pause, focus loss/resume,
audio, physical-controller remapping/hot-plug, windowed/borderless, monitor changes, offline boot
with Steam closed and save recovery using a disposable profile. Test Full HD/4K at Windows
100/125/150/200%, ultrawide and Deck-shaped output. Record GPU/driver, 15-minute dense pacing,
p95/p99, hitches and memory. Agree a numeric acceptance threshold after named hardware baselines;
native 4K60 remains a target.

## Steam and release: access/authorization required

Steam owner supplies real App/Depot IDs, partner access and exported controller configurations.
Follow `steam-input/README.md`; validate achievements, cloud conflict/recovery, controller mapping,
overlay and Steam-down fallback with the actual client. No App 480 substitute or fabricated VDFs.

Browser publication was authorized and pushed on 17 October. Served QA-readiness identity,
`/privacy/last-bastion/` and warmed-cache offline boot are verified; final CI is tracked in
CURRENT-PLAN. Dashboard owner still verifies optional individual pageviews disabled and
receipt of opened/start/wave-1/wave-5/end/next-local-day return. Record the actual measurement start
date; it is currently unset. Review two weeks of data plus observed runs before conditional Patch B.
