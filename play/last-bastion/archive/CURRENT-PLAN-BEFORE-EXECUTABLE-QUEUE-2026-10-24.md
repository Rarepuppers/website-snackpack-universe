<!-- Historical queue, superseded by ../CURRENT-PLAN.md on 24 October 2026. -->
# Last Bastion — current plan

**Updated:** 24 October 2026. **Sole active execution queue.**
Prepared local identity: `web-2026.10.23-shop-fit`; shop/input continuation based on `1557dd91`, verified against HEAD `83ce5a07` with scoped working changes; audio implementation `a5313291`; earlier audit checkpoint `4238b130`. Save schema 16, simulation compatibility 3.
Last verified published identity: `web-2026.10.17-qa-readiness` (historical evidence, not rechecked live here).

Read the [22 October audit](AUDIT-REVIEW-2026-10-22.md) for each item's problem/evidence, benefit/scope, effort/risk, asset decision, implementation steps and acceptance checks. Read the [fresh evidence](../playtest-evidence/2026-10-22-audit-review/README.md), [acceptance worksheet](../ACCEPTANCE-WORKSHEET-2026-10-17.md), [QA guide](../QA-READINESS.md) and [release handoff](../RELEASE-HANDOFF-2026-10-16.md) before execution. The audit was planning-only. Subsequent continuation authorizes and implements AUDIO-02; see [completed audio scope](AUDIO-CONTROLS-IMPLEMENTATION-2026-10-22.md). Other gated proposals remain planning only.

## Current evidence and closed work

**24 October executable continuation completed:** SHOP-01 corrects minimum-viewport shop clipping;
INPUT-03 fixes duplicate keyboard navigation and consumed Enter confirmation. Phase 2 upgrade/shop
consumer review and a bounded Phase 4 production-exposure trace are complete. See the
[completed evidence and conditional recommendation](../playtest-evidence/2026-10-23-content-review/README.md).
Final verifier **PASS 139.9s: 1,795 unit / 314 files, 53 browser, 31 desktop-host tests** plus
static/output/offline/site checks. Portfolio **20/20 PASS** ran during this continuation, before
final input corrections; the final game verifier covers those corrections. No fleet maintenance.
EXPOSURE-01 identifies a regional-finale route gap; activation remains gated, not a quick fix.
Earlier verification paragraphs below are dated history, not evidence for this new identity.

**Phase 3 executable scope completed:** BAL-01 now runs the real simulation from the CLI,
validates inputs, reports final level honestly, marks unmeasured fields null, continues through
intermissions and separates completed/censored outcomes. The 240-row synthetic sample and
15-row boss preflight are retained in [Phase 3 evidence](../playtest-evidence/2026-10-23-phase-3/README.md).
Economy/unlock and fairness contracts were reviewed; no demonstrated gameplay tuning defect or
repeated learning failure warrants balance/practice changes. Human-dependent Phase 3 acceptance
remains open. Browser identity/output are unchanged; this is offline tooling/tests/documentation.
Fresh full verifier: **PASS 153.3s; 1,794 unit / 314 files, 52 browser, 31 desktop-host tests**,
including unchanged published-output comparison and offline/site checks.
The completed Phase 3 portfolio run passes **all 20 guards**; no fleet maintenance performed.

**Phase 2 onwards begun:** EVENT-01 fixes held-key result dismissal, covered choice activation
and unintended pad confirmation; adds pointer Continue using existing UI. Fresh verifier
**PASS 118.9s; 1,790 unit / 313 files, 52 browser, 31 desktop-host tests; portfolio 20/20**.
See [Phase 2 evidence and Phase 3–5 preflight](../playtest-evidence/2026-10-23-phase-2/README.md).
Map previews and debrief damage explanations already exist. No duplicate implementations planned.
Human acceptance remains open. BAL-01 reporting repair is now complete as described above;
the original Phase 2 evidence retains the pre-fix findings and limitations.

**23 October Phase 1:** Mark approved the phased recommendations and starting Phase 1.
Human testing is unavailable now. Phase 1 is in progress, not accepted; automated evidence and
the remaining owner actions are recorded in [Phase 1 evidence](../playtest-evidence/2026-10-23-phase-1/README.md).
Approval supplies no missing listening, observed-run, AT, hardware, Steam or analytics evidence.
Fresh full verifier at `3a1073c6`: **PASS, 122.2s; 1,790 unit / 313 files, 51 browser,
31 desktop-host tests**, static/output/offline/site checks. No new automated failure reproduced.
No runtime changes in this phase start. Prior portfolio results below remain dated, not rerun here.

**Audio continuation:** full verifier PASS in **130.8s**, **1,790 unit tests / 313 files,
51 browser cases and 31 desktop-host tests**, plus static/output/offline/site checks.
The completed continuation portfolio run also passes **all 20 guards**; no fleet dependency edits.
The [audio evidence](../playtest-evidence/2026-10-22-audio-controls/README.md) records exact scope.
AUDIO-02 implementation is complete locally; real listening remains the first acceptance action.
The audit results in the next paragraph predate this runtime patch.

