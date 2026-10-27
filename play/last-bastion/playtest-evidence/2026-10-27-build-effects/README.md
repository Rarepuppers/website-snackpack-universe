# Build effect explanations — 27 October 2026

Prepared local identity `web-2026.10.27-build-effects`; schema 17 and simulation compatibility 3.
G3 extends the existing pause/build inspector. No new art, mechanics, economy or balance tuning.

- BuildViewModel carries owned item IDs from the production snapshot.
- Owned Items groups identical IDs, shows the actual copy count and the catalogue description
  labelled **Each**. Benefits, penalties and triggered effects use existing authored copy;
  these are not claimed as cap-adjusted totals or a recommendation score.
- Relic/artifact rows now include their authored effect descriptions. Existing wrapping and
  six-physical-row pagination retain all text. Weapons remain labelled estimated DPS.
- Shop item offers show NEW or OWNED N from the simulation's current item list, retaining
  LOCKED status, prices and authored descriptions. Upgrade rewards already show next rank
  in LevelUpDecision; those controls and labels were not duplicated.

## Checks

The renderer harness uses production simulation, candidate factories, presentation and overlay
with existing art. `audit-bounds.mjs` passed 318 cases at 960x540, including locked catalogue
items with 99 copies: zero choice-text overflow. See coverage-final.json. Its final screenshot
is a representative shop surface, not an earned play session or the new inspector.

The new unit regression constructs a real simulation with all catalogue items/relics and
checks every item/relic/artifact description survives the paged presentation, including
negative modifiers and duplicate counts. The existing renderer/save-reload regression now
also inspects actual item, relic and artifact descriptions at 960x540 and 3840x2160.

Full verifier PASS in 185.4 seconds: 1,807 unit tests, 59 browser checks and 31 desktop-host
tests, plus static/build/smoke/offline. All 23 portfolio guards pass; reports are beside this file. These checks do not
establish human comprehension, real screen-reader/controller behavior, hardware or Steam
acceptance. No generated assets, package, push or deployment.
