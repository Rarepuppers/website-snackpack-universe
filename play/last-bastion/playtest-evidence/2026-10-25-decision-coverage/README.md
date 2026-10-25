# DECISION-COVERAGE: authored shop labels — 25 October 2026

Baseline 1e1654cb; prepared local identity web-2026.10.25-decision-labels. Shared working-tree
About/privacy/social/arcade edits are excluded. No assets generated or production content enabled.

## Confirmed defect

The real CombatDecisionOverlay placed every shop label 15 pixels above the row centre, assuming
short two-line labels. Production weapon candidate descriptions can wrap to four lines (62 pixels
at the existing 13px font and spacing). This put the bottom 16 pixels outside a 62px choice button.
The art-enabled catalogue audit reports 81 failing cases of 313 before the correction. Repeated
stock companions account for repeated failures; this is not 81 unique broken items.

Centre each shop label using its measured height. No font reduction, description truncation,
price/reward adjustment or new asset. After: all 313 enumerated cases report no label/button
or panel/viewport overflow. Inspect long-description.png for the actual overlay and loaded art;
this isolated scene has a black background, not production combat. Four-line labels fit tightly;
comfortable inset and decorative-frame layout remain DECISION-POLISH work.

## Reproduction / coverage

From the nested website root:

```powershell
node play/last-bastion/playtest-evidence/2026-10-25-decision-coverage/audit-bounds.mjs coverage-final.json
```

The script uses an isolated Vite/Chromium scene and imports the real simulation, candidate builders,
upgrade planner, asset manifest and overlay. It loads relevant production art, visits every page
of each generated decision, records visible choice IDs and exits nonzero for reported overflow.
Fixtures: 30 scenario seeds covering shop/manage/sell/upgrade/stat/placement; 4/8/12-weapon sell
racks; catalogue upgrade ranks; all weapon/item catalogue candidate labels, including locked labels.
Candidate catalogue inclusion does not prove every item is eligible for a given profile, earned,
or selected in a normal run. Fixtures use representative prices and wave 1; they do not cover
all dynamic price lengths. This is a bounded presentation audit, not a content exposure census.

Files: coverage-before.json is the pre-fix baseline; coverage-after.json is the first rerun;
coverage-final.json and long-description.png use the final reporting script. The initial attempted
rerun was rejected because automatic approval review reached a usage limit; it did not execute.
After the user's continuation, the authorized rerun succeeded.

## Validation and limits

Full game verifier PASS in 166.1s: 1,795 unit / 314 files, 54 browser and 31 desktop-host
tests plus static/output/smoke/offline/site checks. Portfolio: **all 23 current guards PASS** (portfolio.txt). Save schema 16 and
simulation compatibility 3 remain unchanged. No push/deploy/package in this continuation.
Additional boundary pass: 318 cases, zero reported overflow (coverage-boundaries.json), including
11/12 weapons (12/13 choices) and the 12-rack + 4-stash maximum through createWeaponInventory and
the actual sale-entry builder. It visits all resulting pages; this does not prove earned reachability.
Remaining DECISION-COVERAGE: production-scale
1280×800/4K and open-overlay resize, title/hint/focus/hit-area assertions. Input edges, pointer/pad
transitions and conditional selection fixes remain separate accepted subtasks. Real readability,
screen-reader, controller and hardware acceptance remain unavailable, not passed.


## Follow-up: live resize regression

After runtime commit 5c410310, added a production-browser regression opening page 2 of a full sell
rack, resizing through 1280x800, 3840x2160 and 960x540, waiting two browser render frames, checking
panel fit, unchanged page/choice IDs/selection, then activating Back. Targeted final test passes
(resize-final.txt). No runtime/source/output changes in this follow-up. The previous full verifier
covered 54 browser cases; the suite now contains 55, with the added case run separately. Do not
present this as a fresh full-suite run. This test covers live page continuity and panel fit, not
all catalogue text, physical hardware or real controller behavior. No new portfolio run needed for
this test/documentation-only continuation; the preceding 23/23 result remains dated.
