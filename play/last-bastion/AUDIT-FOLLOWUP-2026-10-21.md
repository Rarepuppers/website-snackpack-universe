# Last Bastion — current audit and prioritized recommendations

Reviewed 21 October 2026 against `7780ba86` plus the pre-existing dirty working tree.
This is the post-implementation review; [the earlier audit](AUDIT-REVIEW-2026-10-21.md)
is the pre-fix baseline. [CURRENT-PLAN](CURRENT-PLAN.md) remains the only execution queue.

**22 October follow-through:** Mark authorized executable implementation. The next bounded
ACCESS-01 slice, native How to Play, is now implemented locally; see the
[completed record](archive/HELP-ACCESSIBILITY-IMPLEMENTATION-2026-10-22.md). The canvas-only help
limitation below describes the audit baseline. Other human/content/hardware gates remain open.

## Verdict and evidence

The existing art is sufficient to continue acceptance. **No new essential raster asset or newly
reproduced runtime defect was established in this review.** The strongest visual opportunity is
the standard arena floor: the baseline has dense, repetitive small panels; the existing optional
kit offers calmer large surfaces but retains conspicuous broad seams. Compare it in sustained
motion before adoption. Another art batch is lower priority than that decision.

Fresh evidence at this checkpoint:

- All **41 browser regressions passed in 1.2 minutes**, using the current local served output.
  Coverage includes startup/recovery, Daily retry, offline/storage failure, remaps, build inspection,
  floor loaders, gallery pages, native settings/import/focus/controller simulation and 4K composition.
- Twelve new captures: all five settings groups at 960×540; baseline/kit combat, map and three hero
  galleries at 1920×1080; a deuteranopia/HUD 1.2/radar 1.25 stress diagnostic at 3840×2160.
  No page errors were recorded. [Evidence and exact routes](playtest-evidence/2026-10-21-followup-review/README.md).
- Source review checked native-control layout/ownership, grouped settings, actual hero review routes,
  existing teaching diagrams and the asset/consumer inventory. Art inventory numbers are the retained
  16 October report, **not a freshly regenerated filesystem census**.

The captures use headless Chromium, DPR 1 and brief simulated input. The baseline/kit share seed and
route settings but are not frame-synchronized recordings. The stress rack is diagnostic, not an
earned build. This does not validate complete runs, balance, audio, real screen readers/controllers,
native display scaling, performance, all animations or Steam. Unit/host/portfolio suites were not
rerun for this documentation-only review; their earlier results remain dated evidence.

## Confirmed limitations versus risks

| Classification | Finding | Treatment |
|---|---|---|
| Confirmed limitation | Native semantic controls cover title/menu/settings; help, records, armory, hero/threat selection, map, debrief and combat remain canvas consumers. | Finish actual assistive-technology acceptance of the existing slice first; scope further screens individually. No whole-game accessibility claim. |
| Visual observation | Baseline floor repeats fine square plates; optional kit replaces these with large panels and broad dark joints. | P1 comparison and accept/revise/reject decision. Appearance alone does not prove unfairness or justify changing the default. |
| Review risk | Twelve diagnostic weapons crowd the hero; first-drop guidance occupies a large upper-left area. | Review earned mixed/bonus-slot racks and record an obscured tell before attachment or prompt changes. Existing normal-rack evidence did not establish a defect. |
| Acceptance gap | Static Marine/Medic/Assault galleries show the requested identities, but do not establish transition/anchor quality in combat. | Record frame/state/facing and real motion for LB-04; repair registration before repainting. |
| External dependency | Fresh desktop executable, named-hardware pacing, Steam client access and live dashboard evidence remain absent from this audit. | Use existing owner handoffs; do not turn browser success into release acceptance. |

Delivered gallery sizing/pagination/hero selection, menu semantics, 4K composition and stale asset/audio
comments are closed implementation tasks. Do not recreate them. Teaching diagrams are already
code-native in `ShellScene.renderHowToPlayDiagram`; historical placeholder wording is not a reason
to commission new diagram images. Review their instructional accuracy with players instead.

## Priority and concrete work packages

P0 means crash/save-loss/progression/input dead end; none reproduced here. Any demonstrated P0
interrupts this order. P1 protects comprehension, fairness or acceptance; P2 is targeted polish;
P3 is conditional content. Effort below describes the scope, not a promised schedule.

