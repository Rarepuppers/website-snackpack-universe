# SnackPack Arcade — improvement plan

Audit started against 32 browser games on 2026-08-06; the live arcade now has
34. Companion to
[`spider-solitaire/ASSETS-NEEDED.md`](spider-solitaire/ASSETS-NEEDED.md), which
is retained as the completed A1 brief.

**Read the "Before you generate anything" section first** — a large amount of
art already exists, and more of it is wired than an earlier draft of this plan
claimed. Regenerating it would be wasted work.

> **2026-08-14 status correction:** A1 and A5 are complete. The Mahjong source
> fix and all 60 repaired assets are implemented, synchronized and reviewed;
> the remaining A5 action is on-device verification and the normal Brain Games
> Vol 1 release handoff. Use `CODEX-ASSETS-REQUESTED.md` as the current asset
> priority list.

## Current open task board

This table overrides older narrative below when statuses conflict.

| Priority | Task | Owner / gate | Done when |
|---|---|---|---|
| ~~P0~~ | ~~Commit + deploy `icon-maskable-512.png` and `place.wav`~~ | — | **DONE 2026-08-14** — both return 200 live |
| ~~P0~~ | ~~Service worker: whitelist cache-first types, bump `CACHE` to v5~~ | — | **DONE** — PDFs, archives and unknown downloads now bypass Cache Storage |
| P0 | Brain Games Vol 1 Mahjong release | Mark device smoke test, then Claude build/submission | Base and Pro decks pass on Android and the production release is handed off |
| **P0** | **Approve the Solitaire `place.wav` pilot** | **Mark — now unblocked** | Tone and level are approved or concrete revision notes are recorded. **The file is live, so it can finally be heard on Android; this is the oldest open gate on the board** |
| ~~P1~~ | ~~Fix stale game counts~~ | — | **DONE** — 34 in four guides, Vol 3 corrected 23→24 in three places, `llms.txt` rewritten |
| P1 | Add verification CI across both repositories | Repository automation | Monorepo app/word checks and website site/JS checks run independently; cross-repo asset parity uses an explicit companion checkout |
| ~~P1~~ | ~~Post-deploy PWA/share smoke — as a script, not a checklist~~ | — | **DONE** — `scripts/check-live.mjs` asserts manifest icons, `sw.js` `SHELL` entries and every `og:image`/`twitter:image` return 200 against the live origin. 77 URLs, all resolving. Run after every deploy |
| P2 | Finish C2/C3 distribution work | Site growth | Next guides ship, sitemap is resubmitted, and the first relevant directory submissions are logged |

### 2026-08-14 re-audit — three findings against this board

Full write-up in [`../SITE-IMPROVEMENT-PLAN.md`](../SITE-IMPROVEMENT-PLAN.md)
§ P7–P10. In short:

1. **A8 and the A2 pilot are recorded as "DONE + WIRED" but never shipped.**
   Both files are on disk, neither is gitignored, neither was ever committed.
   `manifest.webmanifest` declares a maskable icon that 404s, and `sw.js`
   precaches a `place.wav` that 404s (tolerated silently by design, so nothing
   surfaced it). **"Reviewed on disk" is not "shipped"** — every asset item on
   this board was closed on a local file check, so the same gap may exist
   elsewhere. The live-URL smoke script above is the fix for the class.
2. **`sw.js`'s third route is a catch-all, not the "images, fonts and audio"
   its comment claims.** The eight `/read/` book PDFs (15.9 MB) are therefore
   cache-first and never revalidated — a corrected PDF can never reach a
   returning reader, and the quota pressure can cause the browser to evict the
   whole origin cache, taking the offline arcade with it. Same failure B9
   explicitly warned against; it just arrived through a file type that did not
   exist when the rule was written.
3. **The game count drifted again, exactly as B10/P6 predicted it would.** Four
   guides say "32 games" and `llms.txt` says "31"; the real figure is **34**.
   `llms.txt` also still carries the "nine classics" Vol 1 number that the
   2026-08-07 audit corrected in sixteen other places — it has now been missed
   by three consecutive sweeps, because every sweep greps `--include=*.html`
   and `llms.txt` is not HTML. Worth deriving the count at build time rather
   than fixing the number a fourth time.

---

## Context: what the analytics say

From Cloudflare (30 days) and Bing Webmaster (~6 months):

- The whole arcade gets **~60 page views a month**. It is not currently a
  traffic source, despite 32 finished games.
- **95% of site visitors are on desktop** (1,630 of 1,720). Keyboard support and
  large-screen layouts matter far more than the mobile-first instinct suggests.
- Bing shows **~500,000 monthly US impressions** of addressable demand across
  games we already have (solitaire 234k, spider 123k, sudoku 94k, checkers 28k,
  freecell 21k, mahjong 12k) — and we capture almost none of it.
- The bottleneck is **4 inbound links**, not game quality. Polish helps
  retention and conversion once people arrive; it will not fix discovery.

Read that as: these improvements are worth doing, but do the link-building in
parallel or the polish has no audience.

---

## Before you generate anything — art that already exists

`shared-assets/game-ui/` (canonical at `C:\snackpack-universe\shared-assets`,
mirrored into each Brain Games app and into `website-snackpack-universe/play/`)
holds **~640 finished art files**, including a full `pro-hand-painted/` set.

**Correction, 2026-08-06:** an earlier draft of this plan said only 4-5 games
used any of it. That was an undercount — it grepped the HTML, but most of the
wiring lives in `play.css`. The real figure is **9 of 32**, and much of the
remainder is a deliberate choice rather than a gap. See
`shared-assets/game-ui/ASSET_AUDIT_BRAIN_GAMES.md`, which already documents the
2026-07-13 website wiring pass.

Already wired through either shared primitives or deliberate dedicated sheets:
Checkers, Connect 4, Minesweeper, Picross, Reversi, Snakes & Ladders,
Solitaire, Spider Solitaire, FreeCell, Thirteen, Flappy Snacky, Snacky Worm,
Table Tennis and Asteroid Destroyer.

| Asset family | Used by | Genuinely still unwired? |
|---|---|---|
| `card-decks/` | Solitaire, Spider, FreeCell; Thirteen uses the shared CSS suit system | — |
| `grid-logic-markers/` | Minesweeper, Picross | Kakuro and Sudoku remain CSS by design |
| `strategy-tokens/` | Connect 4, Reversi | — |
| `board-games/` | Checkers, Snakes & Ladders | — |
| `table-themes/` | Snakes & Ladders | other board games — optional |
| `arcade-sprites/` | Flappy Snacky; dedicated site sheets cover Worm, Asteroid and Table Tennis | Cascade remains CSS by design |
| `word-game-tiles/` | SnackWords uses the matching CSS vocabulary | Word Search and Crossword remain typographic by design |
| `mahjong-tiles/` | nothing on web **by design** | see A5 — and the app bug below |
| `chess-pieces/`, `dominoes/`, `sokoban/`, `battleships/` | nothing | no web game exists for these yet |

**Mahjong on the website is not broken and does not need the shared tiles.** It
uses `play/sprites/mahjong-suits.png`, a clean local sprite sheet that is
clearer at its small render size. That was a documented decision, not an
oversight.

---

# Section A — for Codex (asset & image generation)

Only genuine gaps. Everything above is already covered.

