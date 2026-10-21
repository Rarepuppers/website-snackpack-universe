# Menu and gallery implementation evidence — 21 October 2026

Implementation: `637f6ec8` + `6472ceeb`; prepared local identity `web-2026.10.21-menu-review`.
No push/deploy or executable packaging was performed. The prior published build is separate.
Scope and remaining owners: [current plan](../../CURRENT-PLAN.md),
[completed implementation](../../archive/MENU-REVIEW-IMPLEMENTATION-2026-10-21.md).

- `verification.json` and `verification.txt`: final full game verifier passes in 89.9 seconds.
  It ran at `637f6ec8` plus the dirty CSS/test fix subsequently committed as `6472ceeb`.
  The recorded commit is provenance, not an exact-HEAD claim. Runtime bytes did not change afterward.
  Counts: 1,783 unit tests / 312 files; 41 browser cases; 31 desktop-host tests; smoke/offline;
  25 matching published outputs and site JS/offline-core checks.
- `focused-browser.txt`: earlier focused native import/gamepad checks; these now also pass in
  the final combined 41-case report.
- `compositor-before.txt` and `settings-4k-before.png`: reproduced failure before the final CSS fix.
  The black-rectangle pixel fraction was 1.0; the same test passes below 0.01 after the fix.
  `settings-4k.png` is the final corrected view. Opacity 0.999 keeps the foreground blended;
  no native control or art was removed. This is Chromium evidence, not all-GPU acceptance.
- `portfolio-verification.txt`: final `node scripts/check-all.js` passes all 20 discovered guards,
  including shared-asset generation/delivery fixtures.
- `resize-browser.txt`: the resize regression passed three repeats after making its measurements
  atomic. The first run had compared old/new layout measurements across browser round trips.
- `capture-results.json`: seven fresh local Chromium captures with viewport/canvas sizes, DOM
  text and no page errors. This is sampled browser evidence, not physical-display acceptance.
- `title-native.png`, `menu-native.png`, `settings-native.png`: real native foreground and focus
  at 960×540. The authored canvas chrome remains underneath.
- `gallery-fixed.png`: logical-size frames with readable labels, bounded manifest and page controls.
- `gallery-medic-fixed.png`, `gallery-assault-fixed.png`: explicit hero identities and source
  frames; Assault's action overlay is reviewed separately beside its body frame.

The final 4K settings capture supersedes the before-fix image. A headless image alone does not
establish native monitor/scaling correctness across physical GPUs. Runtime browser
checks verify layer alignment/control containment at 960×540, 1280×800, 1080p and 4K.

The original [audit evidence](../2026-10-21-audit/README.md) predates these fixes. It should not be
used to reopen corrected gallery defects or as acceptance of the new controls.

Actual screen-reader and physical-controller use, earned motion/dense-combat review, audio,
target-hardware pacing, Claude's desktop package, Steam and analytics remain external gates.
No new raster art, default-floor adoption, content or balance change was made.
