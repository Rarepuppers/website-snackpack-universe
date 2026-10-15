# /read/ — add, expand, improve (plan of record, 2026-10-15)

Supersedes the open items in `READ-EXPANSION-PLAN.md` (2026-08-13). That file
remains the reference for *how* to import a book and build its PDF. This one
says *what to do next and why*.

## 1. Why /read/ is now the priority

Measured 2026-10-15 (Cloudflare Web Analytics, 30 days, counts rounded to 10):

| Signal | Now | Prior 30d |
|---|---:|---:|
| `/read/` hub views | 540 | 130 |
| Book page views (all 8) | ~560 | ~190 |
| Printable-readers guide views | 120 | 30 |
| Site-wide mobile views | 1,080 | 320 |
| Internal clicks (page to page) | 830 | 260 |
| chatgpt.com referrals | 70 | 20 |

- The 11–14 Oct spike was UAE phones and tablets landing on `/read/` and then
  reading several books in a row, with a Telegram referral among them. That
  looks like a link shared in a parents' or teachers' group, which is people,
  not bots.
- `/read/` and the printables guide are the only part of the site where Google
  search, ChatGPT and word of mouth are **all** sending readers. The arcade
  and `/apps/` are not.
- The current shelf is 8 books (6 decodables + 2 Ted-E-Bear stories). Readers
  who arrive now run out of books in one sitting.

**Goal:** deepen a session that already works. Visitors who start one book
should find the next one easily, and there should be more books worth reading.

**Do not:** add a sign-up, email capture, interstitial or ad anywhere in
`/read/`. Being free with no friction is the reason it gets shared.

## 2. What is available (inventory 2026-10-15)

| Source | Free-tier, fully illustrated | Status |
|---|---|---|
| app1 decodables | 6 of 6 | **all live** (2 free + 4 Pro approved 2026-08-13) |
| app1 alphabet books | 5 free (`panda-cake`, `eggs-benedict`, `french-toast`, `meow-inara`, `wise-owl-librarian`) | **not imported**. 6–8 art pages each, covering selected letters |
| app1 featured mini-story | `ted-e-bear-pocketful-of-sounds` (free; rated *excellent* in the 2026-08-02 review) | not imported |
| app3 Spelling & Sentences | `FREE_STORY_BOOKS` (story, extra, controlled-decodable, free reading-trail sets); 471 page-art files | 1 live (Short-Vowel Kit) |
| app4 Basic Math | `FREE_BOOK_IDS` in `constants/skillProgress.ts` (6+ books with `book-page-images/` art) | none live |
| app2 1-2-3 Counting | stories with `isProOnly: false`; landscape page art | 1 live (Button Trail) |

There are more free illustrated books available than the site needs. As the
August plan said, quality is the limit, not supply.

## 3. Phases

### Phase 1: Make the existing shelf easier to move through (no new content)

1. **Order the hub as a reading path.** Show Stage 1, then Stage 2, then
   Stage 3, then "More stories". Give each stage group a short heading that
   names its letter sounds. At the moment the order is mixed (Stage 1, 2, 1,
   2, 3, 3).
2. **Add a "Next story" link to the end of every book.** It should be the
   next book in reading-path order, and the last book loops back to the shelf.
   The end card currently offers only the app, the PDF and "Back to the
   bookshelf".
3. **Add `ItemList` JSON-LD to the hub** listing every book. The hub currently
   has only `BreadcrumbList`. This helps both search engines and assistants,
   which are already citing `/read/`.
4. **Fix the hub's print-card copy** so the PDF count comes from the shelf
   ("Eight free reader PDFs" will be wrong as soon as a book is added).

Done when: the hub is ordered by stage, all 8 books link onward, the
`ItemList` lists exactly the books on the shelf, and every page still passes
`npm test` / site checks.

### Phase 2: Add the free-tier books that pass a quality check

Order is by value to a parent or teacher, highest first:

1. **`ted-e-bear-pocketful-of-sounds`** (app1, free, rated excellent). This is
   the strongest story available and needs no approval.
2. **app3 free controlled-decodable / reading-trail books.** These continue
   the phonics path past Stage 3 (digraphs, blends, long vowels), which is the
   gap teachers will notice first. Read each book before importing and judge
   it directly. Never import a whole shelf at once.
