# Arcade audit — 2026-10-17

Every game in `play/` was played through one round at **phone width (375×812, touch)**
and **desktop width (1280×800, mouse/keyboard)** with Playwright, driving the real
controls: taps and swipes through CDP touch events on the phone, clicks and keys on
desktop. Turn-based games were played to a result against the CPU; sudoku, word
search and memory match were solved; kakuro and picross were solved through their
own Hint buttons (which also exercises the win path); reflex games were played to
game over. Console errors and failed requests were captured on every page.

This sits beside `ARCADE-QUALITY-PLAN.md` (the gate history) and
`CODEX-ASSET-BRIEF-2026-10-17.md` (the art Codex is asked to make).

**Headline:** nothing crashes, nothing throws, and every game can be finished at both
widths. The real problems are layout and weight, not logic: on a phone the board is
below the first screen on almost every game, the game toolbar painted over the site
header on all of them, and ~3 MB of the arcade's art is shipped as oversized PNG.

---

## Fixed in this pass (small, each with a test that fails without it)

| Fix | Where | Test |
| --- | --- | --- |
| **The asset verifier hid every target after the first failing one.** `$failures` is global, so `if ($failures.Count -gt 0) { continue }` skipped Vol 2, Vol 3 and Website whenever Vol 1 failed. Now it counts only this target's errors. With it fixed, all four targets verify clean (Vol1 637, Vol2 436, Vol3 487, Website 648 files current). | monorepo `scripts/verify-game-ui-assets.ps1` | new fixture in `scripts/test-game-ui-delivery.ps1`: breaks Vol1 *and* Website, requires both reported. Fails with the old line ("a failing target masked the target after it"). |
| **Game toolbars drew over the sticky site header** on every game page at every width. The pause-overlay rule `.game-stage .game-toolbar { z-index: 45 }` outranked the header's 20 because the stage had no stacking context; score chips and buttons slid over the nav as you scrolled. `.game-stage` now isolates its stack. Overlays, drag ghosts and the donation modal are appended to `<body>`, so nothing that needs to sit above the header is affected. | `play/play.css` | `tests/visual/arcade-header.spec.mjs` — scrolls each toolbar under the header and asks `elementFromPoint` what is on top. Without the fix: every game fails. |
| **"You leads" / "played by You"** in Thirteen's table label. | `play/thirteen/index.html` | `tests/visual/arcade-copy.spec.mjs` |
| **"You wins! Reached 100." / "Snake! You slides…" / "Ladder! You climbs…"** in Snakes & Ladders. | `play/snakes-and-ladders/index.html` | same spec; timers sped up and games repeated until the player has both met a snake/ladder and won, so the evidence is not down to the dice. Without the fix it catches "Ladder! You climbs to 84." and "You wins! Reached 100." |

---

## Play-through results

All 38 game pages: **0 page errors, 0 console errors, 0 failed first-party requests**
at both widths (the only failures are the Cloudflare beacon and GoatCounter, which
cannot resolve offline).

