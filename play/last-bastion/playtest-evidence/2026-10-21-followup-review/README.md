# Post-implementation review evidence — 21 October 2026

Source checkpoint `7780ba86` with pre-existing unrelated dirty files preserved. Prepared local
game identity `web-2026.10.21-menu-review`. These are local captures, not served-release evidence.

`capture-results.json` records UTC capture time, routes, viewport sizes, runtime observations,
settings control bounds/labels and page errors. All twelve captures recorded no page errors.

- `settings-*.png`: all five native settings groups, 960×540.
- `baseline-1080.png`, `kit-1080.png`: same standard theme and seed 61061, 1920×1080,
  brief simulated movement. Runs are not synchronized to the same simulation frame.
- `dense-cvd-4k.png`: diagnostic 12-weapon rack, deuteranopia, HUD 1.2/radar 1.25,
  Reduced Flash, optional kit, 3840×2160. This is not an earned loadout or human run.
- `map-1080.png`: map preview after brief keyboard input, 1920×1080.
- `gallery-{marine,medic,assault}.png`: explicit hero frame routes, 1920×1080.
  Separate Assault breach samples are intentional; this is a static review surface.

Chromium headless, DPR 1 throughout. Screens were inspected for layout, floor repetition and
hero identity. No actual screen-reader/controller/audio, sustained motion, hardware or balance
acceptance is claimed. Native 4K60 and Windows scaling are not established by these captures.

Fresh browser check from website root:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH="$PWD\.playwright-browsers"
$env:LAST_BASTION_TEST_PORT='44271'
npx playwright test --config playwright.last-bastion.config.mjs
```

Result: **41 passed (1.2m)**, exit 0. Includes offline/recovery, gallery and native-control
regressions. Unit/host/portfolio checks were not rerun for this documentation-only review.
The capture utility is retained as `capture.mjs`; run it from the website root with the same
browser-path environment. It starts and stops a local static server on port 44272.

See [findings and recommendations](../../archive/AUDIT-FOLLOWUP-2026-10-21.md).
