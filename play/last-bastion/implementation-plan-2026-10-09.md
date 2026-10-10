# Last Bastion — audit and plan, 9 October 2026

Author: Claude. Status: **phases 1–4 approved and implemented 11 October 2026 (§5); phase 5
waits on the GoatCounter site code.** Supersedes the
queue in `implementation-review-2026-09-20.md`, which is fully closed (see its §6).

## 0. Baseline (measured today, not carried forward)

- Local `main` @ `35465865`. `git fetch` failed (SSH auth), so `origin/main` is unverified —
  **re-fetch before starting; Codex also works this game.**
- `npm run verify:last-bastion`: **all required lanes PASS** (web/unit/build/smoke/offline,
  browser acceptance, desktop 28/28) in 43.6 s. Manual gates still MANUAL.
- `npm run screens:last-bastion`: 32/32 captured → `playtest-evidence/2026-10-08-screens-auto/`.
- Hands-on in the browser pane: title → menu → character select → threat tier → map →
  combat at 1280×720, plus a 375×812 phone pass.
- Content freeze remains in force. Nothing below adds a weapon, enemy, boss, item or hero.

## 1. Headline

The engineering is healthy and over-verified. What holds the game back is not code quality:

1. **Nobody can see whether anyone plays it.** Telemetry has been finished and dormant for
   four weeks, waiting only on a GoatCounter site code. Every decision since 11 Sept has
   been made blind, and the strategy plan's "read the telemetry, decide from it" step
   cannot start.
2. **Phone visitors hit a dead end.** No touch input exists. On a phone the game renders as
   a letterboxed strip that says PRESS ENTER; a tap gets you to the menu, and combat is
   then impossible. Nothing tells the player this.
3. **The first session is long and gated.** The only player-facing mode is a 20-node,
   one-life expedition (~12–25 min). The short 10-wave **Quick Drop** already exists, but
   it can only be reached from the developer **Lab**, as "Normal ten-wave run".
4. **Developer surfaces leak into the player shell**: Lab menu, stale roadmap copy, debug
   jargon on the debrief.
5. **The five creator-observed runs** (`local-playtest-plan-2026-08-21.md`) have never been
   done. Automation cannot judge whether it is fun.

## 2. Findings

Severity: **P1** = player-visible defect or blocks a decision · **P2** = polish/QoL ·
**P3** = tooling/hygiene.

### Bugs and corrections

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| A1 | P1 | Menu card says **"20 NODES • ONE LIFE (Quick Drop until the starchart lands)"**. The starchart shipped months ago; this is a stale internal roadmap note shown to players. | `shell/ShellScene.ts:426` |
| A2 | P1 | Settings card says **"Persisted immediately to local save"**, which is dev-speak. | `ShellScene.ts:432` |
| A3 | P1 | **LAB** is a top-level player menu item. It lists ~30 internal routes, including every boss scenario ("Abomination Prime lab"), the art gallery, and an "Encounter Event Lab" showing *IN-MEMORY REVIEW • NO SAVE WRITES*. It spoils the late game and reads as unfinished. | `ScreenFlow.ts:74, 251–` |
| A4 | P1 | Phones: no touch controls and no notice. The player taps into the menu and then cannot play. | 375×812 pass |
| A5 | P2 | Debrief header shows **`SEED 61061 / SIM 3`**. "SIM" is the simulation version, a developer term. The stat row label **"Wave / column"** is also jargon. | `RunSummaryScene.ts:75, 85` |
| A6 | P2 | The debrief review fixture uses the non-existent upgrade id `armour-plating`, so the fallback prints the raw id. Every marketing/QA capture of the debrief shows it. Fix the fixture and add a test that fixture ids resolve. | `RunSummaryScene.ts:493` |
| A7 | P2 | Character select: three perk slots render as text boxes **T0 / T1 / T2** with no icon (threat-tier perks). Every other perk has art. | `character-select-*-1920x1080.png` |
| A8 | P2 | The Tactician dossier wraps to 9 lines with no spacing between fields, so ROLE/PASSIVE/ULTIMATE read as one block. Give each field a label column and a gap (MeasuredText already exists). | same capture |
| A9 | P2 | How-to-Play page 1 says "Hold position for one second to Entrench", which is the **Marine's** passive, presented as universal. | `ScreenFlow.ts:101` |
| A10 | P2 | Expedition map: the outer frame line (35,65→923,495 at 960×540) does not align with the backdrop plate (96→864), so two rectangles overlap and the info panel sits across the frame edge. | `map-960x540.png` |
| A11 | P2 | Separator inconsistency: the threat-tier footer uses `-`; every other screen uses `•`. The threat-tier screen also uses plain rectangles where other screens use the chrome frames. | screenshot |
| A12 | P3 | `screens:last-bastion` names its folder with `toISOString()` (UTC), so today's run was filed as **2026-10-08**. This is the portfolio's known UTC/local day-key bug class. | `tests/visual/last-bastion-screens.spec.mjs:65` |
| A13 | P3 | README "Live — trust these" table still points at the 11 Sept plan, and the 20 Sept review is unindexed. | `README.md` |

