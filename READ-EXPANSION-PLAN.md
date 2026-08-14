# /read/ expansion + printable PDFs — build plan

Written 2026-08-13. For whoever executes it (Codex or Claude). Companion to
`LINK-BUILDING-PLAN.md`, which explains *why* `/read/` is the priority: free
decodable readers with no sign-up wall are the site's only realistic magnet for
a genuine inbound link, and the outreach drafts are already written and waiting
on this section being deeper than three books.

**Nothing here generates art.** Every cover and interior page already exists in
the app repos. This is an import-and-format job.

---

## 1. Where the art actually is (verified 2026-08-13)

Four apps hold illustrated books, across **six separate shelves**. The
directory names differ per app, which is why a single glob finds almost none of
it — always check the app's own asset folder names.

```
snackpack-1-abcs-alphabet/assets/
  decodable/            34 files    9.4 MB   decodable readers  (<book>-cover / <book>-page-N)
  book-covers/          44 files    9.1 MB   ABC book covers    (<book>-alphabet.jpg)
  book-pages/          264 files     59 MB   ABC interiors      (<book>-<letter>-<word>.jpg)
  mini-story-covers/    64 files     16 MB   mini-book covers
  story-heroes/        192 files     48 MB   mini-book interiors
snackpack-2-123s-counting/assets/
  story-covers/         21 files    6.5 MB
  story-page-art/      161 files     45 MB
snackpack-3-spelling-sentences/assets/
  book-covers/          26 files    6.6 MB
  book-page-art/       471 files    106 MB   <- largest interior set anywhere
snackpack-4-math-arithmetic/assets/
  book-covers/          69 files    191 MB
  book-page-images/    147 files     43 MB
```

Roughly **1,200 interior illustrations and 220 covers** exist. Supply is not
the constraint. Selection is.

Metadata (titles, page text, ordering, free/Pro) lives in each app's
`constants/` — `decodableBooks.ts`, `alphabet.ts`, `bookPageArtwork.ts`
(app1); `curatedStoryBooks.ts` (app2); `books.ts`, `curated-long-stories.ts`
(app3); `curatedMathBooks.ts`, `bookPageImages.ts` (app4).
**Take titles and page text from there, never from filenames.**

## 1b. Choose on quality, not availability

The library was authored by different models over time and the quality is
genuinely uneven — the Fable- and Sol-authored books are materially better than
the ones from weaker models. Importing by "has complete art" would ship the
weak ones alongside the good.

**app1 has a usable quality signal already.** `docs/MINI_BOOK_ILLUSTRATION_REVIEW_2026-08-02.md`
is an editorial pass over all 64 mini books with a verdict per story. Thirteen
are rated *excellent* or *strong* — that is the shortlist, in the doc's own order:

> Ted-E-Bear and the Pocketful of Sounds · Booklava and the Page That Stayed
> Blank · Flutter-Luckybug's Wind-Mixed Message · Cereal-Swimmer and the
> Alphabet Sea · Sub-Zero's Snow Day · Nutmeg and the Lost Acorn · Lionnaise and
> the Very Tiny Roar · Pork-ulele's Big Concert · Snack-Spector and the Puddle
> Mystery · The Day Cluck O'Clock Slept In · Sub-Zero and the Summer Snowball ·
> Hen-Berry and the Midnight Helpers · Eggs-Benedict and the Sky That Wasn't
> Falling

Stories merely marked "Approved" or "Polished" are *not* in that tier — the doc
distinguishes them deliberately.

**Before importing from apps 2–4, find the equivalent signal** (the content
patch plans and handover docs in each app record which batches were rewritten
and by whom). If no signal exists for a given shelf, read a sample of three
books and judge directly rather than importing the shelf wholesale. Shipping
twenty mediocre books would actively damage the section's ability to earn a
link, which is the entire reason it exists.

Naming differs between the two shelves — this trips up a naive glob:

| Shelf | Cover | Interior page |
|---|---|---|
| Decodable | `pip-sits-cover.jpg` | `pip-sits-page-3.jpg` |
| Alphabet | `ted-e-bear-alphabet.jpg` | `ted-e-bear-a-apple.jpg` |

Book metadata (titles, page text, ordering) lives in
`apps/snackpack-1-abcs-alphabet/constants/`:
`decodableBooks.ts`, `bookCovers.ts`, `bookPageArtwork.ts`.
**Take titles and page text from there, not from filenames.**

## 2. What is importable, verified by cross-referencing covers against pages

**Decodable shelf — 6 books, 4 complete:**

