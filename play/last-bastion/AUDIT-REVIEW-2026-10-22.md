# Last Bastion audit — 22 October 2026

Supporting evidence and recommendation specifications. [CURRENT-PLAN](CURRENT-PLAN.md) is the sole active queue. This review authorizes no runtime implementation, asset generation, packaging or publication.

## Checkpoint and method

Started at nested website HEAD `4238b130`, following `5974c948`; source identity is `web-2026.10.22-controls-records`. The checkout had existing About/privacy/social and unrelated website edits, plus scratch evidence. None belongs to this audit. Concurrent website commits subsequently advanced HEAD; no Last Bastion tracked files changed in that range at review time. Verification reports retain their actual starting revision and dirty status. No exact-clean-tree claim is made.

Read root AGENTS.md and release guidance; no additional AGENTS.md was found along the website/play/game path or within the game. Reviewed the former current plan, acceptance worksheet, release handoff, QA guide, shell contract, 21 October audits, asset proposal/inventory notes, five-run matrix, presentation register, release notes, completed implementation records and work log. Historical planning language is not evidence that a feature remains unimplemented.

Fresh evidence is in [the dated evidence folder](playtest-evidence/2026-10-22-audit-review/README.md):

- Full verifier passes in **117.9 seconds**: **1,783 unit tests / 312 files; 50 browser cases; 31 desktop-host tests**, image/content/text/boundary checks, source/output comparison, HTTP/offline smoke and site checks. All 25 published outputs match source. The first sandbox attempt stopped at a temporary-cache rename denial before content tests; retained separately.
- Full portfolio runner passes **20/20 guards**, including Expo dependencies and shared-asset delivery. This supersedes the historical 19/20 observation for this run only. No dependency maintenance was performed here; concurrent work means this is not attribution of a fleet fix to this audit.
- Read-only inventory check: **227 definitions, 310 source references, zero hash/missing-file mismatches**. This validates recorded inputs; it is not a regenerated census or proof of every historical asset's reachability. The 1,328 unmapped-file count remains dated inventory metadata.
- A targeted production-class audio probe establishes active-voice gain persistence after volume zero/mute. Its passing assertion reproduces the undesired behavior; it is not an acceptance test for a fix. No human listening result is claimed.
- Local captures and semantic snapshots sample actual committed output. Their routes and limitations are recorded separately. Browser diagnostics are not earned runs or physical-device acceptance.

## Findings by confidence

**Confirmed defect — AUDIO-02:** `WebAudioSynth.setVolume` changes only `outputVolume`; `enabled` gates future `play` calls. Existing sample gain nodes connect directly to `context.destination` and retain their gain. `PrototypeScene.applyInGameSettings` sets these two properties without stopping/updating active voices. The probe calls the real player with loaded feedback buffers and an instrumented AudioContext: an active player-hit sample retains gain **0.72** after volume becomes **0** and sound becomes disabled. Scope: already-playing tails, including potentially the rotary loop during its stop interval. No claim that sound continues indefinitely. There is also no explicit audio disposal API; whether repeated scene exits retain costly contexts needs measurement, not an assumed leak diagnosis.

**Confirmed accessibility limitation — ACCESS-02:** native title/menu/settings/help/controls/records exist. Armory, hero/threat selection, LAB, map, debrief and combat remain separate canvas consumers. Keyboard operation and synthetic pad tests do not expose those choices to screen readers. Whole-game screen-reader accessibility is not release-accepted. Native help/rebinding/records are completed implementation, not proposed work.

**Confirmed documentation defects — DOC-01, corrected by this audit:** the five-run guide's current handoff still selected the 17 October build; QA's package-check example used the old identity; the asset proposal called itself an active plan alongside CURRENT-PLAN. The old current plan mixed extensive completed history with remaining work. Archive that snapshot, point operators to the current identity, and keep specification documents subordinate to one queue. These were operational risks, not game defects.

**Source-backed review risks, not reproduced gameplay failures:** all production sample families load lazily on first sound, including hero-specific feedback beyond the selected hero; warning/feedback cues without a weapon family have no cross-frame family cap. `AudioMixer` has priority/bus logic but no production consumer; actual playback uses per-family limits and direct gains. These facts justify measurement/listening, not claims that the mix clips or warnings are inaudible. Do not expose inactive music/UI/ambience sliders; ScreenFlow already hides them.

**External acceptance gaps:** Runs 1–5, actual screen reader/controller/audio, floor motion and hardware decisions, LB-04/LB-07 sign-off, current executable, named-device pacing, Steam client/access and dashboard event receipt/start date remain open. The full verifier cannot close them. Last verified published identity remains the historical 17 October release; this audit did not query/deploy the live site.

