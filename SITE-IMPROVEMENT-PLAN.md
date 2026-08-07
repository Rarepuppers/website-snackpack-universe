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

Unchanged in priority from the arcade plan's Section C, and now three guides in:
`solitaire-without-ads-or-signup`, `sudoku-without-ads-or-mistakes` (2026-08-07),
`checkers-without-ads-or-signup` (2026-08-07), on top of the three originals.

The diagnosis stands: **4 inbound links is the bottleneck, not game quality.**
Head terms (solitaire 234k/mo, spider 123k) are unwinnable against
solitaired.com and Microsoft on our link profile. The winnable angle is the
modifier slot — *no ads, no sign-in, no download, solver-checked deals, works
offline* — all of which are genuinely true here and structurally hard for
ad-funded incumbents to claim.

Remaining targets in the same shape, roughly by volume:

| Guide | Term | Angle |
|---|---|---|
| FreeCell without ads | 21k/mo | Solver-verified deals — every board winnable. We can make this claim and most can't. |
| Mahjong Solitaire without ads | 12k/mo | Layouts, and what "free" usually costs in this category |
| Minesweeper / classic games | low each | Grouped "the Windows games you miss, in a browser" piece |

Also still open from the arcade plan and unstarted: **directory submissions** to
free-browser-game aggregators. Unglamorous, and it is how the backlink count
first moves off 4. This needs signups on external sites, so it needs you present
— I shouldn't be creating accounts.

---

## P5. Smaller confirmed items

- **Zoo World / Garden World privacy pages still say billing is not enabled.**
  Both apps now carry real (non-stub) RevenueCat keys in `eas.json`, and all 12
  RC projects had live offerings as of 2026-07-30. If billing is live in the
  *published* build, the policy is understating data collection — a real
  compliance gap. If the published build predates it, the copy is correct and
  should be left alone. **I can't determine which from the repo**; it depends on
  what's actually live on Play. Worth 5 minutes of your time to check, and I'll
  fix the copy either way.
- **Internal links are clean.** Audited all 152 HTML files — zero broken internal
  links. No action.
- **Technical SEO is fine.** 129 pages indexed, 0 crawl errors, daily crawl,
  sitemap and robots.txt correct. The problem has never been technical.
- **Resubmit the sitemap** after P2/P3 land, since a lot of markup will have
  changed.

---

## Suggested order

1. **P1 step 1** — move `last-bastion/art/` out. Biggest risk reduction, ~10
   minutes, no judgement calls.
2. **P2** — rewrite `llms.txt`. Removes a false billing claim; mechanical.
3. **P3** — World Cup copy pass. Needs your call on the nav slot first.
4. **P4** — FreeCell + Mahjong guides, then directory submissions with you.
5. **P5** — Zoo/Garden privacy, once you've confirmed what's live.

Deliberately **not** on this list: more arcade code polish. Section B is closed,
and the analytics say polish has no audience until the link count moves.
