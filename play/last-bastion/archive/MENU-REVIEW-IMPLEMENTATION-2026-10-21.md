# Completed menu and art-review implementation — 21 October 2026

This records delivered implementation, not a new queue. Continue from
[CURRENT-PLAN](../CURRENT-PLAN.md) and its external acceptance owners.

Mark accepted the [audit proposal](../AUDIT-REVIEW-2026-10-21.md). Baseline review/evidence was
committed as `18e14e56`; implementation is `637f6ec8`, with the 4K composition correction in `6472ceeb`. No assets were generated. Runtime defaults,
floor selection, progression, schema 16 and simulation compatibility 3 remain unchanged.
Prepared identity is `web-2026.10.21-menu-review` / worker `2026-10-21-menu-review`.
This implementation is local; no new publication, executable package or Steam action was performed.

## QA-03 — gallery defects corrected

- Default scuttler/egg/brain samples and ring weapons use manifest logical dimensions rather
  than enlarged source-frame dimensions. Retained source pixels, combat sizing and pivots remain.
- The manifest displays eight bounded entries per page, with a count and clamped first/last
  pages, pointer controls, keyboard Left/Right and standard D-pad navigation. Escape/B returns
  to the menu. Runtime review metadata records actual sprite/text bounds.
- `?mode=gallery&hero=marine|medic|assault|tactician|scout` loads the requested hero family and
  identifies it visibly. Unknown selectors display an error, never Marine fallback. Explicit
  hero selection takes precedence over historical batch routes; those routes remain supported.
- Assault's breach overlay is isolated beside each body frame because it is an action layer,
  not a permanent helmet. Frame review does not close motion/registration acceptance.

Real browser tests traverse every manifest page at 960×540, 1080p and 4K, check actual bounds,
exercise all five hero routes and verify unknown-hero rejection. Existing combat routes pass.

## ACCESS-01 — first semantic slice implemented

Title, menu and settings have a visible native foreground aligned to the actual canvas CSS box.
The canvas keeps authored decoration; its duplicate foreground labels/zones are suppressed on
these screens. Other screens keep the existing canvas renderer and controls.

- Actual headings, buttons, labelled checkboxes/selects/ranges and status feedback; no invisible
  duplicate action list. Focusable controls retain keyed DOM nodes across value updates.
- ScreenFlow and its existing effects still own actions/persistence. Native values and
  directional input share validation; no extra provider/storage contract or dependency was added.
- Enter/Space activation has one owner; native select/range keys remain native. Tab works,
  Escape returns, and selected input focus is restored on return. Simulated pad selection moves
  DOM focus and B returns once. Physical controller and real screen-reader acceptance remain open.
- Save export, invalid import, import cancellation and privacy use their production actions;
  cancellation preserves progress and focus. Save-error feedback remains visible/retryable.
- ResizeObserver follows the canvas box, including letterboxing. DOM/listeners/observer are
  removed on scene shutdown; the scene's gamepad listener is explicitly unregistered.

The menu title is aligned within its existing plate, with explicit Start/Back affordances.
Further help copy stays behind observed comprehension evidence. No whole-game accessibility
promise follows: help, records, armory, hero/threat select, map, debrief and combat are separate.

## QA-04 — stale descriptions corrected

Legacy Batch I fallback coverage is named as such rather than outstanding asset commissions.
Dedicated weapon tile overrides remain intact. Audio cue/player descriptions acknowledge
production samples and their synthesized fallback. No fallback behavior was removed.

## Verification and evidence limits

The final full game verifier passed all required lanes in 89.9 seconds: 1,783 unit tests /
312 files; 41 browser cases; smoke/offline; website JS/offline core; all 25 source/published-output
comparisons; desktop-host build and 31 tests. It ran at `637f6ec8` with the dirty CSS/test fix
subsequently committed as `6472ceeb`. Runtime bytes have not changed since that final pass.
The earlier 38-case pass and two focused import/gamepad cases are superseded by this combined run.
The resize regression also passed three repeats; it samples canvas/layer/controls atomically.

Fresh 4K capture review demonstrated a black rectangle at the vertically mirrored Back-button
bounds. Hiding either canvas or native foreground removed it; no DOM node occupied that area.
A composed-pixel regression measured 100% black in the affected interior before the fix and passes
with less than 1% afterward. Blending the native layer at opacity 0.999 removes the reproduced
artifact. Isolation, transform promotion and paint containment did not remove it. No renderer,
asset or gameplay rewrite was needed. Real monitor/GPU acceptance remains a separate gate.

Fresh final captures and machine-readable report are retained in
[implementation evidence](../playtest-evidence/2026-10-21-menu-review/README.md).
The final `node scripts/check-all.js` run passes all 20 discovered portfolio guards, including
shared-asset delivery fixtures; its log is retained there. Older audit passes are not substituted.

No observed human run, physical-controller/audio session, actual screen-reader review, 15-minute
hardware pacing measurement, new packaged executable, Steam integration or analytics-dashboard
receipt was established. Floor adoption, repainting, audio changes, practice and encounter
expansion retain their evidence gates. Claude remains the production-build owner.
