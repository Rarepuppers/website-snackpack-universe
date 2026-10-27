# Native hero and threat selection — 28 October 2026

Prepared local identity `web-2026.10.28-native-selection`; schema 17, simulation compatibility 3.
G5 first slice. Armory native controls remain the next slice, not completed by this change.

## Delivered

Visible labelled native hero/perk selects, readable scrollable hero dossier (role, passive,
ultimate, starting weapon, level growth and actual unlock text), locked perk explanation,
Deploy and Back. Existing portrait/background assets stay on canvas; duplicate canvas
foreground controls are omitted. Threat selection exposes authored modifiers, best progress
and unlock condition, with guarded Begin Expedition and Back. Select changes never deploy.

ScreenFlow still owns unlocks, run modes and start effects. Native actions guard locks too;
no unlock/save shortcuts or progression changes. Changing a select preserves native focus.
Keyboard arrows within native selects use browser behavior; outside selects the existing
hero/perk shortcuts apply. Simulated pad A activates a focused native button, including Back;
D-pad navigation still feeds the existing flow. Real AT/controller acceptance remains open.

Loading/failure now has native status, Back and Retry. A targeted regression caught focus
remaining on Back after load failure; focus now follows loading → failure/ready transitions,
so Enter retries as advertised and successful loading focuses Deploy.

## Evidence

Targeted browser checks pass for locked hero/perk, selection-only changes, focus retention,
menu return, earned threat-tier selection, locked Tier 2 and actual Tier 1 expedition launch.
All five hero panels fit at 960x540 and 3840x2160; dossier retains starting-equipment copy.
Simulated-pad A on focused Back returns once. Existing art-failure/retry regression passes.
`hero.png` is an inspected 960x540 capture of the actual built renderer, not a mockup.

Full game verification passes in 161.3 seconds: 1,808 tests in 316 files, 61 browser checks,
31 desktop-host tests, static/type/build/smoke/offline and site JavaScript checks.
See [machine report](verification.json) and [full output](verification.txt).
The earlier interrupted run was incomplete; the subsequent run caught stale generated CSS/HTML.
Refreshing the web build resolved that check before this complete passing run.
All [23 portfolio guards](portfolio.txt) pass, including Expo dependencies and shared asset delivery.
No screen-reader output,
physical-controller testing, observed run, hardware, Steam acceptance, package or deployment.
