# Last Bastion — current development plan

**Updated 27 October 2026. Sole active queue.** Prioritize player-facing code, gameplay quality
and useful existing content. Automated checks support delivery; they are not the product roadmap.
Current prepared runtime: `web-2026.10.27-stash-persistence`, schema 17; G1 implemented and verified locally. Check Git before implementation; shared checkout has concurrent edits.
No human testers available. Implementation is approved; evidence gates remain unchanged.

## Current audit findings

- **Fixed production handoff defect — G1:** selecting Store in stash in weapon-gate accepts
  a Scattergun, but `expeditionBuildFromCombatSnapshot` serializes only rack weapons. A new
  CombatSimulation constructed from that build has an empty stash. Fresh executable witness:
  [26 October review](playtest-evidence/2026-10-26-gameplay-review/README.md).
- **Source-confirmed dormant drawbacks, reachability not yet established — G2:**
  TransformationRunModifiers explicitly ignores fire-damage-received/shock-buildup-received scars
  because typed incoming elemental damage is absent. Determine which authored choices are offered
  before claiming affected player builds. Do not silently remove a downside or invent global damage types.
- **Confirmed presentation limitation — G3:** BuildOverlay lists relic/artifact names while its
  other sections already expose weapons, stash, stats, synergies and affinity. Better effect
  explanations can reuse this inspector; another inventory/affinity screen would duplicate work.
- **Observed polish — G4:** shop navigation shares sale-item fallback tiles, final rows cross the
  decorative frame and long descriptions fit tightly. Pagination/text overflow fixes are already
  delivered. Target these visible shortcomings, not endless permutations of the same passing test.
- **Source-confirmed shell gap — G5:** hero/threat and armory surfaces remain canvas controls;
  native title/menu/settings/help/rebinding/records already exist.
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
[implementation evidence](playtest-evidence/2026-10-27-stash-persistence/README.md).
No new assets, balance changes or hardware/cloud acceptance. **Next implementation: G2.**

### G2 — make offered transformation boons and costs truthful

**P1 investigation then bounded correction; M effort; high balance risk.** Benefit: a build choice
means what its text promises. Existing ignored scar metrics are evidence for tracing, not permission
to enable new combat systems. Enumerate offered choices and follow each boon/scar to its consumer.

Produce a compact authoring-to-runtime map as part of implementation. For an actually selectable
unsupported effect, choose a compatible supported consequence or prevent offering that choice;
justify cost/parity and preserve already-saved choices. If all affected choices are gated, close
with no runtime change. Do not add typed player damage just to satisfy an old description.
Acceptance: every newly offered effect has an executed consequence or explicit non-offered status;
old saves remain valid and no free power is accidentally granted. Production resolver/simulation
regressions, save compatibility and full checks required. Quantitative tuning stays conditional on
balance evidence. Reuse authored paths/art/audio; no new transformations.

### G3 — explain the current build and reward consequences in existing UI

**P2 improvement; M effort; medium UI risk.** Benefit: understand why an item/relic matters without
leaving a run. Extend BuildViewModel/BuildOverlay with existing relic/artifact effect descriptions
and owned item benefits/penalties where absent; verify current consumers first. Preserve paged
navigation and existing affinity explanations. Label estimated DPS as estimated; do not pretend it
captures every proc, target count or damage type.

Add a compact owned/new or next-rank cue to reward/shop choices only where existing information is
insufficient; reuse catalogue text and current rank data. Avoid a new card system or speculative
recommendation score. Acceptance: all owned effect-bearing items/relics/artifact can be inspected,
copy matches exported definitions, no silent truncation and all controls remain operable. Check
production view models and renderer worst cases; full checks for changes. Existing icons/panels,
no generated art. Depends on G1's final stash contract for inventory copy.

## Phase B — improve selection, shopping and run flow

### G4 — finish decision navigation and spacing polish

**P2; M effort; medium risk.** Replace ambiguous page-control sale tiles with a distinct existing
UI/text treatment; put content inside consistent panel insets and clarify 1–9 quick picks versus
arrow/pad navigation. Prefer Back reachable on every page if the measured layout supports it.
Preserve font size, descriptions and transaction behavior; do not add purchase confirmation spam.

Keep a surviving selected choice visible across meaningful shop refreshes; on removal choose a
nearby enabled choice or Back, clamp pages and refresh displayed cost/description/state. Reproduce
stale-text or selection faults before changing the sync policy. Current source key omits some
presentation fields; that is a hypothesis until an actual transition demonstrates stale output.

Acceptance: navigation is visibly distinct, no frame/text interference, no hidden choice, no stale
price or unintended sale after redraw. Targeted tests include remaining digit/stick/mixed-input
edges only where this change touches them; reuse completed 399-case and pointer/pad/resize coverage.
Measure title/hint/focus bounds at minimum/1280×800/4K within this delivery, not as an unbounded
standalone testing phase. Full game/portfolio checks. Existing art/code only; human preference unclaimed.

### G5 — improve hero/threat selection and armory operation

**P2; M per slice; medium risk.** First implement visible native hero/threat controls from existing
ScreenFlow state: selected/locked state, actual unlock condition, starting equipment, threat modifiers,
Back and Deploy. Preserve earned unlocks and mode restrictions. Then apply the same proven pattern
to armory inspection/purchases; do not grant equipment from a preview or create another progression tree.

Acceptance: each existing action works once with keyboard/pointer/simulated pad, focus survives
redraw/return, locked deployment/purchases remain guarded and labels reflect real requirements.
Test fresh/earned profiles and UI size changes, then full checks. No new hero/portraits; reuse native
shell styles and metadata. Real AT/device acceptance remains external, not a blocker to coding.

### G6 — transaction and reward reliability alongside gameplay changes

**P1 when a defect is reproduced; otherwise support task, M effort/medium risk.** Attach cross-system
checks to G1–G5: buy/sell/lock/ban/reroll, event costs/rewards, reward-before-travel and write failure.
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

[Archive index](archive/README.md) records superseded queues. Keep the game design, art bible,
asset inventory, environment/world-object contracts, acceptance worksheet, QA guide, release handoff
and completed-work log as reference documents. Old claims of “live next work” do not reactivate
archived tasks. Tests are scoped acceptance criteria for each change. Preserve concurrent edits,
stage explicit paths and commit only task work in the nested website repository.
