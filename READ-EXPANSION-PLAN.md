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

The only app with complete illustrated interiors is
**`apps/snackpack-1-abcs-alphabet`**. Checked and ruled out:
`snackpack-3-spelling-sentences` (26 covers, no page art),
`snackpack-4-math-arithmetic` (69 covers, no page art), and the rest have book
*data* but no interior illustrations. Do not go hunting in the other apps.

```
apps/snackpack-1-abcs-alphabet/assets/
  decodable/     34 files,  9.4 MB   decodable readers (cover + numbered pages)
  book-pages/   264 files,   59 MB   alphabet books (<book>-<letter>-<word>.jpg)
  book-covers/   44 files,  9.1 MB   alphabet covers (<book>-alphabet.jpg)
```

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

**So the free tier tops out at 6 new books — `/read/` reaches 9, not 15.**
Passing 12 requires a deliberate decision to publish Pro books on the web.
That is a monetization call, not a content one, and it should be made
explicitly rather than by whoever runs the import.

If the answer is "free tier only", the highest-value action is not importing at
all — it is **commissioning interior art for `bug-in-a-cup` and
`dog-in-the-fog`** and marking them free, since a complete 6-book decodable
shelf is worth far more to a teacher than a dozen alphabet books.

## 3. Priority order

1. **`ten-red-hens` first.** The only free decodable not yet on the web.
   "Free decodable readers" is the search term with real intent, and teachers
   link decodables, not alphabet books.
2. **The 5 free alphabet books** (`panda-cake`, `eggs-benedict`,
   `french-toast`, `meow-inara`, `wise-owl-librarian`), all 6-pagers.
3. **Chase interior art for `bug-in-a-cup` and `dog-in-the-fog`**, then mark
   them free. Two books complete the decodable shelf and are worth more than
   ten alphabet books for linkability.
4. **Only then**, if the Pro decision goes that way, the paid books —
   `nan-and-pip` and `the-cat-and-the-rat` first, since both already have
   complete art.

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

### Suggested implementation
Node, using `pdf-lib` (pure JS, no native deps, no headless browser):

```
scripts/build-read-pdfs.mjs
  --slug=<slug>     build one book
  --all             build every book under read/
  (default: dry run, prints page order and output size; --write to emit)
```

`pdf-lib` embeds JPEG directly via `embedJpg()`, so with pre-downscaled images
there is no rasterisation step at all. Avoid Puppeteer/headless-Chrome print —
it adds a heavy dependency and gives worse control over image placement.

### Verify before committing
- Page count == 1 + interior page count, for every book.
- Page order matches the web page's reading order (spot-check a 8-page book,
  where numeric-vs-lexical sort bugs actually show).
- No file over 3 MB.
- Open one and print it to A4 *and* Letter; confirm nothing clips.

## 7. Definition of done

- [ ] `ten-red-hens` imported; free decodable shelf on the web reads 2
- [ ] The 5 free alphabet books imported; `/read/` reads 9
- [ ] No `isFree: false` book published without an explicit decision
- [ ] All imported art optimised (~100 KB/page)
- [ ] Level pages live, derived from the phonics data
- [ ] A PDF per book, linked from its page, under 3 MB each
- [ ] `build-webp`, `build-sitemap`, `build-breadcrumbs` re-run
- [ ] Still no sign-up wall anywhere in `/read/`
