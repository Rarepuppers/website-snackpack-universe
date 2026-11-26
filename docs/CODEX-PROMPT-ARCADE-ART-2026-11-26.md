# Codex prompt — arcade art, 26 November 2026

Paste everything below the line into Codex. It is self-contained. The standing
brief it extends is `CODEX-ASSET-BRIEF-2026-10-17.md` (items 12–18); the plan
that asked for it is `ARCADE-AND-TELEMETRY-PLAN-2026-11-21.md` (R5).

---

You are making painted art for the SnackPack web arcade
(`website-snackpack-universe`, the site at www.snackpackuniverse.com/play/).
Deliver image files only. Do not edit HTML, CSS, JS or tests; another session
wires the files in after you hand back.

## Where to work

- Repository: `website-snackpack-universe` (its own git repo, nested in the
  monorepo folder and ignored by the monorepo).
- Work in a fresh worktree off `origin/main` on a branch named
  `codex/arcade-art-2026-11`. Do not work in the shared checkout: other
  sessions have uncommitted edits there.
- Stage only the files listed below. Never `git add -A`, never `git checkout -- .`.
- Hand back by pushing the branch and opening a pull request titled
  "Arcade art: Snack Typer, Fact Sprint and five interim social cards". Do not merge it.

## House style (from the standing brief — follow it exactly)

1. The clay / soft-3D look of the existing tiles: a rounded square, warm
   palette, soft light from the upper left, one clear subject, gentle drop
   shadow. Reference tiles: `play/tiles/solitaire.png`, `golf-solitaire.png`,
   `mahjong.png`, `snakes-and-ladders.png`, `tripeaks.png`. Reference social
   card: `play/social/solitaire.png` and `play/social/tripeaks.png`.
2. **No rendered text, letters, digits or words anywhere.** Not on keycaps,
   not on cards, not on screens. Suit symbols, simple shapes, dots and
   arithmetic operator shapes (+ − × ÷) are fine. This rule is why the
   interim art below is being replaced.
3. No logos, no real brands, nothing that resembles another company's game.
4. Social cards are 1200×630 landscape. Keep the **left third quiet** (plain
   felt, wood or soft background): the site overlays the page title there.
5. Each tile must read at **52 px and 72 px**, next to its neighbours on
   `/play/`. Check that before handing back.

## Formats

- Tiles: `NAME.png` 144×144 and `NAME@2x.png` 288×288, transparent outside the
  rounded square, sRGB.
- Social cards: `NAME.png` 1200×630, opaque, sRGB.
- A WebP beside **every** PNG you deliver: same basename, quality 88,
  `method=6` (e.g. `cwebp -q 88 -m 6 in.png -o out.webp`).
- Never overwrite or downscale an existing master other than the files named
  here. Keep exact names.

## The items

### A. Snack Typer (typing practice for kids) — new tile and new card

Page: `/play/typing/`. Lessons teach the keyboard row by row; the on-screen
keyboard colours every key by the finger that presses it, and outlines the
next key. The interim art (`play/tiles/typing.svg`, `play/social/typing.png`)
shows lettered keycaps, which breaks rule 2.

Finger colours to reuse (soft tints): left little `#f4d6e4`, left ring
`#e2dcf6`, left middle `#d5e8f7`, left pointer `#d4f0de`, right pointer
`#f6ecc4`, right middle `#f8dcc6`, right ring `#e6e1d8`, right little
`#f4d6e4`; brand orange `#de6a38`; ink `#201713`.

