> Historical snapshot archived 2026-10-19. Completed phase tables contain superseded holds. Use `READ-PLAN-2026-10.md` at the website root for current tasks.

# /read/ — plan of record

Updated 2026-10-18. This is the **current** plan: what is live, what
is open, and the rules for adding to the shelf. The day-by-day build log, with
every decision and measurement behind it, is archived at
[`docs/archive/READ-PLAN-2026-10-15-build-log.md`](docs/archive/READ-PLAN-2026-10-15-build-log.md).
What shipped, in release form, is in [`docs/RELEASE-NOTES.md`](docs/RELEASE-NOTES.md).

## Why /read/ matters

On 2026-10-15 `/read/` was the busiest and fastest-growing part of the site
(hub 130 → 540 views in 30 days; mobile tripled; ChatGPT referrals 20 → 70).
The growth came from **links shared between parents and teachers**, not search:
Google showed `/read/` only 2 impressions in 90 days. So the priorities are
books worth sharing, easy sharing, and a good read on a phone, in that order.

**Hard rule:** no sign-up, email capture, interstitial or ad anywhere in
`/read/`. Being free with no friction is why it gets shared.

## Status at a glance

### Current expansion decision - 2026-10-18

Mark approved the app-first improvements and chose to complete and publish
one full ABC book now. This supersedes the older open decisions below.

- **Cereal-Swimmer:** a full six-page read found more than the octopus issue:
  missing number sequences and the wrong direction/gate tasks. All six pages
  are redrawn and wired in the Counting app; the reviewed importer pins them.
- **Short reads:** Star Watch, Lionnaise and the Dragon, Garden Morning and
  Helping Day are rewritten in the Spelling app with the same pictured beats.
  Six primary end questions now ask for reasons or consequences (Playground,
  Trail Clues, Ocean Adventure, Garden Morning, Helping Day and Star Watch).
  Re-imported app text, prompts, answers and explanations remain the source.
- **One complete ABC book:** Panda-Cake has all 26 pages, with 21 new images
  after the audit found three existing pages needing replacement as well as
  18 missing letters. A/F/M/U/Z remain. No emoji placeholders or partial taster.
  `import-alphabet-book.mjs` checks the current exported app words, all 26
  artwork mappings and reviewed image hashes. New ABC shelf group/filter.
- **Printables:** the PDF builder now prints each page's story text beneath
  its picture. The two new books and seven affected short reads have rebuilt
  PDFs; the complete A-Z printable stays below 3 MB.
- **15 November:** measure books per visit, internal referrals, ABC discovery
  and Animal Architects engagement before commissioning the other four ABC
  books or more Zoo art. A larger search market is a hypothesis, not verified
  demand. Revenue quoted in the recommendation was not rechecked here.
- **Pro/Zoo:** do not change app tiers or publish more Pro books now. Quality
  read Booklava and the Number That Hid before any later free-web decision.
  If animals warrant a next book, prefer Ocean Dive or Jungle Secrets;
  Safari Morning needs its app text fixed first. Keep the existing re-measure.

This delivery brings the shelf to **43 books and 43 PDFs**: one complete ABC
book, 6 decodables, 6 Reading Trail books, 12 short reads, 16 number stories,
one animal fact book and one read-aloud picture book. App changes ship with
their next Claude-owned builds. The older phase tables retain their history.

| Area | State |
|---|---|
| Shelf | **43 books**, 43 PDFs: Alphabet books (1) · Stage 1–3 decodables (6) · Reading Trail steps 1–6 · Short reads (12) · Number stories (16) · Animal fact books (1) · Read-aloud picture books (1) |
| Hub | Stage-ordered groups, stage shortcut chips, ItemList schema, "Save the bookshelf for offline" |
| Every book | Next-story chain, Share button (top and end), 1200×630 share card, printable PDF, Read to me, One page at a time |
| Number stories | Tap-to-answer question on every page, plain-list + "Show the answer" fallback |
| Printables | `/read/sound-cards/`: 8 sheets, Stage 1 → word endings, one A4/Letter page each |
| Homepage | `#read` section with six real books and the live shelf count |
| Search | Hub title "Free Decodable Readers & Printable Phonics Books"; all pages submitted to Google, Bing and IndexNow |

