# Last Bastion quality audit and implementation queue

Date: 7 September 2026. Status: audit and planning only; implementation remains open.
Baseline: website repository commit `5bd77110`, plus the working tree inspected today.

## 1. Scope and handover mismatch

The requested folder is `website-snackpack-universe/play/last-bastion`. It contains a
Phaser/TypeScript game in `dev/` and an Electron host in `desktop/`. The README identifies
`last-bastion-improvement-and-steam-plan-2026-08-07.md` as the forward plan.

The supplied handover references `docs/codex-work-order.md`, `content_health.gd`,
`allow_fuzzy`, potion assignment, `__upN` card variants, and a Godot `Gradient` crash.
The work-order file, health script, and `project.godot` were not found in this project,
including an explicit search of ignored files excluding dependencies and art.
Those claims are **unverified for this checkout**. Do not rename or commission assets here
on that basis. This audit extends the actual Last Bastion plan; it does not replace or
pretend to have reviewed the missing Godot work order.

Reviewed: documentation and existing presentation backlog, content/asset verification,
replay and simulation seams, persistence and restoration, input and debrief flow,
loading feedback, display/accessibility settings, build configuration, browser checks,
desktop tests, and the surrounding site's cache policy. This is a broad source and
automated-check audit, not an observed gameplay, visual, audio, hardware, or Steam release sign-off.

## 2. Verified baseline

| Check executed | Result |
| --- | --- |
| `dev`: `npm run test -- --reporter=dot` | 286 files, 1,605 tests passed |
| `desktop`: `npm test` | TypeScript build and 28 tests passed |
| `dev`: `npm run typecheck` | Passed |
| `dev`: `npm run image:audit:webp` | 63 derivatives passed; 51.93 MiB source to 27.06 MiB derivatives |
| `dev`: `npm run combat:audit:boundaries` | 33 enemy adapters passed |
| `dev`: `npm run content:audit` | 3 checks passed; inventory below |
| `dev`: `npm run smoke` | Existing output served: 120 art assets and 90 review routes passed HTTP checks |
| `dev`: `npm run offline` | Existing output: 417 local asset references, zero missing |

Live inventory: 5 hero definitions, 34 weapons (31 draftable), 38 enemy catalogue types,
7 elite identities, 47 items, 14 relics, 12 artifacts, 20 upgrades, 16 level-stat cards,
29 world objects, and 4 objective modes. Definition counts do not imply every hero is released.

The web production bundle was not rebuilt in this audit: Vite writes directly into the
published game directory. Smoke/offline results therefore describe the existing output,
not proof that it matches today's source. No game runtime, controller, rendered screenshot,
audio listening, packaged-window, or Steam-client test was performed. No assets generated.

## 3. Priority queue

P1 = player-facing correctness or prerequisite for trusting a release/refactor.
P2 = valuable QoL, maintainability, or evidence improvement. Sizes are relative:
S = contained change, M = several connected modules, L = staged project.
All items below are OPEN unless an existing capability is explicitly acknowledged.

### QA-01 — Make save failure visible and preserve recovery options (P1, M)

**Implementation status — complete locally 7 September 2026.** `LocalSaveStore.persistence()` now
reports saved, memory-only, read-failed, and write-failed state. The shell shows a persistent
warning and no longer claims settings are persisted when storage is unavailable. Failed reads
block writes so inaccessible/corrupt persisted data cannot be replaced by defaults; P or the
warning retries the failed operation, while failed writes retry the current in-memory save.
Settings now exports a versioned JSON backup and imports only recognized schemas after showing
a migration/run summary and receiving replacement confirmation. Invalid/future payloads leave
the current save untouched; unit and executable download checks cover the transfer path.

**Evidence:** `dev/src/game/save/LocalSaveStore.ts`, `readFromStorage` and
`writeToStorage`, catch storage/parse failures and return defaults or silently retain
only the in-memory state. `ShellScene.ts` describes settings as “Persisted immediately
to local save.” A blocked or full store can contradict that promise. Desktop atomic
backup recovery already exists and passes its tests; retain it.

