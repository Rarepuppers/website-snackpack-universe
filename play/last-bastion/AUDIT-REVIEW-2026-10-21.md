# Last Bastion audit and prioritized polish proposal — 21 October 2026

This is the detailed review/acceptance specification linked from CURRENT-PLAN, not a second
execution queue. Status: **review complete; implementation proposed**. The request was to audit
and plan. No game code, art, progression, save schema or published bundle was changed.

## Recommendation

Invest next in trustworthy art review, quieter backgrounds, readable combat and a more usable
shell. Reuse the substantial existing art collection. **No new raster asset is demonstrated to
be essential by this audit.** The default gallery has real defects; its oversized enemies are
not evidence that combat enemies need repainting. No new crash, save-loss or simulation defect
was reproduced. This is a sampled audit, not proof that every run and configuration is bug-free.

## Fresh evidence and scope

- Inspected nested-repository status and recent commits before work. Starting HEAD: `1d592afd`.
  Last Bastion source/output history includes `ae85ffb6` (shared arcade control integration),
  `4675b9ab` (QA reporting), and the earlier asset patch. Other sessions' dirty pages, About,
  social art and privacy work were excluded. Historical 17 October results were not reused as
  present-day passes.
- Fresh host checks: 1,781 unit tests / 312 files, three content-inventory assertions, TypeScript,
  31 real browser journeys, 33 combat-adapter boundaries, six release-scene text audits and
  63 runtime-image derivative checks pass. Image derivatives total 27.06 MiB versus 51.93 MiB
  of source files; those are encoded bytes, not GPU memory or a cold-start download total.
- Read-only scratch comparison: all 25 published outputs match source; stale-output regression
  check passes without changing the published files. Vite emits classic-script/chunk-size
  warnings; these checks did not establish a startup defect.
- Twelve browser captures: menu at 960×540 and portrait viewport, map, default gallery with
  unsupported hero selectors, baseline/kit floors, small build inspection, correct Medic gallery,
  Medic/Assault combat and 4K settings. No page errors in these samples. The portrait sample used
  desktop pointer emulation; it is not a touch-device acceptance test.
- Correct Medic gallery: `?mode=gallery&batch=p`. Combat: `?screen=game&hero=medic` and
  `?screen=game&hero=assault&art=c3` (add fixed theme/seed for comparison). Unsupported gallery
  hero queries silently display Marine. Do not use those captures as Medic/Assault acceptance.
- Fresh full portfolio runner: all 20 guards pass, including game logic and asset delivery.
- [Evidence and limits](playtest-evidence/2026-10-21-audit/README.md) retain current images/results.
  No human full run, physical-controller/audio review, hardware benchmark, Steam session,
  fresh packaged executable or analytics-dashboard verification was performed.

## Priority and order

P0 = release-blocking failure; none newly demonstrated. P1 = next work protecting player
experience or confidence in acceptance. P2 = useful polish after that. P3 = conditional expansion.
Effort is relative: S is a localized change; M crosses several consumers; L needs staged work
and human acceptance. These are planning bands, not delivery promises.

| Order / ID | Priority | Work | Evidence / dependency | Effort |
|---|---|---|---|---|
| 1 / QA-03 | P1 | Repair gallery size, clipping and route identity | Confirmed QA defects below | M |
| 2 / ACCEPT-02 | P1 | Run the existing five-run acceptance matrix | Human/controller/audio input required | M + external |
| 3 / ART-01 | P1 | Select/reject existing quieter floor kit | Fresh static comparison supports review; motion gate remains | S–M |
| 4 / ART-02 | P1 | Verify hero registration and animation in motion | LB-04 remains open; correct hero routes required | M |
| 5 / CLARITY-01 | P1 | Validate telegraphs, pickups and earned mixed racks | Dense observed play; change only demonstrated failures | M |
| 6 / ACCESS-01 | P1, conditional implementation | Semantic title/menu/settings slice | Confirmed canvas-only limitation; preserve shell contracts | L |
| 7 / PERF-02 | P1 for desktop release | Measure named hardware; refresh desktop via Claude | No new performance/support claim without measurements | M + external |
| 8 / UX-01 | P2 | Refine shell hierarchy and contextual help | Subjective polish, sampled layout currently fits | S–M |
| 9 / AUDIO-01 | P2 | Listen to and tune existing feedback/mix | Ear review required before new samples | M |
| 10 / QA-04 | P2 | Clean stale art/audio comments and review coverage | Source describes delivered identities as pending | S |
| 11 / LEARN-01 | P2, content gate | Replayable practice using current arena/input | Only after observed comprehension results | M |
| 12 / VARIETY-01 | P3, content gate | One existing-region encounter variation | Verified live measurement + observed-run gate | M |

