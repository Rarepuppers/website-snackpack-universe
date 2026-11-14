# /read/ - current plan

Audited 2026-10-20 against app exports, local book pages/PDFs and the live
website. This is the task list. Completed phase tables are preserved in
[the archived snapshot](docs/archive/READ-PLAN-2026-10-18-completed-phases.md).
Shipped changes are in [release notes](docs/RELEASE-NOTES.md).

## Current delivery

**54 books, 307 story pages, 54 printable PDFs (379 printed pages).** All page texts match current
exported app data, allowing importer quote/dash typography. Both app
quizzes used by all 29 published Spelling books match the website. Every PDF contains
its story prose. The full current shelf and both new music/flight books are covered by
[this batch’s delivery record](docs/READS-DISCOVERY-DELIVERY-2026-10-20.md). There
is no text re-import or PDF rebuild backlog. This is a source/parity audit,
not a fresh visual or scientific fact review of every illustration/sentence.

| Group | Books |
|---|---:|
| Complete alphabet picture books | 1 |
| Stage 1-3 decodables | 6 |
| Reading Trail | 6 |
| Short reads | 23 |
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

## Quality and offline batch - 20 October

- Luckybug's Art Gallery and Corgi's Countryside Run pass full art/text/quiz
  review and add eight pages. Existing pictures are retained; Corgi's two
  pronoun corrections were made in the app first.
- Both app questions appear in all 27 published Spelling books and their PDFs,
  with exact answer/explanation guards. Stale questions were corrected in the
  app; an importer boundary bug caught during render review is repaired.
- Save one book or the whole shelf, cancel/retry, remove saved books without
  deleting games. Complete counts require every image/shared file and the
  current story HTML. Unsaved books offline have a clear bookshelf return.
- Reader keys respect interactive controls and modifiers; page changes and
  completion have suitable focus, with reduced-motion and phone-thumbnail checks.
- Individual PDFs show actual sizes/printed counts. Open PDF to print and exact
  question-page ranges offer a lower-ink choice without removing illustrations.
  Three collections are rebuilt; their contents encoding is checked too.
- Release inclusion checklist is monorepo
  `docs/READS-APP-RELEASE-CHECKLIST-2026-10-20.md`. This batch does not build apps.

See [delivery and validation](docs/READS-QUALITY-DELIVERY-2026-10-20.md).

## Earlier improvements - 19 October

- Search titles/characters/topics with shareable query, age/type filters and
  one reset; Start here links explain the available reading paths.
- Device-only reading position, explicit Resume/Start again, Forget action,
  and normal/larger text controls, including one-page mode. Blocked/corrupt
  storage cannot block reading. Related books follow quiet/kindness/skill
  choices while phonics keeps its stage/step order.
- The three free reserve stories add twelve pages. Coral Reef page 2 now
  shows four arms on two stones and four on the coral, corrected in the app
  first. The other eleven pictures and all app text/quizzes are retained.
- Three printable collections reuse approved books: first phonics (57 printed
  pages), quiet stories (11) and kindness (31). Contents/bookmarks and individual
  downloads included; collections are not additional books in the shelf count.
- Publication checks now compare actual current app exports locally and
  committed evidence explicitly in CI; art/metadata/PDF text and six-book
  decodable round-trip checks catch changed or incomplete imports.
- Complete Ted-set audit retains the coherent story-specific vest artwork;
  a future style-unification commission would involve 14 pages and must
  preserve the vest/button/pocket plot rather than replacing two covers.

Full implementation/verification: [delivery record](docs/READS-POLISH-DELIVERY-2026-10-19.md).
Publication commands and safeguards: [workflow](docs/READING-PUBLICATION.md).
The accepted detailed plan is monorepo `docs/READS-NEXT-BATCH-PLAN-2026-10-19.md`.

## Discovery and guidance batch - 20 October

- Saved card status and a device-only saved filter share the actual cache completeness check; search/type/age combine, with reset and blocked-storage recovery.
- Six-book claims audited against ABC's existing auditor, exceptions and parent notes; two faulty source notes corrected. Reading Trail is labelled shared practice.
- Two distinct next choices preserve stage/Trail order and offer a route beyond the immediate quiet-story pair. Homepage six slots represent phonics, alphabet, short reads, numbers and animals with full pictures.
- Pork-ulele's Picnic Song and Captain Beakon's Air Show pass all eight page reviews and four quizzes. Seven pictures retained, one corrected proof delivered app-first. Colour wording corrected app-first; exact imports and both rendered five-page PDFs accepted.
- Decodable importer work and permanent source/art/PDF guards are complete; six-book round-trip verification remains required on publication.

