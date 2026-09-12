# Last Bastion — revised implementation plan

> ## RECONCILED — 12 September 2026. Read this before trusting anything below.
>
> Codex worked this same queue independently and pushed first. On 12 September the two lines
> of work were reconciled by taking **Codex's ten commits as the base** and keeping only what
> was additive. Several items below say "landed" about code that no longer exists on this
> tree, because the equivalent Codex implementation was kept instead. Specifically:
>
> | Item | Who owns it now |
> |---|---|
> | QA-09 run report (`run/RunReport.ts`) | **Codex.** Their provenance carries encounter *and* chart seeds plus a settings snapshot. |
> | LB-02 power-up copy (`content/powerupCatalog.ts`) | **Codex.** |
> | QA-18 projectile appearance | **Codex** (`rendering/ProjectilePresentation.ts`). |
> | QA-16(a)/(b) service worker + asset versioning | **Codex.** Their `sw.js` already had the `res.ok` guard and adds an atomic Last Bastion chunk precache, which is better than the `?v=` query I wrote. |
> | QA-17 seeded arena | **Both.** Codex's `readRunSeed` supplies the seed; my wiring removed the last `Math.random()`. My `run/RunSeed.ts` was dropped. |
> | QA-06 extractions | **Codex** owns `CombatEventPresenter` and `CombatDecisionOverlay`; my pure `combat/DecisionNavigation.ts` is wired into their overlay so the branching has tests. |
>
> Still mine, and still true below: the distribution work, `ui/MeasuredText.ts` and the §5.4
> overflow audit, `combat/CombatEventPresentation.ts`, the player funnel, the screenshot,
> startup and profiling harnesses, the machine-readable verify report, `build:check`, local
> run-history dates, and the replay corpus.
>
> **`build:check`'s "orphaned" list is not a delete list.** Ten chunks it flagged are in
> `sw.js`'s precache block; removing them breaks offline boot. The check now exempts them.


Date: 11 September 2026. **Status: LIVE — steps 1-5 of §5 implemented the same day.
This supersedes the priority queue in `quality-audit-2026-09-07.md`** and carries its open
items forward with re-verified statuses. The 7 September audit remains the reference for each task's original evidence
and acceptance wording; this document is the queue you work from.

Baseline: website repository commit `1965f812`, working tree inspected today.
Author: Claude (code). Assets remain Codex's: nothing here commissions, renames, or
generates art or audio.

---

## 1. Verified baseline — re-run today, not inherited

| Check | Result |
| --- | --- |
| `dev`: `npm run typecheck` | Passed |
| `dev`: `npm run test` | 288 files, **1,618 tests passed** (was 286/1,605 on 7 Sep) |
| `dev`: `npm run build` | Passed, **zero diff against the committed `game-assets/` bundle** |

The published bundle is therefore in sync with source *today*. Nothing enforces that it
stays so — see QA-14.

Not performed here: observed gameplay, rendered-screenshot review, audio listening,
packaged-window, hardware, or Steam acceptance. Those gates remain open and manual.

---

## 2. Status of the 7 September queue, re-checked against current code

| ID | 7 Sep status | Verified today | Disposition |
| --- | --- | --- | --- |
| QA-01 save failure visible | complete | `LocalSaveStore.persistence()` present; export/import path covered by tests and a browser scenario | **CLOSED** |
| QA-02 expedition save validation | complete | normalizers, alias tables, connected-path check present; retired-content policy committed (`7b2cc530`) | **CLOSED** |
| QA-03 debrief controller | complete | `DebriefNavigation.ts` + focused selection present | **CLOSED** |
| QA-04 browser acceptance lane | first lane live | 5 Playwright scenarios; **runs in CI** (`site-check.yml:109`) | **PARTIAL** — see QA-04b |
| QA-05 replay evidence | continuity slice | replay v2 carries builds across nodes (`e8b4cfa8`) | **PARTIAL** — corpus gaps remain |
| QA-06 large-file split | open | `CombatSimulation.ts` 10,412 lines; `PrototypeScene.ts` 5,740 lines | **OPEN, and demoted** — see §4 |
| QA-07 root verifier | core complete | `npm run verify:last-bastion` wraps web + browser + desktop | **PARTIAL** — no isolated staging, no machine-readable output |
| QA-08 presentation register | LB-08 only | LB-01 and LB-09 verified substantially fixed; LB-11 and LB-12 confirmed still open | **PARTIAL** — see §3 |
| QA-09 run report | open | `RunSummary.ts` still has no seed, build ID, or speed provenance | **OPEN** |
| QA-10 accessibility acceptance | open | systems exist; observed acceptance not performed | **OPEN (manual)** |
| QA-11 update/offline consistency | open | confirmed reachable, and worse than described — see QA-11 below | **OPEN, promoted to P1** |
| QA-12 performance/loading | open | Pages exclusions landed (`d7ca07d7`); profiling not done | **OPEN** |