## Next round: review, fixes, improvements and new books (planned 2026-10-15)

Grounded in a content review of all 17 live books (live pages checked in
Playwright, text diffed against each app's source) and an inventory of every
app's illustrated books. Work top to bottom: each phase is independent of the
ones below it.

### Phase A: fix what the review found (no decisions needed)

**Status 2026-10-15: A1–A4 DONE** (see `docs/RELEASE-NOTES.md`). A5 waits on
Mark's device check. Decodable end questions live in `QUESTIONS` in
`import-decodable-book.mjs`; that importer's template is stale, so use it for
new books only.

| # | Finding | Fix |
|---|---|---|
| A1 | **Ted-E-Bear's Short-Vowel Kit differs from the app on all 5 pages.** The app text was rewritten after the August import. The web copy uses words a short-vowel reader cannot decode yet (props, clips, grins, snug, slips). | Re-import from `reading-trail-drafts.ts` with `import-reading-trail-book.mjs` (add a `BOOKS` entry, keep the slug), rebuild its PDF, re-check the highlights. The other 12 phonics books match the app word for word. |
| A2 | **5 of 6 decodables have no end-of-book question** (only Pip Sits has one, written for the web in August). The app data has none to copy. | Write one comprehension question per book from its own text, in Pip Sits's format. This is web editorial, like alt text: decodable words only, plus the answer. |
| A3 | **4 images have missing or under-15-character alt text** (Bug in a Cup ×1, Nan and Pip ×2, The Cat and the Rat ×1). **Each Reading Trail book uses page 1's art as its cover with the same alt text**, so screen readers hear it twice. | Describe the four pictures. Set the title image's `alt=""` where it repeats page 1. |
| A4 | **The printable-readers guide still says "Eight free printable readers"** in its title, H1, description and schema. The shelf is 17 books plus sound cards. | Refresh the guide's copy and book list to the current shelf, keeping the URL. It is the one `/read/` page with Google clicks, so change the copy, not the structure. Re-check in Search Console two weeks later. |
| A5 | **Read to me has only been tested with a stub engine.** | Mark: try it once on an Android phone and an iPhone/iPad. iOS Safari fires fewer word-boundary events, so highlighting may lag; if it does, highlight by sentence there. |

### Phase B: add books (free tier, after a quality read)

Same rules as always: every page illustrated, a quality read of every page and
picture, text verbatim, and nothing Pro without Mark.

| # | Source | What is there | Plan |
|---|---|---|---|
| B1 | **1-2-3 Counting**, free | 2 stories: `panda-cake-market-basket`, `sub-zero-snowflake-post` | **Read 2026-10-15: neither publishable; app fixes owed.** Panda-Cake's art mapping in the app is shifted one page (pages 2–5 show the wrong picture; page 2's image is an off-model panda with a dolphin), and page 5 has no art of its own. Sub-Zero's pages 1–5 show a scarf penguin, while page 6 shows the canonical chef-hat Sub-Zero, and page 2's sleds carry shapes, not numbers. **Update 2026-10-16:** the mapping is fixed in the app (monorepo `63ac293f1`; `npm run verify` passes). Images `-2`, `-3` and `-4` now sit on pages 2–4, and the off-model `-1` image is no longer used. Page 5 stays without art (`PENDING_PAGE_ART` in `audit-story-assets.js`). A second look found more: Panda-Cake wears a chef's hat and red neckerchief on pages 1 and 3 but an orange scarf on 2, 4 and 6, and page 6 shows 10 friends and about 7 plates for "twelve places". Sub-Zero's page 6 shows 18 snowflakes for "fifteen", sits outdoors instead of at the post desk, and leaves Booklava out. All of it is in the art brief (see B4). **Update 2026-10-17: the other free Counting books were read too, and there is now an importer**, `scripts/import-counting-book.mjs`. It pins the reviewed file for every page and refuses a page whose art changed since the review. **Luckybug's Pairing Parade passes** every count and question, and it rendered and answered correctly at phone width (not published). It waits on one thing: Flutter-Butter on pages 1 and 3 is a purple butterfly, not the canonical one already on the shelf, so both pages were added to the brief (§8). **Rejected, owed app fixes:** Corgi's Ten-Frame Picnic draws the text's Ted-E-Bear as Bottle-Nose on all six pages, has no sideways frame on page 4, shows 8 of 12 spaces on page 5 and 7 of 11 on the "complete ten-frame" of page 6. Honey-Beats and the Number Neighbours draws Flutter-Butter as Bottle-Nose, its stones carry no numbers, and page 4's reversed stone is missing. Cereal-Swimmer's octopus changes design on page 3. Fixing those two would take about 12 new images: a Mark decision, not briefed. |
| B2 | **Sentences & Spelling short reads**, free | 60 four-page books, all fully illustrated | **DONE 2026-10-15: 12 published** as the new "Short reads" group (`import-reading-trail-book.mjs`, `source: "short"`). All 60 were read. #34–60 are weaker vocabulary/science books with factual errors: butterfly "cocoon" (it's a chrysalis) and "a larvae", honey "made from pollen", a sunflower blooming in 3 weeks, "every word in every language has a vowel", a child's heart rate of 60, a glacier "older than mountains", an octopus glowing. Rejected, plus #17 (pseudo-science) and #27/#28 (Biscuit-Bouncer and Hop-Tart change pronoun versus books already on the shelf). Of 21 art-checked, rejected for mid-book character changes: Blanket Fort, Library Day, Moonlight Story; Garden Race (its Centi-Peed clashes with the shelf's). **Reserve** (passed both reads; add if the 2026-11-15 re-measure shows multi-book sessions): Mountain Climb, Coral Reef, Luckybug's Art Gallery, Corgi's Countryside Run, Slow and Steady. |
| B3 | **Zoo World animal books** | 16 books, 9 pages each | **DONE 2026-10-16: Animal Architects published** as the first "Animal fact books" book, after Codex generated the 6 missing pages (all 9 now original; the gate in `import-zoo-book.mjs` checks it). New shelf group `animals` and an "Animals" type filter; pages render uncropped (`story-pages-natural`). The other 4 free books stay out (stock photos). History: (1) **Free:** 5 of 16: Safari Morning, Ocean Dive, Jungle Secrets, Farm Friends, Animal Architects. (2) **Art:** the premise "generated illustrations" was wrong. Bundled page images are mostly stock photos, which the reader shows instead of live Unsplash (`constants/unsplashBundledImageCredits.ts`, `assets/books/GENERATED_ART.md`). Four free books are 100% Pexels/Unsplash photos. Animal Architects has 3 generated images (cover, weaverbird p4, ant colony p8) and 6 stock or app-gallery photos. No book is fully original art. Pro books mix in Wikimedia CC BY, CC BY-SA 2.0/3.0 and public-domain images; 5 newer Pro books have no credit entries in that file. Republishing is probably licence-permitted (Pexels and Unsplash allow it; CC needs per-image credit and share-alike), but it would make /read/ a photo site with per-image credit upkeep, and it rests on uploaders' rights to the stock photos. (3) **Facts:** `validate-zoo-data.js` (54 rules), `audit-cross-surface.js --strict` and `lint-strings.js` all pass. (4) **Quality read:** Animal Architects is strong (tight, accurate). Safari Morning is decent but has 90–120-word pages, a misleading "decided by a shared cold" (wild-dog sneeze vote) and a muddled harpy-eagle cameo on p5. **Mark chose 2026-10-16: make Animal Architects fully original, then publish.** Status: **waiting on 6 generated images** (pages 1, 2, 3, 5, 6 and 7). There is no image-generation route in Claude's sessions, so the brief is `apps/snackpack-zoo-world/docs/ART-BRIEF-ANIMAL-ARCHITECTS-2026-10-16.md`, for Codex. `scripts/import-zoo-book.mjs` is ready. It refuses any image not recorded in the app's `GENERATED_ART.md` (page 9 passes as a byte copy of the generated cover). It renders in the landscape layout used by the Button Trail (`story-hero-landscape`, `story-pages-landscape`, `story-long-copy`) and lists the app's fact sources. It was test-rendered locally, not published. **To publish once the art lands:** run the importer with `--write`, then build-webp, build-read-pdfs and build-read-responsive. Add a SHELF entry (new group "Animal fact books" with a new filter kind, ages 6–9), then run build-read-shelf, social cards, breadcrumbs, play/go links and the sitemap. Nit for the app: page 3 opens with an unnamed "Buzz over here." |
| B4 | Held-back books, once their app fixes land | Pork-ulele, Wise Owl, Ted-E-Bear's Lantern, Booklava, Vincent Van Mouse (Basic Math); Panda-Cake, Sub-Zero (Counting, B1); Pocketful of Sounds and 5 ABC books (ABCs) | **Checked 2026-10-16: no fix has landed; nothing to import.** No commits touch ABCs or 1-2-3 Counting since the holds. Basic Math's only change is the US-grade fix (b84f02eab). No asset files in the three apps changed either. The two fix tasks proposed on 10-15 (Basic Math stories, Counting art) were never started. Spot-checked in source: Wise Owl p1 still asks "Which pair…?" with the single answer 6, p2's prime explanation is unchanged, and Panda-Cake's ABC lines still say "his" under "Discovers Her ABCs". Most of what remains is **art** (Pork-ulele's clock, Lantern/Booklava/Sub-Zero redesigns, Vincent's 3 missing pages, Panda-Cake's mapping and page 5, Pocketful's 7 pages), so it goes through Codex like B3. The text fixes (Wise Owl, ABC pronouns, fragments and remixes) can be done in a Claude session. Re-check after either lands. **Update 2026-10-16: one Codex brief covers all remaining art**, `docs/ART-BRIEF-STORY-GAPS-2026-10-16.md` at the monorepo root (35 images, 7 books). Viewing every page found more than the holds listed: Lantern's Ted and Honey-Beats are on-model only on pages 1–3 and 6. Booklava is the canonical brown owl in a purple jumper only on pages 1, 3 and 6. Pork-ulele and Cluck O'Clock change outfits on pages 2, 3, 5 and 6, and page 5's clock shows neither 3:30 nor 4:30. Lantern's and Nest's page 1 are portrait, which `import-math-story-book.py` would squash to 1200×800, so both are redrawn as landscape. Pocketful's one interior image (mapped to page 3) shows a picnic with a spaniel, not the path, so all 8 pages are briefed. Counting and the ABCs featured story have no /read/ importer yet. **Update 2026-10-16: the ABC text fix has landed** (monorepo `f2e21e7d5`, `apps/snackpack-1-abcs-alphabet/constants/alphabet.ts`; `npm run verify` passes). All 130 lines in the 5 free books (Panda-Cake, Eggs-Benedict, Meow-inara, French-Toast, Wise Owl) are now short, complete sentences that name the book's own character. Panda-Cake, Eggs-Benedict, Meow-inara and Wise Owl are "she" everywhere. French-Toast's book uses no pronouns, because the character is "she" in ABCs and "he" in other apps. Letters, words and emoji are unchanged, so the art mapping still holds. The fix is in source; it reaches the app with the next ABCs build. **Next: re-read the 5 books for the web bookshelf** (the ABC picture-book section) from source. They don't need to wait for the app release. **Update 2026-10-16: the Wise Owl (Basic Math) text fix has landed** (monorepo `1cf18e520`, `apps/snackpack-4-math-arithmetic/constants/pendingQuickTales.ts`; `npm run verify` passes). Page 1 now asks "If the 24 flags hang in 4 equal rows, how many flags go in each row?" (answer 6). Page 2 explains a prime as a number of chimes that can't be set out in equal rows except as one row, and the explanation gives 21 = 3 × 7, 25 = 5 × 5, 27 = 3 × 9. Pages 3–4 were already correct. **DONE 2026-10-16: Wise Owl is on the shelf** at `/read/wise-owl-festival-of-factors/` (Number stories, Year 5, ages 9–11; 30 books). The quality read found one more defect: page 4 said 36 cushions in six rows of six, but the picture shows a 4 × 4 square of 16. The app text was changed to match (monorepo `768ec8149`, answer 4) before import. All 4 pages viewed; character designs are consistent. Verified with check-site, check-contrast, `build-read-shelf --check` and `build-read-social-cards --check`, plus a local render (text, 6 images, maths/9–10 filter). **Not pushed.** After pushing, run `scripts/notify-search-engines.mjs` for the book URL. |
| B5 | **Pro books with full art** (Mark's call) | e.g. Counting's *Booklava and the Number That Hid* and *The Night the Lanterns Went Out*; the Pro Spelling quick reads | Only if Mark approves publishing more Pro content free. Today's revenue is $0, so the cost is low, but it's his decision. |

Not candidates: Earth Science and Space Math (one cover per story), Mathematics
(two scenes per story), Store Keeper (app is unbuildable).

### Phase C: improve the experience (once the shelf passes ~25 books)

| # | Improvement | Why |
|---|---|---|
| C1 | **Responsive images** | **DONE 2026-10-15.** 480/800/960 px WebP sizes plus `srcset`/`sizes` measured per layout (`build-read-responsive.mjs`, `lib/read-srcset.mjs`; hub and homepage cards via `build-read-shelf.mjs`). Measured image data per visit: desktop/tablet −66%, 2× phones −26%, 2.6× phones −10% (−30% on landscape books), 3× iPhones unchanged, because they need full resolution and the 768 px portrait originals already match. A flat 600 px size would only have helped desktops. Offline save keeps originals only; `sw.js` (CACHE v23) answers an unsaved size with the saved original. |
| C2 | **Hub filters** | **DONE 2026-10-15.** Type (Phonics / Stories / Maths) and age (3–4 / 5–6 / 7–8 / 9–10, matched by range overlap) filters, a "Showing N of 29" count, an empty state with reset, and a "New" badge for books added in the last 30 days, worked out in the reader's browser. Driven by `age` and `added` on each `SHELF` entry (app ages where the apps have them; UK phonics timing otherwise) and `read/shelf-filter.js`. The filter state lives in the URL (`?type=maths&age=7-8`), so a filtered shelf can be shared; invalid values are dropped. With JS off, the bar stays hidden and the whole shelf shows. |
| C3 | **Questions page in each PDF** | **DONE 2026-10-16.** All 29 PDFs end with a questions page: each page's talk prompt (or maths question with its choices) and the end-of-book question, with every answer grouped below a dotted fold line, always together on one page (Biscuit-Bouncer's nine answers get their own page). Extracted from each book's HTML by `build-read-pdfs.mjs`, so it follows the web text automatically; Button Trail's inline "Answer: N" moves below the fold. Still zero dependencies: standard Helvetica with WinAnsiEncoding, wrapped by Helvetica's AFM widths; any character without a glyph prints as "?" and warns at build time (none today). Each PDF grew by only a few KB. |
| C4 | **Read to me speed** | **DONE 2026-10-16.** A "Speed: slow / normal" button beside every Read to me button (0.82× and 1×; slow stays the default). One tap changes every page's button, restarts the page being read at the new speed, and is remembered on the device (`localStorage` key `snackpack-read-speed`, wrapped in try/catch, so blocked storage just means slow each visit). In `read/reader.js`; no service worker bump, because a bump would delete readers' offline-saved shelves and reader.js is already served network-first. Tested with a stand-in speech engine (test browsers have no voices), including a real reload. |
| C5 | **Richer `Book` schema** | **DONE 2026-10-16.** `build-read-shelf.mjs` merges into each book's Book JSON-LD: `typicalAgeRange` (from SHELF ages), `numberOfPages` (counted story pages), `inLanguage` en-GB, `bookFormat` EBook, `encoding` (the PDF), and `educationalAlignment`: subject (Phonics / Reading / Mathematics), level (Phonics Stage N, Reading Trail step N of 6, and a UK school year) and `teaches` (the importer's `about`). Importer fields are untouched; `--check` in CI keeps it current. UK years only, because they don't map one-to-one onto US grades. **Fixed the same day:** the maths books said "Year N (UK) / Grade N (US)", but US grades run one behind (Year 1 = Kindergarten). Corrected on the four live books and at the source in Basic Math (19 book entries, monorepo b84f02eab), which `validate-content.js` now guards. |

