# QA readiness evidence — 17 October 2026

Prepared build `web-2026.10.17-qa-readiness`, code commits `4675b9ab` / `f7506ea2`.
The verifier ran against those code changes before commit, so its JSON records `6d4ede7a` plus
a dirty working tree. No Last Bastion runtime change followed that passing verification.

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

## Browser publication evidence — 17 October

- `live-release-warm.json`: isolated live browser profile on the prior asset-polish release.
- `live-release-verify.json`: QA-readiness identity/cache and fixed-theme/seed offline reload,
  with no page errors. The intermediate online retry had already upgraded the cache before the
  final verification, so `cacheKeysBefore` in this file is already QA-readiness. Taken together,
  the records establish the profile's old/new identity; they do not claim one uninterrupted probe.
- `live-privacy-check.json`: live `/privacy/last-bastion/` returned HTTP 200 and contains browser-storage/GoatCounter disclosure.
  Other sessions' uncommitted privacy/About/social changes were excluded from publication.

These probes blocked analytics and do not verify dashboard settings, event receipt or a
measurement start date. Production desktop packaging and all human/hardware/Steam gates remain open.

- `publication-ci.json` / `publication-pages.json`: successful GitHub website CI and Pages
  deployment for `31139871`. CI passed 154 arcade checks, 31 Last Bastion browser journeys,
  1,781 game tests, desktop-host tests, content/boundary/output audits and site integrity.
  Responsive Options tests and 25 reviewed screenshot baselines now match the intended layout;
  the unrelated random-win wording regression also has deterministic legal dice inputs.

`publication-portfolio-verification.txt`: the completed final host run of
`node scripts/check-all.js` passed all 19 guards. An earlier sandbox rename restriction and
transient seven missing Vol 2 scenes during another session's migration are superseded by this
result. No changes to that session's files were made by this work.
