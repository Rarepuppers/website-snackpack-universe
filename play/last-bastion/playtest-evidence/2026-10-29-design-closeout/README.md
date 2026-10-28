# Content design and feedback audit — 29 October 2026

Reference evidence and implementation specifications, not an active queue. Follow
[CURRENT-PLAN](../../CURRENT-PLAN.md). Source baseline: `705a1ba7`; runtime remains
`web-2026.10.28-run-save-recovery`, schema 17, simulation compatibility 3.
The initial design audit changed no runtime. A subsequent final-boss runtime regression in this
slice exposed and fixed a reward-confirmation defect; see the final section. No balance, assets or
content exposure changed. Final runtime: `web-2026.10.29-boss-reward-confirm`.

## Fresh evidence and limits

[Production generator fixtures](legacy-map-fixtures.json) capture complete maps and final
encounter descriptors for seeds 1, 42, 117, 61061 and 99999. Every final node is 20,
containment-underworld, Bastion Eater. [Consumer report](consumer-evidence.json) also captures
the existing regional selectors and all seven excluded interaction catalogue entries.
Run `node play/last-bastion/playtest-evidence/2026-10-29-design-closeout/generate-fixtures.mjs`
from the website repository with the game's installed dependencies. Regeneration is evidence
collection, not permission to replace compatibility expectations after changing a generator.

Fresh installed-runner checks: [34 tests in seven files](targeted-checks.txt) covering audio
mapping, production audio feedback, mixer, synth, world interaction runtime/logic and encounter
descriptors; [four presenter tests](presenter-checks.txt). These are automated/source evidence,
not listening, new screenshot review, complete runs or physical-device acceptance. Earlier full
verification is separately dated in [transaction acceptance](../2026-10-29-transaction-acceptance/README.md).

## G7 — versioned regional finales

**Confirmed route limitation, optional content improvement. P2; medium implementation effort;
high compatibility/balance risk. Design complete; activation gated.** Existing boss content can
provide distinct final encounters without commissioning another monster or region.

Production consumers: `ExpeditionMap.ts` selects the final ARENA_THEMES entry; `ExpeditionRun.ts`
regenerates a saved map from its seed without a map generation version. `ExpeditionEncounter.ts`
maps alien-hive/toxic-bloom to Choir, machine-foundry/science-wing to Sovereign, and the current
final theme to Bastion Eater. `PrototypeScene.ts` derives its encounter from the resumed run;
changing a URL theme is not the route implementation. `ExpeditionScene.ts` currently labels
the boss node THE BASTION EATER. `CombatSimulation.ts` consumes encounter.bossKind;
`RankRewardPlanning.ts` and its integration test give a defeated boss an artifact choice.
The presenter already consumes Choir/Sovereign effect atlases and warning events. Reuse these
assets and behavior; no replacement asset batch is justified by this route evidence.

Implementation specification, after VARIETY-01 evidence:

1. Freeze the v1 generator, including its theme order and random draw sequence. Introduce an
   optional persisted mapGenerationVersion; missing means v1. Trace ExpeditionSave, LocalSaveStore
   normalization, start/resume, summaries, replay identity and cloud conflict handling. Preserve
   unsupported future versions with a visible recovery/export path; never silently reinterpret them.
2. Define explicit v2 finale policy IDs: containment-underworld/Bastion Eater, alien-hive/Choir,
   machine-foundry/Sovereign. Choose once at new-run creation using a separately salted deterministic
   selection; persist the policy ID. Do not consume the layout RNG or reroll on reload. Equal
   candidate weights are a prototype hypothesis, not a balance conclusion.
3. Make map name, boss portrait/preview, descriptor, theme, actual spawned boss and summary use
   that same policy. Keep existing reward choice blocking completion/navigation until resolved.
   Do not change threat scaling, rewards or room topology in the first integration slice.
4. Preserve all legacy runs as v1. Gate creation of v2 runs independently from decoding them.
   Rollback disables new v2 starts but retains v2 resume support; never downgrade an active run.
5. Before exposure, compare the three existing arenas for spawn safety, tells, movement routes,
   reward handoff and frame cost. Replace assets only if a specific consumer gap is demonstrated.

Acceptance: the five committed v1 maps remain byte-equivalent in logical fields; absent version
resumes v1; each v2 policy deterministically produces matching preview/descriptor/combat/reward;
save/reload and rollback preserve identity; invalid versions cannot destroy a recoverable save.
Required checks: production generator fixtures, save migration and cloud/replay compatibility,
descriptor-to-simulation boss tests, artifact-before-travel integration, failed-write browser
handoff and full game/portfolio checks for implementation. Human dependencies: observed Runs 1–5
plus two verified analytics weeks before activation, then earned-route fairness, warning readability,
listening/controller and hardware pacing acceptance. Approval of this design does not satisfy them.

## G8 — bounded teleporter-disruption design

**Optional tactical improvement. P3; medium effort; medium/high spawn-budget and navigation risk.
Design complete; production implementation/exposure gated.** Select one monster-teleporter pilot,
not seven interactions. Its benefit is a choice between spending time near danger to suppress
future reinforcements, spending damage to destroy it, or continuing the encounter.

Catalogue review: monster-teleporter lacks an owned spawn stream; stargate lacks an expedition
exit contract; control-panel, turret-console and trap-console lack system ownership; cryogenic-tube
has no defined release payload; weapon-upgrade-station would need the existing placement/merge
flow and its disabled-weapon recovery. All seven remain excluded. Chests/seams already reward
collection, gates already change passage, and objectives already offer hold/escort/collect goals.
Teleporter disruption is selected for threat suppression, not another loot dispenser.