### Phase D: decisions for Mark

1. Zoo World animal books on the web? (Depends on B3's free and licence check.)
2. Any more Pro books free (B5)?
3. Pocketful of Sounds: commission 7 illustrations, or a text-led read-aloud format?
4. Phase A5: a two-minute real-device check of Read to me.

### Order and size

A1–A4 are small and can ship together (one session). Then B1 (small), B2 (large,
mostly reading: plan a session for the read and a session for the import),
then C1 (medium, mechanical) and C2 once B2 lands. B3 waits on its checks.
Re-measure on 2026-11-15 (already scheduled) before committing to B2's full
size: if multi-book sessions grew, scale up; if not, stop at 12 quick reads.

### Phone layout (done 2026-10-17)

Measured on a 375 px phone before the change: the homepage put the bookshelf
16,573 px down and the arcade 22,610 px down (of 25,468); the /read/ hub was
26,820 px with no book on the first screen; a book's page 1 began ~1,150–1,570 px
down. Now: bookshelf 994 px and arcade 2,465 px on the homepage; hub 8,568 px
with the first books at ~750 px; page 1 at ~700–1,050 px. All of it is one
phone-only block at the end of `site.css` plus the homepage section order and
the hub `sizes` in `scripts/lib/read-srcset.mjs` (two cards a row, so phones
pick the 480 px covers). No `sw.js` bump (see the cache note below). Also
2026-10-17, site-wide: the header was two rows (~155 px) pinned on every page at
≤980 px; it is now one pinned row (51 px phone, 59 px tablet) with the links on a
sideways-scrolling line. It stays sticky because pinball measures the header to
dock its HUD (`--pb-dock-top`).

### Story-gap art landed (done 2026-10-17)

Codex delivered the 37 images of `docs/ART-BRIEF-STORY-GAPS-2026-10-16.md`
(monorepo `3572e1a31`, `c37c44c2d`; handoff `docs/STORY-GAP-ART-HANDOFF-2026-10-17.md`).
Every page was viewed against its text: counts (berries, plates, stones, bells,
snowflakes, lanterns, books, pots), clock faces and character designs. All
pass; Codex's three noted limits (Number Nest bundle sizes, the page-1 hour hand)
do not affect any question, and the alt text claims no exact bundle counts. Eight
books went live: Panda-Cake, Sub-Zero and Luckybug's Pairing Parade (Counting,
`import-counting-book.mjs`); Lantern, Number Nest, Clockwork Concert and
Vincent's Mural (Basic Math, `import-math-story-book.py`, now centre-cropping so
Lantern's 4:3 page 2 is not squashed); and Pocketful of Sounds (ABCs, new
`import-abc-story.py`, new shelf group "Read-aloud picture books"). App fix:
Stripe-Scout was "he" in Vincent's book and "she" in the two Spelling books on
the shelf; the app now says "Her ears flatten" (Basic Math `year6MathBooks.ts`,
`npm run verify` passes). **Live-book fixes landed too (2026-10-17):** the 13 images of
`docs/ART-BRIEF-LIVE-BOOK-FIXES-2026-10-17.md` (monorepo `ac798997c`, handoff
`docs/LIVE-BOOK-FIXES-HANDOFF-2026-10-17.md`) all passed review (counts and
character designs) and are live: Button Trail (now imported by
`import-counting-book.mjs`, replacing the hand-built August page, with
tap-to-answer questions), Market Morning, Parcel Parade, Baby Bulldogs and
Moonlit Café. **Replaced art gets new web file names:** each importer has a
per-book `rev` (files become `page-3-r2.jpg` / `...-p3-r2.jpg`), because sw.js
serves images cache-first and a new picture at an old URL stays stale for
returning readers. Bump `rev` whenever a live book's pictures change, and
update any SHELF `cover` that points at a page image. The old files were
removed.

