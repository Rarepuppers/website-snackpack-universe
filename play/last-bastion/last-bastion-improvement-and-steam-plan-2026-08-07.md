# Last Bastion — improvement and Steam plan

**Written: 7 August 2026. Status: LIVE — this is a forward plan, not a history doc.**

Scope: a full review of `play/last-bastion/` as it stands today, then a plan covering
(a) the move to a Steam desktop release at Full HD and 4K, (b) gameplay and quality
improvements, and (c) every new art/animation/audio asset Codex needs to produce for them.

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

**F8 — Two playable heroes.** Marine and Medic. Assault, Tactician, and Scout are silhouettes
with no gameplay contract, which is correctly identified in the asset review as
mechanics-before-art.

**F9 — No daily/weekly seeded run and no leaderboards.** Steam Leaderboards are free, the run
already threads a deterministic seed (`?mapseed=N`), and a daily is the cheapest retention
mechanic in the genre.

**F10 — Transformations are a stat bag.** `TransformationRunModifiers` resolves 22 of 26 effect
metrics into flat multipliers. Step 5 of `transformation-path-production-plan.md` — the
behaviour pilot that makes a path feel like a transformation rather than a percentage — is
genuinely open and is the difference between seven paths and seven damage modifiers.

**F11 — No music, no ambience, silent UI bus.** Already the top of the asset queue (items 63–65).
Restated here only because it is the loudest quality gap for a paid product: `MusicDirector` and
`AudioMixer` are written, tested, and consume nothing.

### Quality and maintainability

**F12 — Two files absorb every future feature.** `combat/CombatSimulation.ts` is **10,598 lines**
and `scenes/PrototypeScene.ts` is **5,052 lines**. Everything new collides in them.

**F13 — Web payload is 106 MB and WebP covers 8 of 435 PNGs.** The pipeline exists
(`image:encode:webp`, `RuntimeImageFormat.ts`, an audited manifest) but is scoped to the eight
large photographic plates. Sprite atlases are still PNG.

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
4. **Make display size apply live** — export the `applyDisplayScale` closure from boot and call
   it from the settings handler; drop "(applies on reload)" from the label.
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
| `Fill` | Render at `N+1` (**supersample**), then GPU-downscale with linear filtering to fill the window exactly. | 1440p, 1600p, 1366×768, Steam Deck. A 2880×1620 → 2560×1440 downsample is far sharper than a 1.33× nearest upscale, and costs ~1.4× fill rate on a game that is nowhere near GPU-bound. |
| `Expanded frame` | Keep `Crisp` integer scaling, and fill the leftover width/height with an authored bezel that *relocates* HUD furniture (radar, status tray, weapon ring) into the side panels. World FOV unchanged. | 21:9 and 32:9 ultrawide, 16:10. Makes the unused space look deliberate instead of broken. |

Default selection: `Crisp` on exact multiples, `Fill` otherwise, `Expanded frame` offered whenever
the window aspect differs from 16:9 by more than ~5%.

**Layer C — HUD.** Already resolution-aware — `uiTextResolution()` rasterises glyphs at
`deviceScale`, and `uiSafeArea()` is fraction-based. Verify at 4× that the 2% inset still reads
as a sane physical margin on a 32" panel; if not, make the inset fraction a
`Crisp`/`Expanded`-aware constant rather than a per-screen branch.

### 5.2 Steam Deck specifically

1280×800 at `Crisp` gives `N=1` and a 960×540 postage stamp. `Fill` with `N=2` supersample
(1920×1080 → 1280×800) is a clean 1.5:1 downsample and will look excellent. **Deck must default
to `Fill`.** Also required for a Verified badge: fullscreen by default, all text legible at 7",
gamepad-only navigation through every screen (already true), and Steam Input glyph support.

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

**G4 — Transformation behaviours (plan-of-record step 5+).** Pilot Cybernetic Ascension with an
actual behaviour — the Drone Controller choice should spawn a drone, not add a damage percentage.
Then extend to the remaining six paths. This is what turns F10 from a stat bag into the game's
identity mechanic.

**G5 — Heroes 3–5.** Mechanics contract first (stats, weapon-class rack, starting weapon,
ultimate, unlock rule), then the C3 art package per the existing rule. One hero at a time.

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

- **Header capsule** 920×430 · **small capsule** 462×174 · **main capsule** 1232×706 ·
  **vertical/library capsule** 1200×1600 · **library hero** 3840×1240 (subject-left, safe-centre) ·
  **library logo** transparent PNG · **page background** 1438×810.
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
3. Weapons, projectiles, scrap shop, decisions, snapshot last — these hold more shared mutable
   state and need an explicit context interface rather than pure step functions.

**Acceptance:** `combat/CombatSimulation.ts` under 3,000 lines; the 129 exports from it remain
exported from the same path (re-export from the new modules — every consumer imports from
`./CombatSimulation`, so the public path must not move); all 1021 tests pass **unmodified**;
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

#### T0.3 — WebP across sprite atlases

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

#### T0.4 — Live display size

`main.ts` builds `applyDisplayScale(game)` inside `boot()` and wires it to resize and DPR change
only. Export a module-level `reapplyDisplayScale()` and call it from `ShellScene.ts:139`, where
`saveStore.updateSettings({ [effect.key]: effect.value })` already runs. Drop
"(applies on reload)" from the label in `shell/ScreenFlow.ts:115`.

**Acceptance:** dragging the slider resizes the canvas immediately; the setting still persists.

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

