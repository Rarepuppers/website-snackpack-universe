# Plan — the two missing solitaire classics: TriPeaks, then Pyramid

Written 2026-08-15. Companion to [`../SITE-IMPROVEMENT-PLAN.md`](../SITE-IMPROVEMENT-PLAN.md)
and [`ARCADE-IMPROVEMENT-PLAN.md`](ARCADE-IMPROVEMENT-PLAN.md).

---

## What we have, and what is actually missing

The canonical "big six" solitaire family, as it appears consistently across
industry write-ups, is **Klondike, FreeCell, Spider, Pyramid, TriPeaks, Golf**.

| Variant | Web arcade | Vol 1 | Vol 2 | Vol 3 |
|---|---|---|---|---|
| Klondike | ✅ `solitaire` | ✅ | — | — |
| FreeCell | ✅ `freecell` | ✅ | — | — |
| Spider | ✅ `spider-solitaire` | — | — | ✅ `spider` |
| Golf | ✅ `golf-solitaire` | — | ✅ | — |
| **Pyramid** | ❌ | — | — | ✅ `pyramid` |
| **TriPeaks** | ❌ | ❌ | ❌ | ❌ |

So the honest gap is exactly two, and they are not equivalent:

- **TriPeaks is missing from the entire portfolio** — web *and* all three Android
  volumes. It is the only member of the big six we have never built.
- **Pyramid exists but only in Vol 3.** `components/games/pyramid/` there is
  `engine.ts` (89 lines) plus `PyramidGame.tsx` (632 lines). A web version is a
  **port**, not a new build.

Everything else worth naming — Yukon, Scorpion, Forty Thieves, Canfield,
Baker's Game, Russian Solitaire — sits well below these two in recognition and
has no honest angle we could win on. They are not recommended; see the end.

---

## Recommendation: build TriPeaks first, Pyramid second

**TriPeaks first**, because it is the genuine hole in the catalogue and the
larger mechanic commercially. The TriPeaks *format* underpins the biggest
titles in the entire solitaire category — Solitaire Grand Harvest passed **$1bn
lifetime revenue**, Tiki Solitaire TriPeaks around **$575m** — against a genre
that produced ~348m downloads and ~$470m player spend in 2024. We are not
competing with those; the number establishes that the mechanic has mainstream
pull far beyond enthusiasts.

**Pyramid second**, because it is a port of code that already exists and works.
Cheapest possible second win, and it completes the big six.

### The honest caveat, stated up front

**R5 of the site plan says arcade breadth is not the growth lever**, and that
stands: there are 34 games and one of them produces 74% of all search exposure.
Do not expect these two to move sitewide traffic on their own.

But there is a real distinction that makes these two different from adding, say,
a fifth soccer game. **Thirteen proved that a card-game page with genuine
independent search demand can rank on this domain** — 899 impressions at
position ~8, from a standing start, on a property with four inbound links.
TriPeaks and Pyramid are the same shape of thing: established names people
search for by name, in the one category where this domain has demonstrated it
can place. That makes them the *only* category of new game the current data
actually supports.

Judge them on their own query cluster (`tripeaks solitaire`, `pyramid
solitaire`, `tripeaks solitaire free`), not on sitewide numbers.

---

## The quality bar

These must ship at the standard of the existing card games, not below it.
Concretely, that means matching what Solitaire and FreeCell already do:

| Capability | Where it comes from | New work? |
|---|---|---|
| Card rendering (rank + suit sprite) | existing `.sol-card` CSS pattern + `card-suit-icon` | Adapt |
| Card backs | `shared-assets/game-ui/pro-hand-painted/card-decks/backs/` — 8 exist | **None** |
| Sound (`place`, `pickup`, `invalid`, `win`) | `play/audio.js`, all 8 WAVs already shipped | Wire only |
| Daily deal | `play/daily-state.js`, hub at `/play/daily/` (10 games today) | Wire only |
| Share your result | `play/share-result.js` | Wire only |
| Download funnel | `play/funnel.js` (auto-tagged by `build-play-links.mjs`) | Wire only |
| Offline / PWA | `sw.js` + `build-pwa.mjs` | Generated |
| Undo | per-game snapshot stack, pattern in `golf-solitaire` | Adapt |
| Keyboard support | `play/keyboard-grid.js` | Adapt |
| Theme, breadcrumbs, sitemap, related games, arcade count | the `build-*.mjs` generators | **Automatic** |

**The arcade game count is derived** from `play/*/` by `build-game-counts.mjs`,
so 34 → 35 → 36 propagates to ~28 markers and `llms.txt` with no hand edits.
That is the whole point of that script; do not hand-type the new number
anywhere.

### The differentiator: solver-verified deals

This is the part that matters and the part competitors structurally cannot
match, because it is the same honest-modifier wedge the guides are built on.

**TriPeaks deals are frequently unwinnable, and no mainstream implementation
tells you which.** A pool of pre-verified solvable deals means every deal a
visitor gets is winnable — the identical guarantee FreeCell and Solitaire
already advertise here, and the reason those two got their guide angles.

Precedent already in this repo:

