# Last Bastion — next-chat handover prompt

Continuation update: QA-01/QA-02 from the subsequent accepted plan are implemented in `4675b9ab`
and `f7506ea2`. Prepared identity is now `web-2026.10.17-qa-readiness`; follow CURRENT-PLAN and
QA-READINESS.md for current evidence/commands. The older baseline below is historical. Human,
hardware, Steam, content and release gates still apply; do not repeat the completed QA work.

Copy the prompt below into the next chat. Paths are relative to the game directory unless stated otherwise.

---

Continue Last Bastion at:
`C:\snackpack-universe\website-snackpack-universe\play\last-bastion`

I accept the recommendations recorded in this handover. Complete the remaining authorized work,
fix demonstrated defects, keep the plan/release notes current, archive completed tasks and commit
focused changes. Work autonomously where possible. Do not repeatedly rerun unchanged checks or
invent more asset batches to fill a blocked release gate. Clearly separate implemented, verified,
awaiting human evidence, deferred and externally blocked work.

## Read first

1. Root AGENTS.md and any applicable nested instructions.
2. `CURRENT-PLAN.md` — authoritative active queue.
3. `RELEASE-HANDOFF-2026-10-16.md` — ownership and release gates.
4. `ASSET-IMPROVEMENT-PLAN-2026-10-16.md` — accepted Patch A and conditional Patch B.
5. `ASSET-INVENTORY-NOTES.md`, `asset-inventory.json`, `asset-geometry.json`.
6. `presentation-defect-plan-2026-08-23.md`, `local-playtest-plan-2026-08-21.md`.
7. `RELEASE-NOTES.md`, `last-bastion-log.md`, and
   `archive/ASSET-PATCH-A-IMPLEMENTATION-2026-10-16.md`.

## Repository and authorization boundaries

The website is a nested Git repository with its own remote. Inspect current branch, status,
recent commits and staged files before editing. Other sessions work here. Stage/commit only your
files; never reset or discard unrelated work. Do not assume the previous chat's HEAD is current.
On 17 October, unrelated edits remained in `about/index.html`, site `play/social/last-bastion.webp`
and `privacy/last-bastion/index.html`, plus unrelated site art. Preserve them. `.qa-runtime/`
contains local scratch/cache files; do not commit it wholesale.

Standing instruction: do not push/deploy unless explicitly asked. This handover does not authorize
pushing. Previous chats did not deploy; another session may since have done so. Verify current
state before making deployment claims. Claude owns production builds and local Android builds;
Codex prepares and validates, and must not run production packaging/build/submission unless Mark
explicitly assigns that specific build. Read root `docs/RELEASING.md` before any build/submit.
Do not message Claude or another chat without explicit messaging authorization.

## Delivered baseline — do not redo

- `c7779414`: reliability, Daily/streak, settings and build-inspection corrections.
- `ebc9a4b2`: controller navigation, attempt provenance and first-click fixes.
- `39214943`: asset inventory and opt-in A/B floor pilot.
- `17ee207c`: optimized floor kit, affinity HUD/inspection, map/build/effects polish.
- `2e3d8c6e`: additional dense presentation evidence and release handoff.
- Prepared release: `web-2026.10.16-asset-polish`; service worker `2026-10-16-asset-polish`.
  Save schema remains 16. Verify these against current source before changing them.
- 227 unique game/shell/chrome asset definitions, source hashes, pivots, alpha/frame bounds,
  decoded-memory estimates and 1,328 retained unmapped art files. Unmapped does not mean unused.
- Two optimized floor pilots; eight-tile/four-decal kit with retained sources/prompts and reproducible
  derivative script. All new floors are opt-in; existing default is unchanged.
- Optional saved affinity HUD, next-aligned-choice commitment warning, real inspect action,
  catalogue-derived boon/cost descriptions, wrapped build pagination, map focus brackets,
  armed READY label, closed-route badge, reduced pooled effect opacity/Reduced Flash support.
- Cooldown timer preference now refreshes the HUD immediately.

Recorded evidence: full verifier passed with 1,777 unit tests in 311 files, 30 browser checks,
28 desktop-host tests, smoke/offline and 25 matching published outputs. One later save-preference
regression passed in a 51-test targeted suite. All 19 portfolio guards passed on 16 October.
Four further 2.4-second stress samples passed at 1080p/4K across all colour-vision modes and HUD
scales 0.8–1.2. These counts are historical evidence, not a substitute for checking changed code.

## Phase 1 — close presentation and gameplay decisions

- Review existing captures before collecting more. Evidence folders:
  `playtest-evidence/2026-10-16-screens-auto/` and `2026-10-16-polish-review/`.
