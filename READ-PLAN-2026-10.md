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