| Game | Phone | Desktop | Notes from play |
| --- | --- | --- | --- |
| 2048 | game over (swipes) | game over (arrows) | fine |
| asteroid-destroyer | game over | game over | touch fire/rotate work; celebrates and asks for a tip on a **score of 0** |
| cascade | topped out | topped out | share card says "Nice one" for a score of 1 |
| checkers | lost to CPU | lost to CPU | resume works; no match record (gate gap) |
| connect-4 | lost | lost | fine |
| crossbar-challenge | full time | full time | fine |
| crossword | typed via on-screen keys | typed | Check / Reveal cell / Reveal word exist; **cells are 18 px on a phone** |
| dribble-rush | 60 s run, new best | same | fine |
| flag-frenzy | out of guesses | same | already saves daily progress — its gate gap is false; keys are `snackpack-flag-frenzy-*`, outside the `sp_` namespace |
| flappy-snacky | game over | game over | **3.6 MB first load** — see weight |
| free-kick-curl | full time | full time | fine |
| freecell | 700 moves, no end | same | no errors; random play can't judge the win path |
| goalkeeper-hero | full time | full time | fine |
| golf-solitaire | no moves left | same | fine |
| header-hero | full time | full time | fine |
| kakuro | solved (hints) | solved | fine |
| keepy-uppy | dropped | dropped | fine |
| last-bastion | touch gate shown | loads | **phone gate: the "Last Bastion" title overlaps the "Games that work by touch" label.** Left to its own sessions. |
| mahjong | no moves left | same | **tiles are a fixed 28×38 px at every width** — a 216×196 board in a 640 px stage on desktop |
| memory-match | solved, best saved | solved | rounds are ≤15 pairs; resume not worth adding |
| minesweeper | boom | boom | Flag-mode button exists; hint text says "Left-click / Right-click" on a phone |
| penalty-shootout | full shootout | same | no persisted record (gate gap) |
| picross | solved (hints) | solved | fine |
| pinball | — | game over at 65 s | own `check-pinball.mjs --smoke` passes; another session's |
| pyramid | no moves left | same | tile and social card are placeholders |
| reversi | lost 21–43 | lost 27–37 | no record (gate gap) |
| snackwords | guesses accepted | same | already saves the daily board (`sp_snackwords_v1`) — gate gap is false |
| snacky-worm | swipe starts, game over | arrows | fine |
| snakes-and-ladders | CPU won | **"You wins!"** — fixed | a 5–10 minute family game with **no resume** |
| soccer-trivia-sprint | sprint complete | same | fine |
| solitaire | 700 moves, no end | same | "Click a card…" shown to touch players |
| spider-solitaire | 700 moves, no end | same | fine |
| sudoku | solved | solved | fine |
| table-tennis | full match to 7 | same | fine |
| target-shooting-arena | 12 shots, 0 pts | 12 shots, 86 pts | moving target is hard to hit by chance; not broken |
| thirteen | **won** with naive play | lost | **"You leads"** — fixed. CPU is weak: playing the lowest legal single beat all three CPUs in 2 of 3 games |
| tripeaks | no moves left | same | placeholders; in no Android app |
| water-sort | 300 random pours | **solved by random pours** in 26 moves | Classic is easy enough to solve at random — consider whether Classic should be the default |
| word-search | solved (touch drag) | solved | status line never acknowledges a found word |

---

## Problems, worst first

1. **On a phone the board is below the first screen on almost every game.** With the
   new one-row header the board still starts at 672–1,104 px on a 812 px screen —
   fully off-screen on most, a sliver on the rest (2048, flappy, snakes, pinball). On
   a 1280×800 desktop it is only partly visible on nearly all. The cause is the same
   template everywhere: ~400 px of hero (eyebrow, H1, a 4–6 line paragraph) and a
   ~300 px options toolbar (difficulty, mode, colour pickers, sound, new game) sit
   above the board. A player taps "Play" and lands on text.
2. **The /play/ hub on a phone:** the first game tile is at **2,391 px** (it was
   1,786 px on 10-16) and the page is **18,953 px** tall: a 727 px hero with a 289 px
   paragraph, an 830 px daily panel, a 402 px search/filter block, then 40 tiles in
   one column at 312 px each.
3. **Weight that players actually download** (cold, fresh browser):
   flappy-snacky 3.6 MB; the eight soccer games 1.8–2.0 MB; snakes-and-ladders 1.1 MB;
   checkers 1.0 MB. Almost all of it is a handful of oversized PNGs — see the asset
   section. Converting just the fetched files cuts the sample measured from
   3,567 KB to 200 KB.
4. **Mahjong tiles never scale** (28×38 px at all widths). On a phone they are below a
   comfortable tap size and stacked tiles overlap, so the hit area is smaller still.
5. **Crossword cells are 18 px on a phone.** The on-screen keyboard makes typing
   workable, but selecting a cell is fiddly.
6. **Thirteen's CPUs are too easy** to be a satisfying opponent.
7. **Mouse words shown to touch players:** solitaire ("Click a card…", 3 strings),
   minesweeper ("Left-click / Right-click"), checkers, reversi, penalty-shootout,
   sudoku, spider-solitaire hints.
8. **Celebration tone on a bad run:** asteroid-destroyer fires its celebrate modal
   (with tip ask) on every game end including score 0; cascade's share card says
   "Nice one" for a score of 1.
9. **`funnel.js` stamps its once-a-day modal with the UTC date**
   (`toISOString().slice(0,10)`), the known UTC/local day-key bug: west of Greenwich
   in the evening, "once a day" resets early. Low impact.
10. Last Bastion's phone gate overlaps its title and a label (its own sessions own it).

No dead ends were found: every game reaches a terminal state, offers a New game /
retry, and Undo/Hint/Shuffle exist where a player can get stuck.

---

## Gate gaps, re-derived (60 → what is actually left)

