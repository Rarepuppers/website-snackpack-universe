# Last Bastion — presentation defect plan and playtest-gate revision

**Created:** 23 August 2026
**Trigger:** first creator-observed local run against `local-playtest-plan-2026-08-21.md`.
**Status:** plan only. No code, no art, no doc-index change has been made yet beyond this file and
the evidence folder in §9.

This document does three things:

1. Reviews `local-playtest-plan-2026-08-21.md` against what the first observed run actually produced,
   and revises the gate (§1).
2. Turns the ten reported findings into a defect register with **verified root causes at file:line**,
   a code/art split, a test, and an acceptance line each (§3–§4).
3. Recommends the expansions the findings imply — three systemic fixes, two new player-facing
   systems, and five Codex asset batches (§5–§8).

---

## 1. Review of the current playtest gate

### What the gate got right

- Running five *observed* runs before expanding Threat Tiers 3–11 was correct, and this first
  session already proves it: the run produced ten defects, none of which any automated check in
  `npm run verify` could have caught.
- Making art regeneration conditional on a *named* local-test failure was correct. Five of the ten
  findings are exactly that named failure, so the conditional gates in the plan's "Asset
  regeneration and expansion decisions" section have now fired legitimately. Batches in §8 below are
  earned, not speculative.
- The readiness baseline was honest: it claimed the build was ready for *local gameplay and balance
  testing*, not release. That claim survives. Nothing found is a crash, a save loss, or a
  simulation defect.

### What the gate structurally missed — and this is the important part