| Book | Assets | State |
|---|---|---|
| `pip-sits` | cover + 6 pages | already on the web |
| `nan-and-pip` | cover + 6 pages | **ready to import** |
| `ten-red-hens` | cover + 8 pages | **ready to import** |
| `the-cat-and-the-rat` | cover + 8 pages | **ready to import** |
| `bug-in-a-cup` | cover only | blocked — interior art owed |
| `dog-in-the-fog` | cover only | blocked — interior art owed |

**Alphabet shelf — 41 complete books** (cover + 4–6 pages each). 28 have 6
pages, 10 have 5, 3 have 4. Three books have page art but no cover, and three
covers have no pages; skip all six rather than shipping a partial book.

So there are **44 books with complete art** against 3 currently live — no new
art needed. But art completeness is not the binding constraint. Read on.

## 2b. The real constraint: free tier vs Pro

Every book carries `isFree` in the app data, and the site has an **established
policy of publishing only free-tier books**. Both Ted-E-Bear books already on
the web are `isFree: true`. Publishing a Pro book on the web gives away paid
app content.

Counting only `isFree: true` books that also have complete art:

| Book | Shelf | Pages | Status |
|---|---|---|---|
| `ten-red-hens` | decodable | 8 | **free — import** |
| `panda-cake` | alphabet | 6 | **free — import** |
| `eggs-benedict` | alphabet | 6 | **free — import** |
| `french-toast` | alphabet | 6 | **free — import** |
| `meow-inara` | alphabet | 6 | **free — import** |
| `wise-owl-librarian` | alphabet | 6 | free — import (see naming note) |
| `ted-e-bear` | alphabet | 6 | already live |

Naming note: `wise-owl-librarian`'s cover is
`wise-owl-librarian-alphabet.jpg` but its pages are `wise-owl-*`. Match on the
book id from `alphabet.ts`, not on a shared filename prefix.

**Everything else is Pro**: 36 of 42 alphabet books, and 4 of 6 decodables
(including `nan-and-pip` and `the-cat-and-the-rat`, both of which have complete
art and would otherwise be the obvious next imports).

Those counts are for app1's ABC and decodable shelves only; apps 2–4 have their
own free/Pro flags that must be checked the same way.

**Decision taken 2026-08-13:** publish the free-tier books **plus the two Pro
decodables** `nan-and-pip` and `the-cat-and-the-rat` (both already have complete
art). Rationale: the decodable shelf is the linkable asset, and a shelf of four
reads as a real resource where one reads as a sample. All other Pro books stay
app-only unless separately approved.

Still worth doing regardless: **commission interior art for `bug-in-a-cup` and
`dog-in-the-fog`**. Those two complete the decodable shelf at six, which is
worth more to a teacher than any number of alphabet books.

## 3. Priority order

**Batch 1 — the decodable shelf (highest value, do first).** All three have
complete art and take the web shelf from 1 book to 4:
`ten-red-hens` (free), `nan-and-pip` (Pro, approved), `the-cat-and-the-rat`
(Pro, approved). "Free decodable readers" is the search term with real intent,
and teachers link decodables, not alphabet books.

**Batch 2 — the 5 free alphabet books**, all 6-pagers: `panda-cake`,
`eggs-benedict`, `french-toast`, `meow-inara`, `wise-owl-librarian`.
That puts `/read/` at 9.

**Batch 3 — the best mini books**, drawn only from the 13 rated
excellent/strong in §1b. Note four of those characters (`eggs-benedict`,
`cluck-oclock`, `hen-berry`, `sub-zero`) also appear as alphabet books — check
you are importing the *mini book* (art in `story-heroes/`), not the ABC book
(art in `book-pages/`). They are different stories with the same cast.

**Batch 4 — apps 2–4**, only after finding a per-app quality signal. Do not
import a shelf wholesale.

**Ongoing:** commission interior art for `bug-in-a-cup` and `dog-in-the-fog`.

## 4. Page build

Copy the pattern in `read/pip-sits/index.html` exactly — it is the reference
implementation. Per book:

```
read/<slug>/index.html
read/<slug>/pages/cover.jpg          + cover.webp
read/<slug>/pages/<slug>-page-N.jpg  + .webp
```

Required per page, all present in the reference:
- `<title>`, meta description, canonical
- `Book` + `BreadcrumbList` JSON-LD
- Every `<img>` wrapped in `<picture>` with the WebP source first
- `width`/`height` on every image (no layout shift), `loading="lazy"` below the fold
- The Cloudflare beacon snippet
- **No sign-up, no email capture, no interstitial.** The frictionlessness is
  the reason this section can earn links. Do not add a gate later.

Then re-run the generators from the repo root:

```bash
node scripts/build-webp.mjs
node scripts/build-sitemap.mjs
node scripts/build-breadcrumbs.mjs
```

### Weight — read this before importing 44 books

Source art averages **223 KB/page**, and the published site is currently
**49 MB tracked** (the 5.9 GB working tree is untracked build junk). Importing
44 books unoptimised adds roughly **123 MB** — a 3.5× growth in every clone.

Run `scripts/optimize-images.sh` (already downscales story art to 700px) over
the imported files and target **~100 KB/page**, which brings the whole import
to ~31 MB. Do this as part of the import, not as a later cleanup.

## 5. Levels taxonomy (do this alongside, not after)

There is currently no level structure, and level is how teachers actually
search. Add one page per level under `read/levels/<level>/`, each listing its
books:

- `short-vowels` — CVC words (`pip-sits`, `nan-and-pip`)
- `digraphs` — sh/ch/th/ck
- `blends` — initial and final clusters
- `long-vowels` — split digraphs

Derive each book's level from the phonics data in `decodableBooks.ts` rather
than guessing. The level page is the one that ranks and the one that gets
linked; the individual book page is what gets read.

## 6. Printable PDFs

**The ask, and the constraint:** one print-ready PDF per book, built from the
*existing* JPGs. No new art, no re-drawing, no AI generation.

### Output
`read/<slug>/<slug>.pdf`, linked from the book page as "Print this book (PDF)".

### Spec
- **A4 and US Letter both matter** — the audience is split. Rather than ship two
  files, lay out on a page size that prints acceptably on both: use A4
  (210×297mm) with a **12 mm safe margin** on all sides, which survives Letter's
  shorter height without clipping.
- **One illustrated page per PDF page**, cover first, in the order given by
  `bookPageArtwork.ts` — do not rely on filename sort (`page-10` sorts before
  `page-2`).
- Image fitted to the safe area preserving aspect ratio, centred.
- Embed the page text under the illustration if the source art does not already
  include it. Check first — the decodable art appears to have the text baked in;
  if so, do not double it up.
- **Downscale to ~150 dpi for the target print size** before embedding. Full-res
  embedding will produce 20 MB+ PDFs; 150 dpi is indistinguishable in home
  printing and keeps each file near 1–2 MB.
- Include a footer line on the last page only:
  `snackpackuniverse.com/read` — so a printed copy passed around a classroom
  still points home. This is the whole distribution argument for PDFs.

### Implementation — DONE 2026-08-13

`scripts/build-read-pdfs.mjs`, **zero dependencies**:

```bash
node scripts/build-read-pdfs.mjs                      # dry run, all books
node scripts/build-read-pdfs.mjs --write
node scripts/build-read-pdfs.mjs --slug=ten-red-hens --write
```

`pdf-lib` turned out to be unnecessary. A PDF can carry a JPEG verbatim as a
`/DCTDecode` stream, so the art is embedded byte-for-byte — no image library,
no headless browser, and nothing added to a repo that deliberately has no
`package.json`. It also means **no re-encoding**, so print quality is exactly
the source art.

Two details worth keeping if this is ever rewritten:
- **No downscaling is needed.** The art is 1200px (interiors) / 1024px (covers),
  which is 164 / 140 dpi across the printable width — already the right
  ballpark. The 150 dpi target in the original spec was satisfied for free.
- **Page order is read from the rendered HTML**, never a filename sort, so
  `page-10` cannot precede `page-2`.
- Non-ASCII titles are written as UTF-16BE with a BOM; a latin1 literal turns
  the curly apostrophe in "Ted-E-Bear's" into mojibake in the document title.

Result: 8 PDFs, 0.9–2.7 MB each, ~17 MB total. All verified round-tripping
through pypdf with correct page counts, A4 media boxes, one decodable image per
page, and content confined to the shared A4/Letter safe box.

### Verify before committing
- Page count == 1 + interior page count, for every book.
- Page order matches the web page's reading order (spot-check a 8-page book,
  where numeric-vs-lexical sort bugs actually show).
- No file over 3 MB.
- Open one and print it to A4 *and* Letter; confirm nothing clips.

## 7. Definition of done

- [x] Approved web shelf reads 8 complete illustrated books
- [ ] Every imported book chosen on a quality signal, not just "has art"
- [ ] No `isFree: false` book beyond the two approved decodables
- [ ] All imported art optimised (~100 KB/page)
- [ ] Level pages live, derived from the phonics data
- [x] A PDF per book, linked from its page, under 3 MB each
- [x] `build-webp`, `build-sitemap`, `build-breadcrumbs` re-run
- [ ] Still no sign-up wall anywhere in `/read/`
