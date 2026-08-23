# Scripts

## Before you push

| Script | What it does | When to run |
|---|---|---|
| `check-site.mjs` | Read-only integrity check across every page: dead internal links, missing images/scripts/styles, unparseable JSON-LD, sitemap drift, and missing title/canonical/description/beacon | **Before every push.** Exits non-zero on errors; `--warn` to report without failing |
| `build-game-counts.mjs` | Keeps every stated game count (arcade, daily hub, Brain Games Vol 1–3) in sync across ~30 places in HTML **and `llms.txt`** | After adding a game anywhere. `--check` to fail instead of fix — that form runs in CI |
| `build-play-links.mjs` | Tags every outbound Google Play link with a `referrer` so Play Console can attribute the install to the site, page and section it came from | After adding any Play link. `--check` to fail instead of fix — that form runs in CI |
| `build-go-links.mjs` | Generates the `/go/<slug>/` interstitials that make app-page Play-badge clicks countable, and points each app page's store badge at one | After adding or releasing an app. `--check` to fail instead of fix |
| `check-live.mjs` | Asks the **deployed** origin whether every asset the repo declares actually resolves: manifest icons, the `sw.js` `SHELL` array, every `og:image`/`twitter:image` | **After every deploy.** `check-site.mjs` validates the repo against itself and so cannot catch a file that was built but never committed |
| `notify-search-engines.mjs` | Submits `sitemap.xml` to Google via the Search Console API, and pushes URLs to Bing/Yandex via IndexNow | **After every deploy**, once `check-live.mjs` passes |

`check-site.mjs` scans static markup only — `<script>` blocks are stripped
first, because several pages build HTML by string concatenation and matching
inside those produces nonsense targets like `' + href + '`.


## Install attribution

`build-play-links.mjs` rewrites every outbound Play link to carry:

```
&referrer=utm_source%3Dwebsite%26utm_medium%3D<surface>%26utm_campaign%3D<page>
```

`referrer` is the parameter Google Play actually reads — a plain `utm_source=`
on the store URL is ignored, which is why the UTM pairs are URL-encoded *inside*
it. `<surface>` is the kind of page (`arcade`, `guide`, `app-page`, `read`,
`daily`, `privacy`, `worldcup`, `home`), `<page>` is the individual slug. Read
the results in Play Console under **Acquisition reports → traffic source**.

Two things it deliberately leaves alone:

- **JSON-LD blocks.** Thirteen app pages carry the Play URL as the schema.org
  entity's `url`/`downloadUrl`. That is an identity claim about the app, not a
  click target, so tagging it would be wrong.
- **`play/funnel.js`.** It builds its URL in JavaScript, so no HTML walk can see
  it. It is tagged by hand; the script *asserts* that tag still exists and fails
  if it is ever dropped. Pages override it with `window.SP_PLAY_URL`, and those
  overrides live in HTML, so they are tagged automatically.

Unlike `check-site.mjs`, this one does **not** strip `<script>` blocks — the
`window.SP_PLAY_URL` overrides it needs to tag live inside them.


## Telling search engines something shipped

```bash
node scripts/notify-search-engines.mjs                 # sitemap + every URL
node scripts/notify-search-engines.mjs <url> [<url>…]  # just these URLs
```

**Do not reach for the old ping URLs.** Both are dead, verified 2026-08-15:

| Endpoint | Status |
|---|---|
| `google.com/ping?sitemap=…` | **404** — retired in 2023 |
| `bing.com/ping?sitemap=…` | **410 Gone** |

What replaced them, and what this script uses:

- **Google** — the Search Console API's `sitemaps.submit`, authenticated with
  the service account. The key is not in this repo; set `SNACKPACK_GSC_KEY` to
  its path. Unset, the Google half is skipped with a warning instead of failing.
- **Bing, Yandex, Seznam, Naver** — IndexNow, which needs no credentials but
  does need `900693c096558a71b548e48b92b33acd.txt` served from the site root.
  That file is a **public ownership token, not a secret** — the receiving engine
  fetches it to confirm we control the domain, so it is committed on purpose.
  A `202` response means the key has not been validated yet, which is the normal
  answer on the first run after the file goes live.

Worth running deliberately rather than trusting the crawler: as of 2026-08-15
Google had last downloaded the sitemap four days *before* `/read/`,
`/play/daily/` and `/play/snackwords/` existed, and `/play/thirteen/` — the
single best-ranking page on the property — had gone 21 days without a recrawl.


## Card game deal pools

