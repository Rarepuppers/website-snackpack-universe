# Event result clarity — 3–4 November 2026

U1/U2 implementation evidence. [CURRENT-PLAN](../../CURRENT-PLAN.md) is the sole active queue.
Baseline `734f430c`; started 3 November and completed 4 November (Australia/Sydney).
Prepared identity `web-2026.11.03-event-results` retains the start date. Schema 17 and simulation
compatibility 3 are unchanged. No art generation, gated content, package, push or deployment.

## What changed

`EventOutcomeSummary.ts` compares the incoming build with `applyEventResolutionToBuild` output.
It shows actual health/shield/Scrap/XP, maximum-health and slot bonuses, healing per kill, named
weapon tier/count changes, upgrade ranks, relic copies, equipped artifact, carried kits and
transformation affinity/ranks/commitment. It includes ambush routing alongside real rewards.
Rejected exchanges show the reason and that nothing was spent or granted; neutral save defaults
are not described as rewards. No raw catalogue IDs are presented as outcome names.

The expedition event screen and catalogue review screen use one bounded `EventResultPanel`.
It measures wrapping with the actual Phaser font, then pages at 17 rendered lines. All text is
retained, with a fixed Continue control and Previous/Next buttons plus keyboard/D-pad navigation.
Other buttons do not dismiss a result; repeated keyboard confirmation is ignored. Page changes
do not spend, reroll or apply a reward. Existing save-retry handling still owns input on failure.
The review screen now applies the same complete resolution in memory, uses canonical demo weapon
IDs/names and tracks its maximum-health bonus; it never writes a real save.

Duplication Vat says that effects do not stack and spare copies can be sacrificed. Its result
shows named copy counts, and the same explanation appears when a duplicate count changes.
Relic modifier semantics are unchanged: duplicate, sacrifice one, then sacrifice the last is
tested against the real modifier and event consumers. No new stacking or reward economy.

The web build produced two additional shared executable chunks (`EventResultPanel.js` and
`powerupCatalog.js`). Both are included in the dedicated atomic service-worker cache list;
the prepared cache identity was refreshed. Changes in other compiled chunks are bundler import/
export rearrangement, not new combat behavior. Source/output comparison verifies the complete build.

## Verification

| Check | Result and limit |
|---|---|
| [Final focused unit tests](targeted-final.txt) | 184 tests in 10 files pass, including seven new outcome-summary cases. Real catalogue exchanges/resolution and relic modifiers, not reimplemented algorithms. |
| [Build/typecheck](build-final.txt) | Pass. Existing large-chunk advisory remains; no new asset batch. |
| [Source/output comparison](build-check-final.txt) | All 27 generated outputs match current source. |
| [Six browser checks](browser-final.txt) | Actual weapon/affinity result and saved build, relic counts across 960×540/1080p/4K, long-result bounds/paging, DPR 2 simulated-controller paging/confirmation, held-confirm overlay protection and failed-write retry. |
| [Review-scene browser check](lab-browser.txt) | Applied slot/max-health result, held confirmation and no save writes pass. Run after the final review-only correction; the other six passing cases have unchanged relevant runtime inputs. |
| [Warmed offline browser check](offline-browser.txt) | Current release boots offline; an unwarmed theme fails visibly as intended. |
| [Offline static delivery](offline.txt) | 423 local references; no missing local assets or remote imports/startup calls. |
| [Site JavaScript/cache policy](site-js-after.txt) | 75 files pass. Initial [policy failure](site-js.txt) caught the two omitted new chunks; adding them fixed it before completion. |

The first focused unit attempt failed during sandbox PowerShell initialization with an out-of-memory
error; the approved retry passed. Earlier incremental logs remain for provenance. Phase 1's full
1,821-test run is historical; it is not presented as a fresh full-unit result for this slice.
No full browser/host/portfolio matrix was repeated. No real controller/hotplug, screen-reader,
listening, target GPU/4K60, Steam or packaged executable acceptance is claimed.

## Visual evidence and test boundaries

[960×540 result](duplicate-960.png), [1080p](duplicate-1920.png), [4K](duplicate-3840.png),
[DPR 2 long-result paging](result-dpr2-pad.png). The 960×540 and DPR 2 images were visually inspected:
copy count, non-stacking explanation, page controls and Continue are readable and unobscured.
Automated checks inspect actual Phaser text bounds at each tested viewport. The deliberately long
transmission is injected only in a test-intercepted boot/scene, to stress wrapping and pagination;
it is not new shipped story content or a production debug shortcut. Ordinary Cybernetics and
Duplication Vat tests select real production routes and validate the actual saved build after reload.

Eight distinct browser checks pass across the final main, review and offline runs. Simulated pad
evidence remains distinct from hardware acceptance. The whole game is not declared screen-reader
accessible by this canvas panel improvement.

## Completion and handoff

All five ungated audit tasks E1–E3/U1–U2 are complete locally. CURRENT-PLAN retains G7/G8's existing
designs and exact external evidence gates; floors, Practice, new art/expansion and Steam requirements
remain unchanged. Claude owns executable packaging. Concurrent about/privacy/social/game edits
were preserved and excluded from the focused implementation commit.
