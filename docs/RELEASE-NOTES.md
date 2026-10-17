# Release notes — snackpackuniverse.com

Newest first. Every push to `main` deploys through GitHub Pages; each entry
names the commit that shipped it. These notes start on 2026-10-15; for earlier
changes see the git history and the plans at the repository root (finished ones
are in [`docs/archive/`](archive/README.md)).

## 2026-10-17 — Eight new books (39 on the shelf)

- **Three counting stories** from SnackPack 123 Counting, each with a
  tap-to-answer question on every page: *Panda-Cake's Market Basket* (counting
  and making ten, ages 3–4), *Sub-Zero and the Snowflake Post* (number order,
  ages 4–5) and *Luckybug's Pairing Parade* (odd and even numbers, ages 4–6).
- **Four number stories** from SnackPack Basic Math: *Ted-E-Bear and the
  Lantern That Needed a Half* (halves and doubles, Year 1), *Booklava and the
  Number That Lost Its Place* (place value, Year 2), *Pork-ulele and the
  Clockwork Concert* (telling the time, Year 2) and *Vincent Van Mouse and the
  Mural in Proportion* (ratio and scale, Year 6).
- **A read-aloud picture book**, *Ted-E-Bear and the Pocketful of Sounds* from
  SnackPack ABC: a nervous reader learns to begin with one small sound. Each
  page has a first sound to find and a line to say together. It starts a new
  "Read-aloud picture books" group on the shelf.
- All eight were held back until their pictures were fixed: missing pages
  drawn, characters kept the same from page to page, clocks set to the right
  time and every counted thing drawn the right number of times. 37 new
  pictures in all, and the same fixes reach the apps in their next updates.

## 2026-10-17 — The bookshelf and the header on a phone

- **The free books and games are near the top of the homepage.** On a phone they
  used to start about 16,500 px and 22,600 px down, behind the full list of
  apps; now the bookshelf comes straight after the welcome and the arcade
  after that. Desktop gets the same order.
- **The bookshelf fits a phone.** Two books a row, each card just the cover,
  title and stage, so the first books show on the first screen and the whole
  shelf is about a third as long (8,600 px instead of 26,800). The type and
  age filters sit on one scrolling line each; "Save the bookshelf for offline"
  moves to the end of the shelf. Phones also download smaller cover images.
- **Each book starts sooner.** A smaller title area, and a cover picture no
  taller than about two-fifths of the screen. Where the cover is only page 1
  again, it is left out on phones, so the story begins straight away.
- **A slimmer header everywhere on phones and tablets.** The menu used to wrap
  into a second row and stay pinned at about 155 px, a fifth of a phone screen
  on every page. It is now one pinned row of about 51 px: the SnackPack logo,
  then the links on a single line you can swipe sideways. Desktop is unchanged.
- Fix: the Animal Architects cover was stretched tall (355 × 600 for a 3:2
  picture) on every screen size. Covers too small to need a WebP copy now get
  the same sizing as the rest.

## 2026-10-16 — Animal Architects, the first animal fact book

- **Animal Architects: Built by Nature**, from SnackPack Zoo World: nine pages on
  how beavers, honeybees, weaverbirds, rabbits, octopuses, meerkats and ants
  build their homes, and the problem each home solves. Free, with Read to me,
  one-page mode, a printable PDF and a question at the end.
- Every picture is original SnackPack art. Most Zoo World books use stock
  wildlife photos, which this shelf does not republish, so six new pages were
  made for this book. The importer refuses any page that isn't recorded as
  original art.
- The facts are checked against the Smithsonian National Zoo, the US
  Geological Survey and the San Diego Zoo, linked at the end of the book.
- A new **Animal fact books** group and an **Animals** filter on the bookshelf.
  The pictures show at their full shape, uncropped.
- Fix: a book cover small enough to skip its WebP copy no longer leaves the
  bookshelf card pointing at a missing image.

## 2026-10-16 — Correct US grades on the number stories

- The four number stories gave the wrong US grade beside the UK year: they
  said Year 1 = Grade 1, but US grades run one year behind (Year 1 is
  Kindergarten, Year 2 is Grade 1, Year 3 is Grade 2, Year 4 is Grade 3).
  Fixed on each book's label, search description and schema.