**Every single one of the ten findings is a presentation defect, and the gate has no lane for
presentation defects.** Its five-run matrix asks systems questions ("is the elite patrol
understood", "is the reward meaningful", "does frame pacing hold"). Its evidence table has exactly
one catch-all row — *"Frame hitch, input loss, audio issue, or layout defect"* — into which all ten
of these would have been crammed as a single line of prose. Its pass thresholds mention comprehension,
fairness, input dead ends, and console errors, and say nothing about whether the game *looks
finished*.

The result is a gate that would have let a run "pass" while the player could not see their own
bullets, could not tell what a pickup did, and watched the title text hang out of its own frame.

Three further structural problems:

- **No defect identity.** The plan records observations as prose per run. There is no defect ID, no
  severity, no owner (code vs art), and therefore no way to say "run 3 re-tested LB-04". Ten findings
  in one session is already past the point where prose scales.
- **The first run is treated as a data point.** It is not. The first observed run of any build is a
  shakedown that surfaces the backlog of everything nobody has looked at in months. Counting it
  toward "4 of 5 runs must reach the intended tier modifier" pollutes the sample, because the player
  spends the run noticing defects instead of playing.
- **No display matrix for the shell.** The matrix varies display resolution per run for *combat*,
  but every finding here is in the shell, map, and overlays — and finding LB-09 (blurry text) is
  precisely a display-scale defect in those screens. The matrix never asks anyone to sit on the
  menu at 4K and read it.

### Recommended revision to the gate

Replace the single evidence table with **two lanes that gate independently**:

- **Lane A — systems evidence.** The existing five-run matrix, evidence fields, and pass thresholds.
  Unchanged. Gates Threat Tiers 3–11, dailies, leaderboards, and permanent progression.
- **Lane B — presentation acceptance.** A defect register (§3 is its first entry set) with IDs,
  severity, owner, and per-screen sign-off at 960×540, 1920×1080, and 3840×2160. Gates *any* public
  build, paid or free, and gates the Steam store screenshots outright.

Concrete edits to `local-playtest-plan-2026-08-21.md`:

1. Add **Run 0 — shakedown**, explicitly not counted toward the five. This session becomes Run 0.
   Runs 1–5 restart after Lane B severity-1 and severity-2 defects are closed.
2. Replace the catch-all evidence row with five rows: *missing feedback*, *layout/overflow*,
   *art registration*, *text legibility*, *input affordance*. Those are the five classes this
   session actually produced; they are the classes a player notices.
3. Add to the pass thresholds: **"No open severity-1 or severity-2 presentation defect on any screen
   the run touched."**
4. Add a shell display row to the matrix: one run must sit on title → menu → character select →
   map → debrief at 3840×2160 and read every line of text before deploying.
5. State the defect-ID convention (`LB-nn`) and point at the evidence folder in §9 so screenshots,
   defects, and art briefs share one vocabulary.

---

## 2. Three systemic causes behind ten symptoms

Before the per-defect detail, the pattern matters more than the instances. The ten findings collapse
into four root causes, and fixing the causes prevents the next ten.

**C1 — Fixed-size chrome drawn around variable-length text.**
Panels, plates, and buttons are given hard-coded pixel sizes; the text inside them is measured
never. `ShellScene.renderMenu` draws a 330×62 header plate at a fixed position and then places the
title text top-left-anchored at the plate's *centre* line. `renderCharacterSelect` draws a 440×350
dossier panel and then lays perk tiles on a grid that runs past its bottom edge. The level-up
overlay gives every option a 66 px button and then writes two-to-three lines of 15 px text into it.
Causes LB-05, LB-06, and the unreported overlay clipping in §4.1.
**Fix class:** a measure-then-size layout primitive plus an automated overflow audit (§5.1).

**C2 — Text resolution is a combat-only concern.**
`uiTextResolution()` exists, is well documented in `rendering/DisplayScaling.ts:97`, and is called
from exactly five places: `PrototypeScene`, `CombatHud`, `CombatEventFeed`, `CombatPauseOverlay`,
and `FloatingDamageNumbers`. `ShellScene`, `ExpeditionScene`, `RunSummaryScene`,
`EncounterEventScene`, `ExpeditionEventScene`, `TransformationDecisionScene`, and
`AssetGalleryScene` each define their own private `text()` helper that never sets it. With
`pixelArt: true` (`config.ts:15`) the nearest-neighbour filter then upscales a 1× glyph texture by
2× (Full HD) or 4× (4K). Causes LB-09 entirely.
**Fix class:** one shared text factory, enforced by a lint-style test (§5.2).

**C3 — Modular sprite overlays have no per-frame registration contract.**
The asset manifest gives each sheet a single origin pair — `sheet("marine-helmet-v1", …, 96, 96, 12,
0.5, 0.68)` — identical to the body sheet's. That is only correct if the helmet art is authored in
the exact position it occupies over each body frame. It is not: the overlay frames are isolated
heads centred in their cells, at a head scale larger than the body sheet's head. So the offset error
changes with facing and with the crouched evade row. Causes LB-04.
**Fix class:** a per-frame anchor table in the manifest, or re-registration of the art (§4.4 — the
art fix is the right one).

**C4 — Simulation events with no presentation handler fail silently.**
`CombatSimulation` emits a discriminated union of combat events. `PrototypeScene.playCombatEvents`
switches over it, and unhandled members simply produce nothing — no compiler error, no test failure.
`supply-chest-opened` and `supply-chest-destroyed` (`CombatSimulation.ts:870–871`) have no case at
all. `projectile-impact` (line ~1477) handles three weapon IDs out of thirty-four. Causes LB-03 and
half of LB-01.
**Fix class:** an exhaustiveness test over the event union (§5.3). This is the highest-value item in
this document, because it converts a whole class of "the game gave me no feedback" bugs into build
failures.

---

## 3. Defect register

Severity: **S1** = the player cannot tell what the game is doing; **S2** = visibly unfinished;
**S3** = polish. Owner: **code** = Claude, **art** = Codex, **both** = code lands the wiring, art
lands the pixels.

| ID | Finding | Sev | Owner | Root cause verified at |
|---|---|---|---|---|
| LB-01 | No visible bullets from the Marine's default gun — and from 9 other weapons plus all turret fire (§4.1a) | S1 | both | `PrototypeScene.ts:3572`, `:3600`, `:3618`, `:3524`, `:1435`, `:1477` |
| LB-02 | Cannot inspect a collected power-up (name + description) | S2 | code | `PrototypeScene.ts:1365`, `CombatHud.ts:163` |
| LB-03 | Opening a crate gives no animation and no reward readout | S1 | both | `PrototypeScene.ts:4811`, missing case for `CombatSimulation.ts:870` |
| LB-04 | Separate helmet is oversized and off-head, varying by facing | S1 | art | `GameAssetManifest.ts:530–531`, `PrototypeScene.ts:374`, `:1077` |
| LB-05 | "LAST BASTION" sits outside its menu container | S2 | code | `ShellScene.ts:346–347`, `:775` |
| LB-06 | Character-select perk tiles overflow their container | S2 | code | `ShellScene.ts:689`, `ScreenFlow.ts:192` |
| LB-07 | Map screen is low quality and has no node icons | S2 | both | `ExpeditionScene.ts:363–390`, `:310` |
| LB-08 | Map nodes cannot be hovered for info; clicking commits instantly | S1 | code | `ExpeditionScene.ts:407–411` |
| LB-09 | Menu text is blurry at Full HD and 4K | S1 | code | `ShellScene.ts:775` + six sibling scenes; `DisplayScaling.ts:97` |
| LB-10 | Screenshot evidence has nowhere to live | — | process | §9 |
| LB-11 | *(found during this review)* Level-up card text overflows its card and collides with the hint line | S2 | code | `PrototypeScene.ts:5225–5235`, `:5245` |
| LB-12 | *(found during this review)* Dead `NODE_GLYPHS` table; only the ASCII fallback ever renders | S3 | code | `ExpeditionScene.ts:45` vs `:387` |

---

## 4. Per-defect detail

### 4.1 LB-01 — the Marine's rifle fires nothing you can see

**Verified cause.** Three independent gaps stack:

1. Marine's starting weapon is `bastion-service-rifle` (`hero/marine.ts:54`). In `syncProjectiles`
   the authored-projectile lookup is a long weapon-ID ternary that ends in a shared fallback:
   `{ texture: "combat-effects-v1", frame: 6, scale: 0.3 }` (`PrototypeScene.ts:3600–3603`). Frame 6
   of `batch-a/combat-effect-atlas-v1.png` is the generic thin tracer, and at 0.3 of a 64 px cell it
   is roughly **12 × 3 simulation pixels** of dark orange on a dark brown floor.
2. The per-frame `setScale` chain immediately below (`:3618–3623`) does not list
   `bastion-service-rifle` *or* `marauder-ar`, so both fall to `0.3` — the marauder's own authored
   `scale: 0.42` is silently discarded one line after it is chosen.
3. At 20 m/s × 32 px/m the projectile advances ~10.6 px per 60 Hz frame, which is close to its own
   drawn length. So it reads as intermittent flecks rather than a stream. The muzzle flash falls to
   a generic atlas frame (`:1435–1445`) and `projectile-impact` (`:1477`) has weapon-specific cases
   for only `injector-carbine`, `bulwark-rotary-cannon`, and `marauder-ar` — so the rifle has no
   identity at either end of the shot either.

   *Correction to an earlier reading:* the service rifle is **not** impact-less. Every damage
   application emits `enemy-hit` (`CombatSimulation.ts:9051`), which draws the generic spark at
   `PrototypeScene.ts:1452`, and `projectile-blocked` is handled at `:1723`. So hits do register
   visually; what is missing is weapon identity, not all feedback. This narrows the fix: the tracer
   is the blocking problem, the impact is polish.

### 4.1a How far LB-01 spreads — audited, not assumed

The fallback at `:3603` is not Marine-specific. It catches **every weapon ID absent from the
eight-entry ternary**, and the per-frame `setScale` chain at `:3618` catches a different, smaller set
— which is why the Marauder's authored 0.42 is discarded.

**Player weapons that spawn projectiles (18 of 34; the rest are beam, orbit, or melee):**

| Dedicated projectile art (8) | Generic 12×3 px fallback (10) |
|---|---|
| `marauder-ar` *(scale bug: 0.42 authored, 0.3 applied)* | `bastion-service-rifle` — **Marine's starting weapon** |
| `bolt-carbine` | `railspike` |
| `injector-carbine` | `seeker-swarm` |
| `bulwark-rotary-cannon` | `corrosive-lobber` |
| `grenade-tube` | `scourge-repeater` |
| `event-horizon` | `hoarfrost-scatter` |
| `scattergun` | `tether-harpoon` |
| `arc-carbine` | `emberlance` |
| | `sentry-stake` *(turret payload)* |
| | `auxiliary-drone` *(internal)* |

So **more than half of all projectile weapons are affected**, including seven of the Batch 68
expansion weapons that just received dedicated 128 px identity *tiles*. Those weapons now look
distinct in the HUD, shop, and debrief, and fire identical invisible flecks in play — the identity
programme stopped at the tile and never reached the projectile.

**Other heroes:** only the Marine is hit at level 1. Assault (`marauder-ar`) is hit by the scale bug
but has real art; Medic (`injector-carbine`), Scout (`arc-carbine`), and Tactician (`event-horizon`)
all start on dedicated art. That is exactly why this surfaced as "the default marine gun" — but any
hero drafting a Railspike, Seeker Swarm, or Emberlance inherits it mid-run.

**Turrets and deployables: worse, on two counts.** `syncDeployables` (`:3524–3548`) draws the Sentry
Stake as a 12×15 rectangle plus a triangle and the Auxiliary Drone as a circle-and-diamond — raw
primitives, no art at all — and their shots carry `weaponId: stats.id`
(`DeployableProjectilePayload.ts:46`) into the same friendly projectile list, so they take the
generic fallback too. A deployed turret is an unrendered box firing invisible rounds.

**Enemies: not affected — and the asymmetry is itself a finding.** `syncEnemyProjectiles`
(`:3643–3686`) covers all five enemy projectile types: four dedicated sheets plus `slime-glob` on
`batch-b-effects-v1` frame 10. They render at scale 0.42–0.58 (≈27–37 px versus the player's ≈19 px
cell), at depth 710 versus the player's 700, and they are exempt from the 256-projectile soft budget
that culls friendly shots (`FriendlyProjectileBudget.ts:3`). Incoming fire is therefore bigger,
drawn on top, and never culled, while outgoing fire is smaller, underneath, and culled first. That
is backwards for a game where reading your own damage output is the core feedback loop, and it is
worth a deliberate decision rather than an accident of two independent code paths.

**Fix — code.**
- Replace the ternary chains at `:3588–3623` with a single lookup table keyed by `WeaponId`
  (`texture`, `frame`, `scale`, `haloRadius`, `trail`), consumed by both creation and per-frame
  update so a scale can never be chosen and then discarded. Every `WeaponId` must be present; make
  the table a `Record<WeaponId, …>` so a new weapon fails to compile without one.
- Give kinetic projectiles a short motion trail (2–3 ghosted positions, or a stretched quad along
  the velocity vector) so a fast projectile reads as continuous. Must respect
  `settings.reducedMotionEnabled`.
- Raise the default projectile halo from an opt-in behind `readabilityRims ||
  highContrastOutlinesEnabled` (`:3628`) to always-on at low alpha. Readability of your own bullets
  is not an accessibility extra.
- Add a `projectile-impact` fallback branch so every weapon produces a weapon-flavoured impact on
  top of the generic `enemy-hit` spark.
- Reconsider the friendly/enemy asymmetry from §4.1a: either raise friendly projectile scale and
  depth toward parity with enemy fire, or state deliberately that incoming fire is privileged and
  compensate with the trail and halo. Do not leave it as an accident.
- Give the deployables real presentation while in this file — a turret the player paid for should
  not be a rectangle.

**Fix — art.** Batch 85 (§8): a dedicated `bastion-service-rifle-effects-v1` sheet — muzzle flash,
tracer, impact spark, and one tracer-trail frame — matching the existing per-weapon effect sheets.
Then projectile art for the nine remaining fallback weapons in §4.1a, and a Sentry Stake / Auxiliary
Drone sheet. Scoped as batch 85 (rifle, unblocks the Marine) and 85b (the other nine plus
deployables) so the Marine fix is not held behind a ten-weapon batch.

**Test.** Unit-test the new table for total `WeaponId` coverage and for a minimum on-screen drawn
size at scale 1. Add a deterministic route `?scenario=projectile-visibility` that fires each weapon
class across the frame for gallery review.

**Acceptance.** On the Marine at 960×540 and 3840×2160, on both the darkest and lightest arena
themes, a continuous tracer stream and a per-shot impact spark are visible at 20 m range.

### 4.2 LB-02 — power-ups cannot be inspected

**Verified cause.** Collection shows a 1.2-second banner with name and duration
(`showPickupBanner`, `:1365`) and one line in the event feed. After that the only trace is a 30 px
HUD status chip in the tray (`CombatHud.ts:163`) carrying a two-letter abbreviation and a cooldown
ring. There is no hover handler on either the world pickup or the HUD chip, and no description text
is ever shown in combat — the descriptions exist only in the codex.

**Fix — code.** Two surfaces, one shared tooltip component:

- **World pickup:** on `pointerover` of a `powerupViews` entry, and on gamepad/keyboard when the
  player is within pickup radius, show a compact card near the pickup: icon, name, one-line effect,
  duration. Auto-shows on proximity so controller players get parity without a cursor.
- **HUD status chip:** on `pointerover`, and on a held inspect binding, show the same card anchored
  below the tray, with remaining seconds and stack count.
- The card must be a reusable `InspectCard` in `ui/`, because §4.8 needs the same thing on the map.
  Source the copy from a single `powerupCatalog` description field — do not duplicate strings into
  the presentation layer; the codex drift test should be extended to cover it.

**Fix — art.** None. The six dedicated power-up identities already exist
(`powerup-identity-atlas-v1`).

**Test.** Presentation unit test that every `PowerupType` resolves to a non-empty name and
description. Route: existing `?scenario=powerup-identity` gains hover assertions.

**Acceptance.** Every power-up in the lab can be identified without prior knowledge, by mouse and by
pad, before and after collection.

### 4.3 LB-03 — crates open into silence

**Verified cause.** Supply chests are code-drawn rectangles built inline in `syncSupplyChests`
(`:4811–4827`): a 28×20 body rect, a 5 px lid rect, an "E" prompt, and a damage bar. There is no
sprite, no open animation, and no destroyed state. `CombatSimulation` emits `supply-chest-opened`
and `supply-chest-destroyed` (`:870–871`) and **`PrototypeScene` has no case for either**, so the
only feedback is whatever `cueForCombatEvent` plays. The scrap itself arrives via `scrap-secured`,
which draws a small generic sparkle (`:1942`) and never states the amount. Experience, healing, and
weapon-chest grants each go down different paths with different (or absent) feedback.

**Fix — code.**
- Add cases for `supply-chest-opened` and `supply-chest-destroyed`: play the open animation, emit a
  burst, shake lightly, and raise a **reward toast**.
- Build one `RewardToast` component used by every grant path — scrap, experience, healing, power-up,
  weapon, relic, Command Marks. It stacks vertically at the grant position, rises, and fades over
  ~1.6 s; text is `+12 SCRAP`, `+5 HP`, `LAST STAND STIMULANT`. Colour follows the existing
  per-source palette, never colour alone — every toast carries its icon.
- Route `scrap-secured`, `elite-reward-collected`, `mini-boss-reward-dropped` and the experience
  pickup path through it so the whole game speaks one reward language.
- Honour `reducedMotionEnabled` (no rise, longer hold) and cap concurrent toasts.

**Fix — art.** Batch 86 (§8): a supply-chest sheet with closed / hit / opening (3–4 frames) /
open-empty states in both standard and armoured variants, plus a reward-burst effect. The chest is
currently the only interactive world object still drawn as raw rectangles.

**Test.** Event-coverage test (§5.3) makes the missing cases a build failure. Snapshot test for
toast text formatting per source.

**Acceptance.** Opening either chest variant produces a lid animation, a burst, a sound, and a
readable line naming exactly what was received, legible at 4K and during a 40-enemy wave.

### 4.4 LB-04 — the helmet does not sit on the head

**Verified cause.** `marine-base-v1` and `marine-helmet-v1` are both declared as 96×96, 12 frames,
origin `(0.5, 0.68)` (`GameAssetManifest.ts:530–531`), and the scene sets the same frame index into
both (`:1077–1078`). That is a valid contract *only* if the helmet art is painted at the exact head
position of the corresponding body frame. Inspecting
`art/production-tests/marine-bastion-helmet-overlay-v1-96.png` against
`marine-base-spritesheet-v1-96.png`: the overlay frames are isolated helmets drawn near the cell
centre at a head scale visibly larger than the body sheet's head, while the body sheet's head moves
per frame — higher and inset on the side-facing columns, and dropped/rotated on the evade row. Hence
"too large and not on the head, depending on direction".

**Fix — art (correct fix).** Batch 87 (§8): re-author the helmet overlay **registered to the body
sheet** — same 96×96 cell, same 12-frame order, helmet painted at the pixel position and scale it
occupies over each body frame, everything else transparent. Then the existing single-origin contract
becomes true and no code changes. Same treatment for `medic-helmet-v1` (20 frames) and
`assault-breach-overlay-v1` before they are reviewed.

**Fix — code (only if art cannot be re-authored).** Add an optional per-frame anchor table
(`dx, dy, scale`) to the manifest for overlay sheets, applied in `updateMarineFrame`. This is the
worse option — it hides an art defect behind twelve magic numbers per hero — and should be taken
only if Codex cannot re-register.

**Test.** Extend the existing art geometry/registration checks: for each overlay sheet, assert its
opaque bounding box per frame falls inside the body sheet's head region for the same frame. This is
mechanical and catches the whole class.

**Acceptance.** At 4× zoom in the gallery, all four facings × three states show the helmet seated on
the head with no silhouette overhang, for Marine, Medic, and Assault.

### 4.5 LB-05 — the menu title is outside its plate

**Verified cause.** `renderMenu` draws the header plate centred at `(220, 48)` sized 330×62 —
occupying y 17…79 — then draws the title with the shared `text()` helper at `(70, 48)`
(`ShellScene.ts:346–347`). The helper only calls `setOrigin(0.5, 0.5)` when `centered` is true
(`:775–790`), so this text is top-left anchored: its 28 px box runs y 48…82, i.e. its optical centre
sits ~17 px below the plate's centre and its descender hangs 3 px past the plate's bottom edge.
`renderHowToPlay` repeats the identical call at `:402`; `renderCharacterSelect` and the other
screens draw the same 28 px header at `(70, 48)` with **no plate at all**, so the screens are
inconsistent with each other as well.

**Fix — code.** Introduce one `screenHeader(title)` helper that measures the text, sizes the plate
to `textWidth + padding` with a minimum, and centres both on a shared baseline. Apply to all shell
screens so every header is identical. Remove the three hard-coded `(220, 48, 330, 62)` calls.

**Test.** Layout unit test asserting the text bounds are contained by the plate bounds with ≥8 px
inset on all sides, run over every shell screen title including the longest string.

### 4.6 LB-06 — perk tiles overflow the dossier panel

**Verified cause.** The dossier panel is drawn at `(660, 260)` sized 440×350 → x 440…880, y 85…435
(`ShellScene.ts:668`). Perk tiles are laid on a 5-column grid from `perkTilePosition`
(`ScreenFlow.ts:192`): `x = 495 + (i % 5) * 83`, `y = 380 + floor(i / 5) * 44`. With 10 perks in
`PERK_CATALOG`, row 2 lands at y 424 with a 38 px tile plus a 44 px selection ring — extending to
y ≈ 446, past the panel's bottom edge at 435, and into the roster rail drawn at y 470 (rail box
y 448…492). The perk name and description above (`:686–688`) are placed at fixed y 326/348 with a
390 px wrap, so a long description pushes into the tile grid as well. The screenshot shows exactly
this: the T0/T1/T2 tiles sitting on top of the TACTICIAN / SCOUT / DEPLOY row.