### Corgi and Honey-Beats (done 2026-10-18)

Mark chose to fix both rejected Counting books. Codex redrew all 12 pages
(`docs/ART-BRIEF-COUNTING-CORGI-HONEYBEATS-2026-10-18.md`, monorepo
`779e542f1`). Every ten-frame is 2 × 5 with the right count, Ted and
Flutter-Butter replace the dolphin, the stones carry their numbers, and page 4's
reversed footprint is visible. Both are live via `import-counting-book.mjs`
(41 books at that point). **Update 2026-10-18:** Cereal-Swimmer's Number-Line
Lagoon has now passed a full six-page replacement and count review and is
published. Panda-Cake's complete alphabet brings the current shelf to 43.

### PDFs carry the story text (done 2026-10-18)

Codex's builder fix (prose under each picture) had only been applied to the 9
PDFs it rebuilt; the other 34 printed pictures alone. All 43 were rebuilt and
checked: every story page's text is present in its PDF. Lionnaise's end
question still said "lower the bridge" after the short-read rewrite; fixed in
the app (monorepo `458d8b0de`, Spelling `npm run verify` passes) and re-imported.
Next Codex brief: `docs/ART-BRIEF-SHORT-READS-2026-10-18.md` (monorepo) — 9
images for Blanket Fort, Library Day, Moonlight Story and Garden Race.