## Confirmed defects and limitations

### QA-03a — default gallery ignores logical sprite dimensions

`dev/src/game/scenes/AssetGalleryScene.ts` draws scuttler, egg and brain frames with raw
`add.sprite(...)` sizes. `assets/GameAssetManifest.ts` deliberately slices their 256×256 source
frames while retaining 64×64 logical footprints. The default gallery therefore paints these
four times their intended logical width/height, obscuring neighbouring samples and labels.
The combat renderers already size their actors; do not apply a global loader scale to fix this.

Plan: size gallery sprites from manifest logical dimensions, apply authored pivots, reserve
label gutters and keep explicit zoom separate from native-size review. Compare raw frame,
logical-size actor and live combat when investigating an anchor problem.
Acceptance: every frame/pivot label visible at 960×540, 1080p and 4K; no overlapping sample cells;
unchanged live combat scale. Add a real scene bounding-box check for the affected gallery rows.

### QA-03b — manifest contract text overflows its panel

The default gallery builds `lines` for all `GAME_ASSETS`, then renders `lines.slice(3)` as one
unbounded right column at y=414. The 227-definition registry cannot fit the 126px panel; the
fresh capture visibly cuts off the list/footer. This is a diagnostic UI defect, not a missing art file.

Plan: bound visible rows with pagination/filtering and a count; allow full data export through
the existing inventory. Keep footer and page controls outside the list bounds.
Acceptance: first/last pages, keyboard/controller back/next and resizing work without clipping.
Test overflow with the real current manifest, not a copied small fixture.

### QA-03c — unsupported hero gallery selector silently shows Marine

`AssetGalleryScene.create()` selects `batch`, not `hero`. Both hero-labelled trial URLs produced
the same Marine gallery. Existing Medic route is batch P; Assault has production combat art
but no corresponding hero-selector branch in this gallery.

Plan: choose a single documented gallery route contract. Either implement explicit supported
hero routing with a visible selected-hero heading, or show a clear unsupported-selector message
and link to valid batch routes. Add an Assault review surface using its actual production
frames/overlay. Never silently count fallback Marine captures as another hero's acceptance.
Acceptance: requested hero equals displayed identity; unknown selectors visibly reject/guide;
correct routes cover Marine/Medic/Assault before LB-04 sign-off. Load only the selected review
family where feasible: `preload()` currently queues the entire manifest. Measure this separately
from normal gameplay loading; it is not evidence of a normal-game download regression.

### ACCESS-01 — menus have keyboard navigation but no semantic action tree

`shell/ShellScene.ts` renders controls as canvas text/zones. The outer named `main` and DOM save
helpers do not expose operable menu buttons, settings values and focus to assistive technology.
This is an existing confirmed limitation, not a new regression or a whole-game accessibility claim.

Recommended first slice: title → menu → settings → back. Follow the existing
[contract inventory](SHELL-ACCESSIBILITY-CONTRACT-2026-10-17.md): one ScreenFlow state/effect
owner, actual controls, stable focus, correct names/states, and exactly one Enter/Space action.
Then separately assess help, records, armory, hero/threat selection, map and debrief.
Acceptance: real keyboard + screen-reader operation, pointer/controller parity, no duplicate
activation, correct modal/binding-capture ownership and cleanup on scene exit. Implementation
remains an explicit scoped proposal under the standing gate.

## Asset, background, sprite and animation decisions

