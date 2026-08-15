# Codex asset handover — 2026-08-15

Everything Codex/imagegen needs to generate, in priority order, with the exact
file paths and dimensions the site expects. Written after building TriPeaks and
Pyramid and auditing all 36 existing arcade tiles and 34 social cards.

**Both new games are live and fully playable without any of this.** Placeholders
are in place so nothing 404s. Nothing here blocks anyone.

---

## House style (applies to every item)

The existing SnackPack arcade look: flat, warm, rounded, cream/amber palette,
soft long shadows. No gradient-on-gradient, no photorealism, no casino or
gambling imagery anywhere — these are calm puzzle games. **No text baked into
any image** unless an item says otherwise.

Reference files worth opening before starting: `play/tiles/solitaire.png`,
`play/tiles/freecell.png`, `play/social/solitaire.png`.

---

## The two size conventions — please read, one is easy to get wrong

**Arcade tiles are 144×144, not 72×72.** They render at 72 CSS pixels
(`width="72" height="72"` in the markup) and the source is 2× for retina. 32 of
the 36 existing tiles follow this. An earlier draft of the solitaire plan said
72×72 — that was wrong, and item 5 and 6 below exist because two shipped tiles
were actually made at 72.

| Asset type | Source size | Rendered at | Format |
|---|---|---|---|
| Arcade tile | **144×144** | 72×72 | PNG, transparent background |
| Social card | **1200×630** | og:image only | PNG (`.webp` is generated, don't make it) |

Do **not** hand-make `.webp` files. `scripts/build-webp.mjs` derives them.

---

## PRIORITY 1 — required, new games shipped with placeholders

`play/tiles/tripeaks.png` and `play/tiles/pyramid.png` are currently copies of
the studio mark, and both games' `og:image` points at the generic studio share
card. Listed in `play/tiles/PLACEHOLDERS.txt`.

### 1. TriPeaks arcade tile

**File:** `play/tiles/tripeaks.png` — **144×144**, transparent background

> A 144×144 arcade tile icon for a card game called TriPeaks, transparent
> background, flat rounded style with soft shadows, designed to be legible when
> displayed at 72 pixels. Show three small overlapping card "peaks" — three
> triangular stacks of playing-card backs side by side, the centre peak slightly
> taller — with one face-up card resting below them. Warm cream card faces, a
> deep teal card back, amber accent. Bold silhouette with minimal interior
> detail; no text, and no pips small enough to turn to mush at half size. It
> must sit comfortably beside the existing Solitaire, FreeCell and Golf
> Solitaire tiles, and must read as clearly different from the Pyramid tile —
> three triangles, not one.

### 2. TriPeaks social card

**File:** `play/social/tripeaks.png` — **1200×630**

> A 1200×630 social share card, flat-illustrated, warm and calm. Three
> overlapping peaks of playing cards arranged across the lower two-thirds, the
> topmost cards face-up with clearly legible pips, the lower ones face-down in a
> deep teal back. Cream (#FBF7EF) background with a soft amber glow behind the
> centre peak. Leave generous clear space across the upper-left third for a text
> overlay added later. No text in the image. Flat vector look, soft long
> shadows, no gradients, no casino or gambling imagery.

### 3. Pyramid arcade tile

**File:** `play/tiles/pyramid.png` — **144×144**, transparent background

> A 144×144 arcade tile icon for Pyramid Solitaire, transparent background, flat
> rounded style with soft shadows, legible at 72 pixels. A tidy pyramid of
> overlapping playing cards — roughly four visible rows tapering to a single
> card at the apex — with two cards paired off to one side to hint at the
> match-to-thirteen mechanic. Warm cream faces, deep plum card back (the game's
> board is plum, unlike the green card games), amber accent. Strong silhouette,
> minimal interior detail, no text. Must read as clearly different from the
> TriPeaks tile at a glance — one triangle, not three.

### 4. Pyramid social card

**File:** `play/social/pyramid.png` — **1200×630**

> A 1200×630 social share card, flat-illustrated, warm and calm. A single
> pyramid of overlapping playing cards filling the right half, apex near the
> top, with two face-up cards drawn slightly apart at the lower left as if just
> matched. Cream (#FBF7EF) background, soft amber and plum accents. Generous
> clear space on the upper left for a text overlay. No text in the image, flat
> vector style, soft shadows, no casino imagery.

---

## PRIORITY 2 — replacements for existing assets that are genuinely wrong

Found by auditing all 36 tiles. These are real defects, not preferences.

### 5. Golf Solitaire tile — currently half resolution

**File:** `play/tiles/golf-solitaire.png` — **144×144** (currently **72×72**)

**The defect:** every other card-game tile is 144×144 and renders at 72, so it
is crisp on a phone. This one is 72×72 rendered at 72, so on any retina or
high-DPI screen — which is most phones — it is visibly softer than the tiles
either side of it. Golf Solitaire shipped 2026-08-13 and the 2× convention was
missed.

> A 144×144 arcade tile icon for Golf Solitaire, transparent background, flat
> rounded style with soft shadows, legible at 72 pixels. Show a single fanned
> row of playing cards descending onto one face-up waste card below, suggesting
> a run being cleared. Warm cream faces, green card back, amber accent. Keep the
> existing tile's composition and colours if possible — this is a resolution
> fix, not a redesign, so it should still read as the same icon. No text.

### 6. SnackWords tile — currently half resolution

**File:** `play/tiles/snackwords.png` — **144×144** (currently **72×72**)

Same defect, same cause — SnackWords shipped 2026-08-14.

> A 144×144 arcade tile icon for a daily five-letter word game, transparent
> background, flat rounded style with soft shadows, legible at 72 pixels. Show a
> short row of letter tiles, two or three of them highlighted in green and amber
> as if guessed correctly. Warm cream tiles, charcoal letterforms. Keep the
> existing tile's composition and colours — a resolution fix, not a redesign.
> Letters may appear here since they are the subject, but keep them chunky
> enough to survive being displayed at half size.

---

## PRIORITY 3 — optional, quality only

### 7. Two social cards are ~2× heavier than any other

Not a redraw — a **re-export at lower file weight**, same artwork:

| File | Now | Every other card |
|---|---|---|
| `play/social/golf-solitaire.png` | **1,236 KB** | 200–580 KB |
| `play/social/snackwords.png` | **1,022 KB** | 200–580 KB |

The next heaviest of the other 32 is 579 KB. These are only fetched by social
scrapers rather than page visitors, so this is cosmetic housekeeping rather than
a page-speed problem — but a 1.2 MB card is slow for a preview and there is no
visible benefit. Re-export at the same 1200×630 targeting roughly 400 KB.

**Do not touch the other 32 social cards.** All 34 are correctly 1200×630 and
all have generated `.webp` derivatives.

---

## PRIORITY 4 — still outstanding from the earlier plan

Carried forward from `../SITE-IMPROVEMENT-PLAN.md`. Neither blocks anything.

### 8. Thirteen guide hero / share card

**File:** `guides/thirteen-tien-len-rules/social-card.png` — **1200×630**

The guide is live and currently reuses `/play/social/thirteen.png`.

> A warm, flat-illustrated social share card, 1200×630, for a web guide about
> the Vietnamese card game Tiến Lên ("Thirteen"). A fan of five playing cards
> spread across the lower-left, drawn in a soft rounded style with clearly
> readable pips — show a 3 of spades at one end and a 2 of hearts at the other
> to hint at the game's low-to-high ranking. Cream (#FBF7EF) background with a
> soft amber glow behind the cards. Generous empty space in the upper-right
> third for a text overlay. No text in the image itself. Flat vector look, soft
> long shadows, no gradients, no photorealism, and no gambling or casino
> imagery — a friendly family card game, not a betting one.

### 9. Thirteen combination explainer strip

**File:** `guides/thirteen-tien-len-rules/combos.png` — **1600×400**,
transparent background

> A single horizontal instructional strip, 1600×400, transparent background,
> showing five card combinations left to right with a small gap between each
> group: (1) one single card, (2) a pair, (3) a triple, (4) a run of four
> sequential cards, (5) four of a kind. Flat rounded playing cards in the same
> soft style, pips clearly legible at small size, slight overlap within each
> group so they read as a set. No labels or text — captions are added in HTML
> beneath. Warm cream card faces, muted red and charcoal suits, soft drop shadow
> under each group.

### 10 & 11. Printable worksheet furniture (R6, not yet started)

Only generate these if the printables work is going ahead — the pages that would
use them do not exist yet.

**Files:** `read/printables/frame-header.png`, `read/printables/frame-footer.png`
— A4 width at 300 dpi, transparent

> Reusable decorative header and footer bands for printable A4 children's
> worksheets, transparent background, sized for A4 width at 300 dpi. Header: a
> shallow band of small friendly SnackPack-style motifs — a pencil, a star, a
> leaf, a smiling sun — spaced along a thin rounded rule, leaving the centre
> clear for a title to be typeset over. Footer: a matching thinner band, mostly
> empty, with two or three small motifs at the outer edges only. Print-safe:
> line art and flat fills only, no large dark areas, no full-bleed colour — this
> prints on home inkjets and must not drain ink. No text.

**File:** `read/printables/social-card.png` — **1200×630**

> A 1200×630 social share card for a free printable worksheets page aimed at
> parents and teachers of 4–7 year olds. A small stack of printed worksheet
> pages fanned slightly, one on top showing faint generic pencil-line marks (no
> readable words or numbers), beside a chunky child's pencil and a couple of
> scattered crayons. Cream (#FBF7EF) background, soft amber and sage accents,
> generous clear space on the right for a text overlay. No text in the image,
> flat vector style, soft shadows, and no photographs of real children.

---

## Explicitly do NOT generate

Checked before writing this, so nobody spends effort on something already
solved or unused:

- **Card faces or card backs.** Faces are rendered from DOM text plus the
  existing suit sprites in `shared-assets/game-ui/card-decks/suits/`. Eight
  painted backs already exist in
  `shared-assets/game-ui/pro-hand-painted/card-decks/backs/`.
- **Table backdrops.** Eight already exist in
  `shared-assets/game-ui/table-themes/png/` — `felt-green`, `felt-blue`,
  `slate-pro`, `royal-plum`, `marble-rose`, `wood-walnut`, `paper-warm`,
  `arcade-grid`. A ninth would repeat the unused-asset mistake recorded in D1 of
  `ARCADE-IMPROVEMENT-PLAN.md`, where 26 MB of premium card faces shipped to a
  website that never consumed them.
- **Audio.** All eight arcade sounds already ship and are wired.
- **`.webp` derivatives.** Generated by `scripts/build-webp.mjs`.
- **The other 32 arcade tiles and 32 social cards.** Audited today; all correct.

---

## When the files land

```bash
node scripts/build-webp.mjs
node scripts/check-site.mjs
```

Then remove the `ART PENDING` comment from the head of
`play/tripeaks/index.html` and `play/pyramid/index.html`, repoint their
`og:image` and `twitter:image` at `/play/social/<slug>.png`, delete
`play/tiles/PLACEHOLDERS.txt`, and after deploying:

```bash
node scripts/check-live.mjs
```

`check-live.mjs` is the one that catches art that was made but never committed —
which has happened before on this property (P7).