## A1. Spider Solitaire art — **DONE** (verified 2026-08-14)

> Both files are present and are real painted art: `play/tiles/spider-solitaire.png`
> (85 KB) and `play/social/spider-solitaire.png` (157 KB). Nothing outstanding here.

<details><summary>Original request, kept for reference</summary>


See [`spider-solitaire/ASSETS-NEEDED.md`](spider-solitaire/ASSETS-NEEDED.md).
Tile (144×144) and social card (1200×630). Interim placeholders are live, so
nothing is broken — the page just doesn't match the rest of the arcade.

</details>

## A2. Sound effects — **pilot wired; listening approval required**

The first shared sound is now implemented. Solitaire uses a deterministic
`place.wav` after legal placements and exposes a persistent visible Sound
on/off control through `play/audio.js`. Browser verification passed with no
console or loading errors.

The other games remain silent by design until this pilot is approved by ear on
desktop and Android. After approval, generate and wire the remaining seven
sounds incrementally rather than enabling audio across all 34 games at once.

Needed: a small **shared** SFX set, not per-game libraries. Short, soft,
mixed quiet — these are calm games and the sounds must never startle.

| File | Used for | Character |
|---|---|---|
| `place.wav` | card/tile/piece placed | soft wooden tap |
| `pickup.wav` | card/piece lifted | lighter, higher tap |
| `invalid.wav` | rejected move | dull, short, not a buzzer |
| `success.wav` | run/line/match completed | brief warm chime |
| `win.wav` | game won | 3-4 note resolve, under 1.5s |
| `tick.wav` | timer/counter increment | very quiet click |
| `pop.wav` | arcade block/asteroid destroyed | soft pop |
| `whoosh.wav` | ball kicked / paddle hit | short air movement |

- Format: **WAV masters + MP3 or OGG** for delivery, mono, 44.1kHz
- Each under 400ms except `win.wav`
- Target path: `play/shared-assets/game-ui/audio/`
- Peak around -12dBFS; nothing harsh above 8kHz

The deterministic generator lives at `scripts/generate-arcade-audio.mjs` and
writes canonical output first, then synchronizes the website copy.

## A3. Soccer game sprites — **DONE; audit corrected**

The seven soccer games already use a shared `SnackSoccerAssets` runtime backed
by actor, ball, goal, pitch, effects and badge sheets under `play/sprites/`.
Canvas shapes are fallbacks, not the normal render path. The existing sheets
were visually reviewed on 2026-08-14 and are higher-coverage than the proposed
standalone replacements, so no regeneration is required.

<details><summary>Superseded request retained for audit history</summary>

Seven soccer games (Goalkeeper Hero, Penalty Shootout, Free Kick Curl, Crossbar
Challenge, Header Hero, Dribble Rush, Keepy-Uppy) are **entirely CSS shapes**.
They were built for the World Cup push and look the most unfinished.

Needed, in the existing hand-painted style, matching `arcade-sprites/`:

- `goalkeeper-idle.png`, `goalkeeper-dive-left.png`, `goalkeeper-dive-right.png` (256×256)
- `striker-idle.png`, `striker-kick.png` (256×256)
- `goal-frame.png` — net/posts, transparent, 1024×512
- `pitch-grass.png` — tileable turf background, 512×512 seamless
- `football.png` — 128×128 (may already suit `arcade-sprites/ball.png`; check first)

</details>

## A4. Character sprites for the two "Snacky" games — **DONE; audit corrected**

The proposed standalone folder was never the runtime contract. Flappy Snacky
already loads three painted bird frames from the shared Pro arcade pack, and
Snacky Worm loads head/body/tail regions from its dedicated sprite sheet. The
shape drawing is fallback code. Existing art was visually reviewed on
2026-08-14 and should not be regenerated.

<details><summary>Superseded request retained for audit history</summary>

Flappy Snacky and Snacky Worm use the SnackPack characters by name but render
as coloured rectangles.

- `snacky-bird-up.png`, `snacky-bird-down.png` (128×128)
- `snacky-worm-head.png`, `snacky-worm-body.png`, `snacky-worm-tail.png` (64×64)
- Match the corgi/character style used in the apps, not a generic sprite look

</details>

## A5. Mahjong tiles — **DONE; release handoff remains**

The corruption was caused by non-ASCII glyph literals in a BOM-less PowerShell
script being decoded as ANSI by Windows PowerShell 5.1. The generator is now
pure ASCII and draws vector suit symbols. All 30 base and 30 Pro tiles were
repaired, synchronized and visually reviewed on 2026-08-14.

The Pro set was not flattened through the generic coverage generator: its
painted frame and parchment were preserved and only the corrupt symbol area was
healed. Canonical, app and website copies are byte-identical. No art regeneration
is recommended. See `CODEX-ASSETS-REQUESTED.md` for the detailed audit and the
correct 30-tile inventory.

Remaining task: verify Brain Games Vol 1, smoke-test both tile themes on device,
then hand the production build/submission to Claude.

## A6. Social share cards — no current generation request

Every game has a non-empty social PNG, and the two placeholder replacements
identified in this audit—SnackWords and Golf Solitaire—are complete. Do not
start a speculative full-set repaint. Revisit a specific card only when social
preview QA or engagement data identifies a weak one.

## A8. Maskable PWA icon — **DONE**

Added `assets/icon-maskable-512.png` on 2026-08-14 using the canonical mascot,
an opaque `#fdf6ec` background, and the central 410px safe circle. Circular,
squircle and rounded-square previews retain the full mascot. The web manifest
and offline shell now include the maskable icon.

<details><summary>Original specification retained for audit history</summary>

Added 2026-08-06 when the arcade became installable (see B9).

`assets/icon-192.png` and `assets/icon-512.png` are straight resizes of
`google-play-app-icon-512.png` and are fine as `purpose: "any"`. What's missing
is a **maskable** variant, and it can't be derived from the existing art.

The Android/Chrome maskable spec requires all meaningful content to sit inside a
centred circle of 80% diameter, because the launcher crops to whatever shape the
device uses. The current icon is edge-to-edge: the four coloured circles run
close to the top edge and the backpack to the bottom. Padding it down to 80%
leaves the corgi tiny in a sea of background; cropping cuts the circles. Either
is worse than shipping without one, so the manifest currently declares only
`any` icons and lets Android apply its own mask.

Needed:

- `assets/icon-maskable-512.png` — **512×512**, full-bleed background (no
  transparency), with the corgi + backpack composed to sit entirely within the
  centre 410px circle. The four coloured dots can be dropped or reduced to a
  subtle background motif — they're the first thing a circular mask eats.
- Background colour to match the manifest's `background_color`, `#fdf6ec`.

Once it exists, add to `manifest.webmanifest`:

```json
{ "src": "/assets/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
```

</details>

## A9. Share-card art (optional, low priority)

The new share cards (B10) are text + emoji only, which is deliberate — Wordle
proved text travels further than images and it costs no bandwidth. If we ever
want an image variant for X/Facebook, it would need a 1200×630 template per
game with the result composited in, which is a build-step problem rather than an
art problem. Not requesting anything yet; noted so it isn't re-derived later.

## A7. Correctly-shaped arcade sprites — **DONE via dedicated sprite sheets**

