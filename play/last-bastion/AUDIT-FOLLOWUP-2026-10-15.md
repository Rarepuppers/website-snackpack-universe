# Last Bastion follow-up audit — 15 October 2026

Reviewed local implementation at c7779414. This is a source/control-flow review with focused
production-function tests, not a physical-controller or observed-play acceptance. The initial audit changed no gameplay files; the subsequently authorized corrections are recorded below. Existing unrelated working-tree changes were left intact.

## Findings, in recommended correction order

### 1. P2 — Remapped gameplay buttons conflict with pause-menu actions

Locations: `dev/src/game/scenes/PrototypeScene.ts:760` and `:821`,
`dev/src/game/input/KeyboardMouseInput.ts:113`.

Pause confirmation consumes the remappable gameplay evade action, while Back always consumes
physical B. Bind evade to B, open Combat Settings, then press B: the frame first returns to the
pause root and then activates its selected Resume action. A single Back therefore escapes two
levels. Binding pause to B similarly makes one button enter both Back paths. The displayed A
confirmation hint also stops matching the actual button after evade is rebound.

Correction: give menus their own physical confirm/back/navigation edges, independent of combat
bindings; consume at most one menu action per frame. Keep A/B semantics or display the chosen
menu binding consistently. Regression: exercise B-bound evade and B-bound pause in settings,
build and confirmation screens; assert one transition per button edge.

### 2. P2 — Advertised D-pad build navigation is not wired

Locations: `dev/src/game/ui/CombatPauseOverlay.ts:325`,
`dev/src/game/input/KeyboardMouseInput.ts:142`.

The build page advertises “D-PAD PAGES / B BACK”. The combat adapter reads only left/right
sticks and face/start/stick-click buttons. It never samples the D-pad, so the advertised control
cannot turn pages. Shell navigation and combat navigation need separate coverage.

Correction: feed D-pad edge intents into menu navigation, with neutral/release behavior and no
simultaneous stick double-step. Alternatively accurately label the existing left-stick control,
but real D-pad support is preferable. Regression: synthetic standard-gamepad buttons 12–15,
including held inputs and release; follow with physical controller acceptance.

### 3. P2 — Daily shares report starting speed as though it applied throughout

Location: `dev/src/game/scenes/RunSummaryScene.ts:268`.

Start at 1x, change Combat Settings to 0.75x and finish. The summary records
`provenance.gameSpeedModified`, but the share builder receives only the initial speed and build
version. Shared text consequently says “speed 1x” without disclosing the change. The generic
assistance disclaimer does not describe this run's actual speed history.

Correction: forward the existing modified flag; say “started at 1x; speed changed during run”
for mixed-speed attempts. No new saved field is needed. Regression: compare unchanged and
changed-speed production share output, including changing back to the starting speed.

### 4. P2 — Encounter restart retains prior attempt provenance

Locations: `dev/src/game/scenes/PrototypeScene.ts:201`, `:1194`, `:1432`.

`restartRun()` creates a new simulation using current settings, but does not refresh the readonly
`initialRunSettings` snapshot or clear `gameSpeedModified`. Change from 1x to 0.75x, restart,
and play the new attempt entirely at 0.75x: its summary still starts from the old 1x snapshot and
marks a speed change inherited from the discarded attempt. Auto-fire baseline can also be stale.

Correction: establish a new per-attempt provenance snapshot and reset its modification flags at
restart. Review other attempt-local timer/presentation state in that same reset path. Regression:
restart after settings changes, then verify the next completed run's actual initial settings and
absence of inherited modification flags.

## Lower-priority polish

- The affinity heading counts explanatory rows as paths: an untouched build displays
  “TRANSFORMATION AFFINITY (2)” despite having no path progress. Separate explanatory copy
  from item counts, or omit that count. Source: `dev/src/game/ui/BuildOverlay.ts:58`.
- Build-page buttons need clearer keyboard/controller semantics: arrows change the page while
  Enter always activates Back, with no focused Back indication. Add a visible confirmation hint
  or conventional button focus so players can predict Enter/A behavior.
- Extend the screenshot/interaction matrix to combat settings, remapped controllers and
  populated transformation pages. Empty starter inventories alone cannot validate long builds.

## What to defer

Keep the existing content freeze. New heroes, tiers, art batches and music should follow observed
play findings. Replayable practice and DOM-backed menu accessibility remain useful future work;
neither was implemented by the preceding reliability pass. Physical audio/controller checks,
five observed runs, fresh desktop packaging and Steam acceptance remain separate release gates.

## Verification

- Focused existing tests: 18 pass across GamepadIntentMapper, DailyParticipation and BuildOverlay.
- Initial targeted test invocation hit the known sandbox TEMP rename restriction; rerunning with
  workspace TEMP/TMP passed. This was not a product failure.
- The prior complete verifier passed 1,771 unit tests, 24 browser checks and desktop-host tests.
  It was not rerun in full for this read-only follow-up; these findings show gaps in its coverage.
- Portfolio guard rerun completed: all 19 guards passed.

Findings above are confirmed from the source paths, with reproduction procedures for follow-up
integration tests. No new physical-gamepad or full-run reproduction is claimed.

## Implemented follow-up

All four findings are corrected in release `web-2026.10.15-controls`:
physical A/B/Start and D-pad/stick menu actions are independent of combat remapping and emit
one action per frame; Daily shares disclose mixed-speed attempts; restart resets starting
settings, modification flags, accumulated simulation time and hit-stop state. Affinity headings
no longer count explanatory rows, and build-page hints explain that Enter/A goes Back.

Browser validation additionally exposed a first-click defect: hovering a pause/settings row
recreated its pointer target before the click landed. Hover now restyles existing rows without
destroying their input handlers. The restart regression exercises a single pointer click on the
speed setting, then confirms the restarted attempt has the new baseline and no stale flag.

New automated coverage includes physical menu edges, D-pad hold/release, reconnect suppression,
mixed-speed share copy, and browser tests for B-bound evade/pause, D-pad paging, A confirmation,
and restart provenance. Simulated gamepads use monotonic browser timestamps as required by
Phaser. Physical controller acceptance remains outstanding.

Final full-verifier result is recorded in CURRENT-PLAN.md. No deployment was performed.