### QA-08 presentation register — item-by-item recheck

| ID | Finding | Verified state today |
| --- | --- | --- |
| LB-01 | No visible bullets | **Substantially fixed.** `PrototypeScene.ts:3585` builds a real projectile view with authored sprites for 8 weapons, a `combat-effects-v1` fallback for the rest, and readability halos. Carries a code defect — see QA-18. |
| LB-02 | Power-ups cannot be inspected | **Open.** No inspect affordance in `CombatHud.ts`. |
| LB-03 | Crates open into silence | **Open.** No reward readout case; `PrototypeScene.ts:4810` still calls the crates placeholders. |
| LB-04 | Helmet off-head | **Art-owned (Codex).** Not actioned here. |
| LB-05 | Menu title outside its plate | **Needs screenshot recheck** — cannot certify from source. Blocked on QA-04b's screenshot matrix. |
| LB-06 | Perk tiles overflow | **Needs screenshot recheck.** Same blocker. Root cause (no measure-then-size primitive) is confirmed open. |
| LB-07 | Map screen low quality | **Partly fixed** by LB-08's intel/confirm work; node iconography is art-owned. |
| LB-08 | Nodes commit on first click | **CLOSED.** Arm-then-deploy confirmed in `ExpeditionScene.ts`. |
| LB-09 | Blurry text at 1080p/4K | **Fixed.** `DisplayScaling.ts` snaps to whole device pixels and `uiTextResolution()` is applied at every `add.text` site sampled. |
| LB-10 | Evidence has nowhere to live | **CLOSED.** `playtest-evidence/` exists and is tracked. |
| LB-11 | Level-up cards clip their text | **Open.** `PrototypeScene.ts:5219` fixes `wordWrap: { width: 312 }` against a fixed-size card with no measurement; the hint line sits at a fixed `y: 138`. |
| LB-12 | Dead `NODE_GLYPHS` table | **Open.** `ExpeditionScene.ts:46` defines it; only `SAFE_NODE_GLYPHS` (`:58`) is read at `:432`. |

Presentation plan §5.1 (measure-then-size primitive), §5.2 (one text factory), §5.3 (combat
event presentation coverage) and §5.4 (UI overflow audit in `verify`) are **all still open**.
§5.3 is now quantified — see QA-13.

---

## 3. New findings — this audit

Eight defects not in the 7 September queue. Each was verified at the cited line today.

### QA-13 — 20 combat events have no presentation or audio handler (P1, M)

**Evidence.** The `CombatEvent` union in `CombatSimulation.ts:707` has 120 members.
`PrototypeScene.ts` handles 100. Cross-checking the remaining 20 against every
presentation and audio module leaves these with **no handler anywhere**:

```
escort-objective-damaged      escort-objective-completed   escort-objective-failed
deny-objective-completed      deny-objective-failed        collect-objective-picked-up
collect-objective-completed   collect-objective-failed     foundry-turret-warning
foundry-child-powered-down    assembly-prime-lane-fired    abomination-prime-warning
abomination-prime-hazard-tick brace-formation              deployable-placed
deployable-fired              deployable-expired           world-interaction-completed
```
(`infected-survivor-rush` and `abomination-recovery` have audio only, no visual.)

**Severity, stated honestly.** This is *not* twenty invisible systems. Deployables render
from `snapshot.deployables` (`syncDeployables`, `:3524`), telegraphs from
`snapshot.telegraphs` (`syncCombatTelegraphs`, `:4509`), and all three objective modes
render their world state and status text from the snapshot (`:3810`, `:3843`, `:3865`).
What is missing is the **moment**: no banner, stinger, flash, or feed line when an
objective completes or fails, when a boss lane fires, or when a deployable expires.
For the objective modes — a headline feature of the 11 August batch — the player's
success or failure passes without acknowledgement. That is S2, not S1.