**Fresh visual observations:** fourteen inspected captures show baseline small-panel repetition versus the kit's broad seams; minimum-size menu subtitles sit near decorative lower edges, while help/bindings fit; the 1080p character portrait and description fit their panels. The DENSITY 56 LAB sample clusters enemies over the hero and upper HUD. These support floor/clarity/teaching review, not confirmed unfairness. Optional subtitle inset/type polish belongs under UX-01 only if reading fails. Initial `flow=hero` and sparse “dense-cvd” captures were misleadingly named; the evidence index explicitly limits them and includes corrected character/density routes. No CVD acceptance is inferred from an unverified query parameter.

## Production consumer review and asset disposition

| Area | Actual consumer/evidence | Disposition and next observation |
|---|---|---|
| Floors/backgrounds | GameAssetManifest → CombatAssetManifest → ArenaRenderer; deterministic optional kit placement and readability wash | Reuse default and opt-in A/B/kit. Compare broad seams, small-panel repetition, pickups and apparent collision in motion; no default adoption now. |
| Obstacles/hazards | WorldObjectCatalog drives authored props. ArenaRenderer draws persistent hazards with fill, hatch spacing and border thickness | Existing sources are not missing merely because one consumer uses shapes. Check hatching against damage bounds and grayscale comprehension; replace only a demonstrated mismatch. |
| Hero sprites/portraits | Separate shell/select portraits; family-selective combat sheets; MarineHelmetRegistration has per-pose offsets and 0.55 overlay scale | Preserve masters, frame maps and silhouette. Inspect move/idle/evade/hit transitions and all facings; correct anchor/layer before repainting. |
| Weapons/equipment/pickups | Shipping catalogue and weapon render consumers; H1 pool already enabled; build inspection/affinity UI already delivered | Review native-size identity and earned mixed/bonus-slot racks. A twelve-weapon diagnostic is not evidence that ordinary play is unreadable. |
| Enemies/bosses/VFX | PrototypeScene owns hostile tell views; effect pool and reduced-flash policy already exist | Preserve timing/radii. Test tell onset → attack → recovery and friendly-effect occlusion; layer/opacity/count fixes before new sheets. |
| Shell/UI/map | Native shell subset uses ScreenFlow; map has focus brackets, READY and closed badges; teaching diagrams are code-native | Retain chrome/backgrounds and code symbols. Test node meanings and return/confirm behavior with players; no speculative diagram replacement. |
| Audio | AudioCueMap → production feedback/family selection → WebAudioSynth; synth fallback when samples unavailable | Fix demonstrated active-volume behavior. Listen before generating missing cues; existing warning, damage, reward and objective cues must be checked first. |
| Saves/progression | LocalSaveStore schema 16 blocks writes after a failed read, exposes persistence failure/retry, normalizes saves; desktop storage/cloud policies separate | Preserve these protections and user exports. Fresh tests cover failure and progression paths; actual package recovery/cloud conflicts remain external. No save-loss defect reproduced. |

## Detailed recommendation specifications

Effort bands: S = localized work, M = several consumers or a testing session, L = staged cross-system work. They exclude waiting for access/hardware. P0 interrupts all work for a demonstrated crash/save loss/input dead end; none newly reproduced. P1 protects acceptance/comprehension, P2 bounded polish, P3 conditional content. Every runtime change needs relevant regressions plus the full verifier, scratch source/output comparison, offline checks and portfolio guards; rebuild published output and identity deliberately when implementing, never as part of this audit.

### AUDIO-02 — P1 before audio release acceptance; S–M, medium risk

Problem/evidence: confirmed active sample ignores subsequent master/SFX zero or mute, as above. Benefit: controls take effect on what the player is hearing. Scope is player lifecycle and live gain, reusing all samples; no new audio assets or unrelated bus rollout.

Steps: reproduce in browser with a long existing sample/rotary loop; choose one master output GainNode (or tracked active gains); apply volume/mute to that node immediately with a short click-free ramp; define pause and shutdown behavior explicitly; cancel rotary timers/stop sources and close or reuse contexts on disposal as appropriate. Preserve future cue gating, family limits, decoder fallback and hero variant selection. Do not promise pause silence without an agreed behavior.

Acceptance: zero/mute affects active and subsequent sounds; unmute restores configured level without replaying stale cues; no loop/end-tail escapes mute; scene restart/disposal leaves no delayed sound or accumulating active contexts. Automated: production-class tests with active sample/synth/rotary nodes, timer completion and resume; real-browser gain graph/lifecycle probe and existing full checks. Human: headphones/speakers, low/normal volume, mute during rotary/damage/reward, pause/blur/restart, listen for clicks and lost warnings. Dependency: implementation authorization; audible quality needs a tester.

### ACCEPT-02 / UX-01 — P1 observation, P2 resulting copy changes; M, low observation risk

