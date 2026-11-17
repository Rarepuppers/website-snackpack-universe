# Christmas picture books publication

Published sources: `data/web-books.json` plus the edited manuscripts and reviewed art manifests in `data/web-originals/`. The original 50 PNG masters remain in the companion repository under `docs/christmas-picture-books-2026/`.

The two books have 24 story pages and a cover each, responsive WebPs, JPEG fallbacks, 25-page printable PDFs, social cards, shelf cards, reader controls, offline manifests and sitemap entries. They are original web stories, not app exports or decodables.

To import a reviewed revision, run `python scripts/import-christmas-books.py <absolute-source-directory>`, rebuild the two PDFs with `build-read-pdfs.mjs --slug=<slug> --write`, then rebuild responsive markup, social cards, shelf and breadcrumbs. Inspect rendered PDFs before refreshing evidence. Do not regenerate unrelated publication evidence to hide app drift.

```powershell
node scripts/check-christmas-publication.mjs --write-evidence --source-root=<absolute-source-directory>
node scripts/check-christmas-publication.mjs
node scripts/check-read-publication.mjs
```

The scoped refresh changes only the two Christmas evidence records. Its check compares website prose and alt text to the reviewed manifests, compares all 150 WebPs to their reviewed hashes, and checks published JPEG and PDF evidence. With a source directory, it also verifies all 50 original master hashes. CI runs this check without depending on a companion checkout. Existing app-source verification remains unchanged.

Validation on 18 November 2026: both PDF sequences rendered and inspected; text extraction passed for all 60 books; source/art evidence, mutation guards, shelf, responsive images, social cards, collection PDFs, site integrity, contrast and JavaScript checks passed. The Edge reader suite passed 75 tests, followed by a passing rerun of the sole outdated shelf-count assertion after deriving its count from evidence (76 covered in total). Both new books passed mobile navigation, image loading, overflow and shelf-search checks.

Existing limitations: full current-app comparison stops at `centi-peeds-below-zero-burrow`, whose local app prose differs from the published book. The broader verification also reports 154 stale `/go/` redirect outputs. Neither was refreshed in this release. Site integrity reports the existing missing analytics beacon on `/winter/`. Native/device speech is not established by browser tests.
