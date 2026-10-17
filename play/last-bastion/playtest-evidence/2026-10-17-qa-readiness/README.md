# QA readiness evidence — 17 October 2026

Prepared build `web-2026.10.17-qa-readiness`, code commits `4675b9ab` / `f7506ea2`.
The verifier ran against those code changes before commit, so its JSON records `6d4ede7a` plus
a dirty working tree. No runtime change followed that passing verification.

- `verification.json`: all required lanes pass in 82.4 seconds: 1,781 unit / 31 browser /
  31 desktop-host tests, smoke/offline and 25 matching published outputs.
- `qa-session.png`: full 1280×720 headless browser capture of the real local QA controls and
  selectable report after pause/resume/stop and an intentionally unavailable download. The
  browser case also checked keyboard activation, actual download, reset, unchanged lab save
  and absent panel without the query parameter. The diagnostic controls/text fit this viewport.
- `portfolio-verification.txt`: fresh `node scripts/check-all.js` passed all 19 guards.

See [operator guide](../../QA-READINESS.md) and
[archived implementation](../../archive/QA-READINESS-IMPLEMENTATION-2026-10-17.md).
This screenshot/report is not a human gameplay run, physical controller/audio test, 15-minute
hardware measurement, fresh desktop executable, Steam integration result or deployment proof.
