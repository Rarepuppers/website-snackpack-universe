# Arcade + classroom plan (plan of record)

Started 21 November 2026, rewritten 26 November 2026. This is the live plan for
`/play/`, the classroom audience and the site's event counts. It replaces
`ARCADE-NEXT-PLAN-2026-10-20.md`, `ARCADE-AUDIT-2026-10-17.md` and
`ARCADE-QUALITY-PLAN-2026-09.md` (all now in `docs/archive/`); their open items are carried
over in section 6. Art requests stay in `CODEX-ASSET-BRIEF-2026-10-17.md`.

Data sources and how to read them:
- **GoatCounter** (anonymous event counts): `node scripts/read-site-events.mjs --from YYYY-MM-DD [--to …]`.
  Key: the "### read access" section of `~/billing/goatcounter.txt`.
- **Search Console** for search; **Cloudflare Web Analytics** for page loads only.
  In Cloudflare, count **visits**, split out Honduras (HN) and Sri Lanka (LK),
  and exclude `userAgentBrowser = ChromeHeadless` (a bot, see 1.2).

---

## 1. What we know

### 1.1 Two audiences

1. **Searchers** want card and classic puzzle games. Thirteen is the proven one:
   139 Google clicks in 28 days (to 19 Nov) at position 6.2; 2048 is a distant
   second (9 clicks).
2. **A Honduran school** (plus newer Sri Lankan mobile visitors) arrives by
   bookmark on weekdays around 9 am local, reads `/read/` books first, then
   plays short games on desktops. On 20–21 Nov it was ~45% of all page views.

### 1.2 Cloudflare's top games are a bot

`/play/solitaire/`, `/play/last-bastion/` and `/play/killer-sudoku/` led
Cloudflare because of one **ChromeHeadless on Linux** visitor (US, no referrer,
one page per visit, every hour). Nothing of ours calls those URLs. GoatCounter
confirms it: Solitaire had **1** game started in 19 days against 290 Cloudflare
views in 30. The site is on GitHub Pages, so Cloudflare cannot block it; filter
it when reading.

### 1.3 GoatCounter, 6–25 November (about 195 game starts, 42 games)

| Finding | Evidence | Meaning |
| --- | --- | --- |
| Thirteen is a third of real play, none of it from the class | 71 starts (37%), 0% HN, 31 wins, 4 friend tables | Search players. Keep it first. |
| The class plays quick, no-reading games | HN share of starts: Connect 4 75%, Snacky Worm 73%, Word Search 60%, Table Tennis 60%, Pinball 57%, 2048 44%, Cascade 4/4 | Matches the featured row and the friend row. |
| Quiet performers | Water Sort 10 starts / 6 wins, Hearts 9 / 9, both mostly not HN | Adults finishing games. See R1. |
| A long tail | 23 games had 1–2 starts, incl. most of the 10 soccer games | Depth in the top games beats more games. See R4. |
| Stray | `arcade/deploy-check/start` (1) | A manual test. Ignore. |

"start" is counted once per page visit and a player can win several games in
one visit, so wins ÷ starts is **not** a win rate. Time bands, dailies, hub
clicks and book events only exist from 26 Nov.

---

## 2. Steps and status

| Step | Work | Status | Commit |
| --- | --- | --- | --- |
| 1 | Anonymous counts: play-time band, daily, hub tile + position, books (start/finish/listen/pdf). GPC, DNT and automated browsers send nothing. `/privacy/arcade/` covers `/play/` and `/read/`. | **Live** 26 Nov | e8a7afc0 |
| 2 | Featured row Thirteen, 2048, Connect 4, Snacky Worm, Pinball; "Play with a friend" row (Connect 4, Checkers, Reversi, Thirteen invite) and "With a friend" filter; homepage "Read a story → / Play a game →" | **Live** 26 Nov | 1401b2e3, 348713d2 |
| 3 | Thirteen and 2048 titles left alone (6 Nov change, read due ~4 Dec). Rules guide retitled "13 Card Game Rules: How to Play Thirteen (Tiến Lên)" for its top query `13 rules`. Mahjong: no query data, no change. | **Live** 26 Nov | 1401b2e3 |
| 4 | Tip popup waits until after school: never Mon–Fri 08:00–15:00 local. `/read/` never had one. | **Live** 26 Nov | 1401b2e3 |
| 5 | **Snack Typer** `/play/typing/`: six lessons, sentences from 10 books with links back, finger-coloured keyboard, accuracy stars, daily, resume; funnel Sentences & Spelling | **Live** 26 Nov | 5d5fd62f |
| 6 | **Fact Sprint** `/play/math-facts/`: six lessons, Practice (missed facts come back) or 60-second Sprint, number pad, counting dots, a number story per lesson, daily, resume; funnel Basic Math | **Pushed** 26 Nov | see section 7 |
| 7 | Spanish option for buttons and instructions on `/read/` and the classroom games | **Waiting** on R6 data | — |