| Script | What it does | When to run |
|---|---|---|
| `mine-solitaire-seeds.js` | Regenerates the verified-solvable deal pool baked into `play/solitaire/index.html` | Only if you want more/different Solitaire deals, or you change the shuffle |
| `verify-freecell-deals.js` | Checks every deal in the `CHECKED` pool in `play/freecell/index.html` is winnable | After editing that pool. Exits non-zero if any deal is unsolvable |
| `klondike-solver.js` | Shared Klondike solver used by the miner. Not run directly | — |

### Why Solitaire uses a pool

Klondike solvability can't be decided fast enough to do it in the browser. The
page used to run a bounded on-device search per deal; measured live, it timed
out on ~86% of deals — and on **100%** of Draw 3 deals — then dealt an
unverified, sometimes unwinnable shuffle anyway, after a ~2 second wait.

Now the seeds are verified offline and baked into the page, so dealing is
instant (~1ms) and every deal is winnable. Each seed is solved under **both**
Draw 1 and Draw 3, so one pool covers both modes.

```
node scripts/mine-solitaire-seeds.js [target] [budget]     # default 1000 seeds
node scripts/verify-freecell-deals.js
```

`mine-solitaire-seeds.js` rewrites the `var VERIFIED_SEEDS = [...]` line in the
Solitaire page in place. It takes several minutes.

The solver omits foundation→tableau moves, which makes it *incomplete but
sound*: it can miss some winnable deals (those seeds are simply discarded), but
anything it accepts genuinely is winnable.

---

Two scripts manage the World Cup hub. They do different jobs — don't mix them up.

| Script | What it does | Who runs it |
|---|---|---|
| `update-world-cup-data.mjs` | Pulls **live scores** from API-FOOTBALL and updates `data/world-cup-2026.json` | **GitHub Actions, automatically, every 5 minutes.** You never run this by hand. |
| `build-world-cup.mjs` | Rebuilds the **12 group pages** (`world-cup/group-a/` … `group-l/`) from the data tables inside the script | **You**, only when you change the group pages. |

`data/world-cup-2026.json` is the single source of truth for scores and fixtures.
Every page (`bracket`, `schedule`, `teams`, and the 12 group pages) reads it at
runtime, so when the robot updates that file, every page updates automatically.

---

## Rebuilding the group pages

Do this **only when you want to change the group pages themselves** — fix a
fixture, change wording, or adjust layout. You do **not** run this for score
updates (the GitHub Action handles those).

1. Open a terminal in this project folder.
   In VS Code: open the project, then **Terminal → New Terminal**.
2. Run:
   ```
   node scripts/build-world-cup.mjs
   ```
   You should see:
   ```
   Left data/world-cup-2026.json untouched (it is updated automatically by GitHub Actions).
   Wrote 12 group pages (world-cup/group-a … group-l).
   ```
3. Commit and push the rebuilt pages:
   ```
   git add world-cup/
   git commit -m "Rebuild World Cup group pages"
   git push
   ```

By default this script **does not** touch `data/world-cup-2026.json`, so it can
never wipe out the live scores.

---

## Special case: the draw changed

If the actual group draw changes (which teams are in which group), or you need to
reset the schedule from scratch:

1. Edit the `GROUPS`, `FLAGS`, and `SCHEDULE` tables near the top of
   `scripts/build-world-cup.mjs`.
2. Run it **with the `--seed-data` flag**:
   ```
   node scripts/build-world-cup.mjs --seed-data
   ```
   This also rewrites `data/world-cup-2026.json` from your edited tables. The next
   automatic GitHub Actions run (within 20 minutes) layers live scores back on top.

Use `--seed-data` rarely. For everyday changes, leave it off.

---

## Live-data automation (reference)

The workflow `.github/workflows/update-world-cup-data.yml` runs every 5 minutes
and commits `data/world-cup-2026.json` when scores change. It needs a repository
secret `API_FOOTBALL_KEY`. See `WORLD-CUP-DATA-AUTOMATION.md` for full setup.

## Counting download clicks

Cloudflare Web Analytics is the only analytics on this property, it is the
beacon-only free tier, and that tier has **no custom events** — so an `onclick`
handler on a store badge has nowhere to report to. The one thing Cloudflare
counts is a page view of a real page a real browser renders.

So each app page's Play badge points at `/go/<slug>/`: a `noindex`
interstitial that loads (and is therefore counted), then hands the visitor
straight on to Play via `location.replace`. Read the numbers in Cloudflare
under page views, filtered to `/go/`.

`build-play-links.mjs` classifies `go/<slug>/` as surface `app-page`, campaign
`<slug>` — byte-identical to the referrer the badge carried when it linked to
Play directly, so the Play Console series continues rather than restarting.

The interstitial holds the Play URL in exactly one place, the `#go-link`
anchor: the redirect reads that anchor's `href`, so tagging the anchor tags the
redirect, and the anchor doubles as the no-JavaScript path.
