# Last Bastion — current development plan

**Updated 3 November 2026. Sole active queue. Phase 1 implementation complete locally.**
Prepared runtime: `web-2026.11.03-event-integrity`; schema 17; simulation compatibility 3.
Audit baseline was `69914456`; implementation starts from `343cd595`. See the [audit](../playtest-evidence/2026-11-02-audit/README.md) and [Phase 1 implementation evidence](../playtest-evidence/2026-11-03-event-integrity/README.md).

Newly reproduced event defects supersede the previous conclusion that no ungated work remained.
Completed G1–G6 stays complete: stash, supported transformation filtering, build explanations,
shop polish, native selection/armory, event/map/run-end/boss-confirm recovery. The [archived queue](../archive/CURRENT-PLAN-BEFORE-AUDIT-2026-11-02.md) retains delivery links. Do not reimplement those slices.

## Three development batches and recommended order

1. **Batch 1 — correctness, usability and polish:** Phases 1–2 below. Stop invalid event exchanges, then explain actual results. No new assets or human testers are needed to implement these corrections.
2. **Batch 2 — existing content and bounded gameplay:** Phases 3–4 reuse existing regional bosses, then one teleporter pilot, after their evidence gates. Five heroes, 31 draftable weapons, seven shop profiles and 54 event/shrine definitions already supply substantial content; integration quality outranks catalogue expansion.
3. **Batch 3 — independent recommendations:** event honesty first; result clarity second; existing boss reuse as the best medium feature. The audit ranks these against alternatives. No independent generic backlog or unsupported larger expansion.

P1 prevents resource loss/reward exploits; P2 improves trust/readability/content value; P3 is optional.
Effort means focused developer time excluding release/external acceptance. “Actionable now” means
independently implementable without human testers; external content gates remain unchanged.

## Phase 1 — completed event integrity corrections

| Task | Delivered behavior |
|---|---|
| E1 | Hunt/echo offers without consumers are locked with an explanation. Stable event/choice IDs, supported alternatives and Leave remain. Direct resolver calls cannot apply these exchanges. |
| E2 | Shared offer/resolver preflight checks the complete affinity grant before costs. Path lock, rank cap, apex and partial multi-grant failure preserve the build. A gamble is unavailable if any branch cannot honor its grant; no branch filtering or reroll changes its odds. |
| E3 | Designed Arrival requires an owned relic and a legal affinity grant; a valid exchange consumes exactly one copy. |

[Implementation and acceptance evidence](../playtest-evidence/2026-11-03-event-integrity/README.md):
1,821 unit tests/318 files pass; six new browser cases plus three relevant existing browser cases
pass; typecheck/web build, 25-output source comparison, offline static delivery and 75-file site
JavaScript checks pass. Screenshots confirm minimum-viewport locked-state explanations. These are
local automated results, not physical-controller, screen-reader, hardware, listening or Steam acceptance.
No new art, content activation, save schema, simulation compatibility, package or deployment.
U1/U2 remain below; this slice does not claim the broader result-summary work is done.

## Phase 2 — usability, quality of life and visible polish

### U1 — show actual event build changes

**Evidence/class:** Confirmed usability defect F4 and inspected audit screenshot. The event result summary omits weapon, direct relic-array, upgrade and transformation changes. The audited weapon-loss result said “You move on.” E1 now blocks unsupported hunt/echo promises; supported build changes still need complete summaries.

**Benefit/scope:** Players can understand what they paid and received. Extend the current result panel; do not create a new decision mechanic or modal framework.

**Priority/phase/dependencies/effort/risk:** P2, Phase 2 after E1–E3; 1–2 days; medium layout risk. **Actionable now.** Existing renderer/catalogue names, no new art/audio.

**Implementation:** Derive bounded ordered deltas from before and fully applied after-build; name changed weapons/tiers/counts, relic copies/sacrifices, upgrades and affinity/ranks as well as resources. Distinguish rejected outcomes from success. Wrap or page only if needed; preserve reachable Continue, fresh-confirm protection and save recovery. Do not surface raw IDs or unconsumed promises.

**Acceptance:** Result deltas match saved build for Cybernetics, duplication, Designed Arrival, Serum and Echo rejection. No meaningful build change reports only “You move on.” No clipped content/covered Continue at 960×540 and sampled 1080p/4K/DPR. One confirmation cannot choose an underlying card.

**Automated checks:** Production outcome-to-presentation cases, actual browser result/bounds captures, keyboard/pointer/simulated-pad confirmation and reload equality. Reuse passing recovery checks while their inputs are unchanged.

**External:** Physical controller and real screen-reader acceptance remain separate; canvas improvements do not establish whole-game semantic accessibility. No human blocker to coding.

### U2 — explain duplicate relics without changing stacking

**Evidence/class:** Optional quality-of-life improvement F5. Duplication Vat adds an ID; `relicCatalog.ts:242` intentionally applies each relic effect once. Production modifiers remain identical before/after duplication. Current wording leaves this distinction implicit.

**Benefit/scope:** Informed choice about a spare sacrifice copy; preserve combat stacking and reward rules.

**Priority/phase/dependencies/effort/risk:** P2, Phase 2 after U1; 0.25–0.5 day; low risk. **Actionable now.** Text/count display only; no generated assets.

**Implementation:** State that effects do not stack and explain the spare-copy use in existing offer/inspection space; use U1 to show count change; ensure removing one copy keeps the remaining effect. Do not invent an extra combat benefit.

**Acceptance:** Offer/result distinguish count from effects; copy→sacrifice one retains one effect, losing the last removes it; minimum viewport fits; no schema/balance change.

