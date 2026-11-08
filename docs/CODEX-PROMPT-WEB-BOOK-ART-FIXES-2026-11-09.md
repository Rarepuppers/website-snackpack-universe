# Codex prompt: web book art fixes (2026-11-09)

Paste everything below the line into Codex.

---

You are fixing illustrations for the SnackPack Universe free reading shelf. The monorepo root
is `C:\snackpack-universe`. The website is the nested repo `website-snackpack-universe/`.

## Background

On 2026-11-09 Claude reviewed your 6 November delivery
(`docs/art-incoming/2026-11-06/DELIVERED.md`) page by page against the story text.

- **Passed and published:** Nutmeg's Stormy Barn (5 pages) and Panda-Cake's Puddle Party
  (5 pages). Do not touch them. Their hashes are pinned and any change fails the website
  checks.
- **Passed, waiting on a Honduran reader:** Rosa's character sheet, Polly Copán pages 1, 2,
  4 and 6, and Rosa's report pages 1 and 5.
- **Passed, Claude installs it:** the Big Two tile and social card. Nothing to do here.
- **Needs work:** the four pictures below. Three are required and one is optional.

The two Copán books are not live yet. They wait for these fixes and for a read-through by
someone from Honduras.

## Read first

1. `website-snackpack-universe/docs/ART-BRIEF-WEB-BOOKS-2026-11-06.md`: rules, style
   references and delivery paths. They all still apply.
2. `website-snackpack-universe/docs/BOOK-BRIEF-POLLY-ROGER-COPAN-2026-11-06.md`
3. `website-snackpack-universe/docs/BOOK-BRIEF-ROSAS-COPAN-REPORT-2026-11-06.md`
4. `docs/art-incoming/2026-11-06/DELIVERED.md`, your own notes from last time.

Use these reference images:

- **Rosa:** `docs/art-incoming/2026-11-06/rosa-character-sheet.png`. She must match it
  exactly: scarlet macaw, plain white collared shirt, blue pleated skirt, tan backpack, and no
  flag, badge or writing.
- **Polly Roger:**
  `apps/snackpack-3-spelling-sentences/assets/character-portraits/polly-roger-parrot.webp`
  and your passed pages `docs/art-incoming/2026-11-06/polly-roger-copan/polly-roger-copan-p1.jpg`
  and `-p4.jpg`. She keeps the purple and gold coat, gold sunflower breastplate, gold hat with
  purple and gold feathers, monocle and small brown bag.
- **House style:**
  `website-snackpack-universe/read/polly-rogers-pirate-cove/pages/polly-roger-pirate-cove-p1.jpg`
- **Copán:** your working photos in `docs/art-incoming/2026-11-06/references/`, plus any
  other photos of the real site you look up. Use them for **architecture only**.

## Required fixes

### 1. Rosa's Copán Report, page 2: new composition

**Page text:** "Copán is in western Honduras, close to the border with Guatemala. More than a
thousand years ago, it was a great Maya city. In 1980, it became a UNESCO World Heritage
Site, so people around the world now help to protect it."

**Problem:** the current `rosa-copan-report-p2.jpg` reproduces the framing of the
mayaruins.com ballcourt photo by Barbara McKenzie: the same camera angle, the same building
on the left, the same sloping canopy and the same wall on the right. We have no licence for
that photo, so the picture must not be a painted copy of it.

**Paint:** a wide valley view that you compose yourself, from higher ground at the edge of the
site. Show the green Copán valley with the Copán River and low hills, and grey stone ruins
among very tall trees in the middle distance: low platforms, terraces and the long ballcourt
walls, seen small. Use soft morning or afternoon light. No characters, people, signs or
modern buildings. A small hint of the pale stairway canopy is fine, but it must not become
the subject.

**Self-check:** put your picture next to `references/copan-ballcourt-reference.jpg`. If the
camera position, the main building's placement or the canopy line match, start again.

**File:** `rosa-copan-report-p2-r2.jpg`

### 2. Rosa's Copán Report, page 3: the real Hieroglyphic Stairway

**Page text:** "The most famous place in Copán is the Hieroglyphic Stairway. Maya carvers
covered its stone steps with more than a thousand glyphs. It is the longest Maya text that we
know. Reading it is like opening a history book made of stone."

**Problem:** the current page shows a wide, smooth, generic pyramid stair under a party-tent
roof. It looks like a different site, and its plain steps contradict the text, which says the
steps are covered in glyphs.

**What the real stairway looks like** (check it against `references/copan-stairway-reference.jpg`):

- It is NARROW and very steep, one long flight rising into a grassy, tree-covered mound. It
  is not a wide pyramid face.