Table Tennis and Asteroid Destroyer already load correctly scaled sprite-sheet
regions through `arcade-assets.js`, including a vertical paddle, 48px ball and
small asteroid. The missing standalone filenames were a false proxy for wiring;
no new files are required.

<details><summary>Superseded standalone-file request retained for audit history</summary>

The existing `arcade-sprites/` pack is built for large render sizes and
horizontal orientation. Two canvas games can't use it as-is:

- `paddle-vertical.png` — **64x256**, vertical pill matching the existing
  paddle's material. Table Tennis renders it at 12x80.
- `ball-small.png` — **64x64**, a simplified read of `ball.png` that still
  works at ~18px on screen. The current 256px version loses to a plain circle
  at that size.
- `asteroid-small.png` — **64x64**, same simplification for Asteroid Destroyer.

These are small, cheap additions rather than a new pack. Without them, those
two games are better off as they are.

</details>

## What NOT to generate

- **Grid puzzle art** (Sudoku, Crossword, Kakuro, Picross, Minesweeper, 2048,
  Word Search). These are typographic by nature. Art would hurt legibility and
  the existing `grid-logic-markers/` set already covers the accents they need.
- **Card faces** — the painted deck is complete.
- **Backgrounds** — `table-themes/` has 8 already.
- **App store art** — these are web pages only.

---

# Section B — code work (mine, no assets needed)

Ordered by value. Nothing here needs Codex.

## ~~B1. FreeCell~~ — **DONE 2026-08-06**

Was the only game missing `VideoGame` schema, an FAQ, difficulty options, deck
art, and a `<footer>`, with 92 words of prose against a ~350 average — all
while sitting on a **21,300/month** Bing term.

Rebuilt: fixed two malformed meta tags (the canonical link had no closing `>`,
which swallowed the tag after it, and there was a stray `>` after
`twitter:image`); added `VideoGame` + `HowTo` schema, a footer, the download
funnel card, a real social share image, and 4/2/1 free-cell difficulty; wired
the painted card art; prose 92 → 797 words with a 6-question FAQ.

The game engine was left alone — it was already the strongest in the arcade
(supermove capacity, hints, auto-finish, undo/redo, solver-verified deals).

## B2. Wire up the existing art (see table above)

Revised after checking `play.css` — Connect 4, Minesweeper, Picross,
Snakes & Ladders, Checkers and Reversi were **already wired** in the 2026-07-13
pass, and web Mahjong deliberately uses its own local sprites.

**Thirteen is also already wired** — it renders the painted `card-suit-icon`
set. Static grep missed it because the class name is built in JS at runtime;
that is why the earlier counts in this plan were unreliable in both directions.

Genuinely unwired, and my honest read on each:

| Game | Available pack | Verdict |
|---|---|---|
| Sudoku, Kakuro | `grid-logic-markers/` | **Skip.** Their cell states are clean CSS and highly readable. PNG backgrounds would fight the typography for no gain. |
| Word Search, Crossword | `word-game-tiles/` | **Skip — wrong asset, not a judgment call.** Checked the actual pack contents rather than trusting the name: it's `tile-correct`/`tile-absent`/`keyboard-key`/`keyboard-present` — Wordle-style guess-state tiles and an on-screen keyboard, not letter cells for a search grid or crossword. There's no Wordle-clone in the arcade to use it. Nothing to wire here until one exists. |
| Memory Match | `card-decks/` backs | **Done 2026-08-07.** Swapped the flat orange `.mem-face--cover` gradient for the same `emerald-arcade.png` deck back Solitaire/Spider/FreeCell already use, so the flip animation matches the rest of the arcade's card games. The source art is a portrait card (512×716) cropped into a square face — a heavier crop than the other games take on their taller-than-wide cards, but the same `cover`/`center` technique, and the motif reads fine at 70px. |
| Table Tennis, Asteroid Destroyer | `arcade-sprites/` | **Blocked on shape, not wiring** — see below. |
| Cascade | `arcade-sprites/` | DOM-rendered, not canvas; blocks are CSS. Low value. |

**Table Tennis / Asteroid Destroyer — why I did not wire these.** The sprites
exist and look good, but they are the wrong shape and scale for these
renderers. `paddle.png` is a *horizontal* pill; Table Tennis paddles are
12x80 **vertical**. Rotating and squashing it to 12px wide would look worse
than the current clean rect. The ball renders at 18px across, where the
painted `ball.png` detail turns to mush against the current crisp circle.

Wiring these would be a visible downgrade, so it needs art at the right shape
first — see A7.

## B3. Keyboard support — **done 2026-08-06/07, every game that benefits from it has it**

Given **95% desktop traffic** this was the most under-weighted gap in the
arcade. Built `play/keyboard-grid.js`, a shared roving-tabindex helper: a grid
becomes a single tab stop, arrows move a cursor, Enter/Space plays the focused
cell. It derives the row width from the rendered layout rather than being told,
so it works at any board size and survives a resize, and a MutationObserver
restores the cursor after each re-render.

Done: **Minesweeper** (+ <kbd>F</kbd> to flag), **Connect 4**, **Reversi**,
**Checkers**, **Memory Match**, **Word Search**, **Picross**
(+ <kbd>X</kbd> to switch fill/cross).

Two classes of problem it fixed:
- `<button>` grids (Minesweeper, Connect 4) were reachable but needed up to
  480 Tab presses to cross. Now one.
- `<div>` grids (Reversi, Checkers, Word Search, Picross, Memory Match) could
  not be reached by keyboard **at all**.

**Update 2026-08-07 — the "13 remain" list was, like the daily/undo/prose
counts before it, written without checking each game.** Most of it wasn't a
real gap:

- **Snakes & Ladders and Soccer Trivia Sprint** turned out to already be fully
  keyboard-reachable — both use real `<button>` elements for every control
  (Roll, the four answer options), which are natively Tab/Enter-operable with
  no extra code. Verified in the browser with `tabIndex`/`focusable` checks on
  every interactive element.
- Of the six soccer action games, **Goalkeeper Hero, Header Hero, Penalty
  Shootout** already had real Left/Centre/Right `<button>` pads for aim, and
  **Keepy-Uppy** and **Dribble Rush** already had a Kick button and arrow-key
  lane switching respectively. All five were already substantially or fully
  playable by keyboard.
- The genuine gap in that group was narrower than "six games need bespoke
  work": just **aim position** in **Free Kick Curl, Crossbar Challenge,
  Target Shooting Arena** — power (a real `<input type="range">`), curl/curve
  (real buttons) and Shoot were already reachable; only the 2D/1D aim reticle
  was pointer-only, set solely from `pointerdown`/`pointermove`/`click` on the
  canvas. Fixed by making the canvas a real focus target (`tabindex="0"`) with
  its own scoped `keydown` listener that nudges the same `aim.x`/`aim.y` (or
  1D `aimX` for Crossbar Challenge, which only aims along a bar) the pointer
  handlers already used, clamped to the same bounds, with Enter/Space firing
  the existing `shoot()`. Scoped to canvas focus specifically so the arrow
  keys don't fight the power slider's own native behaviour when *that* has
  focus instead. Verified each with real `keydown` dispatches through to a
  changed status line, and confirmed the power slider still gets native
  arrow-key control independently.

That leaves the five card/tile games — **Solitaire, FreeCell, Spider,
Thirteen, Mahjong** — as the only genuine remaining gap, and they do need
real, bespoke work: pile-to-pile selection with no button equivalents
anywhere.

