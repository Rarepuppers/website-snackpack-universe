# Arcade quality plan

Where the 39 games in `play/` stand against `scripts/check-new-game.mjs` — the bar
written for new games, which exempts everything in `data/arcade-baseline.json` and so
had never been applied to any of them — plus a runtime audit that bar does not cover.

**Score: 147 gaps → 60.** Re-run it yourself rather than trusting this number; other
sessions edit these pages constantly:

```bash
cd website-snackpack-universe && sed "s|\.filter((slug) => !baseline\.has(slug));|;|" scripts/check-new-game.mjs > /tmp/score-all.mjs && node /tmp/score-all.mjs
```

---

## Done (2026-09-17, all live)

| Commit | Work |
| --- | --- |
| `a20ff05b` | Pause + `visibilitychange` for the 7 real-time games |
| `fcc9406e` `32e7d78f` | Saved progress: 2048, mahjong, pyramid, tripeaks, golf-solitaire |
| `5861d2cb` | Saved progress: checkers, connect-4, reversi |
| `cb0fbad7` | Written keyboard reasons for 25 games |
| `52dde7fc` | FAQPage structured data for 28 games (all 39 now have one) |
| `55c15335` | Two defects in the gate itself, + Connect 4's win record and two thin pages |

Regression cover added: `tests/visual/arcade-{pause,resume,keyboard,faq,record}.spec.mjs`.
Each was confirmed to **fail with its fix removed** before being kept.

---

## P1 — Page weight: the soccer games pull ~9 MB on first load

Measured, not estimated. `crossbar-challenge` first load is **9,082 KB across 40
requests**; the arcade median is **869 KB**. All eight soccer games are in the same
range. Two independent causes, both cheap to fix:

**1. Nothing is re-encoded.** `play/sprites/` is 16 MB of raw PNG:

| File | Size |
| --- | --- |
| `pitch-wide.png` | 2,644 KB |
| `pitch-runner.png` | 2,440 KB |
| `soccer-goal.png` | 1,169 KB |
| `soccer-badges.png` | 893 KB |
| `soccer-fx-extra.png` | 388 KB |
| `soccer-sprites.png` | 332 KB |
| `soccer-actors.png` | 197 KB |
| `soccer-fx.png` | 131 KB |

There are **no `.webp` files in `play/sprites/`** and the repo already has
`scripts/build-webp.mjs`. Brain Games Vol 2's assets re-encoded ~4.6× smaller with no
code change, so expect single-digit MB to become high-hundreds of KB.

**2. Every soccer game downloads both pitches, and uses one.** `play/soccer-assets.js`
lines 170–177 `load()` all eight sheets unconditionally. Seven of the eight games call
`drawPitch(ctx, W, H, "wide")`; only `dribble-rush` uses the runner pitch. So
`crossbar-challenge` pays 2,440 KB for a pitch it can never draw, and `dribble-rush`
pays 2,644 KB for the same reason in reverse. That is ~27% of the payload wasted before
any compression.

**Fix:** load the pitch the page actually asks for (a variant argument already exists),
then run the sprites through `build-webp.mjs` with PNG fallback. Verify by re-measuring
first-load bytes, not by looking at the folder.

**Why it matters:** this is the arcade's biggest real-player defect right now. 9 MB on a
phone is a bounce, and these eight are the games most likely to be opened from a social
or search link.

## P1 — The offline FAQ answers are wrong on 28 pages

Shipped this session in `52dde7fc`, copying the house line from `minesweeper`. **It is
misleading, and the site outgrew it.**

Verified with Playwright and `context.setOffline(true)`: the service worker registers on
all 39 game pages, a visited game (`sudoku`) reloads and is fully playable with the
network cut, and **even a never-visited game (`kakuro`) loads offline** because the shell
is precached. `sw.js`'s own header says this was the point of it, and
`manifest.webmanifest` advertises "they keep working offline once installed."