| File | Size | Subject |
| --- | --- | --- |
| `play/tiles/typing.png`, `play/tiles/typing@2x.png` (+ `.webp`) | 144×144, 288×288 | Two short rows of chunky, rounded, **blank** keycaps in the finger colours on a warm orange rounded square. One keycap is lifted and outlined in dark ink (the "next key"). Two keycaps carry the small raised home-row bumps (the F and J bumps) so the subject reads as a keyboard without any letters. Optional: a small round snack-character paw resting on one bumped key. |
| `play/social/typing.png` (+ `.webp`) | 1200×630 | A wider stretch of the same keyboard seen at a slight angle on a cream desk, keys in the finger colours, one key lifted and outlined, a space bar in front. On the right, a small open picture book leaning against the keyboard (the game types sentences from our story books). Left third quiet. |

### B. Fact Sprint (math facts practice) — new tile and new card

Page: `/play/math-facts/`. Addition, subtraction, times tables and division;
Practice mode and a 60-second Sprint. Palette: mint `#7fd1b0` to green
`#1f8a6a`, cream `#fffaf2`, butter `#f6ecc4`, orange `#de6a38`. The interim art
(`play/tiles/math-facts.svg`, `play/social/math-facts.png`) shows digits,
which breaks rule 2.

| File | Size | Subject |
| --- | --- | --- |
| `play/tiles/math-facts.png`, `play/tiles/math-facts@2x.png` (+ `.webp`) | 144×144, 288×288 | On a mint rounded square: a cream card showing a small **dot array** (for example 3 rows of 4 round counters, the picture of 3 × 4) with a chunky × shape beside it, and a small orange stopwatch in one corner for "sprint". No digits. |
| `play/social/math-facts.png` (+ `.webp`) | 1200×630 | A playful desk scene on soft mint: counters arranged in a neat array, a few loose counters, chunky + − × ÷ shapes as clay pieces, an orange stopwatch, and a simple number-pad block with **blank** keys (one green "check" key with a tick shape is fine). Left third quiet. |

### C. Social cards still on interim composites (from the standing brief)

Tiles for these already exist and are final; only the 1200×630 cards are
needed. Replace the interim file, keep the name, add `.webp`.

| File | Subject |
| --- | --- |
| `play/social/rummy-500.png` | Match the tile `play/tiles/rummy-500.png` (Vol 2's Rummy 500 icon): a meld of three 4s (suit symbols only) and a short run of one suit on red felt, with a draw stack. |
| `play/social/block-puzzle.png` | Match the tile (Vol 3's block icon): a wooden tray board with coloured blocks and one glowing piece being placed. Nothing that reads as another company's block game. |
| `play/social/brick-breaker.png` | Match the tile: rounded bricks, a ball breaking through, the wooden paddle. |
| `play/social/chess.png` | Match the tile: an ivory king and a dark rook on a wooden board. |
| `play/social/killer-sudoku.png` | Match the tile: a cream grid with coloured dashed cages and a pencil. **No digits.** |

All five: landscape, left third quiet, no text.

## Do not touch

- `play/pinball/**`, `tools/pinball/**`, `play/last-bastion/**` and their
  tiles and cards (other sessions own them).
- Any file not named in this prompt.
- `play/tiles/PLACEHOLDERS.txt` except to add one line at the end:
  `Delivered 2026-11-xx: typing, math-facts tiles and cards; social cards for rummy-500, block-puzzle, brick-breaker, chess, killer-sudoku (items 12-18).`

## Check before handing back

- [ ] 11 PNGs and 11 WebPs: typing tile ×2 + card, math-facts tile ×2 + card,
      five social cards. Exact names, exact sizes (`sips -g pixelWidth -g pixelHeight` or `identify`).
- [ ] Zero letters, digits or words in any image. Zoom in and look.
- [ ] Tiles have transparent corners; cards are opaque.
- [ ] Each tile viewed at 52 px and 72 px beside `play/tiles/2048.png` and
      `play/tiles/word-search.png`: it reads, and it does not look like either.
- [ ] Each card's left third is quiet.
- [ ] Only the listed files are staged (`git diff --cached --name-only`).
- [ ] Branch pushed, pull request open, not merged. In the PR body, list each
      file with its dimensions and one line on what it shows.