**Task:** expose storage status (`saved`, `memory-only`, `failed`, `recovered`) to the UI;
show a restrained persistent warning when progress will not survive closing. Preserve
unreadable browser data before any replacement, provide retry, and add a versioned save
export/import surface with validation and a preview before replacing progress. Do not
claim a cloud save succeeded when only the local write did.

**Acceptance:** injected quota/permission failures give visible feedback without stopping
play; reload behavior is honest; corrupt input does not silently erase the recoverable
payload; valid export/import round-trips settings, unlocks, history, and expedition state.
Export can follow the failure-status fix as a second focused change.

### QA-02 — Harden expedition save validation at the boundary (P1, M)

**Implementation status — completed 8 September 2026.** Save
normalization now requires safe integer seed/node identities, deduplicates and caps cleared
nodes, rejects non-finite health, clamps survival/progression values, validates weapon and
upgrade IDs against their catalogues, clamps tiers/levels, and merges duplicate upgrade rows.
`resumeExpeditionRun` now also requires a connected cleared path from the generated map's start
node. Save-facing IDs now have explicit weapon and upgrade alias tables: a rename must add its
alias in the same change, unknown upgrades are discarded, and a retired-only weapon loadout
restores the selected hero's starter weapon while an intentionally empty loadout remains empty.
Tests cover both retired-content outcomes.

**Evidence:** `LocalSaveStore.ts::readExpedition` checks node IDs only with `typeof number`,
and `readBuild` accepts numeric health/shield without finite bounds and arbitrary string
weapon/upgrade IDs. Item and relic IDs already receive catalogue checks. The restoration
helpers clamp some fields, but those checks do not make the persisted contract valid.
For example, valid JSON `1e309` parses as an infinite number; a numeric type check admits it.
This is a confirmed validation gap, not a demonstrated live save-loss incident.

**Task:** require finite bounded values and safe integer IDs; validate nodes against the
regenerated map and ownership IDs against catalogues; cap collection sizes and tiers;
handle retired content and future schema versions explicitly. Keep profile progress when
only the resumable run is invalid. Apply the same normalizer to browser, desktop, cloud,
and any future import path.

**Acceptance:** malformed and old-save fixtures cover extreme numbers, unknown IDs,
duplicate/out-of-map nodes, and truncated builds. Each either migrates to a valid playable
state or produces a clear recoverable “cannot resume this run” result, without a crash.

### QA-03 — Fix debrief controller activation and hints (P1, S)

**Implementation status — complete locally 7 September 2026.** The debrief now has focused
selection, D-pad navigation, A confirm, B back, pointer hover focus, direct R/N/ESC shortcuts,
and hints derived from the current selection. Shoulder/Start buttons are ignored. Pure mapping
tests pass and the production debrief was visually checked at the default expedition selection
and after moving focus left to Retry Quick Drop.

**Evidence:** `dev/src/game/scenes/RunSummaryScene.ts::addReturnControls` attaches
`input.gamepad.on("down", defaultAction)` (and `leave` for an empty summary). Every button
therefore activates the action, not just the advertised A button. On Quick Drop, Enter
executes Retry although the “ENTER / A” hint is drawn beneath New Expedition.

**Task:** use an explicit focused selection with confirm/back semantics shared with the
shell. Derive hints from actual bindings and the selected mode. Ignore unrelated buttons.

**Acceptance:** D-pad changes focus; A confirms exactly once; B backs out; shoulder buttons
do not start runs; keyboard, controller, and pointer agree with the displayed hints in
Quick Drop, expedition, and empty-summary states.

### QA-04 — Add a real browser acceptance lane (P1, M)

