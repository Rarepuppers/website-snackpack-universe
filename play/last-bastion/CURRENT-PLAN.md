# Last Bastion — current development plan

**Updated 4 November 2026. Sole active queue. All five ungated audit tasks are complete locally.**
Prepared runtime: `web-2026.11.03-event-results`; schema 17; simulation compatibility 3.
The identity retains the implementation start date. No executable package, push or deployment.

## Completed implementation

| Task | Delivered player behavior | Evidence |
|---|---|---|
| E1 | Unsupported hunt/echo offers cannot charge or promise an active reward. Working alternatives and Leave remain. | [Phase 1](playtest-evidence/2026-11-03-event-integrity/README.md) |
| E2 | Affinity exchanges validate all requested grants before spending; path/rank/apex failures preserve resources. Gambles are not filtered or rerolled. | [Phase 1](playtest-evidence/2026-11-03-event-integrity/README.md) |
| E3 | Designed Arrival requires and consumes one owned relic for a legal affinity grant. | [Phase 1](playtest-evidence/2026-11-03-event-integrity/README.md) |
| U1 | Actual applied-build deltas use catalogue names for weapons, relics, upgrades, affinity, artifacts, kits and resources. Long results page without covering Continue. Actual expedition and review consumers share the panel. | [Result clarity](playtest-evidence/2026-11-03-event-results/README.md) |
| U2 | Duplication Vat explains non-stacking effects and spare-copy sacrifices; results show copy counts. Existing stacking and save behavior remain. | [Result clarity](playtest-evidence/2026-11-03-event-results/README.md) |

Completed G1–G6 from October remain complete. The [audit](playtest-evidence/2026-11-02-audit/README.md)
retains findings and content/asset analysis. The [pre-closeout queue](archive/CURRENT-PLAN-BEFORE-UNGATED-CLOSEOUT-2026-11-04.md)
retains implementation contracts; it is not an active queue. Phase 1 was committed as `734f430c`.

Batch 1 correctness/usability/polish is complete. Batch 2's justified content work is G7 then G8,
subject to the gates below. Batch 3's independent recommendations were incorporated in that order;
no larger expansion or speculative extra work is justified. Approval does not waive evidence gates.

## Phase 3 — improve existing content (gated)

### G7 — versioned regional finales

**Evidence/class:** Optional content improvement from confirmed exposure limitation: five fresh production seeds still end at Bastion Eater, although Choir/Sovereign selectors, simulation, art and audio exist. Follow the [completed design and legacy fixtures](playtest-evidence/2026-10-29-design-closeout/README.md); do not redesign it.

**Benefit/scope:** Distinct endings through three existing boss policies; no topology/reward/threat overhaul, new boss or new asset batch.

**Priority/phase/dependencies/effort/risk:** P2, Phase 3; 3–5 days after gate; high save/balance risk. Design complete; **implementation/exposure gated** by observed Runs 1–5 and two verified analytics weeks. E1–U2 are complete; the external evidence gate is still required. Recommendation approval does not supply evidence.

**Implementation:** Freeze v1 generator/RNG; absent persisted version means v1; choose and persist v2 finale policy once using separately salted selection; unify preview/name/portrait/descriptor/combat/reward; preserve future-version recovery/export; rollback stops new v2 creation while retaining resume.

**Acceptance:** Five v1 fixtures remain logically identical; v2 identity survives reload; preview matches actual boss; artifact confirmation blocks travel; failed-write retries and rollback preserve reward/run identity.

**Automated checks:** Production generator fixtures, migration/cloud/replay compatibility, actual descriptor→boss→reward integration and browser save handoff; broader game checks appropriate to generator changes. Reuse existing boss/effect/audio assets.

**External:** Required runs and analytics before activation, then earned-route fairness, warning readability, physical controls/listening and target-hardware pacing. These remain NOT RUN.

## Phase 4 — bounded new gameplay (gated)

### G8 — one finite teleporter-disruption pilot

