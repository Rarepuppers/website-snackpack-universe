# Last Bastion — reviewed queue and handover

Date: 20 September 2026; implemented 21 September 2026. Author: Codex. Status: implemented
and verified, with live analytics activation still awaiting Mark's GoatCounter site code.

This is the active queue linked from `implementation-plan-2026-09-11.md`. Keep that
document's reconciliation banner as the ownership record; its older task lists are history.

## 1. Baseline and constraints

- Fetched `origin/main` again on 21 September: `f9e288ab`; the checkout matches it.
  Changes since the prior review are outside Last Bastion. The handover's `18a4e47d`
  is historical, not a checkout instruction. Preserve unrelated work, including the
  untracked Keeping Up image, and do not reset the shared checkout.
- Preserve Codex's combat presenter/decision overlay, projectile presentation, replay
  compatibility, run provenance/report, power-up catalogue, perk grid, intent mapping,
  frame pacing and service worker. Preserve Claude's additive work from reconciliation.
- Preserve `LAST_BASTION_CORE` atomic installation and `build:check`'s service-worker
  exemption. An orphan report is never an automatic deletion list. Coordinate release
  cache invalidation when runtime code/media changes; test warm-cache upgrade and offline
  boot, including missing-media feedback. Do not rewrite `sw.js` wholesale.
- Content remains frozen: no new weapons, enemies, bosses, items, relics or heroes.
  Existing-content repairs remain in scope. Historical catalogue counts are not new claims.
- One owner per change; no overlapping queue execution without an explicit assignment.
  QA-06 remains one responsibility per change, backed by the replay corpus.

## 2. Findings that change the plan

### QA-21 — fix current published HTML drift first (P1)

Fresh standalone `npm run build:check` **fails**: published `index.html` is 2,482 bytes;
rebuilt output is 2,431 bytes. The published page includes
`<script src="../game-ui-assets.js" defer></script>` but `dev/index.html` does not.
A blind rebuild would remove part of the shared game UI rollout.

Reconcile the intended bootstrap into the source template/generator first. Audit any
site generator writing the published page so the mismatch cannot recur. Do not simply
delete the script to make the check green.

Acceptance: bootstrap survives rebuild, standalone `build:check` passes, and the
title/game/map/summary journeys work. Update social metadata in `dev/index.html` when
that task arrives; generated HTML alone is not the source of truth.

### QA-22 — reopen verifier integrity, part of QA-07 (P1)

`dev/package.json` runs `build` before `build:check` inside `verify`, repairing stale
output before testing it. CI calls the standalone check, so this particular bug is local.
`scripts/verify-last-bastion.ps1` also reads the removed `run/BuildIdentity.ts`, leaving
the report identity as `unknown`; its dirty-path filter omits `sw.js`, source HTML and
several browser configs/tests. It runs in the live checkout, so the historical isolated
staging requirement is not complete.

Acceptance: verification checks existing output before mutation, preferably without
mutating it at all; a stale fixture fails without being rewritten; report identity uses
the actual reconciled provenance/build source; relevant dirty inputs are included;
command exceptions still produce a failed report with subsequent lanes NOT-RUN.
Use task-owned scratch fixtures for negative tests, never damage the shared checkout.

### QA-23 — telemetry needs a delivery fix before activation (P1)

`installFunnelTransport()` appends an async script, then `startPlayerFunnel()` immediately
calls `opened()`. `goatCounterTransport.send()` drops the event while the API is absent,
but `PlayerFunnel.onceInSession()` has already marked it sent. Slow startup can lose the
denominator and suppress it on later pages. Existing tests permit the unloaded-script
no-op; they do not establish reliable startup delivery.

Add bounded startup buffering or readiness-based delivery with explicit failure and
deduplication semantics. Test delayed load, blocked script, navigation, storage failure
and repeated initialization through the production transport. Keep gameplay independent
of analytics. Disabled telemetry still writes visit/session state: deliberately choose
and document that behavior rather than describing it as completely inactive.

