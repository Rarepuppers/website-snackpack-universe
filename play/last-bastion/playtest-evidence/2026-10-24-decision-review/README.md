# Decision layout continuation — 24 October 2026

Starting checkpoint 5ced3ecb; prepared output web-2026.10.24-decision-pages.
Concurrent About/privacy/social/other-game and arcade-plan edits are excluded.

## Confirmed defect and correction

Production CombatSimulation with scrap-shop, seed 61061 and startingWeaponCount 12 yields
13 sell choices. The real CombatDecisionOverlay requested 586 pixels of panel height in a
540-pixel viewport. The normal sell consumer includes rack and stash entries, so bounding the
list to the initial small-rack diagnostic was insufficient. This is layout evidence, not evidence
of earned human progression. No prices, equipment capacity or rewards changed.

Oversized shop lists now show ten source choices plus Previous/Next controls. Page actions stay
inside the overlay and never enter the transaction resolver. Existing text size and art are reused;
Back remains reachable on the final page. A source decision change resets the page; unchanged
per-frame sync preserves it. No assets generated or save schema changed.

## Reproduction and checks

Run from the nested website root:

```powershell
node play/last-bastion/playtest-evidence/2026-10-24-decision-review/audit-bounds.mjs
npx playwright test --config playwright.last-bastion.config.mjs -g "full shop racks"
```

The isolated Vite/browser harness invokes the real simulation, upgrade planner and overlay with
plain panels (useMarineArt=false), measuring real Phaser labels against choice rectangles.
Before: 227 cases, one panel overflow (bounds-before.json). That first catalogue pass omitted
support/scavenger rank-one cases because its slot fixture used an incorrect category; the corrected
post-fix pass covers 231 cases with no reported overflow (bounds-after.json). These counts are not
identical before/after populations. It covers 30 seeds across six scenario/management/sell states,
larger racks and upgrade ranks. It is not a complete catalogue, viewport, art or input census.

The browser regression uses actual published output/art at 960×540, opens the 12-weapon sell list,
checks first-page fit, navigates forward/back, confirms original item IDs remain and reaches Back.
The first attempt failed because it expected Back to return to management; production routing and
its existing test specify offers. The corrected expectation passes (targeted-final.txt); the failed
attempt is retained. Paging exposes no purchase action in its resolver path. Actual purchase/resume
integration belongs to STATE-02 rather than being inferred from this navigation test.

Full game verification PASS in 152.7s: 1,795 unit / 314 files, 54 browser and 31 desktop-host
tests plus static/output/build/smoke/offline/site checks (verification.json/txt). Final production
captures sell-page-1.png and sell-page-2.png were inspected: both pages, titles, labels and Back are
within the minimum viewport. Disabled paging controls use existing disabled treatment. The last
row overlaps the decorative panel frame, as in the existing shop layout, but remains onscreen.
Portfolio: **all 22 guards PASS** (portfolio.txt), including the shared asset-manifest validator.
Finalized 25 October; identity and evidence folder retain the implementation start date.

## Remaining scope

DECISION-02 remains partial: catalogue-wide art-enabled text bounds, all production item/weapon
choice descriptions, other viewports and held-input/pointer/simulated-pad transitions still need
coverage. The current harness reports only the first visible page for each generated decision;
the browser case traverses both pages of the reproduced case. No claim that all possible lists fit.
No human testers available: physical-pad, readability, screen-reader and hardware acceptance remain
open. No publication, package, balance changes or new content. CURRENT-PLAN owns the active queue.
