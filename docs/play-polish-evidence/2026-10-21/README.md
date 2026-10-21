# Play implementation evidence — 21 October 2026

Runtime: `b1b28c0f` and `fedd3fdd`, with native activation follow-up `3f43a3f8`;
test follow-up `e4333cba`.
[Completed batch](../../archive/PLAY-POLISH-IMPLEMENTATION-2026-10-21.md),
[active priorities](../../PLAY-AUDIT-AND-PRIORITIES-2026-10-21.md).
No push, native/production package, new mode or raster generation ran.

- `complete-browser.txt`: complete **152-case** arcade run passes in **4.2 minutes**. It started
  before the three-line native activation follow-up, so it is not an exact-final-runtime claim.
- `keyboard-final.txt`: all **17 implementation cases** pass afterward, including native Space
  activation and the corrected Backgammon automatic-move check. Syntax passes afterward too.
- `final-target.txt`: 15 implementation browser scenarios pass, including native Mahjong
  matching/preference/failure, real-time sizing, Focus play keyboard ownership/pause/escape,
  Crossword local enlargement and actual typing, hub discovery and a legal Backgammon move.
- `narrow-tests.txt`: two additional compact-control scenarios pass at 320 and 390px.
- `backgammon-repeat.txt`: five repeated checks pass after respecting the existing controller's
  automatic single-destination action. That earlier assertion failure was a test assumption;
  no Backgammon move rule was changed. The follow-up now checks decreasing live pip count.
- `page-wiring.txt`: actual generators preserve standalone game/legal/redirect fixtures and
  update ordinary pages idempotently. These fixtures run in CI; no generator ran on dirty pages.
- `final-site.txt`, `final-javascript.txt`, `final-contrast.txt`, `final-bootstrap.txt`: integrity
  377 pages, syntax 75 files, configured contrast 489 rule/theme combinations and shared UI
  bootstrap 43 playable pages pass. These are not full image/canvas/AT accessibility checks.
- `offline-upgrade.json` / `.txt`: the actual previous v46 worker upgrades to v47 on current local
  pages. After activation/reload its reply identifies v47, v46 is absent from the captured settled
  cache list, and warmed Crossword enlargement works offline with no page exceptions. This is
  a local worker transition, not an old production HTML bundle or live deployment acceptance.
- `captures.json` and selected PNGs: fresh final phone, focused landscape, enlarged board/grid,
  enlarged text and missing-art views. Thirteen/copy changes have no new art requirement.
- `provenance.json`: runtime hashes after testing. Other sessions' dirty controllers remain in
  the tested tree; do not call this a clean/exact-commit or published release report.

`portfolio.txt`: the final `node scripts/check-all.js` run passes all **20 discovered portfolio
guards**, including the shared-asset delivery fixtures and consumer manifests. It started before
the three-line native activation follow-up and finished afterward; no exact-clean-HEAD claim. Older interrupted
runs and an earlier full run with a single Backgammon assertion failure are not passing evidence.
No Linux baseline was generated/replaced. Physical phones, assistive technology, audio, browser
zoom, whole-game difficulty/paid-value acceptance, native packages and external-game owners remain.
The old [audit captures](../../play-audit-evidence/2026-10-21/README.md) are pre-fix evidence.
