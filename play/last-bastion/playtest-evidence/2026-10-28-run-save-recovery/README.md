# Run-end save recovery — 28 October 2026

Prepared runtime `web-2026.10.28-run-save-recovery`, schema 17, simulation compatibility 3.

## Evidence and scope

A production browser starts a normal seed-117 Quick Drop, opens End Run and clicks its real
confirmation row. Storage writes are forced to fail. The corrected witness fails against the
original committed PrototypeScene bundle and passes against the patch. Earlier keyboard-only
attempts did not reliably activate End Run and are not used as defect evidence.
See [original-bundle regression](before.txt) and [targeted passing run](targeted.txt).

Source confirmed run-end navigation did not check persistence, despite run history and rewards
being held in the departing scene's LocalSaveStore. PrototypeScene now uses SaveHandoffRecovery
for automatic summary navigation, non-final expedition completion and the terminal Restart
shortcut. The existing runOutcomeRecorded guard still owns one-time reward/record application;
retry only writes the cached state. While recovery is active combat update/navigation is blocked,
and controller menu-confirm may retry. Shutdown removes the native panel. No balance/save-schema
change. Existing bounded platform-sync timing remains; retry does not establish Steam acceptance.

The runtime case waits past the 2.5-second navigation fallback, presses Restart, retries while
writes still fail, restores writes and verifies actual summary navigation, one finished run,
one history entry and the Run abandoned cause. This directly covers Quick Drop abandonment.
Expedition victory/defeat and combat-to-map use the same guard but are not independently witnessed
by this case; record that distinction rather than claiming complete run-end failure coverage.
Full verification passes in 184.3 seconds: 1,808 unit tests in 316 files, 67 browser checks,
31 desktop-host tests, static/type/build/smoke/offline and site JavaScript checks.
See [machine report](verification.json), [full output](verification.txt), and
[all 23 passing portfolio guards](portfolio.txt). Evidence finalized 29 October; prepared identity
and originating implementation date remain 28 October. No push, package or deployment.

## Remaining work

G6: independently exercise expedition terminal/combat-to-map save failures and remaining shop
purchase/ban/currency round-trips if not already covered. Do not repeat completed armory/event/map
slices or redesign persistence. G7 regional-finale design follows; activation gates remain intact.
Real power-loss, controller, screen-reader, hardware, audio and Steam acceptance stay external.