**Automated checks:** Actual relic-modifier/removal behavior, Duplication Vat save/reload and bounded offer/result geometry. No broad suite for copy-only refinement.

**External:** Improved comprehension is a hypothesis pending player observation, but stating existing semantics requires no tester.

## Phase 3 — improve existing content (gated)

### G7 — versioned regional finales

**Evidence/class:** Optional content improvement from confirmed exposure limitation: five fresh production seeds still end at Bastion Eater, although Choir/Sovereign selectors, simulation, art and audio exist. Follow the [completed design and legacy fixtures](../playtest-evidence/2026-10-29-design-closeout/README.md); do not redesign it.

**Benefit/scope:** Distinct endings through three existing boss policies; no topology/reward/threat overhaul, new boss or new asset batch.

**Priority/phase/dependencies/effort/risk:** P2, Phase 3; 3–5 days after gate; high save/balance risk. Design complete; **implementation/exposure gated** by observed Runs 1–5 and two verified analytics weeks. Land E1–U1 first. Recommendation approval does not supply evidence.

**Implementation:** Freeze v1 generator/RNG; absent persisted version means v1; choose and persist v2 finale policy once using separately salted selection; unify preview/name/portrait/descriptor/combat/reward; preserve future-version recovery/export; rollback stops new v2 creation while retaining resume.

**Acceptance:** Five v1 fixtures remain logically identical; v2 identity survives reload; preview matches actual boss; artifact confirmation blocks travel; failed-write retries and rollback preserve reward/run identity.

**Automated checks:** Production generator fixtures, migration/cloud/replay compatibility, actual descriptor→boss→reward integration and browser save handoff; broader game checks appropriate to generator changes. Reuse existing boss/effect/audio assets.

**External:** Required runs and analytics before activation, then earned-route fairness, warning readability, physical controls/listening and target-hardware pacing. These remain NOT RUN.

## Phase 4 — bounded new gameplay (gated)

### G8 — one finite teleporter-disruption pilot

**Evidence/class:** Optional tactical feature, not an AI defect. Teleporter is correctly excluded because no owned spawn stream exists. Open-loot/open-gate/harvest-scrap already work. Use the [completed specification](../playtest-evidence/2026-10-29-design-closeout/README.md).

**Benefit/scope:** Suppress a finite threat source, destroy it or move on. One object/owned stream from existing encounter budget; no endless reinforcements, new monster, currency or all-seven-interactions activation.

**Priority/phase/dependencies/effort/risk:** P3, Phase 4 after G7 stability; 4–7 days after gate; medium/high navigation/spawn risk. Design complete; **implementation/exposure gated** by standing variety/content evidence. Existing conduit fallback/effects suffice for an internal pilot, subject to identification acceptance.

**Implementation:** Reserve finite budget/owner; dormant→telegraph→active→exhausted, with disrupted/destroyed terminals; 2 s hold/500 durability are initial test inputs only; interrupt on range/damage; cancel queued spawns on terminal/teardown; retain 2.4×2.4 m footprint/escape route; retry uses existing deterministic node-boundary restart, not new mid-combat saves.

**Acceptance:** Finite deterministic count, no post-terminal spawns or duplicate payout, accessible approach/escape, correct pause/interruption/destruction ordering, labelled non-colour-only state, no restart credit farming.

**Automated checks:** Production placement/navigation/interaction/combat and presenter/audio checks, browser hold/cancel/retry/node persistence, bounded density profile and appropriate full game verification before handoff.

**External:** Runs/analytics/content gate, then motion identification, physical interaction burden, listening and hardware pacing. Only a named fallback-art failure justifies a measured asset brief; no generation now.

## Phase 5 — optional larger directions

No implementation task justified. A region-specific campaign/NPC arc requires evidence that G7 leaves a meaningful repetition problem, an explicit region-sized scope and standing expansion/art gates. Do not commission a cast, terrain set, disconnected cards or progression currency from catalogue size alone.

## Next independently executable tasks

**U1 truthful event result deltas → U2 duplicate-relic explanation.** E1–E3 are complete;
reopen only for a reproduced regression. No additional ungated content task is justified.

## External gates and release boundary

- G7/G8 require observed Runs 1–5 per [worksheet](../ACCEPTANCE-WORKSHEET-2026-10-17.md) plus two actual analytics weeks after receipt of opened/start/wave-1/wave-5/end/next-day-return is verified and a start date recorded. No such evidence supplied here.
- Floors remain opt-in pending named motion/hardware acceptance. Practice requires repeated observed learning failures. New art/expansion requires demonstrated gaps, bounded scope and existing gates. Retain art/environment/object contracts.
- Real controller/hotplug, screen reader, listening and target GPU/4K/15-minute pacing remain external. Do not repeatedly request unavailable testers or substitute automated checks for acceptance.
- Steam requires actual App/Depot IDs, partner account and client achievements/cloud/conflict/controller tests. Host/platform tests and App 480 are insufficient.
- Claude owns production/executable packaging; [release handoff](../RELEASE-HANDOFF-2026-10-16.md) remains the contract. No package, deploy, submission, merge of diverged main or push in this implementation slice.
- Fresh audit: 419 unit tests/52 files, 10 existing browser checks, six real-event witnesses, one bounded density profile and image/boundary checks pass. Historical 1,810/70/31/23 counts are not renewed. Host/full portfolio/offline/rebuild/human/Steam checks were not rerun; see dated coverage limits.
- Commit only task-relevant audit documents/evidence in the nested repository, preserving concurrent work. The remote review branch stays at the previous checkpoint until separately published.

The [completed log](../last-bastion-log.md), [archive index](../archive/README.md), asset inventory, acceptance worksheet and release contracts remain references. Only this document schedules future implementation.
