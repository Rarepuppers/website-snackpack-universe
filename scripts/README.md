# Scripts

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
