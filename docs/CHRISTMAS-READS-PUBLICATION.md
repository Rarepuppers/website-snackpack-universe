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
