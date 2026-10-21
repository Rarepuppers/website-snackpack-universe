# Native rebinding and records — implementation checkpoint

22 October 2026. Authorized continuation of the proposed next shell slices, on top of
`5974c948`. [CURRENT-PLAN](../CURRENT-PLAN.md) remains the only active execution queue.
Prepared identity `web-2026.10.22-controls-records`, worker `2026-10-22-controls-records`.
No new art, mode, balance, floor default, save schema (16) or simulation compatibility (3).
No push/deploy, executable packaging, Steam action or cross-chat message.

## Delivered scope

**Rebinding:** native heading, named keyboard/controller selectors with pressed state, action
buttons with current bindings, fixed-stick rows marked unavailable, reset and Back. Labels are
shared with the retained canvas fallback; ScreenFlow and the existing save/rebinding helpers own
state, effects, duplicate swaps and persistence.

The native capture dialog names the selected action and reports instructions/invalid keys.
Background controls are inert and dimmed. Cancel/Escape restores row focus; keyboard Enter/Tab/
Space remain bindable. During controller capture, Tab reaches native Cancel and Enter activates it;
capture requires a fresh key-down, so repeats from a held Enter opener cannot silently assign it.
controller buttons remain candidates, including B. After capture ends, physical menu A/B/D-pad
resume their menu meanings, independently of combat remaps. Native activation fires once.

**Demonstrated capture fixes:** an isolated browser replay intercepted every compiled JS/CSS
request with the bytes from `5974c948`, retaining unchanged local artwork. In keyboard capture,
simulated pad B incorrectly changed `controls` to `settings`; in controller capture, keyboard
Backspace did the same. Current tests require both inputs to leave the capture/screen intact.
Both input handlers now respect capture ownership. No capture save-loss claim is made.

**Records:** native heading, career definition list and recent-run ordered list, count/status,
Newer/Older boundary states and Back. Existing history presentation and career formatting are
shared with the fallback. Six entries remain visible per model window; navigation shifts by one
entry as before. Run details wrap and the list can scroll natively; navigation does not modify
save/progression. Legacy dates and expedition nodes/threat remain distinct from wave progress.

**Visual corrections during implementation:** Back initially drew above the capture shade despite
being inert. Corrected DOM ordering; a composed-pixel regression checks its dimming. Kept a before
capture. Records headings/count now have clearance above their panels. Native controls follow the
actual canvas box, including letterboxing and DPR; existing 4K composition treatment is retained.

## Verification scope and evidence

Five added browser cases cover actual keyboard/simulated-pad capture, cross-device isolation,
duplicate swaps, reload persistence/reset, invalid-key/cancel behavior, Enter/Tab/Space release,
focus, records empty/populated/legacy states, data preservation and 960×540 / 1280×800 / 1080p /
physical 4K output at DPR 1/2. DPR 1 includes a 3840×2160 CSS viewport; DPR 2 tops out at
1920×1080 CSS (3840×2160 physical). A prior matrix combined 3840 CSS with DPR 2, requesting
8K and timing out; corrected the matrix without changing assertions or timeouts. Three targeted
matrix cases passed in 26.1 seconds. Existing tests cover native resize and 4K composition.
The modal regression samples the composed screenshot, not CSS alone. A held-Enter regression
failed before the fresh-key-down guard (repeat assigned Enter and closed capture) and passed
afterward while retaining legitimate Enter/Tab/Space assignments.

Ten final captures and semantic-tree snapshots cover keyboard/controller controls and capture,
empty/populated records, minimum size, 4K and letterboxed DPR 2. No page errors recorded.
One separate before-fix screenshot preserves the bright Back button. Captures use disposable
seeded records; they do not claim an earned run or actual AT/controller/hardware acceptance.
See [retained evidence](../playtest-evidence/2026-10-22-controls-records/README.md) for exact reports.

Final full game verifier: **PASS in 145.4 seconds**, **1,783 unit tests / 312 files**, **50 browser
cases**, **31 desktop-host tests**, static/image/content/text checks, source/output integrity,
smoke/offline and website JavaScript/offline-core. Report provenance is `5974c948` plus scoped
dirty implementation; unrelated dirty pages/art remain excluded. A prior post-review run hit
the unchanged world-navigation test's 5-second timeout; all five tests passed in isolation and
the final full suite passed without threshold or navigation-code changes. The final report
supersedes the failed attempt; the failure is retained, not relabelled. A separate isolated
sandbox attempt ran no tests because its temporary cache rename was denied.

Full root portfolio run completed: **19 of 20 guards pass**, including shared-asset delivery and
all consumer manifests. `check-expo-deps.js` reports current patch-version drift in 12 separate
Expo apps; autolinking module versions match their SDK manifests. No app dependency files were
modified by this Last Bastion task. Full diagnostics are retained as `portfolio-verification.txt`.
Do not infer an all-green portfolio or native-app release readiness from the game result.

App-maintenance handoff (outside this game's scope): current guard requests Expo 55.0.32,
dev-client 55.0.41 and/or sharing 55.0.25 for Badgify, PawsitiveDose, ABCs, Counting, Brain Games
1/2/3, Garden World and Prehistoric Pals; Math Arithmetic, Mathematics and Zoo World report
expo-asset 12.0.14. These are the guard's dated diagnostics, not an instruction to bulk update.
The app owner should read root EXPO-TROUBLESHOOTING/RELEASING guidance, recheck requirements,
prepare scoped package/lock changes and run each affected app's required verification/first-paint
checks, then the complete portfolio guard set. No native build/submission is assigned here.

## Remaining acceptance

Mark/assigned tester: actual screen-reader values, selected device, capture announcements,
Cancel/Escape, fixed-stick rows, duplicate swap/reset feedback, focus restoration and records
list reading/navigation. Repeat with a physical controller, including capture candidates and
return to menu. Keyboard capture reserves keys for binding; Escape/native Cancel remains available.
No whole-game screen-reader support claim follows from these shell surfaces.

Existing observed Runs 1–5, floor/hero/rack/tell/map/audio acceptance, Claude's fresh executable,
named hardware/Steam access and dashboard verification remain open in the
[worksheet](../ACCEPTANCE-WORKSHEET-2026-10-17.md). Armory, hero/threat select, LAB, map, debrief
and combat remain separate canvas consumers. Further slices need separate scope; content/art
gates remain intact.