---

## 3. Recommendations (detailed)

Each has the evidence, the work, when it is done, and how we will know it worked.

### R1. Re-pick the featured row on ~10 December
- **Evidence:** Water Sort (10 starts, 6 wins) and Hearts (9, 9) are finished
  by adults; Snacky Worm and Pinball are in the row for the class.
- **Work:** run the reader for 26 Nov – 10 Dec. If Water Sort or Hearts has
  more starts from outside HN than Pinball has in total, swap it in for Pinball
  in `featuredFirst` (`play/hub.js`) and update `arcade-thirteen.spec.mjs`'s
  featured-order test and the six hub baselines from CI.
- **Done when:** the row reflects the 14-school-day read.
- **Measure:** `hub-position/1-5` share of hub clicks before and after.

### R2. Put Snack Typer and Fact Sprint on the Daily page
- **Evidence:** both have a daily; `/play/daily/` is where the daily habit
  lives, and the hub's Daily filter already lists Snack Typer.
- **Work:** add a `daily-challenge-card` for each to `play/daily/index.html`
  and `play/index.html`'s daily section once each has a week of starts.
  `arcade-daily.spec.mjs` checks every card reaches a working daily.
- **Done when:** both cards are live and the spec passes.
- **Measure:** `arcade/typing/daily` and `arcade/math-facts/daily` counts.

### R3. Fact Sprint (step 6)
- **Evidence:** the class is on desktops in lesson time; math facts are the
  other everyday computer-room drill; we own two math apps and five number
  stories on `/read/`.
- **Work:** as built in section 4.
- **Measure:** starts, daily, time bands and HN share at 14 school days;
  `/go/arcade/math-facts/basicmath/` views in Cloudflare; Search Console
  "math facts practice" style queries after 28 days.

### R4. Stop adding soccer reflex games
- **Evidence:** 10 soccer games, most with 1–2 starts in 19 days; no search
  demand found for them.
- **Work:** none to build. Do not port more. Keep them working; no new art.
- **Revisit:** only if a World Cup or a search query appears for one.

### R5. Codex art for the two new games, plus the old placeholders
- **Evidence:** Snack Typer and Fact Sprint ship with interim generated art;
  Pyramid and TriPeaks still use placeholder social cards; brief items 12–16
  are interim cards.
- **Work:** add items 17 (Snack Typer: painted keycap tile and card) and 18
  (Fact Sprint) to `CODEX-ASSET-BRIEF-2026-10-17.md`. Same sizes as the other
  tiles: 144×144 and 288×288 PNG, 1200×630 PNG, WebP siblings.
- **Done when:** files land under the same names; no code change needed.

### R6. The 10 December read, with decision rules
- **Work:** `node scripts/read-site-events.mjs --from 2026-11-26 --to 2026-12-10`.
- **Questions and rules:**
  1. Do HN students finish books? If HN `books/*/finish ÷ start` is under 30%,
     do step 7 (Spanish) next; if over 50%, step 7 waits.
  2. How long do they play? If a featured game's time bands are mostly
     `under-1m`, look at its first screen (instructions, controls) before
     anything else.
  3. Where do hub clicks come from? If `together` beats `1-5`, the friend row
     earns a place above the featured row.
  4. Typing and math: do classes come back for the daily?
- **Done when:** findings and decisions are written into this file.

### R7. Thirteen and 2048 title read on ~4 December
- **Evidence:** both retitled 6 Nov. Baselines: `free thirteen` 265 impressions
  / 0 clicks and `play thirteen` 219 / 0; 2048 285 impressions at position 17.4
  over 90 days.