**Evidence/class:** Optional tactical feature, not an AI defect. Teleporter is correctly excluded because no owned spawn stream exists. Open-loot/open-gate/harvest-scrap already work. Use the [completed specification](playtest-evidence/2026-10-29-design-closeout/README.md).

**Benefit/scope:** Suppress a finite threat source, destroy it or move on. One object/owned stream from existing encounter budget; no endless reinforcements, new monster, currency or all-seven-interactions activation.

**Priority/phase/dependencies/effort/risk:** P3, Phase 4 after G7 stability; 4–7 days after gate; medium/high navigation/spawn risk. Design complete; **implementation/exposure gated** by standing variety/content evidence. Existing conduit fallback/effects suffice for an internal pilot, subject to identification acceptance.

**Implementation:** Reserve finite budget/owner; dormant→telegraph→active→exhausted, with disrupted/destroyed terminals; 2 s hold/500 durability are initial test inputs only; interrupt on range/damage; cancel queued spawns on terminal/teardown; retain 2.4×2.4 m footprint/escape route; retry uses existing deterministic node-boundary restart, not new mid-combat saves.

**Acceptance:** Finite deterministic count, no post-terminal spawns or duplicate payout, accessible approach/escape, correct pause/interruption/destruction ordering, labelled non-colour-only state, no restart credit farming.

**Automated checks:** Production placement/navigation/interaction/combat and presenter/audio checks, browser hold/cancel/retry/node persistence, bounded density profile and appropriate full game verification before handoff.

**External:** Runs/analytics/content gate, then motion identification, physical interaction burden, listening and hardware pacing. Only a named fallback-art failure justifies a measured asset brief; no generation now.

## Phase 5 — optional larger directions

No implementation task justified. A region-specific campaign/NPC arc requires evidence that G7 leaves a meaningful repetition problem, an explicit region-sized scope and standing expansion/art gates. Do not commission a cast, terrain set, disconnected cards or progression currency from catalogue size alone.

## No remaining ungated implementation tasks

E1–E3 and U1–U2 are complete locally. Reopen them only for a reproduced regression.
G7/G8 designs already exist; do not manufacture more audit or content work while their gates
remain unmet. No human testers are available, so retain external dependencies without repeated requests.

## External gates and release boundary

- G7/G8 require observed Runs 1–5 per [worksheet](ACCEPTANCE-WORKSHEET-2026-10-17.md) plus two actual analytics weeks after receipt of opened/start/wave-1/wave-5/end/next-day-return is verified and a start date recorded. No such evidence supplied here.
- Floors remain opt-in pending named motion/hardware acceptance. Practice requires repeated observed learning failures. New art/expansion requires demonstrated gaps, bounded scope and existing gates. Retain art/environment/object contracts.
- Real controller/hotplug, screen reader, listening and target GPU/4K/15-minute pacing remain external. Do not repeatedly request unavailable testers or substitute automated checks for acceptance.
- Steam requires actual App/Depot IDs, partner account and client achievements/cloud/conflict/controller tests. Host/platform tests and App 480 are insufficient.
- Claude owns production/executable packaging; [release handoff](RELEASE-HANDOFF-2026-10-16.md) remains the contract. No package, deploy, submission, merge of diverged main or push in this implementation slice.
- Final U1/U2 checks: 184 focused unit tests/10 files, eight targeted browser checks (including warmed offline boot), build/typecheck, 27-output source comparison, offline static delivery and 75-file site syntax/cache policy checks pass. Phase 1 full unit result (1,821/318) and the earlier audit have separately dated evidence; no new full browser/host/portfolio/human/Steam claim.
- Commit only task-relevant audit documents/evidence in the nested repository, preserving concurrent work. The remote review branch stays at the previous checkpoint until separately published.

The [completed log](last-bastion-log.md), [archive index](archive/README.md), asset inventory, acceptance worksheet and release contracts remain references. Only this document schedules future implementation.