**Fix — code.** Give the perk grid its own bounded sub-panel with an explicit rect, computed from
the tile count rather than assumed: `rows = ceil(count / columns)`, panel height derived, roster
rail pushed or the grid scrolled if it will not fit. Cap the perk description to a measured line
count and clip with an ellipsis rather than letting it grow into the grid. Both this and §4.5 should
use the layout primitive from §5.1 rather than new one-off arithmetic.

**Test.** Assert every perk tile rect, at the maximum catalogue size (add a guard for future perks),
is contained by the perk panel and does not intersect the roster rail. This is the test that would
have caught it the day the 8th perk was added.

### 4.7 LB-07 — the map screen looks unfinished

**Verified cause.** Two separate problems the report correctly bundles.

*Node icons:* `renderNodes` (`:363–390`) draws a `Phaser.GameObjects.Arc` medallion plus a **single
ASCII character** from `SAFE_NODE_GLYPHS` (`*`, `+`, `W`, `?`, `E`, `M`, `S`, `L`, `B`). The richer
Unicode `NODE_GLYPHS` table at `:45` is **never referenced** (LB-12) — presumably abandoned after a
font-coverage failure. Objective badges and the cleared tick are likewise code-drawn text. The
scene's own header comment still says "Batch G2 replaces the medallion dressing later"; G2 never
arrived, so the placeholder shipped into the first observed run.