### FreeCell — done, and it found a real bug in the shared helper

FreeCell turned out to fit `keyboard-grid.js` almost exactly: the top row
(free cells + foundations, 8 across) and the cascade row (8 across) are both
already-flat, already-fixed-width sequences of `.fc-pile` divs, each already
carrying the exact `data-type`/`data-i` attributes the mouse `click()` handler
reads. Wiring `attachGrid` on the shared parent (`#fc-table`) with
`cellSelector: '.fc-pile'` gives Up/Down crossing between the two rows and
Left/Right moving within one, in a single call — no bespoke navigation code
needed, and the description in `keyboard-grid.js`'s own docstring
("no game logic needs to change") held up exactly as advertised.

Two things had to be fixed to make it actually work, not just look wired:

1. **The pile `<div>` itself never carried `data-at`** — only the individual
   card elements inside it did. A synthetic click on the pile (what a
   keyboard Enter produces) resolves `at` to `NaN`, and the mouse handler's
   selection check (`at < cascades[i].length`) silently failed on every
   keyboard attempt while working fine for a real mouse click on a card.
   Fixed by mirroring the top card's position onto the column div at render
   time.
2. **A real, previously-undiscovered bug in `keyboard-grid.js` itself,
   affecting all 7 already-shipped grid games, not just this one.** The
   cursor-restore-after-rerender was debounced with `requestAnimationFrame`,
   which is throttled to never fire while the tab is backgrounded
   (`document.hidden`). If a board ever re-rendered while genuinely hidden —
   a turn resolving, a timer tick, anything mutating the DOM while the player
   had alt-tabbed away — the deferred repaint would simply never run. Worse,
   the `pending` debounce flag would stay stuck `true` forever, since nothing
   ever cleared it, which meant **every future re-render for the rest of the
   session would also skip repainting** — keyboard navigation would look
   permanently broken even after the tab regained focus, on any of the 7
   already-live games. Fixed by swapping the `requestAnimationFrame` defer for
   `setTimeout(fn, 0)`, which has no such starvation. Re-verified Minesweeper
   afterward — cursor still moves and survives a re-render correctly, no
   regression from the swap.

Caught because this Browser pane genuinely reports `document.hidden === true`
throughout the session (confirmed repeatedly during the pause.js work too) —
without that, the bug would have been invisible in normal desktop testing
where the tab stays focused the whole time, which is exactly why it shipped
unnoticed in the first place.

### Solitaire and Spider Solitaire — done, and between them found two more real bugs

**Solitaire's selection reads `e.target.closest(".sol-card")`**, not the pile
container — unlike FreeCell, the mouse handler only resolves a selection off
an actual card element. So the roving-focus target has to be the topmost card
when one exists, falling back to the pile itself only for genuinely empty
piles. `render()` now tags the right element with `.kbd-target` each time.

Two real problems surfaced getting this working, both now fixed generally
rather than patched around:

1. **A depth mismatch broke row detection.** The static spacer div added to
   keep the top row 7-wide (matching the 7 tableau columns) sat one level
   shallower than its siblings — every other top-row `.kbd-target` is a card
   or empty-slot placeholder *nested inside* its `.sol-pile` grid cell, not
   the grid cell itself. That gave it a different `offsetParent` chain, so
   its `offsetTop` wasn't comparable to its siblings' even though it's
   visually in the identical spot on screen. Fixed by wrapping it in the same
   shape as its siblings.
2. **A structural, not incidental, row-width miscount.** Klondike always
   deals exactly one card to tableau column 0, which sits at the same height
   as the top row on *every* deal — not a rare shuffle outcome. A single
   `attachGrid` call spanning both rows would reliably misdetect the row
   width as 8 instead of 7. Fixed by splitting into two separate calls (top
   row, tableau row) rather than one spanning both — Tab moves between them
   as two stops instead of Up/Down crossing between them, a fair trade.

**Spider Solitaire's stock was already fully keyboard-operable** (its own
`tabindex="0"` plus an Enter/Space handler dealing a row) and the
completed-run markers are a passive display, not an interactive target — so
only the 10-column tableau needed wiring, using the same "topmost card, or
the empty placeholder" targeting as Solitaire.

Wiring it surfaced the same row-width problem in a form that can't be
DOM-patched away: a real Spider deal always splits 4 columns of 6 cards and 6
of 5, so column depths are *structurally* unequal, not just occasionally
matching by coincidence the way Klondike's shortest column did. No amount of
wrapper-div nesting fixes that — the topmost cards genuinely sit at different
heights.

**Added a proper fix to `keyboard-grid.js` itself for this**: an optional
`opts.rowWidth` (a number, or a function for a width that can change) that
skips the layout-based auto-detection entirely when the caller already knows
the true width. Used by Solitaire and Spider Solitaire, both of which are
really single-row layouts once split correctly — with the true width given
explicitly, Up/Down correctly go out of bounds and do nothing, which is the
right behaviour for a layout with no second row to cross into. Re-verified
Minesweeper (which doesn't pass `rowWidth`) still auto-detects correctly
afterward — the new option is additive, existing behaviour is unchanged when
it's omitted.

### Thirteen — already fully accessible, needed nothing

Checked rather than assumed, same as Snakes & Ladders and Soccer Trivia Sprint
earlier in this section: every hand card is rendered as a real `<button>`
(`cardEl(c, { button: true })`), and Play/Pass/Sort/New/Daily all are too.
Tab/Enter already reaches and activates every one of them natively. First
test read as broken (`selected` class never appeared after a click) — turned
out to be a stale DOM reference: `render()` rebuilds the hand on every
interaction, so checking the *old*, now-detached button's class after
clicking it will always show nothing changed. A fresh query after the click
showed the selection toggle working exactly as it should.

### Mahjong — done, and needed a genuinely different technique than any of the others

Mahjong's board isn't a grid at all — tiles sit at free-form pixel positions
computed from `(x, y, z)` with a z-layer offset (the stepped-pyramid look),
not rows and columns. `keyboard-grid.js`'s whole model (arrows jump by a
fixed row width) has no meaningful row width to detect here, layout-based or
otherwise — genuinely not the same class of problem as the row-detection bugs
above.

The tiles ARE already real `<button>`s, though, so the actual mechanism (Tab
reaches a cell, Enter fires the browser's own native click) is unchanged.
What made the board navigable was scoping which tiles participate at all:
**only currently-open tiles** (`.mj-tile.is-open` — free on at least one side
and nothing on top) get a roving cursor; blocked tiles are set to
`tabIndex = -1` unconditionally at render time and never enter the tab order.
This isn't a simplification for our convenience — a mouse player can't act on
a blocked tile either, so skipping them turns "tab through 144 tiles
including 100+ dead ends" into "cycle through whatever's actually playable
right now," which is the more useful behaviour on its own merits, not just
the easier one to build. `rowWidth` is a function re-evaluated on every
keypress (`() => document.querySelectorAll('.mj-tile.is-open').length`)
since the open count changes every time a pair clears — a fixed number would
go stale immediately.

One CSS conflict, easy to miss: `.kbd-cursor` sets `position: relative` for
its outline, which would silently override `.mj-tile`'s own
`position: absolute` and yank the focused tile out of its pixel-placed board
position the instant it received keyboard focus. Fixed with a single scoped
override (`.mj-tile.kbd-cursor { position: absolute; }`) rather than touching
the shared `.kbd-cursor` rule itself, since other games rely on its plain
`position: relative` behaviour.

Verified with a real keyboard-only match: found two open tiles sharing a
face, walked the roving cursor to the first with `ArrowRight`, activated it,
walked to the second, activated it, and confirmed both tiles were removed
from the DOM and the remaining-tile counter dropped from 36 to 34 — the same
signal a mouse-driven match produces, reached entirely through arrow keys and
Enter.

**All five card/tile games are done. B3 is closed** — every game in the
arcade that benefits from keyboard support now has it, and the two games that
didn't (five soccer aim games minus the three genuinely needing work, plus
Snakes & Ladders, Soccer Trivia Sprint, Thirteen) needed nothing because they
were already using real form controls throughout.

