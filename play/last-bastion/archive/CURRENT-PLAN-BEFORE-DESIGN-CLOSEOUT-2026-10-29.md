> Historical queue snapshot. Superseded by [CURRENT-PLAN](../CURRENT-PLAN.md).

# Last Bastion — current development plan

**Updated 29 October 2026. Sole active queue.** Prioritize player-facing code, gameplay quality
and useful existing content. Automated checks support delivery; they are not the product roadmap.
Current prepared runtime: `web-2026.10.28-run-save-recovery`, schema 17; G1–G5 complete; G6 recovery fixes verified; transaction acceptance verified; next: G7 integration design. Check Git before implementation; shared checkout has concurrent edits.
No human testers available. Implementation is approved; evidence gates remain unchanged.

## Current audit findings

- **Fixed production handoff defect — G1:** selecting Store in stash in weapon-gate accepts
  a Scattergun, but `expeditionBuildFromCombatSnapshot` serializes only rack weapons. A new
  CombatSimulation constructed from that build has an empty stash. Fresh executable witness:
  [26 October review](../playtest-evidence/2026-10-26-gameplay-review/README.md).
- **Resolved production exposure — G2:** Cybernetics Bay no longer grants Targeting Suite
  with an inert Shock drawback. Acidic Secretions has no production event grant. Legacy IDs and
  effects remain intact; unsupported review/legacy costs are not claimed as implemented.
- **Implemented presentation improvement — G3:** existing BuildOverlay now exposes item copy
  counts and per-copy effects, plus relic/artifact descriptions. No duplicate inspector was added.
- **Resolved polish — G4:** shop navigation now uses text controls and bounded rows/pages;
  frame spacing and same-ID refresh continuity are fixed. Dated implementation evidence is below.
- **Resolved shell gap — G5:** hero/perk/threat and armory controls are now native.
  Native title/menu/settings/help/rebinding/records already exist.
- **Existing-content route gap — G7:** the map's final ARENA_THEMES entry selects Bastion Eater.
  Existing Choir/Sovereign selectors do not receive an ordinary generated finale through that path.
  Earlier fixtures passing is not proof of normal route exposure. Existing content should be considered
  before new monsters or regions.

These findings are bounded. This review did not measure fun, difficulty, retention, audio quality,
real devices or a complete run. The new stash witness is fresh; earlier tests remain dated evidence.

## Phase A — fix lost progress and make existing builds understandable

### G1 — completed: preserve stashed equipment between encounters

Implemented schema-17 ordered stash persistence and combat restoration, including safe legacy
loading and occupied bonus-slot retention. Eight targeted integration cases pass; the full game
verifier, 59 browser checks and all 23 portfolio guards pass. See
[implementation evidence](../playtest-evidence/2026-10-27-stash-persistence/README.md).
No new assets, balance changes or hardware/cloud acceptance. **Next: G6 transaction reliability and G7 integration design after G5 completion.**

### G2 — completed: truthful production transformation offers

Removed Cybernetics Bay's Targeting Suite offer because its Shock drawback is unsupported;
retained Shield Lattice/Leave and preserved saved Targeting Suite histories and effects.
Acidic Secretions has no normal production grant. Corrected Regenerative Glands copy to
match the existing passive healing tick. No speculative replacement costs or combat tuning.
[Source/consumer map and evidence](../playtest-evidence/2026-10-27-transformation-offers/README.md).
Full game verification and all 23 portfolio guards pass. G3 is also complete; next is G6/G7 after G5 completion.

### G3 — completed: explain current build effects and ownership

Existing build inspector now includes paged owned items with copy counts and per-copy benefits/
penalties, plus authored relic/artifact effects. Shop item offers show NEW/OWNED N and preserve
LOCKED status. Upgrade rewards already show next rank; estimated DPS stays labelled estimated.
No new inventory system, score, assets or balance changes. Production renderer bounds pass
318 cases, including locked offers with two-digit copy counts. Full game verification and all 23 portfolio guards pass. G4 is also complete; next: G6/G7 after G5 completion.
[Implementation evidence](../playtest-evidence/2026-10-27-build-effects/README.md).