*Plate quality:* the region backdrop is a 1536×1024 plate drawn with
`setDisplaySize(WIDTH, 640)` = 960×640 (`:310–314`) at alpha 0.72 — a non-integer downscale of a
3:2 plate into a 16:9 frame, then upscaled 2× or 4× by the display layer with a nearest-neighbour
filter. Softness is guaranteed. The playtest plan already anticipated this and set the conditional
gate at 3840×2560; this run is the named failure that fires it.

**Fix — code.**
- Replace the glyph text with sprite medallions from the new icon set; keep the ASCII table as a
  hard fallback only when the texture is missing, and delete the dead `NODE_GLYPHS`.
- Keep every state (current / reachable / cleared / open / unreachable / focused) expressed by more
  than colour: icon, ring weight, and alpha, as today.
- Snap the backdrop to an integer-friendly size and letterbox rather than stretching, so the plate
  is never resampled at a fractional ratio.

**Fix — art.** Batch 88 (§8): 9 node medallion icons × the state set, plus route-line and
"current position" chrome, plus the six re-authored 3840×2560 region plates.

**Acceptance.** At 3840×2160 the map reads as an authored screen: node types identifiable without
the legend, route lines crisp, plate showing no softness or visible repetition.

### 4.8 LB-08 — map nodes cannot be previewed, only committed