- **Work:** Search Console 28 days after the change vs the 28 days before.
  Revert a title only if CTR fell at the same position.
- **Then:** if Thirteen holds, its next lever is position: a "How to play in
  60 seconds" box above the game and links to Big Two and Rummy 500 under it.

### R8. 2048 variants
- **Evidence:** 2048 is the second search page and 44% of its starts are the
  class.
- **Work:** 3×3 and 5×5 boards and a daily seed, after R7's read. Records per
  size; the shared resume key gets the size as its variant.
- **Measure:** 2048 impressions and starts at 28 days.

### R9. A classroom links block and a way for teachers to reach us
- **Evidence:** the Honduran teacher has no channel to us; `/for-teachers/`
  only has an email address.
- **Work:** on `/for-teachers/`, a "Links for your class" block with copyable
  links to today's Snack Typer daily, Fact Sprint daily and a suggested book,
  each with a Copy button. Keep the email link; a form needs a backend we do
  not run (Brevo forms are for the newsletter list only).
- **Measure:** Cloudflare views of `/for-teachers/` and any email received.

### R10. Spanish option (step 7) only if R6 says so
- **Work:** a Spanish toggle for buttons, instructions and hints (books stay
  English, it looks like an English class). Start with the friend row games,
  Snack Typer, Fact Sprint and the `/read/` reader controls.
- **Measure:** HN book finish rate and game time bands before and after.

### R11. Give checkers and reversi a match record
- **Evidence:** both are now in the "Play with a friend" row, and both still
  keep no result (carried over from the quality plan). Pairs of pupils want a
  score.
- **Work:** a W–L tally per mode (vs computer, two players) in a readout chip,
  saved under `sp_<game>_record_<mode>`; the gate's "persisted best result"
  then passes for both.
- **Done when:** the tally survives a reload; a spec plays a quick game.

### R12. Fix or quarantine the red visual checks on main
- **Evidence:** `reads-final.spec.mjs` "short viewport controls 740x360" has
  failed on every main run since at least 24 Nov; `last-bastion-polish-review`
  "dense kit review" failed on 348713d2. A permanently red check hides new
  failures.
- **Work:** whoever owns `/read/` fixes the 740×360 click timeout; Last
  Bastion's owner checks the dense kit review. Until then, note it in each
  push.

### R13. Land the generator drift
- **Evidence:** `build-breadcrumbs.mjs` and `build-webp.mjs` rewrite ~80 pages
  (animals, characters, guides, apps screenshots) that other sessions never
  regenerated.
- **Work:** one session runs both in a quiet moment, reviews and commits.
  Until then, anyone running them must keep only their own files.

### R14. Not now
- **More solitaire variants:** big demand, never ranked (indexing limit).
- **Dominoes / Mancala ports** (carried over): cheap, but the long tail says
  more games is not the lever. Revisit after R6.
- **Pusoy Dos alias page:** only if Search Console shows the query.

---

## 4. Step 6 — Fact Sprint (`/play/math-facts/`)