| Family | Current recommendation | Generate/repaint trigger | Priority / acceptance |
|---|---|---|---|
| Standard arena floor | The baseline visibly repeats a dense small square grid. Review the existing eight-tile kit first; its broader panels are calmer in the fresh sample. | Only repair a named seam, confusing floor marking or failed tile after baseline/kit motion comparison. | P1; fixed seed, dense combat, grayscale/CVD, 1080p/4K and matched pacing. |
| Floor decals | Reuse four existing kit decals; tune frequency/opacity before making more. | A specific missing material cue survives reuse review. | P2; decals cannot resemble pickups, safe lanes or collision geometry. |
| Hero bodies/helmets | Reuse existing Marine, Medic and Assault sheets. Medic batch P and production Medic/Assault combat display their own art. | Named hero/state/direction/frame exhibits drift, clipping or silhouette loss in motion after pivot correction. | P1; fix registration before repainting, preserve original masters and frame maps. |
| Hero animation | Review idle/move/dodge/hit/death transitions and action readability against actual implemented state maps. | A specific transition pops, slides or misses a needed readable pose. | P1 validation / P2 targeted repair; no invented frame count or full-sheet regeneration request. |
| Weapons | Retain dedicated base/68A/68B/68C/Marauder/Event Horizon identities and production weapon bodies. | A named identity is confused at actual HUD/shop size despite layout/contrast fixes. | P2; compare silhouette at display size, not only enlarged source. |
| Hostiles/bosses | Retain current roster and animations. Gallery oversizing is a renderer defect. | A wind-up/state/facing is unreadable in a real encounter. | P1 tell correction / P3 cosmetic variety; keep hit geometry/timing authoritative. |
| Hazards/telegraphs | Keep code-owned borders/hatching and geometry; inspect retained O2 assets before using art. | Players misread a specific warning or hazard under observed conditions. | P1; colour-independent cues and visible safe lanes; no art-only mechanic change. |
| VFX/transformations | Reuse six existing families and Reduced Flash treatment. Tune layering/opacity/particle count first. | A documented effect cannot convey a shipping mechanic with existing cues. | P2; warning and hitbox remain visible, Reduced Flash respected, no pacing regression. |
| Map icons | Reuse existing code symbols, brackets, READY and closed-state badges. | Actual route selection reveals persistent ambiguity. | P1 comprehension review / P2 refinement; semantic labels/legend before raster replacement. |
| Menu backdrops/portraits/chrome | Retain existing art; adjust title alignment, spacing and hierarchy through code if useful. | Named cropped/mismatched art region is demonstrated across supported layouts. | P2; captions and controls remain code-rendered. |
| Music/audio | Production S1/S2/S3 and hero feedback exist; synth is also fallback. Listen before commissioning. | A specific cue is absent/inaudible/too repetitive after existing-sample and mix review. | P2; loudness, stacking, ducking, pause/focus and mute checked by ear. |

For any approved image work: exact brief and references, original source/prompt/version,
transparent master where relevant, deterministic extraction/normalization, atlas/pivots,
runtime binding, before/after capture and rollback. Do not bake labels into art. Do not delete
the 1,328 historically unmapped candidates merely because they are absent from the manifest.

## Player-facing polish details

**UX-01:** menu fits the sampled small landscape viewport and settings fit the sampled 4K
viewport. Optional refinements: align the title more deliberately inside its plate, give each
mode a consistent one-sentence purpose and use the spare lower menu space for selected-mode
help if observed players need it. Preserve Quick/Daily/Expedition identity, first-visit focus and
progression rules. Do not add more menu items to solve comprehension. A portrait desktop-pointer
sample is small/letterboxed, as expected for this desktop game; retain the touch notice rather
than advertising touch play. Test real coarse-pointer and paired-controller entry separately.

**CLARITY-01:** inspect earned three/four-weapon and bonus-slot racks, multiple damage families,
pickups, objective panels, first-drop prompts and enemy tells together. Screenshot samples show
the onboarding box occupying a substantial upper-left area; that alone does not prove unfair
occlusion. If an observed damage source is hidden, reposition/compact the prompt and preserve
its learning step. Prioritize hostile telegraphs over decorative hits, glows and damage numbers.
For map comprehension, ask a tester to identify reachable/selected/armed/cleared/closed and
explain the confirm-twice flow without coaching before changing symbols.

