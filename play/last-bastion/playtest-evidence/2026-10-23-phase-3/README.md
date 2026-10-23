# Phase 3 — balance reporting and assessment, 23 October 2026

[CURRENT-PLAN](../../CURRENT-PLAN.md) owns the queue. The user approved Phase 3 through completion.
All executable reporting/assessment work described here is complete; **human-dependent Phase 3
acceptance remains open** because no observed testing is available. No balance or practice gate
is waived. This record does not claim all phases are complete.

## Provenance and delivered BAL-01

Started at `33fe8481`, with unrelated website/About/privacy/social edits excluded. Browser identity
remains `web-2026.10.23-event-confirmation`, schema 16 / simulation compatibility 3: no shipping
gameplay source, assets or published output changed. These changes affect offline tooling/tests only.
Verification reports retain dirty-checkout provenance, not a clean-HEAD or packaged-build claim.

The former `balance:audit` command printed options without executing. It now loads the existing
production BalanceAudit/CombatSimulation through installed Vite in middleware mode, opens no
listening port, and emits versioned JSON. No new dependency or duplicate simulation was added.
Seeds, horizon, supported unique policies, duplicate/unknown flags and missing arguments are checked.

Schema 2 replaces final-level-as-boss-entry with `finalLevel`; unmeasured purchases are null.
The underlying telemetry also left dodges and spawned/lost XP at initialized zero; this report
marks them null rather than presenting those as measurements. Completed victory/defeat and
horizon-censored rows are separate. Summaries include counts, and `completedWinRate` is null if
no run completes; it excludes censored runs and can be selection-biased. Fixed ticks respect the
requested horizon, expose budget and actual simulated seconds, and continue through intermissions.
No game rule, cost, damage, spawn cadence, unlock or reward probability changed.

Existing Scout/Tactician tests now name the measured final level; thresholds were not loosened.
New production harness tests cover invalid options, deterministic rows and censored/mixed summaries.
The CLI integration test invokes the actual child command twice and checks identical real rows;
invalid CLI requests must fail with the intended diagnostic, not merely any process error.

## Reproduce and evidence

From `dev/`:

```powershell
node scripts/run-balance-audit.mjs --seeds 12 --seconds 90 > ../playtest-evidence/2026-10-23-phase-3/balance-12-seeds.json
node ../playtest-evidence/2026-10-23-phase-3/capture-boss-report.mjs > ../playtest-evidence/2026-10-23-phase-3/boss-report.json
```

The first is 5 heroes × 12 seeds × 4 fixed policies = **240 rows**. These policies use fixed
movement/aim and simple option indices. The `random` policy is a deterministic movement pattern,
not random reward selection; `greedy-damage` stands still. They are not optimized builds or humans.
The CLI now says so. `damageTaken` includes shield damage; `finalScrap` measures secured scrap.
These reports are not shop purchase histories, earned expedition runs or player win-rate estimates.

- `targeted.txt`: sandbox cache rename EPERM before tests ran.
- `targeted-host.txt`: harness tests pass; new CLI test initially used an incorrect relative path.
- `targeted-final.txt`: all 7 targeted tests pass after correcting the path and tightening invalid-input assertions.
- `verification.json/.txt`: initial full run fails TypeScript because the Node integration test was
  placed in the browser TypeScript configuration. Moved that Node-only test to `.test.mjs`; no new
  package or broad TypeScript config relaxation. Typecheck then passed.
- `verification-final.json/.txt`: **PASS 153.3s, 1,794 unit tests / 314 files, 52 browser cases,
  31 desktop-host tests**, static/output/HTTP/offline/site checks; includes the Node integration test.
- `portfolio.txt`: completed current full portfolio run, **all 20 guards PASS**. No fleet dependency maintenance.
- `boss-report.json`: existing five-seed/rotating-hero regional boss harness, representative level-10
  fixture, 180-second cap. Capture script retained; not a new boss balance model.

## Results and decisions

| Phase 3 scope | Current evidence | Decision / remaining acceptance |
|---|---|---|
| Build viability | 240 synthetic rows: 184 defeats, 56 censored, no victories within 90 seconds | No human difficulty or dominance conclusion. Test comparable earned builds in Runs 1–5 before tuning. |
| Recovery/economy/unlocks | Reviewed CampaignTuning, ArmoryProgression, ThreatTier, shop affordability/repair and rank-reward tests, all included in full verification | Existing rules enforce prerequisites, costs, rewards and recovery availability. Projections are not actual player acquisition/purchase pace; no cost/unlock change justified. |
| Enemy-combination fairness | Existing telegraph/objective/encounter regressions plus 15 regional boss simulations | Boss fixture meets existing thresholds; normal earned mixed encounters still require safe-lane/damage-source observations. No enemy budget or tell timing change. |
| Practice | No repeated observed learning failure supplied | LEARN-01 remains gated; no practice implementation or progression bypass. |

Sample interpretation: Medic has 36 censored rows across the three moving policies; stationary
Medic loses all 12. That suggests reviewing both survival and progress in an observed Medic run,
not concluding Medic is overpowered or underpowered. Marine cautious has 7 defeats/5 censored;
Assault cautious 4/8; Tactician cautious 7/5; Scout cautious 12/0. Their starting kits and the fixed
policy interact differently. Do not rank heroes by those counts alone.

Boss fixture results: Choir warning-response **4/5 victories**, median 56.15 seconds / 15 damage;
Sovereign core-rush **5/5**, median 101.95 seconds / 12.48 damage; summon-control **5/5**, median
109.60 seconds / 6.19 damage. This supports retaining both authored Sovereign strategies in the
fixture. It does not establish a player balance advantage, full campaign pacing or all enemy mixes.

CampaignTuning tests inspect 100 seeded map projections: 4–7 shop visits, guaranteed income above
the common-item price per visit, at least two healing opportunities, projected entry level 8–20.
Those are model/contract assertions. Actual collected XP, purchases, missed rewards and earned
unlock time must come from play; null report fields must never be treated as zeros in that review.

## Remaining Phase 3 acceptance

Human tester supplies earned, comparable hero/threat/loadout runs with purchase/reward choices,
missed XP, healing, time-to-unlock and first unexplained damage. Classify survival versus progress
separately. Only demonstrated issues become bounded tuning changes, one variable at a time with
affected production regressions/full checks and repeated human runs. Repeated learning failures
are required before the isolated production-system practice sequence. No new art is needed now.

Packaging, Steam, physical AT/controller/audio/hardware and analytics remain independent owner
dependencies. No push, deployment, packaging or generated assets in this work.