## Open: needs Mark

1. **Pocketful of Sounds art.** `ted-e-bear-pocketful-of-sounds` (app1, free,
   rated excellent) has a cover and 1 of 8 pages illustrated. Commission 7
   interiors, or decide on a text-led read-aloud format.
2. **Remaining ABC books:** Panda-Cake is complete and published with all
   26 letters illustrated consistently. Review results after 15 November
   before commissioning the other four. No letter-and-emoji or taster exception.
3. **Basic Math content fixes.** Art is now briefed for Codex (`docs/ART-BRIEF-STORY-GAPS-2026-10-16.md`, monorepo root); Wise Owl's text fix shipped 2026-10-16. Pork-ulele's
   page 1 clock shows the wrong time; Wise Owl's page 1 question and page 2
   prime explanation are wrong; Ted-E-Bear's Lantern and Booklava change
   character design mid-book. Once fixed, add them via
   `scripts/import-math-story-book.py`.
4. **Outreach.** `LINK-BUILDING-PLAN.md` §4 has the homeschool/phonics pitch,
   updated to 17 books. Only Mark can post it.
Done 2026-10-15: Mark disabled the World Cup workflow and granted the `workflow`
scope; the `build-read-shelf.mjs --check` step is now in `site-check.yml`.

## Open: can be done without a decision

