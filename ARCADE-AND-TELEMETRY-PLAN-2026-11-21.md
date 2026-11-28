# Arcade + classroom plan (plan of record)

Started 21 November 2026, rewritten 26 November 2026, updated 29 November 2026. This is the live plan for
`/play/`, the classroom audience and the site's event counts. It replaces
`ARCADE-NEXT-PLAN-2026-10-20.md`, `ARCADE-AUDIT-2026-10-17.md` and
`ARCADE-QUALITY-PLAN-2026-09.md` (all now in `docs/archive/`); their open items are carried
over in section 6. Art requests stay in `CODEX-ASSET-BRIEF-2026-10-17.md`.

## Release closeout

Implementation is complete as of 27 November 2026. `49f722bd` shipped the
Thirteen quick guide, reusable teacher links and classroom counts, and the
painted arcade assets. `88e959ae` kept the Thirteen hand on the first screen.
[Check website](https://github.com/Rarepuppers/website-snackpack-universe/actions/runs/45927005045)
passed all 426 browser checks and verified all 52 boards at phone and laptop
sizes. The existing screenshot baselines passed. The release and corrected
Thirteen layout were verified on the public site.

The [completed art handover](docs/archive/CODEX-PROMPT-ARCADE-ART-2026-11-26.md)
is archived. This plan stays open for the measurements in section 5. The
November readings already settled the immediate release decisions. Reopen
feature work only if the longer measurements meet the recorded decision
rules.

### 28 November delivery

- [Classic Felt](https://github.com/Rarepuppers/website-snackpack-universe/commit/61f4956b10d48c4dff37168fc301120c367f8232) is live on Solitaire, FreeCell, TriPeaks, Hearts and Spades. The Vol. 1 app page leads its gallery with the library and links to the five browser games. FreeCell fits all eight columns at 320 CSS pixels.
- The [Thirteen reminder](https://github.com/Rarepuppers/website-snackpack-universe/commit/4635cc4f5d176b936a328c73efc26539b92ed66b) appears once per browser after three completed solo games. A click opens Google Play under `thirteen-reminder`, alongside the existing `thirteen` badge and `thirteen-qr` campaigns.
- The rules guide now uses “How to Play the 13 Card Game (Tiến Lên Rules)”. Its Search Console baseline for 29 October–25 November was 3 clicks from 1,364 impressions. [Title and breadcrumb](https://github.com/Rarepuppers/website-snackpack-universe/commit/767c8193af483ae6ec7fbbf8643107b161650e18)
- For future small visual changes, check the affected board and live page. Reuse matching CI results and add broader checks only for shared behavior or a specific regression risk.

### 29 November deal verification

- Replayed Klondike deal 2167 to a win in Draw 1 and Draw 3 through the browser. Restart deal resets the current board, and the game checks the accessible stock cards before suggesting a restart.
- FreeCell serves verified starting deals for four, two and one free cell. The reduced pools contain 1,047 two-cell and 182 one-cell deals. Four-cell Daily keeps its existing schedule. Older saves can still be resumed.
- Regenerate the reduced pools with `node scripts/gen-freecell-seeds.js --reduced --write`. Check the changed pools with `node scripts/verify-freecell-deals.js --reduced-only`.

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
| 6 | **Fact Sprint** `/play/math-facts/`: six lessons, Practice (missed facts come back) or 60-second Sprint, number pad, counting dots, a number story per lesson, daily, resume; funnel Basic Math | **Live** 26 Nov | 95efa536, 9b24bbe3 |
| 7 | Spanish option for buttons and instructions on `/read/` and the classroom games | **Keep English** after the early R6 read (0 HN starts) | — |

---

## 3. Recommendations (detailed)

Each has the evidence, the work, when it is done, and how we will know it worked.

**Status on 26 Nov (afternoon):** Mark asked to do everything now rather than
wait for dates. Done: R1, R2, R7 (early read), R8, R9, R11, R12, R13, R15, and
R5's prompt. Still waiting, because the data does not exist yet: R6 (class
behaviour over school days; new events began 26 Nov), R16 (needs the daily
counts), R10 (depends on R6). R5 waits on Codex.

**Status on 26 Nov (evening check):** CI and live state confirmed; the
gated items are still gated. GoatCounter has under a day of the new events
(one book start, no game starts yet: the class arrives ~15:00 UTC), so R6,
R1's re-check and R16 cannot be read before their dates. Search Console (to
23 Nov) gave no new lever that the plan's own rules allow us to pull before
4 Dec; its details are recorded under R7 and R17 for the reads. One CI flake
came back and was fixed (R12, item 4).

**26 Nov verification and data check:** The 26 Nov GoatCounter window had
one book start (`everybody-brought-potatoes`, outside Honduras), no
finishes, and no game or hub events. The new counts are too sparse for
R1, R6 and R16. Cloudflare Web Analytics for 21–25 Nov UTC counted 132
Honduras visits and 890 visits from outside Honduras after excluding
ChromeHeadless. This describes site traffic before the rollout. Use
GoatCounter to measure reading and play. The full Search Console title
window is pending (R7), and the R5 tile PNGs have yet to be delivered.

**27 Nov decisions brought forward at Mark’s request.** The available data
supports keeping both titles and Hearts in the featured row. The Thirteen
quick guide and reusable teacher daily links are ready to ship. The
27 Nov decisions made use of the available data windows. Keep the longer
windows on the calendar for measurement.

### R1. Re-pick the featured row — **done early, 26 Nov**
- **Evidence:** Water Sort (10 starts, 6 wins) and Hearts (9, 9) are finished
  by adults; Snacky Worm and Pinball are in the row for the class.
- **Work:** run the reader for 26 Nov – 10 Dec. If Water Sort or Hearts has
  more starts from outside HN than Pinball has in total, swap it in for Pinball
  in `featuredFirst` (`play/hub.js`) and update `arcade-thirteen.spec.mjs`'s
  featured-order test and the six hub baselines from CI.
- **Follow-up:** re-check the featured row and hub positions around 10 Dec.
- **Measure:** `hub-position/1-5` share of hub clicks before and after.
- **Decision (6–26 Nov data):** Hearts had 10 starts, all from outside
  Honduras, against Pinball's 7 in total, so the rule swaps Hearts in for
  Pinball. Water Sort (11 starts, ~8 outside Honduras) also cleared the bar;
  Hearts wins on the bigger margin. Pinball stays in the grid and in the
  class’s reach.
- **27 Nov re-check:** Over 6–27 Nov, Hearts had 10 non-Honduras starts,
  Water Sort had 8 and Pinball had 7 starts worldwide. Keep Hearts featured.
  The new-event window had no hub-position events, so keep the current row
  order and compare `together` with `1-5` when both have counts.

### R2. Put Snack Typer and Fact Sprint on the Daily page — **done 26 Nov**
- **Evidence:** both have a daily; `/play/daily/` is where the daily habit
  lives, and the hub's Daily filter already lists Snack Typer.
- **Work:** add a `daily-challenge-card` for each to `play/daily/index.html`
  and `play/index.html`'s daily section once each has a week of starts.
  `arcade-daily.spec.mjs` checks every card reaches a working daily.
- **Done when:** both cards are live and the spec passes.
- **Measure:** `arcade/typing/daily` and `arcade/math-facts/daily` counts.
- **Done:** both cards on `/play/daily/` (29 dailies now, counts updated
  across the site); `arcade-daily.spec.mjs` plays every card's daily.

### R3. Fact Sprint (step 6)
- **Evidence:** the class is on desktops in lesson time; math facts are the
  other everyday computer-room drill; we own two math apps and five number
  stories on `/read/`.
- **Work:** as built in section 4.
- **Measure:** starts, daily, time bands and HN share at 14 school days;
  `/go/arcade/math-facts/basicmath/` views in Cloudflare; Search Console
  "math facts practice" style queries after 28 days.
- **27 Nov early read:** Fact Sprint had zero starts or daily finishes.
  Snack Typer had one start outside Honduras, one worldwide `under-1m`
  time event and zero daily finishes. Keep both activities available through
  their homepage, Daily and classroom links. The finalized search window
  ended 24 Nov, before either activity launched.

### R4. Stop adding soccer reflex games
- **Evidence:** 10 soccer games, most with 1–2 starts in 19 days; no search
  demand found for them.
- **Work:** none to build. Do not port more. Keep them working; no new art.
- **Revisit:** only if a World Cup or a search query appears for one.

### R5. Codex art for the two new games and five interim social cards — **delivered 27 Nov**
- **Evidence:** Snack Typer and Fact Sprint ship with interim generated art;
  Pyramid and TriPeaks still use placeholder social cards; brief items 12–16
  are interim cards.
- **Work:** add items 17 (Snack Typer: painted keycap tile and card) and 18
  (Fact Sprint) to `CODEX-ASSET-BRIEF-2026-10-17.md`. Same sizes as the other
  tiles: 144×144 and 288×288 PNG, 1200×630 PNG, WebP siblings.
- **Done when:** files land under the same names, then switch the hub, Daily
  page and related-games references from `typing.svg` / `math-facts.svg` to
  the PNGs (run `build-related-games.mjs` and `build-webp.mjs`).
- **Archived prompt:** [27 November art delivery brief](docs/archive/CODEX-PROMPT-ARCADE-ART-2026-11-26.md).
  The delivery checklist now matches the file list (11 PNGs and 11 WebPs).
  The two tile PNGs are absent from main as of the 26 Nov verification.
- **27 Nov delivery:** Snack Typer and Fact Sprint have painted transparent
  tiles at 144×144 and 288×288 plus 1200×630 share cards. Rummy 500, Block
  Puzzle, Brick Breaker, Chess and Killer Sudoku have matching painted share
  cards. All 11 PNGs have quality-88 WebP siblings. The hub and Daily page
  use the new tiles, and regenerated related-game cards use the same
  images. Originals are in the companion workspace under
  `shared-assets/game-ui/website-arcade/2026-11-27/`.
- **Corrections found writing it:** (1) Pyramid and TriPeaks are **not**
  placeholders: Codex delivered them on 18 Oct, but their pages still shared
  the generic studio card. Both pages now use their own cards (26 Nov).
  (2) The brief's house rule bans rendered letters and digits, and my first
  items 17–18 asked for lettered keys and "7 × 8 = 56". Rewritten: blank
  finger-coloured keys with the F/J bumps; a dot array with a × and a stopwatch.

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
- **Reporting fix, 26 Nov:** The reader previously looked up Honduras for
  book starts only. It now looks up the start and finish event paths
  separately and prints the Honduras counts, per-book ratios and overall
  finishes ÷ starts. Game time bands and dailies also show Honduras
  counts alongside the worldwide counts. Hub positions remain worldwide,
  including `together`. Checked against the live read-only API and a
  synthetic report with different start and finish country splits.
- **27 Nov early read and decisions (26–27 Nov, GoatCounter site dates):**
  15 book starts and 5 finishes worldwide (33%), all outside Honduras.
  Honduras recorded 0 starts and 0 finishes. Its finish rate is undefined,
  so keep English as the current option. The only game time event was
  Snack Typer’s outside-Honduras `under-1m`, so there is no featured-game
  first-screen change. There were zero clicks in all positions, including
  `together` and `1-5`. Keep the friend row in place. Neither classroom game
  recorded a daily finish. Cloudflare counted 134 HN visits and 829 other
  visits for 22–26 Nov UTC after filtering ChromeHeadless. Use GoatCounter
  for the event-based decisions above. The first GoatCounter request
  returned HTTP 404 and succeeded on retry with the same date range.
- **Done when:** findings and decisions are written into this file.

### R7. Thirteen and 2048 title read — **early decision 27 Nov: keep both and ship the quick guide**
- **Evidence:** both retitled 6 Nov. Baselines: `free thirteen` 265 impressions
  / 0 clicks and `play thirteen` 219 / 0; 2048 285 impressions at position 17.4
  over 90 days.
- **Work:** Search Console 28 days after the change vs the 28 days before.
  Revert a title only if CTR fell at the same position.
- **Full comparison:** 9 Oct–5 Nov vs 7 Nov–4 Dec (28 days each).
  Use this follow-up window once Search Console finalizes 4 Dec, on the URL-prefix property
  `https://www.snackpackuniverse.com/`.
- **Then:** if Thirteen holds, its next lever is position: a "How to play in
  60 seconds" box above the game and links to Big Two and Rummy 500 under it.
- **Read (Search Console to 23 Nov; 17 Oct–5 Nov vs 7–24 Nov):**
  | Page | Clicks | Impressions | CTR | Position |
  | --- | --- | --- | --- | --- |
  | Thirteen before | 79 | 3,759 | 2.10% | 6.3 |
  | Thirteen after | 95 | 4,222 | 2.25% | 6.5 |
  | 2048 before | 5 | 126 | 3.97% | 8.2 |
  | 2048 after | 6 | 107 | 5.61% | 8.5 |
  Thirteen per day: 3.95 → 5.3 clicks (+34%) at a slightly worse position, so
  the title helps. 2048 is too small to call but not worse. **Keep both.**
  Re-confirm at a full 28 days (~4 Dec). The box shipped after the 27 Nov interim read.
- **Equal-length interim check (18 days each, finalized through 24 Nov):**
  | Page | 19 Oct–5 Nov clicks / impressions | CTR / position | 7–24 Nov clicks / impressions | CTR / position |
  | --- | --- | --- | --- | --- |
  | Thirteen | 73 / 3,442 | 2.12% / 6.25 | 96 / 4,460 | 2.15% / 6.54 |
  | 2048 | 5 / 119 | 4.20% / 7.82 | 7 / 117 | 5.98% / 8.45 |
  | Thirteen rules guide | 0 / 58 | 0% / 8.41 | 3 / 1,094 | 0.27% / 9.02 |
  Thirteen clicks rose ~32% with CTR nearly flat and more impressions.
  2048 still has too few clicks to judge. The guide row is a baseline
  from before its 26 Nov retitle. The same search read showed no new
  Pusoy Dos, typing practice or math facts practice query. Keep both game
  titles in place.
- **27 Nov decision:** Data was still finalized through 24 Nov. Four of
  the five tracked queries stayed at zero clicks after retitling. The
  exception was `card game 13 online` with 1 click / 130 impressions at
  position 3.32 (before: 0 / 112 at 2.84). The other four, before → after:
  `free thirteen` 157 at 4.67 → 160 at 3.29,
  `online thirteen` 62 at 4.34 → 82 at 4.32,
  `thirteen game online` 73 at 3.62 → 47 at 3.40,
  `play thirteen online` 44 at 3.77 → 21 at 4.24. The five totalled
  0 / 448 before and 1 / 440 after. Keep the titles and put a collapsible
  "How to play in 60 seconds" box in the title strip above Thirteen’s
  board. The first layout gave the collapsed box its own row. CI run
  [45925422202](https://github.com/Rarepuppers/website-snackpack-universe/actions/runs/45925422202)
  measured only 138 px of the hand visible on phones and 107 px on laptops.
  The disclosure now sits alongside the title when collapsed, so the
  hand starts on the first screen. The focused browser check showed the
  whole hand at both 375×812 and 1280×800 and verified keyboard operation.
  The screenshot baselines passed. The existing related-game links below the game already include Big Two and Rummy 500.
  Keep the full 28 days as a follow-up measurement.
- **Per-query view for the 4 Dec read (Search Console 27 Oct–23 Nov, 28
  days, 139 clicks / 6,493 impressions / position 6.3).** The clicks come from
  `13 card game online` (20 clicks, 7.3% CTR, pos 4.2), `tien len online`
  (12, 4.2%, 7.8) and `13 card game` (8, 4.8%, 8.7). The leak is a group of
  queries **already in the top 4 with almost no clicks**: `free thirteen`
  246 impressions / 0 clicks at 3.2, `card game 13 online` 201 / 1 at 2.9,
  `online thirteen` 116 / 0 at 4.0, `thirteen game online` 89 / 0 at 3.1,
  `play thirteen online` 44 / 0 at 3.8. The title already contains "Free",
  "13 Card Game" and "Online", so wording is not the obvious cause; the likely
  one is the results page itself (game carousels or app packs above the blue
  links for "thirteen" phrasings). **At the 4 Dec read:** compare these five
  queries before/after 6 Nov. If they are still ~0% at positions 3–4, do not
  touch the title again; the "how to play in 60 seconds" box and position
  work stay the lever. Also seen: `thirteen (tien len) | play it online`
  (46 impressions, pos 6.8), which is someone typing a page title.
- **The rules guide** (`/guides/thirteen-tien-len-rules/`) is the site's
  biggest impression page outside `/play/`: 978 impressions, 3 clicks (0.3%)
  at 8.9. Its queries are rules questions (`how to play 13 card game` 46,
  `the thirteen rules` 45, `13 rules` 41, `how to play 13` 32 at 6.1), all
  0 clicks. It was retitled on 26 Nov for exactly these; read it with the
  Thirteen page on ~4 Dec (title change needs ~2 weeks to show) and again on
  ~24 Dec. Also `bài tiến lên tiếng anh là gì` / `tiến lên in english`: a
  small Vietnamese audience asking what the game is called in English.
- **New finding:** 2048's queries include "2048 no ads", "2048 without ads"
  (position 1.2), "2048 google classroom" and "ezclasswork". Schools look for
  ad-free 2048. See R17.

### R8. 2048 variants — **done 26 Nov**
- **Evidence:** 2048 is the second search page and 44% of its starts are the
  class.
- **Work:** 3×3 and 5×5 boards and a daily seed, after R7's read. Records per
  size; the shared resume key gets the size as its variant.
- **Measure:** 2048 impressions and starts at 28 days.
- **Done:** 3×3, 4×4 and 5×5 (switch on its own row, remembered), a best per
  size (4×4 keeps `sp_2048_best` and the "default" resume variant, so nobody
  loses a record or saved run), and a daily 4×4 whose tile drops are seeded by
  the UTC date. Undo is off in the daily so scores are fair; the daily counts
  on `/play/daily/` when the board fills. FAQ (page and JSON-LD) updated.
  `tests/visual/arcade-2048-sizes.spec.mjs`.
- **Bug found and fixed on the way:** tiles were placed at `column × 25%`,
  but a tile is a quarter of the board *minus the gaps*, so the right column
  and bottom row sat 7.5 px short of their cells (225 + 67.5 = 292.5 of
  300 px). Tiles now use `calc()` with the gap, on every size; a test checks
  the bottom-right tile lines up with its cell.

### R9. A classroom links block and a way for teachers to reach us — **done 26 Nov**
- **Evidence:** the Honduran teacher has no channel to us; `/for-teachers/`
  only has an email address.
- **Work:** on `/for-teachers/`, a "Links for your class" block with copyable
  links to today's Snack Typer daily, Fact Sprint daily and a suggested book,
  each with a Copy button. Keep the email link; a form needs a backend we do
  not run (Brevo forms are for the newsletter list only).
- **Measure:** Cloudflare views of `/for-teachers/` and any email received.
- **Built:** "Links for your class" on `/for-teachers/`: today's Snack Typer and
  Fact Sprint dailies (the date is filled in on the page, in UTC like the
  games), Pip Sits, Luckybug's market story and the bookshelf, each with a
  Copy button that copies the full URL. `tests/visual/teachers-links.spec.mjs`
  checks the dates, the copy and that every link resolves.

### R10. Spanish option (step 7) — **keep English after the early read**
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

**Update 26 Nov: R11 is already done.** Both pages already show a "Record"
chip (`#ck-record`, `#rv-record`) saved per opponent on the device. The
September quality plan was stale on this; only penalty-shootout keeps no
result. Nothing to build. Lesson: re-check a carried-over gap before planning it.

### R12. Fix or quarantine the red visual checks on main — **done 26 Nov**
- **Evidence:** `reads-final.spec.mjs` "short viewport controls 740x360" has
  failed on every main run since at least 24 Nov; `last-bastion-polish-review`
  "dense kit review" failed on 348713d2. A permanently red check hides new
  failures.
- **Work:** whoever owns `/read/` fixes the 740×360 click timeout; Last
  Bastion's owner checks the dense kit review. Until then, note it in each
  push.
- **Found and fixed:**
  1. `reads-final` 740×360: at that size with 200% text the **sticky header is
     281 px of a 360 px screen** and covered the "One page at a time" button.
     It passed on a Mac and failed on CI's Linux fonts, but a reader on a
     landscape phone has the same problem. `site.css` now unpins the header
     below 480 px of height (`@media (max-height: 480px)`).
  2. `snack-haul-spotlight` (2 tests) started failing on 26 Nov when Snack Haul
     went live (`a96d1293`): the page correctly says "Now live on Google Play"
     with a Play link and "See the game"; the tests still expected the
     launch-email version. Tests updated to the launched state.
  3. The Last Bastion "dense kit review" failure did not repeat on the next
     two runs. Treat it as flaky unless it comes back.
  4. **It came back** on `ff0c14b0` (the 2048 baseline push), again as
     "dense kit review tritanopia 3840": a 30 s test timeout, not an
     assertion. Both failures were the 3840×2160 cases, which drive a 4K
     canvas at `stress=12` through CI's software renderer and spend 2.4 s
     holding keys on top. The two 3840 cases are now `test.slow()` (90 s);
     the 1920 cases keep 30 s and nothing the test checks changed. If a 3840
     case still times out at 90 s, that is a real performance regression for
     Last Bastion's owner, not a flake.
- **Verified:** `8ef16cdd` run [45740674851](https://github.com/Rarepuppers/website-snackpack-universe/actions/runs/45740674851)
  failed only the six 2048 screenshots. The hub baselines all passed.
  All six `ff0c14b0` files match the CI artifact byte for byte. Its run
  [45741727192](https://github.com/Rarepuppers/website-snackpack-universe/actions/runs/45741727192)
  exposed the 4K timeout above. After `9689fe37`, all three jobs passed in
  [45768097321](https://github.com/Rarepuppers/website-snackpack-universe/actions/runs/45768097321),
  and [Pages deployed](https://github.com/Rarepuppers/website-snackpack-universe/actions/runs/45768096567).
  The public homepage, hub script, 2048, Daily, Snack Typer, Fact Sprint,
  Pyramid and TriPeaks pages, and both share images matched Git byte for byte.
- **Local note:** `arcade-mobile` and `arcade-header` load every game in turn
  and can time out when run alongside other suites on a laptop; they pass on
  their own and on CI.

### R13. Land the generator drift — **done 26 Nov**
- **Evidence:** `build-breadcrumbs.mjs` and `build-webp.mjs` rewrite ~80 pages
  (animals, characters, guides, apps screenshots) that other sessions never
  regenerated.
- **Work:** one session runs both in a quiet moment, reviews and commits.
  Until then, anyone running them must keep only their own files.
- **Done:** run on a fresh `origin/main` and reviewed: breadcrumbs added to 79
  pages that never had them (54 character pages, 19 animal pages, a few
  others); 181 images on 66 pages now offer WebP (World Cup team pages, soccer
  games, homepage, Apps); 7 new WebP files, about 3 MB lighter (the ABC
  reading screenshot 1.35 MB → 186 KB; Sokoban and Chess Puzzles social cards
  ~290 KB → 15 KB). All gates and 65 browser tests passed. From now on both
  generators should be a no-op unless a page or image is added, so **run them
  as part of adding any page** and commit their output with it.

### R15. Classroom shortcuts on the homepage — **done 26 Nov**
- **Evidence:** the class lands on the homepage first (direct visits, desktop);
  the hero now links "Read a story" and "Play a game".
- **Work:** once the ~16 Dec read shows the class uses Snack Typer or Fact
  Sprint, add "Practise typing →" and "Practise maths →" to the same hero line.
  Cheap; the line already wraps on phones.
- **Measure:** HN starts of `typing` and `math-facts` before and after.
- **Done:** the hero line reads "Read a story → Play a game → Practise typing →
  Practise maths →"; checked in `site-events.spec.mjs`.

### R16. Watch the daily links from teachers — **reusable links and source counts added 27 Nov**
- **Evidence:** the class-links box makes daily links easy to share.
- **Work:** At the ~16 Dec read, compare Honduras daily completions with
  Honduras starts for Snack Typer and Fact Sprint, alongside the worldwide
  totals. A high daily share is evidence of demand for dailies. The
  teacher links use the same game URLs as the Daily page, so these counts
  cannot identify which entry point pupils used. If class use is supported
  by teacher feedback or source evidence, add a weekly "class pack" (five
  days of dailies) to `/for-teachers/`. If attribution matters to that
  decision, consider counting visits from a fixed, non-identifying
  classroom-link label.
- **27 Nov decision:** The early read yielded zero daily finishes across
  both games. Keep the two daily links and skip the weekly pack at this
  stage. The original teacher URLs opened daily mode only on the exact UTC
  date that a teacher copied them. Reusable classroom links now open the
  current UTC daily each day. They count plays and current daily finishes
  with a fixed classroom label and the same privacy controls as the
  existing counts. The label measures traffic from a shared link.
- **Bugs fixed while wiring the links:** Typing straight into the focused
  Snack Typer field by keyboard or IME could miss a game start. The event script
  now counts the first input from that field. Both classroom games now pass
  an explicit non-daily value after switching to a practice lesson from a
  daily link, so practice never registers as a daily finish. Opening the Thirteen guide by keyboard is excluded from game starts.

### R17. Say "no ads" where schools search for it
- **Evidence:** R7's 2048 queries: "2048 no ads", "2048 without ads"
  (position 1.2), "2048 ad free", "2048 google classroom". Teachers look for
  ad-free versions of classic games to put on class pages.
- **Checked 26 Nov:** 2048, Connect 4, Snacky Worm, Word Search, Snack Typer,
  Fact Sprint, Pinball and Hearts all already say "no ads" in their meta
  descriptions. Nothing to build; measure only. The one open lever is the
  carried-over option of a visible "No ads · no sign-in" line in every game's
  title strip (changes every game screenshot, so do it with a baseline round).
- **Measure:** Search Console queries containing "no ads", "ad free",
  "unblocked" or "classroom" across `/play/` at 28 days.
- **Baseline (27 Oct–23 Nov):** `2048 no ads` 24 impressions / 2 clicks at
  4.5; `2048 without ads` 5 at 1.2; `rummy 500 no ads` 10 / 0 at 5.0;
  `rummy 500 unblocked` 1 at 9; `mines unblocked` 1 at 6; `word search
  unblocked` 6 at 39.8; `2048 google classroom` 1 at 16; `2048 ezclasswork` 2
  at 8.5; a few `klondike … no ads` at 5–33. Rummy 500 was not in the 26 Nov
  check but already has "No Ads" in its title and description, so nothing to
  change; the zero clicks on 10 impressions are noise. No query yet for
  typing or math-facts practice (both pages are a day old).

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
| Once 4 Dec is finalized | Full 28-day follow-up for the two titles and the five tracked queries (R7) | Search Console |
| ~10 Dec | Follow up on book finishes, game time, hub positions and the featured row (R6/R1) | `scripts/read-site-events.mjs` |
| ~11 Dec | Sokoban + Chess Puzzles day 28 (separate plan) | Search Console |
| ~16 Dec | 14-school-day classroom practice follow-up, including the new teacher-link counts (R3/R16) | GoatCounter |
| ~24 Dec | Snack Typer at 28 days in search | Search Console |
| Late Dec, after 28 days of data | Review Thirteen’s reminder, badge and QR campaigns over matching dates. Compare the rules guide with its pre-change baseline. | Cloudflare, Play Console, Search Console |

---

## 6. Carried over from the archived arcade plans

- **Saved progress is deliberately skipped** for reflex games (flappy-snacky,
  snacky-worm, table-tennis, keepy-uppy, dribble-rush, asteroid-destroyer) and
  short soccer sessions. Revisit only if one gets a longer mode.
- **No match record:** only penalty-shootout (checkers and reversi already have one, see R11).
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
- **`build-breadcrumbs` and `build-webp` were brought current on 26 Nov (R13).**
  If they now change files you did not touch, another session added pages
  without running them: commit that drift separately, not inside your change.
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
