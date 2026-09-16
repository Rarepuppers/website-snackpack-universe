# Site improvement plan — whole property, 2026-08-07

Scope note: this covers **the site as a whole**. The arcade's completed August
plan and implementation record are archived at
[`play/docs/archive/2026-08/ARCADE-IMPROVEMENT-PLAN.md`](play/docs/archive/2026-08/ARCADE-IMPROVEMENT-PLAN.md).
The reusable admission gate for future games remains
[`play/NEW-GAME-SCORECARD.md`](play/NEW-GAME-SCORECARD.md). This plan is
deliberately *not* more arcade polish — the three items at the top were found by
auditing the property outside `/play/`, and each outranks another guide.

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

**2026-08-14 payload note:** synchronizing nine canonical Pro game-UI packs
added another 26.60 MB to the website tree, almost entirely from premium card
faces that no live page currently consumes. This is small beside Last Bastion's
source-art issue but the same category of mistake. Preserve the canonical PNGs
for apps; define a website consumption manifest or reviewed WebP derivatives
instead of publishing every app asset. See the archived
`play/docs/archive/2026-08/ARCADE-IMPROVEMENT-PLAN.md` D1.

**Implemented the confirmed part the same day:** the website delivery manifest
now excludes those 52 unused Pro faces, saving 31.72 MB. Sync and verification
enforce the exclusion; canonical and app masters remain complete. The larger
Last Bastion source-art hold is unchanged.

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

**Status: the volume-ranked wedge is complete as of 2026-08-07.** Six game
guides now live: `solitaire-without-ads-or-signup`, `sudoku-without-ads-or-
mistakes`, `checkers-without-ads-or-signup`, `freecell-without-ads-solver-
verified`, `mahjong-solitaire-without-ads`, `minesweeper-without-ads` — five
added this session, on top of the three original non-game guides (toddler
apps, offline games, browser-games-offline). Every game guide targets a
distinct, verified-true angle rather than reusing one template: Solitaire
(winnable-deal odds), Sudoku (mistake limits/gated hints), Checkers (forced
matchmaking), FreeCell (solver-verified — genuinely true here), Mahjong
(gated Shuffle — solver-verified would have been *false* for this game, so
the angle changes), Minesweeper (first-click safety + real classic board
sizes). All six cross-link each other; sitemap resubmitted to Search Console
after each addition.

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

Nothing left queued from the original volume table. Further guides (2048,
Word Search, Reversi, Connect 4, Spider Solitaire) are possible but diminish
in value fast — those pages don't have obvious, honest, competitor-specific
angles the way the six above did, and manufacturing one for its own sake
would be padding, not the wedge.

The next lever is **directory submissions** to free-browser-game aggregators
— unglamorous, unstarted, and how the backlink count actually first moves off
4. This needs signups on external sites, so it needs you present — I
shouldn't be creating accounts.

---

## P6. Code/copy drift audit — "what you already have" — done 2026-08-07

Prompted by a direct question: should the Solitaire game get more features,
or is the arcade better served by making sure what's already built is
actually marketed? Checked, and the answer was the latter, twice over.

**Solitaire's deals are solver-verified and nobody knew.** The game code
(`VERIFIED_SEEDS` in `play/solitaire/index.html`) has dealt from a pool
pre-solved under both Draw 1 and Draw 3 for some time — the same guarantee
FreeCell advertises, on the arcade's single highest-volume term (234k/mo).
None of it was in the meta description, schema, prose, or FAQ. Fixed
(commit `ba1b5d9`), and it also corrected two guides written before this was
confirmed: `solitaire-without-ads-or-signup` had deferred the winnable-deal
claim to FreeCell only, and `freecell-without-ads-solver-verified` had
drifted into overclaiming the same guarantee for Spider Solitaire, which
deals at random by design (confirmed against Spider's own FAQ).

**14 game pages understated Brain Games Vol 1 by more than half.** Checking
for the same pattern elsewhere turned up the opposite problem at scale:
2048, Cascade, Checkers, Connect 4, Kakuro, Mahjong, Memory Match,
Minesweeper, Reversi, Solitaire, Sudoku and Word Search all said "one of
nine classics" / "eight more games" in their funnel copy, FAQ, and
win-celebration share text. The app's own page (and its source —
`apps/snackpack-brain-games/components/games/`, 23 folders) says 24. Every
occurrence corrected to 24/23 (commit `5e3fc83`).

**Two guides linked the wrong app entirely.** Written last session before
this was checked: `freecell-without-ads-solver-verified` and
`mahjong-solitaire-without-ads` both linked their "Android app" mention to
Brain Games *Vol 3* — which, per its own source directory, contains neither
FreeCell nor Mahjong (it has Chess, Backgammon, Sokoban, Spider Solitaire,
etc.). Both games actually ship in **Vol 1**. Fixed in the same commit as
the app-page copy.

