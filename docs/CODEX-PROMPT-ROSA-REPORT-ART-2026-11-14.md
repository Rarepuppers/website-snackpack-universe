# Codex prompt: Rosa's Copán Report, pages 4 and 6 (2026-11-14)

You are painting two new pages for a free picture book on the SnackPack Universe reading
shelf. The monorepo root is `C:\snackpack-universe`. The website is the nested repo
`website-snackpack-universe/`. The book is live at
https://www.snackpackuniverse.com/read/rosas-copan-report/ (ages 9 to 12).

## Why this job exists

When the book was made, pages 4 and 6 had no art of their own. They borrowed pages 3 and 5
from the sister book, *Polly Roger and the Red Wings of Copán*. That means a class reading
both books sees the same two pictures twice, and Polly Roger, in her pirate coat, turns up
in Rosa's school report, where the text never mentions her. A class in Honduras is reading
these books now, so both pages need art made for this book.

## Read and open these first

1. `website-snackpack-universe/docs/BOOK-BRIEF-ROSAS-COPAN-REPORT-2026-11-06.md`: the book,
   its sources and the Copán rules.
2. `website-snackpack-universe/docs/ART-BRIEF-WEB-BOOKS-2026-11-06.md`: house rules, sizes and
   export.
3. `docs/art-incoming/2026-11-06/DELIVERED.md` and `DELIVERED-2026-11-09.md`: what was
   delivered last time and what went wrong.

Use these as reference images:

| Use | File |
|---|---|
| Rosa's identity (required on both pages) | `docs/art-incoming/2026-11-06/rosa-character-sheet.png` |
| House style and the classroom for page 6 | `docs/art-incoming/2026-11-06/rosa-copan-report/rosa-copan-report-p1.jpg` |
| Real ballcourt architecture (page 4) | `docs/art-incoming/2026-11-06/references/copan-ballcourt-reference.jpg` |
| Real stone macaw head form (page 4) | `docs/art-incoming/2026-11-06/references/copan-macaw-stone-reference.jpg` |
| Classmates (page 6) | `apps/snackpack-7-mathematics/assets/shared/panda-cake-student.png`, `hop-tart-bunny-student.png`, `ted-e-bear-student.png` |
| Do NOT copy this composition | `docs/art-incoming/2026-11-06/polly-roger-copan/polly-roger-copan-p3-r2.jpg` and `polly-roger-copan-p5.jpg` |

## Rules for both pages

- Rosa is a young scarlet macaw: a pale face, an ivory upper beak, red body feathers and
  red, yellow and blue wings. She wears a plain white collared shirt, a blue pleated skirt
  and a small tan backpack, with no badge, flag, logo or writing. She has exactly two
  wings and two feet and no human arms. She must match her character sheet on both pages.
- **Polly Roger does not appear.** Nor does any pirate hat, coat, monocle or spyglass.
- No people. No words, letters, digits, glyphs you invent or anything that reads as
  writing, including on the board, the notebook and the carvings. Carved stone stays softly
  weathered relief.
- Each picture is one full-bleed scene, portrait 2:3. Paint the master at 1024 × 1536.
- Wild macaws wear no clothes.

## Page 4

**Text:** "Macaws mattered to the Maya of Copán. Carvers shaped macaw heads for the ball
court, and the name of the city's first ruler includes the word for macaw. These birds were
part of the city's identity."

**Picture:** Rosa does her research at the Great Ballcourt of Copán. View the court from one
end, looking down the long grassy playing alley between the two low, sloping, pale grey
masonry benches. Three weathered stone macaw-head markers sit along the top edge of the
right-hand bench, all the same blocky form as the reference: one close in the foreground and
two smaller ones further along. Rosa stands on the grass in the lower-left foreground, about
a quarter of the picture's height, seen from the rear three-quarter. She looks up at the
nearest stone head with her notebook open in her wings. The notebook shows only a loose
pencil sketch of a macaw head, with no lines of writing. Tall tropical trees and green hills
lie beyond. Warm mid-morning light. This must look clearly different from Polly p3: a view
down the length of the court, Rosa alone and sketching, three markers.

**Proof check:** the markers are on the bench top and not floating, nothing on the
notebook page reads as text, Rosa has two feet on the grass and no stone touches her.

## Page 6 (last page)

**Text:** "Scarlet macaws almost disappeared from the valley. Then people began to build
nests, watch the chicks and teach visitors. Now macaws fly over Copán again. My report has
one question for you: what is worth protecting where you live?"

**Picture:** the book ends where it began, in the classroom from page 1. Rosa stands at the
front, beside the dark board, smiling and asking the class her question, with one wing
lifted in invitation. Pinned to the board is a large painted poster without any words: red
wild macaws flying over the grassy ruins of Copán, with a wooden nest box on a tree at its
edge. In the foreground, seen from behind and slightly to the side at their desks, sit three
classmates: Panda-Cake, Hop-Tart the bunny and Ted-E-Bear. Each matches their student
portrait, and one of them has a paw raised eagerly to answer. Rosa is the clear focus. Keep
the same window, plants, shelves and warm afternoon light as page 1, so the two pages read
as a pair.

**Proof check:** the poster and board carry no letters, each classmate is on model with the
right number of limbs, and Rosa's outfit matches page 1.

## Process

1. Paint page 4 as a proof. Compare it with the references and the proof checks above, and
   fix it before moving on.
2. Paint page 6, proof it the same way, then fix it.
3. Export each master to a 768 × 1152 JPEG at quality 85, the same way
   `docs/art-incoming/2026-11-06/export-art.ps1` did.

## Delivery

- JPEGs: `docs/art-incoming/2026-11-14/rosa-copan-report/rosa-copan-report-p4.jpg` and
  `rosa-copan-report-p6.jpg`
- Masters: `docs/art-masters/2026-11-14/rosa-copan-report/rosa-copan-report-p4-master.png`
  and `rosa-copan-report-p6-master.png`
- Write `docs/art-incoming/2026-11-14/DELIVERED.md` listing each file with its size, the
  exact prompt you used and the picture you are least sure about.

Use new filenames only. Do not overwrite anything, and do not edit `read/`,
`data/web-books.json`, website pages or app code. Claude imports and publishes after a review.
Other sessions work in this checkout, so stage only your own new files with explicit paths
(never `git add -A` or `git commit -a`), and never reset, stash, check out or discard
anything. Commit your files to the monorepo, then report what you delivered.
