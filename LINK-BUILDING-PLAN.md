# Link building & distribution plan

Written 2026-08-13. Companion to `SITE-IMPROVEMENT-PLAN.md`.

## Why this doc exists

Bing reports **0 inbound links** (`GetLinkCounts`, `GetConnectedPages` and
`GetUrlLinks` all return empty). The site has ~130 indexed pages, clean
technical SEO, good titles, and zero crawl errors. Pages exist and are
well-optimised for solitaire (234k/mo), spider solitaire (123k/mo) and sudoku
(94k/mo) — and get **~0 impressions**, because nothing points at the domain.

Adding more pages does not fix this. Only off-site links and real referral
traffic do.

### What was already tried and is now exhausted

- **Links from our own sites.** isclaudeup.com, iscodexup.com and
  rarepuppers.github.io already linked to snackpackuniverse.com and /play/
  before this plan. Bing still reports zero. Self-owned links do not build
  authority — do not spend more effort here expecting SEO gain.
- **The privacy-page CTA** (2026-08-06, all 18 pages). A week over ~1,070 views
  moved nothing measurable. That traffic is Play reviewers and bots, not people.

So the remaining honest levers are (a) **referral traffic** from placements
where real humans already are, and (b) **genuine third-party links**.

---

## Done in code (2026-08-13)

Referral, not SEO. These are measurable in Cloudflare by `refererHost`.

- **isclaudeup.com / iscodexup.com — outage-only "waiting room" card.**
  New `.waiting-room` section, gated by the existing
  `body[data-state="down"|"degraded"]` mechanism, linking Solitaire, Sudoku,
  Minesweeper and the arcade hub. Rationale: the footer link was never going to
  work — nobody scrolls a status page. During an outage the reader is blocked,
  has nothing to do, and will sit on the tab. That is the only moment the offer
  is genuinely useful. Kept visually quieter than the backup-tools list so it
  doesn't undercut that slot's credibility.
- **rarepuppers.github.io — contextual Daily Pawtrait link.** The PawsitiveDose
  card already sells "Daily Pawtrait"; it now links to
  `/daily-pawtrait/` so a reader can see today's for real before installing.

**Measurement:** these three are separate Cloudflare properties, so success
shows up as `isclaudeup.com` / `iscodexup.com` / `rarepuppers.github.io`
appearing under `refererHost` for snackpackuniverse.com. Baseline today: they
do not appear at all. Re-check in 30 days. Note isclaudeup only pays out during
an actual outage, so the signal is bursty — judge it over a quarter, not a week.

---

## Needs your action (I can draft, I can't post)

Posting promotional content to third-party sites is an outward-facing action on
your behalf, so each of these needs your explicit go-ahead. Doing them at volume
also gets accounts banned and can trigger a search penalty — so this list is
deliberately short and picks venues where the submission is *welcome*.

### 1. Venues you already own — start here, zero risk
- **r/rarepuppers** and your Reddit profile (`u/rarepuppersco`) — you moderate
  it, so posting is legitimate. Best fit: `/daily-pawtrait/`, not the arcade.
- **x.com/rarepuppers**.
- These are nofollow and won't move authority, but they send *real humans*,
  which is the thing you actually lack.

### 2. In-app → web (the biggest untapped audience you have)
Your installed base is the one audience that already exists and is not
reviewer traffic. A "more free games on the web" link inside Brain Games
Vol 1/2/3 would drive genuine users to `/play/`.

> **Constraint — read before implementing.** These are Families-policy apps.
> External links out of a mixed-audience app must sit behind the existing
> parental gate, or you risk another Play rejection (see the app2
> families-policy history). Do not ship this as a plain button.

### 3. Free-web-game directories
Submissions are expected and welcome at these. Verify each URL before
submitting — directory submission paths change often.
- itch.io — you can host playable HTML5 builds; a real, high-quality property.
- Reddit r/WebGames — read the rules first; self-promo is allowed but rate-limited.
- Reddit r/incremental_games / r/solitaire — only where genuinely on-topic.
- Hacker News "Show HN" — one shot, best spent on the *solver-verified winnable
  deals* angle, which is a genuine technical differentiator most solitaire sites
  cannot claim.

### 4. Homeschool / teacher resource lists — best fit for `/read/`
The reading shelf (`/read/`, 8 full illustrated books with printable A4 PDFs,
free, no sign-in, no ads) is the most linkable thing on the site. Six books are
staged phonics/decodable readers and two are companion early-reading stories.
Free printable readers are
genuinely scarce and teachers link them unprompted. Target: homeschool
blogs, teacher resource roundups, and dyslexia/phonics parent communities.
This is the single highest-probability source of a real, relevant,
do-follow link.

