# Last Bastion — current development plan

**Updated 29 October 2026. Sole active queue.** Runtime:
`web-2026.10.29-boss-reward-confirm`; schema 17; simulation compatibility 3.
Implementation is approved. No human testers are available; evidence gates remain unchanged.
Check current Git status before each slice and preserve concurrent work.

## Completed implementation and design

| Slice | Result and dated evidence |
|---|---|
| G1 | [Stash persistence](playtest-evidence/2026-10-27-stash-persistence/README.md), including legacy saves and occupied bonus slots. |
| G2 | [Truthful transformation offers](playtest-evidence/2026-10-27-transformation-offers/README.md); unsupported drawbacks are no longer offered as working. |
| G3 | [Build effects and ownership](playtest-evidence/2026-10-27-build-effects/README.md) in the existing inspector/shop. |
| G4 | [Shop navigation, spacing and refresh continuity](playtest-evidence/2026-10-27-shop-polish/README.md). |
| G5 | [Native hero/threat selection](playtest-evidence/2026-10-28-native-selection/README.md) and [native armory](playtest-evidence/2026-10-28-native-armory/README.md), with purchase/equip/save recovery. |
| G6 | Failed-write recovery for [events](playtest-evidence/2026-10-28-event-save-recovery/README.md), [map travel](playtest-evidence/2026-10-28-map-save-recovery/README.md) and [run end](playtest-evidence/2026-10-28-run-save-recovery/README.md). Additional [transaction acceptance](playtest-evidence/2026-10-29-transaction-acceptance/README.md) covers supply victory, expedition abandonment, item carry-forward, lock/reroll and bans. |
| G7/G8 | [Regional finale compatibility design and one teleporter interaction design](playtest-evidence/2026-10-29-design-closeout/README.md), with production fixtures, implementation steps and acceptance criteria. No activation. |
| G9 | [Bounded feedback audit](playtest-evidence/2026-10-29-design-closeout/README.md): 38 fresh targeted tests pass; no confirmed routing defect found. No speculative mix or asset changes. |

Fresh full verification of the boss-confirm fix passes: 1,810 tests in 317 files, 70 browser
checks, 31 desktop-host checks and all 23 portfolio guards. All four game verification lanes
passed in 209.7 seconds on 29 October. [Evidence](playtest-evidence/2026-10-29-design-closeout/README.md).
These results do not establish human/device readiness.
Older counts and prepared identities are historical. The [archived queue](archive/CURRENT-PLAN-BEFORE-DESIGN-CLOSEOUT-2026-10-29.md)
retains implementation history; do not reopen its completed tasks.

## Remaining work in priority order

G6 final-boss coverage is now complete: the fresh regression exposed Enter confirming an artifact
and also triggering Restart before outcome persistence. The handler now waits until no reward
decision is pending. The actual final-node browser case verifies reward-before-navigation,
failed-write recovery, repeated retry and exactly one victory/history/progression result after reload.
[Before/after evidence](playtest-evidence/2026-10-29-design-closeout/README.md).
No further ungated implementation task remains from this queue. Reopen G6 only for a reproduced
transaction defect; do not repeatedly retest completed slices without a new change or concern.

### 1. G7 — implement versioned regional finales after the variety gate

**P2; medium effort; high save/balance risk. Design complete, implementation gated.** Five fresh
production seeds all end at Bastion Eater despite existing Choir/Sovereign selectors. Follow the
[detailed design and fixtures](playtest-evidence/2026-10-29-design-closeout/README.md): frozen v1
maps, explicit persisted v2 policy, consistent previews/descriptors/combat/rewards and rollback
that retains resume support. Reuse existing bosses, effects and audio. No new art batch.

Before activation: VARIETY-01 observed Runs 1–5 plus two verified analytics weeks. Implementation
acceptance includes legacy fixtures, version normalization/recovery, deterministic policy selection,
actual boss/reward handoff, full verification and human/hardware pacing. Recommendations being
accepted do not supply this evidence. Do not quietly begin production exposure while it is absent.

### 2. G8 — one finite teleporter-disruption pilot after content evidence

**P3; medium effort; medium/high spawn and navigation risk. Design complete, runtime gated.**
Use the [bounded specification](playtest-evidence/2026-10-29-design-closeout/README.md). Reserve
an existing finite threat budget; hold or destroy one owned spawner; preserve routes; ensure cleanup,
interruption and retry idempotence. Existing conduit art/effects suffice for an internal pilot,
subject to identification testing. No new monsters, permanent reward system or terrain pack.

Acceptance: finite deterministic stream, no post-terminal spawn, accessible route and interaction,
truthful non-colour-only feedback, no reward exploit, production integration/browser/full checks.
Standing variety gates precede exposure; physical controls, listening and hardware remain external.
The other six excluded interactions remain excluded until a separate concrete benefit is justified.

### 3. G9 — repair reproduced feedback mismatches

**Conditional P2 fixes; small-to-medium effort/risk.** No defect was established in the bounded
29 October audit. A dedicated world-interaction completion sound is only an optional P3 hypothesis:
visual/feed feedback already exists, and reward interactions emit other feedback. Listening must
show a missed state change before adding a cue. Reuse the current sample/synth system; test actual
event dispatch, exactly-once behavior, mute/gain/fallback/cleanup and full checks for runtime fixes.
Do not reopen completed gain/mute work or invent subjective mix adjustments from source alone.

## External handoff and unchanged boundaries

No human testers are available. Keep these dependencies visible without repeatedly requesting one:

- Human acceptance: real screen reader, controller and audio observations; earned Runs 1–5.
  Use [acceptance worksheet](ACCEPTANCE-WORKSHEET-2026-10-17.md). Automated pad/DOM checks are separate.
- Hardware: motion/performance and physical input checks on the documented target machines.
  Existing new floors remain opt-in until motion/hardware acceptance.
- Steam access: real app/depot, partner account, achievements/cloud/controller validation; App 480
  does not establish release acceptance. Use the [release handoff](RELEASE-HANDOFF-2026-10-16.md).
- Analytics: validate actual collection and record a start date before counting the two-week window.
- Release: Claude owns production/executable packaging. Provide the reviewed commit and existing
  release checklist; do not package, submit, merge diverged main or deploy without specific authority.

The latest user instruction authorizes commit and push. Main has diverged from origin/main;
use the existing review branch `codex/last-bastion-decision-plan-2026-10-25` without a force push.
A review-branch push is not evidence of a live website update or packaged release.

Practice retains its repeated-learning-failure evidence gate. New heroes, monsters, items/cards,
nodes, terrain, art and expansion need demonstrated gaps and explicit bounded scope. No speculative
content backlog is added simply to keep implementation busy. Do not expand into unrelated Expo
maintenance. Preserve the design/art/environment contracts, asset inventory, acceptance worksheet,
release handoff and [completed-work log](last-bastion-log.md) as references. [Archive index](archive/README.md)
contains superseded queues; only this document schedules remaining work.