| Order / ID | Work and reason | Owner / prerequisite | Completion evidence |
|---|---|---|---|
| 1 — P1 ACCEPT-02 | Complete existing Runs 1–5, including first-drop prompts, damage attribution, Quick/Daily/Expedition identity, map confirm flow and repeated play. | Mark/assigned human; current local build, protected save, real controller/audio. One existing matrix, no new test program. | Worksheet with build/input/hardware/loadout, confusion and fairness findings; each S1/S2 issue fixed or explicitly accepted, affected combination repeated. |
| 2 — P1 ART-01 | Compare baseline, pilot A/B and kit on fixed standard-theme seed 61061; inspect seams, decorative collision cues, pickups and hostile projectiles in motion. | Human visual review; named hardware for pacing comparison. Existing assets only initially. | 1080p/4K, grayscale/CVD, sparse/dense clips and accept/revise/reject decision. Keep default until accepted. If seams fail, first adjust placement/contrast; repaint only the named failing tile. |
| 3 — P1 ART-02 / LB-04 | Review Marine, Medic and Assault body/helmet/equipment through each implemented facing and idle/move/dodge/hit transition; add other unlocked heroes to their run. | Human motion evidence using corrected gallery plus production combat; preserve existing frame maps. | Failed frame/state/anchor displacement, minimal pivot/layer fix, before/after clip at logical 960×540 and 1080p/4K; repaint only if registration cannot solve it. |
| 4 — P1 CLARITY-01 / LB-07 | Review earned 3/4-weapon and bonus-slot builds, hostile tell priority, first-drop panel occlusion, and all nine map node meanings/states. | Observed play with exact weapon IDs and damage source. Twelve-weapon diagnostic alone does not open a defect. | Tester identifies safe lanes, danger, reachable/selected/armed/cleared/closed nodes and confirm-twice flow without coaching. Fix layering/opacity/spacing/labels first; preserve simulation radii/timing and weapon mechanics. |
| 5 — P1 ACCESS-01 | Operate title → menu → every settings group → back with actual screen reader and physical controller; test import cancel/error, export/privacy, resize and return focus. | Human AT/controller access. Existing implementation is ready to assess. | Names, states, group selection, focus/order, single activation and value changes verified; screen/control-specific failures returned. Then choose one further shell screen per scoped change. |
| 6 — P1 PERF-02 | Fresh package, 15-minute dense sessions, focus/resume, display transitions and offline/save recovery. Measure before optimizing. | Claude packages; hardware tester supplies GPU/driver/display/DPR/Windows scaling; Steam owner supplies real access. | Package manifest/hash + smoke log; p95/p99/hitches/memory with measurement method at Full HD/4K, ultrawide/Deck shape; actual client checks. Agree numeric hardware thresholds after baselines. |
| 7 — P2 AUDIO-01 | Listen to warning → attack → hit → outcome with multiple weapons, low/normal volume, pause/restart and mute changes. | Human listening result; existing production samples first. | Named inaudible/repetitive/stacking cue; mix/ducking/rate adjustment or one missing cue, then repeat by ear. Do not add inert bus sliders or a soundtrack collection. |
| 8 — P2 UX-01 | If comprehension fails, add concise selected-mode purpose/help, clarify effect costs and improve specific teaching pages. | Observed missed action/meaning; catalogue and remappable bindings remain authoritative. | Player explains mode, action and consequence unaided; minimum-viewport/4K fit and pointer/keyboard/controller parity. Avoid adding menu items or extra permanent HUD panels. |
| 9 — P2 LEARN-01 | One replayable move/aim/evade/hazard/inspect practice sequence, only for repeated learning difficulty. | Observed learning gate and scoped approval under standing plan. | Reuse production simulation/input/arena, immediate exit/repeat, no Career/Daily/achievement/outcome contamination; confused action becomes repeatable without coaching. |
| 10 — P3 VARIETY-01 | One encounter variation in an existing region if repetition is demonstrated. | Observed runs plus two weeks of verified live measurement, measurement start date recorded. | Reuse roster/art, review route first, distinct pacing/spatial objective, safe paths, compatible rewards/saves and repeat fairness review before production selection. |

## Asset and animation production decisions