- Fixed at the source too: the Basic Math app's book data had the same
  mistake (the app itself showed the right grade), and its content check now
  catches any mismatched pair, so a future import can't bring it back.

## 2026-10-16 — Richer book details for search engines (Phase C5)

- Each book page now tells search engines and assistants its age range, number
  of pages, language (British English), that it is an e-book with a printable
  PDF, and what it teaches: the subject, the phonics stage, Reading Trail step
  or UK school year, and the topic or sounds it covers. This helps match searches
  such as "decodable reader stage 2" or "Year 3 maths story".
- Generated from the shelf list, and checked in CI, so new books get it
  automatically. Nothing visible on the pages changes.

## 2026-10-16 — Read to me speed (Phase C4)

- A **Speed: slow / normal** button now sits beside every "Read to me" button.
  Slow (the default, as before) suits a child following each word; normal suits
  an adult reading along.
- One tap changes the speed for the whole book, and a page that is being read
  restarts at the new speed. The choice is remembered on that device, and
  nothing leaves the device.
- No service worker bump, so bookshelves that readers saved for offline stay
  saved.

## 2026-10-16 — Questions page in every printable book (Phase C3)

- Every "Print this book (PDF)" now ends with a **questions page**: the talk
  prompt for each page (or, in the number stories, the maths question with its
  choices), then the question to ask at the end of the book.
- All the answers sit together below a dotted line, so a printed copy can be
  folded to hide them and used as a quiz. The answers always stay on one page.
- The questions are taken from each book's web page when the PDF is built, so
  the printed copy can't drift from the online one. The PDFs grew by only a few
  KB each and still fit A4 and US Letter.

## 2026-10-15 — Bookshelf filters and "New" badges (Phase C2)

- The bookshelf can be filtered by **type** (Phonics, Stories, Maths) and by
  **age** (3–4, 5–6, 7–8, 9–10). Groups and stage shortcuts with nothing left
  in them hide themselves, a line says "Showing N of 29 books", and an empty
  combination offers a one-tap reset.
- Filters live in the address bar (for example `/read/?type=maths&age=7-8`),
  so a parent or teacher can share exactly the books that suit a child.
- Books added in the last 30 days carry a **New** badge, worked out from the
  reader's own date, so it never goes stale.
- Ages come from the apps where they record one (Basic Math, 1-2-3 Counting);
  phonics books follow the usual UK phonics timing. Without JavaScript the
  filters stay hidden and the full shelf shows.

## 2026-10-15 — Lighter pictures on phones, tablets and desktops (Phase C1)

- Every /read/ picture now comes in 480, 800 and 960 px WebP sizes as well as
  the original, and the browser picks the smallest one that is still sharp for
  the screen. The `sizes` hints match the layout as measured on a phone, a
  tablet and a desktop.
- Measured image data per visit: **−66%** on desktops and tablets, **−26%** on
  2× phones, **−10%** on 2.6× phones (−30% on the landscape books). 3× iPhones
  are unchanged, because they genuinely need the full resolution.
- "Save the bookshelf for offline" still saves only the originals (22.8 MB).
  The service worker (`snackpack-arcade-v23`) now shows the saved original when
  an offline page asks for a smaller size, which was tested by saving, going
  offline and opening a book.
- CI checks every book page offers the sizes (`build-read-responsive.mjs --check`).

## 2026-10-15 — Short reads: 12 new four-page stories (Phase B2)

