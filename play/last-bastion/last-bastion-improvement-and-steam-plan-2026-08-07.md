# Last Bastion — improvement and Steam plan

**Written: 7 August 2026. Status: LIVE — this is a forward plan, not a history doc.**

Scope: a full review of `play/last-bastion/` as it stands today, then a plan covering
(a) the move to a Steam desktop release at Full HD and 4K, (b) gameplay and quality
improvements, and (c) every new art/animation/audio asset Codex needs to produce for them.

## Codex review addendum — 8 August 2026

**Verdict: approve the direction, with the amendments below.** The plan is unusually strong on
code seams, dependencies, art gates, and acceptance criteria. Its largest weakness is that it
mixes product validation, platform discovery, refactoring, content production, and release work
into four mostly linear phases. Treat those as workstreams with explicit gates, and maintain the
task ledger below as the current source of truth.

### Verified drift since the original snapshot

- After the implementation begun in this review, the suite is **1,170 tests across 171 files**,
  not 1,021 across 153; it is green.
- `CombatSimulation.ts` is already being decomposed. Scenario population and 15 behaviour
  modules are now outside the class; the Infected Survivor extraction began in this review.
- **T0.4 live display size is shipped** and covered by `DisplayScaling.test.ts`; remove it from
  the open queue.
- The five HUD/pacing recommendations in §11.6 and the game-speed setting in §11.5 are shipped.
  Their remaining follow-ups (especially colour-independent damage-type identity) stay open.
- Snapshot counts in §1 are historical. Generate counts from catalogues/tests for every release
  gate instead of hand-updating prose; `README.md` contains the current counted baseline.

### Required technical corrections

1. **Deck and 16:10 presentation.** A 16:9 world cannot fill 1280×800 without distortion or
   crop. `Fill` must compute an aspect-preserving fitted rectangle: 1280×720 on Deck, with 40 px
   above and below available to an authored frame/HUD. Make `Expanded frame` the preferred Deck
   default once U3 exists; until then use fitted `Fill` with deliberate letterboxing. Add tests
   for presented width, height, offsets, aspect ratio, and no crop—not just integer render scale.
2. **Separate browser capabilities from desktop capabilities.** Exclusive fullscreen, monitor
   selection, frame-cap control, and vsync are not equivalent web settings. Add a T2.0 discovery
   spike and a `DisplayCapabilities` contract. Browser gets supported options only; Electron owns
   monitor/window placement and any host-only controls. Do not show settings that cannot work.
3. **Fix the preload contract contradiction.** T3.1 says preload exposes *only*
   `SteamworksBridge`, while T3.3 also needs file persistence. Define two narrow, versioned APIs:
   `SteamworksBridge` and `DesktopSaveBridge`. Validate every IPC payload and keep filesystem
   paths entirely in the main/preload side.
4. **Do not gate fun validation behind all refactoring and packaging.** After the next small
   behaviour extractions, build a playable vertical slice of G1 (tiers 0–2), G6 (hit-stop), and
   G7 (first-drop onboarding). Run structured playtests before committing to 12 tiers, a currency
   tree, 28 achievements, or their art. Refactors stay byte-equivalent; new systems need player
   evidence, not only green tests.
5. **Replace qualitative release gates with budgets.** Record cold-boot time, combat-route bytes,
   peak memory, p95 frame time, 1% low FPS, save size, and replay hash. Test 960×540, 1080p,
   1440p, 4K, ultrawide, and Deck 1280×800 with normal/reduced-motion and keyboard/gamepad paths.
6. **Add a release-operations workstream.** Cover offline/Steam-down boot, overlay attach,
   suspend/resume, abrupt exit during save, corrupt primary + backup recovery, cloud conflict,
   schema rollback, Proton smoke testing, crash-log location, third-party licences, and a clean
   uninstall/reinstall. Steam Cloud should not sync device-specific display settings.
7. **Add product scope and launch criteria.** Lock target price, demo boundary, Early Access vs
   full release, minimum supported OS/GPU, localization scope, target run length, retention goal,
   and the measurable playtest threshold that authorizes paid launch. The current “worth buying”
   gates are directionally right but not yet falsifiable.

