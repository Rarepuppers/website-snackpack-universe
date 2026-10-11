# Last Bastion — current plan

**Updated:** 11 October 2026

**Status:** local browser work is built and verified. Deployment, live measurement,
creator-observed play, visible desktop acceptance, and Steam client acceptance remain open.

This replaces the execution order in the [9 October audit](archive/implementation-plan-2026-10-09.md).
Keep the content freeze until the evidence below is collected. Use `dev/src/game/` and the
published `game-assets/` as the source of truth for what ships.

## 1. Deploy and confirm the browser release

- **Ready locally:** Quick and Daily Drop, phone notice, Lab gating, shell/HUD polish,
  Batch K perk tiles, game overview, social art, GoatCounter site code `snackpack`,
  rebuilt `game-assets/`, privacy disclosure, and service-worker release bump are committed.
- **Verification:** `npm run verify:last-bastion` passed all required automated lanes after
  telemetry activation; `node scripts/check-site.mjs` checked 272 pages clean. The Windows
  unpacked package also passed `npm run smoke:package:win` on 11 October 2026.
- **Next:** Mark's earlier instruction is **do not push unless asked**. When Mark requests
  deployment, push the website repo, wait for the single CI run, confirm the live game and
  privacy page serve this release, and test a warm-cache offline upgrade.
- **Analytics acceptance:** in a clean real-browser session, confirm `opened`, `run-started`,
  `wave-1`, and `run-ended` appear in the `snackpack` GoatCounter dashboard. Confirm
  `wave-5` after reaching it and `returning` on a later local day. Record the first live
  measurement date. Confirm GoatCounter's optional individual-pageview collection is disabled.
  [Provider privacy behavior](https://www.goatcounter.com/help/privacy) should be checked
  against the account settings before deployment.

## 2. Creator-observed play and presentation

- Complete Runs 1–5 in the [local playtest matrix](local-playtest-plan-2026-08-21.md).
  Record completion, damage source, comprehension, input, frame pacing, visual and audio
  findings immediately after each run. The 23 August shakedown is Run 0 and does not count.
- Close or explicitly accept remaining LB-04 helmet registration and LB-07 map iconography
  findings from the [presentation register](presentation-defect-plan-2026-08-23.md), with
  full-context evidence at 960×540, 1920×1080, and 3840×2160. Confirm the five-run matrix
  on keyboard/mouse and gamepad before claiming the slice is fair or finished.
- Fix repeated comprehension, fairness, input, or registration failures; rerun the exact
  failed hero/tier/input combination. Do not expand Threat Tiers 3–11 before these gates pass.

## 3. Desktop and Steam acceptance

- The rebuilt Electron 43.4.0 package passes the hidden renderer smoke. Run
  `desktop/release/win-unpacked/LastBastion.exe` visibly to check title, input,
  windowed/borderless transitions, monitor selection, pause, focus/resume, audio, and combat.
- Repeat with Steam closed for offline boot and save recovery. Repeat from Steam once an
  App ID and partner access are assigned; validate achievements, cloud save, controller
  mapping, and Steam-down fallback. Packaging success is not a Steam sign-off.
- Record GPU, driver, display and frame pacing on real Full HD, 4K, ultrawide, and
  Deck-shaped hardware before tuning scale or presentation from headless timings.

## 4. Read data before expanding scope

- After two weeks of live measurement, compare open → start → wave 1 → wave 5 → end and
  next-day return. Separate a traffic problem from an onboarding or balance problem.
- Review the five observed runs alongside the funnel. Only then decide whether touch
  controls, new content, additional tiers, or further art earn production time.
- The archived [content-debt plan](archive/last-bastion-content-debt-plan.md) still names
  Affinity HUD, codex gaps, non-boolean settings machinery, and legacy modifier cleanup.
  The archived [item-UI plan](archive/item-ui-asset-production-plan.md) still proposes
  VFX renewal and transformation identity art. Keep them conditional on observed failures;
  do not treat historical batch numbers or counts as current acceptance.

## Working rules

- Commit in the **website** repo; stage only Last Bastion paths. Do not modify or remove
  retained `art/production-tests/` masters.
- After a meaningful runtime change, build in `dev/`, commit generated `game-assets/`, bump
  `LAST_BASTION_RELEASE` in repo-root `sw.js`, and run `npm run verify:last-bastion`.
- Keep manual gates explicit. Automated tests and screenshots do not substitute for observed
  gameplay, visible packaged-window behavior, audio listening, or Steam client acceptance.