- A new **Short reads** group: twelve free illustrated stories from SnackPack
  Sentences & Spelling, each with a talk prompt on every page and a question at
  the end. Friendship and kindness (Baby Bulldogs at the Playground,
  Fe-Line-Mignon's Moonlit Café, Octo-Pop's Ocean Adventure, Hen-Berry's
  Helping Day, Ham-and-Cheese's Big Maze), adventures and mysteries
  (Stripe-Scout's Trail Clues, Lionnaise and the Dragon, Polly Roger's Pirate
  Cove, Foxy-Lox's Mystery Trail), and nature and the night sky (Nutmeg's Garden
  Morning, Captain Beakon's Star Watch, Nutmeg's Four Seasons). The shelf is
  now 29 books.
- Chosen from all 60 free short reads after reading every one and checking the
  art. Science books with factual errors, and books whose characters change
  design mid-book, were left out (details in `READ-PLAN-2026-10.md`). Five more
  are approved and held until the 15 November re-measure.
- The printable-readers guide's title and heading now count only the phonics
  books (12), which is what "decodable readers ... for early phonics practice"
  claims. The descriptions count every early reader (29).
- Fix: long hyphenated names (Fe-Line-Mignon, Ham-and-Cheese) no longer
  overflow their bookshelf cards.

## 2026-10-15 — /read/ content review fixes (Phase A)

- **Ted-E-Bear's Short-Vowel Kit now matches the app.** Its web text had been
  hand-imported in August, before the app rewrote it, and it had drifted on all
  five pages to include words a short-vowel reader cannot decode yet (props,
  clips, grins, snug). It is now generated from the app by
  `import-reading-trail-book.mjs`, as is Hen-Berry's Digraph Dash, so neither
  can drift again. All 13 phonics books were re-checked against the app: every
  page matches.
- **End-of-book questions on every decodable.** Nan and Pip, Ten Red Hens, The
  Cat and the Rat, Bug in a Cup and Dog in the Fog each end with a question and
  a sound-it-out answer, like Pip Sits. The "For grown-ups" notes are kept below.
- **Real image descriptions.** The 38 pictures in those five books had their
  sentence as alt text, so screen readers heard each line twice. Every one now
  describes what the picture shows. On Reading Trail books the title picture
  repeats page 1, so it is now marked decorative.
- **The printable-readers guide is current.** Its title, heading, description
  and schema now say 17, and are kept in step with the shelf by
  `build-read-shelf.mjs`. The original eight cards are unchanged; a generated
  "More on the shelf" grid adds the Reading Trail, the number stories and the
  sound cards.

## 2026-10-15 — CI guards the bookshelf; World Cup automation off

- `site-check.yml` now runs `build-read-shelf.mjs --check`, so a book added or
  reordered by hand (which would silently break the hub groups, the "Next story"
  chain, the ItemList schema, the homepage section or the offline manifest)
  fails CI instead of shipping.
- The `Update World Cup data` workflow is disabled (by Mark). It had kept
  running several times a day since the tournament ended on 2026-07-19.

## 2026-10-15 — Housekeeping: Brain Games count, docs, archive

- **Brain Games Vol 1 now says 24 games everywhere, as the app does.** On
  2026-10-08 the site was cut to "17" when seven games were briefly removed from
  the app. The app restored all 24 the same day (Solitaire, FreeCell, Hearts,
  Spades, Gin Rummy, Euchre and Pinball came back), but the site was never
  updated. Fixed at the source (`data/game-counts.json`) plus the hand-written
  lineups on `/apps/`, the Brain Games page and `llms.txt`.
  `build-game-counts.mjs --check` is green again.
- **The `/read/` plan was rewritten as a short current plan.** The day's build
  log moved to `docs/archive/`. Archived as finished or obsolete: the August
  `/read/` expansion plan, the App 7 launch checklist and the World Cup data
  automation notes.
- **Outreach drafts in `LINK-BUILDING-PLAN.md` were corrected before anyone
  posts them.** The shelf is 17 books, not 8. The FreeCell pool is 1,991
  solver-verified deals, not 73 (re-verified today: 1,991 solved, 0
  unsolvable). "Nothing tracked" is now "no cookies (just an anonymous page
  count)", because the site does use Cloudflare's cookie-free analytics.
- `scripts/README.md` documents the new `/read/` scripts.
- **Site checks green again.** The six arcade-hub visual baselines had been
  stale since 2026-10-12, when the hub gained the intended "New to Last Bastion?
  See the modes and controls" link. They were refreshed from CI's own Linux
  renders, following the procedure in `scripts/README.md`: the artifact commit
  matches `main`, and the images were inspected. The only content change is that
  link plus the Brain Games count.

## 2026-10-15 — Number stories shelf (`d5e522ef`)