**The structural half matters more than the twenty cases.** Nothing fails when a new
event ships without presentation. This is presentation plan §5.3 and it is the single
highest-value fix in this document.

**Task.** Add a test that enumerates the `CombatEvent` union and asserts every member is
either handled or on an explicit, commented `PRESENTATION_EXEMPT` allowlist. Then close
the twenty: objective completion/failure get a banner plus the existing reward stinger;
boss warnings get the existing telegraph cue; deployable place/expire get a small flash.
Prefer reusing cues that already exist over asking Codex for new audio.

**Acceptance.** Adding a new union member without a handler fails `npm run test`. Each of
the eight objective events produces observable feedback in its Lab route. No new asset
dependency introduced by this task.

### QA-14 — Nothing enforces that the published bundle matches source (P1, S)

**Evidence.** `vite.config.ts` writes stable-named chunks directly into `../game-assets/`
with `emptyOutDir: false`, and those chunks are committed (`game-assets/game.js`,
`phaser.js`, and ~40 more). CI's browser lane (`site-check.yml:109`) serves the
**committed** bundle. A source change that is committed without a rebuild leaves CI green
against yesterday's build. I rebuilt today and the diff was zero — so this is a latent
trap, not a live incident, and it is exactly the false pass QA-07's acceptance forbids.

`emptyOutDir: false` additionally means a deleted module's chunk stays published forever.

**Task.** Add `npm run build:check` to `dev`: rebuild into a temp directory, compare
against the committed `game-assets/*.js|css` byte-for-byte, and fail on drift or on an
orphaned published chunk. Wire it into `verify` and into CI before the browser lane.

**Acceptance.** Editing a source file without rebuilding fails CI. An orphaned chunk is
named in the failure. The check runs in under 30 seconds.

### QA-15 — CI runs 5 browser tests and none of the 1,618 unit tests (P1, S)

**Evidence.** `site-check.yml` has exactly one Last Bastion step: the Playwright config.
`npm run typecheck`, the 1,618-test vitest suite, `content:audit`,
`combat:audit:boundaries`, `image:audit:webp` and the 28 desktop tests run **only on this
machine, only when someone remembers**. The strongest quality asset in the project is not
defending the branch.

**Task.** Add a `last-bastion` CI job: install `dev` deps, run `typecheck`, `test`,
`content:audit`, `combat:audit:boundaries`; then `desktop` `npm test`. Keep it separate
from `visual-regression` so a browser flake does not mask a unit failure. The PowerShell
lanes (`smoke`, `offline`) stay local until they are ported off `powershell`.

**Acceptance.** A deliberately broken unit test fails CI. Job completes in under 6 minutes.

### QA-16 — The service worker can serve permanently stale game art, and caches failures (P1, S)

**Evidence, and a correction to QA-11's framing.** `sw.js:110` is cache-first for
`png|jpe?g|webp|svg|gif|woff2?|wav|mp3|ogg`. Last Bastion's ~150 MB of `game-assets`
media have stable filenames, so a returning player keeps whatever sheet they first
downloaded, indefinitely. `play/last-bastion/index.html` does not register the worker —
but `/sw.js` is registered at root scope from `/apps/*` and the arcade index, so any
player who visited those pages first **is** controlled by it on the game route. The risk
is reachable, not theoretical.

Worse, and not previously recorded: the cache-first branch does **no `res.ok` check**
before `cache.put`. A transient 404 or 503 for a sprite sheet is stored and replayed
forever. That is a live defect for the whole arcade, not just Last Bastion.

**Task.** Two changes, separable. (a) Guard the put with `res.ok && res.status === 200`.
(b) Give Last Bastion media a release version: either content-hashed asset names or a
coordinated `?v=` manifest, and bump it with the build. Re-test the sibling arcade games
after touching the shared worker.

**Acceptance.** A stubbed 503 for an image is not retained. An old warmed cache upgrading
to a new build serves the new media. Sibling arcade visual tests still pass.

### QA-17 — Arena theme is unseeded, so no run is reproducible (P1, S; blocks QA-09)

