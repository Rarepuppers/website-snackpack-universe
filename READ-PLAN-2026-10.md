# /read/ - current plan

Audited 2026-10-19 against app exports, local book pages/PDFs and the live
website. This is the task list. Completed phase tables are preserved in
[the archived snapshot](docs/archive/READ-PLAN-2026-10-18-completed-phases.md).
Shipped changes are in [release notes](docs/RELEASE-NOTES.md).

## Current delivery

**47 books, 279 story pages, 47 printable PDFs.** All page texts match current
exported app data, allowing importer quote/dash typography. All primary app
quizzes used by published Spelling books match the website. Every PDF contains
its story prose. The 43 previously published article sets/PDFs were verified live; the four
19 October additions are covered by the publication verification record. There
is no text re-import or PDF rebuild backlog. This is a source/parity audit,
not a fresh visual or scientific fact review of every illustration/sentence.

| Group | Books |
|---|---:|
| Complete alphabet picture books | 1 |
| Stage 1-3 decodables | 6 |
| Reading Trail | 6 |
| Short reads | 16 |
| Number stories | 16 |
| Animal fact books | 1 |
| Read-aloud picture books | 1 |

Panda-Cake's A-Z, all seven free Counting stories (including Corgi,
Honey-Beats and Cereal-Swimmer), Pocketful of Sounds, Animal Architects and
the nine approved Basic Math books are complete in source and on the shelf.
Wise Owl's maths fixes, the four short-read rewrites, six stronger end
questions and Lionnaise's corrected bridge question are complete. All 43
PDFs were rebuilt on 18 October with prose beneath the pictures.

App source completion does not prove an installed Play build includes it.
Claude owns release preparation/build/submission for the changed ABCs,
Counting, Spelling, Basic Math and Zoo apps. Confirm the next release's
source commit contains the relevant changes; no new build was run here.

## Work remaining now

| Task | Source work | Website work | Owner / next step |
|---|---|---|---|
| Other Spelling books held back on quality | Source repairs completed across 27 books including the four above; four additional Deep Glow/Metamorphosis pictures repaired | Keep off shelf until each book's full art and publication review passes | Claude review; no blanket approval for remaining books |
| Safari Morning | All nine source pages repaired, display/TTS aligned, factual references registered | Not published; original-art decision remains deferred | Claude app release handoff; Zoo expansion decision after re-measure |
| Read to me | No source defect demonstrated; real Android/iOS voice and boundary check lacks recorded evidence | Check actual audio, highlighting, pause and speed on devices | Mark/device tester |
| Decodable importer | Template warning says re-importing a live book strips modern reader features | Modernise before next existing-book re-import; do not regenerate these six now | Maintenance before next import |

Source repairs completed on 19 October. Monorepo delivery evidence is in
`docs/SHORT-READS-CONTENT-HANDOFF-2026-10-19.md` and
`docs/READ-CONTENT-REPAIRS-2026-10-19.md`. The original brief's nine pictures,
four additional science pictures and source quiz corrections are delivered.
Mark reassigned the website handoff to Codex on 19 October. Blanket Fort,
Library Day, Moonlight Story and Garden Race are now imported with the app
text, corrected quizzes, reviewed art, four new printable PDFs, responsive
images, social cards and shelf/offline entries. Publication verification is
recorded in `docs/SHORT-READS-PUBLICATION-2026-10-19.md`. App native builds
and submissions remain with Claude unless Mark assigns a specific release.

## Deferred until 15 November 2026

- Re-measure books per visit, views per visit, internal book referrals,
  direct/chat discovery, ABC discovery and Animal Architects engagement.
  Use `node scripts/report-referrals.mjs --history`, Cloudflare `/read/*`
  paths and GSC page/query rows. Account for time live and small samples;
  search demand and the historical "$0" claim are not verified facts.
- Decide whether to commission the other four complete ABC books:
  Eggs-Benedict, Meow-inara, French-Toast and Wise Owl. Audit words, image
  subjects and character consistency first. Wise Owl's old-word art means
  "18 missing pictures" is not a reliable estimate. No taster/emoji shortcut.
- More free Pro books need a quality read and Mark's approval. Counting's
  Booklava and the Number That Hid is a candidate, not an approved
  publication. Do not change app access tiers.
- For another Zoo book, prefer a quality read of Ocean Dive or Jungle
  Secrets if Animal Architects shows demand. Stock photography is not an
  approved substitute for original page art; audit provenance first.
- Consider the five reviewed reserve short reads: Mountain Climb, Coral
  Reef, Luckybug's Art Gallery, Corgi's Countryside Run and Slow and Steady.

Outreach remains Mark's task. [The teacher-resource pitch](LINK-BUILDING-PLAN.md)
now describes 47 books; no outreach messages were sent. Keep the existing
re-measure schedule rather than creating a duplicate reminder.

## Publication rules and implementation

No sign-up, email capture or ads in `/read/`. Every story page needs reviewed
art, consistent characters and correct visible lesson counts. Copy app text
verbatim; fix source first. Alt text, leads and web-only end questions are
editorial. Free in the app, or explicit approval for free-web Pro content.

| App content | Importer under `scripts/` |
|---|---|
| ABC decodables | `import-decodable-book.mjs` (stale template; see maintenance task) |
| ABC full A-Z | `import-alphabet-book.mjs` (26 pages, art pins and hashes) |
| ABC featured story | `import-abc-story.py` |
| Spelling Reading Trail and short reads | `import-reading-trail-book.mjs` |
| Counting | `import-counting-book.mjs` |
| Basic Math | `import-math-story-book.py` |
| Zoo | `import-zoo-book.mjs` (generated-art provenance gate) |

After a reviewed import: `build-webp.mjs` -> `build-read-pdfs.mjs --slug=<slug>
--write` -> `build-read-responsive.mjs` -> `build-read-shelf.mjs` ->
`build-read-social-cards.py` -> `build-breadcrumbs.mjs` ->
`build-play-links.mjs` -> `build-go-links.mjs` -> `build-sitemap.mjs`.
Verify integrity, contrast, shelf, responsive images, social cards, app
parity, PDF prose and phone layout. Push scoped website changes and verify
the live URL before calling a book published. Notify search engines for new
public book URLs using the existing script.

Never bump `sw.js` CACHE for reader code/markup: it wipes saved offline
shelves, and code is network-first. Changed art needs **new web filenames**
because images are cache-first. Bump the importer's per-book `rev` and cover
path. The nested website is a separate Git repository. When local main has
unrelated divergent work, publish a scoped patch on the current remote head;
do not push other sessions' commits or reset their files.

## Historical evidence

- [Archived website plans](docs/archive/README.md).
- Monorepo audit: `docs/READ-AUDIT-2026-10-19.md` and
  `docs/read-audit-2026-10-19.json`.
- Completed monorepo art briefs/reviews/handoffs:
  `docs/archive/read-2026-10-19/README.md`.
- Completed Zoo brief:
  `apps/snackpack-zoo-world/docs/archive/ART-BRIEF-ANIMAL-ARCHITECTS-2026-10-16.md`.
- Accepted historic art limits: Number Nest bundle/tower spine totals and
  Clockwork Concert page 1's slightly low hour hand. Mark accepted them on
  17 October; preserve the records, not a new regeneration task.
