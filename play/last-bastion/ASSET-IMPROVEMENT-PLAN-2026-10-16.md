# Last Bastion — Full HD and 4K asset/improvement patch proposal

**Date:** 16 October 2026
**Status:** Patch A implementation delivered locally; visual/hardware acceptance remains open. This plan answers the request for the
next asset/content patch; it does not authorize deployment or declare existing manual gates closed.
**Recommended theme:** clearer combat, less repetitive arenas, stronger character registration,
and more understandable build progression. Preserve the established modern pixel-art identity.

## Evidence and corrections to older plans

- The 15 October standard-arena capture shows a repeated high-frequency square floor across
  almost the entire playfield. A 12% wash is implemented, but subdued variation and fewer strong
  seams are better next candidates than another layer of global darkening.
- `dev/src/game/rendering/DisplayPresentation.ts` preserves the 960×540 simulation composition.
  At DPR 1, Full HD is exact 2× and 4K exact 4×. High-DPI desktop scaling changes the relationship
  between window/CSS pixels and physical pixels; acceptance must record both.
- `MarineHelmetRegistration.ts` currently compensates for source mismatch using per-pose
  offsets and a 0.55 scale. Review the corrected motion first; only replace frames that still fail.
- Historical July asset notes are not a live inventory. `weaponCatalog.ts` currently sets
  `HELD_WEAPONS_IN_POOL = true`; do not propose releasing that pool as new work. Object placement
  and runtime modules also exist now. Trace manifest → loader → renderer → reachable encounter
  before classifying any asset as missing, unused or ready to integrate.
- O2/O2B hazards, O3 interactions/objectives, H1 weapon bodies/effects and item candidates already
  have retained source assets. Evaluate those before regenerating equivalents.
- The 3 October headless resolution preflight recorded poor 4K pacing. It explicitly is not a
  hardware verdict. Native 4K at 60 fps remains a target to validate, not an established claim.

Sources: [art bible](last-bastion-art-bible.md), [historical asset review](archive/asset-next-production-review-2026-07-26.md),
[presentation register](presentation-defect-plan-2026-08-23.md),
[resolution preflight](performance-reports/2026-10-03-resolution-preflight.md),
[current plan](CURRENT-PLAN.md). Inspect current code when these documents disagree.

## Display and asset contract

| Surface | Recommended contract |
|---|---|
| Gameplay | Preserve 960×540 simulation layout and field of view at both resolutions. Do not grant 4K a larger visible arena. |
| Pixel sprites | Keep coherent pixel clusters and nearest sampling where appropriate. A 96px logical cell occupies up to 384 physical pixels at exact 4×; it does not automatically need 384px of finer detail. |
| Source masters | Preserve original generated/painted source and alpha extraction. For newly repainted 96px-cell assets, aim for at least 384px per source cell where useful; for 128px cells, 512px. Never relabel an enlarged runtime derivative as a detailed master. |
| UI/text | Render typography, numbers, focus rings, meters and collision/telegraph boundaries in code at correct display density. Keep text out of generated art. |
| Portraits/key art | Size to the largest actual on-screen rectangle, not an arbitrary “4K” label. Derive web sizes from the approved source, preserving composition. |
| Atlases | Pilot at no more than 2048×2048 per runtime atlas, then profile. Split by scene/family; query hardware limits. This is a proposed budget, not a new engine limit. |
| Texture memory | Track decoded GPU allocation separately from download bytes. A 2048² RGBA texture is roughly 16 MiB before mipmaps/overhead; 4096² is roughly 64 MiB. WebP compression does not make the decoded texture correspondingly smaller. |
| Other aspect ratios | Preserve existing fit/frame behavior without stretching or clipping. Full HD and 4K 16:9 are primary; Deck/ultrawide remain regression checks. |

## Patch A — ship-worthy visual polish (recommended first)

### A0. Establish the asset baseline and capture set

Deliver an inventory recording asset ID, source path, runtime derivative, frame dimensions/count,
logical display size, pivot/anchors, alpha bounds, loader and reachable gameplay use. Label entries
reuse / repair / replace / unused candidate. Derive catalogue counts from code.

Capture the same seed, hero and settings at 1920×1080 and 3840×2160: title, each hero dossier,
map, quiet combat, dense combat, boss telegraphs, level-up, populated build/affinity pages and
debrief. Capture individual frames and motion. Keep effects and floor comparisons deterministic.

**Exit:** no planned generation duplicates an already suitable asset; every replacement names its
failing frame/surface and runtime consumer. Record baseline download, texture memory and pacing.

### A1. Standard-arena floor pilot — highest visual return

**Generate/paint:** one coherent kit with 8 floor variants and 4 restrained surface decals.
Start with a 2-tile/1-decal pilot before completing the kit. Use the existing floor tile dimensions
and alignment contract established in A0; do not change world units to fit the art.

