# Reads improvements and reserve books - delivery record

Mark approved the next recommendations and optional work, then asked Codex
to continue. The detailed plan is monorepo
`docs/READS-NEXT-BATCH-PLAN-2026-10-19.md`.

## Reader and shelf

Search matches title, character, skill and blurb with punctuation/accent
normalisation. It combines with the existing age/type filters, persists in
shareable query links, safely handles malformed parameters, announces result
counts and offers a single Clear search and filters action. Without JavaScript,
all books remain available. Start here links explain letters, phonics,
read-together stories and maths, with ages described as guidance.

Only the latest book/page and normal/larger text setting are remembered on
that browser. Continue reading resolves its link/title against the actual
shelf; retired, malformed and page-count-stale positions are ignored. Book
visits do not jump automatically: Resume and Start again are explicit. An
explicit shared page fragment wins. Forget clears the saved position. Blocked
storage does not block any reader control. Page turning and meaningful scroll
viewing save progress; completing a book removes its Continue card.

Normal/larger text applies to story prose, prompts and maths questions, with
the control also available in one-page mode. A grid min-content fix prevents
horizontal overflow at 200-percent text on 320px screens. Related-book links
prefer quiet/kindness/same-skill stories; staged phonics keeps reading order.
Speech events from a cancelled earlier utterance cannot cancel a restarted
one; an actual speech error provides visible reader-facing feedback.

## Three free stories and printable collections

- `/read/pita-pans-mountain-climb/`
- `/read/octo-pops-coral-reef/`
- `/read/shelly-pops-slow-and-steady/`

All three complete page sets and both app quizzes were reviewed. They are
free in Spelling's `EXTRA_STORY_BOOKS`. Their 12 paragraphs, page prompts,
primary questions and answers are imported verbatim; no app prose or tier
changed. Coral Reef page 2's four-plus-four arm illustration was corrected
in the owning app first, after a rejected extra-arm proof. The accepted art
has eight arms: four support the coral, four hold two stones. Master,
superseded original, actual prompt and hashes are preserved in the monorepo
and app's `docs/ASSETS_DELIVERED_2026-10-19.json`.

The shelf reaches **50 books / 291 story pages / 50 individual PDFs**.
All three use revisioned art, responsive variants, social cards, printables,
reader/share controls, offline manifest and attributed app links.

Three collections reuse approved books without inflating that count:

| Collection | Books | Printed pages | Approximate size |
|---|---:|---:|---:|
| First phonics | 6 | 57 | 13.0 MB |
| Quiet stories | 2 | 11 | 1.5 MB |
| Kindness | 6 | 31 | 5.2 MB |

Each has a contents sheet, book-boundary bookmarks and individual downloads.
Original book pages/questions are copied intact, and all 99 combined pages
plus the three new individual PDFs were rendered/reviewed. The guide now
explains twelve phonics books within the larger shelf, updates its metadata
and links the collections. PDFs remain excluded from offline shelf saving,
as the interface states. No service-worker cache version was bumped.

## Publication maintenance

The decodable importer preserves existing reviewed shells, highlights,
phonics cues, alt text, questions, responsive sources, theme/PWA and controls.
Six-book round-trip verification leaves all six HTML files and 50 pinned
derivative images byte-identical. Existing app WebP-to-web JPEG derivative
relationships are pinned; changed art fails for review, rather than replacing
an image at its cache-first URL. New derivatives are actually converted, not
WebP bytes copied into a `.jpg` filename. The six existing approved free-web
decodables keep their exception; no additional Pro publication is permitted.

`verify-reads.mjs --require-apps --roundtrip` compares actual app exports,
current app artwork hashes, web prose/prompts/answers/art/metadata, printable
story/questions/answers, collection source PDF hashes/text and generated
discovery output. Mutation tests against real artifacts reject changed prose,
quiz, art, PDF and missing companion sources. CI explicitly labels evidence-
only verification; it does not claim current app parity without the apps.
See [the publication workflow](READING-PUBLICATION.md).

## Acceptance evidence

- Direct local comparison: 50 books / 291 pages, current owning-app art hashes.
- PDF text: 50 individual PDFs / 359 printed pages, every story paragraph and
  primary question/answer present in order. Collections: 99 pages with intact
  source hashes and copied text. Rendered pages inspected, including the final
  Coral Reef repair.
- Twenty Playwright reader tests cover combined search/filter/reset, shareable
  and hostile URL values, explicit resume/restart, scroll/page-turn/finish
  progress, stale/corrupt/blocked storage, no-JavaScript reading, 320/390/1280px
  in three themes, enlarged text, collections and simulated speech events.
- Full site, contrast, syntax, responsive images, shelf, social cards, app
  links, source/PDF and six-book round-trip checks pass locally. Live delivery,
  app/portfolio results and CI are appended after completion.

## Audit decisions and limits

The monorepo's `READS-BOOK-REVIEW-2026-10-19.md` records all seven full-book
reviews (34 illustrations). Both older Ted books consistently depict the
vest/neckerchief that their button/pocket plots name. They are retained as
coherent story costumes. Replacing only two covers would create a mismatch;
an optional future canonical-style commission needs all 14 pages and must
preserve that story logic. No unnecessary fourteen-picture regeneration was
performed in this batch.

Deep Glow and Metamorphosis are Pro in the app. Their retained-art reviews
do not grant free-web publication; retain the November decision. Safari's
art/expansion decision and further ABC/Pro/Zoo commissions also remain at the
existing 15 November measurement gate. Android/iPhone voices, boundaries and
interruptions need real-device evidence; browser API simulations do not prove
real speech quality or offline voice availability. Native app builds/submission
remain assigned to Claude unless Mark explicitly assigns a specific release.
