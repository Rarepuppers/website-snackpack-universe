# Decision input transitions — 25 October 2026

Starting checkpoint 842d4ac3; runtime identity web-2026.10.25-decision-labels unchanged.
No runtime, generated output, asset, save, economy or content changes in this continuation.

## New executable regressions

Three published-output browser cases start a 12-weapon shop, open management/selling, navigate to
Next Page, and hold confirmation through the transition:

- Pointer: click the actual visible Next control using canvas-relative coordinates, keep mouse
  down and move over a destination weapon before release.
- Simulated standard pad: hold button 0 over multiple production input polls before release.
- Simulated pad with synthetic window blur/focus while button 0 remains held.

Each checks both destination weapon IDs remain, that release does not sell, and that keyboard
navigation back to the previous page reproduces its original choice IDs. This also covers sequential
keyboard-to-pointer/pad-to-keyboard use, not every simultaneous mixed-input combination.

Final targeted run: **3 passed in 13.6s** (final.txt). Initial two-case pass retained in targeted.txt.
No defect reproduced, so no edge-suppression code added. Execute from nested website root:

```powershell
npx playwright test --config playwright.last-bastion.config.mjs -g "shop page transition"
```

The suite now contains 58 cases; only these three were newly run here. The previous full 54-case
run and separately verified resize/held-key coverage remain dated. Full game/portfolio checks were
not repeated for this test/documentation-only continuation. Source diff and documentation links checked.

## Limits / remaining work

This tests real browser/Phaser pointer handling and injected navigator.getGamepads data, not a real
controller. Synthetic blur/focus is not an actual OS application switch. Keyboard-repeat coverage
is recorded in the prior decision-shortfall evidence. Held digits, simultaneous mixed inputs,
stick neutral/re-engage behavior and every disabled/page-boundary permutation remain to assess.
These ID checks establish no unintended sale in the scoped fixture; persistence, purchase and
failure transactions remain STATE-02. No real human/device acceptance, push or release performed.
