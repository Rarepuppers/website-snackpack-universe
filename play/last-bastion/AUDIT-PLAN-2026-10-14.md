# Last Bastion audit and proposed implementation plan

14 October 2026 audit; implementation accepted by Mark on 15 October 2026.
Accepted runtime fixes are implemented and verified locally. Deployment remains a separate explicit step.
Reviewed website commit `00c34329`, source and published output, current plans, automated
checks, live title/menu/character selection, and retained 11 October combat evidence.
This is a targeted review, not exhaustive combat, audio, hardware, or Steam acceptance.
CURRENT-PLAN.md remains the active release queue.

## Recommendation

Keep the existing content freeze. Ship a focused reliability and comprehension pass,
then complete observed play before deciding on more enemies, heroes, tiers or environments.
Quick Drop, Daily Drop, onboarding, backups, rebinding, accessibility settings, damage
breakdowns and seed retry already exist; they should be improved rather than proposed anew.

## Findings

### A01 — P1: character art failures can cause repeated loading

Source: `dev/src/game/shell/ShellScene.ts:336` and `assets/PhaserAssetQueue.ts`.
The character screen checks that every texture exists, queues missing textures, then
calls render again on loader COMPLETE. A permanently missing texture remains absent,
so completion can enqueue it again. There is no retry bound or failure state here.
This is a source-confirmed failure path; network-failure browser reproduction remains open.

Implement a per-group loading state with explicit failed IDs, a bounded attempt policy,
and player-facing Retry / Back actions. Permit a neutral portrait placeholder only when
the missing art is cosmetic; do not substitute another hero. Prevent completion callbacks
from restarting loads after navigation. Test 404, interrupted requests, retry success and
leaving the screen. Also add an HTML boot failure message around `main.ts` startup:
the current rejected startup promise has no player-facing recovery handler, and the HTML
contains an empty game root. Cover failed dynamic imports and WebGL initialization.

Acceptance: a permanent failure stops requesting automatically, explains what happened,
and remains navigable; retry works without resetting progress. Do not clear saves or all
site caches as an error-recovery shortcut.

### A02 — P2: Daily streaks stop growing at 60

Source: `dev/src/game/run/DailyDrop.ts`, `DAILY_HISTORY_LIMIT`, `pruneDailyRecords`,
and `dailyStreak`. Executing these production functions for 65 consecutive played dates
returned `{playedConsecutiveDays:65, retainedDays:60, displayedStreak:60}`.

Separate bounded detailed results from compact participation history. Recommended:
retain merged consecutive date intervals for participation, derive streaks from them,
and retain the existing 60 detailed daily results. Merge intervals by union across saves;
do not sum streak counters. Migrate retained dates into intervals. Older history already
discarded cannot be reconstructed and must not be invented.

Acceptance: 65 and 365 consecutive days display correctly; a missed day breaks the streak;
today/yesterday behavior, DST, duplicate attempts, import/export, and cloud merge work.
Update schema, normalization, defaults, reset, serialization and cloud portability together.

### A03 — P2: return visits in a reused tab are suppressed

Source: `telemetry/FunnelTransport.ts` sessionLedger/startPlayerFunnel and
`telemetry/PlayerFunnel.ts` returning/recordVisit.
sessionStorage keeps one event-name ledger across page loads and days in the same tab.
After one returning event, later days in that tab cannot emit another. `opened` also stays
suppressed. Additionally, recordVisit marks a return reported before transport acceptance.
This is source-confirmed; dashboard impact has not been measured.

Scope the visit ledger to the local day while retaining deduplication across same-day
title/map/combat/debrief navigation. Only mark returning reported after delivery or accepted
queue persistence. Specify the metric as local daily visits, not unique people. Preserve
the existing coarse payload and avoid adding identifiers. Test three days in one tab,
multiple reloads, denied storage and transport failures.

### A04 — P2: abandonment is counted as defeat; funnel stages use different units

Source: `combat/CombatSimulation.ts:2863`, `scenes/PrototypeScene.ts:1273,1303`,
and `telemetry/PlayerFunnel.ts`. abandonRun sets status defeat with cause "Run abandoned";
runtime forwards defeat rather than the supported abandoned event value.
Also, starts/wave milestones count once per session while endings count per run. A player
can generate several endings for one start, so these are not one conversion funnel.

Use an explicit end-reason mapping for intentional abandon, independent of defeat status
used by progression. Keep all-run outcomes as a separately labelled distribution. Define
the conversion funnel in visit-level terms, with a matching visit-level ended milestone
if needed. Distinguish Expedition node depth from Quick/Daily wave depth. Do not infer a
defeat or abandonment merely from closing a browser. Test abandon from pause, combat death,
win, repeated runs and an Expedition spanning multiple page loads.

