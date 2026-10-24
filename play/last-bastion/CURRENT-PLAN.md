# Last Bastion — current plan

**Updated 24 October 2026. Sole active execution queue.**
Current implementation checkpoint: `5a1c7aaf`; prepared identity `web-2026.10.23-shop-fit`.
Save schema 16 / simulation compatibility 3. No human testers are available now.
This refresh adds coding, automated investigation and design tasks only. It implements no runtime
change. Items below are scoped proposals ready for execution in order, not newly confirmed bugs.
Demonstrated crash, save-loss or input dead-end defects take precedence.

## Completed baseline

Shop viewport/input fixes, event confirmation, live audio controls, native title/menu/settings/help/
rebinding/records and BAL-01 reporting are delivered. Do not repeat them. Last runtime evidence:
1,795 unit / 314 files, 53 browser and 31 desktop-host tests passed in 139.9s. The portfolio run
passed 20/20 during that continuation, before its final input corrections. These are dated results,
not checks rerun for this documentation change. See [completion evidence](playtest-evidence/2026-10-23-content-review/README.md)
and [archive index](archive/README.md). The old queue and dated audits are archived; asset/design
specifications and QA procedures remain reference material, not competing execution queues.

## Ordered coding and design queue

Effort: S = roughly one focused session; M = several sessions; L = multiple bounded slices.
Estimates exclude external acceptance. Each implementation must first inspect current consumers
and tests, reuse existing systems, and stop or narrow the task if the proposed gap is already covered.

### 1. DECISION-02 — catalogue-wide decision layout and input hardening

**P1; M effort; medium risk. Executable now.** SHOP-01 exposed actual fixed-size clipping;
its new browser case covers sampled offers/management at three sizes. `DecisionOverlayLayout.ts`
still derives height from option count. A panel-bound assertion does not prove every description,
focus border or hint fits. Further overflow is a coverage hypothesis, not a reproduced defect.

Benefit/scope: readable, operable choices across upgrade, stat, placement and shop variants.
Enumerate real maximum-count/longest-label choices using production factories; capture them at
960×540, 1280×800 and 4K with existing display settings. Measure actual text/choice/hint bounds and
focus. Exercise arrows, digits, Enter, pointer and simulated pad, including held input across transitions.
Fix only reproduced clipping or duplicate activation. Prefer wrapping/spacing; introduce paging or
scrolling only if required, retaining selected-item visibility and stable choice IDs.

Reuse existing overlay, panel art and text; no generated assets. Dependencies: current layout/input
contracts. Acceptance: all enumerated supported cases fit or expose an operable overflow mechanism;
selection remains visible and each activation applies once. Extend actual renderer regressions and
production navigation tests; run full game verification and portfolio guards after runtime edits.
Human readability/physical-pad acceptance remains unclaimed.

### 2. ACCESS-03 — native hero and threat selection

**P1 usability improvement; M effort; medium risk. Executable now.** The shell accessibility contract
and `SemanticShell.ts` identify hero/threat selection as remaining canvas surfaces. Existing native
shell slices supply the implementation pattern; they do not make these screens semantic.

Benefit/scope: keyboard-operable character/difficulty selection with explicit locked, selected and
available states. Trace `ScreenFlow` and `ShellScene` actions; derive visible native controls from
that same state. Include hero description/unlock reason, threat modifiers, Back and Deploy. Preserve
portraits, earned unlock rules, mode-specific restrictions and deployment behavior. Synchronize
controller selection with DOM focus; remove semantic nodes/listeners on exit and restore return focus.

Reuse native shell styles, authored copy and existing portraits. No unlock shortcuts or new heroes.
Acceptance: accessible names/state exist, locked options cannot deploy, selection survives redraw,
Enter/Space activate once, Escape returns once and every visible control works. Add production-flow
and browser coverage for fresh/earned profiles, all modes, minimum size/4K and simulated pad/remaps;
full game/portfolio verification. Real AT speech and physical-device acceptance stays external.

### 3. STATE-02 — shop/event transaction and resume integration

**P1 reliability investigation; M effort; medium risk. Executable now.** Unit tests and browser
recovery tests already exist. The latest shop diagnostic primarily checks fit/navigation and the
content trace explicitly does not exercise every event effect end-to-end. No new save-loss defect
is asserted. First inventory coverage and add only missing cross-system cases.