| Family | Recommendation now | If evidence opens a production task |
|---|---|---|
| Arena backgrounds/floors | Review the completed eight-tile/four-decal kit; retain current default. Highest potential visual return. | Repair named seam/material issue, retain world scale and deterministic placement. Organic/toxic floor extension follows acceptance of one region. |
| Decals, obstacles and props | Reuse existing scuffs/cracks/stains/debris and authored world objects; control frequency and contrast. | Generate only a missing subject/material with a real consumer. Decorative marks must not imply damage, loot or collision. |
| Hero sprites and overlays | Retain bodies, portraits and helmet/breach sources. Static galleries do not justify regeneration. | Correct frame anchor/pivot/layer first, then replace only failed frames against the approved silhouette/facing. No blanket sheet regeneration. |
| Hero animations | Prioritize continuity and action readability over extra frames. | Repair a demonstrated pop, slide or missing cue within the actual state map; verify transitions in combat, not just contact sheets. |
| Enemy/boss sprites and animations | Retain roster and art. Review wind-up, attack, hit and death distinction during real encounters. | Fix a failed tell first; retain hit geometry and timing. Cosmetic elite variety stays P3. |
| Weapons/equipment/pickups | Retain dedicated shipping identities; compare at HUD/shop size and in earned racks. | Layout/silhouette/contrast fixes before new art; replacements name exact catalogue ID and runtime binding. |
| Hazards/projectiles/VFX | Reuse six existing families; persistent hazard shape/hatching remains code-owned. Review retained H1/O2/O2B/O3 sources before commissioning. | Prioritize hostile warnings over friendly effects; tune opacity/layers/counts first. At most one four-frame pilot per failing family under existing Patch A cap; no forced six-family batch. |
| Transformations | Existing affinity indicator, commitment warning and inspection already explain shipping rules. | One missing consequence/readability cue, derived from catalogue; no art implying an unimplemented mechanic. |
| Map icons, HUD and teaching diagrams | Keep symbols, badges, focus, labels and diagrams in code. Existing map and settings are legible in sampled views. | Add label/legend/spacing or teaching clarification for an observed misunderstanding. Raster icons are not the default solution. |
| Menus, portraits, chrome | Retain art and current hierarchy. No missing background demonstrated. | Fix named crop/contrast/spacing at supported layouts. Keep titles and controls outside bitmaps. |
| Audio/music | Reuse production cues; listening is required. | Target one demonstrated gap after mixing existing samples; separately justify any music scope. |

Every generated/repainted asset needs: named failed consumer/frame, brief/reference, prompt/version,
untouched master, transparent source where applicable, deterministic extraction, frame map/pivots,
optimized derivative, manifest binding, native-size/motion comparison and rollback. Follow canonical
shared-source direction where applicable. Retain unmapped masters; absence from a manifest is not
proof they are unused. No image generation was performed in this audit.

## Modes and release sequence

Keep Daily, Quick Drop and Expedition as the production entry choices. Confirm their purpose,
retry/date/progression differences with players before changing copy. Keep LAB/diagnostics gated.
Practice is the first conditional addition; one existing-region encounter variation is second.
New heroes, regions, Threat Tiers 3–11, multiplayer, leaderboards and touch gameplay remain outside
this polish scope. A portrait screenshot does not demonstrate a need to promise touch support.

Execute observed acceptance first, turn each failure into a small code/art task, and retest that
combination. Runtime changes require relevant regressions, rebuilt generated web output/identity,
the full game verifier and portfolio guards. Documentation alone does not require rebuilding.
Then Claude packages the accepted checkpoint and named testers supply hardware/Steam evidence.
For browser publication, obtain the specific authorization required by CURRENT-PLAN, review the
whole outgoing nested-repo range and verify served identity/offline upgrade after deployment.
Dashboard owner must verify receipt/settings and measurement start before the two-week gate.

The concrete external handoff is the [acceptance worksheet](ACCEPTANCE-WORKSHEET-2026-10-17.md),
[QA operator guide](QA-READINESS.md) and [release handoff](RELEASE-HANDOFF-2026-10-16.md).
Return clips/screens with exact build, state, input, hardware and asset IDs; for packaging also
return the executable hash and package manifest. No new diagnostics tool, production packaging,
push/deploy or content implementation is implied by completing this review.
