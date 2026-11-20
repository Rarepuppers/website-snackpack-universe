# Character board pilot

The pilot has six profiles, three library clue rounds, a sourced giant panda
page and three printable scenes in A4 and US Letter. Preview `/characters/`
with the site’s local server. The website build contains the public snapshot.
It includes no internal source notes, and the pages are held out of the
public homepage, Reads navigation and search indexing while the roster grows.

In a website worktree, point `SNACKPACK_ROOT` at the monorepo with the
character source and reviewed art. Use the workspace Python with Pillow
and ReportLab.

```sh
"$SNACKPACK_PYTHON" scripts/build-character-media.py "$SNACKPACK_ROOT"
node scripts/build-character-board.mjs "--source=$SNACKPACK_ROOT"
node scripts/build-character-board.mjs --check "--source=$SNACKPACK_ROOT"
npx playwright test tests/visual/character-board.spec.mjs
```

`node scripts/build-character-board.mjs --check` also works in a website-only
checkout. Tests cover fixed roster navigation, retries and round reset,
keyboard focus, the text-only clue fallback and PDF responses. Plan the
public rollout from the monorepo’s `docs/meet-the-characters/PLAN.md`.
