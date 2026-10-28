# Transaction acceptance — 29 October 2026

Tests/documentation only. Runtime remains `web-2026.10.28-run-save-recovery`, schema 17,
simulation compatibility 3. No new production changes, content or balance adjustments.

## Fresh cases

Two production browser cases seed valid production-generated paths on map 117:
- Path 1 → 4 → 7: choose Patch up at the supply depot, leave its shop and finish the node.
  Forced storage failure retains combat beyond navigation timers and blocks Restart bypass.
  Failed retry remains local; successful retry returns to the map with healed health, 115 scrap,
  cleared IDs [1,4,7], exactly one node credit and no completed-run credit.
- Path 1 → 3: abandon the expedition via the real confirmation control. Failure/retry retains
  the terminal result; successful retry opens summary, clears the pending expedition and stores
  exactly one expedition run/history record with the abandonment cause.

Two integration tests use actual CombatSimulation choices, expeditionBuildFromCombatSnapshot,
LocalSaveStore serialization/normalization and a newly constructed CombatSimulation:
- Purchase an actual seeded item offer; ownership, item stats, max health, armour and exact scrap
  remain equal over three saved node handoffs, without applying the item twice.
- Lock an offer, pay the authored reroll cost, retain that offer, then ban it. Ban and exact spend
  survive save/reload; the next shop excludes it. Lock/reroll counters remain intentionally visit-local.

See [browser checks](browser-targeted.txt) and [installed-runner checks](transactions-targeted.txt).
Full verification passes in 214.2 seconds: 1,810 tests in 317 files, 69 browser checks,
31 desktop-host tests, static/type/build/smoke/offline and site JavaScript checks.
See [machine report](verification.json), [full output](verification.txt), and
[all 23 passing portfolio guards](portfolio.txt). The first full attempt caught a readonly-array mismatch in the test
fixture, corrected by copying the carrier arrays into the save input; no production fix was needed.

## Bounds

These checks exercise non-final expedition victory and expedition abandonment, supplementing
Quick Drop, event, map, armory and stash recovery evidence. They do not independently exercise final
boss victory with a failed write, nor establish complete observed runs, fun, power-loss resilience,
physical controller/screen-reader, Steam or hardware acceptance. Keep final-boss failure coverage as
a bounded follow-up, not a reason to delay the approved G7 integration design indefinitely.
No push, package or deployment.