- Four free illustrated maths stories from SnackPack Basic Math, one per school
  year: **Luckybug** (Year 1, adding and subtracting to 20), **Biscuit-Bouncer**
  (Year 2, adding, subtracting, measuring and sharing), **Hop-Tart** (Year 3,
  times tables and remainders) and **Centi-Peed** (Year 4, negative numbers).
  Together with Ted-E-Bear's Button Trail they form a new "Number stories"
  group. The shelf is now 17 books.
- A "Try it" question on every page. Tap an answer: a wrong one invites another
  go, the right one opens the explanation. With JavaScript off, or printed, the
  choices are a plain list with "Show the answer". Read to me also reads the
  question.
- All nine free Basic Math books were read in full and every picture checked.
  Five were **held back** for fixes in the app: Pork-ulele (page 1's clock shows
  the wrong time), Wise Owl (a mis-worded question and a muddled explanation of
  primes), Ted-E-Bear's Lantern and Booklava (characters change design
  mid-book) and Vincent Van Mouse (3 pages without art).
- Verified in Playwright on a phone, a tablet and desktop, with JavaScript on
  and off. All pages, PDFs and share cards confirmed live. Submitted to Google,
  Bing and IndexNow.

## 2026-10-15 — Reading aids (`ea6efe03`)

- **Read to me** on every book page: the browser's own voice (British English
  where available, a little slower) reads the page aloud and lights up each
  word as it is spoken.
- **One page at a time**: a full-screen picture-book mode with Back/Next, arrow
  keys, swipe and Esc, full screen on phones and tablets.
- **Stage shortcuts** at the top of the bookshelf.
- **Save the bookshelf for offline**: one button stores every book page and
  picture (about 11 MB; PDFs excluded) so the shelf opens with no signal. The
  status is read from the device's actual cache, never a remembered flag.
- Service worker cache bumped (`snackpack-arcade-v22`).
- Verified end to end on the live site: saved the shelf, went offline and
  opened a book with its art and reading tools. Read to me was tested with a
  stand-in speech engine, because test browsers have no voices. Not yet heard
  on a real device.

## 2026-10-15 — Sharing (`41d0adfa`)

- **"Share this book"** beside "Begin the story" and again at the end of every
  book. It opens the phone's share sheet, or copies the link on desktop, and
  always shares the clean book address.
- A **1200×630 share card** for every book, so chat previews show the whole
  cover with the title (58–94 KB each). The portrait covers used to be cropped.
- The bookshelf's share image went from a 1.3 MB PNG to a 126 KB JPEG.
- Bookshelf search title is now "Free Decodable Readers & Printable Phonics
  Books", with a matching description.
- The homepage storybooks section now shows six real free books from the shelf,
  instead of covers that linked to app pages.

## 2026-10-15 — Reading Trail complete (`0995cf92`)

- Reading Trail steps 3–6 published free, as approved by Mark: **Stripe-Scout's
  Blend Bridge** (blends), **Sub-Zero's Magic-E Lantern** (magic e),
  **Meow-inara's Vowel-Team Duet** (vowel teams) and **Quill-Berry's Ending
  Clues** (word endings). The path now runs unbroken from s a t p i n to word
  endings.
- Practice words are highlighted by each book's spelling pattern. Alt text
  describes the actual pictures.
- Phonics sound cards grew to eight sheets.

## 2026-10-15 — Sound cards (`9ee34645`)

- **`/read/sound-cards/`**: printable sound, word and tricky-word cards for each
  stage, exactly one A4 or Letter page per stage, black on white in every
  theme. Linked from the bookshelf and the printable-readers guide.

## 2026-10-15 — Digraph Dash (`6afc6d9c`)

- **Hen-Berry's Digraph Dash** (sh, ch, th, wh), the first step after Stage 3.
  It is free in SnackPack Sentences & Spelling, and all five pages are
  illustrated.

## 2026-10-15 — Reading path (`7d2942da`)

- The bookshelf is ordered as a reading path: Stage 1, then 2, then 3, then
  further stories.
- Every book ends with a link to the next one.
- `ItemList` structured data lists the books for search engines and assistants.
- Breadcrumb structured data was added to the Earth Science and Space Math app
  pages.
- The shelf is generated from one list (`scripts/build-read-shelf.mjs`), so new
  books slot in without hand edits.
