# Last Bastion release notes

## 23 October 2026 — deliberate event confirmation

**Prepared locally:** `web-2026.10.23-event-confirmation`; not published or packaged.

- Holding Select no longer skips an expedition event result. Continue requires a fresh
  Enter/Space, pad A or the visible pointer button; other keys/buttons preserve the result.
- The result overlay blocks covered choices. Event costs, rewards and probabilities are unchanged.
- Real controller, event travel and readability acceptance remain open.

## 22 October 2026 — live audio controls and cleanup

**Prepared locally:** `web-2026.10.22-audio-controls` — not pushed, deployed or desktop-packaged.

- Master/SFX volume and Sound now affect already-playing combat samples and synthesized feedback
  through one output gain with a short transition. Zero/mute stops active voices and cancels the
  rotary weapon's delayed end cue; restoring sound does not restart old cues.
- Encounter retry stops the previous attempt's sounds while retaining decoded samples. Combat
  scene shutdown stops/disconnects voices, cancels timers/downloads and closes its audio context.
- Existing samples, cue mappings, per-family limits, pause behavior, save schema 16 and simulation
  compatibility 3 remain. Real headphone/speaker acceptance is still required.

## 22 October 2026 — native rebinding and records

**Prepared locally:** `web-2026.10.22-controls-records` — not pushed, deployed or desktop-packaged.

- Control bindings now expose native device/action/reset controls and an isolated capture dialog
  with Cancel, invalid-key feedback and restored focus. Duplicate assignments retain automatic
  swaps; bindings persist through the existing save store.
- Fixed cross-device capture navigation: controller input cannot leave keyboard capture, and
  keyboard navigation cannot leave controller capture. Escape cancels; controller buttons remain
  bindable during controller capture and regain physical menu meanings when capture ends.
- Holding the Enter key that opens rebinding no longer assigns Enter through repeat events.
  Capture accepts a fresh key-down, preserving Enter/Tab/Space as deliberate bindings.
- Records now exposes native career/history text, wrapping run details, empty/legacy states and
  Newer/Older/Back controls. Browsing preserves progression and the existing six-entry window.
- No art/content/balance/floor-default change. Save schema 16 and simulation compatibility 3
  unchanged. Actual AT/controller and whole-game accessibility acceptance remain open.

## 22 October 2026 — native How to Play

**Prepared locally:** `web-2026.10.22-help-accessibility` — not pushed, deployed or desktop-packaged.

- How to Play now exposes native headings, instructions, described diagrams and Previous/Next/Back
  controls. The last page offers Return to menu; focus returns to the originating menu card.
- Instructions reflect saved keyboard/controller bindings. Keyboard arrows and controller page
  navigation retain the existing rules; native Enter/Space activates once. Clicking the diagram
  no longer turns a page through an invisible full-screen zone.
- Existing vector diagrams and teaching copy are retained. No new art, content, floor adoption or
  balance change; save schema 16 and simulation compatibility 3 remain unchanged.
- Actual screen-reader/controller acceptance remains open. Other shell/game screens retain their
  separate canvas controls; this is not whole-game accessibility acceptance.

## 21 October 2026 — menu controls and art-review repairs

**Prepared locally:** `web-2026.10.21-menu-review` — not pushed, deployed or desktop-packaged.

- Title, menu and settings now have visible native buttons, checkboxes, choices and sliders.
  They retain focus, follow keyboard/controller selection and use existing save/state rules.
  Remaining screens use canvas controls; no whole-game screen-reader support claim is made.
- Art review uses correct logical sprite sizes and bounded manifest pages. Explicit hero routes
  show the requested family, load its sheets, and reject unknown hero selectors visibly.
- Fixed a reproduced black rectangle during 4K native-control/canvas composition.
- Corrected stale placeholder descriptions; no new art, floor adoption, content or balance change.
- Save schema 16 and simulation compatibility 3 remain unchanged. Full game verification passes;
  human/controller/audio, screen-reader, hardware and Steam acceptance remain open.

## 17 October 2026 — local QA and package readiness

**Release:** `web-2026.10.17-qa-readiness` — published to the browser on 17 October; desktop packaging remains pending.

