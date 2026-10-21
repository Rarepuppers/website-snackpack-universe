# Play audit evidence — 21 October 2026

Read the [audit and plan](../../PLAY-AUDIT-AND-PRIORITIES-2026-10-21.md) for findings, priorities,
acceptance and limitations. Base `e0cdbb9f`, shared dirty working tree. No game code or assets changed.

- `sweep.json`: 42 local standard games + hub/Daily/Stats, 375×812/light and 1280×900/dark,
  90 sampled starts, with page errors, HTTP failures, loaded-image failures, dimensions and controls.
- `narrow-sweep.json`: 45 starts at 320×812/cream. Both sweeps found no recorded startup/asset/
  ordinary document-overflow failures. Intro screenshots are not full-game playthroughs.
- `live-sweep.json`: 18 representative published loads. In particular local Thirteen's difficulty
  controls are absent live. This is separate from local working-tree evidence.
- `browser-tests.txt`: all 135 existing arcade behavior cases pass in 3.6 minutes. Tests use the
  current production pages/controllers; selected complete rounds, saves, pause, keyboard, daily,
  records, cold-load budgets and failure paths are covered. Not every mode/round is exhausted.
- `site-check.txt`, `javascript-check.txt`, `contrast-check.txt`: 377 pages / 74 JS files /
  489 configured rule/theme combinations pass. Contrast coverage is not a whole-pixel/image audit.
- `extended.json`, `extended-followup.json`: hub discovery/search, CSS zoom and 200% root font,
  separate project entry samples, deliberate all-bitmap failure and Clear faces recovery.
- `controls.json`: real-time touch-button positions, Backgammon/Crossword control observations and
  the hidden phone Last Bastion capability paragraph. The audit's Large pieces sample has a
  different random crossword from the 17px screenshot; do not compare them as a before/after resize.
- `source-hashes-after-audit.json`: hashes of selected source after execution. These do not freeze
  what every browser request received or imply all local edits are committed/published.

Selected unedited screenshots retain the hub fold/grid, compact Crossword, enlarged text,
Backgammon, Cascade, existing arcade art, Mahjong failure and its existing native-symbol recovery.
The all-art failure deliberately breaks the site logo too; that broken logo is injected evidence,
not a claim it fails normally. 200% CSS zoom on a 375px window is a below-normal-width stress test;
root-font enlargement is recorded separately. Ordinary 320px layouts pass.

Last Bastion pointer entry at a narrow viewport does not test its touch-only notice. Atlas's
landing page does not test its external game. No new Linux visual baselines, native/hardware/audio/
screen-reader acceptance, Search Console access, release, portfolio rerun or production build ran.
No valid newsletter or payment action was submitted; diagnostic analytics requests were blocked.