Bounded state model: dormant → telegraph → active → exhausted; active or telegraph → disrupted
by a completed hold, or → destroyed by damage. Exhausted/disrupted/destroyed are terminal.
Repeated completion, destruction and cleanup events must be idempotent. Pause freezes timers;
terminal encounter, abandonment or scene teardown cancels every queued spawn.

Implementation specification, after standing variety/content evidence:

1. Add a seed-stable object-to-stream ownership record in world interaction/combat runtime. Reserve
   a finite subset of the existing encounter threat budget, not additional endless enemies. Start
   with one object despite the catalogue maximum of two. No new monster, currency or permanent reward.
2. Keep the catalogue's 2-second hold and 500 durability as initial test inputs, not accepted tuning.
   Damage/range loss interrupts the hold. Both disruption and destruction cancel remaining owned
   spawns; already spawned enemies remain. Neither grants a second object payout. Define finite
   warning/spawn timing in the pilot fixture and test it before changing the catalogue support list.
3. Placement uses the existing 2.4 × 2.4 metre footprint and collision rules. Require an accessible
   interaction point and escape route; never block the sole path or objective. Reject invalid placement
   rather than shrinking collision invisibly. Do not alter ordinary encounters while the pilot is gated.
4. Use the existing power-conduit fallback, clearly labelled state and existing effects/audio for
   the internal pilot. The catalogue reference is not proof of distinct finished teleporter art.
   Test identification in motion before requesting any new art. Show interrupted/completed state
   without relying solely on colour or sound.
5. Use the current node-boundary persistence contract: an interrupted encounter restarts its
   deterministic stream, not a partially serialized new subsystem. Check earned node credit and
   carry-forward currency cannot be duplicated through restart/retry. Explain restart behavior.

Acceptance: every spawn belongs to a finite budget and owner; no post-terminal spawn; pause,
damage interruption, destruction and completion work in either order; passage remains usable;
feedback matches the actual effect; save/retry cannot duplicate node rewards. Required checks:
WorldObjectCatalog/Placement/Navigation, WorldInteraction, WorldInteractionRuntime and combat
integration tests; event-to-presenter/audio tests; browser interaction/retry checks and full
game/portfolio verification. Human dependencies: threat tradeoff, control burden, visual/audio
identification, route safety and hardware pacing. Do not activate or generate art without the gates.

## G9 — feedback audit disposition

**No confirmed routing defect found in this bounded review.** CombatEventPresenter dispatches
events to haptics and AudioCueMap before visual handling. Objective completions and the inspected
boss/hostile warnings have audio mappings; tests exercise production sample/fallback, mixer and
synth consumers. Presenter cases cover authored effects and interaction/objective feedback.

**Observation, not a demonstrated player defect:** world-interaction-completed has no dedicated
AudioCueMap entry. The presenter provides an authored effect, ring and named feed message;
open-loot and harvest-scrap also emit their reward feedback. A dedicated gate-completion cue is
an optional P3/small polish candidate only if listening shows the existing state change is missed.
Reuse a suitable current cue and test exactly-once dispatch, mute/gain, failure fallback and teardown;
do not add a new sound batch or rebalance the mix on source inspection alone.

No claim about subjective mixing, animation continuity, complete warning coverage or actual
hardware follows from these 38 tests. Reopen G9 for a reproduced mismatch with a named event,
actual consumer, expected feedback and a regression; otherwise leave the working routes intact.


## G6 — confirmed final-boss reward navigation defect and fix

**P1 confirmed defect, fixed; small scope, low implementation risk.** Keyboard Enter is both
menu Confirm and gameplay Restart; controller south also carries both semantics. With terminal
victory and a pending artifact decision, PrototypeScene handled confirmation and immediately
navigated as Restart before recordRunOutcome could persist the result. The fresh failed-write
witness reached summary while storage still contained the pre-boss expedition.
[Failing runtime evidence](final-boss-before.txt). This was not established by the earlier
safe-node or abandonment checks.

The Restart branch now requires no pending decision in the last rendered snapshot, allowing the
chosen reward to reach the normal simulation/outcome/save path. Existing SaveHandoffRecovery
then retains failed writes. No new reward system, save schema, art or content. Runtime/cache
identity updated to `web-2026.10.29-boss-reward-confirm`; schema 17 and simulation version 3 remain.

The browser regression uses valid production seed-117 path 1 → 3 → 6 → 9 → 12 → 15 → 18 → 20.
A test-only intercepted boot response exposes the live Phaser game; service workers are blocked
only in this fixture so the interception cannot be skipped. It drives the actual simulation with
bounded steps/damage, not a fabricated victory snapshot, then uses the real artifact selection UI.
No shipped debug hook or unlock was introduced. The test asserts:

- Pending artifact selection holds the scene beyond the navigation timer.
- Enter selects a real artifact and does not take the Restart exit.
- Failed writes and repeated retries retain the result; Enter cannot bypass recovery.
- Successful persistence and reload retain exactly one run/history entry, node credit, victory
  outcome and unchanged progression/earned marks; the completed expedition is cleared.

[Passing targeted browser evidence](final-boss-after.txt). This is deterministic runtime acceptance,
not an earned player run, physical controller test, abrupt power-loss test or Steam validation.
The boot-hook matcher deliberately fails if bundling changes; update the test driver rather than
adding a production shortcut. Fresh full verification passes in 209.7 seconds: 1,810 tests in 317 files, 70 browser checks,
31 desktop-host tests, static/type/build/smoke/offline and site JavaScript checks.
[Machine report](verification.json), [full output](verification.txt), [all 23 portfolio guards](portfolio.txt).
The report identifies the pre-commit HEAD and dirty working tree because verification precedes commit.
Documentation references and focused diff checks also pass.
