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

## Assets required from Codex / imagegen — MOVED

**The asset briefs that were here are superseded. The authoritative list is
[`CODEX-ASSET-HANDOVER.md`](CODEX-ASSET-HANDOVER.md).**

They were moved rather than copied because the version here was wrong in a way
worth recording. It specified arcade tiles at **72×72**. Auditing all 36 tiles
afterwards showed the real convention is **144×144**, rendered at 72 for retina
— 32 of the 36 follow it. Two shipped tiles (`golf-solitaire`, `snackwords`)
had already been made at 72 and are visibly soft on a phone as a result, so the
handover carries them as replacement requests.

Keeping a second copy of the briefs here would be a second thing to keep in
sync, and this file has now demonstrated it can hold a wrong number. One
source.

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

---

# What actually shipped — 2026-08-15

Both games are live. This section records where the build followed the plan and,
more usefully, where it did not.

## TriPeaks — `play/tripeaks/` ✅ live

- 28 cards in three peaks (3/6/9 over a shared base row of 10), 23-card stock.
- **Streak scoring** as specified: each card played without drawing is worth one
  more than the last; drawing resets the chain. Peak bonus 15, board bonus 30.
- **Solver-verified pool of 1,200 deals.** `scripts/tripeaks-solver.js`,
  `scripts/gen-tripeaks-seeds.mjs`, `scripts/verify-tripeaks-deals.js`.
- Daily deal, undo, hints, sound, share, funnel, PWA.

**The measured number that made the guarantee worth having:** mining the pool
solved 1,671 random deals and **28.2% were unwinnable** under standard rules
(470 rejected). The page and `llms.txt` both quote that figure. It is real, not
an estimate — regenerate the pool and the miner prints it again.

## Pyramid — `play/pyramid/` ✅ live

- Faithful port of Vol 3's `engine.ts`: same 7-row pyramid, same pair-to-13
  rule, Kings alone, same suit order (0 spade, 1 heart, 2 diamond, 3 club).
- Three difficulty settings — Relaxed (3 recycles), Classic (2), Hard (1 pass).
- Daily deal, undo, hints, sound, share, funnel, PWA.

## Deviations from the plan, and why

**1. TriPeaks ships with round-the-corner OFF by default.** The plan said ship
it **on**. Changed for two reasons: Golf Solitaire on this site defaults it off
and these two sit beside each other, and the pool is verified under the *harder*
standard rules, so wrap-off boards are all winnable anyway — the argument for
defaulting it on ("makes more deals winnable") does not apply here. The toggle
is still there and is remembered.

**2. Pyramid has NO verified deal pool, deliberately.** The plan said check
whether Vol 3's engine carried deal validation before assuming. It does not, and
building a correct Pyramid solver is materially harder than the TriPeaks one —
the waste is an ordered stack and recycling reorders it, so the state is not
just a bitmask. A subtly wrong solver would produce a **false** guarantee, which
is worse than none. So Pyramid says plainly, in prose and in its FAQ, that deals
are shuffled honestly and not all can be cleared, and points at the three games
that do carry the guarantee. Spider already sets this precedent.

A correct Pyramid pool remains possible future work; it is not a gap in this
build, it is a claim deliberately not made.

**3. Phase 3 (a TriPeaks guide) was not written, as designed.** It is
conditional on the game earning impressions first. Do not pre-write it.

**4. Keyboard support needed no `keyboard-grid.js` adaptation.** The quality-bar
table assumed it would. Both boards render every card as a real `<button>` with
`disabled` set on anything unplayable, so tab order already skips illegal moves
and Enter/Space activates. That is better than a bolted-on grid handler, and it
is why Solitaire needed custom keyboard work and these did not — Solitaire uses
divs plus drag.

## The one genuinely hard part, for whoever touches this next

**Layout, not rules.** The first version sized cards in `vw` and overflowed
`.game-stage` by 190px at desktop, because the stage is far narrower than the
window. Both boards now:

- derive **every** width and offset in JS from a single CSS custom property
  (`--tp-step` / `--py-step`), in percentages of their own box;
- set the board's `aspect-ratio` and `max-width` from the same number, so CSS
  and JS cannot disagree;
- make each card its own `container-type: inline-size`, so pips and ranks scale
  with the card and need no viewport maths at all;
- drop the step below 1 under 620px so cards overlap — the rank sits top-left,
  so an overlapped card still reads. This is how phones fit three peaks.

Verified at 320px, 375px and desktop with no horizontal overflow, and driven to
a full win in a browser on both games.

**If you change the geometry, change it in one place.** The covering rules in
`play/tripeaks/index.html` are duplicated in `scripts/tripeaks-solver.js`, and
that duplication is the one real hazard here: if they drift, the pool will
certify boards the page never deals. Both files say so at the top.

## Verification run before shipping

`check-site.mjs` clean on 170 pages · `check-javascript.mjs` clean on 38 files ·
`build-play-links.mjs --check` clean on 102 links · `build-game-counts.mjs
--check` clean · `check-website-delivery.mjs` clean · `check-live.mjs` clean on
82 asset URLs after deploy · sitemap submitted and IndexNow accepted.

Counts moved on their own: arcade 34 → 36, daily hub 10 → 12. Nothing was
hand-typed, which was the point of `build-game-counts.mjs`.