**Implementation status — first executable lane live 7 September 2026.** Five Playwright
scenarios execute title-to-menu keyboard flow, seeded map state plus two-step route confirmation
and persisted travel, combat boot, save-backup download, debrief focus movement, and
visible/retryable storage-read failure. They fail on
page errors and Last Bastion console/request/HTTP failures. Full decision/debrief/resume flow,
asset-failure recovery, offline reload, and the complete viewport screenshot matrix remain open.

**Evidence:** `dev/scripts/smoke-test.ps1` requests HTML/assets with `Invoke-WebRequest`.
Query routes can all return the same HTML even if scene creation throws. The offline script
scans references and patterns rather than executing a cold boot. The site's
`tests/visual/arcade.spec.mjs` does not include Last Bastion.

**Task:** retain the cheap static checks, but add browser tests against a freshly staged
build: title -> character select -> map -> combat -> decision -> debrief, plus resume.
Fail on uncaught errors, required resource failures, missing scene readiness, or input
dead ends. Keep deterministic scene hooks read-only and test-only where practical.

**Acceptance:** a deliberately broken scene causes failure even while HTML returns 200.
Exercise failed asset loads and recovery, storage failure, focus loss, and keyboard flow.
For browser offline acceptance, warm the required content then disconnect and reload;
for packaged offline acceptance, boot with external network denied. State which is tested.
Capture screenshots at the existing plan's 960x540, 1080p, 4K, and 1280x800 targets;
visual approval still needs a human review of legibility and art.

### QA-05 — Strengthen replay evidence before broad extraction (P1, M)

**Implementation status — completed 10 September 2026.** Replay compatibility version 3 uses the
same pure combat-to-expedition-build conversion as the live scene, carries that build through
ordered encounters, and records per-node and per-input-span checkpoints. Its digest covers shield,
bonus health, progression, scrap, weapon tiers and stash, upgrades, transformation, relic/item
holdings, item stats, shop bans, artifact and slot/health rewards, objectives, hero-action cooldowns,
active buffs and defeat cause. The representative corpus now includes node continuity, shop item
purchase and ban, ranked reward, transformation, Deny completion, Collect failure, an Assault
ultimate, and an abandoned-run defeat. Changing the shop action preserves the preceding checkpoints
and diverges at the changed span. The executable browser lane also repeats title-to-menu and
map-to-encounter transitions plus direct combat and debrief boots twice while rejecting page,
console, request and response failures. This certifies the Phaser renderer used by this project;
the handover's historical Godot `Gradient` crash remains inapplicable without the missing Godot
project or a reproducer from it.

**Evidence:** seeded fixtures and ranked-kill determinism tests already exist in
`combat/ReplayFixture.test.ts`. However, `runCombatReplaySequence` uses
`fixtures.map(runCombatReplay)`, constructing fresh simulations rather than carrying a
saved build between nodes. `replaySnapshotDigest` covers selected combat fields, omitting
shield, bonus health, item holdings, scrap, upgrade levels, transformation state, and other
progression fields. Equal digests are not full behavioral equivalence.

**Task:** add a compact representative corpus: actual node transition through save/load,
shop purchase/ban, ranked reward, transformation, objective completion/failure, hero
ability, and defeat. Expand the observable digest with stable ordering and intermediate
checkpoints. Include input actions currently neutralized by the fixture where needed.
Keep deterministic goldens separate from same-seed-repeat checks.

**Acceptance:** deliberate loss of a purchased item, shield, or transformation across a
node transition fails; repeating seeds passes; changing one action diverges at an identified
checkpoint. Document intentional balance-driven golden changes. A simulation replay cannot
certify a rendering crash such as the unrelated Godot Gradient issue.

### QA-06 — Stage the large-file split by responsibility (P2, L; depends on QA-05)