## Phase B — improve selection, shopping and run flow

### G4 — completed: shop navigation, spacing and refresh continuity

Navigation now uses text-only controls; compact footer and bounded pages keep choices inside the
frame without cutting copy or shrinking fonts. Back/Leave repeats on every oversized page.
Fresh renderer evidence confirmed stale text on same-ID updates; full presentation changes now
refresh labels while retaining a surviving enabled selection, clamping pages and falling back to
Back/Leave when it disappears. Full game verification and all 23 portfolio guards pass; 352 renderer cases pass. [Implementation evidence](../playtest-evidence/2026-10-27-shop-polish/README.md).
G5 is complete below; next is G6/G7.

### G5 — completed: native selection and armory

Hero/perk/threat selection provides readable dossiers, actual locks, guarded deployment and native
loading/retry controls. [Selection evidence](../playtest-evidence/2026-10-28-native-selection/README.md).

Native armory now exposes all six released nodes with separate inspection and purchase/equip,
actual costs, balance, prerequisite/shortfall explanations, owned/equipped/clearance status and Back.
Reuses existing ScreenFlow progression and save effects. Three targeted browser tests pass:
locked purchases, one-time spending, all nodes, equip/reload persistence, minimum/4K layout,
simulated pad, and failed-write retry without duplicate charges.
[Armory evidence](../playtest-evidence/2026-10-28-native-armory/README.md).
Full verification passes: 1,808 unit tests, 64 browser checks, 31 desktop-host tests and all 23
portfolio guards. Real AT/controller acceptance remains external.
No new tree, art, unlock shortcuts or progression tuning.

### G6 — transaction and reward reliability alongside gameplay changes

**Completed verified slice:** event reward commit previously navigated to the map
on a failed storage write, discarding the in-memory result. A fresh browser regression reproduced
it. Native recovery now retains the result, retries only persistence and navigates after success;
node credit/reward application occurs once. Full verification passes: 1,808 unit tests, 65 browser
checks, 31 desktop-host tests and all 23 portfolio guards. [Evidence](../playtest-evidence/2026-10-28-event-save-recovery/README.md).
**Map travel slice completed and verified:** a fresh browser witness showed combat
launch after a failed pending-position save. Shared native save recovery now holds the selected
route until persistence succeeds, with map inputs blocked during recovery. Event regression still
passes. Full verification: 1,808 unit tests, 66 browser checks, 31 desktop-host tests and all
23 portfolio guards pass. [Map evidence](../playtest-evidence/2026-10-28-map-save-recovery/README.md).
**Run-end slice completed and verified:** Quick Drop End Run with failed writes now
retains records until retry succeeds, without duplicate credit. Automatic navigation and terminal
Restart use the existing recovery helper, also wired to expedition completion. Only Quick Drop
abandonment has an independent runtime failure witness so far. Full verification passes: 1,808
unit tests, 67 browser checks, 31 desktop-host tests and all 23 portfolio guards. [Evidence](../playtest-evidence/2026-10-28-run-save-recovery/README.md).
**Additional acceptance completed and verified:** production browser cases cover
non-final supply-depot victory and expedition abandonment under failed writes, repeated retry and
Restart. Two integration cases cover purchased-item stats/spend over three real save round-trips
and locked reroll → ban → next-shop exclusion. No new defect found; no runtime change.
[29 October evidence](../playtest-evidence/2026-10-29-transaction-acceptance/README.md).
Full checks pass: 1,810 unit tests, 69 browser checks, 31 desktop-host tests and all 23 portfolio guards.
Next: G7 design. G6 remains support work for reproduced defects; final-boss
victory under failed writes is a bounded coverage follow-up, not claimed as tested here.

