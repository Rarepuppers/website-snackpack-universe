# Character catalog publication

The website publishes the 51-character profile catalog from Apps 1–4,
51 clue rounds, 18 sourced animal pages and artwork in both print sizes.
The 14-character colouring pack and the individual drawings use reviewed
masters. Profiles can show book art or a second portrait when available.
Homepage, Reads, app pages and books with confirmed appearances link to the board. The public snapshot
omits internal notes and original paths.

In a website worktree, point `SNACKPACK_ROOT` at the monorepo with the
character source and reviewed art. Use the workspace Python with Pillow
and ReportLab.

```sh
export SNACKPACK_ROOT SNACKPACK_PYTHON
npm run build:characters
node scripts/build-character-board.mjs --check "--source=$SNACKPACK_ROOT"
npx playwright test tests/visual/character-board.spec.mjs
```

`node scripts/build-character-board.mjs --check` also works in a website-only
checkout, as does `node scripts/build-breadcrumbs.mjs --check`. Both run
in site CI. The npm command rebuilds portrait derivatives, board pages,
breadcrumbs, the reviewed appearance index, Reads offline hashes and the sitemap in that order. Pass
`npm run build:characters -- --all-media` when changing the reviewed
colouring masters or welcome art. Tests cover roster search, retries and
six-face clue pools, keyboard focus, the text-only clue fallback and PDF
responses. Rebuild the Reads shelf after generating story cast links so its
offline hashes remain current. The monorepo’s
`docs/meet-the-characters/PLAN.md` describes the app migration and
`shared-assets/text/characters/catalog.json` carries the shared IDs.


Record released roles in the monorepo catalog under `appearances`. Draft
entries stay out of the generated site. Use
`node scripts/build-character-appearances.mjs --candidates` to find names
in story text for editorial review. The appearance index powers a single
cast row per book. After the book is imported, remove the approved
catalog entry's draft flag and rebuild before verifying the offline reader.
