# Remaining Phase 2 review and Phase 4 exposure trace — 23 October 2026

[CURRENT-PLAN](../../CURRENT-PLAN.md) is the sole queue. Started at `1557dd91`; pre-existing
About/privacy/social and unrelated website changes excluded. Prepared local browser identity
`web-2026.10.23-shop-fit`; schema 16 / simulation compatibility 3 unchanged.

## Confirmed defects corrected

SHOP-01: real 960×540 captures `shop-before.png` and `manage-before.png` show clipped top titles;
management used a 980-wide panel in a 960-wide camera, and six shop rows requested 610 height
inside 540. Reused the existing panel art and native code text: six rows now use a 516-high panel,
management width 928, and more than six options use two columns. Text stays at its original size.
An intermediate container-scaling approach produced clipped text rasterization and was replaced;
no such scaled layout ships. No item price, description, reward or stock selection changed.

INPUT-03: actual browser navigation exposed duplicate arrow movement because keyboard navigation
and movement intent counted the same press. DecisionNavigation now consumes the intent edge but
gives the keyboard delta precedence. Enter confirmation also failed because KeyboardMouseInput
had consumed the shared Enter/Restart edge before the decision overlay read it. The overlay now
accepts that recorded edge while a decision is open. Existing gamepad evade-confirm stays intact.

The browser regression traverses management to Back and confirms with Enter at 960×540,
1280×800 and 3840×2160. Pure production navigation regression checks a mirrored key/stick press
moves once and stays consumed while held. `shop-complete.txt` passes; earlier attempts expose the
navigation failures and are retained. `shop.png` and `manage.png` are inspected final output:
titles and rows fit, no fractional-scaling text artifacts. Sample offer content differs between
captures because these diagnostic routes were not seed-pinned; no content comparison is inferred.

Human reading at minimum size/4K, physical pad, real stock purchases/sales and event/audio acceptance
remain open. No whole-game accessibility claim. Automatic approval review temporarily failed on
usage limits; the rejected browser command did not execute until the user's continuation and retry.

## Phase 2 review disposition

Reviewed actual LevelUpDecision, UpgradeTilePresentation, ScrapShopCandidateConstruction,
ScrapShopDecisionPresentation, CombatDecisionOverlay and CombatSimulation consumers. Existing
upgrade options name next rank/category and authored effect; shops disclose immediate installs,
prices/shortfall, item benefits/penalties, locking/reroll, bans and sale values. Level-stat cards
already show numerical grants. `upgrade.png` shows the current mixed card presentation fitting.
The captured defects warranted layout/input fixes, not another comparison system or new artwork.
Actual before/after build comparisons remain an optional response to a demonstrated player
misunderstanding; none was established here. Map/debrief/terrain review remains recorded in Phase 2.

## Phase 4 production trace (read-only)

`trace-content.mjs` invokes actual map, encounter, placement and shop eligibility functions through
installed Vite, without a game build, player save, content changes or new dependency. Run from dev:

```powershell
node ../playtest-evidence/2026-10-23-content-review/trace-content.mjs > ../playtest-evidence/2026-10-23-content-review/content-trace.json
```

The first 100 map seeds yield 2,000 graph-reachable nodes, zero disconnected nodes, all nine node
types, all seven mini-boss identities, all three optional movement objectives and six liberation
shop profiles. Counts include alternative branches, not the nodes one player visits in a run.
53 event definitions appeared there; the remaining Devourer's Dream has a concrete production
selection witness at seed 139/node 17. Its initial absence was a sampling gap, not missing content.

Across 100 placements for each registered theme at baseline arena dimensions, all 22 eligible
world objects appear. Seven interaction objects are intentionally excluded: teleporter, stargate,
control/turret/trap consoles, cryogenic tube and weapon upgrade station. Their verbs remain gated.
Shop item lists are eligibility by profile, not measured draw rates or guaranteed stock. This trace
does not audit every regular enemy spawn, item acquisition path or event effect end-to-end.

### EXPOSURE-01 — confirmed regional-finale route gap; P2 review, gated activation

All 100 sampled ordinary finales select Bastion Eater. Source explains why: ExpeditionMap.buildLayout
always assigns its last ARENA_THEMES entry to the boss node, and bossKindForTheme returns Bastion
Eater for it. Choir/Sovereign selectors exist for hive/toxic and foundry/science themes but those
themes never become the generated terminal through this path. Their diagnostic fixtures passing
does not prove ordinary generated-map reachability. No claim that every other game route lacks them.

Benefit/scope: potentially use already implemented regional bosses before adding new monsters.
M effort, high save/replay/balance risk; reuse existing bosses/art/audio. Dependency: VARIETY-01
observed-run and analytics gates plus a defined finale-selection policy. Do not randomly alter the
terminal theme as a quick fix: resumed maps are regenerated from seeds and could change mid-run.

Steps when gates are met: trace all production finale callers, choose an authored region/finale
policy, version or migrate run/map generation deliberately, preserve old in-progress seeds, then
wire one existing regional finale. Acceptance: new-map witnesses for intended bosses, stable old
save/replay behavior, coherent map preview/theme/descriptor/combat, fair rewards and normal travel.
Tests: generator-to-encounter integration, save resume/replay compatibility, real renderer route,
existing boss regressions and full game/portfolio. Humans: earned full routes and boss counterplay
on keyboard/controller plus hardware pacing. No boss art batch or immediate production activation.

## Verification and remaining gates

Finalized 24 October; folder and prepared identity retain the start date. Final verifier at HEAD
`83ce5a07` with scoped working changes: **PASS 139.9s**, **1,795 unit tests / 314 files,
53 browser tests, 31 desktop-host tests**, plus static/build/output/smoke/offline/site checks.
See `verification-final.json` and `verification-final.txt`. It ran after the final Enter fix and
after diagnostic processes ended. Portfolio `portfolio.txt`: **all 20 PASS**, run during this
continuation before the last input corrections; it is not an exact final-tree rerun.
Earlier `verification.json`/`.txt` failed before the Enter correction and overlapped a diagnostic
browser run. Retained failed targeted attempts are intermediate evidence, not final acceptance.
Concurrent HEAD changes affect unrelated website pages; unrelated working edits were not staged.
Content/variety gates, floor opt-in, practice learning gate, human/device/Steam and release ownership
remain unchanged. No push, deploy, package, new assets, expansion or fleet dependency maintenance.