**P1 when a defect is reproduced; otherwise support task, M effort/medium risk.** Attach cross-system
checks to G1–G5: buy/sell/lock/ban/reroll, event costs/rewards, reward-before-travel and write failure.
Armory one-time spending, purchase/equip reload and failed-write retry now have fresh passing
production-browser evidence in G5; do not repeat that completed slice.
Assert inventory/currency/node state through actual save/resume boundaries. Fix demonstrated loss,
duplication, invisible failures or incorrect reward application. Do not replace an already-working
save system or build another generic QA framework. No new assets. Full checks for runtime fixes;
real power-loss and Steam-cloud behavior remain separate. This work is acceptance for shipped
features, not a reason to postpone all visible improvements indefinitely.

## Phase C — get value from existing game content

### G7 — regional finales: concrete integration design, gated activation

**P2 design now; M implementation later/high compatibility and balance risk.** Reuse Choir and
Foundry Sovereign before adding bosses. Trace every finale caller and design an authored region/
finale policy with versioned map generation so resumed legacy seeds retain their original boss.
Specify preview/theme/reward consistency, old-save fallback and rollback. Deliver fixtures and a
file-level integration plan, not a randomly changed terminal theme.

Design acceptance: legacy outcomes fixed, intended new routes explicit and generator → descriptor
→ combat tests specified. Activation still requires VARIETY-01 observed runs and two weeks verified
analytics. Existing assets/audio only; earned-route fairness and hardware pacing remain unproven.

### G8 — one existing world interaction or encounter variant, design first

**P3 conditional design; S–M; medium eventual risk.** Start from the seven deliberately excluded
world interactions and existing objectives/terrain; select at most one distinct tactical verb.
Trace availability and effect support before proposing activation. Specify cost/reward, counterplay,
placement/collision, deterministic outcomes, feedback, save/resume and exploit limits. Compare with
existing gates/chests/seams/objectives so this creates a decision rather than a cosmetic duplicate.

Deliver a bounded state diagram, reuse/asset-gap assessment and implementation/test map, or a no-go
if it adds little. No production activation, terrain pack or new art before the standing content
gates. Future runtime acceptance includes actual offered effect, navigation safety, reward integrity
and save compatibility. Content exposure tracing belongs here as evidence for this one decision,
not a sprawling ledger project taking priority over player-facing fixes.

### G9 — objective combat/audio feedback fixes

**P2 conditional fixes; S–M; medium risk.** Audit actual warnings, hits, reward and interaction dispatch
while touching their consumers. Correct missing routing, wrong subject/icon, stale voice/timer or
misleading state if reproduced. Existing gain/mute/cleanup work is complete; do not repeat it.
Reuse samples/synth fallback and existing tell geometry. Acceptance: event → feedback path works,
limits/fallbacks survive failure, cleanup is complete; production regression/full checks for changes.
No subjective mix rebalance or new sound/art batch without perceptual evidence.

## Deferred content and balance

New heroes, monsters, weapons/items, nodes, regions, multiplayer, touch overhaul and practice mode
are not the next implementation batch. Practice retains repeated-learning-failure evidence. Variety
retains Runs 1–5 and two verified analytics weeks. New art/expansion retains explicit scope and
proven gaps. Existing floors remain opt-in until motion/hardware acceptance. Fixing lost equipment,
truthful effects and usability does not require pretending those gates have passed.

No human testers are available now; keep that dependency recorded without repeatedly requesting one.
Packaging remains Claude's specifically assigned responsibility. No push, merge into diverged main,
deployment, package or submission is authorized by this audit request. Review branch contains
previous committed work; current publication must be checked rather than assumed.

## Completed work and retained references

Pagination, shop-text overflow, event confirmation, live audio controls, semantic shell slices and
BAL-01 reports are implemented. Last full runtime evidence: 1,795 unit/314 files, 54 browser,
31 desktop-host and 23 portfolio guards; later resize/held-input cases ran separately. These are
historical, not rerun today. Fresh stash-handoff witness is the evidence added by this review.

[Archive index](../archive/README.md) records superseded queues. Keep the game design, art bible,
asset inventory, environment/world-object contracts, acceptance worksheet, QA guide, release handoff
and completed-work log as reference documents. Old claims of “live next work” do not reactivate
archived tasks. Tests are scoped acceptance criteria for each change. Preserve concurrent edits,
stage explicit paths and commit only task work in the nested website repository.