**Verified cause.** Only nodes whose presentation is `reachable` get an interactive zone, and that
zone binds **`pointerdown` → `travelTo(node.id)`** directly (`:407–411`). There is no `pointerover`,
no confirm step, and no way to inspect a node the pointer is over. The keyboard/pad path is
different in kind: arrows cycle `focusIndex` (`moveFocus`, `:178`) and re-render the intel card, and
Enter commits. So the pad has a preview model and the mouse does not — and the mouse's single click
is irreversible.

**Fix — code.**
- Add `pointerover` / `pointerout` to the node zones, setting `focusIndex` to that node and
  re-rendering the intel card. This unifies the two input models: hover *is* focus.
- Make the mouse commit two-step, matching the pad: first click focuses, second click on the focused
  node deploys. Alternatively a small DEPLOY affordance on the focused node — but two-step is
  cheaper and matches the existing `?screen=map` keyboard contract.
- Extend interactive zones to **non-reachable but intel-visible** nodes so a player can scout the
  route ahead by hovering, without being able to travel there. This is the actual feature request
  behind the report.
- Reuse the `InspectCard` from §4.2 for the hover preview: type, region, threat, objective mode, and
  reward class. The existing intel card (`renderIntelCard`, `:427`) becomes its anchored variant.
- Preserve the existing backdrop preloading behaviour (`preloadLikelyNextBackdrop`) on hover, but
  debounce it — hovering across a column must not queue five texture loads.