**Implementation status — two scene extractions completed 10 September 2026.** With QA-05's
replay corpus in place, decision rendering and keyboard/gamepad/pointer selection now live in the
focused `CombatDecisionOverlay` UI owner. Combat event-to-audio, haptic, visual-effect and feedback
dispatch now lives in `CombatEventPresenter`, behind a typed presentation port whose callbacks keep
Phaser scene ownership explicit. `PrototypeScene` retains simulation mutation authority and the
actual Phaser object/effect helpers. Together these changes reduce the scene from 5,546 to 4,803
lines without changing event order, decision layout, input rules or fixed-step timing. Browser
acceptance covers decision navigation and repeated combat scene transitions; the full replay corpus
continues to cover simulation state. Simulation ownership remains deferred to its pure planner seams.

**Evidence:** `CombatSimulation.ts` remains 10,412 lines, while `PrototypeScene.ts` is now 4,803
lines. Existing behavior/restore planners and adapter checks are useful seams, but the boundary
script checks delegation patterns, not state equivalence.

**Task:** extract one responsibility per change. Start with decision presentation/input
from PrototypeScene, then combat-event presentation dispatch. In simulation, extend the
existing pure reward/shop/restore planners before moving mutable ownership. Keep RNG draws,
event order, fixed-step timing, and mutation authority explicit. Avoid a wholesale rewrite.

**Acceptance:** relevant observable fixtures and browser scene flows pass unchanged after
each extraction; no new circular imports; no “cleanup” golden changes without an explained
behavior change. A harness reduces risk only for the behavior it actually covers.

### QA-07 — Extend the existing verify command across both deliverables (P1, M)

**Implementation status — core wrapper complete locally 7 September 2026.** From the website
root, `npm run verify:last-bastion` reports commit/dirty state and runs the existing complete web
verification, the executable browser lane using the repository-owned Chromium runtime, and the
desktop build/tests. The first complete run passed all required lanes in 25.4 seconds. Isolated
staging and machine-readable lane output remain useful follow-ups; manual hardware/Steam gates
are reported explicitly and are not represented as automated passes.

**Evidence:** `dev/package.json` already has `verify`; it covers image checks, combat
boundaries, inventory, types, tests, build, HTTP smoke and static offline checks. It omits
desktop tests and executable browser acceptance. Smoke hardcodes `C:\Python314\python.exe`
and port 44173. Vite emits stable chunk names directly into `..` with `emptyOutDir: false`.

**Task:** add a project-root wrapper rather than a competing Godot-style command. Stage a
fresh build into an isolated destination, parameterize smoke roots/ports, resolve a supported
runtime, and run web + desktop + browser checks. Emit commit/build ID, durations, and
PASS/FAIL/SKIP per lane. Keep hardware/Steam acceptance explicitly separate.

**Acceptance:** one documented command exits nonzero on any required failed or skipped
lane; a clean checkout with documented dependencies can run it; stale published files cannot
produce a false pass; report explains unrun device checks. No publishing or Steam upload.

### QA-08 — Close the existing presentation register before more content (P1, M/L)

**Implementation status — LB-08 complete locally 7 September 2026.** Map hover/focus previews
intel; the first click/Enter/A arms a route and the second explicitly deploys; movement clears
the armed state; D-pad cycles choices; B returns; unrelated pad buttons do nothing. The armed
route uses an orange outline and explicit “confirm again” copy. Unit/browser checks pass and the
armed 2026/Threat 2 map was visually inspected at the default desktop viewport. Other LB items
remain open until individually rechecked.

**Evidence:** `presentation-defect-plan-2026-08-23.md` already specifies LB-01 onward,
shared text/layout primitives, inspect behavior, reward feedback and event coverage.
Its top banner still says plan only. `ExpeditionScene.ts` still binds reachable-node
`pointerdown` directly to `travelTo(node.id)`, confirming the first-click commitment part
of LB-08 remains present. This audit does not re-certify every historical visual defect.

**Task:** recheck each LB item against current code and screenshots, then update its status.
Prioritize inspect-before-travel, visible projectiles/rewards, text/layout, and character
registration using the existing IDs. Add the August 23 plan to the README's live index.
Avoid opening duplicate tickets or commissioning art for defects already fixed.

