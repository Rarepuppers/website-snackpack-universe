# /read/ — plan of record

Updated 2026-10-15, end of day. This is the **current** plan: what is live, what
is open, and the rules for adding to the shelf. The day-by-day build log, with
every decision and measurement behind it, is archived at
[`docs/archive/READ-PLAN-2026-10-15-build-log.md`](docs/archive/READ-PLAN-2026-10-15-build-log.md).
What shipped, in release form, is in [`docs/RELEASE-NOTES.md`](docs/RELEASE-NOTES.md).

## Why /read/ matters

On 2026-10-15 `/read/` was the busiest and fastest-growing part of the site
(hub 130 → 540 views in 30 days; mobile tripled; ChatGPT referrals 20 → 70).
The growth came from **links shared between parents and teachers**, not search:
Google showed `/read/` only 2 impressions in 90 days. So the priorities are
books worth sharing, easy sharing, and a good read on a phone, in that order.

**Hard rule:** no sign-up, email capture, interstitial or ad anywhere in
`/read/`. Being free with no friction is why it gets shared.

## Status at a glance

| Area | State |
|---|---|
| Shelf | **17 books**, 17 PDFs: Stage 1–3 decodables (6) · Reading Trail steps 1–6 · Number stories (5) |
| Hub | Stage-ordered groups, stage shortcut chips, ItemList schema, "Save the bookshelf for offline" |
| Every book | Next-story chain, Share button (top and end), 1200×630 share card, printable PDF, Read to me, One page at a time |
| Number stories | Tap-to-answer question on every page, plain-list + "Show the answer" fallback |
| Printables | `/read/sound-cards/`: 8 sheets, Stage 1 → word endings, one A4/Letter page each |
| Homepage | `#read` section with six real books and the live shelf count |
| Search | Hub title "Free Decodable Readers & Printable Phonics Books"; all pages submitted to Google, Bing and IndexNow |

## Next round: review, fixes, improvements and new books (planned 2026-10-15)