**Test.** Route-level test that hover sets focus without mutating run state, and that a single click
on an unfocused node never advances `currentNodeId`. That second assertion is the one that protects
the player from a misclick eating a run.

### 4.9 LB-09 — blurry menu text

**Verified cause.** Not the monitor, and not 540p stretching per se — this is a text-rasterisation
defect and it is fully explained by the codebase. `DisplayScaling.ts` picks a whole device-pixel
scale N and sets `zoom = N / dpr` so one canvas texel covers exactly N×N physical pixels, and its
own doc comment states that text must then be generated at resolution N. `uiTextResolution()`
(`:97`) returns exactly that N. It is called from five combat-side modules **and nowhere else**.
Every shell, map, summary, event, transformation, and gallery scene defines a private `text()`
helper that omits it (`ShellScene.ts:775` is the archetype). With `pixelArt: true` and
`roundPixels: true` (`config.ts:15–16`), the 1× glyph atlas is then point-sampled up by 2× at Full
HD and 4× at 4K. Combat text is sharp; menu text is not. That matches the report precisely — the
player saw it in the menus.

**Fix — code.**
- Add a shared `createUiText(scene, …)` factory in `ui/` that applies the font stack, resolution,
  origin, and optional wrap, and re-apply resolution on display-scale change (there is already a
  `reapplyDisplayScale` hook to piggyback on; text resolution must be refreshed there or moving the
  window between monitors leaves stale glyph atlases).
- Delete all seven private `text()` helpers in favour of it.
- Add a **grep-style unit test** that fails if `add.text(` appears anywhere outside the factory.
  Without that test this regresses within two features.
- While there: pick one font stack. Shell uses `"Consolas, monospace"`, combat uses
  `"ui-monospace, SFMono-Regular, Consolas, monospace"`, overlays use
  `"Consolas, Courier New, monospace"`. Three stacks means three different fallbacks on a machine
  without Consolas.

**Acceptance.** Side-by-side capture of the menu at 1920×1080 and 3840×2160 before/after, plus a
check that a HiDPI laptop at 125% Windows scaling shows no resampling seam.

### 4.10 LB-11 — level-up cards clip their own text *(found in review, not reported)*

Visible in the reported screenshot even though it was not called out. Option buttons are fixed
66 px tall on an 86 px pitch (`PrototypeScene.ts:5190`, `:5185`), and the label is
`name\ndescription` at 15 px with a 520 px wrap, anchored at `y - 18` (`:5228–5235`). A description
that wraps to two lines makes three lines ≈ 60 px starting 18 px above centre, so the last line
crosses the card's bottom border — "aliens (Blaze)." is struck through by its own frame in the
screenshot. Compounding it, the hint line is pinned at a fixed `y = 138` (`:5245`) while the fourth
option's card spans y 60…126 and its wrapped text runs past it, so option 4 and the hint collide.