**Evidence.** `PrototypeScene.ts:5376`: `return pickArenaTheme(Math.floor(Math.random() * 1024));`
This is the fallback whenever no `?theme=` is supplied — i.e. every real Quick Drop and
every expedition combat entered from the menu. It is the **only** unseeded randomness in
gameplay, and the chosen theme is recorded nowhere.

QA-09 promises "copied details reproduce the intended initial setup." It cannot, while the
arena is drawn from `Math.random()` and discarded. Fix this first; QA-09 depends on it.

**Task.** Derive the theme from the run's existing seed. Record the resolved theme ID on
the run so the debrief and any replay can restate it. Keep the `?theme=` override for Lab
routes.

**Acceptance.** Two runs from the same seed enter the same arena theme. A replay fixture
asserts it. Lab routes are unaffected.

### QA-18 — Projectile appearance is a duplicated ternary with a dead field (P2, S)

**Evidence.** `PrototypeScene.ts:3588–3604` builds `authoredProjectile` with `texture`,
`frame`, and `scale`. The creation path uses texture and frame — **`scale` is never
read**. Six lines later (`:3618–3623`) the same weapon-ID ternary is written out a second
time to compute the scale. Adding a weapon therefore requires editing two divergent
ternaries, and the first one's `scale` silently does nothing. The two lists agree today
only by luck.

**Task.** Replace both with one `PROJECTILE_APPEARANCE: Record<WeaponId, {...}>` table
with a documented default. Assert in a test that every draftable weapon resolves an
appearance.

**Acceptance.** Rendering is byte-identical for all 8 authored weapons and the fallback;
adding a weapon requires exactly one edit; the dead field is gone.

### QA-19 — Run-history dates use UTC, not the player's day (P2, XS)

**Evidence.** `ShellScene.ts:639`: `new Date(entry.completedAtMs).toISOString().slice(0, 10)`.
`toISOString` is UTC. A player east of Greenwich who finishes a morning run sees the
previous day's date in their run history; west of it, the reverse after evening play.

This is a known portfolio bug class — the same construction was fixed in the ABCs heatmap
and the spelling streak on 2 September. Use the local-date helper pattern, not
`toISOString`.

**Acceptance.** A run completed at 09:00 local in UTC+12 displays that local date. Unit
test pins a fixed timestamp against two timezone offsets.

### QA-20 — `expanded-frame` presentation mode is unreachable dead configuration (P3, S)

**Evidence.** `DisplayPresentation.ts:81` can select `expanded-frame`, but only when
`input.expandedFrameAvailable` is true — and `main.ts:34` and `:52` never pass that field,
so it is permanently `undefined`. `ScreenFlow.ts:140` offers only
`["auto", "crisp", "fill"]`. Yet `LocalSaveStore.ts:695` accepts and persists
`"expanded-frame"`, so an imported or hand-edited save can hold a mode the game will
always silently downgrade to `fill`.

The mode depends on the U3 bezel art (improvement plan §8 batch 68), which Codex has not
delivered. That is fine — but the current shape is a setting that can be saved and never
honoured, with no comment saying why.

**Task.** Keep the planner branch. Pass `expandedFrameAvailable` from a single named
constant wired to the U3 asset's presence, with a comment pointing at batch 68. Leave it
out of the settings options until the art lands.

**Acceptance.** The downgrade is deliberate and documented; when U3 arrives, one constant
and one settings-row edit enable the mode.

---

## 4. Changes to the 7 September queue

**Demoted.** QA-06 (split `CombatSimulation.ts` and `PrototypeScene.ts`) moves to the back
of the queue, behind everything in §3. Rationale: it is a large refactor whose stated
justification is maintainability, and QA-13/14/15 are the things that would *catch* a
refactor going wrong. Building the net before the high wire is the right order, and the
7 September audit already made QA-06 depend on QA-05. Do not start it this cycle.

**Promoted.** QA-11 → P1 and split: the `res.ok` half becomes QA-16(a) and is a small,
immediate, arcade-wide correctness fix, not a release-infrastructure project.

**Re-scoped.** QA-09 now depends on QA-17. A run report that cannot reproduce the arena is
not a run report.

**Added to QA-04 as QA-04b.** The screenshot matrix (960×540, 1080p, 4K, 1280×800) is now
a blocker for closing LB-05 and LB-06, which cannot be certified from source. Treat it as
the next QA-04 slice rather than a nice-to-have.

