# Last Bastion — current plan

**Updated:** 17 October 2026
**Local release:** `web-2026.10.16-asset-polish` (service worker `2026-10-16-asset-polish`).
**Status:** accepted audit corrections are implemented and committed. All required automated
verification lanes pass. This release has not been pushed or deployed by this work.

For continuation, use the [17 October next-chat handover](NEXT-CHAT-HANDOVER-2026-10-17.md).
It organizes remaining work into presentation, platform, release/measurement and conditional
Patch B phases; it adds no newly confirmed bugs or unconditional asset commissions.

This is the only active execution queue. Completed audit tasks are in the
[archive](archive/README.md); player-facing changes are in the [release notes](RELEASE-NOTES.md).
Keep the content freeze until observed play and live measurement justify expansion.

## Completed and verified

- Reliability and comprehension pass: `c7779414`. Startup/art recovery, long Daily streaks,
  midnight-safe retry, local-day visit reporting, abandonment classification, grouped settings,
  readable paginated build/affinity inspection, deadzone consistency and large-display panels.
- Controller/reporting follow-up: `ebc9a4b2`. Physical menu controls independent of combat
  remapping, D-pad pages, mixed-speed share disclosure, fresh attempt settings after restart,
  corrected affinity count/navigation hints and reliable first clicks on pause/settings rows.
- Latest `npm run verify:last-bastion`: all required lanes passed (73 seconds): 1,777 unit
  tests in 311 files, 30 browser checks, smoke/offline acceptance, 25 matching published outputs,
  website JavaScript/offline-core checks and desktop host build with 28 tests. A subsequent saved-HUD
  preference regression passed with its 51-test targeted suite (one additional unit test).
- Portfolio `node scripts/check-all.js`: all 19 guards passed on 16 October. Separate website
  check previously verified 272 pages. Those results do not establish live deployment status.
- Asset patch: 227-definition inventory/geometry report, eight-tile/four-decal kit, optimized pilots,
  affinity HUD/catalogue details and map/build/effect polish. Baseline/A/B and new kit/UI captures are in
  `playtest-evidence/2026-10-16-screens-auto/`. Default gameplay does not load the pilot art.
- Earlier layout captures remain in `playtest-evidence/2026-10-15-screens-auto/`. They predate the
  follow-up label changes and are layout evidence, not final screenshots of every current label.

## Remaining work requires release or physical-device acceptance

The code/assets checkpoint is complete. The [release handoff](RELEASE-HANDOFF-2026-10-16.md)
assigns the remaining human/device/build/deployment gates and records existing build commands.
Four further dense browser cases passed across all palettes and HUD scales 0.8–1.2 at 1080p/4K;
see [sampled evidence](playtest-evidence/2026-10-16-polish-review/README.md). These are not Runs 1–5.

## 1. Deploy and verify the browser release — open

- [ ] Obtain an explicit deployment request: Mark's standing instruction is **do not push unless asked**.
- [ ] Review the website repository's release scope, including unrelated working-tree changes;
  push only the authorized release, wait for CI, and verify the live game and privacy page.
- [ ] Confirm the served build identity matches `web-2026.10.16-asset-polish` and test a warm-cache
  offline upgrade. The live menu already showed Quick/Daily on 14 October; this does not prove
  that the current bundle or analytics configuration is deployed.
- [ ] Confirm `opened`, `run-started`, `wave-1`, `wave-5`, `run-ended`, and next-local-day
  `returning` in the `snackpack` GoatCounter dashboard. Record the first verified measurement
  date and confirm optional individual-pageview collection is disabled.

Measurement contract: open/start/wave milestones are per browser-tab local day, not unique
people. Run endings form a separate all-run outcome distribution. Expedition endings omit
wave depth because their progress is measured in nodes.

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
- Touch controls, new heroes/regions, multiplayer, leaderboards and Threat Tiers 3–11 are not
  approved production tasks. Use observed needs and operating constraints to select additions.
- Historical details remain in the [content-debt](archive/last-bastion-content-debt-plan.md)
  and [item-UI](archive/item-ui-asset-production-plan.md) plans; old counts and batch numbers
  are not current acceptance evidence.

## Compatibility and working rules

- Save schema remains 16. Daily participation intervals are additive; old saves migrate retained
  dates. Days discarded by an older build cannot be reconstructed. Detailed history stays at 60 days.
- Commit in the nested website repository and stage only relevant paths. Preserve retained art
  masters and unrelated work. Do not push without the explicit request described above.
- After meaningful runtime edits, rebuild `dev/`, include generated `game-assets/`, update the
  service-worker release identity and run `npm run verify:last-bastion`.
- Keep manual gates explicit. Automated checks cannot complete observed gameplay, audio,
  physical-controller, packaged-window or Steam-client acceptance.
