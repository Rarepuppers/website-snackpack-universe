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
The decodable books (`/read/`, 3 full illustrated books, free, no sign-in, no
ads) are the most linkable thing on the site. Free decodable readers are
genuinely scarce and teachers link them unprompted. Target: homeschool
blogs, teacher resource roundups, and dyslexia/phonics parent communities.
This is the single highest-probability source of a real, relevant,
do-follow link.

---

## What NOT to do

- Paid link packages, PBNs, mass directory blasts, comment/forum link drops.
  These violate search guidelines and risk a penalty on a domain that currently
  has no authority to spare.
- More content pages hoping to rank. The constraint is links, not pages.
- Reading `/play/thirteen/`'s ranking as success: 640 impressions, **0 clicks**,
  at avg position 3.6–7.0. The query is a competitor's exact page title, i.e.
  navigational intent for another brand. Unwinnable at any position.