Suggested tiles: clean service panel, worn panel, broad plate, subtle patched plate, cable-channel
panel, vent-edge panel, recessed joint and scuffed panel. Decals: scuff, fine crack, stain and small
inert debris. Variation must not suggest collision, an interactable, loot or a damaging surface.

Art direction: navy/charcoal industrial materials, broad quiet surfaces, sparse teal/orange accents,
less contrast at seams, consistent top-down perspective and lighting, seamless edges. No text,
logos, baked shadows of actors, bright loot-like dots or decorative hazard rings.

**Code:** deterministic weighted variation and restrained decal placement; avoid obvious repeats,
retain collision and safe lanes, and keep hazard rendering above the floor. Compare tile-only,
current wash and reduced-wash treatments. Do not approve merely because a contact sheet looks rich.

**Exit:** enemy bullets, ground hazards, pickups and player silhouette remain distinguishable in
motion on both resolutions and in grayscale/colour-vision modes. No newly implied obstacles.
If accepted, expand the same process to one existing organic/toxic region in a later patch.

### A2. Character and equipment registration repair

**Reuse first:** existing body/helmet masters, pose metadata and runtime registration. Review all
playable heroes; Marine is the first pilot because it has a documented source mismatch.

**Conditional generation/paint:** replace only failed Marine overlay frames, up to the existing
12-frame contract, matching the approved body silhouette, facing order, pose and head anchors.
Generate a reference/contact sheet first; assemble and correct a production sheet deterministically.
Do not assume a generated sprite sheet has consistent pivots or frame-to-frame anatomy.

**Code:** explicit frame anchors and a repeatable body/overlay gallery; retain old source and
rollback mapping. Avoid increasing character size to compensate for weak artwork.

**Exit:** no floating visor, head jump, fringe, clipping or weapon/body overlap through idle,
movement, dodge and hit poses at logical size and native 1080p/4K. Check moving frames, not just stills.

### A3. Weapon and hazard effects readability pass

**Reuse first:** H1 and O2/O2B masters and current effects. Audit six visual families: kinetic,
energy/arc, cryo, fire, acid/toxic and void/gravity. This is a review list, not six new mechanics.

**Conditional replacement:** at most one four-frame pilot strip per failing family (24 frames
maximum for this patch), keeping its current timing/anchor contract unless a measured defect
requires a change. Prefer a smaller accepted batch over forcing all six replacements.

**Code:** prioritize hostile telegraphs over friendly spectacle, preserve tell duration/radius,
keep friendly and hostile silhouettes distinct, and cap particles/overdraw through the existing
quality system. Shapes and motion must carry meaning when colours are hard to distinguish.

**Exit:** no effect hides imminent damage, conflates friendly/hostile attacks, flashes despite
reduced-flash settings or changes collision perception. Compare single-weapon and dense loadouts.

### A4. Map, build and transformation clarity — mainly code

- Keep map node symbols, state badges, focus outlines, route lines and labels code-native. Existing
  node pictograms should be reviewed before adding raster icons. Strengthen selected/cleared/locked
  states through shape, outline and spacing; do not use colour alone.
- Add a compact optional in-combat affinity indicator tied to existing model values, with “next
  choice commits” at the relevant threshold and an inspect action. It must fit the HUD safe area
  and respect HUD scale. The current build inspection already exposes thresholds; do not rebuild it.
- Populate QA fixtures with long weapon/relic names and several path exposures. Verify pages,
  input hints and controller focus at both resolutions.
- Consider a concise Codex explanation of already-shipping effects and transformation consequences;
  derive names/rules from production catalogues. Do not advertise unimplemented path mechanics.

**Exit:** a player can identify their active path, current affinity and consequence of the next
choice without reading debug labels. No extra HUD element covers enemies or telegraphs.

### A5. Full HD/4K performance and presentation gate

Set the target hardware tiers before claiming support. Proposed target is stable 60 fps at each
resolution on its declared tier (16.7 ms frame budget), with actual p95/p99, hitches and GPU/texture
measurements reported. A numeric release threshold must be agreed after hardware baselines;
headless results do not establish it.

Test native full-screen/windowed output, DPR 1 and Windows 125/150/200% scaling combinations,
resize/monitor changes, pause/resume and 15-minute dense-combat sessions. Separate simulation CPU,
render CPU and GPU/overdraw bottlenecks. Reject unexplained regressions against matched baselines.

Prefer optimizing effect counts, layers, atlas residency and allocations before compromising
readability. If an optional lower world-render quality mode is needed, label it accurately and keep
HUD/text native; never silently present upscaled output as native 4K rendering. Preserve a native
4K option where hardware sustains it.