**Nothing removed.** QA-10 and QA-12 stay open and stay manual; they are honest about
needing a human and a device.

---

## 4a. Implementation log — 11 September 2026

Steps 1-5 of the order below landed today. Suite: **1,618 -> 1,642 tests**, typecheck,
build and the five-scenario browser lane all green; `build:check` passes.

| Item | What shipped | Verified by |
| --- | --- | --- |
| QA-19 | `run/LocalDayKey.ts`; `ShellScene.ts` run history now shows the player's local day | 4 unit cases pinning UTC+12 and UTC-7 against a fixed instant |
| QA-18 | `rendering/ProjectileAppearance.ts`; both weapon-ID ternaries collapsed to one table | Regression test pins the scale and halo every authored weapon *was already rendering* |
| LB-12 | Dead `NODE_GLYPHS` removed, replaced by a comment explaining why the ASCII table is deliberate | Absent from the served `ExpeditionScene.js` |
| QA-17 | `run/RunSeed.ts`; arena theme derived from the run seed, `?runseed=` added | Unit cases + observed: seed 7 and seed 2 give different, stable arenas |
| QA-15 | New `last-bastion` CI job: typecheck, 1,642 tests, content audit, combat boundaries, build drift, desktop tests | Workflow parses; all lanes pass locally |
| QA-14 | `dev/scripts/check-published-build.mjs`, wired into `verify` and CI | Found **10 orphaned chunks on its first run** — removed; now PASSes on 24 outputs |
| QA-16(a) | `sw.js` `isCacheable`/`cacheIfUsable` guard; `CACHE` bumped to v18 | `node --check`; the bump also evicts stale Last Bastion media once |
| QA-13 | `combat/CombatEventPresentation.ts` — a `Record<CombatEvent["type"], …>` map, exhaustive at compile time — plus its honesty test | Proven to fail in **both** directions, naming the event |
| QA-13 | Eight objective events closed: visible flash + event-feed line + rising/falling cue for every objective outcome | Strings confirmed in the served bundle; backlog ratchet lowered 21 -> 13 |

**Corrections this work forced.** Two claims in §3 above were wrong when written and are
corrected here rather than quietly edited: the event union has **152 members, not 120** (the
first scan truncated), and the unpresented count was **21, not 20** — `scrap-spent`,
`weapon-sold` and `supply-chest-spawned` were also silent. Separately, `supply-chest-opened`
turned out to have a cue but no visual, which locates **LB-03** precisely: crates are not
silent, they are *invisible*.

**Two defects the new checks found that no human had reported.** `check-published-build`
found ten dead published chunks accumulated by `emptyOutDir: false`, all cross-referencing
only each other. `RunSeed`'s own test found that `Number("")` is `0`, so an empty
`?runseed=` would have read as a deliberate request for seed zero.

**Not observed.** Objective completion and failure were not played through end to end; they
are covered by the source-level test and use the same `flashCircle` + `eventFeed` API as the
126 events that already work. A cold local load of the combat route took **over 20 seconds**
on localhost — one datapoint for QA-12, not a measurement.

### Update — later on 11 September

- **QA-13 is CLOSED.** The unpresented backlog went 21 -> 13 -> **0**. The surface map
  gained `hud` and `exempt` after three of the last four rows turned out not to be debt:
  `scrap-spent` is read by `CombatHud`, a surface the detector never looked at. Every
  exemption states its reason at the row, and the ratchet is now `toBe(0)` rather than an
  upper bound.
- **LB-03 is CLOSED**, and its real shape was the inverse of the report: crates were never
  silent, they were invisible — a cue with no picture.
- **G1 startup is CLOSED, and my earlier finding was retracted.** 466 ms to a visible
  title, 1.8 s to combat asset-quiet. The 46.7 s figure came from a hidden browser pane
  throttling `requestAnimationFrame`, which is what drives Phaser's loader. Now a committed
  measurement: `npm run measure:last-bastion`.

### Update — end of 11 September

Closed since the last update: **QA-04b** (screenshot matrix, `npm run screens:last-bastion`),
**QA-09** (run identity + copy), **§5.1** (`ui/MeasuredText.ts`), and every remaining
code-owned presentation defect — **LB-02**, **LB-05**, **LB-06**, **LB-11**.