## B4. Pause — **4 action games done 2026-08-06**

`play/pause.js` is a shared control: a Pause button, <kbd>P</kbd> and
<kbd>Esc</kbd>, an overlay with its own Resume button, and an auto-pause when
the tab is backgrounded. Each game keeps ownership of its loop and supplies
`isPlaying` / `pause` / `resume` callbacks; the helper only drives the UI.

Done: **Asteroid Destroyer**, **Table Tennis**, **Snacky Worm**,
**Flappy Snacky**. All four already gated their loop on a phase string, so
parking it on `"paused"` stops the simulation without touching game logic.

Three details worth keeping in mind if this gets extended:

- **The overlay sits inside `.game-stage`, which also contains the toolbar** —
  so it covered its own Pause button and only the keyboard could resume. The
  toolbar is now lifted above it (`z-index: 45`).
- **It never auto-resumes.** Coming back to a running game you can't react to
  is worse than coming back to a paused one.
- **It refuses to resume while `document.hidden`.** Flappy Snacky stops its own
  loop while backgrounded, so resuming there would restart a loop that game is
  about to stop again.

**Update 2026-08-07 — Dribble Rush, Keepy-Uppy and Cascade done.**

Two corrections to what this section said before touching them:

- **Cascade did not need a refactor.** It already had its own `paused` flag
  gating every move/rotate/drop function, plus a bespoke pause button and its
  own `visibilitychange` auto-pause. "No phase flag" was wrong — it had a more
  complete one than most games before migrating. Its loop is `setTimeout`, not
  `requestAnimationFrame`, so pausing only had to own the drop timer.
- **Keepy-Uppy already had a full hand-rolled pause** (button, `paused` var,
  loop gate) — just not the shared one, so it was missing <kbd>P</kbd>/Escape
  and auto-pause-on-backgrounding. Migrated onto `pause.js` rather than left
  as bespoke, so it now matches every other action game.

Dribble Rush was the one genuinely unwired game in this batch — a real
`requestAnimationFrame` loop gated on `st.phase`, plus its own ad-hoc
`visibilitychange` handler that `pause.js`'s own auto-pause now replaces
(keeping both would have double-handled backgrounding).

One thing to know if a game's loop is written like Dribble Rush's or
Keepy-Uppy's rather than Asteroid Destroyer's: **not every loop keeps ticking
under the hood while paused.** Asteroid Destroyer's `loop()` calls
`requestAnimationFrame(loop)` unconditionally at the top and only gates the
game *logic* on phase, so flipping the flag is enough. Dribble Rush's `frame()`
and Keepy-Uppy's `loop()` only reschedule themselves while playing, so pausing
actually kills the rAF chain — `resume()` has to call `startLoop()` (or
equivalent) again, not just flip the flag back.

### A real bug found and fixed in `pause.js` itself, affecting all 7 games

Reproduced while testing Cascade: pause, then click **New game** (or a
mode/difficulty button — anything else in the toolbar that resets the game).
The game correctly restarts, but the Pause overlay stays visually stuck open
over a game now running invisibly underneath it. Checked and confirmed this
was **already present in all four previously-shipped games**, not something
the new wiring introduced — `pause.js` only ever hears about pause/resume
through its own button, its own keys, and `visibilitychange`. It has no idea a
sibling control just reset the thing it thinks is still paused.

Fixed once, in the helper, for everyone: a click listener on `mount` that,
on any click that isn't the pause button itself while `paused` is true, drops
the paused UI back to normal — without calling `opts.pause()`/`resume()`,
since the game's own handler for that control (e.g. its `reset()`) already
owns whatever state it just transitioned to. Verified against Cascade (the new
wiring) and Asteroid Destroyer (already-shipped) — New Game now correctly
dismisses the overlay in both, and a second click while already unpaused is a
no-op, no regression.

### The six soccer action games are not "still open" — most don't want pause

Re-checked each one rather than carrying the old claim forward:

- **Goalkeeper Hero, Free Kick Curl, Crossbar Challenge, Header Hero,
  Penalty Shootout** have no continuous clock or ongoing simulation to lose —
  they're aim-then-shoot, turn-based, with a brief one-shot animation per
  attempt. There is nothing decaying in the background if you look away, so a
  pause control would add UI for a problem that doesn't exist in these five.
- **Dribble Rush and Keepy-Uppy** are the two that are actually continuous
  (endless runner, real-time juggling) — both done above.

So this line item is complete, not "six remain — five never needed it."

## B5. Undo — **done 2026-08-06/07, 4 games shipped and the rest correctly excluded**

Added to the games where a stray click did the most damage:

- **Sudoku** (94k/mo) — restores the **mistake counter** too, so a wrong digit
  no longer permanently costs you. Pencil notes step back one digit at a time.
- **2048** — restores board, score and the spawned tile. Only real moves are
  snapshotted, so a no-op arrow press costs nothing.
- **Picross** — every fill/cross is a step.
- **Kakuro** — entries and hints are both undoable; the filled counter restores.

All four have an Undo button and <kbd>Ctrl</kbd>+<kbd>Z</kbd> where the game
already listens for keys. Snapshots are only taken when something is actually
about to change, so undo always steps back a real move rather than a no-op.

**Update 2026-08-07 — checked the "23 remain" list against each game's actual
mechanics, rather than carrying it forward. None of the seven non-action games
listed as needing undo actually do.**

The four that got it share one property: a wrong move leaves a **persistent,
visible cost** — Sudoku's mistake counter, 2048's board state, Picross's
fill/cross, Kakuro's entries. Undo genuinely restores something. Checked the
rest against that bar and none clear it:

- **Minesweeper** — undo would let you take back hitting a mine. That's not a
  missing feature, it's removing the entire risk the game is built on.
- **Memory Match** — a mismatched pair already auto-flips back
  (`unmatch()`, on a timeout). Undo would be a shortcut for something the game
  already does for free; the only "cost" is +1 on the move counter.
- **Mahjong** — clicking two non-matching tiles never removes anything. There
  is no wrong-match state to undo.
- **Word Search** — an incorrect drag just un-highlights on release. Nothing
  persists.
- **Crossword** — letters are freely retypable and Check is on-demand, not a
  scored, accumulating penalty like Sudoku's mistake counter. Low value.
- **Snakes & Ladders** — no player decision besides clicking Roll.
- **Thirteen** — the one real candidate, but it's played against three CPU
  opponents in sequence. "Undo" would mean unwinding their subsequent turns
  too, which changes what the game is (you could see how the CPU responded,
  then take the move back) rather than just forgiving a misclick.

