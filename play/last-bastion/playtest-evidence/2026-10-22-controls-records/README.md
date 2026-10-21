# Controls and records evidence — 22 October 2026

Local identity `web-2026.10.22-controls-records`, based on `5974c948` plus scoped implementation.
These are local checks, not publication, desktop-executable or real AT/device acceptance.

## Captures and reproduction

- `controls-{minimum,4k}.png`: keyboard bindings at 960×540 / 3840×2160, DPR 1.
- `controller-minimum.png`: native controller selection and fixed-stick/unavailable rows.
- `capture-{minimum,4k,letterbox}.png`: final keyboard capture dialog; letterbox is 1280×800
  CSS at DPR 2. Background Back is now dimmed along with all other inert controls.
- `controller-capture-minimum.png`: controller capture instructions and native Cancel.
- `records-empty-minimum.png`, `records-populated-{minimum,4k}.png`: semantic career/history,
  legacy date and expedition threat progress. History is seeded from a real normalized demo
  summary in disposable saves, not an earned playtest.
- `capture-back-before.png`: implementation-stage layering problem, corrected in final captures.
- `capture-results.json`: exact viewport/DPR, UTC timestamps, semantic trees and page errors (none).
- `capture-ownership-before.json`: replay of compiled baseline `5974c948` demonstrating keyboard
  capture → pad B and controller capture → keyboard Backspace both wrongly navigating to Settings.

Run `capture.mjs` or `baseline-capture.mjs` from the website root with
`PLAYWRIGHT_BROWSERS_PATH` set to its `.playwright-browsers`. They use local ports 44277/44276
and shut down their own servers. The baseline utility serves Git bytes without altering source
or current compiled output. All screenshots were inspected for layout, panel clearance, modal
layering, text wrapping and minimum/4K presentation.

## Check commands and limitations

`verification.json` / `verification.txt`: final **PASS, 145.4 seconds**; 1,783 unit tests in
312 files, 50 browser cases, 31 desktop-host tests and all required static/output/offline lanes.
Report source is `5974c948` plus dirty implementation. `verification-timeout.json` /
`verification-timeout.txt` retain the earlier failed attempt; they are not the final result.
`portfolio-verification.txt`: complete root run, **19/20 guards pass**; the Expo dependency guard
reports patch drift in 12 unrelated apps. Shared-asset delivery and all other guards pass. The
report includes exact apps/versions; no unrelated app dependency changes were made here.

```powershell
# Website root: full game lanes, including 50 browser cases.
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-last-bastion.ps1 -Json play/last-bastion/.qa-runtime/controls-records-complete-verification.json
# Parent workspace root: complete portfolio guard set.
node scripts/check-all.js
```

An earlier full run passed before the final visual correction. The first post-correction run
stopped on the unchanged navigation test's five-second timeout (5.175 seconds); later lanes were
NOT RUN. An isolated rerun passed all five navigation tests without changing thresholds. A
separate sandbox attempt could not initialize its temporary transform cache and ran no tests.
The final full run passed without changing navigation code or thresholds; that final report
must be read independently. The earlier pre-correction pass does not substitute for it.

Initial targeted records setup also assumed a fresh profile already had a persisted save.
Corrected the disposable fixture to persist an actual setting first; the records case then passed.
The final tests include the composed-pixel modal correction and all new binding/records cases.
The later full run caught a 30-second timeout in the old help DPR-2 matrix: 3840×2160 CSS at
DPR 2 requests 7680×4320 physical output. `verification-8k-timeout.json` / `.txt` retain that
failure. The corrected help/controls/records matrix checks up to physical 4K at DPR 1 and 2,
including 3840 CSS at DPR 1 and 1920 CSS at DPR 2, without weakening assertions or timeouts.
`physical-4k.txt` records all three affected matrix cases passing in 26.1 seconds.
`held-enter-before.txt` / `held-enter-after.txt` retain a failing/passing targeted test: held
Enter repeats originally assigned Enter after opening capture. The fresh-key-down guard keeps
capture open for repeats and still accepts deliberate Enter, Tab and Space bindings.

Headless Chromium and semantic-tree exposure do not establish screen-reader announcement quality,
physical-controller behavior, audio, sustained gameplay, hardware performance or Steam acceptance.
See [implementation and human handoff](../../archive/CONTROLS-RECORDS-IMPLEMENTATION-2026-10-22.md).
