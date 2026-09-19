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

### R1 - Keep feeding Bing (DONE, now automatic)

ChatGPT's search is substantially Bing-backed, so Bing indexation plausibly
feeds assistant citation. *This is a mechanism, not something verified against
our own referral logs -- the reason the action is cheap, not proof.*

**Folded into `scripts/notify-search-engines.mjs`**, which now covers all three
channels in one command: Google `sitemaps.submit`, IndexNow, and Bing
`SubmitUrlBatch`. Over quota it spends on arcade pages and guides first and
pushes `/privacy/` and `/apps/` to the back. A `--dry-run` flag shows what would
be sent without spending the quota.

- **39 main-site URLs were deliberately left unsubmitted** on 2026-09-19: all of
  `/privacy/` (25) and `/apps/` (14). Already indexed, earn ~0. Not an accident
  -- do not "fix" this by submitting them.
- **Action:** run after any deploy that adds or materially changes pages.

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

### F1 - RETRACTED. Do not noindex the `/apps/` pages *(premise was wrong)*

The proposal assumed those pages were uncrawled dead weight eating crawl budget.
**Checked with the URL Inspection API on 2026-09-19: 14 of 15 are `Submitted and
indexed`, crawled recently** (2026-08-23 through 2026-09-13). They are healthy,
actively-crawled pages. Noindexing 14 indexed product pages to chase a
speculative budget gain is a bad trade, and the World Cup precedent does not
transfer -- those were 66 *dead* fixture pages, these are live product pages.

The check was worth running anyway, because it turned up something real:

**Two app pages carry `noindex,follow`, and that is CORRECT** --
`/apps/snackpack-8-earth-science/` (`Excluded by 'noindex' tag`) and
`/apps/snackpack-9-space-math/` (`URL is unknown to Google`, never crawled).
Both apps are genuinely not publicly available, so the tag is right. **Do not
"fix" it.** See the finding below for why that matters more than it sounds.


### F2 - Bing on isclaudeup *(BLOCKED: could not verify from here)*

Bing ranks isclaudeup at **position 8-9** for `is claude down` (876 impr) and
`claude status` (566 impr), queries Google buries it at 22-44 for. ~1,400
page-1 Bing impressions earning 9 clicks. It is also the only **declining**
property (22 -> 13 clicks).

**The gating check did not pass -- it could not be run.** The plan was to look at
how isclaudeup renders on those Bing SERPs, because `/play/thirteen/` turned out
to render at Bing positions 6-8 as a **title-less bare-domain row** with no
snippet, making copy work pointless. Searching `is claude down` from here returns
**no isclaudeup result on page 1 or 2** -- the served SERP is region-specific and
does not match the market generating those impressions. So the rendering question
is **unresolved, not answered**.

What the attempt did show: that SERP is owned by `status.claude.com` (official),
Downdetector, `claudestatus.com`, StatusGator, IsDown and pulsetic -- purpose-built
status aggregators. Far more crowded than Codex's. This corroborates the existing
conclusion that `claude down` is not winnable and is not a site-quality problem.

**Do not commission copy work for this until someone can see the real SERP.**


### F3 — Decide what to do about `isclaudedown.com` in Bing

Bing indexes it **separately** (299 impr @ pos 9 for `is claude down`, 0 clicks)
despite a verified single-hop 301 to isclaudeup. Google shows no such split, so
the two are splitting one Bing SERP. Harmless today at 0 clicks, but it means
**isclaudeup's Bing totals are not the whole picture** — don't read them as
complete. Options: leave it, or ask Bing Webmaster to treat it as a site move.

### F4 - Snapshot referral history (DONE)

`report-referrals.mjs` now appends a dated row to `data/referral-history.json`
on every default run, replacing any row for the same date and window rather than
stacking duplicates. `--history` prints the trend; `--no-write` reports without
recording. The file is committed on purpose -- Cloudflare's retention is short,
so this history is the only thing that can answer R2's kill-date question.


### F5 - Spend GSC "Request Indexing" deliberately

~10/day, dashboard-only, no API. As of 2026-09-19 the queue is **short**, because
the August crawl-budget fix worked and most pages are now indexed:

| Priority | Page | Why |
|---|---|---|
| 1 | `/play/freecell/` | The only arcade page still `Discovered - not indexed`, crawled NEVER. ~21k/mo demand. Requested 2026-09-19 |
| 2 | `/play/thirteen/` | Crawled 2026-07-25; forces the Aug-15 title rewrite to finally be seen. Requested 2026-09-19 |
| 3 | any new R2 guide | On publish, so the assistant-citation bet is not waiting on a crawl |

**Never spend it on `/apps/` pages** -- they are already indexed and earn 0.
Re-derive this queue at each re-measure rather than assuming it is still valid.


---

## Findings turned up while executing this plan

Neither was what the task was looking for. Both matter more than the task.

### Earth Science and Space Math have completed production releases and no public listing

Verified 2026-09-19 three ways:

- **Play Developer API:** `com.snackpackuniverse.earthscience` shows
  `track=production status=completed vc=5`; `com.snackpackuniverse.spacemath`
  shows `track=production status=completed vc=6`.
- **Public store listing: HTTP 404** for both, with a browser user-agent, in
  both `gl=US` and `gl=GB`.
- **Controls:** `prehistoricpals` (production, vc22) and `gardenworld` both
  return **200** by the identical method, so the method is sound and the 404 is
  real, not a fetch artefact.

So both apps have a completed production rollout that **nobody can reach or
install**. A completed release is not the same as a published listing -- an app
can sit unpublished, pending review, or with no country availability. Neither
carries a `DRAFT-STATUS.md`, so nothing in the repo records this as intended.

**This needs a human in Play Console.** It is not a website problem and there is
no API fix. Flagged here because the website `noindex` on those two pages is the
*correct* response to it, and anyone "tidying up" those tags would be publishing
pages for apps that cannot be downloaded.

### `site-check.yml` has been red on every push since at least 2026-09-17

Eight consecutive failures on `main`, all predating today's work: **27 failed /
106 passed**, an identical count before and after. The failures are
visual-regression snapshots across arcade pause/resume and the hub, solitaire and
water-sort surfaces.

The consequence is what matters: **CI currently provides no signal.** A genuine
regression pushed today would land in a run that was already red and be
indistinguishable from the existing 27. `SITE-IMPROVEMENT-PLAN.md` already notes
the game-ui bootstrap work needs to land *with* refreshed baselines; until that
happens, nobody can trust a green or a red here.


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