The register's code half is finished. What is left in it is **LB-04** and **LB-07**, both art,
both Codex's.

Two defects were found by the screenshot matrix that no source review had caught: an
off-screen threat arrow sitting on the pause hint (`ESC PAU▶E` at 960×540), and LB-06's real
extent. A third was caught the same way minutes after I introduced it, when the QA-09 panel
drew through `NEW PERK`. That is the argument for the matrix in one line.

One test was found to have been **calibrated to the defect**: `ScreenFlow.test.ts` asserted
perk tiles fit within `y + 22 <= 446` while the panel ends at 435, so it passed for months
while the rail hung out of its container.

### Update — 12 September

Closed: **QA-16(b)** (asset versioning), **QA-05** (the replay corpus), **§5.4** (the overflow
audit, which found a fifth defect on its first run), and **QA-06's first extraction**
(`combat/DecisionNavigation.ts`).

**§5.2 investigated and deliberately not done.** A grep suggested the shell scenes rendered
upscaled text, because none call `uiTextResolution()`. A 4K crop disproved it. What remains is
de-duplicating six near-identical `text()` helpers: a refactor with regression risk and no
player-visible benefit, which this plan puts last. Recorded so the grep does not raise it again.

### Update — 12 September, later

**QA-07 and QA-12 closed.** `verify:last-bastion -- -Json <path>` emits a machine-readable
report where a required lane that never ran fails the run and the manual gates are listed as
MANUAL rather than omitted. `npm run profile:last-bastion` reads the frame telemetry nobody was
reading: combat averages **20.5 ms** (p99 25 ms), and under the heaviest density profile
**21.7 ms** (p99 28.3 ms) with zero WebGL context losses. Performance is healthy.

**Two claims were withdrawn rather than shipped.** QA-12's heap check is *not* leak detection —
every screen is its own document, so a per-cycle leak cannot accumulate in that number; real
leak detection here needs GPU and texture memory across navigations and remains open. And my
first QA-07 calibration passed against a "broken" build because the break did not affect the
test cases; replacing the whole return with a constant produced the real red.

**The automated queue is now empty except for QA-06**, which is a staged project by design —
one responsibility per change, first extraction done. Everything else open is art, hardware,
or yours.

### Still open from §3

**Code, mine — all staged, none blocking:** QA-06's remaining extractions (combat-event
presentation dispatch next, then the simulation's mutable ownership, one responsibility per
change), GPU/texture leak detection across navigations, QA-20 (expanded-frame, art-gated),
and presentation §5.2 if it is ever worth it.

**Yours:** the GoatCounter site code that switches telemetry on, and `main` — which is still
at `1965f812` and does not contain any of this.

**Codex's:** the arcade tile, guide screenshots, a share image, LB-04's helmet, LB-07's node
icons.

**Human, unautomatable:** QA-10 accessibility acceptance and the observed-play gates.

---

## 5. Execution order

Ship in this order. Each step is independently committable and leaves the tree green.

1. ~~**QA-19** local dates, **QA-18** projectile table, **LB-12** dead glyph table.~~ **DONE**
2. ~~**QA-17** seeded arena theme.~~ **DONE** — QA-09 is now unblocked.
3. ~~**QA-15** CI unit/typecheck job, then **QA-14** build-drift check.~~ **DONE**
4. ~~**QA-16(a)** service-worker `res.ok` guard.~~ **DONE**
5. **QA-13** — guard and objective outcomes **DONE**; 13 backlog events remain.
6. **QA-09** run report, on top of QA-17.
7. **QA-04b** screenshot matrix → close **LB-05**, **LB-06** → **LB-02**, **LB-03**,
   **LB-11** and presentation plan §5.1/§5.2/§5.4.
8. **QA-05** replay corpus completion, **QA-07** isolated staging and lane reporting,
   **QA-16(b)** asset versioning.
9. **QA-10** accessibility acceptance and **QA-12** profiling — schedule the human gates.
10. **QA-06** staged extraction. Last, and only with 1–9 landed.

## 6. Completion rule

Unchanged from 7 September, and worth restating: a green content count cannot certify
correct art, a green simulation digest cannot certify rendering, and static offline checks
cannot certify an offline launch. Every closure records the change, the automated result,
observed evidence where the claim needs an eye, the remaining limitation, and the commit.