- **Re-measure on or after 2026-11-15.** Run `node scripts/report-referrals.mjs --history`,
  the Cloudflare `/read/*` paths, and GSC page rows for `/read/*`. Success means
  more books per visit (`www.snackpackuniverse.com` as referrer on book pages,
  and views per visit), not raw totals. Share-button taps are not counted:
  sharing happens in the browser, where Cloudflare's beacon cannot see it. Its
  effect shows up as chat-app referrers (Telegram, WhatsApp, `l.facebook.com`)
  and direct visits to book pages.
- **Hear Read to me on real devices.** It was tested with a stub engine, because
  headless Chromium has no voices. Voice quality and word-boundary events vary
  by device. Safari on iOS fires fewer boundary events, so highlighting may lag.
- **Don't bump `sw.js` `CACHE` for /read/ code changes** (corrected
  2026-10-16; this item used to say "bump at the next sw.js commit"). A bump
  costs readers their offline shelves: `activate` deletes every cache except
  the current `CACHE` and Last Bastion's, and "Save the bookshelf for
  offline" lives in `CACHE`. Bumping buys nothing for code and markup
  (`.js`, `.css`, `.html`, `.json`, navigations), because sw.js serves them
  network-first, so a fix lands on the next online visit anyway. Images are
  the exception: they are cache-first, so **replacing an image's bytes at the
  same URL** stays stale for anyone who cached it. Give replaced art a new
  file name, or accept that a bump wipes saved shelves. The sw.js header
  comment ("BUMP `CACHE` whenever shared code or markup changes") predates
  offline save and is wrong for /read/.

