# Native How to Play evidence — 22 October 2026

Prepared local identity `web-2026.10.22-help-accessibility`. Verification ran at `a58f17ff` plus
the scoped dirty help implementation. This does not claim publication or a fresh desktop package.

- `minimum-page-{1,2,3,4}.png`: all four native help pages at 960×540, DPR 1.
- `letterbox-page-{1,4}.png`: 1280×800 CSS viewport, DPR 2; captures are 2560×1600.
- `4k-page-{1,4}.png`: 3840×2160, DPR 1. Existing diagrams and chrome, no new raster art.
- `capture-results.json`: exact sizes/DPR, UTC timestamp, accessibility-tree snapshots and page
  errors (none recorded). `capture.mjs` reproduces captures from the website root, with
  `PLAYWRIGHT_BROWSERS_PATH` set to the repository's `.playwright-browsers`; local port 44274.
- `verification.json` and `verification.txt`: full required game lanes pass in 129.6 seconds;
  1,783 unit / 312 files, 45 browser cases, 31 desktop-host tests, smoke/offline and output integrity.
- `portfolio-verification.txt`: fresh root `node scripts/check-all.js`, all **20** discovered
  guards pass, including shared-asset delivery. This summary covers the complete run.

Commands used from website root:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH="$PWD\.playwright-browsers"
npx playwright test --config playwright.last-bastion.config.mjs --grep 'native help|help gamepad'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-last-bastion.ps1 -Json play/last-bastion/.qa-runtime/help-accessibility-verification.json
```

The first targeted run exposed a test setup assumption: a fresh profile had no persisted save
until an actual setting was changed. Corrected the fixture to persist through the native setting;
all four targeted cases then passed, followed by the full 45-case suite. This was not a game defect.

Captures were visually inspected for text/panel fit, control placement, preserved diagrams,
letterboxing and 4K composition. Accessibility-tree exposure and simulated pad inputs do not
establish actual screen-reader announcement quality or physical-controller acceptance. No
observed gameplay, audio, hardware, Steam or live analytics gate is closed by this evidence.

See [completed implementation](../../archive/HELP-ACCESSIBILITY-IMPLEMENTATION-2026-10-22.md).