**Fix.** Same primitive as §5.1: measure the label, size the card to it, lay options out
sequentially from the measured heights, and place the hint below the *measured* stack rather than at
a constant. Cap descriptions at two wrapped lines at the catalogue level so a card can never grow
unbounded, and add a catalogue test for the length budget.

### 4.11 LB-12 — dead glyph table

`NODE_GLYPHS` (`ExpeditionScene.ts:45`) is unreferenced. Delete it as part of §4.7 rather than
leaving two competing sources of truth for node identity.

---

## 5. Systemic fixes to land before, or alongside, the individual defects

### 5.1 A measure-then-size layout primitive

A small module — `ui/Layout.ts` — providing: measure text; size a panel/plate/button to measured
content with padding and a minimum; stack children from measured heights; assert containment.
Everything in C1 becomes three lines instead of new hard-coded arithmetic. Land this **before**
LB-05, LB-06, and LB-11, or those three fixes become three more sets of magic numbers.

### 5.2 One text factory, enforced

As described in §4.9. The enforcement test is the point; the factory alone will not hold.

### 5.3 Presentation coverage for the combat event union — highest value item here

Add a test that enumerates every member of the `CombatEvent` union and asserts a presentation
handler exists (a case in `playCombatEvents` that produces at least one of: effect, toast, feed
line, sound, shake). Implement by driving a scene double with one synthetic event per type and
asserting the double recorded something. `supply-chest-opened` and `supply-chest-destroyed` would
have failed this on the day they were added. Every future event gets feedback or fails the build.

Do the same, more cheaply, for the weapon tables: `Record<WeaponId, …>` for projectile presentation,
muzzle flash, and impact so a new weapon cannot ship invisible.

### 5.4 A UI overflow audit in `npm run verify`

A headless pass that boots each shell/map/summary screen at 960×540, 1920×1080, and 3840×2160,
walks the display list, and fails on: text bounds outside their parent panel, overlapping
interactive rects, and any text object whose resolution ≠ `uiTextResolution()`. This is the
automation that would have caught LB-05, LB-06, LB-09, and LB-11 without a human ever looking. It
belongs next to the existing image and combat-boundary audits.

---

## 6. Two systems worth adding, not just fixing

**An inspect model.** LB-02 and LB-08 are the same request in two places: *let me look at a thing
before I commit to it*. Rather than two bespoke tooltips, specify one `InspectCard` and one inspect
input (hover for mouse; proximity or a held button for pad) used by power-ups, HUD statuses, map
nodes, shop offers, level-up options, and weapon rack slots. Six surfaces, one component, one input
convention to teach. This is a genuine content expansion the plan does not currently contain, and it
is the difference between a game a player can learn and one they must be told about.

**A reward language.** LB-03 exposes that scrap, XP, healing, weapons, relics, and Command Marks
each have different (or no) feedback. One `RewardToast` with a consistent grammar — icon + sign +
amount + noun — applied to every grant path makes the whole economy legible, and it is a
prerequisite for the shop and meta-progression work already queued in the forward plan.

---

## 7. What this changes in the plan of record

- `local-playtest-plan-2026-08-21.md`: apply the five edits in §1. Mark this session as Run 0.
- `README.md` (document index): add a row for this file under **Live — trust these**, and note that
  the playtest plan's Lane B is defined here.
- `last-bastion-log.md`: append the session, the twelve defect IDs, and the batch numbers claimed.
- `asset-next-production-review-2026-07-26.md`: append batches 85–89 as *evidence-gated and now
  fired*, with the evidence folder path against each. That file remains the single asset authority;
  §8 below is a brief, not a second queue.
- `last-bastion-improvement-and-steam-plan-2026-08-07.md`: no change to phase order. Note that
  Phase 1 "presentation completeness" is not complete and that these twelve defects are its real
  remaining scope. **The Steam store-screenshot gate must not be attempted until Lane B is clean** —
  six 1920×1080 screenshots of a build with blurry menus and clipped cards is the single most
  expensive way to publish these defects.

---

## 8. Codex asset briefs — batches 85–89

Numbering continues past the content plan's 76–84. Standing rules unchanged: text-free, stable IDs,
logical sizes, pivots and frame order preserved, source masters retained at ≥4× the runtime size,
staged under `art/production-tests/<folder>/`, reviewed through a `?mode=gallery&batch=…` route.

**85 — `weapon-batch-85-service-rifle-vfx`** *(unblocks LB-01 for the Marine)*
`bastion-service-rifle-effects-v1`, 64×64 cells, matching the existing per-weapon effect sheets:
muzzle flash (2 frames), tracer body (1 frame, readable as a streak at ~20 px on-screen, high
contrast against both the dark-brown logistics floor and the pale arctic floor), tracer trail
(1 frame), impact spark (3 frames). The tracer is the critical one — it must read at 12–20 px.

**85b — `weapon-batch-85b-projectile-identity`** *(closes LB-01 across the pool; see §4.1a)*
The same four-element treatment for the nine weapons still on the generic fallback: `railspike`,
`seeker-swarm`, `corrosive-lobber`, `scourge-repeater`, `hoarfrost-scatter`, `tether-harpoon`,
`emberlance`, `sentry-stake`, and `auxiliary-drone`. Seven of these already have Batch 68 identity
tiles; the projectile must read as the same weapon as its tile. Plus gameplay sprites for the Sentry
Stake turret and Auxiliary Drone, which are currently code-drawn primitives. Ship after 85 — the
Marine fix must not wait on a ten-weapon batch.

