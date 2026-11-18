# Christmas picture books publication

Published sources: `data/web-books.json` plus the edited manuscripts and reviewed art manifests in `data/web-originals/`. The original 50 PNG masters remain in the companion repository under `docs/christmas-picture-books-2026/`.

The two books have 24 story pages and a cover each, responsive WebPs, JPEG fallbacks, 25-page printable PDFs, social cards, shelf cards, reader controls, offline manifests and sitemap entries. They are original web stories, not app exports or decodables.

To import one reviewed original, pass the absolute companion Christmas directory, its relative book folder and the web slug. For the Christmas Eve book, use `python scripts/import-christmas-books.py <absolute-source-directory> --book sequels/one-more-story-before-santa one-more-story-before-santa`. Then rebuild its PDF with `node scripts/build-read-pdfs.mjs --slug=one-more-story-before-santa --write` and rebuild responsive markup, social cards, shelf, breadcrumbs and sitemap. The importer uses the reviewed age range, image dimensions, page count and manuscript paragraph breaks. Inspect rendered PDFs before refreshing evidence. Keep unrelated publication evidence intact.

```powershell
node scripts/check-christmas-publication.mjs --write-evidence --source-root=<absolute-source-directory>
node scripts/check-christmas-publication.mjs
node scripts/check-read-publication.mjs
```

The refresh is scoped to registered Christmas books. It compares website prose and alt text to the reviewed manifests, compares the WebPs to their reviewed hashes, and checks published JPEG and PDF evidence. With a source directory, it also verifies the original master hashes. CI runs this check without a companion checkout.

Validation on 18 November 2026: both PDF sequences rendered and inspected; text extraction passed for all 60 books; source/art evidence, mutation guards, shelf, responsive images, social cards, collection PDFs, site integrity, contrast and JavaScript checks passed. The Edge reader suite passed 75 tests, followed by a passing rerun of the sole outdated shelf-count assertion after deriving its count from evidence (76 covered in total). Both new books passed mobile navigation, image loading, overflow and shelf-search checks.

Existing limitations: full current-app comparison stops at `centi-peeds-below-zero-burrow`, whose local app prose differs from the published book. The broader verification also reports 154 stale `/go/` redirect outputs. Neither was refreshed in this release. Site integrity reports the existing missing analytics beacon on `/winter/`. Native/device speech is not established by browser tests.