**Acceptance:** pointer hover/focus previews node intel, explicit confirm travels, Back
cancels, and unrevealed intel stays hidden. Each other closure has build ID, route, viewport,
input method, and evidence; no open S1/S2 presentation defect on release-critical screens.

### QA-09 — Give players a reproducible run report (P2, M)

**Implementation status — Quick Drop provenance and copy flow completed 10 September 2026.**
Recordable Quick Drops now receive an explicit random seed; `?seed=` reproduces it. Summaries
normalize combat/map seed, web build and simulation compatibility versions, starting speed,
auto-fire and aim-assist settings, plus a speed-changed flag. The debrief distinguishes “Retry
this seed” from “New Quick Drop”, preserves hero/perk/settings in the retry URL, and copies a
plain-text factual report. Clipboard denial opens an accessible, selected textarea. Old summaries
remain readable with explicit unknown provenance. A later schema change should carry initial
settings and all encounter seeds across an entire multi-node expedition; the current expedition
report records its map seed and final encounter setup, which is enough to regenerate the chart but
is not claimed as a complete replay.

**Evidence:** `run/RunSummary.ts` stores useful outcomes and defeat-cause metrics but has
no seed/build identity or game-speed provenance fields. Retry Quick Drop in
`RunSummaryScene.ts` carries only the hero ID. Existing data is a strong starting point.

**Task:** record map/combat seed, build/simulation version, starting hero/perk and relevant
run settings; if game speed changes mid-run, record the change history or a modified flag.
Add “Copy run details” with clipboard-failure fallback and distinguish a new randomized
run from “Retry this seed.” Do not call a seed alone a complete replay.

**Acceptance:** copied details reproduce the intended initial setup, old summaries still
render, clipboard denial leaves selectable text, and no private machine/account paths leak.
Use existing damage/defeat metrics for a concise, factual “What ended this run?” panel.

### QA-10 — Prove accessibility across the full journey (P2, M)

**Evidence:** reduced motion, colour-vision choices, UI scaling, game speed, focus pause,
and confirmation for pause-menu abandon/restart already exist. Do not re-add those systems.
Existing plans still call for observed readability and input acceptance.

**Task:** test the largest supported UI scale on the smallest supported display, long
names/descriptions, remapped controls, controller disconnect/reconnect, focus loss during
held confirmation, and reduced-motion combat. Ensure critical danger/selection signals have
shape/text as well as colour. Keep focus visible and restore it when dismissing inspectors.

**Acceptance:** title through debrief is completable without a mouse; no clipped required
text or unreachable control; held input cannot accidentally confirm after returning focus;
reduced motion preserves threat timing and information. Record physical device tests as pending
until performed, rather than inferring them from input helper unit tests.

### QA-11 — Check updates and offline asset consistency (P2, M)

**Implementation status — coordinated browser release cache completed 10 September 2026.**
Last Bastion now registers the root worker on direct HTTP(S) visits. Worker release
`2026-09-10-qa11` installs every published executable chunk atomically, keeps runtime media in the
same release-specific cache, and serves all Last Bastion resources network-first. Activation drops
the prior release cache, so stable filenames cannot combine old media with new code. Only successful
responses are cached. Browser acceptance warms a summary, proves it reloads offline under worker
control, then opens an unwarmed combat theme and observes the existing visible, keyboard-retryable
asset failure. The desktop custom protocol continues to use packaged assets without a worker.

**Evidence:** game chunks have stable filenames (`dev/vite.config.ts`). The parent site's
`sw.js` is network-first for JavaScript but cache-first for image/audio URLs. A browser
controlled by that worker can retain older media at unchanged URLs. This is an update risk,
not a reproduced stale-art incident; verify actual worker control on the game route first.

**Task:** define one release asset-version contract (content hashes or a coordinated version
manifest), stage/deploy atomically, and test an old warmed cache upgrading to a new build.
Test first-time access to an unwarmed theme while offline; don't promise every scene is cached
after only visiting the title. Review unsuccessful HTTP responses before caching them.