Valve references checked for this review: [Steam Hardware compatibility checklist](https://partner.steamgames.com/doc/steamhardware/compat),
[Steam graphical asset dimensions](https://partner.steamgames.com/doc/store/assets), and
[graphical asset content rules](https://partner.steamgames.com/doc/store/assets/rules).

### Ordered next-task ledger

1. **Enemy-policy phase complete — T0.1:** all 31 `updateX` adapters now delegate policy without
   inline switch state machines. Nest Pod and Bastion Eater close the residual lifecycle/boss work,
   and `combat:audit:boundaries` now prevents inline state machines returning. Shared-state systems
   work has begun with pure ordinary-projectile volley geometry.
2. **Now — plan hygiene:** mark T0.4 complete; correct the Deck presentation contract and Steam
   asset dimensions; turn frozen counts into generated audit output.
3. **T2.0–T2.2 complete:** pure host
   capabilities and aspect-preserving presentation geometry cover 1080p, 1440p, 4K, ultrawide,
   laptop, fractional DPI, and Deck. The RenderTexture path renders the complete world and HUD,
   maps pointer input correctly, meets its browser pacing budget, and restores after forced WebGL
   context loss at 1080p, 1440p, 4K, and Deck. It is now the default combat path with
   `?rendertexture=0` retained as a rollback switch. T2.4's browser settings are complete and the
   max-calibration 4K pacing gate passes. T3.2 native host selection is implemented with an honest
   browser fallback, T3.3 atomic desktop saves are complete, and T3.4 cloud reconciliation plus
   T3.5 achievement synchronization are implemented pending live-Steam acceptance. **Next:** the
   remaining playable T4 gate (five observed tier runs) before expanding IDs in T3.6;
   T3.1 packaged-window acceptance remains open, and T2.3b remains gated on U3/Deck decisions.
4. **Next playable gate:** T4.4 hit-stop, prototype threat tiers 0–2, and first-drop onboarding are complete;
   conduct at least five observed runs and record completion, damage source, and confusion notes.
5. **Asset-unblocked work:** continue U1/U2 and M1/M2/S4 in parallel, but wire no slider or
   marketing claim until its runtime path is real.
6. **After the slice passes:** finish the simulation/scene splits, then Electron save/Steam
   integration, then expand progression, achievements, dailies, and hero roster in that order.

This plan **does not restate** the existing asset queue in
`asset-next-production-review-2026-07-26.md`. Items 61–67 there (UI chrome U1/U2, music M1,
ambience M2, UI audio S4, character C2/C3) are still correct, still the top of the art queue,
and are referenced by phase below rather than re-listed. New asset asks are in §7 and are
numbered from 68 so they can be appended to that queue directly.

---

## 1. What was reviewed, and the verified state

| Check | Result |
|---|---|
| `npm run typecheck` | Clean |
| `npm run test` | **1021 tests across 153 files pass** (3.8s) |
| Deployed build freshness | Current — no `dev/src/**/*.ts` is newer than `game-assets/game.js` |
| Boot, `?screen=game` | Loads with **zero console errors** |
| Source size | 38,309 lines of runtime TS + 15,118 lines of test TS |
| Runtime payload | 565 files, **106 MB**, in `game-assets/` |

Content, counted from the catalogues rather than quoted from a doc: 30 weapon entries
(28 draftable + unique + prototype), 47 items, 14 relics, 12 artifacts, 21 transformation
choices across 7 paths, a 24-entry world-object catalogue, and a 1,797-line encounter-event
catalogue.

### What is genuinely strong — do not disturb it

- **The portability boundary is real.** `combat/` is a pure deterministic simulation with no
  Phaser import; `rendering/`, `scenes/`, and `ui/` are the only Phaser consumers. This is the
  single biggest asset for a Steam move and most projects at this stage do not have it.
- **`platform/` is already the right shape.** `PlatformAdapter`, `SteamworksBridge`,
  `CloudSavePolicy`, and `PlatformProgress` are written, tested, and platform-neutral. They are
  waiting for a host, not a redesign.
- **Accessibility is above the bar for the genre**: colour-vision palettes, reduced motion,
  reduced flash, high-contrast outlines, HUD scale, radar size, aim assist, threat indicators,
  and full keyboard + gamepad remapping — all persisted and all reflected in the HUD copy.
- **The documentation discipline** (README index with live/stale banners, append-only log,
  code-enforced codex drift test) is why this review took hours rather than days.
- **Test coverage is strong enough to refactor behind.** 1021 tests is the licence to break up
  the two large files in §3.

---

## 2. Findings, ranked

### Blocking a Steam release

**F1 — There is no desktop host, and `platform/` is entirely unwired.**
Nothing anywhere in `dev/src/` calls `createSteamPlatformAdapter`, `synchronizeAchievementEvents`,
or any `CloudSavePolicy` function. They are tested in isolation and consumed by nothing. There
is no Electron/Tauri/NW.js shell, no `steam_appid.txt`, no depot config, and no Steamworks
dependency. The bridge interface is correct; the entire host side is missing.

**F2 — Integer-only display scaling breaks every display that is not exactly 1080p or 2160p.**
`planDisplayScale()` in `rendering/DisplayScaling.ts` picks the largest whole `N` where
`960N ≤ window width` and `540N ≤ window height`. That gives a perfect result on two resolutions
and a poor one everywhere else:

| Display | Chosen N | Rendered area | Result |
|---|---|---|---|
| 1920×1080 | 2 | 1920×1080 | Exact fill ✓ |
| 3840×2160 | 4 | 3840×2160 | Exact fill ✓ |
| 2560×1440 | 2 | 1920×1080 | 44% of the panel unused |
| 3440×1440 ultrawide | 2 | 1920×1080 | Island in a black field |
| 1366×768 laptop | 1 | 960×540 | Half the screen |
| **1280×800 Steam Deck** | **1** | **960×540** | **~47% of the panel. Not shippable on Deck.** |

The comment in that file is right that fractional *nearest-neighbour* scaling smears pixel art.
The conclusion drawn from it — integer or nothing — is what breaks 1440p, ultrawide, 16:10, and
the Deck. §5 proposes the fix.

**F3 — No fullscreen, no display selection, no frame cap.** Grep finds no `fullscreen` handling
anywhere. A Steam build that cannot go fullscreen from its own menu will be reviewed for it.

**F4 — Saves are `localStorage`-only.** `LocalSaveStore` takes a `StorageLike`, so the seam
exists, but a desktop build needs a file-backed store with atomic write + backup slot, and
`CloudSavePolicy` needs to be exercised against a real Steam Cloud round-trip rather than only
in unit tests.

**F5 — Six achievements.** `ACHIEVEMENT_IDS` has six entries, all of them "play the game a bit"
counters. A Steam page typically wants 20–40 with a mix of progression, mastery, and discovery.

### Blocking a *paid* Steam release (as opposed to a technically working one)

**F6 — No difficulty ladder.** There is no ascension/heat/threat-tier system. A roguelite with a
single difficulty is done in roughly three hours, and three hours is a refund window.

**F7 — Meta-progression exists but saturates in a few hours.** `perks/perkCatalog.ts` defines
seven perks that unlock from `GameProgress` (`isUnlocked(p)`), `LocalSaveStore.recordRunEnd`
diffs them across a run, and the debrief announces new unlocks. The system is real and correctly
built — it is just very small. All seven unlock at thresholds a competent player passes inside
about three hours (finish 1 run, win 1 run, finish 3 runs, reach wave 3, clear 5 and 15 nodes),
only one perk can be equipped, and after that nothing ever changes between runs again. There is
no persistent currency, no spendable tree, and the three silhouette heroes have no unlock rule.

**F8 — Five production-playable heroes; Assault, Tactician, and Scout released behind progression.** Marine and
Medic remain immediately deployable. Assault has its typed combat contract, Marauder AR,
Momentum passive, Breach & Clear ultimate, rack/growth/upgrade economy, dossier, HUD feedback,
full-height portrait, 12-frame directional body, modular Breach overlay, and roster tile. Three
validated 48 kHz/24-bit audio masters and six screened OGG/MP3 runtime derivatives exist, and
hero-aware damage/evade/death selection is wired, and contextual human mix acceptance passed.
Assault is playable after purchasing Assault Clearance through its 35-mark prerequisite path. Tactician's
mechanics, C3 presentation/audio, tuning, density, and listening gates are accepted; it is playable after
purchasing Tactician Clearance through its parallel 35-mark path. Scout's complete mechanics and presentation
package is released through its 45-mark dual-doctrine Scout Clearance path.

**F9 — No daily/weekly seeded run and no leaderboards.** Steam Leaderboards are free, the run
already threads a deterministic seed (`?mapseed=N`), and a daily is the cheapest retention
mechanic in the genre.

**F10 — Transformation behaviour pilots landed 9 Aug; two typed scars remain blocked.**
`TransformationRunModifiers` resolves 24 of 26 effect metrics. Drone Controller now creates a real
autonomous support entity, and Gravity Adept emits a non-damaging pull pulse on every eighth discrete
projectile attack, proving Step 5 of `transformation-path-production-plan.md` across two distinct combat
behaviours. Fire damage received and Shock buildup received remain intentionally unresolved until the
player has a typed incoming-damage/status model; do not silently delete those authored downsides.

**F11 — No music, no ambience, silent UI bus.** Already the top of the asset queue (items 63–65).
Restated here only because it is the loudest quality gap for a paid product: `MusicDirector` and
`AudioMixer` are written, tested, and consume nothing.

### Quality and maintainability

**F12 — Two files absorb every future feature.** `combat/CombatSimulation.ts` is **10,598 lines**
and `scenes/PrototypeScene.ts` is **5,052 lines**. Everything new collides in them.

**F13 — WebP covered 8 of 435 PNGs.** The pipeline exists (`image:encode:webp`,
`RuntimeImageFormat.ts`, an audited manifest) but was scoped to the eight large photographic
plates. **Corrected 7 Aug 2026 after measurement:** the 106 MB in `game-assets/` is *not* the
download — assets load per scene, and the combat route pulls **6.34 MB**. The real concentration
is that 50 of the manifest's 181 PNG imports exceed 300 KB and hold 33.4 MB between them. Those 50
are now lossless WebP (see §10.2); the remaining ~120 are small enough that the paired-import cost
outweighs the saving.

**F14 — No hit-stop.** Camera shake and flash exist and respect reduced-motion/reduced-flash.
Gamepad haptics exist. The missing piece is time dilation on crit and kill — the highest
value-per-line juice add available here.

**F15 — Display size setting is reload-only.** `main.ts` re-applies the scale plan on resize and
DPR change, but the Settings screen has no hook into it, so the label honestly reads
"applies on reload". It should apply live.

**F16 — `PrototypeScene` is still called `PrototypeScene`.** It is the shipping combat scene.
Cosmetic, but it is the name a Steam-era contributor reads first.

---

## 3. Phase 0 — hygiene (do first, days not weeks)

Small, low-risk, unblocks everything after it.

1. **Split `CombatSimulation.ts`** along the seams it already has internally — projectiles,
   status effects, spawning/density, objectives, pickups, rewards, telegraphs — into modules
   under `combat/systems/`, keeping the public snapshot/step contract byte-identical. 1021 tests
   make this safe. Do it before Phase 4 adds a difficulty ladder to it.
2. **Split `PrototypeScene.ts`** into the scene shell plus per-concern presenters
   (`ActorPresenter`, `EffectPresenter`, `WorldObjectPresenter`, `InputBridge`), then rename it
   `CombatScene` with a re-export shim for the review routes.
3. **Extend WebP** to every sprite atlas using lossless/near-lossless mode, and widen
   `audit-production-images.mjs` beyond its hard-coded count of 8. Expect 30–50% off the 106 MB.
4. ~~**Make display size apply live** — export the `applyDisplayScale` closure from boot and call
   it from the settings handler; drop "(applies on reload)" from the label.~~ **DONE 8 Aug 2026.**
5. **Fix the mojibake** in `asset-next-production-review-2026-07-26.md` items 12–23
   (`â€”` for em dash).

---

## 4. Phase 1 — presentation completeness

This is the existing asset queue and it is unchanged. Nothing in Phases 2–4 should ship publicly
before it lands, because it is what a first-time player sees.

- **U1 — panel/button chrome** (queue item 61). Highest priority full stop.
- **U2 — screen-specific surfaces** (62), built on U1.
- **M1 — six music layers** (63). Wire `MusicDirector` to the `music` bus and restore the slider.
- **M2 — nine ambience beds** (64). Wire the `ambience` bus and restore the slider.
- **S4 — UI audio** (65). Wire the `ui` bus and restore the slider.

Code work that pairs with these: route the three dormant `AudioMixer` buses, restore the three
Settings sliders that were removed on 31 July, and add a music/ambience ducking rule so combat
cues cut through.

---

## 5. Phase 2 — display: Full HD, 4K, ultrawide, and Steam Deck

The goal is: **crisp at 1080p and 4K, correct everywhere else, and no change to what the player
can see of the world.** That last clause matters — this is a wave-defence game where sightline is
information, so widening the camera on an ultrawide monitor is a balance change, not a feature.

### 5.1 The three-layer model

**Layer A — world render (unchanged rule).** Always render the 960×540 simulation into a render
target at a whole integer scale `N`. Pixel snapping, pivots, and the `uiSafeArea` contract stay
exactly as they are.

**Layer B — presentation mode (new setting).**

| Mode | How | Use |
|---|---|---|
| `Crisp` | Present the `N` target 1:1, letterbox the remainder. Today's behaviour. | Exact 2× (1080p) and 4× (2160p). Default when the display is an exact multiple. |
| `Fill` | Render at `N+1` (**supersample**), then GPU-downscale with linear filtering into the largest aspect-preserving fitted rectangle. Never distort or crop the world. | 1440p, 1600p, 1366×768, Steam Deck. A 2880×1620 → 2560×1440 downsample is far sharper than a 1.33× nearest upscale, and costs ~1.4× fill rate on a game that is nowhere near GPU-bound. |
| `Expanded frame` | Keep `Crisp` integer scaling, and fill the leftover width/height with an authored bezel that *relocates* HUD furniture (radar, status tray, weapon ring) into the side panels. World FOV unchanged. | 21:9 and 32:9 ultrawide, 16:10. Makes the unused space look deliberate instead of broken. |

Default selection: `Crisp` on exact multiples, `Fill` otherwise, `Expanded frame` offered whenever
the window aspect differs from 16:9 by more than ~5%.

**Layer C — HUD.** Already resolution-aware — `uiTextResolution()` rasterises glyphs at
`deviceScale`, and `uiSafeArea()` is fraction-based. Verify at 4× that the 2% inset still reads
as a sane physical margin on a 32" panel; if not, make the inset fraction a
`Crisp`/`Expanded`-aware constant rather than a per-screen branch.

### 5.2 Steam Deck specifically

1280×800 at `Crisp` gives `N=1` and a 960×540 postage stamp. `Fill` with `N=2` supersample
(1920×1080 → **1280×720**) preserves the authored 16:9 world and leaves 40 px above and below.
Use those bands deliberately; once U3 exists, **Deck should default to `Expanded frame`**.
Valve's current review also requires a supported Deck resolution, controller access to all
content, active-device controller glyphs, playable default performance, and legible text (9 px
absolute minimum at 1280×800, with 12 px recommended). Test these explicitly rather than assuming
that existing gamepad navigation is complete.

### 5.3 New settings to add

Fullscreen (borderless / exclusive / windowed) · Display selection on multi-monitor ·
Presentation mode (above) · Frame cap (60 / 120 / 144 / uncapped / vsync) · Brightness/gamma ·
Screen-shake intensity slider (a genre standard, and a real accessibility control that
`reducedMotionEnabled` currently only handles as on/off).

### 5.4 Asset consequence

Nothing in Layer A or B needs new art. **`Expanded frame` needs new art** — see §7, batch U3.
The 4K close-view repaint list is queue item 49 and stands; §7 batch R1 narrows it to a specific
target list.

---

## 6. Phase 3 — the Steam client

### 6.1 Host shell — recommendation: Electron + `steamworks.js`

Tauri produces a much smaller binary, but on Windows it uses WebView2 and on Linux it uses
WebKitGTK, and WebKitGTK's WebGL behaviour under Phaser is the kind of risk that surfaces at the
worst time. Electron ships one known Chromium across all three targets, which is the same engine
the browser build is already validated against, and `steamworks.js` is the best-maintained
binding. ~150 MB of overhead is irrelevant next to a 106 MB (pre-WebP) asset payload.

Work:
1. `desktop/` workspace: Electron main process, single BrowserWindow, `nodeIntegration: false`,
   `contextIsolation: true`, preload exposing exactly the `SteamworksBridge` interface — which is
   already defined, so the preload is a direct implementation of an existing contract.
2. `steam_appid.txt` for local testing; SteamPipe depot config; per-OS build scripts alongside the
   existing PowerShell tooling.
3. Wire it: construct `createSteamPlatformAdapter(bridge)` at boot when the bridge is present,
   fall back to a browser adapter otherwise, and call `synchronizeAchievementEvents` on the
   existing run-end path in `RunSummaryScene`.
4. File-backed `StorageLike` for `LocalSaveStore`: atomic write to temp + rename, keep one backup
   slot, and reconcile against Steam Cloud through `CloudSavePolicy` at boot and at run end.
5. Fullscreen, display selection, and frame cap plumbed through the Electron main process.
6. Steam Input: action-set manifest and glyph rendering, so the HUD shows the player's actual
   controller glyphs instead of generic labels.
7. Steam Leaderboards for the daily run (Phase 4).

### 6.2 Achievements: 6 → ~28

Suggested spread — final IDs are code-owned, this is the shape:
progression (first victory per region, clear each of the seven expedition acts, defeat each named
boss) · mastery (win at each difficulty tier, no-damage encounter, clear a run without buying from
a shop, full-heat clear) · discovery (fill the Monsterdex, commit each of the seven transformation
paths, find and use the Unique weapon) · collection (draft one of each weapon class, reach Tier III
merge) · endurance (survive wave 20 in the endless variant).

Each needs two icons — see §7, batch X1.

### 6.3 Storefront requirements

Store page assets are a Codex batch (§7, X2), plus: partner account, age-rating questionnaires,
a demo build (recommendation: **ship the existing browser version as the Steam demo** — same
codebase, `platform/` picks the adapter, and the itch/web build remains the top of the funnel),
and a trailer, which is the one deliverable Codex cannot generate.

---

## 7. Phase 4 — gameplay depth

Phases 1–3 make it shippable. This phase is what makes it worth buying.

**G1 — Difficulty ladder (highest value single item).** A threat/ascension tier applied per
expedition, unlocked by clearing the tier below. 8–12 tiers, each adding one legible modifier
rather than a stat multiplier: more elites, faster wave cadence, shops charge more, one fewer
rack slot, hazards persist between waves, mini-boss at every node. Save per-tier best results.
This is the fix for F6 and it multiplies the value of every existing system.

**G2 — Extend meta-progression past its ceiling.** The perk system is the right foundation and
should not be replaced. Two additions on top of it: (a) grow the perk pool past seven and add
thresholds that only the difficulty ladder can reach, so unlocks keep arriving; (b) add a
persistent currency banked from run performance, spent on a modest tree — weapons entering the
draft pool, an extra relic slot, starting-loadout options, and the hero unlocks. Deliberately
modest, because the run should stay the main event — but non-zero, since "nothing changed between
runs" arrives at hour three today.

**G3 — Daily and weekly seeded runs + Steam Leaderboards.** The seed threading already exists.
One daily seed, one weekly with a fixed modifier set, score = depth + kills + time.

**G4 — Transformation behaviours (plan-of-record step 5+).** The Cybernetic Ascension drone and
Gravity Adept pull-pulse pilots are complete. Extend this pattern to the remaining paths: each choice
needs one readable, testable combat behaviour instead of another percentage bag. Close the last two
typed elemental-received scars only after the player-side damage/status contract exists.

**G5 — Heroes 3–5.** Assault and Tactician's mechanics, C3 packages, audio, tuning, unlock economy, and
explicit acceptance are complete. The remaining hero gate
is complete: the retained masters have OGG/MP3 derivatives, automated metadata/peak screening,
hero-aware damage/evade/death selection, and accepted contextual playback. Marauder now owns its gameplay body, tracer,
muzzle/casing, impact presentation, and standalone HUD/choice/debrief tile. The unlock contract is now
defined and tested: Assault Clearance costs 18 Command Marks after Breach Protocol (35 total path cost), but
the released node is visible and purchasable. Assault remains locked until that node is owned. Begin
Scout is next. Keep the one-hero-at-a-time rule.

**G6 — Combat feel.** Hit-stop: 2–4 frames of `timeScale` dilation on crit and on kill, scaled by
the existing reduced-motion setting and the new shake-intensity slider. Weapon recoil kick on the
hero sprite. Kill-confirm pop on the crosshair. Crit-styled damage numbers (the pool already
exists in `FloatingDamageNumbers`).

**G7 — Onboarding.** A guided first drop. The game currently starts at full complexity, and the
review routes are the only place the systems are explained.

**G8 — Run history.** `lastRunSummary` holds one run. Keep the last 20 with a career stats screen —
cheap, and it feeds the leaderboard and achievement work.

---

## 8. Assets for Codex

Existing queue items 61–67 stand unchanged and come first. The following are **new**, numbered to
append to `asset-next-production-review-2026-07-26.md`.

All existing quality floors apply: retained untouched source, clean-alpha source, prompt
provenance, deterministic normalizer, runtime derivative, frame map, contact sheet; stable IDs,
frame order, pivots, footprints; **no text, no numerals, no key bindings, no radii, no cooldowns
authored into art** — with one explicit exception, batch X2, called out below.

### 68. UI Batch U3 — expanded-frame bezel (art)

For §5.1 `Expanded frame` mode. Needed once U1's language is accepted so this matches it.

- **Side panel plate**, vertically tileable, three widths (narrow 16:10, wide 21:9, extra-wide 32:9),
  authored dark enough to sit behind relocated HUD furniture without competing with the play area.
- **Top/bottom filler plate**, horizontally tileable, for 4:3 and 5:4 edge cases.
- **Inner edge trim**: the seam where bezel meets the play area — a bevel/greeble strip that reads
  as a physical frame around a screen, not a border drawn on the world.
- **Four corner pieces** matching the trim.
- One neutral variant plus one per major region family if the palette fight is visible in review;
  start neutral.

Source resolution must survive 4× — author at a size where the trim detail is still clean at
3840×2160. Stage under `art/production-tests/ui-batch-u3/`.

### 69. VFX Batch V1 — combat feel (art + animation)

Supports G6. Text-free, pooled, must respect reduced-motion and reduced-flash by degrading to a
static or shortened frame rather than disappearing.

- **Crit burst**, 6–8 frames, distinct from the existing generic impact and readable at 30+ enemy
  density.
- **Kill confirm**, 4 frames, small and centred on the crosshair rather than the corpse.
- **Weapon recoil overlay** per weapon class (kinetic, energy, beam, launcher, melee) — a 3-frame
  muzzle kick that composites over the existing held-weapon sprites without a new body sheet.
- **Shell casings / spent-cell** ejecta, one 4-frame sprite per weapon class, physical and dull.
- **Low-health screen vignette**, 3 intensity steps, an edge treatment not a full-screen tint.
- **Dodge/i-frame trail**, 5 frames, hero-agnostic.
- **Death variety by family**: one dissolve set for machines, one collapse set for corrupted
  humans, one dispersal set for alien — 6 frames each, non-gore, matching the existing Scattergun
  precedent.

Stage under `art/production-tests/vfx-batch-v1/`.

### 70. Audio Batch S5 — combat feedback layer (audio)

Same pipeline and floor as S1–S4: mono 48 kHz/24-bit WAV masters plus OGG and MP3 derivatives,
true peak below −1 dBFS, no head silence, bus stated. Bus: `sfx` unless noted.

Crit hit (3 variants) · kill confirm (3 variants) · hit-stop release whump · low-health warning
loop (must survive being heard for a minute; sits *under* combat, not over it) · wave-start
signal · wave-clear resolve · boss defeat (one-shot, may resolve into the `victory` music layer) ·
hero footsteps per surface family (metal grate, concrete, organic hive, ice, sand) 4 variants each ·
weapon dry-fire/empty click per class · reload complete per class · shopkeeper greeting and
farewell for each of the seven specialty keepers (non-verbal — a machine chime or an instrument
motif, no voice-over per the existing rule) · achievement/discovery toast (bus: `ui`).

Stage masters under `art/production-tests/audio-batch-s5/`, derivatives under
`dev/src/game/audio/runtime/batch-s5/`.

### 71. Progression Batch P3 — difficulty ladder and meta-progression UI (art)

Supports G1 and G2. Built on U1's language.

- **Threat-tier medallions**, 12 states. **No numerals** — escalate by rank marks (pips, notches,
  crown/spike accretion) so code owns the number. Locked, available, and cleared variants of each.
- **Meta-progression node tiles**, 128×128, four states: locked, available, purchased, maxed.
  One neutral shape plus five category motifs (weapon, defence, economy, hero, utility).
- **Unlock reveal** frame set, 8 frames, plays once when a node or hero unlocks.
- **Track/connector pieces** for the unlock tree: straight, corner, T, and a locked-vs-unlocked
  treatment that is **not colour-only** (colour-vision modes ship).
- **Daily/weekly run seal**: two plate variants plus a "completed today" overlay.

Stage under `art/production-tests/progression-batch-p3/`.

### 72. Achievement Batch X1 — icon set (art)

Two icons per achievement at 256×256 (Steam's requirement), locked and unlocked. At the ~28
achievements in §6.2 that is ~56 icons. Text-free — Steam renders the name and description itself.
Keep them iconographic and readable at 64×64 in the Steam overlay, and keep the locked variant
recognisably the same object rather than a generic padlock. Produce in the same order as the
achievement IDs land in code; do not produce ahead of the IDs. Stage under
`art/production-tests/achievement-batch-x1/`.

### 73. Store Batch X2 — Steam storefront art (art) — **text is required here**

The one exception to the no-text rule: Valve requires the game's logo and title in the capsules.

- **Header capsule / library header** 920×430 · **small capsule** 462×174 · **main capsule**
  1232×706 · **vertical store capsule** 748×896 · **library capsule** 600×900 · **library hero**
  3840×1240 (subject-left, safe-centre) · **library logo** transparent PNG (1280 px wide and/or
  720 px tall) · **page background** 1438×810 · **shortcut icon** 256×256 or 512×512 PNG/ICO.
- **Six to eight screenshots at 1920×1080**, captured from the real game at `Crisp` 2×, not mockups.
- **Community/achievement showcase icon** 184×184.

Design a proper wordmark first — everything above reuses it. Stage under
`art/production-tests/store-batch-x2/`.

### 74. Raster Batch R1 — the actual 4K close-view repaint list (art)

Queue item 49 says "selectively upgrade where close-view review exposes weakness" without naming
targets. These are the named targets, being the families still bound at 64px after the July
promotion passes:

1. Generic arena floor atlas · 2. Generic arena boundary atlas · 3. Generic arena obstacle atlas ·
4. Generic pickup atlas · 5. **Large telegraph atlas** and **danger-fill atlas** (explicitly
excluded from the 27 July refresh for want of matching sources — these are the most-seen art in
the game and should be first) · 6. HUD panel atlas, if U1/U2 do not replace it outright.

Repaint at 512×512 or larger per accepted frame from retained references. **Never upscale a
runtime PNG.** Preserve logical cell size, frame count, frame order, and pivots exactly — this is
a raster upgrade, not a semantic one. Stage under `art/production-tests/raster-batch-r1/`.

### 75. Hero Batch C3-assault — first new playable hero (art + animation)

**Gated on G5's mechanics contract existing in code.** When it does, the package is exactly the
C3 contract from queue item 67 (full-height 1024×1536 select portrait, four-direction gameplay
sheet on the established column order, equipment/helmet overlays, unlocked roster tile, and
hero-specific damage/evade/death audio). Repeat for Tactician and Scout, one at a time, each
gated the same way. Do not begin any of them early.

**Visual package complete 9 Aug 2026.** Retained chroma/alpha masters and deterministic normalization
now produce the 1024×1536 portrait + WebP derivative, 12-frame south/north/east/west body, aligned
Breach Module overlay, composite review sheet, and 128px roster tile. Explicit QA routes expose these
without changing the deployment gate. Damage/evade/death WAV masters also exist and pass source-format,
peak, and edge screening. Six OGG/MP3 runtime derivatives now pass codec, 48 kHz mono, duration, and
true-peak checks, and hero-aware selection is wired without disturbing shared fallbacks. Contextual human
listening acceptance passed on 9 Aug 2026; the C3 package is complete and released through Assault Clearance.

---

## 9. Sequencing

```
Phase 0  Hygiene ........................ split the two big files, WebP, live display size
Phase 1  Presentation ................... U1, U2, M1, M2, S4  + wire the three dormant buses
Phase 2  Display ......................... presentation modes, fullscreen, Deck, U3, R1
Phase 3  Steam client .................... Electron host, file saves, cloud, X1, X2
Phase 4  Depth ........................... G1 ladder → G2 meta → G6 feel → G3 dailies
                                           → G4 transformations → G7 onboarding → G5 heroes
```

Phases 0 and 1 are strictly ordered. Phase 2 can run in parallel with Phase 1 because they share
no files. **Phase 3 must not start before Phase 2's presentation modes exist**, or the Electron
window will be sized against the broken integer-only assumption and every fullscreen bug will be
diagnosed twice. Phase 4's G1 depends on Phase 0's `CombatSimulation` split.

### Gates

- Nothing ships publicly before Phase 1 completes.
- No Steam store page before X2 and six real 1920×1080 screenshots.
- No paid launch before G1 (difficulty ladder) and G2 (meta-progression) — those two are the
  difference between a three-hour game and a repeatable one.
- Every phase ends with the existing `npm run verify` green, plus a browser acceptance pass at
  960×540, 1920×1080, and 3840×2160.

---

## 10. Implementation task breakdown

Task-level detail for the code work. Each task states the files it touches, the contract it must
not break, and how it is accepted. Asset batches (§7) are excluded — they are Codex's queue and
already carry their own specs.

**Standing rule for every task below:** `npm run verify` green before it is called done, and no
change to the 960×540 simulation contract, stable asset IDs, frame order, or pivots.

### 10.1 Phase 0 — hygiene

#### T0.1 — Split `CombatSimulation.ts` (10,598 lines)

The file's internal structure already maps cleanly onto modules. Line ranges as of today:

| Block | Lines | Approx | Destination |
|---|---|---|---|
| Per-enemy `updateX` behaviours | 5278–8250 | ~2,970 | `combat/behaviours/<Enemy>.ts` |
| `populateXScenario` review scaffolding | 9560–9960 | ~400 | `combat/scenarios/ScenarioPopulation.ts` |
| Weapon firing (`fireWeapon`…`fireUltimate`) | 3563–4100 | ~540 | `combat/systems/WeaponFiring.ts` |
| Projectiles + Event Horizon fields | 4777–5100 | ~330 | `combat/systems/Projectiles.ts` |
| Scrap shop (build/draw/reroll/sell/purchase) | 3242–3560 | ~320 | `combat/systems/ScrapShop.ts` |
| Decision builders (upgrade, level-stat, chest, depot, placement) | 2984–3240 | ~260 | `combat/systems/Decisions.ts` |
| Snapshot assembly | 2475–2700 | ~225 | `combat/systems/SnapshotAssembly.ts` |

**Use the pattern the repo already established** — do not invent a new one.
`combat/ScrapSkittererBehavior.ts` is the template: a readonly state interface, a
`stepXBehavior(state, input): XStepResult` pure function, and the class applying the result. Nine
such modules already exist (`AbominationBehavior`, `AbominationPrimeBehavior`,
`AssemblyPrimeBehavior`, `StormRegentBehavior`, `SynapseHeraldBehavior`, `ScrapSkittererBehavior`,
`ArcWardenBeam`, `StormSavantLightning`, `SpinewheelPhysics`). The ~30 enemies still inlined in
`updateEnemies` should follow them out, one enemy per commit.

Sequencing, safest first — each is independently shippable and independently revertable:

1. ~~`populateXScenario` first. It is pure setup, touched only by review routes, and it proves the
   extraction pattern with almost no blast radius.~~ **DONE 7 Aug 2026** — moved to
   `combat/scenarios/ScenarioPopulation.ts`; the 30-branch `else if` dispatch chain collapsed to a
   single catalogue lookup; `ARC_WARDEN_LAB_CAP`, `SCRAP_SKITTERER_PACK_CAP`, and
   `INFECTED_SURVIVOR_PACK_CAP` moved to the modules that own them and are re-exported from
   `CombatSimulation` so existing importers are unaffected. Proven equivalent: the initial
   snapshot of all 30 scenarios hashes **byte-identically** before and after.
2. Enemy behaviours next, **one enemy per commit**, each with its existing test file kept green
   and unmodified. There are already `*.test.ts` files per enemy — if a behaviour extraction
   requires editing its test, the extraction changed behaviour and must be reworked.
   **Aurum Hoarder extraction complete 9 Aug 2026:** forage/flee timing, movement intent, post-movement
   exit selection, and escape resolution now live in `AurumHoarderBehavior.ts`. Existing Aurum integration,
   reference-run, and replay fixtures pass unchanged. **Corrupted Marine extraction complete 9 Aug 2026:** its
   positioning, locked tell, projectile-capacity hold, throw, and recovery state machine now lives in
   `CorruptedMarineBehavior.ts`; movement still resolves before its range lock. Existing lifecycle, reference-run,
   and replay tests pass unchanged. **Foundry child extraction complete 9 Aug 2026:** finite lifetime, owner-loss
   shutdown, drone pursuit, and turret tracking/warning/fire/recovery decisions now live in
   `FoundryChildBehavior.ts`; collision, line of sight, damage, and events remain simulation-owned. Fabricator,
   Assembly Prime, reference-run, and replay tests pass unchanged. **Nest Weaver extraction complete 9 Aug 2026:**
   positioning, range control, placement windup, recovery, and retry timing now live in
   `NestWeaverBehavior.ts`; live-cap/threat reservation, target placement, pod spawning, and events remain
   simulation-owned. Its existing combat/lifecycle, reference-run, and replay tests pass unchanged. **Cyborg
   Reclaimer extraction complete 9 Aug 2026:** `CyborgReclaimerBehavior.ts` now composes the existing finite repair
   lifecycle with deterministic acquisition, link-facing, nearest-damaged-machine pursuit, and player fallback.
   Shared-link ownership, healing, collision, and events remain simulation-owned. Existing repair/live-combat,
   reference-run, and replay tests pass unchanged. **Arc Warden extraction complete 9 Aug 2026:**
   `ArcWardenBehavior.ts` now composes the existing beam lifecycle with approach, retreat, deterministic strafe,
   facing, and warning-start decisions. Beam clipping, collision, scaled damage, and events remain
   simulation-owned. Existing beam/live-combat, reference-run, and replay tests pass unchanged. **Storm Savant
   extraction complete 9 Aug 2026:** `StormSavantBehavior.ts` now owns cooldown, idle range control, chain-phase
   stepping, interruption/discharge signals, overload recovery, retry timing, and post-movement chain-start intent.
   Node placement/spawning, cover clipping, hit geometry, damage, and events remain simulation-owned. Existing
   lightning/live-combat, reference-run, and replay tests pass unchanged. **Foundry Fabricator extraction complete
   9 Aug 2026:** `FoundryFabricatorBehavior.ts` now composes the existing finite fabrication lifecycle with
   positioning-tick eligibility, drone/turret alternation, rejected-capacity pursuit, and bounded pad targeting.
   Shared capacity/threat accounting, pad/child spawning, collision, and events remain simulation-owned. Existing
   lifecycle/live-combat, reference-run, and replay tests pass unchanged. **Brood Warden extraction complete
   9 Aug 2026:** `BroodWardenBehavior.ts` owns its attack cycle, one-time enrage rush, movement/facing, and
   tier-scaled action payloads; spawning, projectiles, collision, damage, and events remain simulation-owned.
   **Rift Stalker extraction complete 9 Aug 2026:** `RiftStalkerBehavior.ts` owns cloak/mark/warp/pounce/slash
   timing, frenzy chaining, and movement intent while landing resolution, spikes, damage, and events remain in
   the simulation. **Siege Crusher extraction complete 9 Aug 2026:** `SiegeCrusherBehavior.ts` owns attack
   selection, enrage timing, movement intent, and action payloads. Its pure charge-destination probe lets the
   simulation preserve pre-movement obstacle collision, terrain damage, and shockwaves exactly. Existing
   mini-boss, mobility, reference-run, and replay tests pass unchanged. **Nest Pod extraction complete
   9 Aug 2026:** `NestPodBehavior.ts` composes the existing finite lifecycle into deterministic hatch offsets and
   reservation-release payloads; accounting, spawning, clamps, and events remain simulation-owned. **Bastion Eater
   extraction complete 9 Aug 2026:** `BastionEaterBehavior.ts` owns health phases, every attack rotation and timer,
   movement intent, post-movement direction/target locks, and charge probing. Terrain mutation, brood capacity,
   damage, collision, and events remain simulation-owned. The boundary audit confirms all 31 enemy adapters now
   delegate policy and contain no inline switch state machines. That boss slice left the monolith at 10,112 lines.
3. **Weapons in progress:** pure modules now own projectile geometry/payloads, melee/beam and orbit targeting,
   auto-aim/dispatch, deployable placement/runtime/targeting/shot payloads, orbit-blade motion, melee terrain-impact
   planning, and shared melee/beam/orbit hit-damage composition. `CombatSimulation` remains the adapter for
   cooldown/entity mutation, evolving death-state checks, RNG draw order, damage, allocation, terrain mutation,
   and events. Projectile homing, kinematic movement/lifetime/bounds resolution, and ordered obstacle/armored-chest
   collision planning are now pure modules as well. Enemy-contact eligibility, gravity-pulse/gravity-well/Bolt
   special-impact routing, post-impact pierce continuation, direct-hit damage composition, knockback displacement,
   one-hop-at-a-time chain targeting/falloff, Carapace armour response, explosion routing, and live splash planning
   are also extracted. Gravity-field payload construction, pull movement, lifetime/detonation classification, and
   live implosion hits are now pure modules too. The monolith is now 10,108 lines; allocation, designation, arena
   collision, events, and damage mutation remain simulation-owned. Scrap-shop depth/profile pricing, rotating
   weapon stock, and weighted offer-index selection are now extracted while catalogue/profile lookup and RNG draws
   remain in the adapter. Campaign-repair reservation, affordability refresh/order, and locked-reroll feasibility/
   assembly are now pure as well. Offers, management, and sell decision presentation are now extracted while rack
   lookup and live inventory state remain adapter-owned. Action parsing/routing, purchase spend/effect planning,
   and weapon-sale eligibility/location/value planning are extracted too. The monolith is now 10,057 lines; typed
   adapter wiring added seven net lines while removing these policy seams. Paid-reroll spend validation, banned-
   offer replacement-rack assembly, and reset/open visit lifecycle state are now extracted too. The monolith is now
   10,086 lines; explicit typed commit wiring added 29 net lines while centralizing the four visit-state assignments.
   Replacement RNG draws and runtime state/event mutation remain adapter-owned. Continue with fixed repair/utility
   candidate construction, upgrade/weapon candidate construction, and item candidate construction.

**Acceptance:** `combat/CombatSimulation.ts` under 3,000 lines; its public exports remain
exported from the same path (re-export from the new modules — every consumer imports from
`./CombatSimulation`, so the public path must not move); the complete generated test inventory passes;
`ReferenceRun.ts` and `ReplayFixture.ts` produce byte-identical output before and after.

That last check is the real safety net — a deterministic replay fixture already exists, so this
refactor can be proven equivalent rather than argued to be.

#### T0.2 — Split and rename `PrototypeScene.ts` (5,052 lines)

Same clean seams:

| Block | Lines | Approx | Destination |
|---|---|---|---|
| `playCombatEvents` event switch | 1109–1720 | ~610 | `scenes/combat/CombatEventPresenter.ts` |
| `syncEnemies` / `createEnemyView` / `styleEnemyView` / `updateEnemySprite` | 2040–3080 | ~1,040 | `scenes/combat/EnemyPresenter.ts` |
| The 12 `sync*Telegraphs` methods | 3249–3720 | ~470 | `scenes/combat/TelegraphPresenter.ts` |
| `syncProjectiles` / `syncEnemyProjectiles` / `syncGroundHazards` | 3081–3250 | ~170 | `scenes/combat/ProjectilePresenter.ts` |
| `syncWeapons` / `pulseWeapon` / `animate*` | 1941–2040 | ~100 | `scenes/combat/WeaponPresenter.ts` |
| Run outcome, bestiary, summary | 855–1070 | ~215 | `scenes/combat/RunOutcomeRecorder.ts` |

Presenters take the Phaser scene plus the relevant snapshot slice; they own their own view pools
and expose `sync(snapshot)` and `destroy()`.

Then rename the class `CombatScene`, file `scenes/CombatScene.ts`, with
`scenes/PrototypeScene.ts` re-exporting it so the ~76 review routes in the README keep working
unchanged.

**Acceptance:** scene file under 1,200 lines; `review-harness.html` runs all review routes with
zero runtime errors, zero console errors, and render activity detected on each — the harness
already measures exactly this, so it is a mechanical pass/fail rather than a judgement call.

#### T0.3 — WebP across sprite atlases — **DONE 7 Aug 2026, scope corrected**

The premise below was wrong and measurement fixed it before the work was done. "30–50% off the
106 MB" treated the directory total as the payload; per-scene loading means the combat route
downloads 6.34 MB. Scoped instead to the 50 manifest imports above 300 KB (33.4 MB), all encoded
**lossless** with a decode-and-compare round-trip check. Measured result: 48.63 MiB of masters →
24.60 MiB of derivatives (50.6%); combat route 6.34 → 5.53 MB (−12.8%); heavy mini-boss sheets
25–28% smaller each. `game-assets/` grew 106 → 129 MB because both formats ship — **open question
in §10.7 on whether the PNG fallback still earns its place.**

<details><summary>Original task text</summary>

`RuntimeImageFormat.runtimeImageUrl()` already does capability detection and honours
`?imageformat=png|webp`, so no runtime change is needed — this is pipeline scope only.

- Extend `scripts/encode-production-images.py` past its hard-coded 8-entry `SOURCES` tuple to
  walk the manifest. Use **lossless** WebP for sprite atlases (alpha-critical, pixel-exact) and
  keep the existing `QUALITY = 92` lossy path for the photographic plates only.
- Remove the `manifest.assets.length !== 8` assertion in `scripts/audit-production-images.mjs`
  and replace it with a manifest-driven count plus the existing per-asset SHA and ratio checks.
- Sprite atlases must be **byte-exact after decode** — add a decode-and-compare step to the audit
  for the lossless set. A lossy sprite atlas with chroma-shifted alpha edges is exactly the kind
  of regression the art bible's chroma-fringe rule exists to catch.

**Acceptance:** `image:audit:webp` passes over the full set; runtime payload measurably down from
106 MB (expect 30–50%); `?imageformat=png` still renders identically.

</details>

#### T0.7 — Open decision: keep or drop the PNG fallback

Shipping both formats grew `game-assets/` from 106 MB to 129 MB. `RuntimeImageFormat.ts` exists to
serve PNG to browsers without WebP support — a population that, for a game already requiring WebGL
and the Gamepad API, is effectively empty (WebP is universal since Safari 14, 2020). Dropping the
fallback for the 58 converted assets would take the directory to roughly 82 MB *and* keep the
download saving. It reverses a deliberate design decision, so it is the creator's call, not a
refactor to make quietly.

#### T0.4 — Live display size — **DONE 8 Aug 2026**

`DisplayScaling.ts` now exposes `registerDisplayScaleReapply()` / `reapplyDisplayScale()`;
`main.ts` registers the live apply closure and `ShellScene` invokes it when
`displaySizePercent` changes. The stale reload caveat was removed from `ScreenFlow.ts`.

**Acceptance met:** focused tests cover the hook and the setting still persists.

#### T0.5 — Doc fix

Repair the `â€”` mojibake in `asset-next-production-review-2026-07-26.md` items 12–23.

### 10.2 Phase 1 — wire the three dormant audio buses

`AudioMixer` is complete: `setBusVolume`, `effectiveGain`, and priority-based voice admission all
exist and are tested. `MusicDirector.stepMusicDirector` is complete and hysteretic. Neither is
constructed by anything.

- **T1.1** — Instantiate `AudioMixer` at boot; bind `masterVolume`/`sfxVolume`/`uiVolume`/
  `musicVolume`/`ambienceVolume` from `GameSettings` to `setMasterVolume`/`setBusVolume`. All five
  fields already exist and persist in the save.
- **T1.2** — Route `WebAudioSynth` playback through `admitVoice` on the `sfx` bus so voice
  stealing actually applies at 30+ enemy density.
- **T1.3** — Music player consuming `stepMusicDirector`: two crossfading loop sources for
  `calm`/`intensity` (same tempo, same key, shared bar grid — the crossfade does not wait for a
  phrase boundary), immediate switch for `boss`, one-shots for `victory`/`defeat`. Feed it the
  density snapshot the director already expects.
- **T1.4** — Ambience player keyed to `WorldThemeFamily`, on the `ambience` bus.
- **T1.5** — Ducking: attenuate `music` and `ambience` under `sfx` activity so combat cues cut
  through, per the audio quality floor.
- **T1.6** — Restore the three sliders in `shell/ScreenFlow.ts`. The comment there
  ("an inert slider is a lie") is the acceptance criterion — **do not restore a slider before its
  bus is routed and its assets exist.**

### 10.3 Phase 2 — display

- **T2.0 — DONE 8 Aug 2026.** `DisplayCapabilities.ts` now separates browser and desktop
  capabilities. Browser never advertises monitor selection, exclusive fullscreen, direct vsync,
  or unproven frame caps; the desktop contract exposes only the proven minimum until its host spike.
- **T2.1 — PURE PLAN DONE 8 Aug 2026; runtime wiring waits for T2.2.**
  `DisplayPresentation.ts` returns a presentation mode alongside render scale, fitted world rect,
  frame insets, and sampling rule. It preserves 16:9 without crop/stretch and explicitly gates
  authored expanded frames on asset availability. This supersedes the original wording below:
  Extend `planDisplayScale()` to return a presentation mode alongside `zoom`/
  `deviceScale`. Keep the existing integer search; add the `Fill` supersample path (choose
  `N+1`, present with linear filtering) and the `Expanded frame` path (integer `N`, report the
  leftover rect). Pure function, fully unit-testable — add cases for 1920×1080, 3840×2160,
  2560×1440, 3440×1440, 1366×768, and **1280×800 (Deck)**; the Deck case is the regression test
  that must never silently return `N=1` again.
- **T2.2 — DONE 8 Aug 2026.** The combat
  world/HUD depth boundary, physical backing-store hand-off, RenderTexture adapter, dedicated HUD
  camera, runtime audit, and `?rendertexture=1` review hook now exist. The earlier quadrant result
  was a camera-origin/follow mismatch, not a resized DynamicTexture defect: Phaser was applying a
  centred physical viewport to logical follow coordinates. The corrected design retains the main
  camera as a 960×540 logical tracking camera, renders Layer A through an origin-zero physical
  RenderTexture camera, presents that target once, and renders/hit-tests Layer B through an
  origin-zero physical HUD camera. Browser QA now passes complete-world, complete-HUD, pointer
  coordinate, and pause-hitbox checks at 1920×1080, 2560×1440, 3840×2160, and Deck 1280×800
  (1280×720 with 40 px bands). Camera shake and flash are routed to the presentation camera.
  `FramePacingTelemetry.ts` supplies a bounded 600-frame audit with average, p95, p99, and 1% low
  while excluding paused/hidden frames. The browser acceptance budget is p95 ≤17.5 ms and 1% low
  ≥50 FPS for the 60 FPS target. Twelve-weapon results were p95 16.68 ms / 54.53 FPS at 1440p,
  16.69 ms / 59.45 FPS at 4K, and 16.69 ms / 59.56 FPS on Deck; the normal reference run was
  16.69 ms / 54.53 FPS. A dev-only `?contextloss=1` probe forced one loss/restoration at 1080p,
  1440p, 4K, and Deck, with the presentation returning each time. T2.2 is now the default combat
  path; `?rendertexture=0` remains as a temporary rollback switch while T2.3/T2.4 land.
- **T2.3 — IN PROGRESS.** HUD reflow for `Expanded frame`: radar, status tray, and weapon ring
  relocate into authored frame panels without changing world FOV. **Correction from runtime
  review:** this is not only a `uiSafeArea()` call-site change. T2.2 deliberately sizes the canvas
  to `worldRect`, which means the reported frame insets currently live outside Phaser's render
  surface. T2.3 therefore has two explicit parts: **T2.3a** (pure contract, done) reports the
  full-window physical presentation surface and the world's physical destination rectangle;
  it also supplies a furniture-fit planner for all supported HUD/radar scales. **T2.3b** must make
  the expanded-frame compositor use that full surface, draw the U3 bezel, and relocate furniture
  into validated panel slots. The planner proves ultrawide can fit all groups with vertical side
  trays, but Deck's current 40 px bands cannot fit the default radar/status/weapon furniture.
  Keep `expandedFrameAvailable: false` until U3 either provides deeper bands or an approved compact
  Deck layout, and both Deck/ultrawide tests pass without clipping.
- **T2.4 — IN PROGRESS.** New settings: presentation mode, fullscreen, display selection, frame cap,
  brightness/gamma, screen-shake intensity. **T2.4a is complete:** `GameSettings` and
  `SAVE_SCHEMA_VERSION` now advance from the actual current schema v12 to v13 (the older v10
  instruction was stale), with bounded normalization and migration tests. Cloud reconciliation
  preserves display size/mode, fullscreen, monitor id, frame cap, brightness, and gamma from the
  current device instead of importing another machine's values. Auto/Crisp/Fill apply at the next
  combat presentation bootstrap, and shake intensity has a live consumer; Expanded frame remains hidden while T2.3b/U3 is
  unavailable, and desktop-only display/frame-cap controls remain hidden rather than inert.
  **T2.4b browser fullscreen is complete:** the Fullscreen API row exists only when the host reports
  both Windowed and Borderless, the same filtered row list owns rendering and keyboard/controller
  navigation, Escape/fullscreen-change synchronizes the saved mode, and denied requests roll back
  with visible feedback. **T2.4b calibration is complete:** Brightness and Gamma apply one sRGB
  gamma transfer to the final composed canvas, including HUD/menu colors; gamma is nonlinear rather
  than a contrast approximation, changes preview immediately, and identity removes the filter layer.
  The browser-side max-calibration 4K stress gate passes at p95 16.68 ms and 54.53 FPS 1% low; repeat
  it on the packaged desktop host before release. **T2.4b remains:** Electron host plumbing and
  capability-filtered rows for the desktop-only choices. Before cloud upload
  wiring in T3.4, strip device-specific fields from the serialized cloud preferences as well as
  preserving them during conflict resolution.
- **T2.5 — COMPLETE.** `PrototypeScene.shakeCamera()` now applies the saved bounded multiplier;
  the legacy enable toggle and `reducedMotionEnabled` both resolve to zero through a pure tested rule.

### 10.4 Phase 3 — Steam client

- **T3.1 — IN PROGRESS.** `desktop/` Electron workspace now exists with a secure custom protocol,
  single sandboxed `BrowserWindow`, `nodeIntegration: false`,
  `contextIsolation: true`. The preload implements exactly the existing `SteamworksBridge`
  interface (`getAchievement`, `setAchievement`, `storeStats`, `readCloudFile`, `writeCloudFile`)
  and nothing else — that narrow surface is the whole security model, so it must not grow. IPC
  validates the six current achievement IDs, confines cloud access to the versioned slot, and caps
  payload size. Contract-parity and host security tests are in place, and T3.2 now supplies the real
  native host. Reproducible electron-builder directory packaging now stages only published web/codex/
  runtime/Steam Input files, keeps native Steamworks binaries outside ASAR, and reads packaged content
  from `resources/game`. The unsigned Windows x64 directory build completes and its required file set
  is verified. Remaining before DONE: run the checked-in packaged-renderer smoke harness on a normal
  Windows desktop; this managed session exits Electron with `0xC0000005`, including with Steam and GPU
  disabled, so it cannot supply trustworthy custom-protocol acceptance. The release icon is complete:
  a retained square Marine-helmet source plus tested seven-resolution ICO, 1024 px ICNS, and 512 px PNG
  derivatives are wired per platform, and Windows packaging embeds the mark without the default Electron
  icon warning. A signing identity is still required before distribution.
- **T3.2 — IMPLEMENTED; LIVE-STEAM ACCEPTANCE REMAINS.** `steamworks.js` 0.4.0 initializes in the
  main process. Preload exposes its five-method bridge only after initialization succeeds; otherwise
  the renderer selects a browser-safe adapter at boot. Native false returns become retryable errors,
  missing cloud files become `null`, and an invalid App ID cannot reach native code. A no-Steam-host
  run proves clean fallback. Final acceptance needs the real Last Bastion App ID and a running Steam
  client. **This remains the only place the two builds diverge.**
- **T3.3 — DONE 8 Aug 2026.** File-backed `StorageLike` now uses a separate synchronous
  `DesktopSaveBridge`; the renderer receives only `getItem`/`setItem`, never paths or general file
  access. Main-process writes validate exactly two fixed keys (game state and cloud-sync metadata),
  JSON shape, and the 8 MiB ceiling; write to a
  temporary file; flush when supported; rotate one known-good backup; and atomically rename the
  primary. Corrupt primary files fall back to the backup and are never rotated over it. Every
  production `LocalSaveStore` construction site selects this bridge in Electron and retains browser
  `localStorage` otherwise. This preserves the synchronous save contract without scene-wide async churn.
- **T3.4 — IMPLEMENTED; LIVE-STEAM ACCEPTANCE REMAINS.** Boot now awaits deterministic
  reconciliation before Phaser scenes read the save, and all three recordable run-end paths request
  another sync before navigation. A stable local device ID, revision, timestamp, and portable-content
  fingerprint live in a second atomically backed fixed slot. Uploads strip monitor, presentation,
  fullscreen, frame-cap, brightness, and gamma choices; conflict resolution retains those settings
  locally while merging monotonic career/bestiary progress by maxima. Identical portable content does
  not churn revisions, concurrent run-end requests coalesce, and Steam read/write failures preserve
  local progress for retry. Final acceptance requires a real Last Bastion App ID and two Steam clients
  to exercise upload, download, offline recovery, and a divergent active-run conflict end to end.
- **T3.5 — IMPLEMENTED; LIVE-STEAM ACCEPTANCE REMAINS.** Boot derives all currently earned
  milestones from the reconciled local save, unions them with an atomically persisted pending queue,
  and retries the queue through the Steam adapter. All three recordable run-end paths capture before/
  after progress and queue newly crossed milestones before platform navigation. Cloud revision fields
  and achievement queue entries update independently in the shared metadata slot, so concurrent syncs
  cannot erase one another. A failed `StoreStats` retains the full requested batch; retries still call
  `StoreStats` when Steam's in-process state already reads true, closing the set-but-not-durable edge.
  Final acceptance needs the real App ID, matching Steamworks achievement definitions, and a Steam-down/
  restart test. Do not start T3.6's ~28 IDs until the playable T4 slice has been observed as required above.
- **T3.6** — Expand `ACHIEVEMENT_IDS` from 6 to ~28 (§6.2). Each new ID needs an `isAchievementEarned`
  arm; the `switch` is exhaustive over the union, so TypeScript will name every one that is
  missing. Land the IDs **before** commissioning batch X1 icons.
- **T3.7 — FOUNDATION COMPLETE 8 Aug 2026; live layouts pending App ID.** The bundled
  `steam-input/steam_input_manifest.vdf` defines localized Gameplay and Menu action sets and is
  audited against the code-owned action names. The desktop host initializes Steam Input separately
  from core Steamworks, exposes only the connected controller type through IPC, and resolves Xbox/
  Deck, PlayStation, or Nintendo button-position labels before Phaser creates shell/HUD text. Steam
  Input or IPC failure falls back to generic labels without delaying boot; browser gamepad behavior is
  unchanged. Official per-controller configuration VDFs, action polling, hot-plug label refresh, and
  live layout acceptance remain open until the real App ID can export trustworthy layouts. Follow the
  checked-in `steam-input/README.md`; do not generate configurations against Spacewar/App 480.
- **T3.8 — IMPLEMENTED 8 Aug 2026; PACKAGED MULTI-MONITOR ACCEPTANCE REMAINS.** A confined
  preload bridge now reports Electron display labels/geometry and applies windowed or borderless
  transitions in the main process. Monitor moves preserve and clamp the normal window size, centre it
  inside the target work area, leave fullscreen before changing bounds, and then restore the requested
  mode. T2.4 builds its rows from real host capabilities, persists the selected monitor and fullscreen
  mode, and falls back to the browser Fullscreen API when no desktop bridge exists. Frame caps of 60,
  120, 144, or display rate are applied at the next scene boot through Phaser's on-screen limiter;
  Electron's similarly named WebContents API is intentionally not used because it is documented for
  offscreen rendering. Pure transition/runtime tests and host-renderer bridge parity are complete.
  Final acceptance still requires packaged Windows testing across at least two monitors with different
  scale factors, unplug/replug recovery, and Steam Deck desktop/gaming-mode checks.
- **T3.9 — FOUNDATION COMPLETE 8 Aug 2026; PARTNER PREVIEW/UPLOAD REMAIN.** electron-builder scripts
  create unpacked Windows, Linux, or macOS directories on their native platforms, with caches and
  outputs ignored. Tokenized AppBuild/DepotBuild templates require explicit positive App/Depot IDs;
  the generator stages the chosen package, supports Valve's manifest-only `Preview` mode, recursively
  maps the depot, and excludes PDBs. The separate SteamCMD upload script never accepts a password,
  never embeds credentials, and never promotes a branch. A disposable-ID local generation pass proved
  705 packaged files / 506,737,701 bytes and emitted valid UTF-8 VDFs; no upload occurred. Final partner
  acceptance requires the real IDs, SteamCMD preview inspection in App Admin, live Steam client launch,
  upload to a private branch, and an intentional branch promotion.

### 10.5 Phase 4 — depth

- **T4.1 — PROTOTYPE COMPLETE 8 Aug 2026; full ladder held for playtest.** A `ThreatTier` value (0–11) threaded through
  `expedition/CampaignTuning.ts` and `combat/WaveScaling.ts`. Each tier adds **one legible
  modifier**, not a stat multiplier — more elites, faster cadence, higher shop prices, one fewer
  rack slot, hazards persisting between waves. Store per-tier best results in `GameProgress`.
  **Prototype acceptance:** tiers 0–2 are now threaded through the schema-v14 expedition save,
  run resume, event ambushes, encounter plans, and combat director. Tier 1 adds one deterministic
  elite patrol to ordinary combat nodes; Tier 2 also compresses the authored spawn-pulse train by
  20% without changing enemy budget or wave duration. The shell blocks locked tiers, requires a
  victory on the prior tier, remembers selection, and shows per-tier best nodes. Cloud conflict
  resolution merges per-tier results monotonically. Map and combat surfaces identify the active tier.
  Do not define tiers 3–11 until five observed runs validate completion rate, damage sources, and
  modifier comprehension. **Depends on T0.1**, because the full ladder eventually lands in the file
  that is currently 10,598 lines.
- **T4.2 — COMPLETE 9 Aug 2026.** `perkCatalog.ts`
  now extends from seven to ten entries without replacing `unlockedPerkIds(progress)`. Vanguard,
  Logistician, and Recon Specialist require victories on exact Threat Tiers 0, 1, and 2 and feed the
  existing starting-level, stash-capacity, and map-reveal consumers. Run-end diffing announces each
  unlock on the earning debrief. Character select uses a tested two-row ten-slot layout; the three
  advanced perks show honest live T0/T1/T2 badges rather than sampling the seven-frame atlas out of
  bounds or displaying contradictory fallback art. Commission their final P3 tiles with the later
  meta-progression art batch. The second half adds deterministic Command Marks, banked on the debrief,
  and a visible three-node Armory tree. Its 5/8/12-mark permanent purchases unlock real Scattergun,
  Arc Carbine, and Patrol Blade starting kits; purchased kits can be equipped and affect the first
  combat of a fresh Quick Drop or expedition without overriding explicit review routes or resumed builds.
  Schema v15 introduced monotonic lifetime earnings plus an immutable purchased-node set (carried
  forward by the current v16 schema), derives the
  spendable balance from those two values, and unions purchases/max-merges earnings during Steam Cloud
  reconciliation. Purchases deliberately have no refund/reset path, avoiding non-monotonic cloud state.
  Final P3 perk/tree art remains a presentation batch, not a behavior dependency.
- **T4.3 — Daily/weekly runs + leaderboards.** Derive the seed from the UTC date, reuse the
  existing `?mapseed=N` threading, submit to Steam Leaderboards on run end. One attempt per seed,
  enforced in the save.
- **T4.4 — COMPLETE 8 Aug 2026.** Crit and defeat deltas request a two- or four-60-Hz-frame
  presentation hold. The scene freezes Phaser's timer/tween clocks while retaining the last rendered
  snapshot; simulation receives no scaled delta and simply resumes its existing fixed 1/60 steps.
  Busy frames take the strongest beat instead of stacking pauses. Reduced motion, the legacy shake
  toggle, and the bounded T2.5 intensity multiplier all suppress/scale it. Pause and scene teardown
  explicitly restore presentation clocks. Pure timing tests, the unchanged replay suite, full verify,
  and a live authored Survivor route with repeated defeats pass without warnings. Crit detection uses
  the existing cumulative run metric because `enemy-hit` does not currently carry a crit bit; adding
  that bit remains part of G6's later crit-number styling, not a prerequisite for deterministic hit-stop.
- **T4.5 — DRONE + GRAVITY BEHAVIOURS COMPLETE 9 Aug 2026; TWO TYPED SCARS BLOCKED.**
  `TransformationRunModifiers` now resolves 24 of 26 effect metrics. Committing Cybernetic Ascension's
  Drone Controller spawns one persistent auxiliary drone that orbits the player, independently targets
  enemies within eight metres, and fires the authored rank-scaled 1/1.5/2-damage Shock shot every 3.5
  seconds. It has a distinct internal-only weapon identity, damage attribution, Codex entry, code-native
  silhouette, and deterministic `?transformation=drone-controller` review route; it never enters a draft
  or shop pool. Gravity Adept now counts discrete projectile attacks and turns every eighth into one
  rank-scaled, non-damaging pull field at the first projectile impact; multi-projectile attacks still emit
  only one pulse. It reuses the Event Horizon movement rules but has its own short-lived field kind and no
  implosion. The two unresolved metrics remain documented beside the resolver: Fire damage received and
  Shock buildup received. Do not fake them until the player can actually receive typed elemental
  damage/status.
- **T4.6 — COMPLETE 8 Aug 2026.** The first real drop shows a non-blocking four-goal guide:
  move, evade, deal actual damage, and clear the first wave. Goals accumulate out of order, use the
  player's remapped keyboard/gamepad labels, reflect Auto-fire versus Manual Fire, and disappear with
  event-feed confirmation once complete. It never changes input or simulation state, does not appear
  on scenario/stress routes, and can be forced for review with `?onboarding=1`. Completion is scoped
  to the first run (`runsFinished === 0`), so no second persistent tutorial flag or schema field is needed.
- **T4.7 — COMPLETE 9 Aug 2026.** Schema v16 retains the newest 20 completed runs instead of only
  `lastRunSummary`. Each entry has a stable content-fingerprinted identity and completion timestamp;
  Steam Cloud reconciliation unions divergent device journals, deduplicates already-synced runs,
  sorts newest-first, and reapplies the 20-entry cap. Schema v15 migration preserves its existing
  last summary as a legacy history row. Records now splits into Career and Recent Runs panels, shows
  six journal rows at once, and scrolls through all retained entries with bounded keyboard/controller
  navigation. The old `lastRunSummary` remains as a compatibility/current-debrief pointer derived from
  the newest journal entry.
- **T4.8 — COMPLETE 9 Aug 2026. Assault released through Assault Clearance.** Assault now owns
  a typed hero definition and catalogue entry, 9-health / 5.4-speed chassis, four-slot
  Medium/Medium/Heavy/All rack, 4/1/1/1 upgrade economy, Marauder AR, Momentum's same-target
  +4%-per-hit ramp (capped at +20%, reset after 1.25 seconds or target change), and Breach & Clear's
  nine-round 100-degree forward cone. Marauder is hero-bound and excluded from random chest/shop
  acquisition. `?hero=assault` is the explicit code-native mechanics review route; it refuses Marine
  art, while Character Select exposes the real dossier but keeps Deploy disabled. The select portrait,
  12-frame directional body, aligned Breach overlay, roster tile, retained masters,
  prompt provenance, and deterministic normalizer are complete and accepted through explicit QA routes.
  Three mono 48 kHz/24-bit suit-feedback masters pass peak/edge screening. Their six OGG/MP3 derivatives
  pass automated metadata, duration, and true-peak screening, and hero-aware damage/evade/death playback
  is wired with format and synth fallbacks intact. Contextual listening is accepted and the release flag is
  enabled. Assault appears as a playable but locked roster hero until Assault Clearance is owned. Next, begin
  Tactician's mechanics contract. Marauder's dedicated gameplay body, four-state ballistic presentation,
  and standalone HUD/choice/debrief tile are integrated; the stable eight-frame Batch I atlas remains
  unchanged. Assault Clearance is a typed 18-mark hero node after Breach Protocol; it cannot render,
  purchase, or unlock deployment before its prerequisites and 18-mark cost are satisfied.
- **T4.9 — COMPLETE 9 Aug 2026. Tactician released through Tactician Clearance.** The
  typed definition now owns an 11-health / 4.85-speed chassis, Unique/Light/Medium/All rack, Event Horizon start,
  2/2/2/1 upgrade economy, and the canon growth package (+1 health, +1 armour, +1 Unique proficiency, alternating
  damage/speed). `Designate Priority` marks enemies touched by Event Horizon for 4 seconds and makes autonomous
  weapons prefer those targets without adding a damage multiplier. `Coordinated Strike` orders every equipped
  weapon to perform one immediate attack on a 26-second cooldown without resetting its normal firing cadence.
  The HUD exposes the designation count and `?hero=tactician` provides a code-native mechanics-review route that
  never borrows Marine art. Character Select exposes the accepted portrait and real dossier, labels the hero
  **LOCKED** until clearance ownership, and enables Deploy only when that authority check passes. Browser QA
  accepted the complete dossier at 960×540 with no console warnings or errors. The retained C3 package includes
  a 1024×1536 select identity anchor, transparent 12-frame 96 px gameplay sheet, 128 px roster crop,
  deterministic normalizer, and explicit select/combat review routes. A separate equipment overlay is
  intentionally omitted because the sensor fin
  belongs to the stable body and no equipped mechanic needs a modular layer. The held Armory contract is a
  22-mark **Tactician Clearance** after Shock Doctrine, producing a 35-mark total path parallel to Assault's
  Breach branch. The accepted release flag exposes the node while cost, prerequisites, save hydration, direct
  selection, run start, and threat confirmation continue enforcing ownership. Tuning is frozen after the
  corrected deterministic policy audit placed Tactician within the
  implemented roster band across 12 seeds at 45 seconds (median level 2, scrap 3, damage taken 9). Close-view,
  ordinary combat, and 56-enemy density presentation are accepted with no browser warnings or errors.
  Contextual damage/evade/death listening is accepted and the reviewed release flag is enabled. The three
  deterministic 48 kHz/24-bit masters and six OGG/MP3
  derivatives are wired and pass automated codec, duration, channel, sample-rate, and true-peak screening;
  Mark's contextual acceptance completes the human listening gate.
- **T4.10 — COMPLETE 9 Aug 2026. Scout released through Scout Clearance.** Scout
  owns a typed definition and catalogue entry with an 8-health / 6.0-speed fragile chassis, five-metre dash,
  Light/Light/Medium/All rack, Arc Carbine start, and 3/1/1/2 upgrade economy. Canon growth is implemented as
  +2 speed, +1 damage, and +1 Light proficiency per level. `Slipstream` grants 20% attack speed for 2.5 seconds
  when an evasive dash begins; `Deadeye Burst` fires three tightly grouped seven-damage rounds with two-target
  pierce on a 24-second cooldown. Across 12 cautious-policy seeds at 45 seconds, the candidate records median
  level 2, 21 scrap, and 8 damage taken; a provisional regression band now owns those results. `?hero=scout`
  began with an explicit code-native mechanics route that refused all existing hero art. Focused mechanics,
  catalogue, and balance-audit tests plus TypeScript pass. The C3 visual package
  now adds a 1024×1536 hooded select portrait, transparent 12-frame 96 px body sheet, 128 px roster tile,
  deterministic normalizer, and standard Character Select / `?hero=scout` routes; the explicit C3 query aliases
  remain useful for provenance reviews.
  Its narrow cyan visor, long side optic, slim charcoal/navy armour, and pale-sand markings pass close-view,
  ordinary-combat, and 56-enemy density review. A separate overlay is intentionally omitted because the hood and
  optic are stable identity and no equipped mechanic requires a modular layer. Three deterministic dry Scout
  masters and six OGG/MP3 derivatives now provide isolated damage, evade, and death feedback. Codec, duration,
  channel, sample-rate, and true-peak screening pass with shared/synth fallbacks intact. The released progression
  contract is a 20-mark **Scout Clearance** after both Shock Doctrine and Breach Protocol (45 marks total).
  Contextual damage/evade/death listening is accepted, the six-node Armory layout is live, and the single release
  authority now admits Scout to the roster, standard hero asset group, save selection, threat confirmation, and
  run start. Ownership remains mandatory at every boundary.

### 10.6 Dependency graph

```
T0.1 CombatSimulation split ──┬─→ T4.1 difficulty ladder ──→ T4.2 meta-progression
                              └─→ T4.5 transformation behaviours
T0.2 Scene split ─────────────┬─→ T4.4 hit-stop
                              └─→ T2.3 HUD reflow
T0.3 WebP ─────────────────────── (independent)
T0.4 live display size ────────── (independent)
T1.1–T1.6 audio buses ─────────── gated on M1/M2/S4 assets landing
T2.1 scale plan ──→ T2.2 render target ──→ T2.3 reflow ──→ T2.4 settings ──→ T3.8 Electron display
T3.1 Electron ──→ T3.2 adapter ──→ T3.3 file saves ──→ T3.4 cloud
                                └─→ T3.5 achievements ──→ T3.6 expand IDs ──→ batch X1 icons
T4.1 ladder ──→ T4.3 dailies + leaderboards
```

Two hard gates worth restating: **T3.6 must land before batch X1** (do not commission 56 icons
for achievement IDs that do not exist), and **a T4.8 hero must not become deployable before both
its mechanics contract and dedicated production presentation exist**. Assault has cleared its mechanics
and visual/audio gates plus contextual human listening acceptance. Its released Armory clearance is now the
progression enforcement mechanism for deployment.

---

## 11. HUD readouts and run pacing

Added 8 August 2026 in response to five questions. Three of them turned out to have a different
answer than expected, so the findings come before the proposals.

### 11.1 Findings

**The wave timer already exists.** `WAVE_DURATIONS_SECONDS` in `combat/DensityDirector.ts` is
`[20, 20, 30, 35, null, 40, 45, 50, 60, null]` — wave 9 is literally a 60-second round. Waves 5 and
10 are `null` on purpose: the elite wave and the boss wave are clear-all, not timed. So the system
is there and tuned; the problem is that it renders as a **four-character suffix on the wave label**
(`WAVE 7/10 • 42s`) and is easy to miss entirely.

*(Corrected 8 Aug 2026: an earlier draft of this paragraph called waves 1-2 an inconsistency,
claiming their 20-second duration "does nothing". That was wrong.* `durationSeconds` *is also the
spawn-schedule window —* `scheduleInPulses(composition, durationSeconds ?? 30)` *— so waves 1 and 2
spread their spawns across 20 seconds and then end when cleared. Timed endings starting at wave 3
is deliberate onboarding: learn to clear, then learn to survive. Nothing to fix.)*

**Overheal is currently impossible, so this is a systems request rather than a HUD one.** Every heal
path clamps: there are **six** `Math.min(playerMaxHealth, …)` sites across supply depots, the shop
repair, medic healing, and pickups. Nothing can push health above maximum today, so an overlay would
have nothing to draw. Also note `healthFill.setScale(health / maxHealth, 1)` would scale past 1 and
overflow its frame the moment health could exceed max — the bar has no clamp of its own.

**Shield is text-only.** `+SH4` appended to the health readout. There is no bar.

**Armour is invisible during combat.** It appears only in `ui/BuildOverlay.ts` as
`Armour bonus <n>`. Mid-fight you cannot see it.

**There is no game-speed control of any kind.** No `timeScale`, no fixed-step accumulator — the
simulation is stepped once per rendered frame with the frame's delta.

### 11.2 Shield bar

Draw shield as a **blue segment sharing the health bar's pixel scale**, not as its own full-width
bar. One shield point must be the same width as one health point, or the bar lies about how much
protection it actually represents — shield totals are small (Shield Capacitor grants 1.5 per level)
next to a health pool in the tens.

Two placements work; prefer the first:

1. **Inline extension** — shield fills rightward from the end of the health fill, inside the same
   frame, and depletes first. Reads as "one pool with a blue tip", which matches the mechanic:
   shield absorbs before armour and before health.
2. A thin separate bar directly above, on the same width scale.

Also surface the recharge state: shield recharges out of combat after a delay
(`shieldRechargeDelaySeconds`), and the new Capacitor Array upgrade scales both. A subtle pulse
while recharging tells the player that disengaging is working.

### 11.3 Overheal

> **STATUS (8 Aug 2026): shipped as option B.** Separate `bonusHealth` pool, capped at
> half of maximum, no decay, spent after mitigation and before health. Note the clamp-site
> count below is wrong: there are **seven**, not six — the medkit powerup clamps as
> `Math.min(healAmount, maxHealth - health)`, a shape the original grep could not match, and it
> is the one that matters most. See `wave_balance.md`.

Because health is hard-clamped in six places, pick the mechanic before the visuals.

| | **A — true overheal** | **B — separate bonus pool** *(recommended)* |
|---|---|---|
| Change | Allow `playerHealth > playerMaxHealth`, decaying back down | A distinct `bonusHealth` pool consumed before health |
| Clamp sites | All six must change, plus the bar's scale | None — new field, no existing clamp touched |
| Risk | Every heal, regen, and lifesteal path is in scope | Contained; mirrors how shield already works |
| Reads as | `16/12` | `12/12 +4` |

B is recommended: it is the same shape as the shield system that already exists and works, it does
not require auditing six healing paths, and it keeps `maxHpFlat` and `maxHpPercent` meaning exactly
what they mean now. If the `16/12` readout is specifically wanted, that is option A and should be
costed as a systems change with its own balance pass — persistent overheal is a large survivability
buff, so it needs a decay rule (suggest capping at +50% of max and decaying 1 point per second out
of combat).

Either way the health bar needs an explicit clamp so the fill cannot exceed its frame, and the
excess should render as a **distinct lighter overlay past the full mark**, never by rescaling the
bar. Rescaling would make the same HP value change width, which is the one thing a bar must not do.

### 11.4 Should armour be displayed?

Yes — but **not as a raw number**, because armour is diminishing:
`reduction = armour / (armour + 15)`. "12 armour" is meaningless to a player; 12 armour is 44%
reduction, and the next point is worth less than the last. Show the effective figure:

```
ARM 12  (44%)      -0.9 flat
```

The flat term matters now that Reactive Plating exists — it is a second, differently-behaving
mitigation stat, subtracted after the percentage step and floored at 0.1, so showing only one of the
two would misrepresent survivability. Dodge is a third invisible defensive stat and belongs on the
same compact line.

Put it in the existing stats line rather than a new panel; that line already carries hero, level,
and state flags.

### 11.5 Game speed

> **STATUS (8 Aug 2026): the setting is shipped** (0.75x / 1x / 1.25x, pause menu
> `GAME SPEED`), built on a fixed-timestep accumulator (`combat/FixedTimestepClock.ts`) exactly
> as recommended below. The difficulty-ladder modifier and the recommendation against a
> powerup are both still open. See `wave_balance.md` and the 8 August log entry.

Worth doing, but the implementation order matters because of one constraint: **the game has a
deterministic replay fixture** (`combat/ReplayFixture.ts`, `combat/ReferenceRun.ts`) that the
refactor work depends on for equivalence proofs.

- **Do not scale `deltaSeconds`.** Multiplying the delta changes how many integration steps happen
  per second and therefore changes results — determinism, replays, and the equivalence harness all
  break, and floating-point drift makes those failures intermittent rather than obvious.
- **Do use a fixed-timestep accumulator.** Run the simulation at a constant step (1/60) and let the
  speed multiplier decide *how many steps run per rendered frame*. 2× is two steps per frame, 0.5×
  is one step every other frame. Determinism is preserved exactly, and the same accumulator is what
  hit-stop (G6) needs — both should land against one clock authority rather than fighting.
- Non-integer multipliers (1.1×, 1.25×) fall out of the accumulator carrying its remainder, which a
  fixed step handles naturally.

Then three separate uses, in increasing order of risk:

1. **Setting (do first).** Slower speeds (0.75×) are a real accessibility win; faster (1.25×) is a
   quality-of-life win for repeat runs. Cheapest and least balance-affecting.
2. **Difficulty modifier.** A clean, legible tier modifier for the T4.1 ladder — "everything is 15%
   faster" is instantly understood and needs no new art.
3. **Powerup — recommend against, at least initially.** A world-speed powerup speeds *enemies* too,
   so it is a downside disguised as a reward, and player-only haste already exists through
   `moveSpeedPercent` and `attackSpeedPercent`. If a "hyper" mode is wanted, make it a mode, not a
   pickup.

Leaderboard note: if dailies (G3) ship, score has to be recorded against a fixed speed or the board
is meaningless. Record the multiplier in the run summary either way.

### 11.6 Further recommendations

Ranked by value against effort. The first two are the ones I would do next.

1. *(Shipped 7-8 Aug 2026 — but see the colour-vision gap in the log: damage-type identity is still carried by colour alone.)* **Surface damage-type weakness and resistance.** 29 of 36 enemies now carry resistance profiles
   after the 7 August pass, and the player has no way to see any of it — the entire
   rock-paper-scissors layer is invisible. A small weakness/resist glyph on the enemy health bar, or
   a tinted hit marker, turns existing data into a readable decision. Highest value per line of code
   on this list.
2. *(Shipped 8 Aug 2026.)* **Show status buildup progress.** Statuses fire at 8 accumulated buildup, and now that
   `statusBuildupPercent` scales it, invisible progress is actively worse than before — the player
   cannot tell the stat is doing anything. A thin ring or tick marks under the enemy health bar.
3. *(Shipped 8 Aug 2026.)* **Promote the wave timer** to a real countdown (a ring around the wave number, or a depleting
   bar) on the waves that are actually timed. Waves 1-2, 5 and 10 have no countdown by design and
   should show none.
4. *(Shipped 8 Aug 2026.)* **Live run timer.** `RunSummary.elapsedSeconds` is already tracked but never shown in-run. Cheap,
   and required for dailies and leaderboards anyway.
5. *(Shipped 8 Aug 2026.)* **Elite health bars.** A boss panel already exists (`bossPanel` / `bossFill`); elites use the
   ordinary enemy bar and do not read as special.
6. **Damage-taken direction indicator.** `showDamageDirection` exists in the scene — worth
   confirming it is legible at 30+ enemy density, where off-screen threats are the main killer.

### 11.7 Asset implications

Most of this is code-drawn and needs no Codex work. Two exceptions, to append to the asset queue:

- **85 — HUD bar chrome.** Shield-blue and overheal-overlay fills matching the existing health bar,
  plus a countdown ring for the wave timer. Should be produced alongside UI Batch U2's HUD backing
  plates so the whole cluster is one visual language rather than two.
- **86 — Damage-type weakness glyphs.** Five small marks, one per damage type, legible at enemy
  health-bar size and distinguishable in all four colour-vision modes — so shape-first, never
  colour-only.