`node <copy of check-new-game.mjs without the baseline filter>` still reports 60.
36 are SCORECARD.md (skip, as agreed). Of the other 24:

- **saved progress (18):** snackwords and flag-frenzy **already save** under their own
  keys — false gaps (the gate only looks for `resume.js`). memory-match: no — rounds
  are short. **snakes-and-ladders: yes** — 5–10 minutes, often pass-and-play, so
  losing the board to a closed tab costs something. cascade and the reflex/soccer
  games: no.
- **persisted best (3):** checkers, reversi, penalty-shootout. Connect 4
  (`sp_connect4_record_cpu4`) and Thirteen (`sp_thirteen_wins`) already show the
  pattern: a W–L record per difficulty in a readout chip. Recommend copying it.
- **social card (2):** pyramid, tripeaks — in the Codex brief.
- **download funnel (1):** tripeaks — honest gap until a Brain Games volume ships it.

---

## Per-game polish proposals

Grouped by size. "S" is under an hour each.

**Every game (one template change, M):** a game-first layout on phones — H1 only
above the board, the description moved below it, and the options row collapsed
behind a single "Options" disclosure (difficulty, mode, colours, card back), keeping
score chips and New game visible. Same template on desktop with the hero shortened.
This is the single change that most improves the arcade, and it is the one I want
your OK on before touching 38 pages.

- **mahjong (M):** size tiles from the board width (CSS var from container), target
  ≥40 px wide on a phone.
- **crossword (S):** larger cells on phone (fill the stage width), or a "zoom to
  clue" row.
- **thirteen (M):** stronger CPU — at minimum, hold 2s and bombs, beat with the
  lowest winning combo, lead with low pairs/runs. Add an Easy/Normal choice.