So this line item is done, not 23-remain — the four that shipped were the
four that needed it.

## B6. Thin SEO prose — **done 2026-08-07**

| Game | Words then | Words now | Bing volume for its term |
|---|---:|---:|---|
| ~~FreeCell~~ | ~~92~~ | 797 | 21,300/mo — done 2026-08-06 |
| Target Shooting Arena | 185 | 337 | low |
| Keepy-Uppy | 194 | 316 | low |
| Crossbar Challenge | 197 | 350 | low |
| Goalkeeper Hero | 200 | 343 | low |
| Soccer Trivia Sprint | 206 | 357 | low |
| Free Kick Curl | 218 | 358 | low (but ranks #1 and converts) |

FreeCell was the only one where this clearly cost traffic, and that was fixed
first. The other six were worth doing for consistency, not ranking — each got
one substantive paragraph (game-specific strategy, not padding) plus two real
FAQ entries, on top of the three that were already there.

Free Kick Curl already ranks #1 and converts, so its existing sentences were
left untouched — the new paragraph and FAQ entries were purely additive,
appended rather than edited in.

**Also found while doing this**: five of the six pages (all but Soccer Trivia
Sprint) had a visible `<details class="faq-item">` FAQ section with **no
matching `FAQPage` JSON-LD at all** — the structured data simply didn't exist
for it. Added it for all six, generated directly from the rendered
`<summary>`/`<p>` text via a small script rather than hand-typed, so the
schema can't drift from what's actually shown on the page.

Snakes & Ladders was on the original list at 240 words but is fully
dice-driven with no player decisions to write strategy tips about (see the
B5 correction above) — left alone rather than padded for its own sake.

## B9. PWA / offline arcade — **DONE 2026-08-06**

The arcade's pitch is "no ads, no sign-in, no download" and it advertises
offline play — but "works offline" was only ever true of the *Android bundle*,
not the site. Both status sites (isclaudeup, iscodexup) were installable PWAs
while the main property wasn't.

Added `manifest.webmanifest`, `sw.js`, and `scripts/build-pwa.mjs` (an
idempotent injector in the same shape as `build-breadcrumbs.mjs`, since there's
no templating layer and ~145 pages to touch). Icons derived from the existing
Google Play app icon; the maskable variant is A8.

Caching strategy, and why: **code and markup are network-first**, images and
fonts cache-first. The status sites originally shipped cache-first for scripts,
which meant a returning visitor kept running whatever build they first installed
— a fixed bug could never reach them. Don't repeat that here. `CACHE` is
`snackpack-arcade-v1`; bump it whenever shared code changes.

Note the arcade caches *what you visit*. The shell and `/play/` are precached;
individual games cache themselves on first visit. That's the honest behaviour
and the new guide explains it to players rather than pretending otherwise.

## B10. Share-your-result — **DONE 2026-08-06 for 10 games**

The single largest growth gap. Every game already called
`SnackPack.celebrate()` on a win, but nothing offered a share, so a win produced
no artefact anyone could post. Wordle's entire distribution was the spoiler-free
result block, and it needed no ad budget and no backlinks — which matters here
because this plan's own analytics section says the bottleneck is 4 inbound
links, not game quality.

Built `play/share-result.js`. Three things worth knowing if this gets extended:

- **It is deliberately NOT attached to the funnel modal.** `openModal()` in
  `funnel.js` is rate-limited to once per day via `sp_donate_shown_on`, which is
  right for a donation ask and wrong for a share prompt — a player who wins
  three puzzles should be offered a share three times. The card owns its own
  surface.
- **Share calls go AFTER `celebrate()`, always.** They were briefly placed
  before it in four games; if the share call had thrown, it would have silently
  suppressed the existing download/donation funnel. The share is a
  nice-to-have and must never be able to break the thing that earns money.
- **Spoiler rule.** Crossword and Picross withhold the puzzle title on the
  daily, because on a daily everyone is solving the same board and the title
  hints at the answer. A share that spoils today's puzzle is a share nobody
  sends.

Wired: Sudoku, Crossword, Picross, Solitaire, Spider, FreeCell, Minesweeper,
2048, Kakuro. Flag Frenzy kept its own well-integrated result panel but now
delegates the copy/share mechanics to `SnackPackShare.send()`, so it gets the
native share sheet on mobile and there's one implementation of the fallback
chain (native share → clipboard → execCommand → selectable textarea).

**Update: all 32 games are now wired.** Three result shapes emerged:

- **Completion games** (puzzles, card games, board games) share a time or move
  count, plus "new personal best" when it applies.
- **Score games** (Asteroid Destroyer, Snacky Worm, Flappy Snacky, Table
  Tennis, Cascade, Target Shooting) share a score. Note the two Snacky games
  only call `celebrate()` on a personal best, so their share is already gated to
  a run worth sending.
- **The soccer set** gates `celebrate()` behind a high-score threshold
  (`score >= 950` and similar). The share call is deliberately placed **outside**
  that gate — celebrate is a donation ask that should stay rare, but any finished
  run is worth offering a share on. Same reasoning for Cascade, where the share
  sits outside the best-score branch.

Two bugs caught during wiring, both of which would only have fired on a win:
`bestStreak` doesn't exist in Keepy-Uppy or Soccer Trivia Sprint (it was
copy-pasted from the other soccer games), and Flappy Snacky's score is `st.score`
rather than `score`. A static scope check over each call site caught all three
before they shipped — worth re-running if these get extended.

### Correction to an earlier claim in this document

An earlier note here counted "17 games with a daily puzzle". That was wrong: it
matched the *word* "daily" in prose ("daily streaks saved on your device", the
history paragraphs), not the feature. The real figure is **three** with a
user-facing daily mode — **Crossword**, **Flag Frenzy** and **Picross** — plus
**Memory Match** and **Thirteen**, which accept a `?daily=` URL parameter that
is never surfaced in their UI.

That's worth acting on separately: exposing the existing hidden daily on Memory
Match and Thirteen is a button, not a feature build, and daily modes are what
make the share mechanic compound.

**Update: done.** Both now have a Daily toggle. The `?daily=` parameter seeded
from whatever string was in the URL, which is deterministic but not *shared* —
two players got different boards unless they passed the same value. The button
seeds from the UTC date instead, so everyone gets the same board on the same day,
and the result carries a `#20671`-style number derived from days-since-epoch so
it means the same thing in every timezone.

