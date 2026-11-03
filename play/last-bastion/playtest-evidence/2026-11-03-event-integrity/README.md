# Phase 1 — event exchange integrity, 3 November 2026

Implementation evidence; [CURRENT-PLAN](../../CURRENT-PLAN.md) remains the sole queue.
Starting HEAD `343cd595`, following audit commit `5bd1670e`. Prepared local runtime
`web-2026.11.03-event-integrity`; schema 17 / simulation compatibility 3 unchanged.
No new assets, content activation, executable packaging, push or deployment.

## Delivered E1–E3

- Shared `eventChoiceUnavailableReason` in `dev/src/game/expedition/EncounterEventCatalog.ts`
  drives both `isChoiceAvailable` and defensive resolution. Unsupported hunt/echo effects are
  locked; the unused reroll carrier is also not treated as a working offer. Four authored
  hunt/echo offers retain their IDs but cannot charge or advertise an active reward.
- Transformation grants preflight every requested pick with the production affinity rules,
  before costs. Path-locked, max-rank, apex and partially legal multi-grant exchanges preserve
  the original build and return no side effects. Applying a rejected result also preserves it.
- For gambles, every possible branch must be fulfillable before offering the choice. This is
  deliberately conservative: no branch is removed or rerolled, and valid gambles retain their
  original seeded weights. A capped Mutagen Pool branch therefore locks that entire offer.
- Designed Arrival's relic offer requires an owned relic; eligibility is rechecked in resolution.
  A successful grant consumes one copy, while a blocked grant consumes nothing.
- Both the actual expedition event screen and the event review screen use the same reason,
  replacing the unavailable reward detail with readable player-facing text. Leave and working
  alternatives remain. Event/map identities and RNG draw order are unchanged.
- Runtime identity and dedicated Last Bastion service-worker cache identity are updated; local
  compiled web chunks are refreshed. Claude still owns executable/production packaging.

The [audit witnesses](../2026-11-02-audit/README.md) are retained as historical before evidence.
Their reproduction driver intentionally describes the old bug and is not a passing regression
for the fixed runtime. New permanent tests use those generated routes, not invented map topology.

## Verification and exact scope

| Check | Result |
|---|---|
| [Focused expedition/transformation tests](targeted-after.txt) | 204 tests / 14 files pass. |
| [Full unit lane](unit.txt) | 1,821 tests / 318 files pass, including 11 new exchange cases. |
| [Web build/typecheck](build.txt) | Pass. Existing large-chunk advisory remains; not a build failure. |
| [Source/output comparison](build-check.txt) | 25 published outputs match source. Later source edits are comments only. |
| [New browser regressions](browser-after.txt) | Six pass: five rejected exchanges, plus legal duplicate-relic sacrifice through failed writes/retry/reload. |
| [Existing browser regressions](browser.txt) | Event fresh confirmation, event failed-write recovery and final-boss reward recovery pass. The same first run also passed the legal relic case; five new tests initially failed only on Leave adding neutral legacy-save defaults. Assertions were corrected; six-case rerun passes. Nine distinct relevant browser tests pass across the two runs. |
| [Offline delivery](offline-after.txt) | Static check: 423 local references, zero missing assets/remote imports/startup calls. This is not a fresh disconnected-browser boot. |
| [Site JavaScript](site-js-after.txt) | Syntax check passes for 75 files. |

The initial targeted test expected a low-health direct resolver call to bypass its requirement;
it now correctly expects rejection. [Initial log](targeted.txt) is retained. Initial offline/site
commands could not initialize sandbox processes; approved retries pass. No runtime change was
needed for either environment failure. No full browser/desktop-host/portfolio matrix was repeated.
No hardware, real pad/hotplug, real screen-reader, listening, Steam or packaged-window acceptance.

Browser tests exercise the actual local bundle with disposable storage: held/repeated Enter and
pointer clicks cannot spend or complete rejected offers; reload retains state; Leave remains
reachable and completes the same node. A valid relic exchange retains exactly one remaining
copy and one Martyr affinity after failed saving, repeat retry, successful persistence and reload.
Unit cases separately cover apex, multi-grant atomicity, random branches, legal Serum spending,
missing relics and other-path relic preservation. Simulation/seed compatibility remains unchanged
because the correction is in event eligibility/resolution outside combat replay.

Minimum-viewport screenshots: [path lock](locked-locked.png), [missing relic](free-locked.png),
[max rank](capped-locked.png), [unavailable hunt](hunt-locked.png), [unavailable echo](echo-locked.png).
Path-lock and missing-relic captures were visually inspected at 960×540: reason and Leave fit,
with selected border and LOCKED status visible. No broad 4K/motion or accessibility claim.

## Remaining work

U1 actual event result deltas and U2 duplicate-relic explanation remain in CURRENT-PLAN. G7/G8,
floors, Practice, new art/expansion and external release gates remain unchanged. These fixes do
not implement unsupported hunt/echo mechanics, add relic stacking or repair the broader summary.
Concurrent about/privacy/social/game changes were left untouched and excluded from this commit.
