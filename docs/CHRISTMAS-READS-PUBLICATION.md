# Christmas picture books publication

Published sources live in `data/web-books.json` and `data/web-originals/`. The companion repository holds the reviewed PNG masters and local handoffs under `docs/christmas-picture-books-2026/`.

Each web original has a separate cover, numbered story pages, responsive WebPs, JPEG fallbacks, a selectable-text printable, a share card, offline resources and sitemap entries. The local manifest supplies page count, age range, reading level and optional chapter starts.

To import one reviewed original, pass the absolute companion Christmas directory, relative book folder and web slug:

```powershell
python scripts/import-christmas-books.py <absolute-source-directory> --book sequels/<slug> <slug>
node scripts/build-read-pdfs.mjs --slug=<slug> --write
```

Rebuild responsive markup, social cards, shelf, breadcrumbs and sitemap. Preserve the reviewed WebP bytes from the source manifests when the responsive builder regenerates files. Inspect every page of the printable before refreshing release evidence. Retain the source evidence for other titles.

```powershell
node scripts/check-christmas-publication.mjs --write-evidence --source-root=<absolute-source-directory>
node scripts/check-christmas-publication.mjs
node scripts/check-read-publication.mjs
```

The refresh compares website prose, paragraphs, chapter starts, and alt text to the reviewed manifests. It compares WebP, JPEG and PDF hashes to delivery evidence. With a source directory, it also verifies original master hashes. CI can verify the committed evidence without a companion checkout.

Run the Reads browser suite to verify the new readers, age filters, images and chapter links. Run the scoped check with `--source-root` for web-original source parity. The broader `--require-apps` check applies to app exports and has previously identified unrelated source drift in `centi-peeds-below-zero-burrow`.

## Seasonal picks and family reading guide

The Christmas event page pins *One More Story Before Santa* on 24 December and *The Last Parcel Under the Tree* on 25 December in the reader’s local time. Other days use the regular rotation. The event data is in `scripts/lib/read-events.mjs`.

Edit `data/christmas-reading-guide.json` to change the web and printable guide together. Run these commands with Node and Python with ReportLab installed:

```sh
python3 scripts/build-christmas-reading-guide.py
node scripts/build-read-events.mjs
```

Open both PDFs and check the single-page layout, clickable book links and bottom-right website address at actual size. Run the Christmas browser spec to check the midnight transition and both downloads.

## Summer Christmas books

Package only after each painting has been accepted. The companion packager accepts the Christmas event flag and adds the clickable website footer to the cover and story pages. Keep the title's source README intact:

```sh
python3 docs/reads-events-bookshelf/package-event-book.py <absolute-book-folder> --event christmas --keep-readme --card-script <absolute-website-folder>/scripts/build-read-social-cards.py
```

Import under the Christmas source directory and copy its reviewed PDF directly:

```sh
python3 scripts/import-christmas-books.py <absolute-source-directory> --book sequels/<slug> <slug> --use-reviewed-printable
node scripts/build-read-responsive.mjs
node scripts/build-read-shelf.mjs
node scripts/build-read-events.mjs
python3 scripts/build-read-social-cards.py --slug=<slug>
node scripts/build-breadcrumbs.mjs
node scripts/build-read-shelf.mjs
node scripts/build-sitemap.mjs
node scripts/check-christmas-publication.mjs --write-evidence --source-root=<absolute-source-directory> --book=<slug>
```

The second shelf build refreshes the offline manifest after the social-card and breadcrumb builders change reader HTML. The Summer Christmas section is derived from the released titles in the web-original registry. The six woodland books keep their existing reading order.