- Every step is a row of small, square, weathered carved blocks, so the whole stair has a
  dense, knobbly, grid-like texture. Paint that texture so that **no single glyph can be read
  or made out**: soft, worn and seen from a distance.
- Weathered seated figures sit at intervals up the centre line.
- A low carved altar or block stands at the foot, with a tall weathered carved stone monument
  (a stela) standing in front of the stair, slightly to one side.
- A large pale protective canopy (tarp) is stretched high over the whole stair on poles. It is
  part of how the site really looks, so keep it, but make it a plain sheet, not a tent or
  marquee.

**Paint:** a view from the grass in front, at a slight angle, with the stair filling much of
the height. Rosa stands small at the bottom on the grass, seen from behind or in three-quarter
view, looking up. She must not touch the carvings. Use warm late-afternoon light filtered
through the canopy. No people, no readable glyphs, and no temples or pyramids from other
cultures.

**File:** `rosa-copan-report-p3-r2.jpg`

### 3. Polly Roger and the Red Wings of Copán, page 3: off the ancient wall

**Page text:** "Rosa leads Polly to Copán. Long ago, the Maya people built this city from
stone. Polly stops. "Look! A stone bird is peeking at me!""

**Problem:** in `polly-roger-copan-p3.jpg` Polly stands with her feet on the sloping
ballcourt masonry. This is a book about looking after a place, at a UNESCO site, so neither
bird may stand, perch or sit on the ancient stonework. This picture is also reused as page 4
of Rosa's report, so it appears in both books.

**Paint:** keep the same scene and what works in it: the long grassy ballcourt alley between
sloping grey walls, the blocky weathered stone macaw-head marker at the top of the slope on
the right, the trees and hills, and Rosa beside Polly. Change only the poses. Both birds stand
on the **grass** of the playing alley. Polly leans forward from the grass, peering up at the
stone macaw head with delighted curiosity, and is not touching it. Keep Polly's full coat with
sleeves, as on pages 1 and 2 (on the current p3 it reads as a sleeveless vest). Each bird has
exactly two wings and two feet.

**File:** `polly-roger-copan-p3-r2.jpg`

## Optional fix

### 4. Polly Roger and the Red Wings of Copán, page 5: chicks that look like chicks

**Page text:** "Rosa shows Polly a neat nest box high in a tree. Two chicks are peeping
inside. "We are coming back," Rosa says."

The current page passes. Only the two chicks in the nest-box hole look like tiny adult
macaws, with full red feathers and adult beaks. If you have time, repaint only the chicks as
real young scarlet macaws: sparse grey-white down with pin feathers starting, oversized pale
beaks and still EXACTLY TWO. Leave everything else the same: the box, branch, Polly, Rosa and
the valley. This picture is reused as page 6 of Rosa's report. Skip it if you cannot keep the
rest of the picture identical.

**File:** `polly-roger-copan-p5-r2.jpg`

## Rules (same as last time)

- Each picture is one full-bleed portrait scene at 2:3. No words, letters, digits, glyphs
  that can be read, borders, logos or watermarks.
- No people. Wild macaws wear no clothes, and Polly and Rosa keep their outfits on every
  page.
- Use photos for architecture only, never for composition. Do not trace or closely match any
  one photograph.
- Make one proof of fix 2 (the stairway), compare it with the stairway reference and the
  page text, and only then do the rest.

## Delivery

| File | Size and format | Path, from the monorepo root |
|---|---|---|
| Page JPEGs | 768×1152, quality ~85 | `docs/art-incoming/2026-11-06/<book>/<file>` |
| Masters | 1024×1536 PNG | `docs/art-masters/2026-11-06/<book>/<file without .jpg>-master.png` |

`<book>` is `rosa-copan-report` or `polly-roger-copan`. **Never overwrite** the existing p2,
p3 or p5 files. The `-r2` names are new files, and Claude switches the books over to them.

Write `docs/art-incoming/2026-11-06/DELIVERED-2026-11-09.md` listing each new file, its size,
its prompt, which fixes you did (say whether you skipped the optional one) and anything you
are unsure about.

Do not edit website pages, shelf data, app code, the old DELIVERED.md or anyone else's
changes. Other sessions work in this checkout, so stage only your own new files by explicit
path, and never reset, stash or discard anything. Do not commit
`docs/art-incoming/2026-11-06/references/` (no licence to redistribute). Do not push, publish
or import anything into `read/`. Claude reviews, imports and publishes.

If `git commit` fails because `.git` is read-only, as it did last time, leave the files
uncommitted. Say so in DELIVERED-2026-11-09.md and in your reply, listing the exact paths to
stage.

When you finish, report which files you delivered and which pictures you are least sure about.