Name: **Fact Sprint**. "Snack Sums" was rejected: too close to Math Snacks
(New Mexico State's game series) and Junior Learning's "Addition Snacks".

| Part | What it does |
| --- | --- |
| Lessons | Add to 10 (45 facts, with counting dots), Add to 20, Subtract to 20, Times tables (pick 2×–12× or Mixed), Division (same tables), Mix (all four) |
| Practice | 20 questions, untimed clock shown; a missed fact shows "7 × 8 = 56" and comes back three questions later; stars by slips (≤1, ≤3, ≤6) |
| Sprint | 60 seconds from the first digit, pauses with the tab; best score per lesson and table |
| Input | Number pad (56 px buttons) or keyboard; checked as soon as enough digits are typed, Enter checks early, Esc restarts |
| Books | Each lesson links its number story: Cereal-Swimmer (number line), Luckybug (to 20), Hop-Tart (3×, 4×, 8×, division), Booklava (place value, for Mix) |
| Daily | 20 questions, five each of +, −, ×, ÷, seeded by the UTC day |
| Funnel | Snackpack Basic Math (`/go/arcade/math-facts/basicmath/`) |
| Records | `sp_math_facts_best_<mode>-<lesson>[-<table>]`, daily separate |

---

## 5. Measurement calendar

| Date | What | Tool |
| --- | --- | --- |
| ~4 Dec | Thirteen and 2048 titles (R7) | Search Console |
| ~10 Dec | First read of the new events (R6), featured row (R1) | `scripts/read-site-events.mjs` |
| ~11 Dec | Sokoban + Chess Puzzles day 28 (separate plan) | Search Console |
| ~16 Dec | Snack Typer and Fact Sprint at 14 school days | GoatCounter |
| ~24 Dec | Snack Typer at 28 days in search | Search Console |

---

## 6. Carried over from the archived arcade plans

- **Saved progress is deliberately skipped** for reflex games (flappy-snacky,
  snacky-worm, table-tennis, keepy-uppy, dribble-rush, asteroid-destroyer) and
  short soccer sessions. Revisit only if one gets a longer mode.
- **No match record** in checkers, reversi, penalty-shootout: R11 covers the
  first two; penalty-shootout stays as is.
- **TriPeaks has no app funnel** (it is in no Android app). Leave the gap honest.
- **`play/shared-assets/game-ui/` is ~57 MB with no WebP.** An asset job for the
  derivative pipeline, not a code one.
- **`arcade.spec.mjs` screenshots only 6 surfaces.** New baselines must come
  from CI's Linux renderer.
- **Option, not done:** a small "No ads · no sign-in" line in every game's title
  strip (changes every game screenshot).
- **SCORECARD.md is for new games only.** Do not write them retroactively.

## 7. Build records

### Step 5 — Snack Typer (26 Nov, 5d5fd62f)
- Six lessons; stop-on-error typing into a real text box (phones and IMEs
  work); next key outlined and named ("“s” — left ring finger"); stars for
  accuracy at 90/95/98%; live speed after 5 seconds; best per lesson; daily of
  8 words + 1 story sentence; resume; Escape restarts.
- 35 sentences from 10 `/read/` books link back to their book; the spec fails
  if a book or sentence changes.
- Found by its own test: "garden" was in the Top row lesson but needs N.
- Found on the way: `/for-teachers/` said we only used Cloudflare; it now names
  GoatCounter and links the policy, and lists Snack Typer.
- Funnel: Sentences & Spelling. Art: interim SVG tile and rendered card (R5).

### Step 6 — Fact Sprint (26 Nov)
- Built as in section 4. Engine block tested in Node (every answer, ranges,
  lesson sizes, table filter, no repeat in a row, requeue position, daily
  mix, stars); browser tests play a perfect round, a wrong answer coming back,
  the pad, a 60-second sprint on a fake clock, the daily hub and resume.
  The requeue test was checked to fail with the requeue removed.
- Found on the way: the shared toolbar script folds everything in
  `.game-controls` into "Options" on short screens, so a Practice/Sprint
  switch there would be hidden. It sits on its own row instead. **Any new
  game's primary mode switch belongs outside `.game-controls`.**
- `arcade-layout.spec.mjs` keeps a list of board selectors; Snack Typer was
  missing from it (CI failure on 5d5fd62f). Both `#ty-text` and `#mf-board`
  are now listed. **Add the board selector there for every new game.**
- Art: interim SVG tile and rendered card (R5, brief item 18).

---

## 8. Standing traps

- **Work in a worktree off `origin/main`.** The local website checkout drifts
  and carries other sessions' edits. Push with `git push origin HEAD:refs/heads/main`.
- **Never run `build-breadcrumbs` or `build-webp` and commit everything** (R13).
- **Hub screenshots change with any hub edit.** Push, take the six
  `hub-*-actual.png` from CI's `arcade-visual-diff` artifact, commit them as
  baselines. Never refresh baselines from a Mac or Windows run.
- **`arcade-thirteen.spec.mjs` pins the featured order.** Change it with `featuredFirst`.
- **A green board proves nothing about whether a game can be played.** Play a
  full round; confirm a new spec fails with its fix removed.
- **Cloudflare counts are bot-inflated and 10-bucketed.** Use GoatCounter for
  play and Search Console for search.
- **The tip popup is time-dependent** (school hours). Tests that open it must
  pin the clock (see `arcade-funnel.spec.mjs`).