---

## Ready-to-post drafts

Copy-paste. Each is written for the venue's own norms — the fastest way to get
these wrong is to post the same promotional blurb everywhere.

### Show HN (one shot — spend it on the technical angle, not the games)

> **Title:** Show HN: Free browser Solitaire and FreeCell where every deal is solver-verified winnable
>
> **Body:** I build small offline games and got annoyed that most browser
> solitaire serves you unwinnable shuffles with no way to know. So I pre-solve
> the deals: the FreeCell page only serves boards a solver has already beaten
> (at the standard four free cells), and the daily deal indexes that pool by
> date, so everyone gets the same board *and* it's known to have a solution.
>
> No ads, no sign-in, no download, nothing stored server-side. Vanilla JS, one
> self-contained HTML file per game, no build step.
>
> https://www.snackpackuniverse.com/play/freecell/

Why this angle: "another free games site" is not a story; "the deals are
solver-checked" is a real engineering claim almost no competitor can make —
see `scripts/verify-freecell-deals.js` and `scripts/klondike-solver.js`.

> **Accuracy note before posting.** The web FreeCell `CHECKED` pool is **73**
> deals, not the ~1550 the *Android* app ships — do not quote the app's number
> for the web page. Only the four-free-cell mode is solver-guaranteed (the pool
> was solved at four cells); the page already says so. HN will check, and one
> inflated number costs more credibility than the post can earn.
>
> Verified 2026-08-13 from the website repo root:
> `node scripts/verify-freecell-deals.js` → 73 in pool, 73 solved, 0 unsolvable,
> 0 inconclusive. So the *claim* is sound; only the count is small.
>
> Note `verify-freecell-deals.js` **only checks the existing pool — it does not
> generate new deals.** Its `CHECKED` list is seeds 1–100 with the failures
> removed. Growing the pool means scanning a wider seed range and writing the
> survivors into both the script and `play/freecell/index.html`.

### r/WebGames

Read the subreddit rules first; most cap self-promo frequency. Post **one**
game, not the hub.

> **Title:** [HTML5] FreeCell with solver-checked deals — no dead shuffles, no ads or sign-up
>
> **Body:** Browser FreeCell, free, no ads and no account. The thing I actually
> cared about: the deals are pre-checked by a solver, so you don't get a dead
> shuffle. There's a shared daily deal too — same board for everyone, drawn
> from that same checked pool. Unlimited undo, hints, auto-finish.
> Feedback welcome, especially on the supermove rules.

### itch.io — short description

> Free browser card and puzzle games — Solitaire, Spider Solitaire, FreeCell,
> Sudoku, Mahjong and 27 more. No ads, no sign-in, no download. FreeCell and
> Solitaire deals are solver-checked so you don't hit dead shuffles, and a
> shared daily deal gives everyone the same board. Plays on phone or desktop.

### Homeschool / teacher outreach (highest-probability real link)

Personalise the first line per recipient or it reads as a mailshot and gets
deleted. Pitch `/read/`, never the arcade.

> **Subject:** Free decodable readers (no ads, no sign-up) — for your phonics list
>
> Hi [name],
>
> I saw your [specific post/roundup] on [specific topic] — [one honest sentence
> about it].
>
> I make free early readers and thought they might suit that list. There are
> eight full illustrated books, including six staged phonics readers, available
> in the browser and as A4 PDFs:
> https://www.snackpackuniverse.com/guides/free-printable-decodable-readers/
>
> No ads, no sign-up, no email capture, nothing tracked — it's a free page, not
> a funnel. There's a paid app in the background, but the books stand alone and
> I'm not asking you to mention it.
>
> Feel free to print them for home or classroom use. If a particular phonics
> stage would make the set more useful, I would genuinely value the feedback.
>
> [name]

The credibility of that last one rests on `/read/` genuinely having no sign-up
wall. Do not add one.

---

## What NOT to do

- Paid link packages, PBNs, mass directory blasts, comment/forum link drops.
  These violate search guidelines and risk a penalty on a domain that currently
  has no authority to spare.
- More content pages hoping to rank. The constraint is links, not pages.
- Reading `/play/thirteen/`'s ranking as success: 640 impressions, **0 clicks**,
  at avg position 3.6–7.0. The query is a competitor's exact page title, i.e.
  navigational intent for another brand. Unwinnable at any position.