Details worth keeping: "New game" drops you out of daily mode (a daily is one
board — re-rolling it while still calling it today's would be a lie), and the
daily keeps a separate best from free play, since they're different challenges.

**Update: FreeCell, Kakuro and Mahjong now have dailies too — eight in total**
(Crossword, Flag Frenzy, Picross, Memory Match, Thirteen, FreeCell, Kakuro,
Mahjong). Three different mechanisms, because the games generate boards
differently:

- **FreeCell** indexes `CHECKED` — the solver-verified deal pool — by the date.
  That means every daily is **guaranteed winnable**, which is a claim most daily
  card games can't make. Today resolves to deal #14.
- **Kakuro** indexes its template pool by date, offset by mode so switching grid
  size inside a daily still varies.
- **Mahjong** needed a seeded RNG (mulberry32) because its shuffle used
  `Math.random` directly. Note `shuffle()` now takes an **optional** rng: the
  daily deal is seeded, but the mid-game **Shuffle button deliberately stays
  random**. It's a rescue the player chooses to spend, not part of the puzzle
  everyone shares — verified that it still reshuffles unpredictably inside a
  daily.

### The share loop only works if the link opens the same board

Added after the dailies landed, because the loop had a hole in the middle: the
share text said "SnackPack Mahjong **#20671**" but the link went to the plain
game page. The recipient landed in free play, on a different board, with no way
to know the comparison was meaningless. A share nobody can act on is a share
nobody sends.

`share-result.js` now appends `?daily=<n>` whenever a result carries a puzzle
number, and every daily game honours it on load — starting in daily mode, with
the daily control shown as active.

Two decisions in here:

- **The number is honoured, not just its presence.** Games originally checked
  only that `?daily` existed and served *today's* board, so a link opened the
  next morning quietly showed a different puzzle. `dailyNumber()` now reads the
  URL value and falls back to today. The trade is that a very old link serves an
  old puzzle — the better failure, since the alternative lies about what you're
  playing.
- **The seed had to be the day number, not a date string.** Memory Match and
  Thirteen seeded from `"2026-8-6"` while the URL carried `20671`, so the button
  and the link produced different boards. Both now seed from `String(dailyNumber())`.

Verified per game that arriving via `?daily=` activates the daily control, that
the same number reproduces the same board, and that a different number gives a
different one. Two traps in that testing worth knowing: **Picross's grid starts
blank**, so fingerprinting cells shows every puzzle as identical — fingerprint
the clues instead; and **Kakuro and Picross have small pools** (2 templates per
mode, 20 daily packs), so test numbers must be adjacent or they alias onto the
same board and look broken when they aren't.

One near-miss worth recording: the Kakuro patch appeared to succeed because the
button insert worked, while the declaration block silently failed to apply. That
left `dailyMode` assigned but never declared and `dailyNumber` missing entirely —
which would have thrown a ReferenceError on a daily win only. The scope check
over each call site caught it. **Run that check after any scripted edit**; a
"changed: true" from a multi-part patch does not mean every part landed.

## B7. Smaller gaps

- ~~**Flag Frenzy never calls `SnackPack.celebrate()`**~~ — **fixed
  2026-08-06.** All 32 games now trigger the funnel on a win. While fixing it I
  found a second bug: nine soccer/World Cup games point the funnel at
  `/world-cup/` but the button label was hardcoded to "Get the free app on
  Android", promising an app the link doesn't lead to. `funnel.js` now takes an
  optional `SP_PLAY_LABEL`, those nine say "Open the World Cup hub", and
  internal links no longer force a new tab.
- **"Large cards" mode** exists only on the three card games; the same idea
  would help every board game on a desktop screen.
- **Best-score tracking** missing on 10 games including Sudoku, Minesweeper,
  Checkers and Reversi.
- ~~**Daily puzzle** exists on 16 games — a genuine retention hook worth
  extending to Mahjong, Kakuro and FreeCell.~~ **Both halves of this were wrong
  and it's now done.** The "16" was a bad grep (see the correction under B10);
  the real count was three. Mahjong, Kakuro and FreeCell have since been added,
  along with Memory Match and Thirteen, bringing it to eight.

## B8. Modes worth adding

- **Mahjong** — only one layout; the classic Turtle plus 2-3 more would treble
  its depth using tiles we already own.
- **FreeCell** — no difficulty selection at all; the standard 4/2/1 free-cell
  variants are a one-line rule change.
- **Two-player pass-and-play** — only Snakes & Ladders and Table Tennis have it.
  Natural for Checkers, Connect 4, Reversi.

---

# Section C — distribution (added 2026-08-06)

This section exists because the document was diagnosing one problem and solving
another. The analytics section at the top says plainly: *"The bottleneck is 4
inbound links, not game quality... do the link-building in parallel or the
polish has no audience."* Sections A and B are then entirely art and code. Every
task was polish on pages nobody can find.

## C1. The 500k impressions figure is not addressable as written

The analytics section reads 234k/mo solitaire, 123k spider, 94k sudoku as demand
"we capture almost none of". That framing will burn months. Those SERPs belong to
Microsoft, Google's built-in game, solitaired.com and world-of-solitaire — sites
with thousands of referring domains. On four inbound links, head-term "solitaire"
is not winnable this year or next, no matter how good the game is.

What *is* winnable is already sitting in the modifier slot of our own titles:
**no ads, no sign-in, no download, solver-checked deals, daily puzzle, works
offline**. Low volume each, reachable, and all genuinely true of this arcade in a
way the incumbents can't claim. Target those as the primary angle, not as
suffixes.

## C2. `/guides/` is the link-earning surface and it was nearly empty

Game pages don't earn links — nobody links to a Solitaire implementation. Guides
do. There were three; two more added 2026-08-06:

- `/guides/play-browser-games-offline/` — how to install any site as an app and
  test it in airplane mode. Ties directly to B9, and is a natural hub linking out
  to individual games.
- `/guides/solitaire-without-ads-or-signup/` — the wedge applied to the highest
  volume term, from the long-tail angle where we can actually compete. Explains
  unwinnable deals and Draw 1 vs Draw 3, and funnels to Solitaire, Spider and
  FreeCell.

Both disclose that we're the publisher, in the same voice as the existing
guides. More in this shape is the highest-value SEO work available — far above
B6's thin-prose pass on low-volume soccer pages.

## C3. Things not yet done

- **Directory submissions.** Free-browser-game aggregators and "no ads" game
  lists. Unglamorous and it's how the first non-zero backlink count happens.
- **The two status sites already link here** (`isclaudeup.com`,
  `iscodexup.com` both footer-link `/play/`), which likely accounts for a chunk
  of the current four. Audience match is weak — dev tooling vs casual puzzles —
  so don't over-invest there.
- **Search Console**: resubmit the sitemap after the PWA and guides pass, since
  141 URLs now carry changed markup.

Completed 2026-08-14: Memory Match and Thirteen are now listed on the Daily hub.
Their query handling was normalized so the hub's ISO date, older numeric links
and each game's Daily button all resolve to the same UTC day-number seed.

---

## D1. Website delivery payload — **DONE for confirmed unused faces**

Canonical art quality is correct and must remain untouched, but byte-identical
website mirroring is not automatically the right deployment contract. Syncing
the nine stale Pro packs changed their website footprint from **21.21 MB to
47.81 MB** (+26.60 MB). Premium card decks account for +29.87 MB by themselves.

The 52 premium classic-face PNGs are currently exposed only as an unused path in
`game-ui-assets.js`; no page consumes `classicFacePath`. Do not spend image
quality to solve this. Choose one explicit web-delivery model:

1. publish only assets referenced by live website registries/pages; or
2. generate reviewed WebP delivery derivatives while retaining canonical PNG
   masters for the apps.

Then change website verification from blanket byte parity to a declared
consumption manifest: every declared website asset must exist and be current,
while unconsumed app-only packs need not be deployed. Track this alongside the
larger whole-site payload work in `SITE-IMPROVEMENT-PLAN.md`.

Implemented 2026-08-14:

- Added `play/shared-assets/game-ui/website-delivery.json` with a documented
  exclusion for the unused 52 premium classic faces.
- Removed their Pro `classicFacePath` registry entry and 31.72 MB of website
  delivery copies. Canonical and all app masters remain untouched.
- The nine audited Pro packs now total 16.10 MB, 5.11 MB smaller than at the
  start of the audit while retaining the higher-quality assets actually used.
- Updated sync and verification: sync skips declared exclusions; verification
  fails if an excluded file returns or a required delivered file drifts.
- Added a website delivery check that scans runtime HTML/JS/CSS for excluded
  references.

Do not broaden exclusions without a fresh usage audit. Reviewed WebP derivatives
remain an option if a live page later needs a high-resolution master.

## D2. Verification automation and post-deploy smoke

The monorepo and website are separate Git repositories, so one ordinary
path-filtered workflow cannot see both working trees. Add two workflows:

- monorepo Windows CI for app game-UI parity plus the Vol 2/Vol 3 validators;
- website CI for `scripts/check-site.mjs` and JavaScript syntax checks.

For canonical-to-website parity, explicitly check out the public companion repo
at a pinned branch/commit or compare against a versioned hash manifest. Do not
assume the nested local checkout exists in CI.

Together they should run:

- `scripts/verify-game-ui-assets.ps1`;
- Vol 2 `validate:snackwords` and typecheck;
- Vol 3 `validate:content` and typecheck;
- website `scripts/check-site.mjs` and JavaScript syntax checks.

Website CI is implemented in `.github/workflows/site-check.yml`; it runs syntax,
delivery-contract and whole-site checks on relevant pushes and pull requests.
The remaining automation work is the monorepo Windows job and optional pinned
cross-repository parity checkout.

After the next website deployment, verify the live manifest, maskable icon,
service-worker v4, `place.wav`, SnackWords OG image and Golf Solitaire OG image.
Also confirm an existing PWA installation upgrades from the previous cache and
that Sound off persists after relaunch.

---

## Suggested order

1. **A5 release handoff:** device-smoke both Mahjong themes, then hand the
   production build/submission to Claude.
2. **A2 listening gate:** approve or revise `place.wav` on desktop and Android.
3. **D2 verification:** add the monorepo CI half, then perform the post-deploy
   PWA/share smoke. Website CI is already in place.
4. **C2/C3 distribution:** ship the next guides, resubmit the sitemap and log
   the first relevant directory submissions.

The earlier Section B work remains closed: pause and undo cover every game that
benefits from them, all 34 games expose result sharing, the six thin soccer
pages have FAQ schema, and keyboard support covers the applicable games. Ten
games now implement a daily mode and all ten are listed on the Daily hub.

---

## B1. Port SnackWords (daily word guess) — **DONE 2026-08-14**

Completed 2026-08-14. It is the natural headline for
[`/play/daily/`](daily/), which shipped the same week. Flag Frenzy already
proves the shape works here.

### Do NOT call it Wordle

The source game is `snackwords-daily` in Brain Games Vol 2 and is already
titled **SnackWords** — keep that. *Wordle* is a New York Times trademark and
they issued takedowns to clones in 2022. That constraint is not only legal:

- You cannot rank for a brand term you do not own, so targeting "wordle" spends
  the page's title on a query it will never win — the same trap
  `/play/thirteen/` fell into (640 impressions, 0 clicks).
- Target instead: **daily word game**, **word guess game**, **5 letter word
  puzzle**, **free word game no ads**. Real volume, and winnable.

Avoid "Wordle clone" / "Wordle alternative" in copy too. The differentiator to
lead on is the one that is true and unusual: *no ads, no sign-in, and the
answer schedule is deterministic and offline.*

### The content is already done

| Asset | Source | Size |
|---|---|---|
| Answer bank | `words.ts` | **1,320** curated words = **3.6 years** of dailies |
| Validation dictionary | `dictionary.ts` | **14,855** words |
| Scoring / hard mode | `engine.ts` | pure functions, transliterate directly |

`engine.ts` has no React or React Native in it — `scoreGuess`, `isKnownWord`,
`violatesHardMode` port to vanilla JS unchanged. The duplicate-letter handling
in `scoreGuess` is already correct (two-pass, marks exact matches before
counting the remainder), which is the bug most clones ship.

### The one real integration detail

The app's `answerForDate()` derives its index from the player's **local** date
against a `2025-01-01` epoch. The web arcade's daily convention is the **UTC**
day number parsed from `?daily=YYYY-MM-DD`, which is what `/play/daily/` sends
and what `daily-state.js` files results under.

Port it to UTC. If it keeps local time, two things break: players either side of
midnight get different words from the same shared link, and the completion
recorded by `share-result.js` can land on the wrong day. The app can stay as it
is — it has no shared-link problem.

### Monetization: no conflict

Unlike the `/read/` books, this needs no free-vs-Pro decision. `tier` in
`constants/games.ts` is a rollout grouping, not a paywall, and the engine's
`FREE_ATTEMPTS = 6` / `PRO_ATTEMPTS = 7` means Pro buys a **seventh guess**,
not access. Ship the web version at six guesses and let the extra guess stay an
app perk — that is an honest funnel rather than a giveaway.

Ship the single-word daily first. `quordle.ts` (solve 2 / 4 / 8 at once) exists
and is a good follow-up, but it is a harder first impression.

### Assets needed — only two

Everything else is CSS. The board, letter tiles and on-screen keyboard are
styled surfaces like the other 33 games (`play.css`, plus the existing
`keyboard-grid.js`), so **no background art, container art or tile art is
needed** — adding bespoke art here would make it the only game in the arcade
that does not match the rest.

| File | Size | Notes |
|---|---|---|
| `play/tiles/snackwords.png` | 72×72 | Hub tile, matching the existing arcade |
| `play/social/snackwords.png` | 1200×630 | OG card — this *is* the link preview when someone shares their daily result, so it matters more here than on any other game |

## Assets currently requested from Codex

**Ready-to-paste generation briefs for all of these (except A1) are in
[`CODEX-ASSETS-REQUESTED.md`](CODEX-ASSETS-REQUESTED.md)** — exact file paths,
sizes, per-tile/sprite specs, and style reference, so nothing needs
re-deriving from this plan doc. A1 has its own equivalent brief in
[`spider-solitaire/ASSETS-NEEDED.md`](spider-solitaire/ASSETS-NEEDED.md).

| Item | What | Blocks |
|---|---|---|
| A5 | Verify and release the 60 repaired Mahjong tiles | **Source/art done; app release handoff remains** |
| A2 | 8 shared SFX (`place`, `pickup`, `invalid`, `success`, `win`, `tick`, `pop`, `whoosh`) | **Pilot `place.wav` + Solitaire controls done; listening approval and seven sounds remain** |
| A3 | Existing shared soccer sheets | **Done and wired across the soccer games** |
| A4 | Existing painted bird frames + worm sprite sheet | **Done and wired; fallback shapes remain intentionally** |
| A7 | Existing Table Tennis + Asteroid Destroyer sprite sheets | **Done and wired; standalone variants unnecessary** |
| A8 | 1 maskable 512×512 PWA icon | **Done; manifest and offline shell wired** |
| B1 | SnackWords hub tile (72×72) + social card (1200×630) | **Done and wired** |
| B2 | Golf Solitaire hub tile (72×72) + social card (1200×630) | **Done and wired** |
