# Phase 2 implementation and later-phase preflight — 23 October 2026

[CURRENT-PLAN](../../CURRENT-PLAN.md) remains the only execution queue. User authorized Phase 2
onwards; standing observation, art, practice, variety and expansion gates remain applicable.
Human testing is unavailable. This is bounded implementation plus source review, not completion
of Phases 2–5 or human acceptance.

## Delivered: EVENT-01 result confirmation

Baseline: `b8d22963`; prepared output now `web-2026.10.23-event-confirmation`.
Existing unrelated About/privacy/social/website edits excluded. Verification reports retain
dirty-tree provenance. No exact-clean-checkout, published-build or current-package claim.

Problem: ExpeditionEventScene.handleKeyDown committed an outcome on every subsequent keydown,
including the repeated Enter that selected it. `event-before.txt` reproduces premature dismissal
through the actual published renderer using `?screen=event&eventdemo=1`. The production scene's
existing demo mode avoids save mutation. Source review also found outcome-covered choice cards
retained pointer handlers and the visible A prompt accepted every gamepad button.

Player benefit/scope: players can read an event result before deliberately continuing. Repeated
keys are ignored; Enter/Space or pad A explicitly continue; the modal blocks covered choices and
provides a pointer Continue button. No event probability, cost, reward, progression or combat rule
changed. Existing code-native UI reused; no assets generated. Effort S, interaction risk medium.

Steps completed: reproduce held selection; guard repeat and explicit confirmation; guard covered
choice handlers; add interactive modal backdrop/Continue; update prompt; rebuild browser output
and release identity; execute regression and full checks. The new browser test verifies held-key
retention, covered-choice isolation, unrelated arrow retention, fresh Enter and pointer Continue.

`event-after.txt` is a retained failed test attempt: absolute page coordinates missed the canvas
button. The test now maps logical coordinates through the actual canvas bounds.
`event-after-coordinate.txt` passes. No timeout was enlarged. Pad A restriction is source-reviewed;
this new case is keyboard/pointer coverage, not a physical controller result. Real event travel,
result readability, minimum/4K presentation and physical pad acceptance remain human checks.

Fresh full verifier: **PASS 118.9s, 1,790 unit tests / 313 files, 52 browser cases,
31 desktop-host tests**, static/content/image/text/boundary, 25 source/output matches, HTTP/offline
and site JavaScript checks. Root portfolio: **all 20 PASS**. Logs and JSON are retained here.
No fleet maintenance, package, deploy, push or Steam operation performed.

`event-result.png`, captured by `capture-event.mjs` from actual output at 960×540, was visually
inspected: result text, HP/shield summary and Continue fit inside the modal. This single demo
capture does not establish all event text layouts, 4K or human reading acceptance.

## Phase 2 consumer review

- **Reward/card flow:** inspected ExpeditionEventScene, ItemRewardPlanning and powerup InspectCardModel.
  Event outcome input yielded the confirmed issue above. This is not a census of every reward
  comparison. Continue with actual upgrade/shop choice consumers before asserting missing comparisons.
- **Map:** ExpeditionScene.renderIntelCard already displays node identity, objective, theme,
  threat, map column and preview/armed confirmation text. NodeIconCatalog maps nine identities.
  Do not implement duplicate previews. Human comprehension remains untested.
- **Terrain:** TerrainVisualState binds existing themed four-state rows; ArenaRenderer draws hazard
  footprints with code-native styles. WorldObjectPlacement filters unimplemented interactions and
  applies deterministic spacing/spawn/coverage constraints; CombatSimulation consumes placement,
  interactions and detonation chains. No new destructible system or atlas is justified by this review.
- **Debrief:** RunSummaryScene already shows defeatCause and leading damageTakenBySource, weapon
  damage and retry actions. A new death-explanation panel would duplicate existing functionality.
- **Text/focus and mixing:** no new perceptual failure established; prior checks are not fresh human
  reading/listening acceptance. Preserve the existing acceptance tasks.

## Phase 3 measurement finding — BAL-01, next executable task

Confirmed tooling limitation, not a demonstrated balance defect. `dev/scripts/run-balance-audit.mjs`
only prints command/options and a note to use BalanceAudit elsewhere. Fresh invocation with two
seeds/cautious is retained in `balance-command.txt`; it succeeds without producing simulation rows.
The real `telemetry/BalanceAudit.ts` does invoke CombatSimulation, but its summary calls final
level `bossEntryLevel`, hard-codes purchases to zero and computes victory fraction even when the
time horizon ends with combat still active. Short-horizon output must not imply completed-run win rate.

Benefit/scope: trustworthy offline evidence for subsequent balance review. P2, M effort, medium
measurement risk; no art or balance change. Dependencies: define supported horizon/mode and actual
measurable fields; inspect current consumers before changing report schema. No human data is needed
to repair reporting; synthetic-policy results still cannot establish player fairness or fun.

Implementation: connect the existing command to the actual simulation harness with validated
seed/policy/horizon inputs; emit deterministic rows and metadata; rename final-level reporting or
capture actual boss-entry events; report purchases as unavailable unless observed; distinguish
completed outcomes from horizon-censored runs. Preserve prior fixtures and explicitly version any
changed report schema. Avoid creating a second simulation or silently changing game balance.

Acceptance/checks: command creates the requested hero/seed/policy rows; invalid inputs fail visibly;
repeat inputs reproduce substantive rows; a censored run is never represented as a completed loss;
boss-entry/purchase claims have actual event evidence or are absent. Integration tests invoke the
real command and production harness, plus existing simulation/full game/portfolio checks. Human
Runs 1–5 and comparable earned builds remain required before balance tuning.

## Phases 4–5: existing-content disposition

ContentInventory derives counts from production catalogues: 5 heroes, 34 weapons (31 draftable),
38 enemy catalogue types, 47 items, 14 relics, 12 artifacts, 20 upgrades, 16 level-stat cards,
29 world objects and 4 objective modes. Current inventory tests pass. Counts are definitions,
not proof of exposure, unlock attainability or encounter frequency.

Next bounded investigation: trace selection/unlock/placement consumers for a selected existing
region, record reachable versus intentionally gated entries, then collect observed exposure.
World interactions currently admitted by the catalogue are open-loot, open-gate and harvest-scrap;
spawner/stargate/system/cryo/weapon-upgrade effects are intentionally excluded until implemented.
Do not activate catalogue placeholders as content. No missing monster/hero role is established.

Variety still requires Runs 1–5 plus two weeks of verified measurement. Floors remain opt-in until
motion/hardware acceptance; practice requires repeated learning failures. New roles, items, nodes,
heroes or regions require their design/cost case and working production consumers before asset work.