- **snakes-and-ladders (S):** `resume.js` save.
- **checkers / reversi / penalty-shootout (S each):** W–L record chip per difficulty.
- **asteroid-destroyer, cascade (S):** celebrate only on a new best (or a threshold
  like keepy-uppy's 1200); softer share headline on a low score.
- **word-search (S):** "Found TIGER — 9 to go" in the status line.
- **touch copy (S):** "Tap" on coarse pointers for the 7 games above.
- **water-sort (S):** make Hard the default, or say Classic is the relaxed mode.
- **flag-frenzy (S):** migrate keys into the `sp_` namespace (with legacy read) so
  /stats/ and the store helper see them.
- **funnel.js (S):** local-date stamp.
- **hub (M):** phone layout — 2 compact tiles per row (~180 px), hero cut to one
  line, daily panel to a single strip, filters as one horizontal chip row. Estimated
  page height ~5,000 px instead of ~19,000.

---

## New games — ranked shortlist

Demand from Semrush's board-game ranking (Mar 2026): chess ~1.5M/month, mahjong
~673k, checkers ~450k, Yahtzee and backgammon in the 90–246k band. Card games
(spades, hearts) are not in that table; their demand is known to be large but I have
no measured figure. Every candidate below already exists as an engine in a Brain
Games app, which halves the work and gives the page a real download funnel.

| # | Game | Demand | Fit | Already in | Why this rank |
| ---: | --- | --- | --- | --- | --- |
| 1 | **Yahtzee-style dice** (generic name, e.g. "Snack Dice") | 90–246k | calm, solo, 5-minute rounds; dice art exists (`board-games/dice-*`) | Vol 2 `yahtzee` | measured demand, small engine, no AI needed, strong daily-seed fit. Name must avoid the Yahtzee trademark |
| 2 | **Spades** | high (unmeasured) | card UI and CPU patterns exist (Thirteen) | Vol 1 `spades` | big evergreen card search; funnels to Vol 1 |
| 3 | **Hearts** | high (unmeasured) | same as Spades; share the trick-taking engine | Vol 1 `hearts` | build with Spades — one trick engine, two pages |
| 4 | **Backgammon** | 90–246k | board + dice art exist | Vol 3 `backgammon` | measured demand, fills Vol 3's funnel (only pyramid/spider point there today) |
| 5 | **Block puzzle** (Block-Blast-style, generic name) | very high on mobile | calm, no timer, fits the arcade perfectly | Vol 3 `block-blast` | strongest current trend, but the name is a trademark and the search term belongs to the brand — rank it on fit, not search |
| 6 | **Chess** | ~1.5M | fits, but needs a credible AI and competes with chess.com/lichess | Vol 3 `chess` | highest demand, lowest chance to rank; worth it as a funnel to Vol 3, not as search traffic |
| 7 | Dominoes / Mancala | moderate | calm, art exists | Vol 1 | cheap ports, smaller audiences |
| 8 | KenKen / Killer Sudoku / Slitherlink | niche | daily-puzzle fit | Vol 3 | good for the daily hub, not for search |

Recommendation: **1, then 2+3 together, then 4.** Each still needs its SCORECARD.md
(name search, trademark review) before it is added to the hub.

---

## Shared assets

### What each consumer actually loads

| Consumer | Tree on disk | Actually used | What that costs |
| --- | --- | --- | --- |
| Brain Games (Vol 1) | 667 files, 22 MB | 421 files, **9.7 MB** statically `require`d | only required files enter the APK (no `assetBundlePatterns`), so the 246 unreferenced files cost disk, not users |
| Vol 2 | 437 files, 27 MB | 264 files, **19.5 MB** | biggest shipping set; 8 MB of it is raw backdrop PNG outside the derivative pipeline (below) |
| Vol 3 | 455 files, 16 MB | 262 files, **7.4 MB** | 11 pencil puzzles + word-guess still use **no** shared art: the 48 markers ship in the module but only Tents imports it |
| Website `play/shared-assets/game-ui` | 648 files, **62 MB** (585 PNG, 15 WebP) | **~45 files, ~3 MB** fetched by the 36 non-pinball games (every option and picker clicked) | players only download what is fetched; the rest is repo and deploy weight. 16 MB of it is packs no web game has (mahjong-tiles, chess, sokoban, battleships, dominoes, word tiles, jigsaw) |

The canonical `shared-assets/game-ui` is 142 MB of masters and stays as it is.

### Heaviest files players download, and what they could be

| File (web) | Now | WebP q88 at draw size | Used by |
| --- | ---: | ---: | --- |
| `sprites/arcade/flappy-snacky-bg-day.png` + `-night.png` | 2,510 KB | 144 KB (PSNR 39 dB, visually identical) | flappy — and **both** load even though one is shown |
| `pro…/board-games/png/checker-red.png` + `-dark.png` (512²) | 583 KB | 15 KB at 192² | checkers |
| `pro…/arcade-sprites/png/flappy-bird-0..2.png` (512²) | 418 KB | ~18 KB | flappy |
| 6 pipe caps/bodies | 250 KB | ~6 KB | flappy |
| 8 card backs | 555 KB | ~140 KB at 384 | memory, solitaire, spider |
| 4 painted suits | 193 KB | ~12 KB | 7 card games |
| reversi tokens, picross x-mark | 192 KB | ~14 KB | reversi, picross |

Flappy alone would go from 3.6 MB to roughly 0.6 MB.

`play/sprites/arcade/flappy-snacky-bg-*.png` is a **hand copy** of
`pro-hand-painted/arcade-sprites/backgrounds/` that lives outside the delivery
manifest — the same undeclared-derivative problem the pipeline was built to end.

Apps: Vol 2's root backdrops (`snacky-worm-{garden,pantry,midnight}.png`,
`brick-breaker-*.png`, `brain-games-vol-2/scenes/tile-slide-picnic.png` at 2.1 MB) are
~8 MB of raw PNG outside every pack, so the derivative pipeline never touches them.
The 1024² table themes (~0.5 MB each after quantising) are the next largest app item.

### Missing or off-style art

- **pyramid, tripeaks:** tile is the 96×94 studio-mark placeholder (byte-identical
  file); social card absent.
- **spider-solitaire tile** is flat and off-style beside the clay tiles;
  **thirteen** and **solitaire** tiles are near-identical fanned cards;
  **picross** reads as a colour grid like sudoku's, not a nonogram.
- The September generation list (KenKen operators, akari wall-block, shikaku corner,
  board grounds, mahjong 7–9 + dragons, more free card backs, strategy-token
  colourways, sokoban theme, battleship sunk/hulls) — **none of it landed.** It is
  app-side (Vol 1/3) and only matters once those games are wired.

All of the art above is in `CODEX-ASSET-BRIEF-2026-10-17.md`.

---

## Status — end of 2026-10-17 (all live unless noted)

Mark accepted the plan and the optional work; everything below was done the same day.

