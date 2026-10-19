# Four short reads - publication record, 19 October 2026

Mark reassigned the remaining website handoff to Codex after Claude usage
ran out. This follows the app artwork/content delivery in monorepo commit
`5ee168e25`; it does not add a native app release or change app access tiers.

## Books

| App book ID | Public path |
|---|---|
| `ted-blanket-fort` | `/read/ted-e-bears-blanket-fort/` |
| `wise-owl-library-day` | `/read/wise-owls-library-day/` |
| `meow-inara-moonlight` | `/read/meow-inaras-moonlight-story/` |
| `centi-peed-garden-race` | `/read/centi-peeds-garden-race/` |

All four are free app stories. The importer copies all 16 story paragraphs,
page prompts, primary questions, answers and explanations from the current
Spelling source. App secondary quizzes remain in the app, as for the other
short reads; the website format uses the primary question. Web-only leads
and alt text were written against the full reviewed page sets.

Each book has four JPEGs copied byte-for-byte from app artwork, original
and 480px WebPs, a 1200 x 630 social card, and a five-page A4 PDF containing
four illustrated story pages plus a questions/answers page. All image URLs
use `-r2` filenames. No service-worker cache version was bumped, preserving
saved shelves. Shelf, offline manifest, next-story chain, breadcrumbs,
attributed app links, homepage/guide counts and sitemap include the books.
The shelf now contains 47 books, 279 story pages and 47 printable PDFs.

## Review and validation

- All four complete artwork sequences were reviewed against their text.
  Ted wears his crown and bee apron; Meow-inara is the round tabby with the
  red pendant; Centi-Peed is a brown centipede with horned helmet/red boots.
  Every picture is a single scene. No missing/rejected picture remains.
- Source-parity audit: all 47 books / 279 pages match app exports, including
  primary questions/answers/explanations and page prompts. New JPEG hashes
  match app originals. The four books belong to the app's free story arrays.
- All 20 new PDF pages rendered and were visually reviewed. Every story
  paragraph and all four primary questions/answers appear in the PDFs.
- Chromium: all four books at 390px and 1280px in light/dark themes, 16
  scenarios. Images load, no horizontal overflow or JavaScript errors,
  primary answers reveal and all four page-turner states work. Sharing,
  read-aloud controls and PDF links exist; this does not establish native
  speech quality or real-device speech boundary events.
- The actual Save all 47 books control completed. Each new book and its
  four pictures then loaded with the browser offline. PDFs are excluded
  from that feature, as stated by its UI.
- Site integrity passed (359 pages); 483 contrast rule/theme combinations
  passed. JavaScript syntax (63 files), website delivery contract, shelf,
  responsive image, social card and attributed app-link guards passed.
- App release preparation: fresh, returning and settled web startup checks
  passed for Spelling and Zoo. Their previously recorded app verification
  remains valid for unchanged app source (248 / 104 tests respectively).
  All 20 monorepo portfolio guards passed during the source delivery; they
  were not rerun for this website/documentation-only publication.

## Release boundaries

Spelling and Zoo source fixes are already committed in the monorepo. Neither
installed app receives these changes until its next native build/release.
No versionCode was guessed, no build/submission was run, and no Play edit was
opened. Native build/submission remains assigned to Claude unless Mark
explicitly assigns a specific release to Codex.

Safari Morning's source repair is complete, but its original-art decision
remains deferred; it was not imported. Other held-back Spelling books still
need their individual complete art/publication review. Real Android/iOS
read-aloud testing, stale decodable-importer maintenance before its next use
and the November re-measure remain listed in the current plan.

Deployment and search-notification evidence is appended after publication.