Benefit/scope: prevent double spending, duplicated rewards and lost choices on resume. Exercise
production shop buy/sell/reroll/lock/ban and event cost/reward/ambush/leave paths with disposable
profiles; assert balances, inventories, node state and pending decisions across reload. Inject storage
write failure at meaningful transitions and test documented recovery without touching real saves.
Check import/export round trips through existing UI; do not invent a new save format or undo system.

Reuse save store, transaction consumers and fixtures; no assets. Dependencies: actual supported
save/resume boundaries, catalogue choice eligibility and existing failure policy. Acceptance: each
committed transaction applies once; reload agrees with the last committed state, unavailable choices
cannot spend, and failed persistence follows visible recoverable policy. Add real-consumer integration
and browser tests, then full game/portfolio checks for fixes. Desktop crash/power-loss/Steam-cloud
acceptance remains outside simulated storage tests.

### 4. CONTENT-02 — enemy, item and event exposure ledger

**P2; M effort; low risk as offline tooling. Executable now.** The previous trace covered 100 maps,
all nine node types, seven mini-bosses and 22 eligible world objects, but not every regular spawn,
item acquisition or event-effect consumer. It also found EXPOSURE-01: ordinary generated finales
select Bastion Eater rather than the existing regional alternatives.

Benefit/scope: identify genuinely unreachable or incomplete existing content before designing more.
Extend the existing trace using production selectors/resolvers. Report each ID's eligibility,
selection witness (seed/node/threat/mode), downstream consumer and intentional exclusion. Distinguish
catalogued, eligible, selected and actually executed; never call a finite-sample absence unreachable.
Target missing witnesses with bounded deterministic searches and source tracing. Record unsupported
cases explicitly. Verify event branch effects against existing runtime consumers rather than
reimplementing effects in the report.

Reuse catalogue data and Vite trace harness; no new enemies/items/assets or activation. Acceptance:
reproducible machine-readable ledger, stable ordering, explicit sample bounds, and no progression or
analytics writes. Check CLI determinism/error handling and selected witnesses through production
integration tests; no balance claims from synthetic frequency. Runtime defects, if reproduced,
receive separate bounded fixes and full checks. Real exposure/replay appeal remains unmeasured.

### 5. ACCESS-04 — native armory browsing and inspection

**P2 optional quality of life; M effort; medium risk. Ready after ACCESS-03 establishes the pattern.**
The accessibility contract lists Armory as canvas-only. Existing build pages already expose affinity;
this task must reuse that information rather than create another comparison or card system.

Benefit/scope: browse owned/locked equipment with clear names, effects and unlock state. Inventory
current armory actions and inspector consumers; bind semantic controls and details to existing IDs.
Preserve filters/pages if already implemented, stable selection on return, focus visibility and
single-action controller/pointer/keyboard behavior. Do not add search/filter features without a
catalogue-size and navigation case showing their value.

Reuse SemanticShell, inspection copy and icons; no art. Acceptance: every current armory action and
item detail is reachable without pointer, locked state is accurate, focus survives page changes and
no preview grants equipment. Test production navigation, sparse/full profiles, viewport changes,
shutdown cleanup and simulated pad; full game/portfolio checks. AT/device acceptance stays separate.

### 6. AUDIO-03 — production cue coverage and lifecycle diagnostics

**P2 investigation/polish; S–M effort; low risk for reporting, medium for fixes. Executable now.**
Live mute/gain and cleanup are already corrected. Listening is unavailable, so subjective mixing,
new cue selection and claims that feedback sounds good cannot be accepted. Existing cue catalogues,
maps, mixer and feedback tests provide objective contracts to inspect.

Benefit/scope: detect missing cue mappings/assets and leaked voices/timers. Trace actual emitted
combat/event/UI outcomes to mapped samples or intentional silence/fallback. Build a small coverage
report from production definitions and extend only missing lifecycle cases: mute/restore, scene exit,
retry, decode failure and concurrency limits. Fix proven missing dispatch or resource cleanup only.