So "The web version needs a browser tab open. For fully offline play, … the free Android
bundle" understates the product and pushes people to an app they may not need. Worse, the
four web-only games (`dribble-rush`, `header-hero`, `penalty-shootout`, `tripeaks`) were
given "Not as an installed app — this one is web only", which is **actively wrong**: they
install as a PWA and work offline like everything else.

**Fix:** rewrite the offline answer to lead with the truth (installs from the browser,
plays offline, no download), then mention the Android bundle only where the page really
links to one. Extend `tests/visual/arcade-faq.spec.mjs` to assert no answer claims the
web version needs a connection. The original `minesweeper` and `water-sort` answers need
the same correction — they predate the service worker.

## P2 — `manifest.webmanifest` undercounts the arcade

Says **"34 calm, ad-free browser games"**; there are **39**. `scripts/build-game-counts.mjs`
rewrites `data-game-count` spans in pages but never touches the manifest, so this drifts
silently every time a game ships. Fix the number and teach the build script to own it,
or the next game makes it 40 vs 34.

## P2 — Three daily puzzles are unreachable from the daily hub

`crossword`, `kakuro` and `picross` all accept `?daily=`, and all three were confirmed to
produce a working, deterministic puzzle (`kakuro` even sets `aria-pressed="true"` on its
Daily button). None of them is linked from `play/daily/`, which lists 14 games. The daily
hub is a retention surface and these are three free entries on it.

## P2 — Mobile horizontal overflow on 8 games

At a 390px viewport, measured as `scrollWidth - clientWidth`:

| Game | Overflow | First offender |
| --- | --- | --- |
| `penalty-shootout` | 12px | `canvas.pk-canvas`, `div.pk-pad` |
| `solitaire` | 10px | `div.sol-pile` / `div.sol-card` |
| `cascade` | 4px | `div.cs-pad` |
| `dribble-rush` | 4px | `canvas.dr-canvas` |
| `flappy-snacky` | 4px | `canvas.fl-canvas` |
| `snacky-worm` | 4px | `canvas.sw-canvas` |
| `sudoku` | 4px | `div.su-pad` |
| `word-search` | 4px | `div.ws-board` |

The 4px cases are a shared gutter/border miscalculation and probably one CSS fix; the two
larger ones are their own. Low severity — nothing is unreachable — but it produces a
sideways wobble on phones, and phones are most of the audience.

---

## Remaining gate items, and what to do about each

**36 × `SCORECARD.md` — do not write these retroactively.** It is a pre-ship process
artifact for a new game. Writing 36 after the fact is paperwork that documents nothing
anyone will read. Better: keep requiring it for new games only, which is what the
baseline exemption already achieves.

**18 × saved progress — deliberately skipped.** The remainder are reflex games
(`flappy-snacky`, `snacky-worm`, `table-tennis`, `keepy-uppy`, `dribble-rush`,
`asteroid-destroyer`) and the short soccer sessions. Resuming a 60-second run mid-flight
is not a meaningful offer. Revisit only if a specific game gets a longer mode.

**3 × persisted best result — needs a product decision, not a fix.** `checkers`,
`reversi` and `penalty-shootout` have nothing to persist: their readouts show live piece
and disc counts, not a match record. Closing this means adding a record concept and a
readout chip to each. Connect 4 was different — it already displayed a tally that simply
never survived a reload, which is why only that one was fixed.

**2 × social card** — `pyramid` and `tripeaks` still use placeholders (see
`play/tiles/PLACEHOLDERS.txt`). Needs art; cannot be generated here.

**1 × download funnel** — `tripeaks` is genuinely in no Android app. Either ship it in a
volume or leave the gap honest.

---

## Standing traps for whoever picks this up

- **`npm run test:visual` fails locally on Windows and it is usually not you.** Those
  baselines are CI's Linux renders. 15 were already stale before this session (the hub
  grew 283px when pinball landed; three mobile stages grew exactly 54px from another
  session's control row). **Never refresh them from a Windows run** — it replaces Linux
  renders with Windows ones and breaks CI. `arcade.spec.mjs` screenshots only 6 surfaces,
  so most game pages are not screenshot-covered at all.
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
