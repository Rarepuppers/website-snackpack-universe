# Last Bastion — current plan

**Updated:** 17 October 2026
**Browser release:** `web-2026.10.17-qa-readiness` (service worker `2026-10-17-qa-readiness`).
**Status:** Patch A and QA preparation implemented; fresh 17 October game verification passes.
Human, hardware, Steam and analytics-dashboard gates remain open.
Mark explicitly authorized commit/push on 17 October. The browser release is served and website CI/Pages pass;
production packaging remains with Claude and has not run in this work.

Continue from this plan, the [acceptance worksheet](ACCEPTANCE-WORKSHEET-2026-10-17.md) and
[QA operator guide](QA-READINESS.md). The older next-chat prompt, September product strategy and
July systems tracker are archived historical context, not additional execution queues.

This is the only active execution queue. Completed audit tasks are in the
[archive](archive/README.md); player-facing changes are in the [release notes](RELEASE-NOTES.md).
Keep the content freeze until observed play and live measurement justify expansion.

Use the [acceptance worksheet](ACCEPTANCE-WORKSHEET-2026-10-17.md) for exact owner actions and
evidence to return. The [17 October checkpoint](archive/CONTINUATION-REVIEW-2026-10-17.md)
archives completed diagnostic/preparation work; do not restart it as an implementation queue.

## QA preparation — completed

Mark accepted the recommendations and optional work. QA-01 and QA-02 are now implemented:

- `4675b9ab`: opt-in local session reporting with start/stop/reset/export, bounded full-session
  samples, explicit pause/hidden exclusions and overflow, shared run provenance and selectable
  fallback. The original 600-frame rolling view stays separate. Default routes have no QA panel.
- `f7506ea2`: staged identity/runtime hashes, Windows package manifest and a read-only consistency
  checker. Fixtures exercise actual stamping, dirty inputs, altered/missing/extra files and mixed
  runtime. Real packaging remains Claude's task.
- Use [QA readiness](QA-READINESS.md) for commands and limitations. The completed task scope and
  fresh evidence are in the [archived implementation](archive/QA-READINESS-IMPLEMENTATION-2026-10-17.md).
  No further preparation tool is queued merely to fill an external gate.

Next executable runtime work requires a named observed failure (ACCEPT-01) or a measured hardware
bottleneck (PERF-01). Practice, accessibility, art/audio and encounter variety retain the conditions
below; acceptance of recommendations did not supply missing observations or release authorization.

## Completed and verified

- Reliability and comprehension pass: `c7779414`. Startup/art recovery, long Daily streaks,
  midnight-safe retry, local-day visit reporting, abandonment classification, grouped settings,
  readable paginated build/affinity inspection, deadzone consistency and large-display panels.
- Controller/reporting follow-up: `ebc9a4b2`. Physical menu controls independent of combat
  remapping, D-pad pages, mixed-speed share disclosure, fresh attempt settings after restart,
  corrected affinity count/navigation hints and reliable first clicks on pause/settings rows.
- Latest `npm run verify:last-bastion`: all required lanes passed on 17 October (82.4 seconds):
  1,781 unit tests in 312 files, 31 browser checks, smoke/offline, 25 matching published outputs,
  website JavaScript/offline-core checks and desktop host build with 31 tests. QA runtime changes and
  refreshed published output passed. See the archived report for execution limitations.
- Portfolio `node scripts/check-all.js`: the fresh QA-readiness run passed all 19 guards.
  Its result is retained in the archived implementation/evidence. This is local verification;
  human, hardware, Steam and live analytics acceptance remain separate.
- Asset patch: 227-definition inventory/geometry report, eight-tile/four-decal kit, optimized pilots,
  affinity HUD/catalogue details and map/build/effect polish. Baseline/A/B and new kit/UI captures are in
  `playtest-evidence/2026-10-16-screens-auto/`. Default gameplay does not load the pilot art.
- Earlier layout captures remain in `playtest-evidence/2026-10-15-screens-auto/`. They predate the
  follow-up label changes and are layout evidence, not final screenshots of every current label.

## Remaining work requires external or physical-device acceptance

The code/assets checkpoint is complete. The [release handoff](RELEASE-HANDOFF-2026-10-16.md)
assigns the remaining human/device/build/analytics gates and records existing build commands.
Four further dense browser cases passed across all palettes and HUD scales 0.8–1.2 at 1080p/4K;
see [sampled evidence](playtest-evidence/2026-10-16-polish-review/README.md). These are not Runs 1–5.
Five new [normal-rack diagnostics](playtest-evidence/2026-10-17-loadout-review/README.md) inspected
legal three/four-weapon base racks and a single weapon. The hero remains identifiable in those
samples; mixed/bonus-slot racks in dense earned play still need review. No production defect was
established that justifies attachment spacing or mechanics changes.

## 1. Browser publication — live and verified; dashboard acceptance open

- [x] Explicit commit/push request received on 17 October 2026.
- [x] Reviewed the full `origin/main..HEAD` range. It includes committed Last Bastion QA work
  and committed arcade layout/shared-art changes; dirty About/social/privacy/site art and scratch
  files remain unstaged. No force push, history rewrite or production packaging is authorized.