### A05 — P2: Daily retry date goes stale while the debrief stays open

Source: `scenes/RunSummaryScene.ts:238`. Today and the retry URL are calculated during
screen construction. Leave that screen open across local midnight and Retry Daily still
uses the previous date. This is a source-confirmed boundary case, not a live reproduction.

Resolve the current date in the retry action. When it differs from the result date, label
the action "Play today's Daily" and show the date. Keep the completed run's original date.
Test an overnight open debrief, a run crossing midnight and an unchanged-day retry.

### A06 — P2: build inspection hides information and exposes internal labels

Source: `ui/BuildOverlay.ts` and `ui/CombatPauseOverlay.ts:295`.
Relics/artifacts use raw IDs. Correction on 15 October: synergy strings are already readable descriptions and do not need catalogue replacement. Display slices to five weapon rows,
four relic/artifact rows and four synergies without pagination or an overflow indicator.
The view model carries transformation state, but the overlay does not present it.

Resolve names/descriptions through catalogues. Separate equipped weapons from stash.
Add controller-operable pages or scrolling and visible item counts. Present active
transformation and affinity progress with requirements and consequences in this screen
first; add a small HUD cue only if playtests show a need. Use truthful estimated-DPS labels.
Test maximum inventories, long names, keyboard/controller navigation and 960x540 layout.

### A07 — P3: title copy and settings values need small corrections

The live title and `shell/ShellScene.ts:396` still say "SOLO EXPEDITION" and only describe
between-node saves. Replace with a concise three-mode description and mode-specific save
wording. Quick/Daily should not imply resumable combat.
`ScreenFlow.ts` offers deadzones up to 1.00 while `GamepadIntentMapper.applyDeadzone`
caps the effective value at 0.95. Align displayed, stored and applied ranges, including
normalizing old settings. Test endpoints, not just typical defaults.

## Visual and experience review

The live title has a cohesive dark hangar, readable focal action and consistent cyan/orange
accents. The menu cleanly separates nine actions and correctly initially focuses Quick Drop.
Hero dossiers have useful role/passive/ultimate/perk information. Keep this visual direction.

The retained 960x540 combat image has a very high-frequency, high-contrast repeating floor;
small projectiles and HUD labels compete with it. This is a visual judgment from a still,
not evidence that combat is unfair. First try reducing floor contrast/detail and testing
projectile silhouettes against every arena; preserve hazard visibility. Compare normal,
colour-vision and high-contrast settings. Prefer runtime tuning before replacement art.

Recommended asset work, in order:

1. Finish LB-04 Marine/Medic/Assault helmet and pose registration in motion. Keep source
   masters untouched; approve pivots, scale, facing, muzzle origin and occlusion in context.
2. Finish LB-07 map node/objective/cleared-state readability at 960x540, Full HD and 4K.
   Distinct icons already exist; avoid commissioning duplicates of the completed work.
3. If readability trials fail, produce a restrained floor variant and a small projectile/
   hazard effect set with differentiated shapes, windup/active/recovery states and reduced-
   flash alternatives. Validate at actual gameplay scale, not only enlarged galleries.
4. Consider low-volume menu/arena ambience after listening tests. Mixer comments show that
   music/UI/ambience controls are intentionally not exposed because their buses are not
   routed. Wire and verify the buses before adding sliders or commissioning a soundtrack.

## Features worth adding after the fixes

| Proposal | Purpose | Acceptance / gate |
|---|---|---|
| Replayable first-drop practice | Let players learn dodge, aim and ultimate without risking a campaign | Reuse real input/combat; no progress rewards; available on demand; justify via observed confusion |
| Build/affinity explanation | Explain why a choice helps and what unlocks a transformation | Catalogue-driven names, current/required values, controller access; no invented new progression |
| Daily challenge identity | Make shared results comparable | Include date and build/rules identity; explain that hero/perk/settings can differ; preserve accessibility choices |
| Grouped settings with contextual help | Reduce searching through the long settings list | Audio, controls, display and accessibility groups; focus retained; each exposed control visibly works |
| Accessible menu semantics | Make canvas menus discoverable to assistive technology | DOM-backed names, roles and focus for shell/settings/recovery; test without a mouse; do not claim full combat screen-reader access |

Daily currently already supports sharing and seed-based challenges. Avoid adding a leaderboard
until its rules, anti-cheat and operating costs are justified. Defer touch controls, multiplayer,
additional heroes, new regions and Threat Tiers 3–11 pending observed play and valid funnel data.

## Proposed delivery sequence