Mark's account/site code blocks activation and dashboard verification only. Delivery
repairs, a payload audit and a draft disclosure can proceed beforehand. Remove the
unconditional comment claiming no personal data and no consent requirement; assess the
actual provider configuration and local storage when preparing the privacy disclosure.
No signup or live activation is part of this review. Activation requires the disclosure
to be served first and observed dashboard receipt of a controlled funnel.

### Reorder art: repair presentation before promotional captures

Keep the tile first among art deliverables, but do not generate it from scratch. The
current `play/tiles/last-bastion.png` is a 96x94 SnackPack studio placeholder rendered
at 72x72. Derive a 144x144 tile from the canonical 1254x1254 desktop helmet source,
with a deterministic crop/resize and a 72x72 actual-size review. This is a replacement
of placeholder branding, not a new identity commission.

Move LB-04 and LB-07 ahead of guide/share captures so promotional material shows the
repaired game. Narrow LB-04 before producing art: retained composites show the Marine
overlay broadly registered already; the Medic has clear failures in several prone/defeat
frames; the Assault static composite is plausible but still needs animated inspection.
Classify each frame at native size and 4x first, then re-register only failing frames.
Preserve dimensions, frame order and runtime contracts; do not regenerate a good sheet
or hide registration errors with arbitrary global offsets. Acceptance evidence is a
body-plus-overlay contact sheet and observed animation for each supported hero.

LB-07 includes scene integration, missing-texture fallback, focus/selection states and
arm-then-deploy behavior. It is not complete when image files exist. This is the one
current task that needs newly authored visual assets: nine text-free node-type icons plus
the objective/current-position marks and route end caps. Prefer one icon set with
code-rendered/tintable state rings over 45 baked icon-state variants, while retaining
non-colour state cues. Do not automatically commission the old brief's six large
replacement map plates: require fresh rendered evidence of a remaining backdrop defect
before widening this task.

**Implementation correction, 21 September.** Fresh source inspection and rendered map
evidence showed that `NodeMedallionIcon` and `NodeIconCatalog` already provide the complete
code-native, tintable icon system described above, including non-colour silhouettes and
state rings. The earlier inventory looked only for raster icon files and was wrong. No
duplicate bitmap icon set was created; the 32-shot matrix closes the current LB-07 claim.

Guide screenshots and the run loop are captures of the shipped game, not generated art.
The social card should be composed from canonical helmet art and/or an actual capture,
with text kept in HTML metadata where practical. Keep an editable source or deterministic
composition script for every derived marketing asset; do not make an opaque one-off export.

### Keep observed gates open; narrow QA-12's closure claim

Screenshot generation is not visual sign-off. Require a fresh shakedown of title → setup
→ map → combat → level-up → debrief, keyboard and available gamepad navigation, readable
focus, reduced-motion behavior and audio feedback. Record which QA-10 accessibility
checks were actually exercised. Keep hardware-dependent checks open when not observed.
Browser release work does not depend on Steam acceptance; retain packaged-window/Steam
gates separately until that platform is in scope.

Historical averages of 20–22 ms do not establish a 60 fps budget. Current profiling
thresholds (100 ms average / 333 ms p99; stress p99 500 ms) detect severe collapse only.
Record device, browser, viewport, visibility and target frame rate before declaring
performance acceptable. The context test logs recovery state but only asserts frame
samples; it does not prove zero context losses across previous documents.

### QA-24 — bounded memory investigation (P2)

Replace the broad "real leak detection" promise with two investigations: sustained
combat within one document (heap/resources after comparable workloads), and repeated
navigations (browser/GPU process trends and context lifecycle where measurable).
Texture counts are proxies, not GPU bytes; process totals include browser caches.
Record warm-up, settling, repetitions and unavailable measurements. Escalate reproducible
growth or context failures; do not call fresh-document heap comparisons leak tests or
promise portable exact GPU accounting. This does not block the tile.

