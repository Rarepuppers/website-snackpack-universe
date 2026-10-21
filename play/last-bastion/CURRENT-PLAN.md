# Last Bastion — current plan

**Updated:** 21 October 2026
**Prepared local release:** `web-2026.10.21-menu-review` (service worker `2026-10-21-menu-review`).
**Last verified published release:** `web-2026.10.17-qa-readiness`; the new patch is not pushed/deployed.
**Status:** accepted gallery fixes and title/menu/settings semantic controls implemented locally;
fresh full game verification passes. Physical and assistive-technology acceptance remain open.
Human, hardware, Steam and analytics-dashboard gates remain open.
The 17 October publication and CI evidence below is historical. The new local implementation
needs separate publication authorization;
production packaging remains with Claude and has not run in this work.

Continue from this plan, the [acceptance worksheet](ACCEPTANCE-WORKSHEET-2026-10-17.md) and
[QA operator guide](QA-READINESS.md). The older next-chat prompt, September product strategy and
July systems tracker are archived historical context, not additional execution queues.

This is the only active execution queue. Completed audit tasks are in the
[archive](archive/README.md); player-facing changes are in the [release notes](RELEASE-NOTES.md).
Keep the content freeze until observed play and live measurement justify expansion.

## Latest post-implementation audit — 21 October

The [follow-up review](AUDIT-FOLLOWUP-2026-10-21.md) records detailed asset, animation, mode and
polish recommendations against `7780ba86`. Fresh checks: **41 browser regressions pass (1.2m)**;
twelve new local captures cover all settings groups, baseline/kit combat, dense 4K CVD, map and
Marine/Medic/Assault galleries. No new runtime defect or essential asset-generation task was
established. These sampled checks do not close observed-play, AT, audio or hardware gates.

Priority remains: **P1** observed Runs 1–5 → floor decision → hero registration/transitions →
earned-rack/hostile-tell/map clarity → actual semantic-menu acceptance; fresh package/hardware
acceptance has an external owner. **P2** targeted audio/teaching polish and conditional practice;
**P3** one conditional existing-region encounter variation. Follow-up details refine the existing
IDs and acceptance criteria; they do not open a second execution queue or authorize content/release.
Existing code-native teaching diagrams do not need replacement merely because historical plans
mention placeholders. Release notes remain unchanged because this audit changes no runtime.

## 21 October accepted follow-through — executable scope complete

Mark accepted the [audit and prioritized proposal](AUDIT-REVIEW-2026-10-21.md). Implementation
commits `637f6ec8` and `6472ceeb` deliver QA-03, QA-04 and the scoped ACCESS-01 slice. The
[completed implementation record](archive/MENU-REVIEW-IMPLEMENTATION-2026-10-21.md) and
[current evidence](playtest-evidence/2026-10-21-menu-review/README.md) preserve scope and limitations.

- **QA-03 complete:** logical-size gallery sprites, bounded eight-entry manifest pages, explicit
  supported/unknown hero handling and family-only loading for all five hero review routes.
- **QA-04 complete:** corrected legacy-tile and production-audio descriptions without removing
  fallback paths; added real-scene identity/bounds and native-control regressions.
- **ACCESS-01 implementation complete for title/menu/settings:** visible native controls dispatch
  through ScreenFlow/effects, retain focus on input updates, restore focus on return, synchronize
  simulated gamepad selection, and preserve real save transfer/privacy routes. Other screens
  remain canvas-based. Actual screen-reader and physical-controller acceptance still needs a tester.
- **UX-01 bounded slice complete:** native menu heading aligns in its plate; explicit Start/Back
  and native setting controls replace canvas foregrounds. Further contextual help remains driven
  by observed confusion, not additional speculative menu copy.
- Fresh final game verifier passes in 89.9 seconds: 1,783 unit tests / 312 files, 41 browser cases,
  smoke/offline, all 25 published-output comparisons and 31 desktop-host tests. This includes native
  save-import/gamepad and composed-pixel regressions. The final report ran at `637f6ec8` plus the
  dirty CSS/test fix subsequently committed as `6472ceeb`; it is not an exact-HEAD claim.
- Corrected a reproduced 4K Chromium composition defect: an opaque black rectangle mirrored the
  native Back button into the canvas. A blended foreground layer removes it; the pixel regression
  failed before the fix and passes afterward. Fresh final captures include the corrected 4K view.
- Final portfolio `node scripts/check-all.js` passes all 20 discovered guards, including asset delivery.
- Seven fresh captures show the real repaired gallery and native UI. No new raster assets were
  needed. Published identity, floor default, save schema 16 and simulation compatibility 3 remain
  separate: the prepared build changes identity only; gameplay/content and floor adoption did not change.

Next actions require evidence or an external owner:

1. **ACCEPT-02 / ART-01 / ART-02 / CLARITY-01:** complete observed Runs 1–5, compare the existing
   quieter floor kit in motion, inspect hero registration and earned mixed racks. Do not change the
   default floor or repaint a hero without a named failure/acceptance result.
2. **ACCESS-01 acceptance:** keyboard + actual screen-reader check of this limited slice; physical
   controller and focus/resize review. Scope other screens separately; no whole-game accessibility claim.
3. **AUDIO-01 / remaining UX-01:** listen to production cues and record comprehension problems;
   tune/generate only what those observations demonstrate is needed.
4. **PERF-02:** Claude supplies a fresh package, testers supply named hardware measurements and
   Steam access. Use existing QA reports/provenance; no additional diagnostic tool is queued.
5. **LEARN-01 / VARIETY-01:** existing observed-play and verified-live-data gates remain active.
   No new practice/content/region/hero/tier work follows merely from accepting this audit.

The original [audit evidence](playtest-evidence/2026-10-21-audit/README.md) is the pre-change baseline,
not current implementation acceptance. No human/hardware/Steam gate was closed by these checks.

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
bottleneck (PERF-01). Practice, further accessibility, art/audio and encounter variety retain the conditions
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
  Build/affinity inspection and semantic title/menu/settings controls are implemented locally;
  other shell screens and whole-game accessibility are not covered by that limited slice.
  The [shell contract inventory](SHELL-ACCESSIBILITY-CONTRACT-2026-10-17.md) is prepared;
  title/menu/settings implementation is now local; further slices require separate scope and must
  preserve the existing state/effect/input contracts. Actual assistive-technology acceptance remains open.
- Touch controls, new heroes/regions, multiplayer, leaderboards and Threat Tiers 3–11 are not
  approved production tasks. Use observed needs and operating constraints to select additions.
- Historical details remain in the [content-debt](archive/last-bastion-content-debt-plan.md)
  and [item-UI](archive/item-ui-asset-production-plan.md) plans; old counts and batch numbers
  are not current acceptance evidence.

## Compatibility and working rules

- Save schema remains 16. Daily participation intervals are additive; old saves migrate retained
  dates. Days discarded by an older build cannot be reconstructed. Detailed history stays at 60 days.
- Commit in the nested website repository and stage only relevant paths. Preserve retained art
  masters and unrelated work. The explicitly authorized 17 October push is complete; the new
  21 October patch requires separate publication authorization.
- After meaningful runtime edits, rebuild `dev/`, include generated `game-assets/`, update the
  service-worker release identity and run `npm run verify:last-bastion`.
- Keep manual gates explicit. Automated checks cannot complete observed gameplay, audio,
  physical-controller, packaged-window or Steam-client acceptance.
