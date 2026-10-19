# Reads quality, offline and print delivery - 20 October 2026

Mark accepted the follow-up recommendations. The detailed plan and app
editorial review live in the monorepo's `docs/READS-QUALITY-PLAN-2026-10-20.md`
and `docs/READS-EDITORIAL-REVIEW-2026-10-20.md`. App source commit `0c0c3496c`
corrects two Corgi pronouns, five stale secondary quiz questions/answers and
Ted's narrative tense. No access tier or story beat changes.

## Delivered behaviour

- Save one complete book or the entire shelf. Cancel and retry keep completed
  files. Remove saved books preserves games, other books and shared files.
  Counts require all book images, common files and the current story HTML;
  collection/utility pages cannot inflate the count. The active service worker
  reports its cache name without a cache-version bump. Unsaved books offline
  show a clear explanation and absolute bookshelf link, rather than the arcade.
- Reader keyboard handling respects form/interactive controls and modifiers;
  page-turn buttons retain their arrow shortcuts. Page changes announce their
  position, disabled/hidden focus is repaired, Escape returns focus, and The
  end focuses the completion section. Reduced-motion preferences are honoured.
- Luckybug's Art Gallery and Corgi's Countryside Run have complete reviewed
  four-page sets. All eight retained illustrations match their current plots,
  designs and both quizzes. Totals: **52 books / 299 story pages / 52 PDFs**.
- All **27 published Spelling books** expose both app questions with collapsed
  answers and printable fold-under answers. Current source comparisons reject
  extra explanations as well as missing or changed questions. Render review
  caught a parser crossing quiz-object boundaries; it now reads balanced objects.
- Individual downloads show actual PDF size and printed-page count on books,
  the guide and collections. Open PDF to print explains the new tab/viewer.
  Exact question-sheet ranges provide a lower-ink option after online reading;
  the complete illustrated books remain intact. All 52 thumbnails were opened
  at phone-like size; their contain layout retains full scenes and faces, so no
  cover replacements were commissioned. Ted's coherent older costumes remain.
- Collections retain their 99 pages, with rebuilt source PDFs. Explicit UTF-8
  decoding fixes the first-phonics contents dash on Windows; the header text
  now has an actual-PDF encoding check, alongside source-page/hash comparisons.

## Verification

Spelling: 27 suites / 248 tests and the Expo helper pass. Publication checks
compare actual current app exports/art, both quizzes, PDF text and metadata,
collection copies and the six-book decodable round trip. Mutation tests reject
prose, art, PDF, primary/secondary quiz and invented-explanation changes.

Reader acceptance covers 29 browser cases: storage/resume/search; keyboard,
focus, reduced motion and enlarged layouts; all 52 phone thumbnails; real
Cache API failure/cancellation/retry/eviction/old-story cases; and a real worker
saving all 52 books, reading both additions disconnected, refusing an unsaved
book clearly, and retaining a cached game after reading files are removed.

Rendered/reviewed all 27 final question sheets, eight new story pages and three
collection contents sheets. Both new PDFs' text fits the A4/Letter safe area.
No physical printer, real screen reader, phone voice or native runtime claim
is inferred from these automated checks.

Final portfolio, live-byte and GitHub CI/Pages results are recorded after push.
Native release inclusion is tracked separately in monorepo
`docs/READS-APP-RELEASE-CHECKLIST-2026-10-20.md`; installed-store inclusion is
unknown until a release records it. No native builds, submissions, versions,
Play edits, outreach or new reminders ran. Further ABC/Pro/Zoo expansion stays
at the existing 15 November decision.
