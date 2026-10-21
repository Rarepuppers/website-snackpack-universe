# Play website and games: audit and prioritized plan

21 October 2026, Australia/Sydney. Requested scope: the Play website, games, pieces,
assets, modes, backgrounds, sprites, animation, bugs and polish. This is a review and
implementation proposal; this pass changes no gameplay, public copy, asset delivery or deployment.

**Implementation update:** Mark requested continuation. `b1b28c0f` and `fedd3fdd` deliver the
first-wave fixes and bounded discovery/Backgammon/ownership follow-through locally.
`3f43a3f8` follows with native keyboard activation ownership. A combined 152-case browser run
passes, followed by all 17 implementation cases on the activation follow-up. All 20 portfolio
guards pass; the evidence record preserves the dirty-tree/test timing limits. See
[completed implementation](archive/PLAY-POLISH-IMPLEMENTATION-2026-10-21.md) for verification
and [current queue](#current-queue-after-the-first-implementation-batch) below. Findings and
pre-change measurements in the original audit remain historical evidence, not open duplicates.
The patch is not pushed/deployed. Other sessions' changes remain separate.

## Current queue after the first implementation batch

- **PLAY-01/02/03/04/05 implemented:** qualified deal promise, compact real-time field/input
  layouts with opt-in Focus play, 40px local Crossword enlargement, automatic native Mahjong
  identity until both sheets load, and the demonstrated hub/Crossword 200% text reflow repairs.
  Actual screen-reader, phone hardware and full enlarged-text/browser-zoom acceptance remain open.
- **PLAY-06 bounded copy correction implemented:** Standard/Classic now describe the actual
  house variants without unsupported regional equivalence. More teaching examples remain polish.
- **PLAY-07 bounded slice implemented:** local Backgammon board enlargement provides wider
  points and preserves legal source/destination actions. Further guidance/count/die review and
  match play remain separate; this is not full completion of the game's next-review matrix.
- **PLAY-08/09 bounded slice implemented:** first-screen static quick-play links, a visible
  Last Bastion input badge and touch-controls filter. No usage/conversion improvement is claimed;
  Atlas stays outside that filter pending its owner's actual input acceptance.
- **PLAY-13/14 implemented for confirmed scope:** shared generators now preserve the Last
  Bastion privacy subtree as well as game/redirect output; both real generators have isolated
  idempotence tests wired into CI. Pinball retains the ordinary site shell, and no speculative
  Keeping Up exclusion is invented. Corrected the obsolete Last Bastion placeholder receipt.
- **PLAY-15 partial:** 17 new production browser scenarios and a generator fixture test cover
  the demonstrated boundaries. Full accessibility, reduced-motion and every per-family state
  review remain acceptance work, not implied by those automated cases.

Next source work, in order: review/complete the **existing owner's Thirteen difficulty** delivery;
**Cascade Hold** as a separate app/web parity feature; remaining card-hand/scorecard ergonomics
and state-cue reviews (PLAY-10/11); then selected animation polish (PLAY-12) only where a named
interaction benefits. Backgammon match and new ports retain their full feature contracts below.
The soccer owner committed its fairness work as `5136e7de` during this batch; this chat did not
stage that work or establish publication. Do not implement either owner's changes twice.

Human/mobile/AT/audio and exact native/runtime acceptance remain open. The changed hub needs
reviewed Linux screenshot adoption (three themes × phone/desktop) before an authorized release;
local Windows behavior passes do not replace that CI step. Last Bastion, Pinball and
Atlas ownership/gates remain separate. No production build, new bitmap generation or publication
ran. The audit's original findings/roadmap follow for rationale; use this status section to avoid
reopening delivered fixes.

## Decision

Prioritize usable controls, truthful claims and resilient piece identities before new art or games.
No new bitmap batch is justified by this audit. The delivered launcher art is recognizable;
the strongest confirmed visual problems can be repaired in layout, CSS and existing fallbacks.
Keep current shared masters and use the existing derivative pipeline for any later asset work.

No P0 crash/release blocker was reproduced. P1 items below are confirmed defects or substantial
usability limitations; P2 is polish or a bounded feature; P3 is expansion requiring its own approval.
Sizes are rough engineering scope: S = a focused patch; M = several controllers/layouts; L = a feature
with rule/save/UI work. These are not elapsed-time promises.

## Evidence and limits

Base commit: `e0cdbb9f`, with many pre-existing dirty game pages and `sw.js` owned by other sessions.
The audit exercised that working tree; its results do not mean those edits are committed or live.
Source hashes were recorded after execution, not as an immutable snapshot of each browser request.
The [evidence receipt](play-audit-evidence/2026-10-21/README.md) contains reports and selected captures.

- **42 standard local game pages**, plus Play, Daily and Stats: 90 loads at 375×812/light and
  1280×900/dark. No page exceptions, failed first-party HTTP assets, broken loaded images or
  document-width overflow were found in those samples.
- A further **45 loads at 320×812/cream** passed the same sampled startup checks.
- **135 existing arcade behavior tests pass in 3.6 minutes**. These cover actual production
  actions including selected complete rounds, saves, daily behavior, keyboard controls, pause,
  records, art failure, Thirteen difficulty and soccer behavior. This is not a new complete
  playthrough of every game/mode, a rules proof or human difficulty acceptance.
- Fresh checks pass: site integrity **377 pages**, JavaScript syntax **74 files**, configured
  contrast checker **489 rule/theme combinations**. The contrast checker does not measure every
  pixel, canvas object, animation or image background.
- **18 live page loads**: Play, Daily, Stats, Thirteen, Mahjong, Cascade, Penalty Shootout,
  Soccer Trivia Sprint at phone/desktop sizes. No sampled startup exceptions/missing images/
  overflow. Live Thirteen lacks the local difficulty selector. Other local/live source differences
  are not automatically classified as defects.
- Deliberate PNG/WebP failures sampled Solitaire, Mahjong, Snacky Worm and Asteroid Destroyer.
  No page exceptions. Mahjong loses visible family symbols in its default appearance; the
  existing Clear faces option restores them.
- 200% root-font diagnostics found document overflow on Play (420px at a 375px viewport) and
  Crossword (410px); Backgammon stayed at 375px. Separate CSS-zoom diagnostics also overflow,
  but their effective layout width is below the site's normal 320px floor. Treat that latter
  experiment as stress evidence, not a browser-zoom conformance verdict.
- Atlas Quest's local landing page and Last Bastion's pointer entry were sampled separately.
  Atlas's actual game is external; no geography/content/WebGL gameplay acceptance is claimed.
  Last Bastion keeps its [own current plan](../play/last-bastion/CURRENT-PLAN.md); its prior 41-case
  report is historical evidence, not part of this fresh arcade run.

No new Linux visual baselines were generated. No native build, production packaging, push,
deployment, signup submission, payment, analytics-dashboard access or physical-device test ran.
The full portfolio guard set was not rerun for this documentation-only pass; its earlier result
is not presented as a current pass for this audit.

## First implementation wave: confirmed problems

| ID / priority / scope | Evidence and consequence | Proposed change | Acceptance |
|---|---|---|---|
| PLAY-01 / P1 / S | Play's description and hero say every card deal is solver-checked/winnable. Pyramid explicitly says it shuffles randomly and can be impossible. The hub's blanket promise contradicts a shipping game. | Restrict the promise to Klondike, FreeCell and TriPeaks where the verified pools actually apply. Audit hub metadata/FAQ/related descriptions; keep Pyramid honest. | Visible and structured copy agree with actual deal contracts; no new solver guarantee for Golf, Pyramid, Spider or CPU games without evidence. |
| PLAY-02 / P1 / M | At 375×812, Cascade's six movement/rotation/drop buttons start near y=1104; Asteroid's controls start near y=909. Part of a board being visible does not make board plus controls usable together. | Add a compact play layout: size the well/canvas to available height, retain aspect/coordinates, keep essential touch controls next to the active field. Consider explicit Focus play rather than global fixed controls covering content. Review Table Tennis and Worm at the same time. | Start, play and finish using touch with active playfield and essential controls visible together at 320/375/390px and short landscape. Verify aim/tap coordinates after resizing, page scroll, rotation, pause and keyboard parity. Do not merely hide overflow. |
| PLAY-03 / P1 / M | Crossword sampled cells are about 17×17px at 375px. Large pieces mainly enlarges labels/keyboard; it does not solve narrow grid hit areas. | Offer a focused word/board zoom or locally scrollable enlarged grid; keep selected clue, selected cell and on-screen keyboard usable together. Retain a full-board overview and keyboard arrows. | Measure the widest real banks, not one random board. Target at least 32px selectable cells in focused mode, preferably 40px where practical; no document overflow or lost selection after zoom/scroll. Check/reveal/undo/save and clue navigation still work. |
| PLAY-04 / P1 / S–M | Mahjong with unavailable bitmap art shows rank numbers without visible family symbols. Different families can have the same rank and differ mainly by color. Screen-reader family labels survive, but sighted identity degrades. | Reuse existing Clear faces glyphs automatically when the relevant suit/snack art cannot decode. Preserve a user's chosen appearance on recovery; native family/rank identity must remain underneath art. | Block PNG and WebP separately/together; show distinct family + rank in every layout, selected/blocked/hinted states and grayscale. Verify real pair rules, shuffle and resume, including delayed failures. Existing Clear faces is a recovery mechanism, not a new generation request. |
| PLAY-05 / P1 / M | Root-font enlargement causes actual horizontal overflow in Play and Crossword. Ordinary 320px layout passes, so this is a different boundary. | Identify the escaping text/control/grid boxes; allow heading, filter and clue/keyboard reflow. Let a genuinely enlarged board scroll within its own labelled viewport where needed. | At 320/375/640/1280px, test default and 200% text, all three themes, full text and focused controls. Separate intentional nav/board scrolling from document overflow. Include actual browser zoom and screen-reader checks in manual acceptance. |
| PLAY-06 / P1 review / S | Thirteen's copy identifies Standard/Classic as Southern/Northern rules, while the existing policy contract explicitly preserves house variants without tournament equivalence. Regional labels need evidence. | Describe the implemented Standard/Classic rules directly, with a small comparison and legal bomb/wrap examples derived from the production classifier. Remove unsupported regional equivalence rather than silently changing saved game rules. | Examples execute through the real classifier; rendered/JSON-LD copy matches. Keep saves and mechanics stable unless a separately agreed rules change is tested. |

PLAY-06 is a copy/identity review, not a claim that every Thirteen rule is broken. For context,
[Pagat's contributed rules](https://www.pagat.com/climbing/thirteen.html) describe variants and
exclude wrapping from 2 to 3 in their main account; that does not establish one universal regional
ruleset. The site's actual engine and named house contract must remain the implementation authority.

## Second wave: navigation, pieces and polish

| ID / priority / scope | Recommendation and evidence | Done when |
|---|---|---|
| PLAY-07 / P2 / M | Backgammon phone points are about 21px wide. Improve picking/destination preview and announce point/count/dice use; consider magnified selection or a clear alternate point list before changing board art. | Representative crowded stacks, bar entry, blocked destinations, doubles and bearing off work by touch and keyboard; active die/remaining moves are unambiguous. Test 320px, enlarged text and both orientations. |
| PLAY-08 / P2 / S–M | The first hub game starts near y=891 on an 812px phone; Daily and filters take the first screen. Add an early quick-play/recent/favorite route or move a compact discovery row upward. Avoid compressing every tile. | A new visitor can launch an appropriate game from the first screen; returning visitors can reach their recent game quickly. Search, category filters, favorites, empty results and Back remain understandable. Measure launch behavior only after authorized publication. |
| PLAY-09 / P2 / S | Last Bastion leads the phone grid, but its keyboard/gamepad restriction lives in a paragraph hidden on phone. Add persistent capability badges and a Works with touch filter/recommendation. Keep the game discoverable for paired keyboards/controllers. | Mobile card communicates required input before navigation. Real touch-only entry keeps its notice and alternatives; a fine pointer or paired controller is not falsely blocked. Do not advertise touch gameplay. |
| PLAY-10 / P2 / M | Put Play/Pass/Sort and trick status within easy reach in Thirteen, Hearts and Spades when a phone hand grows tall. Dice Score also benefits from a persistent current-roll/hold summary while scrolling its scorecard. | Cards, score choices and legal actions remain reachable without a sticky bar covering the last row. Keyboard order, focus, orientation and result overlays remain correct. This is polish, not a reproduced illegal-play bug. |
| PLAY-11 / P2 / M | Audit state cues as a consistent system: selected, legal destination, last move, hint, invalid action and complete. Reuse outlines, glyphs and live text across cards/boards/puzzles. | Shape/label cues survive grayscale, all themes and image failures. Do not rely on a glowing texture or color alone; no new matching IDs or rule semantics. |
| PLAY-12 / P2 / S–M | Add restrained code-native feedback: card arrival, accepted placement, match clear, row clear and result transition. Keep essential state immediate and reduce decorative movement when requested. | Reduced-motion preference suppresses nonessential travel/shake/flash; rapid undo/restart leaves no ghosts or stale callbacks. Check actual game effects, not just CSS transitions. No additional sprite sheet by default. |
| PLAY-13 / P2 / M | Consolidate the independent-page exclusions for theme/PWA generators. Source currently skips the Last Bastion subtree but not its separate privacy path; earlier plans also flag Pinball/Keeping Up ownership. | First define which pages intentionally own chrome/PWA. In isolated fixtures, run generators twice and verify owned pages untouched and ordinary pages updated idempotently. Do not run generators across the dirty shared checkout as an audit experiment. |
| PLAY-14 / P2 / S | Correct stale asset/queue records. `play/tiles/PLACEHOLDERS.txt` still calls the actual Last Bastion helmet tile a studio-mark placeholder. Older quality notes also retain already-delivered art work. | Current receipts distinguish generated/delivered/used/published/accepted. Archive only completed queues; keep unresolved owner gates. Preserve the untracked 20 October arcade plan and current shared Brain Games plans. |
| PLAY-15 / P2 / M | Improve the test bar: board + input coexistence, minimum target observations, full text at enlarged sizes, family-identity image failure, and representative reduced-motion/assistive-technology journeys. | Tests use production controls and fail with the reproduced fix removed. Run behavioral checks on Windows; review/adopt visual baselines on CI's Linux renderer. Existing 135 passes are not a substitute for these missing assertions. |

## Assets, backgrounds, sprites and animation

| Family | Keep / improve | New generation gate |
|---|---|---|
| Hub tiles and social cards | Keep the delivered Pyramid, TriPeaks, Spider, Thirteen, Picross, Dice Score, Hearts, Spades and Backgammon art. The sampled Picross reads as a filled picture; Thirteen as a table; Backgammon as a board. Keep the actual Last Bastion helmet. Check 36/48/72px crops, @2x, related cards and metadata. | Only a named subject/crop/readability failure after those checks. No blanket replacement of the nine delivered icons. |
| Card fronts and backs | Preserve native rank/suit indices above the existing art and the Solitaire fallback. Review compact fan/stack/selected/disabled states across all card renderers; expand failure tests beyond Solitaire. | A specific face/back fails actual-size identity after layout/contrast repair. Do not generate baked-in dynamic rank or status text. |
| Mahjong | Existing textures are sufficient. Automatic native family/rank fallback is needed; Clear faces already supplies suitable symbols. Inspect exposed hit areas under overlap. | A named family remains confused in normal rendering after native-symbol treatment. New symbols must preserve pair IDs. |
| Checkers, Reversi, Connect 4, Backgammon pieces | Keep piece silhouettes; improve selection/destination/count cues and phone picking. Plain surfaces are useful. Avoid adding texture behind tiny pips/numbers. | A specific silhouette/anchor failure survives CSS/native cue review. No full board or piece-set regeneration is currently justified. |
| Logic/word tiles | Keep numbers, clues and letters live. Use delivered blank surfaces only where they improve an actual consumer. Crossword needs layout, not an illustrated grid. | A missing reusable blank component is demonstrated. Preserve alpha and code-owned text; do not commission duplicates of the existing 28 blank assets. |
| Snacky Worm | Retain the current inexpensive browser background while comparing canonical Garden/Pantry/Midnight scenes against food/body/obstacles in motion. Site and native scenes are separate active deliveries. | Adopt an existing scene only after contrast, coordinate and size review; generate another only for a missing accepted theme. Do not copy a whole unused pack. |
| Asteroid Destroyer / Table Tennis | Current browser PNG backgrounds are small (about 52KB / 7KB on disk), so an indiscriminate conversion/repaint is low value. Review bullets, rocks, ball, paddles and power-ups during active play. | A named object disappears over the active background after outline/contrast adjustment. Compare the existing canonical starfield before commissioning another. |
| Cascade / 2048 | Code-native blocks and merge/clear feedback are appropriate. Prioritize input layout and piece/value distinction. | No raster requirement. Use code for held/next/ghost/merge state if those features are accepted. |
| Soccer | Existing characters, ball, targets and pitch sheets are sufficient. Preserve the existing one-pitch loading choice. Review tell → action → result and restart cancellation before cosmetic work. | A specific pose/frame/hit cue fails in an actual shot. Preserve actor crop anchors, ball trajectory and authoritative scoring. |
| Water Sort / Memory Match | Keep the current tube/face assets; verify color patterns, selected tube/card, incomplete pours and interrupted flips. | Only a demonstrated face-coverage or clarity gap. Reuse patterns/native marks first. |
| Pinball | Preserve its independent playfield/physics/audio ownership. Startup and layout were sampled, not a full table/mission review. | Owner-approved named readability defect at actual ball speed; never repaint geometry without physics review. |
| Last Bastion | Follow its completed 21 October gallery/menu corrections and external acceptance worksheet. No new art failure was established here. | Named motion/frame/floor/tell failure from its observed runs. No default-floor change or broad repaint. |
| Atlas Quest | The hub links to a local landing page, then the external game. Keep country/flag/map content in its owning project. | Actual game-owner review and fact/geometry evidence; landing-page startup is insufficient. |

For approved raster work, specify the failed use case, source references, exact display/export
sizes, palette/alpha/anchor requirements, no baked-in labels, immutable master/prompt/version,
deterministic derivative recipe, consumer mapping and before/after acceptance. Shared art flows
canonical `shared-assets/` → derivatives → website/apps. Website-only launcher/social art keeps
its own delivery receipt. Never copy a consumer image back over a canonical master.

## Modes and new games

| Work | Priority / scope | Conditions and contract |
|---|---|---|
| Finish current Thirteen difficulty + record work | P1 integration review / existing owner | Local Easy/Normal/Sharp and records exist and pass fresh tests; live has one strength. Do not implement them twice. Owner reviews its diff, legality/relative strength/save fixtures and final publication scope. Human tier feel remains unmeasured. |
| Finish current soccer fairness/trivia work | P1 integration review / existing owner | Dirty Penalty/Trivia source and new behavior tests are present; current suite passes. Preserve ownership, verify the intended keeper information boundary and metadata/question copy, then publish only when authorized. Do not label working-tree fixes as shipped. |
| Cascade Hold | P2 / M | An actual app/web parity gap: browser has no Hold control. Reuse the accepted once-per-piece contract, reset availability only after lock, include held/next/bag/availability state in resume, reject corrupt saves and preserve top-out/scoring. Add keyboard/touch controls only after compact-layout design. |
| Backgammon 3/5/7-point match | P2 / L | Existing native foundation is isolated, browser is single-game. Needs full cube/Crawford/endings/public-board CPU policy, match-vs-round records, independent save contract and cross-port action fixtures. Keep hidden until complete. Improve current board picking first. |
| 2048 optional board sizes / Minesweeper custom size | P3 / M each | Optional features, not missing correctness fixes. 2048 already has undo/best/resume; Minesweeper already has first-pick safety and chord reveal. Add bounded sizes, persistence/daily rules and small-screen support only for a demonstrated use case. |
| Rummy 500 web port | P3 / L | First candidate if a new card game is approved: existing app engine/polish can be reused. Still requires a complete browser adapter, legal meld/layoff UI, save/undo/CPU/stat contract, rules/assistance copy, scorecard/name review and actual game-specific launcher/social art. An app engine is not a shipped web page. |
| Generic placement block puzzle | P3 / L | Separate from falling-block Cascade. Define placement/rotation/tray generation/end detection and save rules before art. Reuse an actual app contract if selected; avoid confusing it with another game's identity. |
| Brick Breaker / Chess / more logic ports | Later, one at a time | Existing app source does not establish web readiness. Brick Breaker can reuse existing scene assets; Chess needs full rules/history/claim UI and accessible picking; logic ports need validator/content/daily contracts. Do not add hub placeholders or promise launch dates. |
| Gem Path / interlocking jigsaw | Existing separate feature gates | They remain in the shared Brain Games roadmap. Complete their current prototypes, saves, visual/performance acceptance and adapters; do not start another implementation or commission more scenes here. |

New modes are not polish substitutes. Keep unsupported modes hidden, and do not infer equal app
and web entitlement policies from shared rules/art. No multiplayer/accounts/leaderboards are
recommended as part of this pass.

## Per-game next-review matrix

Common checks for every selected game: legal start/finish, invalid input, actual undo/hint/restart,
pause/background/resume where applicable, legacy/corrupt storage, keyboard and touch, image failure,
all themes, enlarged text, reduced motion, sound/mute and accurate visible/structured copy.
These rows are next checks, not claims of bugs in every listed game.

| Game | Priority and next work |
|---|---|
| 2048 | P2: verify undo/resume/best and non-color value readability; keep code-native tiles. New sizes P3. |
| Asteroid Destroyer | P1: fit active field + touch input together. P2: in-play projectile/power-up contrast and pause/restart cleanup. |
| Backgammon | P2: narrow point selection, legal destination/die guidance, bar/bear-off. Match mode remains separate L scope. |
| Cascade | P1: compact phone play/control layout. P2: accepted Hold parity and resume/top-out fixtures; no raster block pack. |
| Checkers | P2: retain delivered draw/history/search work; review forced multi-jump, king cues and undo/focus. Do not redo draw implementation. |
| Connect 4 | P2: column affordance, winning line and pointer/keyboard parity; preserve existing levels/records. |
| Crossbar Challenge | P2: power/wind/result clarity, shot cancellation and readable controls; current weight budget passes. |
| Crossword | P1: small selectable cells and enlarged text. P2: clue/letter/assistance/save consistency; no bitmap letters. |
| Dribble Rush | P2: lane/tackle tell clarity and short-height touch play, pause/resume and active-object contrast. |
| Dice Score (`five-dice`) | P2: held-die visibility, current roll while scoring, complete turn and per-level records; preserve delivered planner. |
| Flag Frenzy | P2: source/date review of 2026 clues and daily result/migration semantics; do not invent updated tournament facts. |
| Flappy Snacky | P2: tap/start/retry clarity, pause and reduced decorative motion; current cold budget passes. |
| Free Kick Curl | P2: aim/power feedback, miss reason and restart safety; no new pitch sheet. |
| FreeCell | P2: compact stack selection, native indices, actual solver-pool promise, undo/resume and legal multi-card feedback. |
| Goalkeeper Hero | P2: striker tell → dive timing → result feedback, input/pause parity and restart cleanup. |
| Golf Solitaire | P2: native rank/suit readability, legal stock/card state and honest deal/no-move copy; no solver claim by association. |
| Header Hero | P2: jump/header timing cues and exact resulting shot, pause/restart; inspect active pose before art repair. |
| Hearts | P2: tall-hand action reach, trick/penalty clarity, target/tie/shoot-moon copy; preserve delivered policy/endings. |
| Kakuro | P2: clue font/selection and conflict/help distinction at largest real grid; assistance policy and saved answers. |
| Keepy-Uppy | P2: ball/contact timing, combo-loss feedback and restart; review active objects rather than title art. |
| Mahjong | P1: automatic native identity fallback. P2: exposed targets, Clear faces discoverability, all layouts and shuffle. |
| Memory Match | P2: face diversity, selected/matched distinction and interrupted flip/restart callbacks; no automatic native-face recopy. |
| Minesweeper | P2: narrow dense-board picking, flag/chord interaction and daily first-pick semantics; safety/chording already exist. |
| Penalty Shootout | P1 existing owner: finish current fairness/cancellation delivery. P2: visible keeper/action/result clarity. |
| Picross | P2: largest grid, Fill/Cross mode, clue progress and non-color marks. Existing heart-grid tile is suitable. Search indexing requires owner access. |
| Pinball | P2 owner acceptance: full mode/mission/input/audio/ball-contrast review; keep independent assets and physics. |
| Pyramid | P1 hub promise correction; P2 exposed pairs/kings/no-move/undo. Preserve explicit random-deal disclaimer. |
| Reversi | P2: legal moves, forced pass, last move and final count; records already exist, so do not queue them as absent. |
| SnackWords | P2: native letters and keyboard states, repeated-letter feedback, daily/resume and image-failure symbols. |
| Snacky Worm | P2: control reach and live food/body contrast; compare existing scenes before any theme expansion. |
| Snakes & Ladders | P2: board numerals, player/CPU turn and exact landing/path animation; respect reduced motion. Copy conjugation is already fixed. |
| Soccer Trivia Sprint | P1 existing owner: finish current question/category/metadata consistency work. P2: long answers, pause and feedback. |
| Solitaire | P2: inspect full fans/stacks and expanded suit-failure coverage; current actual draw/undo failure test passes. |
| Spades | P2: partner bid/trick/score context and phone hand controls; preserve delivered legal generator and tied-target behavior. |
| Spider Solitaire | P2: longest stacks, multi-suit contrast and completion/undo; do not imply a solver guarantee without its own evidence. |
| Sudoku | P2: givens/notes/mistake/hint separation and keyboard/touch/enlarged-text use on actual largest boards. |
| Table Tennis | P1 layout review with real-time family: full field and paddle control together. P2 elapsed timing and ball/paddle contrast. |
| Target Shooting Arena | P2: aim/power/timing and target hit feedback; restart cancellation and one-pitch load remain checks. |
| Thirteen | P1 current-owner difficulty integration and house-rule copy. P2 phone hand/action layout; keep actual legal-combination engine. |
| TriPeaks | P2: peak overlaps, legal/covered state and undo; keep solver-verified pool under both supported rule settings. |
| Water Sort | P2: pattern-mode distinction, poured-layer visibility and interrupted animation undo/restart; retain four existing difficulties. |
| Word Search | P2: touch drag/endpoints, found-word status and dense grid labels; found-word acknowledgment is already implemented. |
| Last Bastion | Separate owner plan: observed runs, actual AT/controller/audio, floor/hero review, hardware/package/Steam gates. No new implementation queue here. |
| Atlas Quest | Separate owner: test actual external gameplay, geographic facts, flag/source dates, globe input and offline/update; landing-page audit alone is insufficient. |

## Delivery order and release boundaries

1. **Wave 1:** PLAY-01 and PLAY-04 as focused trust/resilience fixes; PLAY-02 compact real-time
   layout; PLAY-03/05 shared narrow/enlarged interaction work. Coordinate PLAY-06 and current
   Thirteen/soccer changes with their owner. Add production regressions for each demonstrated issue.
2. **Wave 2:** PLAY-07–15 in small per-family patches. Fix docs/ownership contracts early enough
   to avoid a later generator overwriting a game; do not bundle a global art refresh.
3. **Wave 3:** Cascade Hold first if the accepted parity work is selected; finish Backgammon match
   and existing feature foundations separately. New ports follow only after current acceptance.
4. **Human acceptance:** real phone/tablet/desktop, coarse pointer and keyboard, screen reader,
   enlarged text, reduced motion and audio. For difficulty, compare fair public-information policies
   by matched seed/seat, then collect actual player sessions. No invented skill rating.
5. **Publication:** inspect the full nested-repository outgoing range, scope other sessions' dirty
   changes correctly, run affected behavior/integrity/contrast/offline/update checks and review CI
   images. Push only with publication authorization. Then confirm served bytes, image URLs, cache
   upgrade/offline behavior and real game interaction. A committed page is not a served page.

Keep Last Bastion's release authorization and production-build ownership unchanged. Claude owns
native/production packaging; no Android/EAS/build/submission action is part of this plan.
Search Console URL Inspection/CTR trends, analytics receipt, actual Atlas gameplay ownership,
native release/device acceptance and Last Bastion's hardware/Steam gates require their real owners.
No automatic monitoring, reminder, cross-chat message or production release is requested.

Companions: [older arcade audit](../ARCADE-AUDIT-2026-10-17.md),
[quality history](../ARCADE-QUALITY-PLAN.md), and the other owner's
`ARCADE-NEXT-PLAN-2026-10-20.md`. The monorepo's
`docs/BRAIN_GAMES_REVIEW_ROADMAP_2026-10-19.md` and
`docs/BRAIN_GAMES_ASSET_AND_PARITY_PLAN_2026-10-19.md` retain app/shared-feature ownership.
This audit adds evidence and ordered proposals; it does not replace or silently complete those queues.
