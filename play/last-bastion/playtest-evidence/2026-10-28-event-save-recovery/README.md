# Event save recovery — 28 October 2026

Prepared runtime `web-2026.10.28-event-save-recovery`, schema 17, simulation compatibility 3.
G6 bounded fix for a freshly reproduced event-to-map handoff loss.

## Confirmed defect

Production-generated seed 117 path 1 → 3 → 6 → 9 reaches Fleshwright Altar. A saved build with
5 health and no shield selects Let it feed, which heals and grants 5 shield. Injecting a storage
write failure before confirming the result still navigated to the map. The old persisted build
was loaded and the reward held only in the previous scene's LocalSaveStore was discarded.
The [before regression output](before.txt) records the unexpected map navigation and absent recovery.
This is fresh renderer evidence, not a hypothetical defect inferred only from source.

## Fix

ExpeditionEventScene keeps a pending destination after applying the outcome once. It navigates
only after the store reports saved. Otherwise a focused native recovery dialog explains that
the result remains in this window and offers Retry saving and continue. Retry only calls the
existing retryPersistence method; it never reapplies rewards or recordNodeCleared. Repeated failed
retries cannot grant twice. The same event handoff guard wraps the ambush destination too.

The dialog has a labelled alertdialog, described recovery text, visible keyboard focus, native
button activation and a one-button Tab loop. A controller confirmation retries the write.
Existing event/demo confirmation and reward/progression rules remain unchanged. No asset changes.

## Verification

The initial targeted fix and existing event-confirmation cases pass (2 tests, 1.9 seconds).
The full run also checks keyboard focus/Tab, failed retry, successful retry, exact one-node credit,
persisted shield/health and real map navigation. Full game verification passes in 167.8 seconds:
1,808 unit tests in 316 files, 65 browser checks, 31 desktop-host tests, and static/type/build/
smoke/offline/site JavaScript checks. See [report](verification.json), [output](verification.txt)
and [inspected recovery dialog](event-save-retry.png). All [23 portfolio guards](portfolio.txt) pass.
The runtime witness covers a non-ambush reward; the ambush branch shares the guard but is not
claimed as independently exercised. Real AT/controller/power-loss/hardware/Steam tests remain open.

## Remaining bounded G6 work

Source inspection found other full-page navigation after saves in ExpeditionScene travel and
PrototypeScene encounter/run completion. They need targeted runtime write-failure witnesses
before claiming equivalent defects or expanding the patch. Shop lock/reroll state is visit-local;
owned items, banned IDs and scrap use the existing expedition build carrier. Keep any further
transaction/save checks tied to actual consumers, not a replacement persistence framework.
No push, deploy, package or submission.