### First-session and retention (no new content)

| ID | Sev | Proposal |
|---|---|---|
| B1 | P1 | **Promote Quick Drop to the main menu** as the short mode: "QUICK DROP — 10 waves, about 8 minutes". It is already built, seeded and has debrief/retry support (`quickDropRetryUrl`). Recommend it as the default focus for a first visit (`runs === 0`), with Expedition as the main campaign. |
| B2 | P1 | **Daily Drop**: one seeded Quick Drop per local calendar day (`localDayKey`), the same for everyone. The menu shows today's best and a streak, and the debrief shows "Daily — 9 Oct" plus a share line. This is strategy plan G3, never built. It reuses the existing seed plumbing, adds no content, and is the cheapest repeat-visit hook a browser game has. |
| B3 | P1 | **Hide Lab from players.** Show it only with `?debug=1` or `?lab=1`; QA routes keep working by URL. Update the functional spec that navigates to it. |
| B4 | P1 | **Phone/touch handling, choose one** (decision D2 below): **(a)** a friendly HTML interstitial before boot: "Last Bastion needs a keyboard or controller — try these touch games instead →" with links to 3 arcade games and a "play anyway" option. About half a day of work. **(b)** Full touch controls (virtual stick, auto-aim on by default, tap buttons for evade/ultimate). Several days of work, plus HUD layout work for portrait. Recommend **(a) now**; consider (b) only if telemetry shows meaningful mobile volume. |
| B5 | P2 | **Way out to the site.** The page is a bare full-screen canvas with no link back to `/play/` or the apps. Add an "ARCADE" item to the main menu and a "More games" button on the debrief. Both navigate to `/play/`, so they are not funnel links into kids' apps and are not gated. |
| B6 | P2 | **Skip the threat-tier screen** while only Tier 0 is unlocked. It is a one-option screen in the first-run path. |
| B7 | P2 | **First Drop tutorial panel**: shrink to its content. It is currently a 780×140 box with one line of text, covering the top-left of the arena where enemies spawn. |
| B8 | P2 | Label the XP bar ("XP 0/15"). The second bar under health has no label. |

### Telemetry and decisions (blocked on Mark)

| ID | Sev | Item |
|---|---|---|
| C1 | P1 | **GoatCounter site code.** Create a free site (e.g. `snackpack-lastbastion`), then I set `SITE_CODE`, rebuild, bump the atomic cache, and verify a controlled funnel lands on the dashboard. The privacy page is already served. The site needs either Mark's own signup or a code Mark gives me; I cannot create the account. |
| C2 | P1 | **Five observed runs** (`local-playtest-plan-2026-08-21.md`): play it yourself, five times, with notes. This is the only fairness/fun gate, and it has been open since August. |

### Deliberately NOT recommended now

- New content (freeze stays in place until C1 reports numbers).
- Steam / U3 bezel / 4K tuning: parked by decision. The 4K headless numbers (53 ms avg) need
  real-GPU evidence before anyone acts on them.
- Splitting `CombatSimulation.ts` (10.4k lines) or `PrototypeScene.ts` (4.9k lines): no
  player value, and the replay corpus already guards it.
- New art: A7's three perk icons are the only art gap I found. They go to Codex per the
  division of labour; until then a code-drawn tier glyph (chevrons ×1/2/3) replaces the
  bare "T0" text.

## 3. Phased implementation

Each phase is one focused commit (or a small group) in the nested website repo, followed by
`npm run build` in `dev/`, committed `game-assets/`, an `sw.js` atomic-cache bump when
runtime chunks change, then `verify:last-bastion` and `screens:last-bastion` with the
captures inspected. Push in batches (CI minutes); Mark chooses when.

### Phase 1: Shell honesty (≈ half a day) — A1, A2, A3/B3, A5, A6, A9, A11, A12, A13

- Rewrite menu subtitles: Expedition "20-node campaign • one life • autosaves between
  nodes"; Settings "Audio, controls, display".
- Lab is gated behind `?debug=1`/`?lab=1`. A `ScreenFlow` test asserts it is absent by
  default and present with the flag. Update the functional spec.
- Debrief: drop `SIM n` from the visible header (it stays in Copy Run Details); rename
  "Wave / column" to "Furthest wave".
- Fix the fixture id, plus a test that every debrief/scenario fixture upgrade id resolves in
  `UPGRADE_CATALOG`.
- Make the How-to-Play Entrench line hero-neutral, or move it to the Marine dossier.
- Unify separators and frame the threat-tier screen with the shared chrome.
- Make the screens folder use the local date; update the README live index.
- **Acceptance:** no player-reachable string matches `/starchart|lab\b|SIM \d|Persisted/`
  (add this as a test over the shell copy tables); screenshots show the new menu.

### Phase 2: Quick Drop + Daily Drop (≈ 1.5 days) — B1, B2, B6