**Acceptance:** old and new builds cannot mix incompatible sheets/chunks; failed downloads
have useful retry/back behavior; cached media is refreshed deliberately; packaged assets work
without a service worker. Keep shared-worker changes scoped and test sibling arcade games.

### QA-12 — Make performance and loading polish measurable (P2, M)

**Deployment-size update — 8 September 2026.** The Pages artifact reached 1.89 GB because
the branch publisher included 1.42 GB of source-art working files and 82.6 MB of bundled QA
runtime tools. Root `_config.yml` now excludes only those two non-runtime trees; the complete
149.5 MB browser `game-assets` directory and development/desktop sources remain published while
the project is actively being developed. After the content pipeline settles, audit and exclude
the remaining source-only `dev`, `desktop`, `audio`, scripts, tests, evidence and planning trees,
with a target Pages artifact below 250 MB. Keep that later reduction separate from deleting or
archiving source assets from Git history.

**Evidence:** asset groups, scene loading feedback, effect budgets and frame-pacing telemetry
already exist. WebP checks measure selected derivatives, not total startup cost or texture
memory. Existing observed density/display gates remain the authority for target performance.

**Task:** record cold title/deploy timings, bytes per asset group, p95/p99 frame time,
texture/memory growth and hitch counts across repeated map/combat/shop/debrief transitions.
Exercise the density-capacity route, boss telegraphs, and the heaviest actual released loadout.
Review audio mix and reward feedback during dense combat with the existing listening gate.

**Acceptance:** agree budgets per target device before judging results; repeat transitions
do not cause monotonic listener/texture growth; input remains responsive during loading;
critical cues survive effect reduction. Optimize measured bottlenecks before adding art,
new themes, enemies, or permanent progression.

## 4. Disposition of the supplied recommendations

| Supplied recommendation | Audit disposition |
| --- | --- |
| Safe renames -> duplication -> potion assignment -> generation | Preserve in the matching Godot work order; unverified here. Require a per-ID before/after resolution report and rollback mapping, not only a total MISSING count. |
| Delete `allow_fuzzy` after renames | Sensible for that resolver once exact/approved fallback fixtures and all tooling callers are migrated. Not a change to this Phaser loader. |
| Check the 21 upgraded cards before generation | Agree with the check-first principle. Base fallback must be both intentional and correct in the rendered UI; distinguish unique missing art, approved base reuse, unresolved IDs, and wrong semantic matches. Count alone cannot distinguish them. |
| Split two large files now | Adapt as QA-05 -> QA-06. Existing tests do not certify all behavior; do staged extraction after filling the affected coverage gaps. |
| Seed replay to verify Gradient fix | No Gradient diagnosis possible here. Seeded simulation tests already exist; rendering regression needs a renderer-level reproducer and repeated boot/transition tests. |
| Add `--verify-all` | Adapt as QA-07; extend the existing `verify`, including desktop and browser lanes. |

## 5. Recommended execution order and completion rule

1. Reconcile the missing Godot handover separately; keep this work scoped to Last Bastion.
2. QA-01 save-status slice, QA-02 boundary validation, QA-03 debrief input correction.
3. QA-04 executable browser gate + QA-07 staged verification; QA-05 replay continuity corpus.
4. Reconcile and close QA-08's existing LB presentation defects; QA-10 accessibility acceptance.
5. QA-06 staged extraction; QA-09 run-report QoL; QA-11 update/offline checks; QA-12 profiling.
6. Complete the existing five observed runs and packaged/Steam/device gates before expansion.

Each completed task should record the exact change, automated result, observed evidence where
needed, remaining limitation, and commit/build identity. A green content count cannot certify
correct art, a green simulation digest cannot certify rendering, and static offline checks
cannot certify an offline launch. Keep those acceptance lanes explicit.