| Batch | Scope | Exit gate |
|---|---|---|
| 1 — Reliability | A01 loading/boot recovery | Browser fault injection and successful recovery; save unchanged |
| 2 — Daily correctness | A02 streak migration, A05 midnight retry | Production-function tests, old-save fixtures, merge/export/import, overnight UI test |
| 3 — Trustworthy measurement | A03/A04 visit lifecycle, abandon mapping and metric definitions | Exact emitted event assertions across page loads/days; explicit live dashboard acceptance |
| 4 — Comprehension | A06 build pages/labels, A07 copy/deadzone, grouped settings | Full inventories and small-window/controller review; no inaccessible clipped rows |
| 5 — Presentation | Floor readability trials, LB-04/LB-07, optional targeted effects | Comparative captures plus observed motion/audio; accept only improvements in context |
| 6 — Validation and release | Five observed runs, packaged window checks, authorized deployment | All applicable automation green; manual findings resolved or explicitly accepted |
| 7 — Evidence-led additions | Practice/affinity/other conditional features | Select from actual observed failures and sufficiently populated live data |

Use focused commits per batch in the nested website repository. After runtime changes rebuild
the web output, update its release identity/service-worker core as required, and verify offline
upgrade behavior. Implementation was authorized on 15 October; do not push without an explicit deployment request. Before release,
reconcile CURRENT-PLAN.md with actual deployment evidence: the live menu now visibly includes
Daily/Quick Drop, so the old "deployment pending" statement alone cannot establish current status.
Live browsing here did not verify bundle equality, provider settings or dashboard receipt.

## Initial audit verification and limits (14 October; superseded below)

- Image derivative audit: 63 assets passed, 51.93 MiB source to 27.06 MiB derivatives.
- Combat boundary audit: 33 adapters passed.
- Content inventory: 3 tests passed; full suite: 307 files / 1,764 tests passed.
- Typecheck, UI text audit and published-build regression checks passed; 25 outputs match source.
- Website JavaScript check: 54 files passed; site check: 272 pages clean.
- Full verifier did NOT pass: initial sandbox temp rename failure was avoided using workspace
  TEMP/TMP; rerun stopped at "Local smoke server did not become ready". Offline, browser and
  desktop lanes were not reached. Capture server stderr/exit code and diagnose before changing
  game code or claiming a smoke regression. Separate site checks were run successfully afterward.
- Portfolio `node scripts/check-all.js`: 17/19 passed. Expo dependency guard could not deeply
  verify the 15 apps; game-UI delivery guard encountered a file-move permission failure.
  These are not evidence of a Last Bastion gameplay bug and should not expand this task into
  repairing unrelated apps.
- Live inspection covered title, main menu and Marine dossier. Retained combat imagery is dated
  11 October, not a fresh observed combat run. No audio listening, full run, physical gamepad,
  real 4K/ultrawide hardware, Steam client or analytics-account acceptance was completed.

## Implementation outcome — 15 October 2026

A01–A07 are addressed locally. Startup and character-art failures now offer recovery; Daily
participation survives the 60-result cap and merges through cloud/import/export; retry chooses
the current local day at activation; visit reporting resets by local day; abandonment is distinct
from defeat; build inspection resolves catalogue names and pages every item; affinity thresholds
and commitment consequences are visible. Title copy and deadzone limits are corrected.

Grouped settings and a quieter standard arena floor are implemented. The review also found and
fixed omitted stashed weapon names, settings/footer overlap, unbounded smoke readiness requests,
keyboard build-page navigation advancing twice through the gamepad path, and pause/build panels
using display dimensions inside an already scaled camera. The latter shifted panels offscreen at
1080p/4K; pointer regression tests now exercise their visible controls at both sizes. Daily result shares
include build and speed rules. No new raster assets were needed.

Final automated results supersede the initial environment failures above:

- Full verifier: all required lanes passed; 1,771 unit tests / 309 files, 24 browser acceptance
  tests, smoke and offline acceptance, 25 source-matching published outputs, desktop host build
  and 28 tests.
- Website: 54 JavaScript files and 272 pages clean. Portfolio: all 19 guards passed.
- Fresh layout captures: settings, build, affinity and combat at 960x540, 1920x1080 and 3840x2160;
  affinity also captured at 1280x800. Capture assertions confirm the intended affinity page.
- Long-streak tests cover 365 days, gaps, migration, cloud merge and import/export. The additive
  schema-16 migration cannot reconstruct historical days discarded by older versions.

Remaining gates are deployment and dashboard receipt, five observed play sessions, physical
controller/audio/display checks, a freshly packaged desktop executable and Steam acceptance.
Full DOM-backed shell accessibility remains future work; the new startup recovery is DOM-backed.
Practice mode, further art/music and content expansion remain conditional on observed needs.
This audit does not claim those manual gates or conditional features are complete.

Release `web-2026.10.15-reliability` is prepared locally. No push or deployment was performed.