**ART-02:** review all facings in motion with body/helmet/weapon layers, not static bodies alone.
Use the corrected gallery for frame isolation and the real combat renderer for acceptance.
Annotate frame ID and pivot displacement. A small anchor adjustment is lower risk than repainting
a whole hero. Preserve the Marine's current per-pose registration unless the observation refutes it.

**AUDIO-01:** listen to warning → attack → hit → outcome at low and normal volume, with several
weapons firing. Verify damage cues survive music, no repeated XP transient dominates, no stuck
loop on pause/restart, and mute/volume changes take effect. Existing sample coverage or a loudness
report cannot establish a satisfying mix. Generate only the missing accepted cue/variant.

**PERF-02:** use the existing session reporter, not another profiler UI. Measure 15-minute dense
play on named GPU/driver at Full HD/4K, Windows scaling, ultrawide/Deck-shaped output, focus and
monitor transitions. Record p95/p99/hitches, DPR/backing size and texture context. Separate CPU,
GPU/overdraw and residency evidence before optimization. Large-bundle warnings alone do not
justify a sweeping loader rewrite. Claude owns a fresh desktop package; host/browser passes do
not update the October executable or establish native 4K60.

**QA-04:** `WeaponTileFrames`, `CooldownPresentation`, identity/test comments still discuss
pending/shared placeholder art despite dedicated production overrides. `AudioCueMap` and
`WebAudioSynth` introductions describe placeholder-only audio despite real sample paths.
Update descriptions and evidence routes to prevent duplicate asset commissions; do not remove
valid fallback logic. Add checks that selected gallery identity and on-screen bounds are true.

## Conditional additions and stop rules

- **LEARN-01:** if observed runs show repeatable difficulty understanding dodge/aim/hazards or
  inspection, recommend one replayable practice sequence. Reuse production input/simulation and
  an existing arena; immediate exit; no Career/Daily/achievement/outcome contamination. Prefer
  code-native targets/prompts. Fix any measured confusion after Patch A acceptance.
- **VARIETY-01:** after the existing two-week verified-live-data plus observed-run gate, select
  one weak existing-region encounter and vary spatial objective/pacing. Reuse enemies and art;
  review safe paths, rewards, replay/save compatibility. Do not silently promote it into selection.
- New heroes, regions, threat tiers, multiplayer, leaderboards, broad repainting, new soundtrack
  collections and touch gameplay remain outside this polish scope. They require their own
  validated need and full implementation/acceptance budget.
- No blanket production build, deployment, Steam action or floor-default change follows from
  this audit. Fix proposals first become scoped implementation tasks; stage only owned paths.

## Proposed delivery phases and checks

1. **Trust the review tools:** QA-03a/b/c plus QA-04 descriptions; real-scene identity/bounds
   checks; repeat native-size gallery captures. No generated art required.
2. **Accept existing visual work:** ACCEPT-02, ART-01/02 and CLARITY-01. Complete the existing
   five-run worksheet with human/controller/audio results. Fix demonstrated failures individually;
   reject or revise floor candidates if they impair fairness or pacing.
3. **Improve usability:** scope ACCESS-01 first slice separately, then UX-01 and AUDIO-01 findings.
   Test actual controls and audio. Avoid a large shell rewrite bundled with cosmetic changes.
4. **Desktop readiness:** Claude packages the accepted source; test exact manifest/executable on
   target hardware and Steam when access exists. Dashboard owner confirms receipt/settings and
   measurement start date. Neither responsibility is satisfied by the browser audit.
5. **Select optional content:** only after the standing evidence gates. Practice first when it
   solves observed learning problems; one encounter variation next when variety is actually weak.

For runtime changes, run targeted production-behavior regressions, full game verifier, published
output/offline and browser checks, and relevant portfolio guards. Include changed generated output
and worker identity for an authorized release. Do not run executable packaging as part of tests.
For plan-only updates, check local references and diff. Keep earlier acceptance records dated;
fresh code checks do not close human/hardware gates.
