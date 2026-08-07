# Site improvement plan — whole property, 2026-08-07

Scope note: this covers **the site as a whole**. The 32-game arcade has its own
document, [`play/ARCADE-IMPROVEMENT-PLAN.md`](play/ARCADE-IMPROVEMENT-PLAN.md),
whose Section B (code) is closed and whose remaining items are Codex art
(briefed in [`play/CODEX-ASSETS-REQUESTED.md`](play/CODEX-ASSETS-REQUESTED.md))
or distribution. This plan is deliberately *not* more arcade polish — the three
items at the top were found by auditing the property outside `/play/`, and each
outranks another guide.

Every claim below was checked against the repo, not inferred. Where something
is a risk rather than a confirmed breakage, it says so.

---

## P1. The published site is 2.0 GB against GitHub Pages' documented 1 GB limit

**Status: on hold — `last-bastion` is active WIP, leave its art alone per
direction 2026-08-07.** Re-open when that project is far enough along that
`art/production-tests/` stops changing daily.

**Confirmed, and the fix is unambiguous.**

| Measure | Size |
|---|---|
| Published site (repo minus `.git`) | **2.0 GB** |
| `play/last-bastion/art/` | **1.3 GB** (1,693 tracked files) |
| Everything else | **705 MB** |
| `.git` history | 1.6 GB |

GitHub Pages documents a **1 GB limit on the published site**. We are at double
that. The site is currently serving, so this is not a live outage — but it is an
undocumented dependency on a limit not being enforced, and it makes every clone
and every deploy carry 1.3 GB nobody ever requests.

**`play/last-bastion/art/` is not served at runtime.** Verified rather than
assumed:

- `play/last-bastion/index.html` loads exactly three files, all from
  `game-assets/`: `game.js`, `phaser.js`, `index.css`.
- The built `game-assets/game.js` contains **zero** references to `art/`
  (`grep -c` returns 0).
- The only things referencing `art/production-tests` are **`dev/src/**` asset
  manifests** — Vite source, not the deployed bundle.

So this is Codex's art production/source material — genuinely worth keeping,
just not worth shipping to every visitor's CDN edge and every `git clone`.

### The fix, in two clearly separate steps

**Step 1 — stop the bleeding (safe, reversible, do this first).**
Move `play/last-bastion/art/` out of the repo to a sibling location, add it to
`.gitignore`, commit the removal. Published site drops **2.0 GB → 705 MB**,
comfortably under the limit. Working tree shrinks immediately. This does not
touch history, so nothing is destroyed and it can be undone by moving the folder
back.

**Step 2 — reclaim history (destructive, needs explicit sign-off, do NOT bundle
with step 1).** After step 1, `.git` still holds all 1.3 GB in history, so clones
stay slow. Reclaiming it means `git filter-repo` plus a **force push that
rewrites shared history**. That is a genuinely destructive operation on a repo
that auto-deploys, and it should be its own decision with its own backup — not a
side effect of a cleanup commit.

My recommendation: do step 1 now, treat step 2 as optional and only if slow
clones actually bother you. Step 1 captures nearly all the benefit at none of
the risk.

---

## P2. `llms.txt` carries the exact false claim the June 2026 IAP audit was run to remove

**Status: done 2026-08-07** (commit `78c0260`). Rewritten against the actual
live catalogue: 12 live apps correctly listed with accurate billing language,
the false "no in-app purchases" claim on ABC/123 removed, Brain Games Vol 2/3
moved out of "Coming soon" (both shipped in July), arcade count corrected from
~12 to the real 31, World Cup section softened out of present tense. All
internal links verified resolving.

**Confirmed, and this is a correctness/compliance issue, not cosmetics.**

On 2026-06-24 the site was audited for false "no in-app purchases" copy and
fixed across app pages, privacy pages and the apps index, because ABC and 123
sell a real one-time unlock. **`llms.txt` was missed.** It still contains two
instances of:

> `No ads, no in-app purchases.`

— attached to **SnackPack ABC** and **SnackPack 123**, both of which have live
billing. This is the same false statement, on the same property, that the audit
existed to eliminate. It matters more than a normal stale-copy bug because
`llms.txt` is specifically the file AI assistants read to describe the products,
so the false claim gets repeated downstream with our name on it.

It is also badly out of date on scale:

- Says **"Four apps are live on Google Play; 14+ are planned."** The real figure
  is 13+ live.
- Lists **5** live apps. Missing: Sentences & Spelling, Basic Math, Prehistoric
  Pals, Zoo World, Brain Games Vol 2, Brain Games Vol 3, Badgify.
- Files **Brain Games Vol 2 under "Coming soon"** — it shipped 2026-07-03.
  Vol 3 shipped the same day and is absent entirely.
- The arcade section lists ~12 games; there are **32**.

