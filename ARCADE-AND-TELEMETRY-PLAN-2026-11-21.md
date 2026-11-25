# Arcade + classroom traffic plan — 21 November 2026

Sources: Cloudflare Web Analytics (GraphQL, site tag `1c270abb…`), pulled 21 Nov
for the last 24 h, 7 days and 30 days; Google Search Console, 22 Oct – 19 Nov.
Cloudflare rounds older counts to the nearest 10, so treat small cells as noise.

## 1. What is actually driving traffic

### The screenshot (408 views / 176 visits, last 24 h) breaks down as

| Source | Views | Visits | What it is |
| --- | ---: | ---: | --- |
| Honduras (HN) | 188 | 35 | A classroom. Weekdays only, peaks 15:00–16:00 UTC (9–10 am local), desktop. Students open the homepage directly (bookmark or typed URL), then browse inside the site, mostly `/read/`. |
| United States | 125 | 120 | Mostly **one headless bot** (see below), not players. |
| Sri Lanka (LK) | 49 | 23 | New. Phones, homepage → `/read/pip-sits/`, `/read/sound-cards/`. Looks like a parent or teacher sharing links. |
| Everyone else | ~45 | ~0–25 | Scattered real visitors (AU, CA, PH, JM…). |

Honduras by day (30 d): 3 Nov 530, **4 Nov 760**, 5 Nov 310, 10 Nov 280,
17 Nov 480, 20 Nov 230; weekends ~10. It is the same school coming back.

### The games at the top of Cloudflare are a bot

| Page | 7-day views | Who |
| --- | ---: | --- |
| `/play/solitaire/` | 168 | 165 are **ChromeHeadless on Linux**, US, no referrer, one page per visit, every hour of the day |
| `/play/last-bastion/` | 83 | 70 ChromeHeadless/Linux (the other 13 are the Honduras class) |
| `/play/killer-sudoku/` | 12 (90 over 30 d) | the same pattern |

Nothing in our repos or workflows calls those URLs, so it is an outside
crawler or monitor. **Solitaire has 0 search clicks.** Strip these three out
before reading any Cloudflare game number.

### The games people really come for

**From search (GSC, 28 days):**

| Page | Clicks | Impressions | Position | Note |
| --- | ---: | ---: | ---: | --- |
| `/play/thirteen/` | **139** | 6,311 | 6.2 | The arcade's only real search page. CTR 2.2% (was 0.7% in Aug, 1.5% in Oct). Visitors are AU and US from Google. |
| `/play/2048/` | 9 | 180 | 8.2 | Second-best; close to page-one top half. |
| `/play/penalty-shootout/` | 3 | 59 | 8.0 | Good CTR for its size. |
| `/play/mahjong/` | 1 | 59 | 7.3 | On page one, snippet not earning clicks. |
| `/play/rummy-500/` | 1 | 34 | 6.9 | Young page (Oct). |
| `/guides/thirteen-tien-len-rules/` | 1 | 150 | 8.2 | Ranks, doesn't get clicked. |

**From the classroom (Honduras, 7 days):** Last Bastion 13, Connect 4 11,
2048 8, Snacky Worm 7, Flappy Snacky 7, Pinball 6, Word Search 5,
Brick Breaker 5, Chess 4, Cascade 4. Quick, no-reading, two-player or
reflex games. They reach them from `/play/` (94 hub views), not from search.

**Bottom line:** two audiences, two jobs.
1. **Searchers** want card and classic puzzle games, and Thirteen is the proven one.
2. **Classrooms** arrive by bookmark, read `/read/` books first, then play
   short games on school desktops.

## 2. What we can see about the students today, and what we can't

Cloudflare Web Analytics gives page loads only: path, country, referrer,
device, browser, hour. That is how the list above was built.

It cannot tell us:
- whether a game was **played** or just opened, how long, or whether they won;
- how far into a book they read, or whether they finished it;
- which hub tile or "related game" link they clicked;
- whether a daily puzzle was completed.

**Correction (same day):** the first draft of this plan said the site had no
event telemetry. That was read from a stale local checkout. On origin,
`play/game-events.js` (loaded by `funnel.js`) has sent anonymous GoatCounter
counts since 6 Nov: `/arcade/<slug>/start`, `win` and `friends`, disclosed at
`/privacy/arcade/`. `/read/` sent nothing.

## 3. Step 1 as built (21 Nov): extend the GoatCounter counts

One pipeline, not two. No new Worker or Analytics Engine.

| Where | New event | Meaning |
| --- | --- | --- |
| game page | `/arcade/<slug>/time-<band>` | once, when a played page is hidden: `under-1m`, `1-5m`, `5-15m`, `15m-plus` of time in view |
| game page | `/arcade/<slug>/daily` | today's daily puzzle finished (`daily-state.js`) |
| `/play/` | `/arcade/hub/<slug>` + `/arcade/hub-position/<p>` | tile opened, and whether it sat in the first 5, 6–12, further down, or "continue playing" |
| book page | `/books/<slug>/start`, `finish`, `listen`, `pdf` | reading began (a page stayed in view or was turned), reached the end, used Read to me, opened the PDF |

Rules: fixed names only, no IDs, scores, page numbers or storage; nothing sent
when the browser sends Global Privacy Control or Do Not Track, or is automated
(`navigator.webdriver`, HeadlessChrome), so the bot never enters this data.
GoatCounter gives country itself, so the Honduras class can be split out.
`/privacy/arcade/` now covers `/play/` and `/read/` and lists every event.
Tests: `tests/visual/site-events.spec.mjs` (8 cases, via `window.SP_EVENTS_DEBUG`).