### Remove completed work from the active queue; defer speculative work

Combat event dispatch and the decision overlay are already extracted: remove the old
"combat-event presentation dispatch next" instruction. Select further QA-06 work only
after identifying a concrete remaining ownership problem. Keep replay tests and observed
rendering as safeguards; simulation digests alone do not protect presentation.

Defer the shared text factory, U3 bezel production and QA-20 activation. Do not generate
bezel art simply to enable dormant configuration. Preserve the planner, document the
intentional fallback, and revisit availability wiring when that mode is prioritized.

## 3. Revised execution order

| Order | Work | Completion evidence |
| --- | --- | --- |
| 1 | QA-21 build drift, then QA-22 verifier repair | Standalone drift check green; negative stale-build fixture red without mutation; accurate JSON identity and lane status. |
| 2 | Arcade tile derivative | 144×144 square derived from the canonical helmet source; inspect at actual 72×72 on the arcade hub in both themes; retain reproducible source/recipe. |
| 3 | QA-23 delivery readiness | Delayed/blocked transport and deduplication checks; reviewed payload/storage behavior; disclosure draft. Mark's site code is not needed for this preparation. |
| 4 | LB-04 frame triage/targeted repair, then LB-07 icons/integration | Per-hero frame matrix before editing; repair only failed overlay frames; before/after composites and observed animation at native and 4× scale. Newly authored map icons cover every current type/state at the smallest viewport; fallback and deployment behavior remain intact. |
| 5 | Fresh shakedown and QA-04b screenshot review | Dated evidence at 960×540, 1080p, 4K and 1280×800; record defects and resolve any that affect captures before proceeding. |
| 6 | Guide screenshots and social card | Actual mid-wave combat, expedition map and level-up choice; captions/alt text/dimensions and optimized assets; game-specific 1200×630 share card readable at small size; editable source/recipe plus source and generated metadata aligned. |
| 7 | Short run loop | Actual play capture, compact video and poster; GIF derivative only where needed. Show combat → choice → map/progression with readable timing; no debug UI or invented gameplay. Controls if embedded. No community posting in this scope. |
| 8 | Telemetry activation when account details are available | Privacy disclosure served before activation; controlled funnel visible in dashboard; blocked analytics never blocks play. This step need not delay art work. |
| 9 | QA-12 target-device evidence and QA-24 investigation | Explicit budgets, sustained-session and navigation evidence, honest measurement limits. Bring forward if shakedown reveals stalls or context failures. |
| Deferred | QA-06 further extractions, shared text factory, U3/QA-20, Steam work | A named need and appropriate platform evidence before taking a slice. Content freeze remains in force. |

Prefer existing art and actual captures over new asset production. QA captures must be
reproducible (commit/build, seed and settings); marketing captures must represent shipped
play. Do not lift the content freeze merely because the first analytics number appears;
bring the observed problem back to Mark before proposing new content.

## 4. Verification and handoff contract

Commands below run in the nested website repository unless stated otherwise:

1. Before changing source, run standalone `npm run build:check` in `play/last-bastion/dev`.
2. After source/template edits, run `npm run build` in `dev` and include required generated
   `game-assets/` and generated HTML changes in the same focused change.
3. Run `npm run verify:last-bastion -- -Json <evidence-path>` after repairing QA-22.
4. Run `npm run screens:last-bastion` for presentation changes and inspect the outputs.
   Use `measure:last-bastion` for loading changes and `profile:last-bastion` for pacing
   or resource lifecycle changes. Do not substitute these for actual play acceptance.
5. Preserve warm-cache upgrade, executable offline boot and missing-asset feedback tests;
   test sibling arcade behavior when shared code or the worker changes.
6. Run the applicable site checks and parent-repository `node scripts/check-all.js`.
   Report failures with scope; portfolio green alone is not Last Bastion acceptance.