## Rules for adding a book

1. **Free in the app**, or explicitly approved by Mark. Reading Trail steps 3–6
   (Pro) were approved 2026-10-15; the 4 Pro decodables were approved
   2026-08-13. Nothing else Pro.
2. **Every page illustrated**, resolved the way the app resolves it. Basic Math:
   `getBookPageImage(illustrationId ?? page.id)`. A first measurement that
   ignored the page-id fallback wrongly reported books as unillustrated.
3. **Quality read before import.** Read every page and view every image. Reject
   wrong maths or facts, wrong pictures (e.g. a clock showing the wrong time),
   characters that change design mid-book, and weak or remixed text.
4. **Text verbatim from the app.** Web-only editorial (alt text, lead line,
   share-card blurb) lives in each importer's `BOOKS` map and describes the
   actual picture.

### How (per source)

| Source | Importer | Then |
|---|---|---|
| app1 decodables | `scripts/import-decodable-book.mjs` | add to `SHELF` |
| app3 Reading Trail | `scripts/import-reading-trail-book.mjs` (alt text in `BOOKS`) | add to `SHELF` |
| app4 Basic Math | `scripts/import-math-story-book.py` (converts WebP → JPEG for the PDF builder) | add to `SHELF` (group `numbers`) |

After any import, run these in order: `build-webp.mjs` →
`build-read-pdfs.mjs --slug=<slug> --write` → `build-read-responsive.mjs` → `build-read-shelf.mjs` (hub, chain,
ItemList, homepage, offline manifest) → `build-read-social-cards.py` →
`build-breadcrumbs.mjs` (it has **no** `--check`; it writes, so commit only your
paths) → `build-play-links.mjs` → `build-go-links.mjs` → `build-sitemap.mjs`.
Verify with `check-site.mjs`, `check-contrast.mjs`, `build-read-shelf.mjs --check`
and `build-read-social-cards.py --check`. After pushing, confirm the live URLs
and run `scripts/notify-search-engines.mjs <urls>`.