Fresh full verifier: **PASS, 117.9s; 1,783 unit / 312 files, 50 browser, 31 desktop-host tests**, static/content/image/output, HTTP/offline and site checks. Fresh portfolio: **20/20 PASS**, superseding the earlier 19/20 observation for this run; no fleet dependency work performed. Inventory: 227 definitions / 310 source references match hashes. These checks do not establish real device, audio, screen-reader, Steam or observed-run acceptance.

Native title/menu/settings/How to Play/rebinding/records, capture ownership/repeat fixes, gallery repairs, 4K composition repair, affinity/map/build polish and QA/provenance tools are **implemented**. Do not reimplement them. Completed details remain in [archive](README.md), [release notes](../RELEASE-NOTES.md) and the [pre-audit plan snapshot](CURRENT-PLAN-BEFORE-AUDIT-2026-10-22.md). Earlier dated audits and asset/presentation plans are supporting specifications/history, not parallel queues.

## Ordered remaining queue

| Order / ID | Priority and state | Next action / owner | Gate to close |
|---|---|---|---|
| 1 AUDIO-02 acceptance | P1, implementation complete locally | Human tester listens to live gain/mute, rotary tails and restart/exit behavior | Actual headphone/speaker acceptance; automated implementation checks are recorded separately |
| 2 ACCEPT-02 / UX-01 | P1 observation; P2 conditional fixes | Mark/tester completes exact Runs 1–5 with earned unlocks; record teaching, mode purpose, fairness and replay intent | Existing five-run thresholds and signed findings; repeat affected combinations after fixes |
| 3 ART-01 | P1, acceptance open | Human + hardware tester compares baseline/A/B/kit on standard seed 61061 | Motion/readability/pacing accept/revise/reject; **keep floors opt-in** until passed |
| 4 ART-02 / LB-04 | P1, evidence-gated correction | Inspect hero/equipment state transitions and facings; identify failed frame/anchor | Signed motion acceptance; fix registration before generating frames |
| 5 CLARITY-01 / LB-07 | P1, evidence-gated correction | Observe earned mixed/bonus racks, hostile tells, hazards and nine map meanings | Safe lanes and node states understood, no obscured tell; preserve timing/radii |
| 6 ACCESS-01 / ACCESS-02 | P1; native acceptance open, further slice proposed | Real AT/controller test existing six surfaces; separately scope hero/threat selection next | Names/state/order, one activation, capture/focus/scrolling verified; no whole-game accessibility claim |
| 7 AUDIO-01 | P2, listening gate | Listen to production warnings/hits/outcomes and dense mix after AUDIO-02 | Named cue/mix failure before tuning or generating; preserve fallback/limits |
| 7a Phase 2 clarity follow-up | P2, executable review/fixes complete | EVENT-01, SHOP-01 and INPUT-03 delivered locally; upgrade/shop consumers reviewed; retain map/terrain/debrief human review | Human shop purchases/sales, minimum-size reading, event travel/pad/result acceptance still open |
| 7b Phase 3 acceptance | P2, executable preflight complete; observations pending | Use repaired BAL-01 reports as synthetic context; collect earned build/economy/unlock/fairness observations | No tuning on synthetic win counts alone; repeat comparable affected runs after demonstrated fixes; practice retains LEARN-01 gate |
| 8 PERF-02 / RELEASE-01 | P1 for release, external | Claude packages only when assigned; hardware/Steam owners test exact bytes | Manifest/hash/smoke, named-device pacing/display/input/save/audio and actual Steam evidence |
| 9 LEARN-01 | P2, closed to implementation pending evidence | Repeated observed learning failure + standing scope gate | One production-system practice sequence, no progression/Daily/achievement/metrics contamination |
| 10 VARIETY-01 | P3, closed to implementation pending evidence | Runs 1–5 + two weeks of verified live measurement | One existing-region variant, safe/fair/replay/save acceptance before production selection |
| 10a EXPOSURE-01 | P2 finding, gated activation | Existing regional finales are absent from the ordinary generated terminal path; define versioned selection policy only after VARIETY-01 gates | Preserve old seeded saves/replays; generator-to-combat witnesses, earned routes, counterplay/hardware checks; M effort/high risk, existing art/audio reused; [full scope](../playtest-evidence/2026-10-23-content-review/README.md) |
| 11 EXPAND-01 | Deferred | Separate case for heroes/regions/tiers/multiplayer/leaderboards/touch/overhauls | Existing evidence gates plus explicit scope; no speculative asset batch |

P0 crash/save loss/input dead ends interrupt this order if demonstrated. No new P0 was reproduced. Effort/risk and exact validation contracts are in the audit; every future runtime change requires relevant production regressions, full game verification and portfolio guards. No blanket refactor or performance downgrade without a measured problem.

## Executable now and external handoff

### Approved phases and additional review scopes