Grounded in a content review of all 17 live books (live pages checked in
Playwright, text diffed against each app's source) and an inventory of every
app's illustrated books. Work top to bottom: each phase is independent of the
ones below it.

### Phase A: fix what the review found (no decisions needed)

**Status 2026-10-15: A1–A4 DONE** (see `docs/RELEASE-NOTES.md`). A5 waits on
Mark's device check. Decodable end questions live in `QUESTIONS` in
`import-decodable-book.mjs`; that importer's template is stale, so use it for
new books only.

| # | Finding | Fix |
|---|---|---|
| A1 | **Ted-E-Bear's Short-Vowel Kit differs from the app on all 5 pages.** The app text was rewritten after the August import. The web copy uses words a short-vowel reader cannot decode yet (props, clips, grins, snug, slips). | Re-import from `reading-trail-drafts.ts` with `import-reading-trail-book.mjs` (add a `BOOKS` entry, keep the slug), rebuild its PDF, re-check the highlights. The other 12 phonics books match the app word for word. |
| A2 | **5 of 6 decodables have no end-of-book question** (only Pip Sits has one, written for the web in August). The app data has none to copy. | Write one comprehension question per book from its own text, in Pip Sits's format. This is web editorial, like alt text: decodable words only, plus the answer. |
| A3 | **4 images have missing or under-15-character alt text** (Bug in a Cup ×1, Nan and Pip ×2, The Cat and the Rat ×1). **Each Reading Trail book uses page 1's art as its cover with the same alt text**, so screen readers hear it twice. | Describe the four pictures. Set the title image's `alt=""` where it repeats page 1. |
| A4 | **The printable-readers guide still says "Eight free printable readers"** in its title, H1, description and schema. The shelf is 17 books plus sound cards. | Refresh the guide's copy and book list to the current shelf, keeping the URL. It is the one `/read/` page with Google clicks, so change the copy, not the structure. Re-check in Search Console two weeks later. |
| A5 | **Read to me has only been tested with a stub engine.** | Mark: try it once on an Android phone and an iPhone/iPad. iOS Safari fires fewer word-boundary events, so highlighting may lag; if it does, highlight by sentence there. |

### Phase B: add books (free tier, after a quality read)

Same rules as always: every page illustrated, a quality read of every page and
picture, text verbatim, and nothing Pro without Mark.

| # | Source | What is there | Plan |
|---|---|---|---|
| B1 | **1-2-3 Counting**, free | 2 stories: `panda-cake-market-basket`, `sub-zero-snowflake-post` | **Read 2026-10-15: neither publishable; app fixes owed.** Panda-Cake's art mapping in the app is shifted one page (pages 2–5 show the wrong picture; page 2's image is an off-model panda with a dolphin), and page 5 has no art of its own. Sub-Zero's pages 1–5 show a scarf penguin, while page 6 shows the canonical chef-hat Sub-Zero, and page 2's sleds carry shapes, not numbers. |
| B2 | **Sentences & Spelling quick reads**, free (`STORY_BOOKS` + `EXTRA_STORY_BOOKS`) | **~60 four-page books with every page illustrated on disk** (wired through `BOOK_PAGE_ARTWORK`), each with a talk prompt per page and a 2-question quiz, in the same format as the Reading Trail | The biggest source by far, but read all 60 before importing any. Quality varies, and about a third are science/topic books (glacier, materials, five senses, continents) that need a **fact check**. Sample finding: `sub-zero-glacier-discovery` says a glacier may be "older than mountains", which is wrong. Pick the best **12–20** for a new **"Short reads"** group, themed (friendship and feelings · nature and science · adventures). Extend `import-reading-trail-book.mjs` to read `books.ts`; the quiz becomes the end-of-book question. |
| B3 | **Zoo World animal books** | 16 books (Arctic Ice, Ocean Dive, Masters of Disguise…), each a cover plus 9 generated illustrations; the app has a fact-validation pipeline | Highest search demand of any source ("animal facts for kids"). **Check first:** which books are free, that every image is generated rather than a licensed photo (`unsplashBundledImageCredits.ts` exists in the app), and that the text passes the app's validators. Then quality-read and add an **"Animal fact books"** group. |
| B4 | Held-back books, once their app fixes land | Pork-ulele, Wise Owl, Ted-E-Bear's Lantern, Booklava (task proposed); Pocketful of Sounds (art); 5 ABC books (text) | Re-read after the fix, then import with the existing scripts. |
| B5 | **Pro books with full art** (Mark's call) | e.g. Counting's *Booklava and the Number That Hid* and *The Night the Lanterns Went Out*; the Pro Spelling quick reads | Only if Mark approves publishing more Pro content free. Today's revenue is $0, so the cost is low, but it's his decision. |

Not candidates: Earth Science and Space Math (one cover per story), Mathematics
(two scenes per story), Store Keeper (app is unbuildable).

### Phase C: improve the experience (once the shelf passes ~25 books)

| # | Improvement | Why |
|---|---|---|
| C1 | **Responsive images**: a 600 px WebP per page plus `srcset`/`sizes` | Most readers are on phones (mobile views tripled in October). Pages send 768–1200 px art to a 390 px screen. Expect about 60% less data per book. |
| C2 | **Hub filters**: by age/year and by skill, plus a "New" badge | A 30+ book shelf is a long scroll. Generate from `SHELF` (add `age` and `skill` fields), with no client framework. |
| C3 | **Questions page in each PDF**: the book's quiz or end question and the talk prompts on a final printable page | Teachers print; the PDFs currently have pictures only. Extend `build-read-pdfs.mjs` (it is zero-dependency, so text pages need a simple built-in font path). |
| C4 | **Read to me controls**: a slower/normal speed toggle, remembered on the device (localStorage, wrapped in try/catch) | Early readers need slower speech; adults reading along may want normal. |
| C5 | **Richer `Book` schema**: `typicalAgeRange`, `educationalAlignment` (phonics stage / school year), `numberOfPages`, `inLanguage` | Helps search engines and assistants match "decodable reader stage 2" or "Year 3 maths story". |

### Phase D: decisions for Mark

1. Zoo World animal books on the web? (Depends on B3's free and licence check.)
2. Any more Pro books free (B5)?
3. Pocketful of Sounds: commission 7 illustrations, or a text-led read-aloud format?
4. Phase A5: a two-minute real-device check of Read to me.

### Order and size

A1–A4 are small and can ship together (one session). Then B1 (small), B2 (large,
mostly reading: plan a session for the read and a session for the import),
then C1 (medium, mechanical) and C2 once B2 lands. B3 waits on its checks.
Re-measure on 2026-11-15 (already scheduled) before committing to B2's full
size: if multi-book sessions grew, scale up; if not, stop at 12 quick reads.

## Open: needs Mark

1. **Pocketful of Sounds art.** `ted-e-bear-pocketful-of-sounds` (app1, free,
   rated excellent) has a cover and 1 of 8 pages illustrated. Commission 7
   interiors, or decide on a text-led read-aloud format.
2. **ABC book text.** The 5 free alphabet books fail the quality bar in the
   *app*. Panda-Cake's pages say "his" under a "Her ABCs" subtitle, some entries
   are fragments, and French-Toast/Wise Owl are remixed Ted-E-Bear sentences.
   Fix `apps/snackpack-1-abcs-alphabet/constants/alphabet.ts` first.
3. **Basic Math content fixes** (proposed as their own task). Pork-ulele's
   page 1 clock shows the wrong time; Wise Owl's page 1 question and page 2
   prime explanation are wrong; Ted-E-Bear's Lantern and Booklava change
   character design mid-book. Once fixed, add them via
   `scripts/import-math-story-book.py`.
4. **Outreach.** `LINK-BUILDING-PLAN.md` §4 has the homeschool/phonics pitch,
   updated to 17 books. Only Mark can post it.
Done 2026-10-15: Mark disabled the World Cup workflow and granted the `workflow`
scope; the `build-read-shelf.mjs --check` step is now in `site-check.yml`.

## Open: can be done without a decision

- **Re-measure on or after 2026-11-15.** Run `node scripts/report-referrals.mjs --history`,
  the Cloudflare `/read/*` paths, and GSC page rows for `/read/*`. Success means
  more books per visit (`www.snackpackuniverse.com` as referrer on book pages,
  and views per visit), not raw totals. Share-button taps are not counted:
  sharing happens in the browser, where Cloudflare's beacon cannot see it. Its
  effect shows up as chat-app referrers (Telegram, WhatsApp, `l.facebook.com`)
  and direct visits to book pages.
- **Hear Read to me on real devices.** It was tested with a stub engine, because
  headless Chromium has no voices. Voice quality and word-boundary events vary
  by device. Safari on iOS fires fewer boundary events, so highlighting may lag.
- **Cache bump.** Batch 3 (Number stories) changed `site.css`/`reader.js`
  without bumping `sw.js` `CACHE`, because another session had uncommitted
  edits there. Code is network-first, so this is not urgent. Bump at the next
  sw.js commit.

## Rules for adding a book

1. **Free in the app**, or explicitly approved by Mark. Reading Trail steps 3–6
   (Pro) were approved 2026-10-15; the 4 Pro decodables were approved
   2026-08-13. Nothing else Pro.
2. **Every page illustrated**, resolved the way the app resolves it. Basic Math:
   `getBookPageImage(illustrationId ?? page.id)`. A first measurement that
   ignored the page-id fallback wrongly reported books as unillustrated.
3. **Quality read before import.** Read every page and view every image. Reject
   wrong maths or facts, wrong pictures (e.g. a clock showing the wrong time),
   characters that change design mid-book, and weak or remixed text.
4. **Text verbatim from the app.** Web-only editorial (alt text, lead line,
   share-card blurb) lives in each importer's `BOOKS` map and describes the
   actual picture.

### How (per source)

| Source | Importer | Then |
|---|---|---|
| app1 decodables | `scripts/import-decodable-book.mjs` | add to `SHELF` |
| app3 Reading Trail | `scripts/import-reading-trail-book.mjs` (alt text in `BOOKS`) | add to `SHELF` |
| app4 Basic Math | `scripts/import-math-story-book.py` (converts WebP → JPEG for the PDF builder) | add to `SHELF` (group `numbers`) |

After any import, run these in order: `build-webp.mjs` →
`build-read-pdfs.mjs --slug=<slug> --write` → `build-read-shelf.mjs` (hub, chain,
ItemList, homepage, offline manifest) → `build-read-social-cards.py` →
`build-breadcrumbs.mjs` (it has **no** `--check`; it writes, so commit only your
paths) → `build-play-links.mjs` → `build-go-links.mjs` → `build-sitemap.mjs`.
Verify with `check-site.mjs`, `check-contrast.mjs`, `build-read-shelf.mjs --check`
and `build-read-social-cards.py --check`. After pushing, confirm the live URLs
and run `scripts/notify-search-engines.mjs <urls>`.

## Held back (and why)

| Book | Source | Reason |
|---|---|---|
| Pocketful of Sounds | app1 featured, free | 1/8 pages illustrated |
| 5 ABC books | app1, free | text quality (pronouns, fragments, remixes) |
| Pork-ulele's Clockwork Concert | app4, free | page 1 clock shows 4:15 for "quarter past three" |
| Wise Owl and the Festival of Factors | app4, free | page 1 question wording; page 2 prime explanation |
| Ted-E-Bear's Lantern; Booklava's Number Nest | app4, free | character designs change mid-book |
| Vincent Van Mouse and the Mural | app4, free | 4/7 pages illustrated |
| Panda-Cake's Market Basket | app2, free | app art mapping off by one on pages 2–5; off-model page-2 image; page 5 has no art |
| Sub-Zero and the Snowflake Post | app2, free | Sub-Zero changes design on page 6; page 2 sleds show shapes, not numbers |
| "Which book first?" QR PDF | — | dropped: the stage-ordered hub does the job, and QR would add the repo's first dependency |

## Gotchas worth keeping

- **Offline save** writes into sw.js's own `snackpack-arcade-*` cache, the only
  cache sw.js serves offline pages from. Every sw.js `CACHE` bump empties it,
  and the hub then honestly offers "Save all N books" again.
- **The offline manifest's size counts art only.** Counting HTML/CSS would make
  `build-read-shelf.mjs --check` fail on any unrelated site edit.
- **Homepage book cards must not carry `width`/`height`.** `.storybook-card img`
  sets `aspect-ratio` without `height:auto`, and the attribute stretches it.
- **Pushing with another session's unpushed commit on local `main`:** build your
  commit on the remote head with a temporary index, push that, then commit locally
  and merge. See the memory note on this.