**Cloudflare bot:** not gated in the pages (434 hand-embedded beacon tags).
Filter at query time instead: `userAgentBrowser != "ChromeHeadless"`.

**Still needed to read it:** a GoatCounter API token (read-only, "Read
statistics") at `~/billing/goatcounter-api-token.txt`; then a small reader
script. First useful read after ~14 school days (~10 Dec).

## 4. What to feature

**Hub (`hub.js` featured row).** Today: Thirteen, 2048, Minesweeper,
Snacky Worm, Solitaire. Change to:
1. **Thirteen** (keep first — the search page)
2. **2048**
3. **Connect 4** (top classroom game, two players on one screen)
4. **Snacky Worm**
5. **Pinball**

Solitaire and Minesweeper stay in the grid; their "popularity" was the bot.

**New "Play with a friend" row** for classrooms: Connect 4, Checkers, Chess,
Table Tennis, Thirteen friend rooms (the room Worker already exists and is
not surfaced). Two kids, one desktop is exactly the Honduras pattern.

**Homepage:** students land on `/` first. Add a two-line "Read a story ·
Play a game" strip at the top so the classroom path is one click, and make
the newest book and three classroom games visible above the fold.

## 5. What to add (games)

Ranked by evidence, each with the usual bar (scorecard, Node engine sim,
phone spec, daily where it makes sense, resume, tile + social art).

| # | Game | Why | Size |
| ---: | --- | --- | --- |
| 1 | **Typing game** (generic name, e.g. "Snack Typer") | The classroom audience is on school desktops; typing practice is a top school search and teachers bookmark it. Fits `/for-teachers/`. No reading level needed. Words can reuse the `/read/` decodable word lists, so it ties to the books. | M |
| 2 | **Math facts sprint** (add/subtract/times tables, timed and untimed) | Second classroom staple; funnels to Snackpack 4 Basic Math and App7 Mathematics with real Play links. Generator, not puzzle bank, so it is cheap to keep. | S–M |
| 3 | **More Thirteen-cluster card games** | Thirteen is the proven demand. Big Two is live; add Pusoy Dos as the Filipino name for it (alias page, same engine, separate rules copy) only if GSC shows the query. Ship Dominoes from Vol 1 as the next cheap card/tile port. | S each |
| 4 | **Spanish UI option for `/read/` and the classroom games** | The biggest real audience is a Honduran school. A Spanish toggle on buttons and instructions (books stay English, since it looks like English class) helps them and opens Spanish search. Confirm with telemetry first (`book_finish` rate for HN). | M |

Not recommended now: more reflex soccer games (6 already, near-zero traffic),
more solitaire variants (big demand, never ranked; the indexing limit from
August still applies).

## 6. What to improve on existing pages

1. **Thirteen (highest value).** At position 6.2, moving to ~3 roughly
   triples clicks. Put "Play with friends" (rooms) beside "Play vs computer"
   on first screen; add a short "How to play in 60 seconds" above the fold;
   cross-link Big Two and Rummy 500 under the game. Re-read GSC at +14/+28 days.
2. **Thirteen rules guide** (150 impressions, 1 click): rewrite title and
   description around "how to play 13 / Tiến Lên rules" phrasing.
3. **2048** (pos 8.2): title/description refresh; add 3×3, 5×5 and daily
   modes (cheap, gives the page new content to rank on).
4. **Mahjong** (59 impressions, pos 7.3, 1 click): snippet rewrite.
5. **Classroom safety pass on the funnel.** `funnel.js` shows a dwell-based
   tip/donation modal. Children in a class should not see "tip" prompts.
   Suppress the modal on `/read/` and on the classroom row games, or show it
   only after several sessions on the same device; keep Play-Store links
   behind the existing grown-up treatment.
6. **Sound off by default during school hours?** No — simpler: make sure every
   classroom game starts muted-safe and has a visible mute (check Pinball,
   Flappy Snacky, Snacky Worm).
7. **`/for-teachers/`**: add a "classroom links" block (copyable short URLs for
   the typing game, math sprint, today's book), and a one-field "Tell us about
   your class" form so the Honduras teacher can reach us.

## 7. Order and measurement

| Step | Work | Measure |
| --- | --- | --- |
| 0 | `git pull` the website repo first: local is behind origin (Sokoban and Big Two are live but missing from this checkout). | — |
| 1 | **Built 21 Nov:** GoatCounter events extended (time, daily, hub, books) + privacy copy | First read after ~14 school days (~10 Dec); needs the API token |
| 2 | Hub featured row + "Play with a friend" row + homepage strip | `hub_click` by position, HN game_start |
| 3 | Thirteen first-screen + guide + 2048/Mahjong snippets | GSC at +14 and +28 days; revert title if CTR drops |
| 4 | Funnel modal off for classroom paths | `tip_click` before/after (should not matter) |
| 5 | Typing game | HN/LK `game_start`, GSC impressions after 28 days |
| 6 | Math facts sprint | same + `play_store_click` to the math apps |
| 7 | Spanish toggle — only if step-1 data shows HN finishing books | `book_finish` HN before/after |

Measure Cloudflare by **visits**, split out HN and LK, and exclude
ChromeHeadless. Measure search with GSC only.