3. **The 5 free alphabet books.** These suit a different, younger reader
   ("letters", not "reading"), so they get their own section ("ABC picture
   books") rather than being mixed into the phonics path. They need a
   26-letter page template, because only 6–8 letters have art.
4. **app4 free maths stories, then app2.** Add these only if 1–3 are done
   and the numbers in section 5 still show multi-book sessions. They go in a
   separate "Number stories" section.

For each book: get the text from the app's `constants/`, not from filenames.
Optimise images to about 100 KB per page. Build the PDF with
`scripts/build-read-pdfs.mjs`. Re-run `build-webp`, `build-sitemap` and
`build-breadcrumbs`. Add the book to the hub, the `ItemList` and the "next
story" chain.

**Not included without Mark's approval:** any Pro book beyond the 4
decodables already approved, and any new artwork.

### Phase 3: Printables that teachers can pass around

- One printable **sound card sheet per stage** (the letter sounds each stage
  uses, plus its tricky words), built from `decodableBooks.ts`. A single page
  of A4.
- A **"which book first?" one-page guide PDF**: the reading path from section
  3, with QR codes pointing to each book.
- Link both from the hub and from `/guides/free-printable-decodable-readers/`.

### Phase 4: Measure, and only then decide what to build next

- Re-measure on or after **2026-11-15**:
  `node scripts/report-referrals.mjs --history`, the Cloudflare `/read/` paths
  query and GSC page rows for `/read/*`.
- Success means multi-book sessions grow. Watch `www.snackpackuniverse.com`
  as the referrer on `/read/<book>/` pages, and views per visit on `/read/*`.
  Raw totals are not the measure.
- PDF downloads are invisible to Cloudflare (a PDF runs no beacon). If
  downloads become the question, count them by linking through a tiny HTML
  redirect page, not by adding a tracker.

### Phase 5 (Mark decides): distribution and paid content

- `LINK-BUILDING-PLAN.md` already has drafted outreach to homeschool and
  phonics groups. Only Mark can post it. The UAE share shows this channel
  works without any outreach.
- Whether to publish more Pro books on the web is a monetisation decision.
  Revenue across the apps is $0 (see the portfolio reality note), so giving
  books away costs nothing today, but that decision is Mark's.

## 4. Order of work

Phase 1 → Phase 2.1 → Phase 2.2 (one book at a time) → Phase 3 → Phase 2.3 →
Phase 4 re-measure → Phase 2.4 / Phase 5 only if the numbers justify it.

## 5. Execution log

- 2026-10-15: plan written.
- 2026-10-15: **Phase 1 done.** `scripts/build-read-shelf.mjs` (`--check` step for `site-check.yml` written but **not pushed**: the gh token lacks `workflow` scope; push it from a session with Codex's deploy key) now generates the stage-grouped hub, the `ItemList`
  JSON-LD, the PDF count and a "Next story" link on every book from one
  `SHELF` list. Checked in the preview at desktop and 375px with no horizontal
  scroll. `check-site`, `check-contrast` and the link generators are clean.
  The one pre-existing red is `build-newsletter-cta --check` on
  `play/thirteen/`, which was not touched here. `sw.js` `CACHE` was **not**
  bumped because another session has uncommitted edits in it. HTML and CSS
  are network-first, so the change lands without the bump.
- 2026-10-15: **Phase 2.1 blocked on art.** `ted-e-bear-pocketful-of-sounds`
  has a cover and only **1 of 8** pages illustrated (page 3's hero); the rest
  are emoji scenes in the app. That fails the shelf's "complete artwork" rule.
  It needs Mark's go-ahead to commission 7 interiors, or a separate
  text-led "read aloud" format. Skipped, not dropped.
- 2026-10-15: **Phase 2.2, first book live: `hen-berrys-digraph-dash`** (app3
  Reading Trail step 2, `isFree: true`, 5/5 pages illustrated, text verbatim
  from `reading-trail-drafts.ts`, all five pages viewed). It fills the first
  phonics gap after Stage 3 (sh, ch, th, wh). The new "Reading Trail · next
  steps" group puts the Short-Vowel Kit (step 1) first, then this book.
  **Next candidates:** Reading Trail steps 3–6 (blends, magic-e, vowel
  teams, endings) are all `isFree: false`, so continuing the trail needs
  Mark's Pro decision. That is the most valuable decision in this plan,
  because those four books complete the phonics path a teacher would follow.
- 2026-10-15: **Phase 3 done: `/read/sound-cards/`.** Sound, word and
  tricky-word cards for Stages 1–3 and the sh/ch/th/wh step. The letters and
  words come from `decodableBooks.ts` / `curriculum.ts` and the Digraph Dash
  text. It is an HTML page with print CSS, not a PDF, so it stays indexable
  and needs no dependencies. Verified with Playwright that it prints exactly
  **4 pages (one per stage) on both A4 and Letter**, black on white even from
  the dark theme. Linked from the hub ("Print sound cards") and from the
  printables guide's new "Next steps" block. The separate "which book first?"
  QR PDF was **dropped**: the stage-ordered hub now does that job, and QR
  generation would add the repo's first dependency.