- `scripts/mine-solitaire-seeds.js` + `klondike-solver.js` — Klondike pool.
  Written because in-browser Klondike solving timed out on ~86% of deals.
- `scripts/gen-freecell-seeds.ts` (monorepo) → ~1550 verified FreeCell seeds.
- `scripts/verify-freecell-deals.js` — CI-able re-verification.

**Important difference worth knowing before you copy the Klondike approach:**
TriPeaks and Pyramid have far smaller state spaces than Klondike (28 tableau
cards + a 24-card stock, no suit-ordered foundations, no reshuffles), so they
are genuinely solvable in interactive time. You have a real choice:

1. **Offline pool** (recommended, matches Solitaire/FreeCell) — instant deal,
   zero device cost, and the claim is provable from a committed artefact.
2. **On-device solve** — feasible here where it was not for Klondike, but it
   spends battery and adds a wait for no visible gain.

Go with the pool, for consistency with the two games that already make this
claim and because "verified" should mean the same thing across the arcade.

**Do not overclaim.** Spider Solitaire deals at random by design and its FAQ
says so; a previous audit caught a guide wrongly extending the FreeCell
guarantee to it. Whatever these two ship with, the meta description, FAQ and
schema must say exactly that and nothing more.

---

## Build order

### Phase 1 — TriPeaks (`play/tripeaks/`)

**Rules to implement.** 52-card deck. 28 tableau cards in three overlapping
peaks (rows of 3, 6, 9 across the peaks, plus a 10-card base row), 23 remaining
cards as stock, 1 turned up as the initial waste. A tableau card is *available*
when both cards overlapping it are gone. Play any available card that is one
rank higher or lower than the current waste card, regardless of suit; that card
becomes the new waste. Draw from stock when stuck. Clear all 28 to win.

Decisions to make explicit in the UI and the copy, because implementations
differ and being specific is the whole SEO angle:

- **Ace wraps?** K→A→2 wrap is the common modern rule and makes more deals
  winnable. Ship wrap **on** as the default, with a toggle — Golf Solitaire in
  this arcade already has exactly this `wrap` flag; reuse the pattern and the
  wording.
- **Scoring.** Streak-based scoring (each consecutive card without drawing
  increases the run) is what makes TriPeaks feel different from Golf. Without
  it the game is just Golf with a pretty layout. **This is the single most
  important thing to get right.**
- **Stock count.** 23 draws. State it in the FAQ; players compare.

**Layout is the hard part, not the logic.** Three overlapping peaks must stay
legible from 320px to desktop. Use the existing `--cw` card-width custom
property approach from `solitaire/index.html` and drive the whole pyramid
geometry off it, so one variable rescales the board. Budget most of the time
here.

**Deliverables**

1. `play/tripeaks/index.html` — game, styles, copy, FAQ, schema.
2. `scripts/gen-tripeaks-seeds.mjs` + `scripts/tripeaks-solver.js` — offline
   pool, same shape as the Klondike miner.
3. `scripts/verify-tripeaks-deals.js` — re-verify the committed pool.
4. Daily-deal wiring + a card on `/play/daily/`.
5. Tile + social art (below).

### Phase 2 — Pyramid (`play/pyramid/`)

**Port, do not rewrite.** `apps/snackpack-brain-games-vol-3/components/games/pyramid/engine.ts`
is only 89 lines and already encodes the rules. Translate that to plain JS in
the arcade's idiom exactly as Thirteen was ported — the Thirteen web port kept
`rankValue` / `identifyCombo` / `canBeat` semantically identical to the app's
`engine.ts`, and that shared logic is *why* the new rules guide could be written
accurately for both surfaces.

**Keep them in sync deliberately.** If the web and app rules diverge, any guide
written about Pyramid becomes wrong for one of them. Note the parity in both
trees, as the Thirteen handover now does.

Same deliverables as Phase 1, minus the solver if the Vol 3 engine already
carries deal validation — **check that first**, do not assume.

### Phase 3 — the guide, only if Phase 1 earns it

Do **not** pre-write guides. Twelve `X-without-ads` guides produced 49
impressions and zero clicks in 28 days; the one guide worth writing was for a
page that had *already demonstrated* it could rank.

So: ship TriPeaks, wait for Search Console, and write
`/guides/tripeaks-solitaire-rules/` only if the game page starts drawing
impressions on `tripeaks` terms. That is the sequencing that worked for
Thirteen and the discipline R5 asks for.

---

## Assets required from Codex / imagegen

House style throughout: the existing SnackPack arcade look — flat, warm,
rounded, cream/amber palette, soft shadows, no gradient-on-gradient, no
photorealism, **no text baked into any image** unless stated.

**Nothing here is a card deck.** Card faces are rendered from DOM text plus the
existing `card-suit-icon` sprites, and eight card backs already exist in
`shared-assets/game-ui/pro-hand-painted/card-decks/backs/`. Do not generate
faces or backs; they would go unused, which is exactly the 26 MB mistake D1
recorded.

### Asset 1 — TriPeaks arcade tile ⭐ required

**File:** `play/tiles/tripeaks.png` — **72×72**, transparent background
(matches the 34 existing tiles; check `play/tiles/golf-solitaire.png` for scale
and weight)