The ordered queue above retains its priority and gates. These approved subscopes make the
23 October recommendations explicit; they are not a second execution queue or confirmed defects.
Executable reviews and demonstrated fixes are recorded above. Remaining implementation must meet the applicable evidence and scope gates.

| Phase | Scope, in priority order | Entry/exit and asset policy |
|---|---|---|
| 1 — acceptance and demonstrated fixes | Audio listening; Runs 1–5; hostile/hazard/earned-rack readability; hero/equipment transitions; native AT/controller acceptance; exact-package hardware/save acceptance | Fresh executable checks support each area; humans sign perceptual/device results. Reproduce and fix demonstrated defects only. No new art required. |
| 2 — clarity and quality of life | Reward/card comparisons; nine map-node meanings; destructible/terrain readability; useful debrief information; minimum-size text/focus; cue/mix polish | Record the failed player decision or missing information, trace existing production consumers, then bound copy/layout/feedback fixes. Reuse inspection, symbols, atlases and samples; no separate card system. |
| 3 — balance and progression | Earned build viability; reward economy/unlock pacing; enemy-combination fairness; conditional practice | Comparable seeds/threats and observed outcomes; pick rate alone is not imbalance. Change one variable and repeat affected runs. Practice retains LEARN-01 gate and progression isolation. |
| 4 — existing-content variety | Production exposure of existing content; one regional encounter variant; one terrain/destructible variant; one event/reward variant; floor decision | VARIETY-01 requires Runs 1–5 and two weeks of verified measurement. A catalogue entry is not proof of shipping reachability. Test navigation/collision/replay/rewards and every offered effect. Floors remain opt-in pending motion/hardware acceptance. Reuse first. |
| 5 — expansion | One missing monster role; small differentiated item/relic/upgrade set; one world interaction; one genuinely distinct map node; one hero; then region/large expansion | Separate design/cost case after earlier gates. Specify counterplay, deterministic behavior, saves, progression, semantics, animation/audio and asset provenance. Unimplemented interaction effects stay unavailable. No speculative generation or production activation. |

For every resulting change, attach problem/evidence, player benefit, bounded steps, effort/risk,
dependencies, reuse versus generation decision and measurable acceptance before implementation.
Use production regressions plus full game/portfolio checks for runtime changes; human/device
checks stay separate. Review/specification work is available now; content activation is gated.

- **Now:** approved executable review/fix slices are complete. Further read-only tracing of regular enemy spawns, item acquisition and event effects is possible if a concrete exposure question needs answering; the bounded sample is not a full census. No remaining demonstrated ungated runtime defect is queued. Human audio/shop/event/native AT and earned progression/fairness acceptance await a tester. Phase 4 variety (including EXPOSURE-01) and Phase 5 expansion retain their gates; approval alone does not open them.
- **Mark / human tester:** return Runs 1–5 with build/commit, hero/threat/weapon IDs, controller/remaps, display/DPR/scaling, sound output, confusion/damage findings and clips. Sign or explicitly accept touched S1/S2 presentation issues; Run 0 and diagnostics do not count.
- **AT/controller/audio tester:** return actual spoken control output, focus/capture failures, physical hot-plug/navigation and listening notes by cue/screen. Automated semantic trees and simulated pads are separate evidence.
- **Claude, when specifically assigned:** from `desktop/`, use existing `npm run package:win` and `npm run smoke:package:win` after reading release guidance/current changes. Return source/dirty status, build identity, manifest, executable SHA-256, package path/time and complete smoke log. No packaging command has run in this audit.
- **Hardware owner:** test that exact package at Full HD/4K, ultrawide/Deck shape and Windows 100/125/150/200%; record GPU/driver, 15-minute dense p95/p99/hitches/memory, input/audio/focus/resume/display and offline save recovery. Agree numeric thresholds from baselines. Native 4K60 remains a target.
- **Steam owner:** supply real App/Depot IDs, partner access and controller configuration exports; validate achievements, cloud conflicts/recovery, overlay and Steam-down fallback in actual client. No substitute App 480 acceptance.
- **Dashboard owner:** verify opened/start/wave-1/wave-5/end/next-local-day return, optional individual pageviews disabled, and record first verified measurement date. Two weeks start there, not at an old deploy date.
- **Release owner:** obtain specific publication authorization, review the whole outgoing nested-repo range including concurrent commits, then verify served identity/privacy/offline upgrade and CI. This audit authorizes no push/deploy/package/submit.

## Boundaries

Preserve other sessions' edits and retained masters. Commit only scoped fixes/review, generated browser output, tests and documentation/evidence in the nested website repository. No generated art, floor adoption, balance changes or fleet dependency maintenance without their documented gates. Acceptance of this plan supplies none of the missing observed/hardware/Steam/analytics evidence. [The five-run matrix](../local-playtest-plan-2026-08-21.md), [presentation register](../presentation-defect-plan-2026-08-23.md) and [asset specifications](../ASSET-IMPROVEMENT-PLAN-2026-10-16.md) define procedures; this file owns queue state.
