# Completed Play usability batch — 21 October 2026

Mark requested continuation of the accepted [audit](../PLAY-AUDIT-AND-PRIORITIES-2026-10-21.md).
This archives delivered work, not the entire audit queue. The audit's current-status section
retains unfinished features and human/owner gates.

## Delivered code

- `b1b28c0f`: PLAY-01 qualified hub deal promise; PLAY-04 native Mahjong family glyphs until both
  sprite sheets load; PLAY-02 compact active fields for Cascade/Asteroid/Table Tennis and opt-in
  portrait/landscape Focus play; PLAY-03 enlarged locally scrolling Crossword cells; PLAY-05
  keyboard/hub text reflow; PLAY-06 scoped Thirteen house-variant descriptions. Focus play
  preserves live nodes, keyboard containment, background inert state and prior stage positioning.
- `fedd3fdd`: PLAY-07 enlarged Backgammon points with real legal moves; PLAY-08 quick-play links;
  PLAY-09 input badge/filter; PLAY-13 shared generator ownership and isolated fixtures in CI;
  PLAY-14 corrected tile receipt; pause/focus integration and cache v47. Escape resumes a paused
  game before a subsequent Escape leaves Focus play.

No bitmap was generated or replaced. No new game/mode, solver guarantee, save format, mechanics,
app entitlement or build was introduced. Shared art remains canonical in the parent repository.

The two Thirteen copy lines were staged from HEAD with only this chat's patch. The working-tree
difficulty/record changes remain unstaged. Other game/Reads/legal/social changes were preserved.
The soccer owner committed `5136e7de` independently; no publication claim follows from its commit.

`e4333cba` corrects the Backgammon test to support automatic single-destination moves.
`3f43a3f8` gives native Focus play Space/Enter activation precedence over game shortcuts;
its 17-case targeted run and syntax check pass after the broader run started.

## Verification record

Evidence lives in [the implementation receipt](../play-polish-evidence/2026-10-21/README.md).
The first five hub/Mahjong regressions failed before the fixes. A mistaken live hint locator was
corrected to retain stable tile IDs because the real renderer replaces nodes after selection;
the production pair rules were not changed. A test also corrected its own boundingBox use
(`y + height`, not the DOMRect-only `bottom` property).

The initial focused implementation run passes 15 browser scenarios, including actual matching,
native preference retention, field/control bounds, focus loop and pause/escape, local grid/board
enlargement, enlarged-text typing, discovery filtering and a legal Backgammon move. Two additional
320/390px compact-control cases pass separately on identical runtime bytes. These are automated
Chromium checks, not real touchscreen or screen-reader acceptance.

Both actual PWA/theme generators pass isolated preserved-page/idempotence fixtures; no production
generator was run over the dirty shared tree. The fixture preserves exact owner-held page bytes.
Existing shared Pinball chrome remains ordinary site output; unsupported ownership guesses were
not converted into blanket exclusions.

The complete combined browser run passes **152 cases in 4.2 minutes**. It started before the
three-line native activation follow-up; all **17 implementation cases** pass afterward. Do not
call the earlier full run an exact-final-runtime pass. The final portfolio run passes **all 20 guards**, including shared-asset fixtures and consumer
manifests. It started before that follow-up and finished afterward. Logs retain execution scope. Interrupted
earlier runs stop at 98/147 browser cases and seven portfolio guards; they are not green results
and are not retained as passing evidence. Static integrity, syntax, configured contrast and
bootstrap checks pass; Linux screenshot baselines have not been regenerated locally.

## Remaining acceptance and queue

Physical phone/tablet/rotation and paired inputs, actual screen-reader operation, browser zoom,
audio and longer active sessions remain human work. Check Focus play with modal/end/pause flows,
Crossword's widest real banks and selection while scrolling, and Backgammon crowded stacks/bar/
bearing off. The sampled layouts and legal-move checks do not certify all game states.

Thirteen difficulty delivery remains with its current owner. Cascade Hold, full Backgammon match,
card-hand/scorecard ergonomics, broader state/animation review and new ports remain in the main
plan with their own acceptance contracts. This archive must not be read as 44 fully accepted games.

No push/deploy, Linux baseline adoption, new native/production package, store action or cross-chat
message ran. Before publication, inspect/adopt the affected hub screenshots on CI's Linux renderer
(three themes × phone/desktop); these intentional discovery/badge changes are not covered by
Windows behavioral passes. Review the nested repository's entire outgoing range before any authorized push;
committed pages are not evidence of served output. Claude retains native/production-build ownership.
