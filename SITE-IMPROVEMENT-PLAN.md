# Site improvement plan — whole property, 2026-08-07

Scope note: this covers **the site as a whole**. The 34-game arcade has its own
document, [`play/ARCADE-IMPROVEMENT-PLAN.md`](play/ARCADE-IMPROVEMENT-PLAN.md),
whose earlier Section B work is closed and whose current board covers release,
audio, daily-hub, verification, delivery-payload and distribution tasks. This
plan is deliberately *not* more arcade polish — the three items at the top were
found by auditing the property outside `/play/`, and each outranks another guide.

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
instead of publishing every app asset. See `play/ARCADE-IMPROVEMENT-PLAN.md` D1.

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

`ARCADE-IMPROVEMENT-PLAN.md` A8 and `CODEX-ASSETS-REQUESTED.md` both mark the
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
