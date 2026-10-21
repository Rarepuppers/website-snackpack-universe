# How to Play accessibility — implementation complete locally

22 October 2026. Mark accepted the follow-up recommendations and authorized executable work.
This is the bounded next ACCESS-01 slice on top of `a58f17ff`; it is not a new active queue.
Prepared identity: `web-2026.10.22-help-accessibility`, worker `2026-10-22-help-accessibility`.
Last verified publication remains the 17 October QA-readiness build. No push/deploy or executable
packaging occurred. Claude retains packaging ownership.

## Delivered

- Visible native screen/page headings, existing teaching copy and Previous/Next/Back controls.
  Last-page confirmation explicitly offers Return to menu. The page counter remains visible.
- Existing vector diagrams are retained, with a semantic image description per page. Page content
  has polite, atomic live updates; Next is described by the current page counter/instructions.
  Real screen-reader announcement quality still requires testing.
- Both presentation paths read `howToPlayPages(state.controls)`; saved remappable keyboard/pad
  instructions stay authoritative. No replacement help catalogue or simulation was introduced.
- Native controls dispatch existing ScreenFlow intents. Left clamps at page one; Right clamps at
  page four; confirm on page four returns to the menu. The Previous boundary exposes aria-disabled
  and guards its action while retaining focus when the player returns to page one.
- Keyed native nodes retain focus on page updates. Keyboard Enter/Space activates once; physical
  menu D-pad/A/B intents continue through the existing handler. Return restores the originating
  How to Play menu card. Global canvas-wide page-turn zones are omitted for the native surface;
  decorative diagram clicks no longer turn pages.
- Save persistence warnings use the existing native warning/retry surface. Native foreground
  follows the actual canvas CSS box, including letterboxing, resize and DPR. Existing 4K blended
  composition treatment is retained.
- Local generated web output and release/worker identity updated. Save schema 16 and simulation
  compatibility 3 unchanged. No new raster art, gameplay, balance, floor adoption or content mode.

## Verification

Fresh full verifier passes in **129.6 seconds**: **1,783 unit tests / 312 files**, **45 browser
cases**, smoke/offline and source/published-output consistency, website JavaScript/offline-core,
and **31 desktop-host tests**. The four new browser cases exercise actual production controls:
single Enter/Space steps, pointer-only buttons, boundaries, diagrams/semantic exposure, return
focus, simulated D-pad/A/B, saved remaps and unchanged progress, every page at 960×540,
1280×800, 1920×1080 and 3840×2160 under DPR 1/2. Existing regressions remain in the full suite.

Eight inspected captures cover all pages at minimum size plus first/final pages at letterboxed
DPR 2 and 4K. No page errors recorded. Source checkpoint in the report is `a58f17ff` with dirty
implementation inputs; the report is not an exact-clean-HEAD claim. Pre-existing unrelated dirty
About/privacy/social and arcade/read changes were preserved and are excluded from this commit.
See [retained evidence](../playtest-evidence/2026-10-22-help-accessibility/README.md).

The fresh root `node scripts/check-all.js` run passes **all 20 discovered portfolio guards**,
including shared-asset generation/delivery fixtures and all consumer manifests. Its complete
summary is retained as `portfolio-verification.txt` beside the game verification report.

## Remaining acceptance and handoff

Use [CURRENT-PLAN](../CURRENT-PLAN.md) and the [worksheet](../ACCEPTANCE-WORKSHEET-2026-10-17.md).
Mark/assigned tester checks actual screen-reader announcements/navigation and physical controller,
including page changes, disabled Previous, remapped instruction labels, Back and menu focus.
Observe Runs 1–5 for floor, hero motion, earned mixed racks, map meaning, tells and audio; do not
substitute diagnostic screenshots. Further canvas screens require separately scoped work.
Claude supplies the fresh executable/manifest; named hardware/Steam owners return physical
display/input/pacing/client evidence. Dashboard receipt/settings and measurement start remain
unverified here. Conditional practice/encounter/new-art gates remain active.
