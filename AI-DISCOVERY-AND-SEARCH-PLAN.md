# AI assistant discovery & search — plan

Written 2026-09-19, from a full re-measure of Cloudflare Web Analytics, Google
Search Console and the Bing Webmaster API. Companion to `LINK-BUILDING-PLAN.md`
(why links are the bottleneck), `READ-EXPANSION-PLAN.md` (the `/read/` build)
and `SITE-IMPROVEMENT-PLAN.md` (the running log).

## Why this doc exists

`chatgpt.com` referred ~60 pageviews in 30 days, against `www.google.com`'s 40 —
having been **zero** the month before. An LLM became a discovery channel the
size of organic search on this property, and nothing in the repo measured it.

That matters disproportionately here. `LINK-BUILDING-PLAN.md` establishes that
every other channel is gated on inbound links, that Bing still reports **0**, and
that self-owned links are exhausted. Assistants weight *"does this page answer
the question"* far above domain authority. **It is the one discovery route a
zero-backlink site can win.**

Volume is ~2 visits/day. This is a signal, not yet a strategy. Plan accordingly:
cheap bets, measured, with a kill date.

---

## Already done 2026-09-19 — do not repeat

| Action | Result |
|---|---|
| Bing `SubmitUrlBatch`, 4 sites | **156 URLs**: main 85, atlas 52, iscodexup 9, isclaudeup 10. Every one confirmed by quota delta, not by response body |
| IndexNow + SubmitUrlBatch for `/play/freecell/`, `/play/thirteen/` | Accepted (HTTP 200, key pre-validated) |
| GSC `sitemaps.submit` for rarepuppers | HTTP 204, `lastSubmitted` now 2026-09-19 |
| GSC **Request Indexing** on freecell + thirteen | Submitted by Mark, dashboard-only |
| `scripts/report-referrals.mjs` + `npm run report:referrals` | New; documented in `scripts/README.md` |

**Bing's `SubmitUrlBatch` returns `{"d":null}` on success — a null body proves
nothing.** Always verify with the `GetUrlSubmissionQuota` delta before and after.

---

## Accepted recommendations

### R1 — Keep feeding Bing (partly done, needs repeating)

ChatGPT's search is substantially Bing-backed, so Bing indexation plausibly
feeds assistant citation. *This is a mechanism, not something verified against
our own referral logs — treat it as the reason the action is cheap, not proof.*

- **39 main-site URLs were deliberately left unsubmitted**: all of `/privacy/`
  (25) and `/apps/` (14). Both are already indexed and earn ~0. They were not
  truncated by accident — do not "fix" this by submitting them.
- Quota is **100/day, 1200/month per site** and was otherwise idle.
- **Action:** re-run after any deploy that adds or materially changes pages.
  Worth folding into `notify-search-engines.mjs` so one command covers Google
  sitemap + IndexNow + Bing batch.

### R2 — Build 2–3 more guides in the decodable-readers mould

`/guides/free-printable-decodable-readers/` is the **only page on the property
with two independent channels working**: top ChatGPT referral (20) *and*
joint-top GSC clicker (2 clicks / 14 impr @ pos 16.2).

The shape to copy: one specific named free resource · parent intent · the
explicit *"no ads, no sign-in, no download"* line near the top where it is
machine-extractable · answers one question completely.

**This does not contradict "stop building guide pages."** That verdict was about
*status-site* guides trying to out-rank established competitors on
authority-gated status queries — they earned **0 clicks on 44 impressions** and
are confirmed indexed, so it was a real verdict. Utility guides serving a
specific long-tail need are a different bet with a working example behind them.

**Kill date: late October 2026.** If the new guides earn nothing in *both*
`report-referrals` and GSC by then, stop. Do not extend the deadline twice, as
happened with the 08-20 batch.

### R3 — Referral tracking (done)

`npm run report:referrals`, plus `--host=chatgpt.com` for the page breakdown.
Encodes the two traps in its output: counts bucket to the nearest 10 (so ±10 is
printed as `flat within bucketing`), and `mokka.corp.google.com` is labelled a
bot, not an audience.

### R4 — Skip `llms.txt`

Cheap, but adoption and effect are unproven. Declining it deliberately so nobody
re-proposes it as an easy win. Revisit only if a major assistant documents it as
a ranking or retrieval input.

---

## Further recommendations, ranked by expected value

### F1 — `noindex` the `/apps/` pages to free crawl budget *(strong evidence)*

