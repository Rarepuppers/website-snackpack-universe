# Last Bastion — current plan

**Updated:** 23 October 2026. **Sole active execution queue.**
Prepared local identity: `web-2026.10.22-audio-controls`; audio implementation based on `328cc8d3`; earlier audit checkpoint `4238b130`. Save schema 16, simulation compatibility 3. Later concurrent website commits did not change the audited game files at review time.
Last verified published identity: `web-2026.10.17-qa-readiness` (historical evidence, not rechecked live here).

Read the [22 October audit](AUDIT-REVIEW-2026-10-22.md) for each item's problem/evidence, benefit/scope, effort/risk, asset decision, implementation steps and acceptance checks. Read the [fresh evidence](playtest-evidence/2026-10-22-audit-review/README.md), [acceptance worksheet](ACCEPTANCE-WORKSHEET-2026-10-17.md), [QA guide](QA-READINESS.md) and [release handoff](RELEASE-HANDOFF-2026-10-16.md) before execution. The audit was planning-only. Subsequent continuation authorizes and implements AUDIO-02; see [completed audio scope](archive/AUDIO-CONTROLS-IMPLEMENTATION-2026-10-22.md). Other gated proposals remain planning only.

## Current evidence and closed work

**Audio continuation:** full verifier PASS in **130.8s**, **1,790 unit tests / 313 files,
51 browser cases and 31 desktop-host tests**, plus static/output/offline/site checks.
The completed continuation portfolio run also passes **all 20 guards**; no fleet dependency edits.
The [audio evidence](playtest-evidence/2026-10-22-audio-controls/README.md) records exact scope.
AUDIO-02 implementation is complete locally; real listening remains the first acceptance action.
The audit results in the next paragraph predate this runtime patch.

Fresh full verifier: **PASS, 117.9s; 1,783 unit / 312 files, 50 browser, 31 desktop-host tests**, static/content/image/output, HTTP/offline and site checks. Fresh portfolio: **20/20 PASS**, superseding the earlier 19/20 observation for this run; no fleet dependency work performed. Inventory: 227 definitions / 310 source references match hashes. These checks do not establish real device, audio, screen-reader, Steam or observed-run acceptance.

Native title/menu/settings/How to Play/rebinding/records, capture ownership/repeat fixes, gallery repairs, 4K composition repair, affinity/map/build polish and QA/provenance tools are **implemented**. Do not reimplement them. Completed details remain in [archive](archive/README.md), [release notes](RELEASE-NOTES.md) and the [pre-audit plan snapshot](archive/CURRENT-PLAN-BEFORE-AUDIT-2026-10-22.md). Earlier dated audits and asset/presentation plans are supporting specifications/history, not parallel queues.

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
| 8 PERF-02 / RELEASE-01 | P1 for release, external | Claude packages only when assigned; hardware/Steam owners test exact bytes | Manifest/hash/smoke, named-device pacing/display/input/save/audio and actual Steam evidence |
| 9 LEARN-01 | P2, closed to implementation pending evidence | Repeated observed learning failure + standing scope gate | One production-system practice sequence, no progression/Daily/achievement/metrics contamination |
| 10 VARIETY-01 | P3, closed to implementation pending evidence | Runs 1–5 + two weeks of verified live measurement | One existing-region variant, safe/fair/replay/save acceptance before production selection |
| 11 EXPAND-01 | Deferred | Separate case for heroes/regions/tiers/multiplayer/leaderboards/touch/overhauls | Existing evidence gates plus explicit scope; no speculative asset batch |

P0 crash/save loss/input dead ends interrupt this order if demonstrated. No new P0 was reproduced. Effort/risk and exact validation contracts are in the audit; every future runtime change requires relevant production regressions, full game verification and portfolio guards. No blanket refactor or performance downgrade without a measured problem.

## Executable now and external handoff

- **Now:** perform AUDIO-02 listening acceptance; start native AT acceptance and observed play using the existing worksheet and disposable/exported saves. No further QA tool is needed. Automation, inventory checking and local captures are executable without Steam access. This audit's documentation cleanup is complete.
- **Mark / human tester:** return Runs 1–5 with build/commit, hero/threat/weapon IDs, controller/remaps, display/DPR/scaling, sound output, confusion/damage findings and clips. Sign or explicitly accept touched S1/S2 presentation issues; Run 0 and diagnostics do not count.
- **AT/controller/audio tester:** return actual spoken control output, focus/capture failures, physical hot-plug/navigation and listening notes by cue/screen. Automated semantic trees and simulated pads are separate evidence.
- **Claude, when specifically assigned:** from `desktop/`, use existing `npm run package:win` and `npm run smoke:package:win` after reading release guidance/current changes. Return source/dirty status, build identity, manifest, executable SHA-256, package path/time and complete smoke log. No packaging command has run in this audit.
- **Hardware owner:** test that exact package at Full HD/4K, ultrawide/Deck shape and Windows 100/125/150/200%; record GPU/driver, 15-minute dense p95/p99/hitches/memory, input/audio/focus/resume/display and offline save recovery. Agree numeric thresholds from baselines. Native 4K60 remains a target.
- **Steam owner:** supply real App/Depot IDs, partner access and controller configuration exports; validate achievements, cloud conflicts/recovery, overlay and Steam-down fallback in actual client. No substitute App 480 acceptance.
- **Dashboard owner:** verify opened/start/wave-1/wave-5/end/next-local-day return, optional individual pageviews disabled, and record first verified measurement date. Two weeks start there, not at an old deploy date.
- **Release owner:** obtain specific publication authorization, review the whole outgoing nested-repo range including concurrent commits, then verify served identity/privacy/offline upgrade and CI. This audit authorizes no push/deploy/package/submit.

## Boundaries

Preserve other sessions' edits and retained masters. Commit only scoped AUDIO-02 code, generated browser output, tests and documentation/evidence in the nested website repository. No generated art, floor adoption, balance changes or fleet dependency maintenance. AUDIO-02 changes existing playback only. Acceptance of this plan supplies none of the missing observed/hardware/Steam/analytics evidence. [The five-run matrix](local-playtest-plan-2026-08-21.md), [presentation register](presentation-defect-plan-2026-08-23.md) and [asset specifications](ASSET-IMPROVEMENT-PLAN-2026-10-16.md) define procedures; this file owns queue state.