Problem/evidence: five-run worksheet remains NOT RUN; automated catalogues and balance fixtures do not measure comprehension, fun, fairness or replay motivation. Benefit: prioritize actual friction rather than adding speculative systems. Reuse existing Daily, Quick Drop, Expedition, onboarding and provenance.

Steps: protect/export save; complete exact existing Runs 1–5 with earned unlocks; record mode purpose, objective understood within five seconds, first unexplained hit, reward choice, affinity consequence, completion and desire to replay. Use existing thresholds (including 4/5 tier comprehension and no repeated unexplained unavoidable damage). Attach build/input/hardware/loadout and damage-source evidence. Convert failures into bounded copy, hierarchy or production-rule fixes; repeat the failed combination.

Acceptance: worksheet signed with clips and explicit accept/correct/defer decisions, no touched unresolved S1/S2 issue. Automated for subsequent changes: actual mode/date/retry/progression/catalogue/replay tests and minimum/4K layout cases; preserve distinct Daily dates and Expedition node reporting. Human: real keyboard/mouse/controller runs and repeat comprehension. No new assets unless a named identity is still missing after layout/copy repair.

### ART-01 — P1 floor decision; S–M, medium visual/performance risk

Problem/evidence: retained and fresh samples show repetitive baseline panels; kit's larger materials can reduce small detail but broad joints may compete with play. This is a visual observation, not proven unfairness. Benefit: calmer combat backdrop. Dependency: matched motion and hardware acceptance; default remains unchanged.

Steps: same standard theme/seed 61061 baseline/A/B/kit, sparse and dense movement at 1080p/4K, CVD/grayscale and reduced effects; mark seams, pickups, hostile tells and misleading collision cues. Decide accept/revise/reject each candidate. Adjust tint, decal frequency or placement before repainting a named tile. Reuse eight-tile/four-decal kit and retained masters.

Acceptance: clear signed decision and no readability/pacing regression, correct opt-in loading and unchanged collision. Automated: floor-selection/loader tests, asset/geometry audit, output/offline and full gates. Human: continuous motion plus named GPU/display baseline. Generation only after a specific material defect survives code adjustment; retain prompt/master/derivative provenance.

### ART-02 / LB-04 — P1 registration and animation; M, medium risk

Problem/evidence: registration compensation is real; galleries and stills cannot accept transition continuity. No newly failed frame established. Benefit: consistent body/equipment motion without replacing recognizable art.

Steps: Marine/Medic/Assault first, then other unlocked heroes; record facing/state/frame through idle/move/evade/hit and equipped poses. Overlay frame anchors against production motion, isolate displacement and fix offset/frame selection/layer. Repaint only irreparable named frames; keep source/atlas/pivot/extraction history.

Acceptance: no visible snap/slide or detached equipment in named transitions at 960×540/1080p/4K; tester signs LB-04 or explicitly accepts remaining limitation. Automated: frame bounds, registration mappings, hero route/manifest loading and transition regressions through production rendering. Human: motion clips and controller/keyboard movement. No new animation frame batch without failure evidence.

### CLARITY-01 / LB-07 — P1; M, medium risk

Problem/evidence: dense weapon/effect diagnostics stress the silhouette; earned racks and all nine map meanings remain unaccepted. Benefit: actionable danger and understandable routes. Dependency: exact earned weapon IDs/bonus slots and observed misread, not diagnostic crowding alone.

Steps: record hostile wind-up/impact/recovery, persistent hazard bounds, pickups, first-drop panel and mixed racks; inspect map reachable/selected/armed/cleared/closed states and confirm-twice travel. Fix named layering/opacity/spacing/labels first. Reuse symbols, hatching, sprites and existing effects; retain simulation timings/radii.

Acceptance: player identifies safe lanes and node action without coaching; warning remains visible at reduced flash and CVD settings; no ambiguous friendly/hostile identity. Automated: relevant renderer/telegraph/map tests, real minimum/4K screenshots and full gates. Human: dense earned play, grayscale, slowed replay plus normal-speed judgment. One tightly scoped effect asset only if existing code/art cannot express the failed tell.

### ACCESS-01 acceptance / ACCESS-02 next slice — P1; M acceptance, M–L implementation, high interaction risk

Problem/evidence: implemented native surfaces lack actual AT acceptance; remaining canvas selection blocks a full semantic path into play. Benefit: reliable menu operation and honest accessibility scope. Dependency: screen-reader/controller tester and separately authorized next surface.

Steps: run worksheet for all six native surfaces, including capture ownership, invalid/duplicate/reset feedback, history scrolling and focus return. Record exact spoken output/control failure. Next recommended bounded surface is hero/threat selection, preserving ScreenFlow enabled/unlock/selection rules; inventory actual choices before design. Keep map/Armory/debrief/combat separate scopes. Reuse portraits and code controls, not raster buttons.