## Patch B — small content addition after Patch A acceptance

**First recommendation: replayable combat practice.** Reuse an existing arena, production input,
weapons and simulation. Teach move/aim, dodge, hazard tells and build inspection in a short sequence.
Expose it on demand, let players exit immediately, and exclude it from progression, Daily records,
achievements and live outcome metrics. Use code-native targets/prompts unless a genuine visual
need emerges. Success: players can repeat the relevant action without risking an expedition.

**Second recommendation: one existing-region encounter variant.** Choose only after observed runs
identify weak variety. Reuse accepted environment art and enemies; prototype a different spatial
objective or pacing pattern behind a review route. Validate safe lanes, fairness, rewards and saves
before adding it to production selection. Do not add another region to house a single encounter.

**Later:** one distinctive elite variant or a targeted audio/VFX response set if the observed runs
show weak encounter identity. A new hero costs a full mechanics, portrait, animation, equipment,
audio, UI, progression and balance package; it is not a low-cost next asset batch.

## Production handoff and acceptance

For every generated/repainted family retain: named brief, approved references, exact prompt and
version, untouched source, clean transparent master where applicable, extraction/normalization
script, atlas/frame map, pivots, runtime derivatives, manifest binding and comparison captures.
Art must remain original and consistent with the SnackPack/Last Bastion identity. UI labels and
status text stay in code. No asset is “done” until it is exercised through a real runtime consumer.

Order: A0 baseline → A1 small floor pilot → A2 registration repairs → A3 effects pilots → A4 clarity
→ A5 hardware acceptance. A5 baseline measurement begins in A0 and is repeated after each batch.
Each batch is independently reviewable/revertible; do not accumulate an untested art dump.

Automated gates: relevant manifest/frame/boundary tests, image audit, typecheck, full game verifier,
published-output and offline checks, then required portfolio guards. Visual gates: matched native
captures, motion, physical controller and audio review, grayscale/colour-vision/reduced-flash modes.
Carry unresolved evidence into CURRENT-PLAN.md; do not close LB-04/LB-07 just because assets exist.

## Suggested scope decision

Approve Patch A as a capped polish program, starting only with A0 and the floor pilot. Reuse existing
art wherever possible. Keep new regions, heroes, large asset collections, global retexturing and
multiplayer/leaderboards out of this patch. Patch B is the next proposed content investment after
observed play supports it. The initial planning pass generated no assets. The accepted implementation now includes two floor sources and a transparent scuff candidate; see the progress record below.

## Implementation progress

17 October follow-through: retained baseline/A/B/kit/map/stress captures reviewed, normal-rack
diagnostics added and shell accessibility contracts inventoried. See the
[archived checkpoint](archive/CONTINUATION-REVIEW-2026-10-17.md) and
[acceptance worksheet](ACCEPTANCE-WORKSHEET-2026-10-17.md). No named failed registration frame,
normal-loadout readability failure or floor-adoption evidence was established; no new art or
runtime change follows from this preparation. Motion/hardware gates remain active.

- [x] Generate a reproducible 213-entry runtime-manifest inventory and document confirmed consumer traces.
- [x] Generate two floor candidates and one transparent decal with retained sources and exact prompts.
- [x] Bind an opt-in A/B combat route, isolated loading, broad material repeats and deterministic decals.
- [x] Capture baseline and both candidates at Full HD and 4K.
- [x] Extend inventory to 227 unique definitions and list 1,328 unmapped sources; record reuse/review dispositions and alpha bounds. Historical reachability is not inferred from references.
- [x] Produce reproducible optimized runtime derivatives; keep new floors opt-in.
- [x] Expand direction B to an eight-tile/four-decal review kit with deterministic weighted placement.
- [x] Retain current character/helmet registration and masters: no specific failed frame established for repainting. Motion sign-off remains open.
- [x] Reuse current effects and hazard art; reduce pooled effect opacity and honour Reduced Flash without changing hazard geometry/timing.
- [x] Implement persisted optional affinity HUD, threshold warning, inspect action and catalogue-backed boon/cost explanations.
- [x] Add map focus brackets, armed READY label and closed-route badge; paginate wrapped build copy and fit combat settings rows.
- [x] Include optimized assets in published web output and update release documentation. Desktop packaging remains a separate release task.

Practice and encounter variants remain later Patch B scope, contingent on observed play.
The completed implementation checkpoint is archived in `archive/ASSET-PATCH-A-IMPLEMENTATION-2026-10-16.md`.
This document retains the asset specifications; CURRENT-PLAN.md alone queues motion/hardware
acceptance and any resulting corrections. Completed steps above are historical. No claim
is made that every historical candidate has a proven runtime consumer or that 4K60 is established.