- **T2.1** — Extend `planDisplayScale()` to return a presentation mode alongside `zoom`/
  `deviceScale`. Keep the existing integer search; add the `Fill` supersample path (choose
  `N+1`, present with linear filtering) and the `Expanded frame` path (integer `N`, report the
  leftover rect). Pure function, fully unit-testable — add cases for 1920×1080, 3840×2160,
  2560×1440, 3440×1440, 1366×768, and **1280×800 (Deck)**; the Deck case is the regression test
  that must never silently return `N=1` again.
- **T2.2** — Render the world to a `RenderTexture` at `N` and present it, so Layer A and Layer B
  are genuinely separable.
- **T2.3** — HUD reflow for `Expanded frame`: radar, status tray, and weapon ring relocate into
  the leftover rect. `uiSafeArea()` already parameterises width/height, so this is a call-site
  change, not a rewrite.
- **T2.4** — New settings: presentation mode, fullscreen, display selection, frame cap,
  brightness/gamma, screen-shake intensity. Extend `GameSettings`, bump `SAVE_SCHEMA_VERSION`,
  and add the migration — `readBoundedNumber`/`readBoolean` defaults already handle absent fields,
  so old saves load; add a test proving a v10 save loads into the new version.
- **T2.5** — Route the shake-intensity setting into `PrototypeScene.shakeCamera()` (line 1072) as
  a multiplier, with `reducedMotionEnabled` continuing to clamp it to zero.

### 10.4 Phase 3 — Steam client

- **T3.1** — `desktop/` Electron workspace. Single `BrowserWindow`, `nodeIntegration: false`,
  `contextIsolation: true`. The preload implements exactly the existing `SteamworksBridge`
  interface (`getAchievement`, `setAchievement`, `storeStats`, `readCloudFile`, `writeCloudFile`)
  and nothing else — that narrow surface is the whole security model, so it must not grow.
- **T3.2** — Adapter selection at boot: construct `createSteamPlatformAdapter(bridge)` when the
  preload bridge is present, otherwise a browser adapter. **This is the only place the two
  builds diverge.**
- **T3.3** — File-backed `StorageLike`. `LocalSaveStore` takes `Pick<Storage, "getItem"|"setItem">`,
  so this is a ~40-line adapter: atomic write to temp + rename, one backup slot, and a corrupt-file
  fallback to the backup. Note the store is **synchronous** — keep the file adapter synchronous
  too rather than making the save layer async, which would ripple through every scene.
- **T3.4** — Cloud reconciliation via `CloudSavePolicy` at boot and at run end. It is already
  written and tested to merge monotonic career/bestiary fields by maxima without double-counting
  a replayed run; this task is wiring plus a real round-trip test against Steam Cloud.
- **T3.5** — Achievements. `LocalSaveStore.recordRunEnd` (line 285) is the single choke point
  where progress advances, and `achievementUnlockEvents(before, after, summary, alreadyUnlocked)`
  already takes exactly that shape. Call `synchronizeAchievementEvents` there, persist the
  `pending` set, and retry it at next boot — the function is already written to be retry-safe.
- **T3.6** — Expand `ACHIEVEMENT_IDS` from 6 to ~28 (§6.2). Each new ID needs an `isAchievementEarned`
  arm; the `switch` is exhaustive over the union, so TypeScript will name every one that is
  missing. Land the IDs **before** commissioning batch X1 icons.
- **T3.7** — Steam Input action-set manifest plus glyph rendering. `input/ControlBindings.ts`
  already owns the binding model and the HUD already reflects it, so glyphs are a presentation
  substitution at the existing label sites.
- **T3.8** — Fullscreen, display selection, and frame cap plumbed through the Electron main
  process to the T2.4 settings.
- **T3.9** — SteamPipe depot config, `steam_appid.txt` (gitignored), and build scripts alongside
  the existing PowerShell tooling.

### 10.5 Phase 4 — depth

- **T4.1 — Difficulty ladder.** A `ThreatTier` value (0–11) threaded through
  `expedition/CampaignTuning.ts` and `combat/WaveScaling.ts`. Each tier adds **one legible
  modifier**, not a stat multiplier — more elites, faster cadence, higher shop prices, one fewer
  rack slot, hazards persisting between waves. Store per-tier best results in `GameProgress`.
  **Depends on T0.1**, because this lands in the file that is currently 10,598 lines.
- **T4.2 — Meta-progression.** Extend `perkCatalog.ts` past seven with tier-gated unlocks, then
  add the currency and tree. Keep `unlockedPerkIds(progress)` as the interface — it is already
  the thing the debrief diffs against.
- **T4.3 — Daily/weekly runs + leaderboards.** Derive the seed from the UTC date, reuse the
  existing `?mapseed=N` threading, submit to Steam Leaderboards on run end. One attempt per seed,
  enforced in the save.
- **T4.4 — Hit-stop.** Scale Phaser's time scale for 2–4 frames on crit and kill, driven from the
  existing `CombatEvent` stream in `playCombatEvents`. Must respect `reducedMotionEnabled` and the
  T2.5 intensity slider. **Simulation must not observe it** — the sim steps on fixed
  `deltaSeconds` and hit-stop is presentation only, or determinism and the replay fixture break.
- **T4.5 — Transformation behaviours.** `TransformationRunModifiers` resolves 22 of 26 effect
  metrics as flat numbers, and the four unresolved ones are already documented in-place against
  the `default` arm. Pilot Cybernetic Ascension's Drone Controller as a real spawned deployable —
  `deployStructure` and `updateDeployables` already exist in the simulation, so the hook is there.
- **T4.6 — Onboarding**, **T4.7 — run history** (keep the last 20 rather than one
  `lastRunSummary`), **T4.8 — heroes 3–5** (mechanics contract first, then batch C3).

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
for achievement IDs that do not exist), and **T4.8 must not begin before each hero's mechanics
contract is in code** — that is the rule the existing silhouette placeholders were created to
enforce.