## Held back (and why)

| Book | Source | Reason |
|---|---|---|
| 4 remaining ABC books | app1, free | Panda-Cake completed 2026-10-18; audit word/art matches and character consistency before commissioning the others after the re-measure |
| Spelling short reads #34–60 | app3, free | weaker vocabulary/science books; several factual errors (see B2) |
| Blanket Fort, Library Day, Moonlight Story, Garden Race | app3, free | a character changes design mid-book, or clashes with the shelf |
| "Which book first?" QR PDF | — | dropped: the stage-ordered hub does the job, and QR would add the repo's first dependency |

## Gotchas worth keeping

- **Offline save** writes into sw.js's own `snackpack-arcade-*` cache, the only
  cache sw.js serves offline pages from. Every sw.js `CACHE` bump empties it,
  and the hub then honestly offers "Save all N books" again.
- **The offline manifest's size counts art only.** Counting HTML/CSS would make
  `build-read-shelf.mjs --check` fail on any unrelated site edit.
- **Homepage book cards must not carry `width`/`height`.** `.storybook-card img`
  sets `aspect-ratio` without `height:auto`, and the attribute stretches it.
- **Pushing with another session's unpushed commit on local `main`:** build your
  commit on the remote head with a temporary index, push that, then commit locally
  and merge. See the memory note on this.
