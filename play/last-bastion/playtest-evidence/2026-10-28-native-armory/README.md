# Native armory — 28 October 2026

Prepared local identity `web-2026.10.28-native-armory`; schema 17, simulation compatibility 3.
G5 final implementation slice. No progression, cost, art, content exposure or balance changes.

## Implementation

SemanticShell exposes a native selector for all six released ARMORY_NODES, balance, description,
cost, missing prerequisites, insufficient marks, owned/equipped/clearance state, a separate
purchase/equip action and Back. Inspection changes only armoryIndex. Existing ScreenFlow.stepArmory,
canPurchaseArmoryNode/canSelectArmoryNode and LocalSaveStore purchase/select effects remain authoritative.
The canvas retains the backdrop; native controls replace the canvas foreground.

Keyed controls preserve focus after selection and purchase. Keyboard Enter/Space use the actual
button once; simulated-pad A uses the focused button, including Back. Directional pad navigation
retains existing armory ordering. No preview can grant or equip anything.

## Fresh evidence

Three targeted production-browser cases pass (4.5 seconds):
- Fresh profile cannot purchase; an affordable node still requires its prerequisite.
- Inspection does not spend/equip. All six purchases succeed in dependency order, lifetime 100
  leaves balance 15, repeated Enter does not charge again, and hero clearance never replaces a kit.
- Equipped kit, purchased nodes and remaining marks survive renderer reload through the real store.
- All six detail panels fit at 960x540 and 3840x2160 without clipped text or out-of-panel controls.
- Simulated-pad held A purchases once; A on focused Back returns once and restores menu focus.
- Injected storage write failure exposes the existing Retry saving control; retry and reload retain
  the purchased kit with exactly one charge. Durable storage stays unchanged until retry succeeds.

[armory.png](armory.png) is the inspected production renderer at 960x540.
Full verification passes in 165.9 seconds: 1,808 unit tests in 316 files, 64 browser checks,
31 desktop-host tests, plus static/type/build/smoke/offline and site JavaScript checks.
See [machine report](verification.json), [full output](verification.txt), and
[all 23 passing portfolio guards](portfolio.txt). Automation is not real screen-reader,
physical-controller, power-loss, audio, observed-run, hardware or Steam acceptance.
No push, deployment, executable packaging or submission.