- [x] Pushed the reviewed release; Pages deployed. Live game and privacy page return successfully.
- [x] Website CI and Pages passed on `31139871`: 154 arcade checks, 31 Last Bastion browser
  journeys, 1,781 game tests, desktop-host tests and integrity checks. The publication evidence
  retains the CI/Pages URLs and checked commit.
- [x] Live identity is `web-2026.10.17-qa-readiness`; an isolated Chromium profile warmed on
  asset-polish upgraded to the QA-readiness cache, then booted a fixed-theme/seed route offline.
  See [publication evidence](playtest-evidence/2026-10-17-qa-readiness/README.md). Analytics was blocked
  in the probe, so this does not prove dashboard receipt.
- [ ] Confirm `opened`, `run-started`, `wave-1`, `wave-5`, `run-ended`, and next-local-day
  `returning` in the `snackpack` GoatCounter dashboard. Record the first verified measurement
  date and confirm optional individual-pageview collection is disabled.

Measurement contract: open/start/wave milestones are per browser-tab local day, not unique
people. Run endings form a separate all-run outcome distribution. Expedition endings omit
wave depth because their progress is measured in nodes.

The final host `node scripts/check-all.js` rerun passed all 19 portfolio guards. An earlier
sandbox rename restriction and transient missing Vol 2 scenes during another session's migration
are superseded by that completed result; no changes to the other session's work were needed.
See `publication-portfolio-verification.txt` in the publication evidence.

## 2. Observed gameplay and presentation — open

- [ ] Complete Runs 1–5 in the [playtest matrix](local-playtest-plan-2026-08-21.md), recording
  comprehension, fairness, damage sources, input, frame pacing, visuals and audio. Run 0 does
  not count. Cover keyboard/mouse and a physical controller, including remapped controls.
- [ ] Verify the standard floor wash in motion and listen to audio during actual combat.
- [ ] Close or explicitly accept LB-04 helmet registration and LB-07 map iconography in the
  [presentation register](presentation-defect-plan-2026-08-23.md). The 11 October map/gallery
  captures and Marine pose adjustments remain evidence; Medic/Assault galleries and observed
  motion still require acceptance. Review at 960×540, 1920×1080 and 3840×2160.
- [ ] Fix observed failures and repeat the affected hero/tier/input combination.

## 3. Desktop and Steam acceptance — open

- [ ] Package the current web release for desktop. The Windows executable last built/smoke-tested
  on 11 October predates the October 15 corrections; desktop-host tests do not refresh it.
- [ ] Smoke-test the fresh package, then visibly verify input, pause, focus/resume, audio,
  windowed/borderless transitions and monitor selection. Test offline boot/save recovery with
  Steam closed.
- [ ] Once Steam App ID and partner access are available, verify achievements, cloud saves,
  controller mapping and Steam-down fallback from the actual Steam client.
- [ ] Record GPU, driver, frame pacing and display behavior on Full HD, 4K, ultrawide and
  Deck-shaped hardware. Headless captures are not hardware acceptance.

## 4. Asset patch — implementation complete, acceptance open

The [16 October Full HD/4K asset patch proposal](ASSET-IMPROVEMENT-PLAN-2026-10-16.md)
sets out the next staged art and improvement work. Implementation now includes the expanded 227-definition inventory, alpha-bound report, optimized
eight-tile/four-decal kit, optional affinity HUD, catalogue explanations, map/build polish and effect
opacity fixes. See the [completed checkpoint](archive/ASSET-PATCH-A-IMPLEMENTATION-2026-10-16.md);
the standard floor remains unchanged. See [inventory scope](ASSET-INVENTORY-NOTES.md) for gaps
and the patch proposal’s progress checklist for remaining non-testing work. Acceptance gates above remain open.


- Review two weeks of verified live data: open → start → wave 1 → wave 5, the separate outcome
  distribution, and next-day return. Combine with the five observed runs before changing scope.
- Replayable practice, full DOM-backed menu accessibility, further codex expansion,
  legacy modifier cleanup, VFX/transformation art and further music remain conditional work.
  Build/affinity inspection is implemented; full accessible shell semantics are not.
  The [shell contract inventory](SHELL-ACCESSIBILITY-CONTRACT-2026-10-17.md) is prepared;
  implementation remains conditional and must preserve the existing state/effect/input contracts.
- Touch controls, new heroes/regions, multiplayer, leaderboards and Threat Tiers 3–11 are not
  approved production tasks. Use observed needs and operating constraints to select additions.
- Historical details remain in the [content-debt](archive/last-bastion-content-debt-plan.md)
  and [item-UI](archive/item-ui-asset-production-plan.md) plans; old counts and batch numbers
  are not current acceptance evidence.

## Compatibility and working rules

- Save schema remains 16. Daily participation intervals are additive; old saves migrate retained
  dates. Days discarded by an older build cannot be reconstructed. Detailed history stays at 60 days.
- Commit in the nested website repository and stage only relevant paths. Preserve retained art
  masters and unrelated work. The current release push is authorized; later releases still require
  an explicit request.
- After meaningful runtime edits, rebuild `dev/`, include generated `game-assets/`, update the
  service-worker release identity and run `npm run verify:last-bastion`.
- Keep manual gates explicit. Automated checks cannot complete observed gameplay, audio,
  physical-controller, packaged-window or Steam-client acceptance.