**86 — `object-batch-86-supply-chest`** *(unblocks LB-03)*
Standard and armoured supply chests, 64×64: closed, hit-flash, opening (3–4 frames), open-empty,
destroyed. Plus a reward burst (4 frames) reusable by every grant path. Silhouette must be
distinguishable from world-object crates at 30-enemy density.

**87 — `character-batch-87-helmet-registration`** *(unblocks LB-04)*
Re-author `marine-helmet-v1` (12 frames), `medic-helmet-v1` (20 frames), and
`assault-breach-overlay-v1` (12 frames) **registered to their body sheets** — helmet painted at the
exact pixel position and scale it occupies over the corresponding body frame, everything else
transparent, identical cell size and frame order. Deliver a composited contact sheet (body + overlay
per frame) as the review artefact; that sheet is the acceptance evidence.

**88 — `ui-batch-88-map-medallions`** *(unblocks LB-07)*
Node medallions for all nine node types (combat, elite, mini-boss, supply depot, weapon cache,
shrine, event, liberation, boss) at 64×64, each in five states (current, reachable, cleared, open,
unreachable) or one base plus a code-tintable state ring — state must survive greyscale. Plus the
three objective badges (Escort / Deny / Collect), a cleared tick, a current-position marker, and
route-line end caps. Then the six region plates re-authored at 3840×2560 (3:2) keeping their
1536×1024 logical contract and stable IDs.

**89 — `ui-batch-89-inspect-and-toast`** *(supports §6)*
Nine-slice frame for the `InspectCard` in the established U1 language (small, dark, readable over
both combat and the map plate), plus a toast plate, plus six small reward-class icons (scrap,
experience, health, weapon, relic, command marks). Text-free; all copy is code-rendered.

---

## 9. LB-10 — evidence storage (recommended, and yes it is required)

Codex cannot act on "the helmet looks wrong" without the frame in front of it. Convention:

```
play/last-bastion/playtest-evidence/
  README.md                       ← index: date, build, display, input, defect IDs
  2026-08-23-run-0/
    LB-01-no-visible-tracer-1920.png
    LB-03-crate-no-feedback-1920.png
    LB-04-helmet-offset-facing-east.png
    LB-05-title-outside-plate.png
    LB-06-perk-tiles-overflow.png
    LB-07-map-no-node-icons.png
    LB-09-blurry-menu-text-3840.png
    LB-11-levelup-card-clipped.png
```

Rules: file name starts with the defect ID; state the display resolution in the name when the defect
is resolution-dependent; never crop away the surrounding UI (the crop *is* the context); keep the
raw capture, not a re-encode. Each asset brief in §8 cites the exact filenames it answers.

I have created `playtest-evidence/README.md` with this convention. **I cannot write the eight
screenshots themselves** — they arrived as chat attachments, not files on disk. Save them from the
session into `2026-08-23-run-0/` with the names above and they will line up with every reference in
this document.

The folder sits inside the nested `website-snackpack-universe` repo. It is documentation, not a web
asset — confirm it is excluded from the sitemap/webp generators before committing, or the build
scripts will try to optimise defect screenshots into the live site.

---

## 10. Sequencing

**Step 1 — foundations (nothing player-visible, everything depends on it).**
§5.2 text factory + enforcement test · §5.1 layout primitive · §5.3 event-coverage test · §5.4
overflow audit wired into `npm run verify`. Landing the tests first means each subsequent fix is
proven by a test that already fails.

**Step 2 — S1 code fixes.** LB-09 (falls out of step 1 nearly free) · LB-01 code half · LB-03 code
half · LB-08 · LB-02.

**Step 3 — S2 code fixes.** LB-05 · LB-06 · LB-11 · LB-07 code half · LB-12.

**Step 4 — art, in parallel from step 1.** Batch 87 first (LB-04 is art-only and blocks nothing
else), then 85, 86, 88, 89. Each lands against wiring that already exists, behind the existing
fallback so a missing texture degrades rather than crashes.

**Step 5 — re-gate.** Restart the five-run matrix as Runs 1–5 with Lane B clean. Only then consider
Threat Tiers 3–5.

Every step ends with `npm run verify` green plus browser acceptance at 960×540, 1920×1080, and
3840×2160 — the existing standing rule, now with the overflow audit inside it.

## 11. What not to do

- Do not repaint the six region plates before the map medallions land. The plate is not why the map
  looks unfinished; the ASCII glyphs are. Re-authoring six 3840×2560 plates is the most expensive
  item in §8 and the least likely to change the player's verdict on its own.
- Do not patch LB-05, LB-06, and LB-11 with adjusted constants. Three fixed-number fixes will
  produce a fourth instance within a month; §5.1 plus §5.4 is barely more work and ends the class.
- Do not treat LB-04 as a code problem. A per-frame offset table is twelve magic numbers per hero
  hiding an art defect, and it will be wrong again the moment a frame is repainted.
- Do not expand content — no Threat Tiers, no dailies, no new heroes — until Lane B is clean. A
  player who cannot see their bullets will not reach Threat 3.