- Complete or coordinate the five observed runs in the playtest matrix. Record comprehension,
  fairness, damage sources, controls, frame pacing, visuals and audio. Real controller/audio
  observations cannot be claimed from simulated inputs or screenshots.
- LB-04: inspect Marine/Medic/Assault body/helmet registration during idle, movement, dodge and
  hit poses. Repair only named failed frames/anchors; retain masters and rollback mapping.
- LB-07: accept or correct actual map node meanings, focus/armed/cleared/closed states and routes.
- Floor decision: compare baseline, pilot A/B and kit in continuous/dense play, grayscale and
  colour-vision modes at 1080p/4K. Kit has a visible broad panel grid; do not silently make it default.
  Refine/reject/adopt based on evidence. Recheck edges, contrast and implied collision.
- Stress capture shows twelve weapon bodies crowding the hero. Investigate representative normal
  loadouts before calling this a production defect; if confirmed, refine attachment spacing,
  layering or visibility without changing weapon mechanics.
- These are known review risks, not newly confirmed bugs. Do not claim a fresh defect list exists.

## Phase 2 — desktop, performance and Steam readiness

- Prepare the latest verified web bundle for the assigned build owner; desktop host tests do not
  produce a fresh executable. Existing desktop scripts are `package:win` and `smoke:package:win`.
- Once a fresh package is available, check focus/resume, pause, audio, controller remapping,
  windowed/borderless transitions, monitor changes, offline boot and save recovery with Steam closed.
- Measure actual target GPUs at Full HD/4K, Windows DPR/scaling 100/125/150/200%, ultrawide and
  Deck-shaped output. Record hardware, driver, p95/p99 pacing, hitches and memory in dense sessions.
  Stable native 4K60 is a target, not established support. Headless measurements are not a verdict.
- Steam App ID/partner access is required for actual achievements, cloud saves, mapping and
  Steam-down fallback acceptance. Report missing access plainly; do not invent it.

## Phase 3 — authorized release and measurement

- Only after explicit deployment authorization, inspect the full nested-repo release range,
  push the intended release, wait for CI and confirm the served build identity and privacy page.
- Verify warm-cache offline upgrades and real analytics events: opened, run-started, wave-1,
  wave-5, run-ended and next-local-day returning. Confirm optional individual pageviews disabled.
- Read metrics accurately: milestone events are per tab/local day, not unique people; endings
  form a separate outcome distribution; expedition progress is nodes, not waves.
- Record the verified measurement start date. Review two weeks of live data plus observed runs
  before expanding scope. No automatic scheduling or monitoring is requested by this handover.

## Phase 4 — conditional Patch B and later improvements

These recommendations are accepted in principle; preserve their evidence gates rather than
starting all of them at once. Turn justified work into small, scoped implementation tasks.

1. Replayable combat practice: reuse production inputs, weapons and arena; teach move/aim,
   evade, hazard tells and inspection. Easy exit, repeatable, excluded from progression, Daily,
   achievements and live outcome metrics. Prefer code-native targets/prompts.
2. One existing-region encounter variant only if observed play establishes weak variety.
   Reuse existing enemies/art; prototype pacing or spatial objective behind a review route.
3. DOM-backed menu accessibility: real focus/semantics and keyboard/screen-reader operation,
   preserving controller and pointer parity. Inventory existing shell contracts before implementation.
4. Replace How to Play diagram placeholders only after teaching copy survives comprehension
   review. Diagrams must reflect real remappable controls; labels belong in code.
5. Selective codex, weapon/hazard VFX, transformation art or audio refinements only for demonstrated
   unclear consequences or feedback. Reuse H1/O2/O2B/O3 assets before commissioning equivalents.
6. Legacy modifier cleanup only for a concrete correctness/maintenance problem with regression
   coverage; avoid a large refactor during release acceptance.

New heroes/regions, multiplayer, leaderboards, touch controls, and Threat Tiers 3–11 remain outside
this patch. Do not turn later ideas into implied production promises.

## Completion and verification

After meaningful runtime edits: relevant tests/typecheck, rebuild dev output into game-assets,
update release/service-worker identity when warranted, run `npm run verify:last-bastion` from the
site root and relevant portfolio guards; root `node scripts/check-all.js` is the all-green check.
Use `.playwright-browsers` via PLAYWRIGHT_BROWSERS_PATH for local browser tests. The additional
review config is `playwright.last-bastion-polish.config.mjs`.

Update CURRENT-PLAN, release notes and completed-work log. Archive completed/obsolete queues;
keep unresolved gates active. Commit scoped source, generated output and useful evidence together.
Do not claim completion of human, hardware or deployment gates without actual evidence. If all
executable authorized work is done, state the specific external dependency and hand off concretely
instead of repeatedly doing the same tests or inventing new work.