| Step | Result |
| --- | --- |
| Verifier masking bug | Fixed; all four targets verify clean in one run. |
| Website WebP | Pipeline delivers a .webp beside every shared-art PNG the site uses; the site copy holds only the 8 packs it uses (62 → 32 MB). Flappy Snacky cold load 3,588 → 592 KB (phone), Checkers 993 → 437 KB. `arcade-webp.spec`. |
| Game-first layout | Hero is a title strip; options fold behind "Options" where height is short. Phone: 28 boards wholly on the first screen, 10 tall canvases start on it (was 34 below it). `arcade-layout.spec`. Another session then moved the toggle code into `game-ui-controls.js` and refreshed the screenshot references from CI. |
| Hub on phones | First tile 2,391 → 873 px, page 18,953 → ~7,600 px. Search row fixed and `.sr-only` defined (labels marked sr-only were showing everywhere). |
| Polish batch | Snakes & Ladders resumes; Checkers/Reversi/Penalty keep a W–L record; touch-neutral hints; Asteroid/Cascade celebrate only real results; Word Search tap-to-select was broken (now fixed) and announces finds; funnel modal stamped with the local date; Flag Frenzy keys moved into `sp_`. |
| Mahjong / Crossword / Thirteen | Mahjong scales to its stage (41×56 px tiles on a phone, 67×91 desktop). Thirteen's CPU rewritten: the old one opened Classic with a 2 instead of the 3♠ in about two-thirds of games; an old-strategy player now wins 12% against it (was 26%). Crossword left as is: only the 15-column General grid is small (20 px) and a phone cannot fit it much larger; the clue bar and keyboard carry the input. |
| New games | Five Dice (40), Hearts (41), Spades (42), Backgammon (43), each with daily mode, resume, records, SCORECARD.md, specs, and Node simulations of thousands of games against the page's own engine. Interim tile/social art; final art is items 8–11 of the Codex brief. |
| Vol 2 backdrops | Already in the pipeline (Codex migrated them); the one that could not be quantised, `tile-slide-picnic`, is now WebP (2.1 MB → 179 KB). Vol 2 code change only — **no build**. |
| Vol 3 markers | Akari, Masyu, Slitherlink, Hitori, Nurikabe use the painted markers. Hashi, KenKen, Killer Sudoku, Word Guess wait on text-free art (brief G1b). |

**Still open, for Mark:**

- Brain Games Vol 2 lists the dice game under its trademarked name ("Yahtzee"). The web page avoids it; the app's listing and in-app name deserve a look before its next release.
- `build-pwa.mjs` / `build-theme.mjs` add their blocks to Pinball, Keeping Up and Last Bastion's privacy page, which deliberately do without them. I restored those files each time; whoever owns those generators should add an exclusion.
- Codex art: brief items 1–11 and G1b.

## Recommended order

Small items do not need a decision; the **bold** ones change many files or the
pipeline and wait for your OK.

1. ✅ Verifier masking fix, header stacking fix, two copy fixes (this pass).
2. **Website WebP derivatives through the pipeline.** Add a WebP step and a
   per-pack max edge to the `website` profile in `derivative-profiles.json` and
   `build-game-ui-derivatives.ps1` (manifest entries for the `.webp`s, PSNR floor
   applies), bring the flappy backgrounds into it, then point the ~10 consuming
   games at `.webp` with the PNG retry the soccer games already use. Biggest
   player-facing win; touches the shared build script.
3. **Game-first phone layout** for the 38 pages (template + play.css). Biggest UX win.
4. **Hub phone layout.**
5. Small polish batch: snakes resume, W–L records ×3, touch copy, celebrate tone,
   word-search feedback, funnel local date, flag-frenzy keys.
6. Mahjong tile scaling; crossword cell size; Thirteen CPU.
7. Codex art batch 1 (pyramid/tripeaks tiles + social, three tile redraws) — can
   start now, in parallel.
8. **Optional: trim the website's art copy** to the packs the site uses (drop 16 MB
   of packs no web game has) by narrowing the Website target's `packs`. Repo weight
   only; no player impact.
9. New games: Yahtzee-style dice, then Spades + Hearts, then Backgammon.
10. App side, separately: Vol 2 backdrops into the pipeline; Vol 3 marker wiring;
    Codex batch 2 (the September list) when those games are scheduled.

## How this was measured

Scratch harness (not committed): Playwright Chromium, fresh context per mode,
`serviceWorkers: "block"`, analytics routes aborted, local static server. Weights
are cold first-load totals of awaited response bodies. Asset usage is the union of
every request under `play/shared-assets/` and `play/sprites/` after loading each
game and clicking every segmented/option button and every `<select>` value. App
usage is static `require()`/`import` of `assets/game-ui/` across each app's source.
