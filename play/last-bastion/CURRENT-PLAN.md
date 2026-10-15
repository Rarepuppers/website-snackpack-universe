# Last Bastion — current plan

**Updated:** 15 October 2026

**Status:** accepted October audit fixes are implemented locally; all required automated verification lanes pass. Deployment, live measurement,
creator-observed play, visible desktop acceptance, and Steam client acceptance remain open.

This replaces the execution order in the [9 October audit](archive/implementation-plan-2026-10-09.md).
Keep the content freeze until the evidence below is collected. Use `dev/src/game/` and the
published `game-assets/` as the source of truth for what ships.

## Accepted October audit implementation

See [audit and implementation details](AUDIT-PLAN-2026-10-14.md). The accepted scope is
recovery, Daily correctness, trustworthy metrics, build/affinity clarity and settings polish.
Content expansion, new art batches and practice mode remain conditional on observed play.

- Implemented: bounded character-art failure with retry/back; startup recovery; long Daily
  streak participation intervals and cloud merge; midnight-safe retry; local-day visit ledger;
  abandonment classification; named and paginated build inventories and affinity explanations;
  grouped settings; consistent deadzone limits; three-mode title copy.
- Additional fixes found during implementation: stashed weapon names were omitted by an
  equipped-only lookup; settings could overlap the footer; smoke readiness requests were unbounded;
  keyboard build navigation advanced twice because a keyboard direction also entered the gamepad path;
  pause/build panels used display dimensions inside an already scaled camera, pushing them offscreen at 1080p/4K.
- Save change is additive to schema 16: missing participation intervals migrate from retained
  Daily results. Historical days already discarded cannot be recovered. Detailed results remain
  bounded to 60 days; participation is stored separately as merged date intervals.
- Measurement: opened/start/wave milestones are per browser-tab local day, not unique people.
  Run endings are a separate all-run outcome distribution, not the final stage of that funnel.
  Expedition endings omit the wave-depth field because their progression is measured in nodes.
- The live menu already showed Quick/Daily on 14 October. Do not infer exact deployed bundle
  identity or analytics delivery from the older deployment-pending notes below.

## Local validation — 15 October 2026

- Full `npm run verify:last-bastion`: all required lanes pass, including 1,771 unit tests
  across 309 files, 24 browser acceptance tests, smoke/offline recovery, 25 matching published
  outputs, and desktop host build with 28 tests.
- Website checks: 54 JavaScript files and 272 pages pass. Portfolio `node scripts/check-all.js`:
  all 19 guards pass. Local browser verification required execution outside the sandbox.
- Browser regressions exercise failed character art with explicit retry, failed module startup,
  a Daily retry across midnight, and keyboard build-page navigation. Service workers are blocked
  only for fault-injection cases so cached assets cannot bypass the injected failure.
- Fresh settings, build, affinity and combat captures are retained in
  `playtest-evidence/2026-10-15-screens-auto/`. These are layout evidence, not observed full runs
  or physical-display/controller acceptance. The standard floor wash is now 12%; motion and
  audio acceptance remains open.
- Release identity: `web-2026.10.15-reliability`. Web output is rebuilt; the older packaged
  desktop executable has not been repackaged with these changes. Nothing was pushed or deployed.

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
- **LB-07 progress, 11 October:** the map already uses nine distinct vector node pictograms.
  Objective modes now use shape badges instead of `E/D/C`, and cleared status has a separate
  lower corner so it cannot cover an objective badge. New automated map captures at the three
  sizes above are in `playtest-evidence/2026-10-11-screens-auto/`. An observed review of the
  map and its backdrop at real display sizes is still required before LB-07 closes.
- **LB-04 progress, 11 October:** the retained Marine overlay is now scaled and placed per pose
  in gameplay and the gallery. The 12-frame gallery was captured at 960×540, 1920×1080,
  and 3840×2160; a combat capture checks the live 960×540 placement. This runtime
  registration leaves the source master intact. Creator-observed motion and the Medic and
  Assault galleries still need sign-off before LB-04 closes.
- The verifier now checks every published JavaScript chunk against the service worker's atomic
  offline core before browser tests. This caught the new helmet module missing from that list;
  its entry is present and the isolated offline acceptance test passes.
- Fix repeated comprehension, fairness, input, or registration failures; rerun the exact
  failed hero/tier/input combination. Do not expand Threat Tiers 3–11 before these gates pass.

## 3. Desktop and Steam acceptance

- The Electron 43.4.0 Windows unpacked package was rebuilt after the map and Marine helmet
  changes on 11 October 2026. `npm run smoke:package:win` passes against the packaged
  renderer. Run
  `desktop/release/win-unpacked/LastBastion.exe` visibly to check title, input,
  windowed/borderless transitions, monitor selection, pause, focus/resume, audio, and combat.
- Repeat with Steam closed for offline boot and save recovery. Repeat from Steam once an
  App ID and partner access are assigned; validate achievements, cloud save, controller
  mapping, and Steam-down fallback. Packaging success is not a Steam sign-off.
- Record GPU, driver, display and frame pacing on real Full HD, 4K, ultrawide, and
  Deck-shaped hardware before tuning scale or presentation from headless timings.

## 4. Read data before expanding scope

- After two weeks of live measurement, compare open → start → wave 1 → wave 5, the separate run-outcome distribution, and
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