Over 90 days the `/apps/` pages earned **0 clicks / 37 impressions between them**
(measured 2026-08-23), one had *zero* impressions, and today they took **zero**
ChatGPT referrals. They are **14 of 124 sitemap URLs** (15 exist on disk; one is
already unlisted) competing for a crawl budget that is a measured, not
theoretical, constraint here.

The precedent is strong: the World Cup sunset cut the sitemap 172 → 107, and
**six arcade pages that had never been crawled were crawled within days** and
are now indexed. Subtraction worked once on exactly this problem.

Reversible, and cheap to test. Do this before writing any new page.

### F2 — Exploit Bing on isclaudeup *(needs one check first)*

Bing ranks isclaudeup at **position 8–9** for `is claude down` (876 impr) and
`claude status` (566 impr) — queries Google buries it at 22–44 for. ~1,400
page-1 Bing impressions earning 9 clicks. It is also the only **declining**
property (22 → 13 clicks).

**Check before acting.** On the main site, `/play/thirteen/` turned out to render
at Bing positions 6–8 as a **title-less bare-domain row** in the collapsed
cluster — no title, no snippet, so no copy change could ever have helped.
Verify how isclaudeup actually renders on those Bing SERPs *first*. If it gets a
real title and snippet, copy work is worth it; if it is collapsed, the answer is
authority and nothing on-page will move it.

### F3 — Decide what to do about `isclaudedown.com` in Bing

Bing indexes it **separately** (299 impr @ pos 9 for `is claude down`, 0 clicks)
despite a verified single-hop 301 to isclaudeup. Google shows no such split, so
the two are splitting one Bing SERP. Harmless today at 0 clicks, but it means
**isclaudeup's Bing totals are not the whole picture** — don't read them as
complete. Options: leave it, or ask Bing Webmaster to treat it as a site move.

### F4 — Snapshot referral history to a file *(polish)*

Cloudflare Web Analytics retention is limited, so `report-referrals.mjs` can
only ever compare two adjacent windows. To answer *"did assistant traffic grow
across the autumn?"* the numbers must be persisted. Append a dated JSON/CSV row
per run and have the script read it for a long trend. Small, and it is the
thing that will actually decide R2's kill-date question.

### F5 — Spend GSC "Request Indexing" deliberately

~10/day, dashboard-only, no API. Currently spent ad hoc. Keep a short ranked
queue — arcade and guide pages with real demand, never `/apps/` pages. Revisit
monthly.

### F6 — Move the working Cloudflare token somewhere honest *(hygiene)*

The documented location (`api-tokens/web-analytics.txt`) holds **two dead
tokens**; the working one is in `backup-keys/_root/.env.local`. That cost a
round trip today and had both memory files recording "Cloudflare is unreadable."
Either move it or document it at the documented location. Note it does **not**
grant `/rum/site_info/list` (`Authentication error`), so which sites carry a
Cloudflare beacon is currently unknown and unverified.

---

## Open items with dates attached

| Item | Check on | What a failure means |
|---|---|---|
| `/play/freecell/` still `Discovered — not indexed`, crawled **never** | ~2026-10-10 | If still uncrawled after a priority request, the verdict is authority, not crawl budget |
| `/play/thirteen/` last crawled 2026-07-25 (56 days) | ~2026-10-10 | Judge the Aug-15 title rewrite on **impressions recovering, not position** — position already improved 8.9 → 4.8 while impressions fell 899 → 64 |
| rarepuppers sitemap `pending` since 2026-06-12 (99 days) | ~2026-10-10 | Resubmitted today; if still never downloaded, suspect property verification, not the sitemap |
| R2 guides | late Oct 2026 | Stop building guides. No third extension |
| Next full re-measure | on/after 2026-10-17 | Beat: iscodexup 115 clicks @ 8.6 · main 27 clicks / 98 pages · isclaudeup 13 and falling |

## Things deliberately NOT being done

- **No copy rewrite on `/play/thirteen/` for Bing.** Bing renders it title-less
  and snippet-less at its current rank; there is no string to fix.
- **No further title work on iscodexup for `is codex down`.** That query earns
  0.39% at pos 8.8 while `codex down` earns 2.14% at 7.6 — same page, same site.
  The title already reads "Is Codex Down Right Now?", so phrasing is not the
  cause; `is X down` SERPs carry Downdetector-style rich results that eat the
  click.
- **No blocking of AI crawlers.** All four sites are `User-agent: * / Allow: /`
  (only `/go/` disallowed). GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot and
  Google-Extended are all permitted. Blocking them would close the one channel
  this document is about.
- **No new domains.** Settled in `LINK-BUILDING-PLAN.md`; iscodexup ranks 8.4 for
  `codex down` from a domain named "…up".
