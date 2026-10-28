# Map save recovery — 28 October 2026

Prepared runtime `web-2026.10.28-map-save-recovery`, schema 17, simulation compatibility 3.

## Confirmed defect and fix

A production-browser witness opens seed 117's map, injects a localStorage write failure and
confirms travel. Before the fix, the real map launched node 3 combat despite failing to persist
its pending encounter position. See [before output](before.txt). This risks mismatched encounter
context because the next page reconstructs the run from storage rather than the departing scene.

Map launch now waits for a successful save. The selected destination and build remain in memory;
Retry saving and continue writes that existing state before launching the original encounter.
Escape and directional/pointer map controls cannot abandon or change the route during recovery.
Event recovery uses the same small SaveHandoffRecovery presentation helper, retaining its existing
one-time reward application. It does not own gameplay or replace LocalSaveStore.

## Fresh verification

[Targeted browser output](targeted.txt) passes map failure/retry and the existing event reward
failure/retry regression. The map case waits past the travel timer, checks that Escape and a failed
retry remain on the map, restores writes and verifies the persisted target matches the launched
encounter. The event case still verifies exact reward and node credit after retry.
Full game verification passes in 177.4 seconds: 1,808 unit tests in 316 files, 66 browser
checks and 31 desktop-host tests, plus static/type/build/smoke/offline/site JavaScript checks.
See [machine report](verification.json) and [output](verification.txt). The first full attempt
caught the new shared executable chunk missing from the service-worker cache list; adding it
resolved the delivery failure before this passing run. All [23 portfolio guards](portfolio.txt) pass. Verification ran in the shared dirty checkout;
unrelated edits and a concurrent arcade cache-version change are excluded from this commit.

No claim of real power-loss, screen-reader, physical-controller, hardware or Steam acceptance.
The failure witness covers map → combat; map → event shares the same guard but is not independently
exercised in this failure case. Combat/run-end handoffs remain the next G6 investigation, followed
by bounded remaining transaction checks and G7 design. No content/balance/assets, push or packaging.