- Explicit `qasession=1` combat routes offer local Start/Stop/Reset/Export controls. Reports include
  active-frame percentiles, pause exclusions, overflow, run provenance and display/texture context.
  A selectable JSON fallback remains available when downloading is blocked. Normal routes show no panel.
- Windows packaging scripts now record staged identity/runtime hashes and a packaged-file manifest.
  A read-only checker detects stale/mixed/changed/missing/extra files without rebuilding or launching.
- Default gameplay, floor selection, save schema 16 and simulation compatibility 3 are unchanged.

Fresh full verifier: 1,781 unit tests, 31 browser checks, 31 desktop-host tests, smoke/offline and
25 matching published outputs pass. All 19 portfolio guards passed. Session reports do not establish hardware performance or
human acceptance. Fresh packaging, physical tests, Steam and analytics-dashboard acceptance remain external gates.

Publication also corrects expanded arcade Options contrast in dark mode. Responsive arcade
regression tests now open the Options panel before selecting folded controls. Website CI passes
154 arcade checks and 31 Last Bastion browser journeys; Pages and live/offline checks pass.

## 17 October 2026 — release preparation checkpoint

No player-facing runtime changes; release identity remains `web-2026.10.16-asset-polish`.
Fresh verification passed 1,778 unit tests, 30 browser checks, 28 desktop-host tests,
smoke/offline and all 25 published-output comparisons. All 19 portfolio guards passed.
Five normal-rack diagnostic captures,
a shell accessibility contract inventory and an owner/evidence acceptance worksheet are retained.
The completed preparation checkpoint is archived. Floor adoption, observed runs, audio/controller,
hardware, Steam and deployment acceptance remain open. No push or packaging ran.

## 16 October 2026 — asset and progression clarity patch

**Release:** `web-2026.10.16-asset-polish` — local only; not deployed or desktop-packaged.

- Optional affinity indicator shows the active/leading path and next threshold, warns before an
  aligned choice commits, and opens build inspection. Toggle it in settings; it hides with no affinity.
- Build inspection explains acquired transformation boons and costs from the production catalogue.
  Long copy paginates without overlapping; combat settings fit their available height.
- Map focus uses corner brackets, armed routes show READY, and closed routes gain a barred badge.
- Pooled impacts are less opaque and quieter with Reduced Flash. Cooldown timer changes refresh
  immediately. No damage radii, tell timing, progression or save-schema version changed.
- Eight floor variants/four decals are available through `floorpilot=kit` on the standard Bastion
  review route. Optimized pilots and kit retain untouched masters and exact generation prompts.
  Existing default floors remain in use pending motion acceptance.
- Inventory/geometry reports cover 227 definitions plus retained unmapped candidates.

All game verifier lanes pass: 1,777 unit tests, 30 browser checks and 28 desktop-host tests,
including smoke/offline and generated-output checks. All 19 portfolio guards passed.
Native Full HD/4K captures are retained.
Motion, physical controller/audio, packaged hardware and Steam acceptance remain open; no 4K60 claim.

## 16 October 2026 — Full HD / 4K floor pilot

**Release:** `web-2026.10.16-floor-pilot`

**Status:** prepared locally; not deployed. This is an opt-in art review patch.

- Two original floor candidates and a transparent scuff can be previewed with
  `?screen=game&theme=bastion-standard&seed=61061&floorpilot=a` (or `b`).
- Broad floor repeats preserve collision geometry and world scale. Normal sessions retain
  the existing floor and do not download pilot textures.
- Retained generation sources, prompts, hashes and a reproducible 213-entry runtime-manifest
  inventory document the asset pipeline. Older claims about unused held weapons were corrected.
- Baseline and both candidates have native 1920×1080 and 3840×2160 captures.

Required verifier lanes pass: 1,776 unit tests, 29 browser checks, smoke/offline and published
output checks, plus 28 desktop-host tests. Six capture checks and all 19 portfolio guards pass. Save schema remains 16.
Runtime image optimization, floor-kit expansion and motion/hardware acceptance remain open;
these captures do not establish 4K performance or final art acceptance.

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
