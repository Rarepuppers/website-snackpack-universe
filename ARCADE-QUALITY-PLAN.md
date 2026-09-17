# Arcade quality plan

Where the 39 games in `play/` stand against `scripts/check-new-game.mjs` — the bar
written for new games, which exempts everything in `data/arcade-baseline.json` and so
had never been applied to any of them — plus a runtime audit that bar does not cover.

**Gate score: 147 gaps → 60**, and every remaining one is either argued down below or
needs a decision rather than a fix. Re-run it yourself rather than trusting that number;
other sessions edit these pages constantly:

```bash
cd website-snackpack-universe && sed "s|\.filter((slug) => !baseline\.has(slug));|;|" scripts/check-new-game.mjs > /tmp/score-all.mjs && node /tmp/score-all.mjs
```

---

## Done (2026-09-17, all live and verified against production)

| Commit | Work |
| --- | --- |
| `a20ff05b` | Pause + `visibilitychange` for the 7 real-time games |
| `fcc9406e` `32e7d78f` | Saved progress: 2048, mahjong, pyramid, tripeaks, golf-solitaire |
| `5861d2cb` | Saved progress: checkers, connect-4, reversi |
| `cb0fbad7` | Written keyboard reasons for 25 games |
| `52dde7fc` | FAQPage structured data for 28 games (all 39 now have one) |
| `55c15335` | Two defects in the gate itself, + Connect 4's win record and two thin pages |
| `843cc683` | This plan, and the runtime audit behind it |
| `fa7254b7` | **The offline FAQ answer was wrong on 29 pages** |
| `356cd1fd` | Three unreachable daily puzzles; a game count nothing owned |
| `beaf1483` | **Soccer games: 9,082 KB → 2,315 KB first load** |
| `56c91330` | Eight games no longer overflow at phone width |

84 specs across `tests/visual/arcade-{pause,resume,keyboard,faq,record,daily,weight,mobile}.spec.mjs`,
all passing against live. Each was confirmed to **fail with its fix removed** before
being kept.

### What the two big ones actually were

**Page weight.** `crossbar-challenge` pulled 9,082 KB on first load against an arcade
median of 869 KB, and all eight soccer games were in that range. Two independent causes:
`soccer-assets.js` loaded both pitch sheets on every page when a game only ever draws
one (2.4–2.6 MB of art that could never reach the screen), and `play/sprites/` was 8 MB
of raw PNG with no WebP anywhere. The same art at WebP q90 is 1.8 MB — a 4.4× saving,
matching what Brain Games Vol 2's assets did; lossless was tried and managed only 1.4×.
Live is now ~2.0 MB.

**The offline answer.** The FAQ shipped in `52dde7fc` told people the web version needs
a connection and pushed them to the Android app, copying a house line from Minesweeper
that predates `sw.js`. Cutting the network proved it false: the service worker registers
on all 39 game pages, a visited game is fully playable offline, and even a never-visited
game loads because the shell is precached. `manifest.webmanifest` had been advertising
this the whole time. For the four web-only games it was worse — they were told "not as an
installed app", when they install as a PWA like everything else.

---

## Remaining gate items, and what to do about each

**36 × `SCORECARD.md` — do not write these retroactively.** It is a pre-ship process
artifact for a new game. Writing 36 after the fact is paperwork that documents nothing
anyone will read. Keep requiring it for new games only, which the baseline exemption
already achieves.

**18 × saved progress — deliberately skipped.** The remainder are reflex games
(`flappy-snacky`, `snacky-worm`, `table-tennis`, `keepy-uppy`, `dribble-rush`,
`asteroid-destroyer`) and the short soccer sessions. Resuming a 60-second run mid-flight
is not a meaningful offer. Revisit only if one of them gets a longer mode.

**3 × persisted best result — needs a product decision, not a fix.** `checkers`,
`reversi` and `penalty-shootout` have nothing to persist: their readouts show live piece
and disc counts, not a match record. Closing this means adding a record concept and a
readout chip to each. Connect 4 was different — it already displayed a tally that simply
never survived a reload, which is why only that one was fixed.

**2 × social card** — `pyramid` and `tripeaks` still use placeholders (see
`play/tiles/PLACEHOLDERS.txt`). Needs art; cannot be generated here.

**1 × download funnel** — `tripeaks` is genuinely in no Android app. Either ship it in a
volume or leave the gap honest.

## Still worth doing, nobody has

**`play/shared-assets/game-ui/` is 57 MB and contains no WebP at all.** This is the
single largest remaining win and it is an asset job, not a code one — see the Codex
handover in `CODEX-ASSET-HANDOVER.md`. `921d96c6` did the only two that CSS pulls
directly (`board-game-icons.png` 2,311 KB → 457 KB, `painted-walnut.png` 1,860 KB →
120 KB, which took snakes-and-ladders from 4,927 KB of media to 863 KB). Everything else
in that tree is resolved through `game-ui-assets.js`, which another session is editing,
and several packs look like they want regenerating at source rather than converting in
place: the table themes alone are eight PNGs at 1.8–2.2 MB each.

**`arcade.spec.mjs` screenshots only 6 surfaces** — hub, 2048, sudoku, solitaire,
water-sort, stats. Most game pages have no visual baseline at all, which is why the
toolbar and layout changes in this batch updated no snapshot. **Do not fill this gap
from a Windows machine**: new baselines must be generated on CI's Linux renderer or they
will fail for everyone else. That makes it a CI task, not a local one.

**Three games still persist no result** (`checkers`, `reversi`, `penalty-shootout`) and
that needs a product decision — see the gate section above.

---

## Standing traps for whoever picks this up

- **`npm run test:visual` fails locally on Windows and it is usually not you.** Those
  baselines are CI's Linux renders. 15 were already stale before this session (the hub
  grew 283px when pinball landed; three mobile stages grew exactly 54px from another
  session's control row). **Never refresh them from a Windows run** — it replaces Linux
  renders with Windows ones and breaks CI.
- **Other sessions edit these pages constantly.** Scope `git add` to your own files, and
  where a file carries someone else's uncommitted line, stage your version through the
  index (`git hash-object -w` + `git update-index --cacheinfo`) rather than bundling
  theirs. Never `git checkout -- .` in this repo.
- **A green board proves nothing about whether a game can be played.** The pause work
  passed every assertion while never shooting a ball, and the restructured tweens could
  have hung three games silently. Play a full round. Confirm each new spec fails with its
  fix removed.
- **Re-derive a reported gap before believing it.** Two of the gate's own checks were
  wrong: 17 reported "no persisted best" were really 4, and 4 "no download funnel" were
  really 1.
- **Measuring page weight is harder than it looks.** A warm service worker reported 72 KB
  for a 6.6 MB page; the HTTP cache survives `newContext()` and reported 524 KB for the
  same page; not awaiting `res.body()` reported anywhere between 185 and 597 KB. A fresh
  browser process, `serviceWorkers: "block"`, and awaited bodies — see
  `arcade-weight.spec.mjs`.