> A 72×72 arcade tile icon, transparent background, in a flat rounded style with
> soft shadows. Show three small overlapping card "peaks" — three triangular
> stacks of playing-card backs side by side, the centre peak slightly taller —
> with one face-up card resting below them. Warm cream card faces, a deep teal
> card back, amber accent. Must stay readable at 72px: bold silhouette, minimal
> interior detail, no text, no pips small enough to turn to mush. Should sit
> comfortably beside the existing Solitaire, FreeCell and Golf Solitaire tiles.

### Asset 2 — TriPeaks social share card ⭐ required

**File:** `play/social/tripeaks.png` — **1200×630** (a `.webp` derivative is
generated by `scripts/build-webp.mjs`, do not hand-make it)

> A 1200×630 social share card, flat-illustrated, warm and calm. Three
> overlapping peaks of playing cards arranged across the lower two-thirds, the
> topmost cards face-up with clearly legible pips, the lower ones face-down in a
> deep teal back. Cream (#FBF7EF) background with a soft amber glow behind the
> centre peak. Leave generous clear space across the upper-left third for a text
> overlay added later. No text in the image. Flat vector look, soft long shadows,
> no gradients, and no casino or gambling imagery — this should read as a calm
> puzzle, not a betting game.

### Asset 3 — Pyramid arcade tile ⭐ required (Phase 2)

**File:** `play/tiles/pyramid.png` — **72×72**, transparent background

> A 72×72 arcade tile icon, transparent background, flat rounded style with soft
> shadows. A tidy pyramid of overlapping playing cards — roughly four visible
> rows tapering to a single card at the apex — with two cards paired off to one
> side to hint at the match-to-thirteen mechanic. Warm cream faces, deep plum
> card back, amber accent. Readable at 72px: strong silhouette, minimal interior
> detail, no text. Must read as clearly *different* from the TriPeaks tile at a
> glance — one triangle, not three.

### Asset 4 — Pyramid social share card ⭐ required (Phase 2)

**File:** `play/social/pyramid.png` — **1200×630**

> A 1200×630 social share card, flat-illustrated, warm and calm. A single
> pyramid of overlapping playing cards filling the right half, apex near the top,
> with two face-up cards drawn slightly apart at the lower left as if just
> matched. Cream (#FBF7EF) background, soft amber and plum accents. Generous
> clear space on the upper left for a text overlay. No text in the image, flat
> vector style, soft shadows, no casino imagery.

### Asset 5 — table backdrop: **not needed, checked**

A board backdrop was the obvious fifth request. It is not required, because
`shared-assets/game-ui/table-themes/png/` already holds **eight**:
`felt-green`, `felt-blue`, `slate-pro`, `royal-plum`, `marble-rose`,
`wood-walnut`, `paper-warm`, `arcade-grid`.

`felt-green` is the natural fit for both games. **Reuse it; generate nothing.**
Adding a ninth near-duplicate is precisely the unused-asset mistake that D1 of
the arcade plan recorded after 26 MB of premium card faces shipped to a website
that never consumed them.

### Do not generate

- Card faces or card backs (both already exist and are reused).
- Any audio (all eight arcade sounds ship already).
- Guide art — Phase 3 is conditional and may never happen.
- Anything for Yukon, Scorpion, Forty Thieves or Canfield.

---

## Definition of done, per game

Borrowed from the lessons that produced P7 and P10 — "generated and reviewed on
disk" is not "shipped".

1. `node scripts/check-site.mjs` clean.
2. `node scripts/check-javascript.mjs` clean.
3. `node scripts/build-play-links.mjs` then `--check` clean (the funnel link
    must carry `utm_medium=arcade&utm_campaign=<slug>`).
4. `node scripts/build-game-counts.mjs` — confirm the arcade count moved on its
    own. **If you had to type the number anywhere, something is wrong.**
5. `build-breadcrumbs` / `build-pwa` / `build-theme` / `build-sitemap` /
    `build-related-games` / `build-webp` all re-run.
6. Playable at 320px, 375px and desktop with no horizontal overflow.
7. Every deal in the committed pool passes its verifier.
8. Deployed, then `node scripts/check-live.mjs` — this is what catches art that
    was made but never committed.
9. `node scripts/notify-search-engines.mjs`.
10. Meta description, FAQ and JSON-LD state **only** what the game actually
    does. Run the P6 method: compare the toolbar's real buttons against the
    copy.

---

## Explicitly not recommended

- **Yukon, Scorpion, Forty Thieves, Canfield, Baker's Game, Russian
  Solitaire.** Real games with real fans, but far below the big six in
  recognition, and none has an honest competitor-specific angle. Building them
  would be the padding R5 warns against.
- **A standalone solitaire app.** Distribution is the constraint, not
  catalogue size.
- **Porting TriPeaks into a Brain Games volume before the web version has
  data.** Same logic as R7 for Thirteen: let the cheap, measurable surface
  answer the question first. If TriPeaks earns impressions on the web, *then*
  it is a strong candidate for a volume — and Vol 2, the card-heavy one, is
  where it would belong.