**Five games had a working Daily mode nobody could discover.** FreeCell,
Kakuro, Mahjong, Thirteen and Memory Match all have a functioning Daily
toggle in the toolbar (confirmed against each game's own JS) with zero
explanation anywhere in visible copy — no meta description, no FAQ. Unlike
Crossword and Picross, which do mention it. Added to all five's meta/og/
schema descriptions and FAQs. Memory Match's existing FAQ entry was also
rewritten — it implied Daily was only reachable via a shared link, when a
toolbar button has existed the whole time.

**Six soccer pages still described a pre-tournament event.** The earlier P3
fix only touched `world-cup/*` — missed that Crossbar Challenge, Dribble
Rush, Free Kick Curl, Goalkeeper Hero, Header Hero and Flag Frenzy's own
funnel cards still said "for the 2026 football build-up" / "during the 2026
football hype", and two headlines implied an ongoing event ("Keep the
tournament run going.", "One puzzle a day, all tournament long."). Found via
a full-site grep for the phrase after noticing it while auditing Flag
Frenzy. Fixed (commit `625ae9f`); "built for the 2026 football summer"
phrasing left alone in three other spots since it reads as *why it exists*,
not a claim the event is ongoing.

**Remaining ~19 games checked clean.** Ran the same method (button/toolbar
labels vs. meta description and FAQ text; grep each game's own JS comments
for "verified"/"guarantee"/"solver"/"unlimited"/"fair"/"honest") across
every game not covered above — the Vol 2 arcade set (Flappy Snacky, Snacky
Worm, Table Tennis, Snakes & Ladders, Asteroid Destroyer, Crossword,
Picross) and the remaining soccer set (Keepy-Uppy, Penalty Shootout, Target
Shooting Arena). One real gap found: Soccer Trivia Sprint's meta
description never named its category depth (Players/2026 Teams/World Cup
History/Rules) even though the page's own prose and FAQ cover it well —
fixed (commit `f69abe4`). Everything else already matched its actual
feature set. **This closes P6** — every game in the arcade now has this
specific check done at least once.

Method, if a future content pass ever needs repeating: compare each game's
actual button/toolbar features (grep `<button>` labels) against its meta
description and FAQ text, and separately grep the game's own JS comments
for words like "verified", "guarantee", "solver" — that second pattern
specifically catches a real feature explained to nobody but future
maintainers.

**The same drift reached `apps/index.html` itself — the page that actually
gets traffic (~100/mo).** Continuing the audit onto the apps listing page
turned up a *third* distinct number for Brain Games Vol 1 alone: individual
game pages said "nine classics" (fixed above), Vol 1's own dedicated page
says 24, and `apps/index.html` said "Eighteen" in **two separate spots**
(a summary paragraph and a `meta-tag` pill) — and showed only 18 of 24 icon
tiles. Vol 2 had the identical pattern: "nineteen"/"19 games" against a
confirmed 23, 19 of 23 tiles shown. All four numeric mentions fixed to
match each app's own authoritative page (commit `f80fdaa`).

The missing icon tiles were a wiring gap, not a missing-art one — checked
first: all ten icon files (Euchre, Dominoes, Pinball, Photo Jigsaw, Bowling,
Whac-A-Mole for Vol 1; Ludo, Yahtzee, Golf Solitaire, Rummy 500 for Vol 2)
already existed in each app's own `assets/game-icons/`, just never had a
`<div class="showcase-tile">` added for them. Wired all ten; verified all 74
tile images now return HTTP 200. Vol 3's card was already accurate and its
icon strip already complete — no change needed there.

**This suggests the pattern is worth a standing check, not a one-time
fix** — every time a volume's game count grows, whoever adds the new game
in-app has had no reason to know four separate copy locations on the public
site need the same update. Worth a lightweight audit after any future
game-count change to a live app, rather than waiting for it to compound
across three different stated numbers again.

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

**P2, P3, P4 and P5 are done. P1 is on hold** (last-bastion is active WIP,
revisit later — no art/history changes touched). All six code/copy items
that didn't require Codex art or your presence for external signups are
closed out.

What's left, in order:

1. **Directory submissions** — the actual next lever on the 4-link bottleneck,
   now that six guides exist to submit. Needs you present.
2. **Section A art** (arcade plan) — briefed and waiting on Codex/imagegen,
   nothing further for me to do until files land.
3. **P1, later** — once `last-bastion` stabilizes enough that its art stops
   changing daily.

Deliberately **not** on this list: more arcade code polish. Section B is closed,
and the analytics say polish has no audience until the link count moves.

---

# Re-audit 2026-08-14 — after the Codex asset pass

Everything below was measured against the repo and the live site today, not
carried forward from the sections above. The asset work landed; these are the
gaps it surfaced or left behind.

## P7. Two finished assets were never committed and are 404 on the live site

**Confirmed, live, and the highest-priority item here because it is a
regression against what both other plans record as done.**

The archived `play/docs/archive/2026-08/ARCADE-IMPROVEMENT-PLAN.md` A8 and
`play/docs/archive/2026-08/CODEX-ASSETS-REQUESTED.md` both mark the
maskable icon and the `place.wav` audio pilot **"DONE + WIRED"**. Both files
exist on disk, neither is gitignored, and **neither was ever `git add`ed**, so
neither has ever deployed:

| URL | Live status |
|---|---|
| `/assets/icon-maskable-512.png` | **404** |
| `/play/shared-assets/game-ui/audio/place.wav` | **404** |

The consequences are live right now:

- `manifest.webmanifest` (itself modified and uncommitted) declares a
  `purpose: "maskable"` icon that does not resolve. Android installs fall back
  to masking the edge-to-edge `any` icon — the exact outcome A8 existed to
  prevent.
- `sw.js`'s `SHELL` precaches `place.wav`. The install handler adds entries
  individually and tolerates misses by design, so this degrades silently rather
  than breaking the service worker — good defence, but it means nobody would
  notice.
- **The A2 listening gate cannot be satisfied on Android**, because the file the
  gate is about is not being served. The plan is waiting on an approval that is
  currently impossible to give on one of its two required devices.

**Fix:** commit both files plus the modified `manifest.webmanifest`, deploy,
then re-run the D2 post-deploy smoke. This is a one-commit fix, and it should
happen before any further asset work.

**The general lesson worth keeping:** "generated and reviewed on disk" is not
"shipped". Every asset item in both plans is marked done on the strength of a
local file check. A live-URL check belongs in the definition of done — see P10.

## P8. `llms.txt` has now been missed by three consecutive site-wide audits

**Confirmed.** This file has a track record: the June 2026 IAP audit missed it
(that was P2 above), and the 2026-08-07 P6 count audit — which corrected the
Brain Games Vol 1 game count in 14 game pages, `apps/index.html` twice, and the
funnel/FAQ/share copy — **missed it again**. It currently carries the exact
number P6 was run to eliminate:

| Claim in `llms.txt` | Reality | Where this was already fixed |
|---|---|---|
| Brain Games Vol 1: "collection of **nine** classics" | **24** | P6, everywhere else |
| Brain Games Vol 2: lists **eight** games | **23** | P6, everywhere else |
| "**31** classic games playable instantly" | **34** | never — new since SnackWords + Golf Solitaire |
| "**eight** original soccer games" then names **nine** | self-contradictory in one sentence | never |
| SnackWords, Golf Solitaire | absent entirely | both shipped this week |

The `/read/` section *is* correctly represented, which shows the file is being
maintained — just never by the audits that sweep the HTML. That is the actual
defect: **every audit greps `--include=*.html` and `llms.txt` is not HTML.**

This matters more than ordinary stale copy for the reason P2 already gave: this
is the file AI assistants read to describe the products, so a wrong number gets
repeated downstream with our name on it.

**Fix:** rewrite the stale counts, add SnackWords and Golf Solitaire, fix the
eight/nine soccer contradiction. Mechanical. Then P10.

## P9. The service worker caches book PDFs permanently, and that can evict the offline arcade

**Confirmed by reading the routing, and this is a real bug rather than a
tidiness point.** `sw.js`'s route table is:

1. navigations → network-first
2. `/\.(?:js|css|html|webmanifest|json)$/` → network-first
3. **everything else → cache-first**

Rule 3 is commented "images, fonts and audio", but it is a catch-all, not a
whitelist. `.pdf` does not match rule 2, so **the eight printable book PDFs —
15.9 MB, 1.9–2.6 MB each — are cached first and never revalidated.** Two
consequences:

- **A corrected book PDF can never reach a returning visitor.** This is
  precisely the failure mode B9 documented and told us not to repeat: *"The
  status sites originally shipped cache-first for scripts, which meant a
  returning visitor kept running whatever build they first installed — a fixed
  bug could never reach them. Don't repeat that here."* The rule was written
  for code, and PDFs quietly fell into the same trap when `/read/` shipped
  after it.
- **Quota pressure can wipe the offline arcade.** A parent downloading a few
  readers adds up to 15.9 MB to Cache Storage. Browsers evict a whole origin's
  cache when quota is hit — they do not evict the PDFs selectively. So the
  cost of caching something nobody needs offline is potentially the offline
  games, which are the feature the PWA was built for and the thing
  `/guides/play-browser-games-offline/` promises in writing.

**Completed 2026-08-14:** rule 3 is now an
explicit extension list (`png|jpg|jpeg|webp|svg|gif|woff2?|wav|mp3|ogg`) and
anything unmatched passes through to the network. That fixes PDFs and every
future file type at once. `CACHE` is bumped to `snackpack-arcade-v5`, so
existing installs discard the old catch-all routing.

## P10. Add the two checks that would have caught P7, P8 and P9

All three of the above are the same shape: something true on disk, or true in
HTML, that nothing verifies. `check-site.mjs` passes cleanly on 166 pages, and
passed while all three were live. Two additions close the class:

1. **A live-URL smoke check.** Take the manifest's icon list, `sw.js`'s `SHELL`
   array, and every `og:image`, and assert each returns 200 against the
   deployed origin. This is the D2 "post-deploy smoke" item, but written as a
   script rather than a checklist — a checklist is what we already had, and P7
   still shipped.
2. **Extend the count/claim audit past HTML.** Whatever grep the next content
   pass uses must include `llms.txt`, `sitemap.xml` and the plan docs, or P8
   recurs a fourth time. Better: derive the arcade count from
   `ls play/*/` at build time rather than hand-writing it in prose — there are
   now five separate places stating a game count and they disagree.

## P11. `/read/` is the strongest un-exploited SEO surface on the property

**This is the one genuinely new opportunity, as opposed to a repair.**

The guides wedge (P4) is entirely arcade-facing: all ten guides target game
terms. Meanwhile `/read/` shipped eight complete illustrated decodable readers,
each with a **free printable PDF**, and has:

- **no guide pointing at it** — the guides link to `/read/` in the nav only;
- **no PDFs in `sitemap.xml`** (`grep -c "\.pdf"` returns 0), though Google
  indexes PDFs and these are exactly the kind of file that earns links;
- correct `Book` schema on every reader. The earlier idea of adding
  `FAQPage` schema was reviewed against current Google guidance and rejected;
  this site is not eligible for FAQ rich results.

Why this outranks more arcade guides on the same effort: P4's own conclusion
was that further game guides "diminish in value fast" because the remaining
terms have no honest competitor-specific angle. `/read/` has the opposite
problem — a genuinely strong angle nobody has written yet. "Free printable
decodable readers", "phonics books to print", "CVC reader PDF" are searched by
teachers and parents, sit in a far weaker competitive field than solitaire, and
**printables are one of the few page types people still link to and share in
teacher groups** — which is the 4-inbound-links bottleneck, addressed with
content we have already paid to produce.

Implemented 2026-08-14:

1. `/guides/free-printable-decodable-readers/` — what a decodable reader is,
   which sounds each of our eight covers, how to print them double-sided, and
   the honest disclosure that we publish them. Links out to all eight books.
2. The durable sitemap generator now includes the eight PDFs, rather than a
   one-off manual edit.
3. **Dropped the proposed `FAQPage` duplication.** Google limits FAQ rich
   results to authoritative government and health sites; repeating boilerplate
   questions across eight book pages would add maintenance without a visible
   search feature. The guide instead adds useful visible printing and level
   guidance, while the existing `Book` schema remains on each reader.

Both optional art items are now complete and wired: a shelf-level `/read/`
social card and a dedicated printable-reader guide card.

## P1 — re-measured today

Correcting a figure rather than changing the recommendation. The working tree
is now **4.0 GB**, but most of that growth is *untracked* build output
(`play/last-bastion/desktop/` 1.7 GB, `dev/` 383 MB) that never deploys. The
number that matters:

| Measure | 2026-08-07 | 2026-08-14 |
|---|---|---|
| **Published payload (tracked files)** | ~2.0 GB | **1.83 GB** |
| of which `play/last-bastion/art/` | 1.3 GB | **1.36 GB** |
| of which `play/last-bastion/game-assets/` | — | **143 MB** (this one *is* served) |
| `.git` | 1.6 GB | 1.9 GB |

So the situation has not materially worsened, and the P1 hold remains correct
while Last Bastion is active WIP. One thing worth noting for later: `art/` is
1.36 GB of the 1.83 GB, so Step 1 alone still takes the site from 1.8× the
GitHub Pages limit to comfortably under it. Nothing to do today.

## Next tasks, in order

1. ~~**Commit the two orphaned assets + `manifest.webmanifest`, deploy, verify
   both URLs return 200**~~ (P7) — **done 2026-08-14.** Both now return 200.
   **The A2 Android listening gate is unblocked.**
2. ~~**Service-worker whitelist + `CACHE` v5**~~ (P9) — **done.** Rule 3 is now
   an explicit media whitelist (`png|jpe?g|webp|svg|gif|woff2?|wav|mp3|ogg`);
   PDFs, archives and unknown large downloads bypass Cache Storage entirely.
3. ~~**Rewrite the stale counts in `llms.txt`**~~ (P8) — **done.** See the
   correction note below: the audit found a *fourth* stale count nobody had
   flagged.
4. ~~**Fix "32 games" → 34 in the four guides**~~ — **done.**
5. ~~**Add the live-URL smoke script**~~ (P10.1) — **done:**
   `scripts/check-live.mjs`. Reads `manifest.webmanifest` icons, the `sw.js`
   `SHELL` array and every `og:image`/`twitter:image` on the property, then
   asserts each returns 200 against the live origin. **77 declared URLs, all
   resolving.** Run it after every deploy.
6. ~~**`/read/` wedge**~~ (P11) — **done:** printable-reader guide, dedicated
   share cards, internal discovery links and eight PDFs in the durable sitemap.
7. **Directory submissions** — unchanged, still the real backlink lever, still
   needs you present for the signups.
8. **Teacher/homeschool outreach** using the updated `LINK-BUILDING-PLAN.md`
   copy — new, and now the highest-value thing that needs you rather than me.
9. **Resubmit `sitemap.xml`** and inspect the new guide in Search Console.

### Correction found while doing item 3: a fourth stale count

P8 listed three wrong numbers in `llms.txt`. Checking each against its
authoritative source — `constants/games.ts` in each app, not the directory
listing, since `shared/` and `ai/` are not games — turned up one more, and it
was **in the HTML, not just `llms.txt`**:

| Claim | Stated | Actual | Where |
|---|---|---|---|
| Brain Games **Vol 3** game count | 23 | **24** | `apps/index.html`, `index.html`, `play/spider-solitaire/` |

`chess-openings` was added to Vol 3 after the site copy was written. Vol 1 (24)
and Vol 2 (23) were both correct, so the 2026-08-07 P6 pass held — this is new
drift, not a missed fix, and it is the **third** volume to drift the same way.

That is now three separate occurrences of one root cause: **whoever adds a game
in-app has no reason to know the public site states the count in four places.**
Fixing the number a fourth time is not the answer.

**Done 2026-08-14 — `scripts/build-game-counts.mjs`.** Counts are now derived,
not typed. A fourth audit turned up two more stale numbers nobody had flagged
(the SnackWords page said the arcade had 32 games and the daily hub "five more"
when it has nine), which is the point: hand-checking kept missing some.

How it works, and why it is built this way:

- **The arcade and daily-hub counts are derived from this repo** — `play/*/`
  directories and `data-game="…"` cards on the hub. Nothing to declare, so they
  cannot go stale.
- **The three Android counts are declared** in `data/game-counts.json`, because
  their real source (`constants/games.ts` per app) is in the companion monorepo,
  which is not checked out in CI. When the monorepo *is* present — any dev
  machine — the script cross-checks the JSON against it and refuses to run on a
  mismatch. So a stale entry survives CI but not a local run.
- **Counts are injected into `<span data-game-count="vol3">` markers**, not
  find-and-replaced. The attribute names the entity, so the "23 games" that
  means Vol 2 can never be confused with the "23 games" that means Vol 3 —
  precisely the mistake a blind replace would have made, since both strings were
  live on the same page.
- **`llms.txt`, `<meta>` descriptions and JSON-LD use phrase rules instead**,
  because a `<span>` is invalid in all three. Including `llms.txt` is
  deliberate: it is the file three consecutive audits missed.
- `--check` fails instead of fixing, and **runs in CI** via `site-check.yml`.

Two things worth knowing if this is extended. It validates the declared counts
*before* touching any file — an earlier draft rewrote first and checked after,
which propagated a wrong JSON value into every page and then reported an error,
leaving the tree worse than it started. And markers can opt into spelled-out
numbers (`data-game-count-format="word"`) so mid-sentence prose reads "nine
more" rather than "9 more".

Coverage: 28 markers plus 7 phrase rules, across the guides, both index pages,
the app pages, three game pages and `llms.txt`.

The `llms.txt` root cause is separate and now understood: **every audit greps
`--include=*.html`, and `llms.txt` is not HTML.** Any future content sweep must
name it explicitly.

Items 1–6 are complete and verified. Items 7–8 need you; item 9 is a two-minute
Search Console task.

---

# Re-audit 2026-08-15 — measured against live Search Console, not the repo

Prompted by an observed traffic increase. Everything in this section comes from
the Search Console API (`sc-domain:snackpackuniverse.com`, service account, run
2026-08-15) or from the live origin. No figures are carried forward.

## The headline: the increase was real, was almost entirely one page, and has already ended

| Window | Clicks | Impressions | Avg. position |
|---|---|---|---|
| Prior 28d (2026-06-18 → 07-15) | 1 | 82 | 34.7 |
| Current 28d (2026-07-16 → 08-12) | **11** | **1,210** | **15.6** |
| Last 90d (05-16 → 08-13) | 12 | 1,306 | 17.1 |

That is a genuine 15x impression lift and the first month the property has ever
produced clicks in a meaningful number. But the daily series shows it was a
two-week event, not a new baseline:

| Date | Impressions |
|---|---|
| 07-16 → 07-25 | 3–12/day |
| 07-26 | 24 |
| **07-27 → 08-08** | **59–103/day** |
| 08-09 | 42 |
| 08-10 → 08-14 | **5–16/day** |

**`/play/thirteen/` accounts for 899 of the 1,210 impressions (74%) and 6 of the
11 clicks.** Its own daily series *is* the site's daily series: zero impressions
before 07-26, 54–85/day through 08-08, then **zero from 08-10 onward**. Average
position held at 7.4–9.1 for the whole run, then 22.7 on 08-09, then gone.

This is the shape of a freshness/discovery boost decaying, not a penalty — the
URL Inspection API still reports `PASS / Submitted and indexed`, canonical
correct, robots ALLOWED. But note the crawl date: **last crawled 2026-07-25**,
three weeks ago. Google ranked the page on a single crawl, tested it, and has
not been back. Nothing on the property has given it a reason to.

**So the honest read: nothing broke, but nothing was captured either.** The site
got two weeks of free exposure on one term and converted 0.7% of it.

---

## R1. Thirteen is the only ranking asset on the property, and it is the one game with no supporting content

**This is the highest-value item in this audit and it displaces "more guides".**

The evidence, side by side:

| Surface | Pages | Impressions (28d) | Clicks |
|---|---|---|---|
| `/play/thirteen/` | 1 | **899** | 6 |
| All 12 `/guides/` | 12 | **49** | **0** |
| All of `/read/` | 9 | 0 | 0 |
| Everything else | ~145 | ~262 | 5 |

Twelve guides — the deliberate wedge from P4 — have produced **49 impressions
and zero clicks in 28 days.** One game page nobody planned around produced 899.
The guides wedge targeted solitaire, sudoku, checkers, freecell, mahjong and
minesweeper because they had the search volume. They also have the competition.
Thirteen (Tien Len) has a real, under-served, low-competition query cluster and
we are already on page one of it:

| Query | Impressions | Clicks | Position |
|---|---|---|---|
| `free thirteen` | 77 | **0** | 7.9 |
| `13 card game online` | 61 | 1 | 8.8 |
| `13 online card game` | 2 | 0 | 9.0 |
| `card game 13 online` | 2 | 0 | 6.0 |
| `13 online` | 2 | 0 | 9.5 |
| `13 card game online free` | 1 | 0 | 7.0 |
| `game tien len` | 2 | 0 | 30.0 |
| `13 vietnamese card game` | 1 | 0 | 57.0 |

Two things jump out.

**First, the CTR is the problem, not the ranking.** 899 impressions at average
position ~8 returned 6 clicks — about **0.7%**. A page-one position in that range
would normally return several times that. The ranking is already won; the snippet
is losing the click. Current title:

> `Play Thirteen (Tien Len) Online Free vs Computer | No Ads — SnackPack`

Against the actual top query, `free thirteen`, the word "free" sits sixth and
"Thirteen" second, behind nothing that earns its place. Against `13 card game
online`, the numeral **`13` does not appear in the title at all** — and five of
the eight queries above use the numeral, not the word. Google bolds matched terms
in the SERP; we are handing it almost nothing to bold.

**Second, the cluster is one page deep.** `game tien len` sits at position 30 and
`13 vietnamese card game` at 57 — those are terms where a dedicated rules page
would outrank a game page, and there is no such page. Ten internal links point at
`/play/thirteen/`, all from other arcade pages; **no guide mentions Thirteen at
all**, while six guides compete for terms that returned zero clicks.

### What to do

1. **Rewrite the title, meta description and H1 around the real queries.** Lead
   with both the numeral and the word, put "free" early, keep the honest
   modifiers that are our whole differentiator. Something in the shape of:
   `Thirteen (13) Card Game Online — Free, No Ads, vs Computer | Tien Len`.
   This is a ten-minute change against 900 impressions/month of proven demand and
   it is the single highest-expected-value edit available on the site.
2. **Write `/guides/thirteen-tien-len-rules/`** — how to play Tien Len: card
   ranking (3 low, 2 high), singles/pairs/triples/sequences, bombs, the chop
   rules, the two rule sets our game implements, and how the daily deal works.
   This is the one guide on the site that would target a term we have already
   proven we can rank for. Cross-link it both ways with the game.
3. **Add the correctly-diacriticked "Tien Len" spelling** to the page (currently
   unaccented only, per the title tag). The diacritic form is how the
   Vietnamese-language audience searches, and `13 vietnamese card game` already
   shows that audience reaching us at position 57.
4. **Then consider Thirteen variants** — the two southern/northern rule sets are
   genuinely different and we already ship both. That is a second cluster page
   with real content behind it, not padding.

Explicitly **do not** write more `X-without-ads` guides. Twelve of them, 49
impressions, zero clicks, and the format is now well tested.

---

## R2. Not one Play Store link on the site can be attributed

**Confirmed, and this is the biggest measurement gap on the property.**

There are **137 outbound Google Play links** across the site. **136 of them carry
no `referrer` parameter.** Exactly one does — a World Cup link tagged
`utm_source=worldcup`.

The consequence is blunt: **we cannot tell whether this website has ever driven a
single install.** Play Console reports installs by acquisition channel using the
`referrer` parameter on the store URL; without it, every web-driven install is
filed as organic Play search and the site's entire commercial justification is
unmeasurable. Given the portfolio's revenue reality, "does the site convert at
all?" is arguably the single most valuable unanswered question here, and it has
been unanswerable this whole time for the want of a query string.

**Fix:** a generator in the existing `scripts/build-*.mjs` idiom —
`scripts/build-play-links.mjs` — that rewrites every Play URL to carry
`&referrer=utm_source%3Dwebsite%26utm_medium%3D<surface>%26utm_campaign%3D<page-slug>`,
where `<surface>` is `arcade` / `guide` / `app-page` / `read` / `home`. Derived,
not hand-typed, so it cannot drift — same reasoning as `build-game-counts.mjs`.
Add `--check` and wire it into `site-check.yml`.

Two details worth getting right:

- The parameter must be `referrer`, URL-encoded, on the `details?id=…` URL. Plain
  `utm_source=…` on the store URL is ignored by Play.
- The funnel modal in `play/funnel.js` builds its Play URL in JS
  (`DEFAULT_PLAY_URL`, `window.SP_PLAY_URL`) — the generator only sees HTML, so
  that one needs tagging by hand and a note so it isn't missed a second time.

**Do this before the app7 launch**, so the launch is the first release with a
measurable web funnel rather than the fourteenth without one.

---

## R3. App7 (Mathematics) launches in ~1 week and its page is not launch-ready

App7 is in review and expected in production around 2026-08-22. Checked its page
today:

- `apps/snackpack-7-mathematics/index.html` contains **zero** Play Store links
  (correct today, blocking on launch day).
- It has no `SoftwareApplication` schema, which the 12 live app pages carry.
- The homepage hero says **"Now live — 12 apps on Google Play"**; this becomes 13
  on launch day.
- `llms.txt` lists app7 as unreleased — and per P2/P8, `llms.txt` has been missed
  by three consecutive audits precisely because it isn't HTML.

**Prepare a launch-day checklist now, while there is slack, rather than
scrambling on the day.** The full list of touchpoints, verified against how the
other 12 apps are wired:

1. Play link + install button on the app page (with the R2 `referrer` tag).
2. `SoftwareApplication` + `Offer` schema block, matching a live app page.
3. `apps/index.html` — move from pipeline to live, add the icon tile strip.
4. Homepage hero count 12 → 13, and the roadmap section.
5. `llms.txt` — move out of upcoming, with accurate billing language.
6. `data/game-counts.json` if app7 declares a count.
7. `sitemap.xml` regen + Search Console resubmit + URL inspection request.
8. Store release notes, per the standing rule.
9. Run `check-site.mjs` and `check-live.mjs`.

Worth doing in advance as a single "app7 launch" branch that only needs the Play
URL pasted in on the day.

---

## R4. The newest and best content is not in the index yet, and nothing nudges it

URL Inspection on the five most recent surfaces, run today:

| URL | Google's status |
|---|---|
| `/read/` | **URL is unknown to Google** |
| `/guides/free-printable-decodable-readers/` | **URL is unknown to Google** |
| `/play/daily/` | **URL is unknown to Google** |
| `/play/snackwords/` | **URL is unknown to Google** |
| `/play/thirteen/` | Submitted and indexed (last crawled 07-25) |

These four shipped 2026-08-13/14, so a day or two of "unknown" is normal and not
a defect. The point is the mechanism, not the alarm: **`sitemap.xml` was last
downloaded by Google on 2026-08-11 — before any of them existed.** Google's own
record of the sitemap says 146 URLs submitted; the live file now has **169**.
Nothing on this property tells Google when content ships. Combined with
`/play/thirteen/` going 21 days without a recrawl, the picture is a site Google
visits rarely and on its own schedule.

Two things help, in order of value:

1. **Resubmit the sitemap after each content deploy** — a one-line `curl`/`fetch`
   ping in the existing deploy path, or the Search Console API the service
   account already has access to. Cheap, durable, and it is the only signal we
   can send at will.
2. **Use the URL-inspection request quota deliberately** on the handful of pages
   that matter — `/read/`, the printable guide, and whatever comes out of R1 —
   rather than spraying it across 169 URLs.

Note this does not replace the link problem below. Crawl rate is downstream of
authority; the ping just stops us waiting an extra week on top.

---

## R5. What the data says to stop doing

Worth stating plainly, because the repo currently carries plans that this month's
numbers argue against:

- **Stop writing `X-without-ads` guides.** Twelve guides, 49 impressions, zero
  clicks in 28 days. P4 already concluded further guides "diminish in value
  fast"; the measurement now confirms it for the ones that *were* written, not
  just the ones that weren't.
- **Stop treating arcade breadth as growth.** 34 games, and one of them produces
  74% of all search exposure. The next game added will almost certainly produce
  what the last eight did, which is nothing measurable.
- **The `/world-cup/` section still pulls impressions** — `egypt world cup
  schedule`, `ghana world cup games`, `golden boot race` and similar, all at
  position 37–98, all zero clicks. Harmless, correctly past-tensed, no action.
  But it is not a growth surface and should not receive further work.

The one thing the data does **not** contradict is the standing diagnosis: with
four inbound links, we rank when Google happens to test us and stop when it
stops. **Directory submissions and teacher/homeschool outreach remain the real
lever and still need you present** (items 7–8 of the previous section, still
open).

---

## R6. `/read/` is still the best untested bet — and printables are the natural extension

Zero impressions so far, but it is days old, so this is "not yet measured", not
"failed". The reasoning in P11 stands and the surface is now complete: eight
illustrated decodable readers, eight printable PDFs, a dedicated guide, correct
`Book` schema, PDFs in the sitemap.

The extension worth planning — and the one that plays to what this portfolio
already owns — is **free printable worksheets**, drawn from content already
authored for the apps:

- **Phonics/CVC worksheets** from ABCs (snackpack-1) — letter formation,
  sound-sorting, blending practice, matched to the decodable readers we already
  publish, so the shelf and the worksheets cross-sell each other.
- **Number formation and counting mats** from 123s (snackpack-2).
- **Times-table and place-value practice sheets** from Mathematics (app7) — timed
  to its launch, which makes the launch a content event rather than a page edit.
- **Handwriting/sentence-building strips** from Sentences & Spelling
  (snackpack-3).

Why this over more games: printables are one of the few page types teachers and
parents genuinely link to and share, which is the four-inbound-links bottleneck
addressed with content already paid for. The PDF build path already exists
(`scripts/build-read-pdfs.mjs`) and can be generalised. Target terms are
long-tail, honest, and in a far weaker field than `solitaire`.

Sequence it **after** R1–R3, which are cheaper and act on proven demand.

---

---

## R7. Brain Games Vol 2 also ships Thirteen — but it needs *different* work, not the same work twice

Raised 2026-08-15. Checked rather than assumed:

- **Thirteen ships in Vol 2 only.** `apps/snackpack-brain-games-vol-2/constants/games.ts`
  has `id: 'thirteen'`, tier 2, category `Cards`. Vol 1 has no Thirteen. Vol 3's
  only match was an unrelated tagline ("pair cards that add up to thirteen" — a
  solitaire variant), not the same game.
- **The web page already points at the right app.** `/play/thirteen/` sets
  `window.SP_PLAY_URL` and its store badge to `com.snackpackuniverse.braingames2`,
  so the funnel is correctly wired. This is *not* a repeat of the P6 bug where two
  guides linked FreeCell and Mahjong to Vol 3, which ships neither.

**So the two surfaces do not want the same edit.** They are fed by two different
search engines and only one of them has measured demand:

| | `/play/thirteen/` (web) | Thirteen in Vol 2 (app) |
|---|---|---|
| Discovery engine | Google web search | Play Store search (ASO) |
| Measured demand | **899 impressions/28d, position ~8** | unmeasured |
| Lever | title/meta/H1 + a rules guide | store listing keywords |
| Status | **done 2026-08-15** | open, see below |

### What the app side actually needs

Not a code change and not new game features — a **listing** change. The keyword
evidence from R1 transfers directly, and it is the only part of this that carries
over:

- The in-app tagline is `Vietnamese card shedding classic`. It contains no `13`,
  no `Tiến Lên`, and no `Tien Len` — the exact omission that was costing the
  website its CTR. Same blind spot, different surface.
- Vol 2's `store/` directory holds only `release-notes/` and `screenshots/`. **The
  Play listing title, short description and full description are not in this
  repo** — they live in Play Console only, so they cannot be audited from here.
  Someone needs to open the listing and check whether "13", "Tien Len" or
  "Vietnamese card game" appear in the short and full descriptions.
- If they do not, adding them is the cheapest ASO change available on Vol 2, and
  it targets demand we have *already proven exists* on the open web rather than
  a guess.

### Sequencing

Do this **after** the R1 web work, not alongside it, and for a specific reason:
the website change is measurable in Search Console within ~2–4 weeks, and Play
listing changes are notoriously hard to attribute. Let the web result tell us
whether the keyword thesis is right before spending the Vol 2 listing on it. If
the CTR on `/play/thirteen/` moves off 0.7%, the thesis is confirmed and the same
terms are worth putting in the Play listing with confidence.

**One caveat worth stating:** Vol 2's listing is a shared shopfront for 23 games.
Rewriting it around Thirteen specifically would be over-fitting to one title.
The right change is *additive* — get the `13` / `Tien Len` terms into the full
description's game list, not restructure the listing around them.

### Not recommended

- **Do not build a standalone Thirteen app.** The portfolio's problem is
  distribution, not catalogue size, and a fourteenth listing splits attention
  further.
- **Do not add game features to Vol 2's Thirteen to "match" the web version.**
  Nothing in the data suggests the game is the constraint; the constraint is that
  nobody finds it.

## Suggested order

| # | Item | Effort | Why this position |
|---|---|---|---|
| 1 | ~~R1.1 — rewrite Thirteen title/meta/H1~~ **done 2026-08-15** | ~15 min | 900 impressions/mo of proven demand, 0.7% CTR |
| 2 | ~~R2 — `build-play-links.mjs` + `funnel.js`~~ **done 2026-08-15** | ~1–2 h | Makes every later change measurable; blocks nothing else |
| 3 | ~~R3 — app7 launch checklist~~ **done 2026-08-15** | ~1 h | Deadline-driven, ~1 week out |
| 4 | ~~R1.2 — `/guides/thirteen-tien-len-rules/`~~ **done 2026-08-15** | ~2 h | Only guide targeting a term we can demonstrably rank for |
| 5 | ~~R4 — search-engine notification~~ **done 2026-08-15** | ~30 min | Small, durable, compounds with everything after it |
| 6 | R6 — printable worksheets, first set | multi-session | Best untested surface; needs art |
| 7 | Directory submissions + outreach | needs you | Still the actual bottleneck |

R1, R2, R3 and R4 need no art at all.

---

## Assets requested from Codex / imagegen

Only R1 and R6 need new art. Nothing here blocks the code items above — ship
those first and drop art in when it lands. House style throughout: the existing
SnackPack look — flat, warm, rounded, cream/amber palette, soft shadows, no
gradients-on-gradients, no text baked into the image unless stated.

### Asset 1 — Thirteen guide hero / share card

**File:** `guides/thirteen-tien-len-rules/social-card.png` (1200x630, plus a
`.webp` derivative via `scripts/build-webp.mjs`)

> A warm, flat-illustrated social share card, 1200x630, for a web guide about the
> Vietnamese card game Tien Len ("Thirteen"). A fan of five playing cards spread
> across the lower-left, drawn in a soft rounded style with clearly readable
> pips — show a 3 of spades at one end and a 2 of hearts at the other to hint at
> the game's low-to-high ranking. Cream (#FBF7EF) background with a soft amber
> glow behind the cards. Generous empty space in the upper-right third for a text
> overlay to be added later. No text in the image itself. Flat vector look, soft
> long shadows, no gradients, no photorealism, and no gambling or casino
> imagery — this should read as a friendly family card game, not a betting one.

### Asset 2 — Thirteen combination explainer strip

**File:** `guides/thirteen-tien-len-rules/combos.png` (1600x400, transparent
background)

> A single horizontal instructional strip, 1600x400, transparent background,
> showing five card combinations left to right with a small gap between each
> group: (1) one single card, (2) a pair, (3) a triple, (4) a run of four
> sequential cards, (5) four of a kind. Flat rounded playing cards in the same
> soft style, pips clearly legible at small size, slight overlap within each
> group so they read as a set. No labels or text — captions are added in HTML
> beneath. Warm cream card faces, muted red and charcoal suits, soft drop shadow
> under each group.

### Asset 3 — Printable worksheet page furniture (R6, one reusable set)

**Files:** `read/printables/frame-header.png`, `read/printables/frame-footer.png`
(A4-width, 300 dpi, transparent)

> Reusable decorative header and footer bands for printable A4 children's
> worksheets, transparent background, sized for A4 width at 300 dpi. Header: a
> shallow band of small friendly SnackPack-style motifs — a pencil, a star, a
> leaf, a smiling sun — spaced along a thin rounded rule, leaving the centre
> clear for a title to be typeset over. Footer: a matching thinner band, mostly
> empty, with two or three small motifs at the outer edges only. Print-safe: line
> art and flat fills only, no large dark areas, no full-bleed colour — this will
> be printed on home inkjets and must not drain ink. No text.

### Asset 4 — Printables shelf social card (R6)

**File:** `read/printables/social-card.png` (1200x630)

> A warm flat-illustrated social share card, 1200x630, for a free printable
> worksheets page aimed at parents and teachers of 4–7 year olds. Show a small
> stack of printed worksheet pages fanned slightly, one on top showing faint
> generic pencil-line marks (no readable words or numbers), beside a chunky
> child's pencil and a couple of scattered crayons. Cream (#FBF7EF) background,
> soft amber and sage accents, generous clear space on the right for a text
> overlay. Flat vector style, soft shadows, no text in the image, and no
> photographs of real children.

**Do not generate:** anything for the World Cup section (retired), any further
arcade game art (Section A is closed and A1–A8 are done), or any Thirteen *game*
art — the game page itself is finished and this audit changes only its copy.

---

## Implementation log — 2026-08-15

R1–R4 are implemented and verified. R6 is planned but not started (it needs the
Codex art below). R5 is a "stop doing" item with nothing to build. R7 is
deliberately deferred until the R1 result can be read.

### R1.1 — Thirteen title/meta/H1 — **done**

| | Before | After |
|---|---|---|
| `<title>` | `Play Thirteen (Tien Len) Online Free vs Computer \| No Ads — SnackPack` | `Thirteen (13) Card Game Online — Free, vs Computer \| Tiến Lên` (61 chars) |
| `<h1>` | `Thirteen` | `Thirteen (13)` |

Also: `alternateName` added to the `VideoGame` schema (`13`, `13 Card Game`,
`Tiến Lên`, `Tien Len`, `Vietnamese Cards`); the diacritic spelling added to the
lead paragraph and the how-to-play `<h2>`, with the unaccented form kept beside
it so both match; `og:title`/`og:description` brought in line.

The `— SnackPack` brand suffix was **dropped deliberately**. It cost pixels in a
61-character title on a property with essentially no brand search — "snackpack"
drew a single impression in 28 days. The numeral `13` earns that space instead,
since five of the eight ranking queries use it.

### R1.2 — `/guides/thirteen-tien-len-rules/` — **done**

The first guide on the property targeting a term we have *demonstrably* ranked
for. Covers the deal and the 3♠ opening lead, the full rank order, the suit
tiebreak, all six legal combinations, the three bombs, and how a round resolves.

**Every rule was read out of `play/thirteen/index.html` rather than from
general knowledge**, which matters because the two rule sets differ in ways a
generic Tiến Lên article would get wrong for this implementation:

- **Standard** — `rankValue()` puts 2 highest (`13*4+suit`), Ace next; suit
  order is ♠ < ♣ < ♦ < ♥; sequences and double sequences may not contain a 2;
  `canBeat()` allows exactly three chops — quad beats a single 2, 3 consecutive
  pairs (6 cards) beats a single 2, 4 consecutive pairs (8 cards) beats a pair
  of 2s.
- **Classic** — 2 becomes the *lowest* card, Ace highest, sequences may contain
  a 2 and may wrap around (`isCircularConsecutive`), and there are no chops,
  because there is no unbeatable card left to counter.

Cross-linked three ways: from the game page (above the back-to-arcade link),
from `/guides/`, and from the guide back to the game in three places.

### R2 — `scripts/build-play-links.mjs` — **done**

**102 Play links across 62 files** now carry
`&referrer=utm_source%3Dwebsite%26utm_medium%3D<surface>%26utm_campaign%3D<slug>`.
Surfaces: `arcade`, `guide`, `app-page`, `app-index`, `read`, `daily`,
`privacy`, `worldcup`, `home`, `site`. Wired into `site-check.yml` as
`--check`, and documented in `scripts/README.md`.

Four decisions worth keeping:

- **JSON-LD is skipped by construction.** Thirteen app pages carry the Play URL
  as the schema entity's `url`/`downloadUrl`. That is an identity claim about
  the app, not a click target. Handled by splitting the document on `ld+json`
  blocks rather than by regex lookaround, which would have been the sort of
  thing that works until one page nests a script tag differently.
- **`play/funnel.js` is tagged by hand and *asserted* by the script.** It builds
  its URL in JS, so no HTML walk can see it; the script fails if that hand-tag
  is ever dropped. Pages overriding it via `window.SP_PLAY_URL` are ordinary
  HTML and get tagged automatically — verified live: `/play/sudoku/` (no
  override) resolves to Vol 1 tagged `arcade/sudoku`, `/play/thirteen/`
  (override) to Vol 2 tagged `arcade/thirteen`.
- **Non-`referrer` query parameters are preserved**, so a deliberate parameter
  someone adds later is not silently eaten.
- The one pre-existing tag (`utm_source=worldcup` on the World Cup hub) was
  **absorbed into the common taxonomy** rather than left as a special case.

Verified a tagged URL returns HTTP 200 from Play, and that the referrer decodes
back to exactly the three intended UTM pairs.

### R3 — `APP7-LAUNCH-CHECKLIST.md` — **done**

Nine steps with ready-to-paste snippets, verified against how the twelve live
apps are actually wired. Package id `com.snackpackuniverse.mathematics`.

Two findings from preparing it:

- **`privacy/snackpack-7-mathematics/` is already correct** — same eight
  RevenueCat/purchase disclosures as the `snackpack-11-prehistoric-pals`
  reference. This is the P5 bug class (Zoo World and Garden World both claimed
  billing was not enabled when it was) and app7 does **not** have it. Recorded
  so nobody re-checks it on launch day.
- The checklist leads with **"do not start until the listing is live"**, because
  every step puts "live on Google Play" copy and a real store link on the public
  site.

### R4 — `scripts/notify-search-engines.mjs` — **done, and the plan was wrong**

R4 above proposed "a one-line `curl`/`fetch` ping in the existing deploy path".
**That approach no longer exists.** Verified today:

| Endpoint | Status |
|---|---|
| `google.com/ping?sitemap=…` | **404** — retired 2023 |
| `bing.com/ping?sitemap=…` | **410 Gone** |

So the script uses the two mechanisms that are actually live:

1. **Google** — Search Console API `sitemaps.submit`, using the service account
   that already holds Full permission. Key path via `SNACKPACK_GSC_KEY`; if
   unset, that half skips with a warning instead of failing the run. It also
   prints back what Google thinks it holds (last-downloaded, URL count, errors),
   so a silent no-op is visible.
2. **IndexNow** — covers Bing, Yandex, Seznam and Naver, needs no credentials.
   Bing is worth having: 841 impressions over ~6 months on a property Google
   barely crawls.

`900693c096558a71b548e48b92b33acd.txt` at the site root is IndexNow's ownership
token. **It is a public verification file, not a secret** — the receiving engine
fetches it to confirm we control the domain, which is why it is committed.

**Run it after the deploy, not before** — pushing URLs that are not live yet is
worse than not pushing at all.

### Verification

`check-site.mjs` clean on 168 pages · `check-javascript.mjs` clean on 35 files ·
`check-website-delivery.mjs` clean · `build-play-links.mjs --check` clean on 102
links · `build-game-counts.mjs --check` clean on 28 markers. The new guide was
loaded in a browser: all three JSON-LD blocks parse, no horizontal overflow at
1265px or at 375px mobile, six combination cards render, cream theme applies.

### Still open

- **R6 printables** — not started, needs Assets 3 and 4 below.
- **R1 art** — the guide currently reuses `/play/social/thirteen.png` as its
  `og:image`. Swap to Asset 1 when it lands, and add Asset 2 to the
  combinations section. Both are cosmetic; the guide is complete without them.
- **R7 Vol 2 ASO** — deliberately waiting on the R1 measurement.
- **Directory submissions and outreach** — still need you.

### Read the result on or after 2026-09-12

Four weeks of Search Console data, comparing against the measured baseline in
this document:

| Metric | Baseline (28d to 2026-08-12) | Watch for |
|---|---|---|
| `/play/thirteen/` CTR | **0.7%** (899 impr, 6 clicks) | anything above ~2% confirms the title thesis |
| `/guides/thirteen-tien-len-rules/` | did not exist | any impressions at all on `tien len` / `13 card game rules` |
| Sitemap last-downloaded | 2026-08-11, 4 days stale | should track deploys once the notify script is habitual |
| Play Console web referrals | **unmeasurable** | first ever non-zero `utm_source=website` |

That last row is the one that changes what gets worked on next. If the site
drives measurable installs, the arcade justifies further investment; if it
drives none after the funnel is finally instrumented, that is a much stronger
argument for the distribution work than any amount of further content.

---

# Re-audit 2026-09-14 — app-page freshness, motion media, and the measurement question

Scope: every page under `/apps/`, checked against the *actual* app source in
`C:\snackpack-universe\apps\*` (app.json versions, release notes, billing
constants, data files) rather than against memory or the last audit.

## What I checked and found **still accurate** — do not re-open these

Re-verified against app source, so no work is needed:

| Claim on site | Source of truth | Verdict |
|---|---|---|
| Vol 1 "24 classics" | `constants/games.ts` -> 24 ids | correct |
| Vol 2 "23 classics" | `constants/games.ts` -> 23 ids | correct |
| Vol 3 title list | `constants/games.ts` -> 24 ids | correct |
| Zoo World "68 animals", "38 free" | `constants/zooData/animals.ts` -> 68 | correct |
| Prehistoric Pals "55 species" | `ALL_DINOSAURS` -> 55 | correct |
| Homepage "13 apps" | 13 pages carry a Play link | correct |
| Play-link UTM attribution | 87/124 links tagged; the 37 untagged are **JSON-LD `url` fields**, not clickable links | complete — R2 is closed |
| Cloudflare beacon coverage | 265/265 pages | complete |
| Published payload vs the 1 GB Pages limit | ~92–170 MB git-tracked; the local 3.5 GB is `node_modules`, `.playwright-browsers`, and untracked Last Bastion masters | P1 is closed |

## A1. Badgify's page sells two products that no longer exist — **confirmed defect**

`apps/badgify/index.html` says, twice:

> Optional Lifetime Pro, **Monthly Pro** and **a single watermark-free export**
> are available

and

> Flexible ways to go watermark-free: Lifetime Pro, optional Monthly Pro, or a
> **single-certificate unlock** if you only need one right now.

Badgify 1.8.0's release notes say Pro was *"Simplified to one Lifetime offer"*,
and `apps/badgify/app/unlock.tsx` confirms it: the only purchasable item is
Lifetime Pro ("One payment. Lifetime access."), with the footnote *"Existing
subscriptions can still be restored."* `constants/billing.ts` still *documents*
four products, but that file's comment block is stale — the UI presents one.

So a visitor arriving from the website expecting a monthly plan or a
single-certificate purchase opens the app and cannot buy either. This is the
only place on the property where the site promises a transaction the app
refuses.

**Fix:** rewrite both sentences to a single Lifetime Pro. Keep one clause
noting existing subscribers can restore. Verify against `unlock.tsx`, not
`billing.ts`.

## A2. `/apps/snackpack-10-robot-recipe/` advertises an app that no longer exists

The site has a "coming soon" page for **Robot Recipe** as app 10. There is no
`snackpack-10-robot-recipe` in the repo. App slot 10 is now
`snackpack-10-logic-and-loops` (`Logic & Loops`,
`com.snackpackuniverse.logicandloops`, last touched 2026-08-24).

Meanwhile **`snackpack-14-store-keeper-tycoon`** (`Store Keeper Tycoon`, at
version **1.3.0** — the furthest along of any unreleased app) has **no page at
all**.

**Fix options, in preference order:**

1. Delete `/apps/snackpack-10-robot-recipe/` outright and let `404.html` handle
   it. Add nothing new until an app is actually submitted.
2. If a placeholder is wanted, rename the directory to
   `snackpack-10-logic-and-loops` and rewrite the copy.

Do **not** simply add a Store Keeper Tycoon placeholder — see A3.

## A3. Three vapourware pages cost crawl budget and earn nothing

`snackpack-5-tales-trivia`, `snackpack-6-creative-studio` and
`snackpack-10-robot-recipe` are ~7 KB stubs whose entire body is *"This page is
ready for screenshots, launch links, and final series-specific copy"* and
*"Screenshots will be added here once … is closer to release."* Tales & Trivia
and Creative Studio are both still at 1.0.0 with no versionCode and no store
directory — neither has ever been built for release.

The 2026-08-20 analytics baseline in this document already established that
crawl budget, not internal linking, was what kept pages out of the index. Three
zero-content pages in `/apps/` — a directory Google is being asked to crawl for
13 real products — is a direct tax on that.

**Recommendation:** delete all three, and remove their cards from
`apps/index.html`. Re-create a page the week an app is actually submitted to a
Play track, at which point it can ship with screenshots and a real listing.
This is the opposite of the usual "more pages = more SEO" instinct, and it is
what the measured data supports.

## A4. Four live/submitted apps have **zero screenshots on the site** — and the captures already exist

| App page | Screenshots on site | Captures sitting in the app repo |
|---|---|---|
| `snackpack-brain-games` (Vol 1, **2.1.1**) | **0** | 5 in `store/screenshots/en-US/` |
| `snackpack-brain-games-vol-2` (**1.13.1**) | **0** | 9 in `store/screenshots/en-US/` |
| `snackpack-8-earth-science` (1.0.0, live on internal) | **0** | 6 in `store/screenshots/web-preview/` |
| `snackpack-9-space-math` (1.2.0, production draft) | **0** | 8 in `store/screenshots/web-preview/` |

Vol 1 and Vol 2 are the two deepest products in the portfolio (24 and 23 games)
and their pages show only game *icons* — no proof the app exists or looks good.
This is the highest value-per-hour item on this list: the assets are already
made, sized, and reviewed; the work is copy, optimise, and wire.

**Fix:** copy into `apps/<slug>/screenshots/`, run the existing `webp` and
`optimize-images` generators, wire into the page's screenshot section, then
re-run the sitemap/related-games generators.

## A5. Every app screenshot on the site is from one batch on 2026-08-06

`git log` shows every `apps/*/screenshots/` directory was last committed
2026-08-06 (Mathematics, 08-12). Since that date these shipped:

| App | Then -> now | What changed that the page predates |
|---|---|---|
| Brain Games Vol 1 | -> **2.1.1 / vc35** | landscape fit across every board |
| Brain Games Vol 2 | -> **1.13.1 / vc26** | landscape fit, crossword packs |
| Brain Games Vol 3 | -> **1.7.1 / vc17** | landscape fit |
| Garden World | -> **1.6.1 / vc15** | 7 Garden Adventures, Night Garden sample, real store pricing, voice controls |
| Zoo World | -> **1.7.0** | Keeper Adventures |
| Prehistoric Pals | -> **1.9.0 / vc21** | the buy button actually works |
| Basic Math | -> **1.9.0 / vc21** | 3 guided journeys, refreshed Home, **all core difficulties free** |
| Spelling & Sentences | -> **1.9.0 / vc19** | 6 modules, **2 free modules + samples** |
| 123s Counting | -> **1.9.0 / vc27** | **all cards 1–30 free**, new Play screen |
| Badgify | -> **1.8.0 / vc16** | see A1 |
| Mathematics | -> **1.4.0 / vc10** | — |

The important subset is the **free/paid boundary changes** (Basic Math,
Spelling, 123s, Badgify). Those are the claims a visitor acts on. I checked the
123s and Basic Math pages: their copy is vague enough ("a single one-time
purchase unlocks the full library") to still be true, so only Badgify (A1) is
actually *wrong*. But all four now under-sell what is free, which is the wrong
direction for a portfolio whose measured problem is that nobody ever converts.

**Fix (copy only, no new assets):** add a concrete "what you get free" line to
Basic Math, Spelling and 123s, using the release-note wording. Refresh the
Garden World page for the seven Adventures and the Night Garden sample.

**Fix (assets):** re-capture screenshots only for Garden World and the three
Brain Games volumes, where the UI genuinely changed. The rest can wait.

## B. Do we need video, GIFs, or animation? — **No. Not now.**

The site currently has **zero** motion media anywhere: no `<video>`, no `.mp4`,
no `.webm`, no animated GIF across all 265 pages. The question is whether that
is a gap. On the measured evidence, it is not:

1. **Motion media is a conversion-rate lever, and conversion rate is not the
   bottleneck.** The 2026-08-20 baseline recorded 11 clicks in 28 days to the
   main site. Doubling the conversion of 11 visitors is worth nothing. The
   bottleneck is inbound traffic, and video on the page does not create it.
2. **The site already has something strictly better than a GIF.** 39 of 40
   arcade pages under `/play/` are *playable, offline-capable HTML* versions of
   the same genres the apps sell, and 39 of them link through to an app page. A
   visitor can play the real thing. No recording of a UI beats interacting with
   it.
3. **Motion media has real costs here.** Video and GIF are heavy; the property
   already has a size history (P1). Every recording is also a freshness
   liability — A5 shows a single screenshot batch already went 3–6 releases
   stale in five weeks. Video decays the same way and costs 10x more to redo.
4. **Where motion *would* pay is not the website.** Google Play listings accept
   a promo video, and that sits where the actual traffic is — the store page,
   not `snackpackuniverse.com`. If motion is going to be produced at all,
   produce it for the Play listing of the one or two apps with the most
   installs, and only *after* the measurement in section C says where the
   installs come from.

**Decision to record: no video, no GIF, no animation for the website.** Static
screenshots plus the playable arcade are sufficient, and the screenshot gaps in
A4/A5 are where the same hours produce more.

The one cheap exception worth considering later, if a page ever needs motion:
CSS-animated SVG (a few KB, theme-aware, no decode cost, editable in a diff).
Not a video pipeline.

## C. Do we wait a month for Cloudflare? — **No, because a measurement is already due**

The previous section of this document set a decision date:

> **Read the result on or after 2026-09-12** — four weeks of Search Console
> data, comparing against the measured baseline in this document.

That date passed **two days ago** and the read has not happened. Waiting another
month does not add information; it delays acting on a window that has already
closed. It also stacks two measurement periods on top of each other, which makes
both harder to attribute.

There is also a limit worth being explicit about: **Cloudflare Web Analytics
cannot answer the question that matters.** It measures visits to the website. It
cannot see whether a visit became a Play install. The
`referrer=utm_source%3Dwebsite` tagging (now confirmed complete on all 87
clickable Play links) reports into **Play Console -> Acquisition -> Traffic
sources**, and that is the number that decides whether any further website work
is justified.

**So the order is:**

1. **Read the 2026-09-12 window now** — the four rows already specified in the
   previous section (thirteen CTR, the tien-len guide's first impressions,
   sitemap freshness, and first non-zero `utm_source=website` in Play Console).
2. Do the zero-risk work in section D while that read happens — it is all
   correctness and already-made assets, and none of it perturbs the experiment.
3. **Then** decide on anything speculative, including whether the arcade earns
   further investment.

## D. Task order

**Do now — correctness and already-made assets, no new decisions required:**

0. Commit or discard the uncommitted truth-pass already sitting in the working
   tree (8 files: `apps/index.html`, apps 7/8/9/11/12, `index.html`,
   `llms.txt`). It corrects overclaims on Zoo World and others and should not
   sit unreviewed. Check whether a parallel session owns it before committing —
   this has bitten this repo before.
1. **A1 — Badgify pricing.** The only outright false claim on the property.
2. **A4 — wire the four missing screenshot sets.** Assets already exist;
   highest value per hour on the list.
3. **A2/A3 — delete the three vapourware pages** and the dead Robot Recipe slug.
4. **A5 copy pass** — free-tier lines for Basic Math, Spelling, 123s; Garden
   World's Adventures and Night Garden.

**Do next — after the section C read:**

5. Re-capture screenshots for Garden World and Brain Games Vol 1/2/3.
6. Re-run the five idempotent generators (sitemap, breadcrumbs, related-games,
   webp, optimize-images) and `check-site.mjs`.
7. Decide on Store Keeper Tycoon's page — **only** once it is submitted to a
   Play track.

**Explicitly not doing:**

- Any video, GIF, or animation production (section B).
- Adding placeholder pages for unreleased apps (A3).
- A second measurement wait before acting on the first (section C).

## Open question for Mark

`play/last-bastion/` holds ~3.1 GB of untracked local masters (`art/`,
`desktop/`, `dev/`). Memory records these must never be deleted or downscaled
because of the 4K Steam port. They are correctly untracked and do not affect the
published site — flagging only so a future "clear space" pass does not touch
them.

## Implementation log — 2026-09-14, same day

Items 0–4 above are done and pushed. Two corrections to the audit itself, and
four defects that only surfaced while implementing.

### Where the audit above was wrong

**A4 overcounted the missing screenshots.** It claimed Vol 1, Vol 2, Earth
Science and Space Math all had zero screenshots on the site. Only the last two
did. The audit counted `apps/<slug>/screenshots/` and missed that Vol 1 and
Vol 2 use `apps/<slug>/assets/screenshots/` instead — Vol 2 references three of
them on the page, and Vol 1 has five files committed. A reference check across
every app page found **0 broken image references out of 505**, which is the
check that should have been run first. Counting files in one guessed directory
is not the same as checking what a page actually loads.

**A4's remaining half turned out to be unpublishable, not merely unwired.**
The captures exist, but:

- *Space Math* — held back entirely. `library.png` and `stories.png` render
  blank grey rectangles where book and story covers belong (the web-preview
  export does not bundle the cover art), and `games.png` is dominated by two
  greyed-out locked cards. These are QA captures, not marketing assets.
- *Earth Science* — three of six published. `home.png` states "5 Mini Games"
  and "20 Expedition Packs"; `constants/miniGames.ts` records those exact
  figures as hand-maintained literals that had drifted, since replaced by
  derived counts of twelve and twenty-eight. Publishing it would have put a
  known understatement of the app on the live site.

The general lesson: a capture is evidence of what *some* build displayed, not
of what the current one does. Check the derived value in source before
publishing a screenshot that states a number.

### Defects found while implementing, all fixed

**1. Badgify was underselling its own free tier.** A1 above caught the two
phantom products. While verifying the replacement copy against `unlock.tsx`, a
third and worse error appeared: the page said free templates "are watermarked
but usable right away". `showWatermark` is hardcoded `false` in both
`CertificateCanvas` consumers, and `appConfig.ts` comments that "Free templates
now export clean PNGs, so the old watermark-triggered nudge has no truthful
trigger." Free exports are clean. The page was inventing a restriction that
does not exist — the opposite of the error worth worrying about, and a direct
disincentive to download.

**2. Fourteen privacy pages had a structurally broken `<head>`.** Two
malformed tags, both in generated markup:

- `<link rel="canonical" href="...">` was missing its closing bracket, so the
  `og:*` metas that followed were parsed as *attributes of the link element*.
  `og:title` was swallowed on all fourteen: shared links showed no title.
- A stray `>` after the `twitter:image` meta then appeared as text inside
  `<head>`, which terminates the head. The favicon, both font preloads, both
  stylesheets, the web manifest and the apple-touch-icon were all reparented
  into `<body>`, and a literal `>` rendered as the first visible character on
  the page.

Verified with parse5 before and after. A scan of all 269 pages now finds no
stylesheet stranded in body and no stray text node. **This is the highest-value
find of the session and nothing in the audit predicted it** — the existing
`check-site.mjs` validates links, images, JSON-LD and required meta *presence*,
but never asked whether the head parses. Worth adding.

**3. Mathematics is live on Google Play and the apps index was hiding it.**
Verified on the listing itself — Install button, in-app purchases. Its own app
page has said "Live on Google Play" all along, but `/apps/` filed it under
"More apps coming" with a `Pre-launch` tag, and `llms.txt` counted it among the
in-development apps. The one product on the site that is live, monetised and
not being sold. It now has a full featured card; `build-go-links` generated its
interstitial, so the click is attributable like every other.

**4. The roadmap named an app that does not exist.** Slot 10 is Logic & Loops
(`com.snackpackuniverse.logicandloops`), not Robot Recipe. Store Keeper Tycoon —
at 1.3.0, the furthest along of the unreleased apps — was missing entirely.
Both corrected; cards without a page are no longer links.

Smaller: Badgify's card on `/apps/` said 135 templates in three places against
the app's actual 157.

### Verified accurate — do not re-audit

Checked against app source this session and correct: Vol 1 "24 classics"
(`games.ts`, 24 ids), Vol 2 "23", Zoo World "68 animals / 38 free"
(`animals.ts`, 68) and "11 games" (`ALL_GAMES`, 11), Prehistoric Pals "55
species" (`ALL_DINOSAURS`, 55) and "132 Field Notes" (`ALL_DAILY_FACTS`, 132),
Badgify "157 templates / 11 categories", homepage "13 apps" (13 Play links).
Internal links: 5,937 checked, zero broken. Play-link attribution: complete.

Two near-misses worth recording, because both looked like bugs and were not:

- `PREMIUM_CHALLENGE_PACKS` appeared to hold 64 packs against only 28 `ROUTES`
  entries, which would crash `expeditions.ts` at module load. It holds 28 — the
  other 36 ids belong to `PREMIUM_JOURNAL_PROMPTS` further down the same file.
- `privacy/snackpack-8-earth-and-explorer/` looked like an orphan. It is a
  deliberate "Moved:" redirect to the current Earth Science policy.

### Still open

- **Earth Science's question count.** The page says "901 explained questions";
  the app's Explore header derives `SCIENCE_QUESTIONS.length +
  FACT_OR_FICTION.length` and rendered 957 in the capture. Static analysis could
  not settle which is current — the arrays are assembled from several sources
  including `contentExpansion.ts`. Neither number was changed. Resolve by
  reading the value off a running build.
- **Logic & Loops has no privacy page at the URL it points at.** The app
  references `snackpackuniverse.com/privacy/snackpack-10-logic-and-loops`,
  which the site does not serve; only the obsolete `snackpack-10-robot-recipe`
  policy exists, and it names Robot Recipe fifteen times. This is a Play
  submission blocker for that app. Writing the replacement needs a real audit of
  what Logic & Loops actually collects, so it was not fabricated here.
- **Space Math and Earth Science need real device captures** before either page
  can show a full screenshot set.
- **`check-site.mjs` should assert that `<head>` parses.** Defect 2 lived
  through every previous audit because no check ever looked.
- The section C measurement — still the thing that decides what comes next.

---

# Task ledger — 2026-09-14, end of session

Everything below is current as of the last push. Items are grouped by whether
anyone needs to do anything, not by when they were found.

## Closed this session

| # | Item | Where it ended |
|---|---|---|
| 0 | Uncommitted truth-pass (Earth Science + Space Math privacy, app-page copy) | committed `310b0070` |
| 1 | Badgify sold two products that no longer exist, and called free exports watermarked when they are clean | committed `adf93413` |
| 2 | Earth Science had no screenshots | three publishable captures wired, `7bd5e2fe`; the other three held back and why is recorded |
| 3 | Three empty "coming soon" app stubs; roadmap named a dead app | deleted + roadmap corrected, `43feb211` / `b3ada4c9` |
| 4 | Free-tier copy vague on 123s, Basic Math, Spelling; Garden World missing two releases' headline features | committed `aaf51da1` |
| 5 | **14 privacy pages had a `<head>` that broke into `<body>`** | fixed `43feb211`, guard added `6338ff2f` |
| 6 | **Mathematics was live on Play but filed as pre-launch** on `/apps/` and in `llms.txt` | promoted `b3ada4c9`; the same staleness in `build-privacy-cta.mjs` fixed in `bc369277` |
| 7 | Logic & Loops had no privacy page at the URL it points at | written and live, `bc369277` / `fed660fb` |
| 8 | **Logic & Loops had no parental gate** | added `2715f5e22`; policy updated to match, `2df7467e` |

## Open — needs a person, not a session

1. **Read the measurement.** The decision date set in the 2026-08-15 section was
   **2026-09-12**. It has now been open for two days and nothing downstream
   should be planned until it is read: the four rows are `/play/thirteen/` CTR,
   first impressions on the tien-len guide, sitemap freshness, and the first
   non-zero `utm_source=website` in **Play Console → Acquisition**. Cloudflare
   Web Analytics cannot answer the last one and it is the one that matters.
2. **Earth Science's question count.** Page says "901 explained questions"; the
   app's own Explore header derives `SCIENCE_QUESTIONS.length +
   FACT_OR_FICTION.length` and rendered **957**. Static analysis could not settle
   it — the pool is assembled from several files including
   `contentExpansion.ts`. Neither number was touched. Read it off a running
   build, then fix whichever is wrong.
3. **Device captures for Space Math and Earth Science.** The existing
   `store/screenshots/web-preview/` sets are not publishable: Space Math's
   render blank grey where cover art belongs and its games screen is dominated
   by locked cards; Earth Science's home screen states counts the app's own
   source records as since-corrected. Three Earth Science captures are live; the
   rest needs a real device.
4. **Decide whether Logic & Loops ships.** It now has a privacy page and a
   parental gate, which were the two compliance blockers. It is still 1.0.0 with
   no versionCode and has never been built for release.

## Open — mechanical, safe to pick up any time

5. **`npm ci` in `apps/snackpack-10-logic-and-loops`.** `node_modules` is
   incomplete: `tsx` is absent so **every** `audit:*` script silently cannot run
   (including `audit:privacy`, the one that guards the no-network property the
   new policy depends on), and `jest-expo` is absent so the test suite cannot
   run at all — including the `__tests__/ParentalGate.test.ts` added this
   session. Typecheck currently reports 1,485 errors, 1,481 of them from missing
   test types. This is the portfolio-wide false-PASS pattern; here it is
   actively hiding whether the new gate's test passes.
6. **Run the gate on a device.** The gate's logic was verified in node (200,000
   generated targets, zero round-trip failures, six-word minimum) but the
   component itself has never been rendered — no emulator on this machine. Check
   the keypad auto-submit, that Cancel returns you to Settings rather than
   dismissing the screen under it, and that the modal is readable in all four
   colour schemes.
7. **Storage keys still carry the old app name.** `snackpack.robotrecipe.*`,
   `BACKUP_APP_ID = 'snackpack-10-robot-recipe'`, the backup prefix
   `SNACKPACK_ROBOT_RECIPE_BACKUP_V1:` and the `rr-` profile-id prefix all
   predate the rename. Invisible to users and **deliberately left alone** —
   renaming them strips existing progress and invalidates every backup code
   already in circulation. Recorded so a future tidy-up does not do it by
   accident.
8. **`privacy/snackpack-10-robot-recipe/` is now a policy for a product that
   will never ship.** It is unlinked from `/apps/`, still in the sitemap, and
   described on the privacy hub as superseded. Either leave it (harmless, one
   crawled page) or convert it to a "Moved:" redirect at the Logic & Loops
   policy, the pattern `privacy/snackpack-8-earth-and-explorer/` already uses.

## Open — judgement calls I deliberately did not make

9. **Two achievement shares in Logic & Loops are still ungated**
   (`app/(tabs)/learn.tsx` and `app/pack/[packId].tsx`). Both send a plain
   progress summary to the share sheet and carry no personal data, and both are
   kid-facing "share your win" moments that a gate would spoil.
   `snackpack-8-earth-science` gates its share sheet, so there is a consistency
   argument for gating these too — it is a product call, not a compliance one.
10. **No parental gate exists in Zoo World**, and this session only checked
    Logic & Loops. Memory records three apps in a row each having exactly one
    ungated outbound link. A sweep of `Linking.openURL` across the whole
    portfolio, checking for a gate in the same file, is the cheap version of
    that audit and has not been run.
11. **A Data Safety form still needs filling for Logic & Loops.** The app's own
    `STORE_PRIVACY_LABELS_DRAFT.md` walks all 14 Google categories to "No" and
    that matches what I verified, but the form itself is a human step in Play
    Console and the draft says so.

## Recurring traps re-confirmed this session

- **Presence is not parses.** Every check passed on 14 pages whose `<head>` was
  being thrown away. `check-site.mjs` now asserts the head tokenises; the
  general lesson is that a green check is evidence about what it tests and
  nothing else.
- **Generators outrank hand edits.** A hand-repaired dead link was silently
  undone by re-running `build-privacy-cta.mjs`. If a page is generated, fix the
  generator or the fix has a half-life of one command.
- **Docs and store captures go stale; source does not.** Earth Science's home
  screenshot and `constants/billing.ts` in Badgify both described products that
  had changed. Verify a number in the code that renders it.
- **Never `git checkout -- .` in this repo.** It destroyed ~28 uncommitted files
  belonging to the parallel Codex session; all but one were recovered from loose
  objects under `.git/objects` by mtime. Name paths explicitly.

---

# Arcade audit — /play/, 2026-09-16

Swept all 41 game pages plus the hub, daily and stats. Four issues; three
fixed, one needs a Linux runner.

## Fixed

**Flag Frenzy's Status clue had the losing finalist still in the tournament.**
`computeStatus` decided a knockout tie was finished by whitelisting `"FT"` and
`"FT-Pens"`. The feed also uses `"AET"` — five ties, the 2026 Final among them —
so those read as still being played. Six of 48 teams were labelled "Still in"
two months after the tournament ended, including Argentina, who *lost* that
final. Now decided by the presence of a `winner`, which `wc-knockout.js` already
did and which cannot rot when the feed adds a status code.

Two things came out of fixing it:

- A team's exit is the last tie it **lost, ignoring the third-place playoff**.
  Counting the playoff labelled the fourth-placed side "Out · Third place" while
  the side that actually finished third read as going out a round earlier.
- The clue now compares the **stage reached** rather than a bare in/out. With
  the tournament complete, in/out was green for ~96% of team pairs and carried
  almost no information; by stage that is 24%. Reads the same way mid-tournament.

Copy went with it: the page described a live tournament ("still alive", "right
now") and claimed clues "update automatically as the real tournament results
come in", which stopped being true when the feed froze on 2026-07-19. Also added
the `FAQPage` schema this page was the only one of forty game pages to lack.

Verified in the browser against the real feed: Spain reads Champion, Argentina
Out · Final, England and France both Out · Semi-finals, Qatar Out · Group Stage.

**Three download funnels offered the wrong app.** `funnel.js` defaults its "get
the app" target to Brain Games Vol 1 and a page overrides with
`window.SP_PLAY_URL`. Three never did:

| page | ships in | funnel pointed at |
|---|---|---|
| golf-solitaire | Vol 2 | Vol 1 |
| snackwords | Vol 2 (`snackwords-daily`) | Vol 1 |
| pyramid | Vol 3 | Vol 1 |

Worse than no funnel: it recommended the wrong product to someone who had just
demonstrated interest in a specific game. Found by cross-checking every arcade
slug against the `games.ts` id lists of all three volumes, not by reading pages.
Those three were the only mismatches — the other 15 pages without an override
are correct, because no app ships their game (the soccer set, Flag Frenzy,
TriPeaks).

## Open — needs a Linux runner

**The arcade visual check has been red since 2026-09-06 and is giving no
signal.** Hub baselines were last updated 2026-08-29; the hub changed on 09-06
and 09-12. The failure is a *size* mismatch (1280x4367 → 1280x4392), so it is
genuine layout drift, not antialiasing.

Do **not** fix it with `npm run test:visual:update` on Windows. Measured on the
same commit: CI (Linux) fails 6 of 49, all hub. A Windows box fails 15 — the
same 6 plus 2048, solitaire and water-sort on mobile. Those nine are correct in
CI and outside tolerance on Windows, so re-baselining here would fix the hub and
break them. Baselines are shared across platforms (`snapshotPathTemplate` has no
`{platform}`) and were generated on Linux. Written up in `scripts/README.md`,
including how to tell a stale baseline (size mismatch) from a platform
difference (pixel ratio at matching dimensions).

## Checked and sound — do not re-audit

- `check-site` clean across 259 pages: no dead links, no missing assets, heads
  intact.
- Game counts current; `build-game-counts --check` passes.
- 40 of 41 game pages already carried `HowTo`/`FAQPage` schema, related-games
  blocks and real SEO prose. Flag Frenzy was the only gap and is now closed.
- TriPeaks' generic "bigger offline collection" pointer to Vol 1 is accurate —
  it does not claim Vol 1 contains TriPeaks, and no app does.
- Last Bastion's page is a bare game mount with no nav, but that is deliberate:
  a 15.9 KB guide at `/guides/free-browser-roguelite/` carries its SEO and links
  to it four times. Worth a back-link into the arcade at most; it is also
  Codex's game.
- The World Cup pages themselves are fine — they decide by `winner`, which is
  why only Flag Frenzy had the AET bug.

## Note on the working tree

26 `play/` pages plus `play.css`, `game-ui-assets.js` and a new
`scripts/check-game-ui-bootstrap.mjs` have been sitting uncommitted for two days
— the parallel session's arcade game-UI bootstrap. Flag Frenzy and SnackWords
were among them, so their one added line was lifted out before editing and
restored afterwards, byte-exact and in the same position as the other 24 pages;
`check-game-ui-bootstrap.mjs` still passes at 38 playable pages. Nothing of
theirs was committed. The archived plan docs under `play/docs/archive/2026-08/`
are a move, not a deletion.

Unrelated: a stray `node.exe` was squatting port 4179 serving Atlas Quest, which
made local previews 404. Atlas Quest is configured on 4178, so it is a leftover
process rather than a config collision.