For later publication, commit only task paths inside this nested website repository,
push the reviewed site changes, and confirm the live game, guide and asset URLs. Do not
push another session's local commits as an incidental part of this work. A committed
page is not a served page. Publication and live checks are recorded in the closeout below.

Each closure records change, commit/build, automated results, observed evidence where
needed, and remaining limits. Historical green counts are never carried forward as
current results.

## 5. Checks performed during this review

- Remote fetched again on 21 September; checkout and `origin/main` both resolve to
  `f9e288ab`; no branch or credential files changed.
- Reconciliation, current source, HTML, service worker, build checker, CI job, verifier,
  funnel transport/tests and profiling harness inspected.
- Standalone `build:check` re-run on 21 September: **FAIL**, still only the HTML drift
  recorded in QA-21 (published 2,482 bytes; rebuilt 2,431 bytes); output not repaired.
- Asset inventory and static composite review: the tile is a non-square studio placeholder;
  canonical helmet icon source already exists; Marine does not justify blanket recreation;
  Medic has visible registration failures in prone/defeat frames; Assault needs animated
  confirmation; authored map node icons are absent.
- Full game verifier, screenshots and profiling not run: this is a planning-only review,
  and the existing verifier mutates the output with a rebuild.
- Parent `node scripts/check-all.js`: **PASS**, all 17 portfolio guards. This does not
  override the separate Last Bastion build-drift failure.
- `git diff --check`: **PASS** for the tracked plan edit.

## 6. Implementation closeout — 21 September 2026

- **QA-21 / QA-22 closed.** The shared UI bootstrap now lives in the source HTML;
  verification no longer rebuilds before checking drift; the report reads the real build
  identity and captures all relevant dirty inputs and command failures. A scratch-fixture
  regression test proves a stale published build fails without being rewritten.
- **QA-23 delivery readiness closed; activation external.** The transport now buffers a
  bounded session queue until GoatCounter is ready and only consumes once-per-session
  markers after delivery or durable acceptance. Delayed load, blocked storage, navigation,
  retry and deduplication paths are covered. `/privacy/last-bastion/` documents both local
  state and the dormant funnel. No site code was invented; gameplay analytics remain off.
- **Tile and LB-04 closed.** The arcade tile is a deterministic 144×144 derivative of the
  canonical helmet. The Medic overlay was re-registered only in failed movement, impact
  and defeat frames; the retained composite was inspected at 4× and rebuilt into the
  published game assets. Marine and Assault sheets were not needlessly regenerated.
- **LB-07 closed by correction and evidence.** The existing code-native medallion system
  already covers the required node types and states. Fresh map captures confirm distinct,
  readable icons and the current backdrop; no new raster icon assets were justified.
- **Launch media closed.** Three seeded in-game guide captures, a deterministic 1200×630
  social card (PNG/WebP), and a compact WebM run loop were produced from shipped play. The
  tile/social recipe and capture script are committed so every derivative is reproducible.
- **QA-24 closed to the limits browsers expose.** The profile records environment and
  30/60 fps intent, tightens collapse thresholds, measures sustained dense combat, and
  bounds textures, source counts, decoded-byte estimates, resources, heap and context-loss
  events across repeated navigations. Texture bytes remain a proxy, not exact GPU memory.

Observed limitations remain explicit: no physical gamepad was attached for hardware
acceptance; Steam/package checks remain deferred; GoatCounter dashboard receipt cannot be
verified until Mark supplies the Last Bastion site code. None blocks the browser release.

### Post-release follow-up — 21 September

The game-specific privacy policy is now reachable from the Settings screen by keyboard,
gamepad intent and pointer, with a minimum-viewport browser acceptance test. The guide now
embeds the captured run loop with native controls, a poster and a direct fallback link;
social metadata also declares the card's type and 1200×630 dimensions.