Acceptance: one semantic action tree, names/states/order, single activation, disabled unlock explanations, no save mutation from browsing, correct back/return focus and remapped hints. Automated: production keyboard/pointer/synthetic-pad, accessibility tree and 960×540/letterboxed/4K/DPR cases; avoid calling these real AT tests. Human: actual screen reader at normal/zoomed layouts plus controller hot-plug/navigation and capture. No whole-game claim after one slice.

### AUDIO-01 — P2 listening/mix; M, medium risk

Problem/evidence: existing samples and fallback cues are present, but warning audibility, repetition and perceived loudness have no current ear acceptance. Direct gains/per-family limits do not establish mix priority. Benefit: danger/outcome feedback that survives dense combat. Dependency: AUDIO-02 behavior and recorded listening findings.

Steps: audition warning→attack→damage→reward with single and mixed racks, cold/warm/offline startup, each hero, low/normal volume; note exact cue/time masked or absent. Trace event→cue→loaded asset before declaring a missing sound. Tune existing gain/retrigger/priority only where demonstrated; measure decoded load/context lifetime if startup or repeated-run stutter appears. New cue/music only after a named gap and separate scope; do not enable inert buses.

Acceptance: danger and outcomes recognizable, no persistent loop after exit, no clipping/clicks or repetitive dominating ticks in agreed scenarios. Automated: cue mappings/asset validation, load-failure fallback and meaningful live-mix tests; full gates. Human: headphones/speakers and real controller vibration/audio interplay. AudioMixer tests alone are not production mix evidence.

### PERF-02 / RELEASE-01 — P1 release gates; M + external, high release risk

Problem/evidence: host tests do not refresh the old executable; native 4K60 and Steam integration lack current acceptance. Benefit: reliable delivery and truthful support claims. Reuse existing QA session/provenance tools, no new diagnostic framework or artwork.

Steps: Claude, when specifically assigned, packages the accepted current checkpoint and returns source/dirty provenance, manifest, executable hash and renderer smoke log. Test exact bytes on named Full HD/4K, ultrawide and Deck-shaped hardware with Windows scaling/monitor transitions, physical input, offline/Steam-down and disposable-save recovery. Record 15-minute dense p95/p99/hitches/memory and method; agree numerical thresholds from matched baselines before optimizing. Profile measured bottleneck, then bound a CPU/render/texture fix. Steam owner supplies real IDs/access/controller exports and tests achievements/cloud conflict/overlay/fallback. Separate browser publication authorization and outgoing-range review remain required.

Acceptance: worksheet has pass/fail/evidence per device and exact package identity; no mixed/stale package; agreed pacing targets met; real Steam/client results. Automated: verifier, provenance checker and package smoke by owner; after authorized web publication, served identity/privacy/offline upgrade. Human: actual display/input/audio/save/client testing. No App 480 substitute, no packaging/deploy by this audit.

### LEARN-01 / VARIETY-01 / EXPAND-01 — P2/P3 conditional; M–L, high scope/balance risk

Problem/evidence: learning/repetition hypotheses remain unmeasured. More content may hide rather than solve unclear mechanics. Benefit only if observed failures show need. Reuse production simulation/input, arena and roster first.

Practice: require repeated observed learning difficulty and the standing scope gate; one repeatable move/aim/evade/hazard/inspect sequence with immediate exit. Acceptance: action learned without coaching, no Career/Daily/achievement/outcome contamination. Tests must invoke production systems and isolation paths; human repeat after failure.

Encounter variety: require Runs 1–5 plus two weeks of verified live data, with dashboard owner recording receipt, privacy settings and measurement start. Prototype one existing-region spatial/pacing variant behind review route. Acceptance: distinct experience, safe lanes, fair rewards and compatible saves; production encounter/replay/progression tests and human fairness review before selection. Analytics represent tab-local-day milestones and a separate outcome distribution, not unique people or causal proof of fun.

Expansion: heroes/regions/tier 3–11, multiplayer/leaderboards, touch gameplay and large art/music collections remain deferred. Require a separate design/balance/production cost case after those gates. Each new hero implies mechanics, equipment, progression, portraits, animation, audio and accessibility work. No speculative backlog of generated assets. Technical overhaul is likewise deferred: ShellScene/PrototypeScene are large integration surfaces, but extraction should accompany a demonstrated change/bottleneck and preserve replay/input ownership rather than rewrite stable systems.

## Release assessment

Suitable for continued local acceptance and bounded defect work; **not fully release-accepted**. Automated game and portfolio lanes are green at the recorded checkpoint. AUDIO-02 needs correction/acceptance; human presentation, accessibility, audio, hardware, executable and Steam gaps remain. No asset generation is currently essential on established evidence. Highest value is live audio control repair followed by the already-defined observed/device sessions, not another general feature batch.
