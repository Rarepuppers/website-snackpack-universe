# Last Bastion release notes

## 15 October 2026 — reliability, controls and build inspection

**Release:** `web-2026.10.15-controls`

**Status:** prepared and verified locally; not deployed by this work. The desktop package has
not yet been refreshed for these changes.

### Fixes

- Failed startup or character-art downloads now offer recovery instead of leaving a blank or
  repeatedly loading screen.
- Daily streaks can continue beyond the 60-day detailed-results history. Retrying a Daily after
  midnight selects the current day, and shared results disclose speed changes during an attempt.
- Restarting an encounter now records its current starting settings instead of retaining the
  discarded attempt's settings history.
- Pause menus use consistent controller buttons independently of combat remapping. D-pad
  navigation works in build inspection, and Back no longer also confirms another action.
- Pause/settings rows reliably accept the first pointer click. Keyboard build navigation no
  longer skips pages, and pause/build panels stay onscreen at 1080p and 4K.
- Stashed weapons are included in build inspection. Controller deadzone limits are consistent.

### Improvements

- Build inspection shows readable weapon, perk, relic and artifact names, complete paginated
  inventories, estimated damage and transformation-affinity thresholds.
- Settings are grouped for easier navigation. Build-page hints explain keyboard/controller
  actions, and affinity headings no longer count explanatory text as paths.
- The standard arena floor is subdued to make combat easier to read. Title copy describes all
  three play modes.
- Returning visits reset on the local day. Abandoned runs are classified separately from defeats;
  expedition reporting no longer treats nodes as waves.

### Save compatibility

Existing saves remain supported with schema 16. Daily participation is retained separately from
60-day detailed history. Dates already discarded by an older version cannot be recovered.

### Validation and remaining acceptance

All required automated verifier lanes pass: 1,775 unit tests, 27 browser checks, smoke/offline,
published-output consistency and desktop-host tests. All 19 portfolio guards passed.
Observed full runs, physical-controller/audio/display checks, a fresh desktop package and Steam
acceptance remain open. New content, practice mode and new art/music are not part of this release.

Implementation commits: `c7779414` and `ebc9a4b2`. See the [current plan](CURRENT-PLAN.md)
for release gates and the [completed-work log](last-bastion-log.md) for delivery history.