**Fix:** rewrite `llms.txt` against the actual live catalogue, and correct the
billing language to match what the app pages already say ("free to download, no
ads; optional one-time purchase unlocks the full library"). This is
mechanical, low-risk, and should be done before any more SEO work — there is no
point earning links to a file that misdescribes the products.

---

## P3. The World Cup section is written in present tense for a tournament that ended

**Status: done 2026-08-07** (commit `b58003b`). Direction given: repoint the
nav slot to `/play/`. Removed the dedicated World Cup nav pill from all 150
pages that carried it (`/play/` already has its own nav entry, so nothing
needed adding); rewrote the hub, schedule and knockout hero copy, titles and
meta descriptions from present to past tense, without asserting any specific
score or champion I can't verify — the pages' own live ESPN-fed data already
correctly showed every match as final, this just brought the static copy in
line with it. Group/team pages and Flag Frenzy (an evergreen daily game, not
tournament-dependent) were left alone.

**Confirmed.** The 2026 World Cup finished in July. Today is 2026-08-07. Current
live copy:

- `/world-cup/schedule/` — *"games today, recent results, and who plays next"*
- `/world-cup/knockout/` — *"remaining teams and the full bracket path"*
- `/world-cup/` — *"The World Cup 2026 hub for fans who like to play."*

There are no games today and no remaining teams. Worse, **`/world-cup/` holds a
permanent, visually-highlighted nav slot on ~145 pages** — every app page, every
privacy page, every game. The single most prominent recurring link on the
property points at a finished event described as ongoing.

Three options, in my order of preference:

1. **Retire to an archive, reclaim the nav slot (recommended).** Rewrite the hub
   as a past-tense record of the tournament (final result, top scorer, full
   bracket as it finished) — it keeps whatever link equity it earned and stops
   being wrong. Then **repoint the nav slot to `/play/`**, which has 32 evergreen
   games and is the thing we actually want traffic on. The soccer games stay
   live and playable; they just stop being framed as tournament companions.
2. **Keep it seasonal.** Leave it up, past-tense, and plan to reuse the
   infrastructure for the next tournament. Same copy fix, nav slot unchanged.
3. **Leave as-is.** Not defensible — the pages state things that are untrue.

Either 1 or 2 needs the same copy pass; the only real decision is the nav slot.
**This is the one item here I'd want your call on before acting**, because
retiring the World Cup nav link is a judgement about the brand, not a bug fix.

---

## P4. Continue the guides wedge (the actual distribution bottleneck)

Unchanged in priority from the arcade plan's Section C. **Four guides live now**:
`solitaire-without-ads-or-signup`, `sudoku-without-ads-or-mistakes`,
`checkers-without-ads-or-signup`, `freecell-without-ads-solver-verified` — the
last three all added 2026-08-07, on top of the three originals (toddler apps,
offline games, browser-games-offline). All cross-link each other; sitemap
resubmitted to Search Console after each addition.

The diagnosis stands: **4 inbound links is the bottleneck, not game quality.**
Head terms (solitaire 234k/mo, spider 123k) are unwinnable against
solitaired.com and Microsoft on our link profile. The winnable angle is the
modifier slot — *no ads, no sign-in, no download, solver-checked deals, works
offline* — all of which are genuinely true here and structurally hard for
ad-funded incumbents to claim.

Search Console access is now live (service account, Full permission on both
the domain and URL-prefix properties) — real numbers instead of the
2026-08-06 baseline memory: 3 clicks on 809 impressions over the last 28 days
sitewide, `/play/thirteen/` alone pulling 610 of those impressions on 1 click
(a title/snippet problem more than a ranking one — avg. position 8.9 there is
fine). New guides take a few days to accrue impressions; too early to read
signal from the four added this session.

Remaining targets in the same shape, roughly by volume:

| Guide | Term | Angle |
|---|---|---|
| Mahjong Solitaire without ads | 12k/mo | Layouts, and what "free" usually costs in this category |
| Minesweeper / classic games | low each | Grouped "the Windows games you miss, in a browser" piece |

Also still open from the arcade plan and unstarted: **directory submissions** to
free-browser-game aggregators. Unglamorous, and it is how the backlink count
first moves off 4. This needs signups on external sites, so it needs you present
— I shouldn't be creating accounts.

---

## P5. Smaller confirmed items

- **Zoo World / Garden World privacy pages said billing is not enabled — done
  2026-08-07** (commit `b58003b`). Confirmed billing is live in the published
  builds. Both privacy pages rewritten to match Prehistoric Pals' existing
  accurate language (RevenueCat disclosure, parental gate, no hedge) across
  five spots each: the data-handling bullet, the "In-app purchases" section,
  "how information is used", "your choices", and the data-deletion section.
  Effective dates bumped to reflect the material change. Zoo World's *app*
  page already had this right — only the privacy pages were stale.
- **Internal links are clean.** Audited all 154 HTML files — zero broken internal
  links. No action.
- **Technical SEO is fine.** 129 pages indexed, 0 crawl errors, daily crawl,
  sitemap and robots.txt correct. The problem has never been technical.
- **Google Search Console access is live** as of 2026-08-07 — a service
  account with Full permission on the domain property, confirmed working via
  the URL Inspection and Search Analytics APIs. Sitemap resubmitted after
  each content change this session. No more relying on the stale 2026-08-06
  baseline memory going forward.

---

## Status as of 2026-08-07

**P2, P3 and P5 are done. P1 is on hold** (last-bastion is active WIP, revisit
later — no art/history changes touched). **P4 is ongoing** — four guides live,
Mahjong is the next natural target, directory submissions are still unstarted
and need you present for the signups.

What's left, in order:

1. **Mahjong guide** (12k/mo) — same wedge, mechanical.
2. **Directory submissions** — the actual next lever on the 4-link bottleneck.
   Needs you present.
3. **Section A art** (arcade plan) — briefed and waiting on Codex/imagegen,
   nothing further for me to do until files land.
4. **P1, later** — once `last-bastion` stabilizes enough that its art stops
   changing daily.

Deliberately **not** on this list: more arcade code polish. Section B is closed,
and the analytics say polish has no audience until the link count moves.
