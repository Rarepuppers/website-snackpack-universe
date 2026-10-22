# Audio controls implementation evidence — 22 October 2026

Prepared build `web-2026.10.22-audio-controls`, based on `328cc8d3` with scoped dirty implementation.
Not an exact-clean-HEAD report. Existing About/privacy/social and unrelated changes are excluded.
See [completed scope](../../archive/AUDIO-CONTROLS-IMPLEMENTATION-2026-10-22.md).

- `build.txt`: local web compilation; generated output committed with source. No executable packaging.
- `unit-targeted.txt`: seven new production audio tests pass; TypeScript also passed during development.
- `browser-complete.txt`: targeted real-browser case passes in 3.3s, covering output automation through
  combat settings and source stops through encounter retry. Real Web Audio is instrumented, not replaced.
- `verification.json` / `.txt`: full final game PASS in 130.8s; 1,790 unit / 313 files, 51 browser,
  31 desktop-host tests, image/content/text/boundary/source-output/HTTP/offline/site checks.
- `portfolio.txt`: completed full root portfolio run, **all 20 guards PASS**, confirmed during
  23 October finalization; no dependency edits by this task. The build identity remains dated 22 October.

Earlier `browser-*.txt` attempts retain diagnostic failures. Input needed an explicit pause action and
80ms key presses for the frame-polled game. Reading a paused, inactive graph's gain value also stayed
stale despite correct zero/.25 ramp schedules. Final checks inspect actual scheduled output automation,
not inferred audible loudness. The separate engine AudioContext is excluded from combat output checks.
No thresholds were increased, and no production input behavior was altered for these tests.

No human listening, physical controller, actual AT, observed Runs 1–5, fresh executable, hardware,
Steam or dashboard acceptance. No new visual layout/art, so the previous audit images remain dated
visual context; no new image acceptance is claimed. Automatic approval review hit usage limits on
some attempted host reruns; those commands did not execute until subsequent authorized retries.

Reproduce from the nested website root with `npm run verify:last-bastion`; from the workspace root
run `node scripts/check-all.js`. The targeted unit file is `dev/src/game/audio/WebAudioSynth.test.ts`.
Browser case is in `tests/visual/last-bastion-functional.spec.mjs`; use the repository Playwright
browser path and existing runner. The old audit's bug-demonstration test describes the previous
implementation and is not a current acceptance test.