- Main menu gains **QUICK DROP** and **DAILY DROP** cards, so the grid goes from 7 to 8 cards
  once Lab is hidden. Keyboard/pad order: Daily, Quick, Expedition, …
- Daily seed = hash(`localDayKey()`) → existing combat-seed plumbing. Default hero Marine;
  allow any unlocked hero. One scored attempt per day (best kept); replays are allowed but
  unscored.
- Save: an additive `progress.daily = { [dayKey]: { bestWave, kills, cleared } }` plus a
  derived streak. No schema bump, since `normalizeSave` treats a missing field as `{}`
  (the bestiary precedent). Prune entries older than 60 days.
- Debrief: "DAILY DROP — 9 OCT" header, the streak, and Copy Result text
  (`Last Bastion Daily 9 Oct — wave 10/10, 214 kills, Marine. snackpackuniverse.com/play/last-bastion/`).
- Telemetry vocabulary gains `mode: "daily"` (closed vocabulary; update the privacy-contract
  test).
- Skip the threat-tier screen when only Tier 0 is unlocked.
- **Acceptance:** two loads on the same local day get an identical seed and wave
  composition, and the next day differs (replay digest test). Streak logic is unit-tested
  across month/DST boundaries using local dates, never `toISOString`. Quick Drop is
  reachable in ≤ 2 inputs from the title.

### Phase 3: Phone and exits (≈ half a day for option a) — B4, B5

- Pre-boot check in `main.ts`: `(pointer: coarse)` with no fine pointer and no gamepad
  shows an HTML overlay in `index.html` (site-styled, accessible). It offers "Play anyway"
  (stored per session) and links to three touch-friendly arcade games. A connected gamepad
  dismisses it.
- Add an ARCADE menu card and a "More games" debrief button → `/play/`.
- **Acceptance:** a browser test at the mobile preset sees the overlay and no canvas
  interaction; the desktop preset does not see it; "Play anyway" boots the game.

### Phase 4: HUD and select polish (≈ 1 day) — A7 (code glyph), A8, A10, B7, B8

- Tier glyphs drawn in code; brief Codex for real icons in the asset queue.
- Dossier field layout with MeasuredText; check every hero at 960×540.
- Align the map frame to the backdrop plate.
- Size the tutorial panel to its content; add the XP label.
- **Acceptance:** screens matrix at all four viewports inspected, with before/after pairs
  attached to the log.

### Phase 5: Activate measurement (≈ 1 hour once C1 arrives)

- Set `SITE_CODE`, rebuild, bump cache, push, then run a controlled funnel from a clean
  profile and confirm all four events on the dashboard. Record the baseline date.
  Two weeks later: read the funnel, and only then propose content/balance work.

### Release

Push phases 1–4 as one batch (one CI run). After the push, confirm the live URL serves the
new build (check the build identity in the debrief's Copy Run Details), and confirm that
offline boot/upgrade still works from a warm cache.

## 4. Decisions needed from Mark

- **D1**: Approve phases 1–4 as scoped? (Phase 2 is the only one adding a feature, and it
  is a mode over existing content.)
- **D2**: Phones: **(a)** a polite "needs keyboard/controller" interstitial now
  (recommended), or **(b)** build touch controls?
- **D3**: Hide Lab behind `?debug=1` (recommended), or keep it visible as a "Training"
  room limited to bosses the player has already encountered?
- **D4**: GoatCounter: will you create the site and give me the code?
- **D5**: Will you do the five observed runs once phase 1–2 lands?

## 5. Closeout — 11 October 2026

Decisions: D1 approved (phases 1–4), D2 (a) interstitial, D3 LAB hidden. D4/D5 open.

| Item | State |
|---|---|
| A1, A2, A3/B3, A5, A6, A9, A11, A12, A13 | Done. LAB: `?lab=1`, `?flow=lab`, or `?screen=title&debug=1`. |
| B1, B2, B6 | Done. Every Daily attempt that day counts (best kept), not "one scored attempt" as first drafted: simpler, and replays are the point of a daily. |
| B4 (a), B5 | Done. |
| A7, A8, A10, B7, B8 | Done (A7 as a code glyph; art brief below). |
| **New: telemetry wiring** | The funnel was never called after the 12 Sept reconciliation; restored and guarded. Phase 5 would otherwise have activated an empty dashboard. |
| **New: provenance lost on reload** | Fixed; every real debrief showed SEED UNKNOWN. |
| **New: Medic retry link** | Fixed (URL hero parser omitted the Medic). |

**Codex art brief (Batch K, the only asset this plan needs):** three perk tiles for
Vanguard, Logistician and Recon Specialist as a new `canonical-perk-tile-atlas-v3-128.png`
(frames 0–6 identical to v2, 7–9 new) from new masters beside the v2 ones; then swap the
code glyph in `ShellScene.renderCharacterSelect` for frames 7–9.

Remaining: D4 site code → phase 5; D5 five observed runs; push (one CI run) when Mark says.