See [current delivery](docs/READS-DISCOVERY-DELIVERY-2026-10-20.md). The existing 15 November gate is unchanged.

## Work remaining now

| Task | Source work | Website work | Owner / next step |
|---|---|---|---|
| Other Spelling books held back on quality | Source repairs completed across 27 books including the four above; four additional Deep Glow/Metamorphosis pictures repaired | Keep off shelf until each book's full art and publication review passes | Further per-book art review; no blanket approval for remaining books |
| Safari Morning | All nine source pages repaired, display/TTS aligned, factual references registered | Not published; original-art decision remains deferred | Claude app release handoff; Zoo expansion decision after re-measure |
| Read to me | No source defect demonstrated; real Android/iOS voice and boundary check lacks recorded evidence | Check actual audio, highlighting, pause and speed on devices | Mark/device tester |

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

- **Re-measured 15 November 2026 (done; replaces the re-measure to-do).**
  Cloudflare, 30 days to 14 November vs the 30 days before (counts bucket
  to 10). Two things distort the raw totals: page turns and shelf filters
  were logged as views until the 6 November `spa: false` fix, and one
  Honduras classroom (country HN, about 2,100 `/read/` views from 2 to 11
  November, with almost no new visits) arrived inside the site. Raw `/read/*`
  views went 970 → 5,390 and are not usable. Visits (arrivals from outside
  the site) are not affected:
  - **Reach tripled and held.** `/read/*` visits went 450 → 1,400 (about 15 →
    47 a day). The clean 7–14 November week still ran 45 a day. Hub visits
    went 340 → 650; homepage visits 550 → 710.
  - **Books per visit: not shown to be up.** Book pages opened from inside the
    site, per `/read/` visit: 0.80 before, 1.54 in the inflated 16 Oct–1 Nov
    window, and **0.50 in the clean week without Honduras** (1.00 with it).
    Views per visit in the clean week without Honduras: 1.56 (2.16 before,
    which may also include some filter-change views). The October changes
    brought more arrivals, but each visit does not read more books.
  - **Shared links: book pages reached with no referrer went 110 → 750.**
    These are people opening a specific book directly, which fits links
    pasted into chats. Pasted links that picked up a trailing word
    (`/Please`) are a sign of this, and are now recovered by 404.html.
    Named chat-app referrers stayed tiny: Telegram 10 → 0, m.facebook.com
    10 → 0, no WhatsApp or l.facebook.com. chatgpt.com fell 60 → 10
    site-wide. A school portal, `bisibahcesehir.k12net.com`, sent 120.
  - ABC discovery: `/read/panda-cake-discovers-her-abcs/` 120 views / 20
    visits. Animal Architects: 140 views and **no outside visits**, so nobody
    arrives looking for it; this does not show demand for another Zoo book.
    `/read/sound-cards/` had 10 views in Cloudflare.
  - **Search Console** (28 days to 12 November vs the 28 before): `/read/`
    URLs went 70 → 353 impressions and 5 → 17 clicks, from 9 to 62 pages.
    The Cat and the Rat PDF leads (61 impressions / 6 clicks at position
    7.8). `/read/sound-cards/` 48 at position 26.6; the `/read/` hub 42 / 4.
    Whole site: 2,153 → 7,518 impressions, 66 → 211 clicks, position 10.3 →
    7.7. About 70% of that is `/play/thirteen/` (5,377 / 116).
  - Verdict: the build-out widened reach (more visits, more directly shared
    book links, early search impressions) but did not increase books per
    visit. Measure next from 7 November onward only, with HN separate, and
    count visits rather than views. Raw scripts are kept outside the repo; the
    `report-referrals` history row is dated 2026-11-14.
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
- Mountain Climb, Coral Reef and Slow and Steady completed review and join
  this batch. Luckybug's Art Gallery and Corgi's Countryside Run passed review and
  join the 20 October batch. Deep Glow and Metamorphosis were fully reviewed but are Pro in
  the app; retain the November publication decision for them.

Outreach remains Mark's task. [The teacher-resource pitch](LINK-BUILDING-PLAN.md)
now describes 54 books; no outreach messages were sent. Keep the existing
re-measure schedule rather than creating a duplicate reminder.

## Publication rules and implementation

No sign-up, email capture or ads in `/read/`. Every story page needs reviewed
art, consistent characters and correct visible lesson counts. Copy app text
verbatim; fix source first. Alt text, leads and web-only end questions are
editorial. Free in the app, or explicit approval for free-web Pro content.

| App content | Importer under `scripts/` |
|---|---|
| ABC decodables | `import-decodable-book.mjs` (preserves reviewed shell; pinned art; round-trip guard) |
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
