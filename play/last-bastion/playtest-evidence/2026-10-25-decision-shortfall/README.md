# Decision shortfall and held-key checks — 25 October 2026

Baseline runtime 5c410310, test checkpoint 1447baf6, starting HEAD b56f5180.
Identity remains web-2026.10.25-decision-labels. This continuation changes tests/evidence only.

## Dynamic label coverage: no additional defect reproduced

Extended the art-enabled production overlay harness to hydrate each candidate stock through
refreshScrapShopAffordability at both zero and 150 Scrap, retaining a locked offer. This exercises
real SHORT/LOCKED label combinations rather than inventing their display strings. 399 cases pass
at the 960x540 logical viewport; no reported choice-text or panel overflow. shortfall-before.json
is the result before any further runtime edit (none was needed); its name is not a failure claim.
The inherited capture shows the representative affordable long description, not all shortfall cases.
This remains bounded: profile/depth price lengths, title/hint/focus bounds and catalogue-wide
physical presentation paths are not all covered. Candidate display fixtures do not prove earned
shop eligibility or actual selection frequency.

Run from nested website root:

```powershell
node play/last-bastion/playtest-evidence/2026-10-25-decision-shortfall/audit-bounds.mjs
npx playwright test --config playwright.last-bastion.config.mjs -g "full shop racks"
```

## Held Enter: no defect reproduced

Extended the existing full-rack published-output browser test: hold Enter while changing to page 2,
wait for the page, send three repeated keydowns without keyup, allow two render frames, then release.
Existing assertions verify the two destination weapons remain, return to page 1 reproduces all
original option IDs, and Back remains usable. The targeted browser test passes (held-enter.txt).
This is specific to Enter repeat and the tested fixture; it does not establish pointer, simulated
pad, mixed-device, blur/refocus or digit transition safety. No input code changes were justified.

## Verification provenance

Targeted catalogue renderer and browser regression passed. No runtime/generated output/assets
changed, so the preceding full game and 23-guard portfolio results remain dated and were not rerun.
No human/device acceptance, content activation, packaging or publication. Concurrent site edits
remain excluded. CURRENT-PLAN owns remaining work.