Reuse all samples/synth fallback; no generated audio and no speculative volume rebalance. Acceptance:
all scoped emitted outcomes have documented routing or deliberate silence; muted/exited scenes leave
no unintended scheduled playback; fallbacks and limits retain behavior. Verify production audio
classes plus instrumented browser lifecycle and full checks for changes. Headphone/speaker quality
and masking remain unassessed.

### 7. EXPOSURE-01-DESIGN — regional finale compatibility design

**P2 design only; S–M effort; high implementation risk. Executable design now; activation gated.**
The [confirmed route gap](playtest-evidence/2026-10-23-content-review/README.md) justifies a concrete
compatibility proposal. Existing maps regenerate from seeds, so changing terminal selection could
change a saved run. Benefit: safely reuse existing regional bosses when variety gates eventually open.

Trace all finale callers, saved run fields and generation versions. Specify a versioned authored
selection policy, preservation of legacy seeds, migration/fallback behavior, map preview consistency,
rewards and replay expectations. Produce old/new fixture examples and a generator-to-descriptor-to-
combat test matrix. Compare minimally invasive options and document the selected design's tradeoffs.
Do not wire new production selection or migrate saves in this task.

Reuse existing bosses/art/audio. Acceptance: design accounts for every persisted input and caller,
legacy outcomes remain specified, and activation checklist names tests and rollback behavior.
Validate examples against current generation and save readers. Future implementation requires
VARIETY-01 gates (Runs 1–5 plus two weeks verified analytics), full checks and earned-route/hardware
acceptance. Design approval supplies none of that evidence.

### 8. CONTENT-03-DESIGN — one existing world-interaction specification

**P3 optional design; S effort; medium eventual implementation risk. Depends on CONTENT-02.**
Seven world interactions are intentionally unavailable; the trace must not treat their assets as
finished mechanics. Select at most one existing object whose missing behavior can be clearly bounded
from the ledger. If none has a worthwhile distinct use, record no-go rather than invent content.

Benefit/scope: a reviewable future interaction using existing art. Specify player verb, cost/reward,
counterplay, placement/collision, disabled state, input/accessibility text, feedback, deterministic
seed behavior, save/resume and exploit limits. Compare it with existing nodes/objects to avoid a
reskin with no new decision. Include a small state diagram, fixture scenarios and implementation
file map; estimate art/audio gaps explicitly without generating anything.

Acceptance: implementable design with observable success/failure states, measurable invariants,
existing-asset reuse decision and a clear no-go/activation gate. Validate references against actual
catalogue/placement/runtime code. Later coding requires separate scope and applicable variety/
expansion evidence gates, production tests and full checks; fun/readability stays unaccepted.
No new hero, card system, monster, region or terrain pack is added to the implementation queue.

## Acceptance dependencies — reference only, no available tester

These are not tasks assigned to Codex in the queue above and must not be reported as completed:
real listening; Runs 1–5/earned balance and learning observations; real screen-reader/controller;
motion and hardware acceptance of floors, equipment and hostile tells; packaged-device pacing,
save recovery and actual Steam/cloud behavior; verified live analytics.
See the [acceptance worksheet](ACCEPTANCE-WORKSHEET-2026-10-17.md),
[five-run procedure](local-playtest-plan-2026-08-21.md), [QA guide](QA-READINESS.md) and
[release handoff](RELEASE-HANDOFF-2026-10-16.md). Do not repeatedly request testers while unavailable.
Floors stay opt-in. Practice retains repeated-learning-failure gates. Variety retains observed runs
and two weeks of verified analytics. Expansion/new art retains its evidence and scope gates.
Claude owns specifically assigned packaging; Steam credentials/IDs and release authorization remain
external dependencies. No push, deployment, packaging or submission is authorized by this refresh.

## Execution and archive rules

Implement one bounded item at a time and record changed behavior, evidence, tests and residual limits.
Only reproduce/fix demonstrated defects within investigation tasks. Automated completion may close
a coding task while its external acceptance remains open in the worksheet. No synthetic human sign-off.
Preserve concurrent edits; stage explicit task paths and commit inside the nested website repository.
Do not modify the Expo fleet. Existing asset inventory, art bible, content specifications, release
notes and completed-work log are retained references. See [archive](archive/README.md) for superseded
queues/audits; their historical proposals do not reactivate themselves.
