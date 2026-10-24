# Audit evidence — 22 October 2026

Runtime checkpoint `4238b130`, identity `web-2026.10.22-controls-records`. Pre-existing dirty About/privacy/social and unrelated files are excluded from audit changes. Concurrent website HEAD advanced; Last Bastion tracked files did not change in that range. Reports retain actual starting provenance. See [audit](../../archive/AUDIT-REVIEW-2026-10-22.md) and [sole queue](../../CURRENT-PLAN.md).

## Fresh checks

- `verification-host.json` / `.txt`: all lanes PASS in 117.9s; 1,783 unit / 312 files, 50 browser cases, 31 desktop-host tests; static/image/content/text/boundary, 25 matching source/output files, HTTP/offline and site checks. Host compilation is not executable packaging.
- `verification.json` / `.txt`: initial sandbox FAIL at temporary-cache rename before content tests; later lanes NOT-RUN. Successful host retry supersedes it; retained as environment evidence.
- `portfolio.txt`: fresh root `node scripts/check-all.js`, all 20 guards PASS. Earlier 12-app Expo drift is not reproduced by this run. No app dependency changes by this audit.
- `inventory-check.json`: 227 recorded definitions / 310 source references, no missing/hash mismatch. Read-only comparison against retained inventory, not a new census/alpha audit or full consumer reachability proof.
- `audio-probe.test.ts` / `.txt`: production WebAudioSynth with instrumented AudioContext and loaded feedback buffers. Existing sample gain remains 0.72 after master zero and disabled sound. Its PASS demonstrates the bug, not desired acceptance. No actual listening result. An approval-service usage-limit failure initially prevented execution; subsequent retry completed.

## Fresh visual evidence

`capture.mjs`, `captures.json`, `captures-supplement.json` preserve exact routes, dimensions, semantic snapshots, canvas bounds and errors. Fourteen captures, zero page errors/local HTTP failures. Headless Chromium, DPR 1, fresh disposable contexts, external requests blocked. No personal save or dashboard acceptance. Failed capture logs retain missing default browser cache and sandbox loopback failures; successful runs use repository `.playwright-browsers` outside that restriction. Supplementary capture also required retry after an approval-service usage-limit failure.

| Image | Observed scope |
|---|---|
| menu-small.png | 960×540 menu fits. Small subtitles sit close to decorative lower borders; optional inset/type review if readers struggle. No cropped-action defect established. |
| help-small.png / controls-small.png | First help page and keyboard bindings fit at minimum size, visible focus. Not actual AT/controller acceptance. |
| records-4k.png | Empty records at CSS 3840×2160; not populated-history evidence. |
| hero-select.png | Misnamed initial probe: unsupported `flow=hero` opens title. Title/background evidence only. |
| character-select-correct.png | Source-supported `flow=character-select`; Marine portrait, passive/ultimate, perks and hero/deploy controls fit at 1080p. Canvas semantics remain a separate limitation. |
| map.png | Preview brackets, route lines and subdued future nodes visible; does not prove all nine meanings or real travel comprehension. |
| baseline.png / floor-kit.png | Standard seed 61061: repetitive small panels versus calmer large panels with conspicuous broad joints. Hero/enemies remain visible in sampled stills; first-drop panel occupies substantial upper-left space. Not synchronized motion or hardware acceptance. |
| medic-gallery.png / assault-gallery.png | Correct named families and frame layouts. Separated Assault breach-review parts are not proof of detached combat equipment. Registration transitions remain unaccepted. |
| equipment.png | Single service-rifle diagnostic; hero/rack/cooldown visible. Not earned mixed-rack evidence. |
| dense-cvd.png | Misnamed initial probe: sparse weapon review, not density acceptance. `cvd` parameter was unverified; no palette acceptance claim. Retained as 4K sparse layout only. |
| density-capacity-correct.png | Real DENSITY 56 LAB; enemy clustering overlaps the hero and upper HUD in the sampled frame. This supports observed clarity review, not a claim of unavoidable damage or earned-run failure. |

No motion clips, human listening, physical controller, actual screen reader, observed Runs 1–5, native hardware benchmark, new executable, Steam client or live dashboard acceptance. Screenshots do not establish balance/replayability. Synthetic diagnostic loads do not close earned-play gates.

## Reproduce

From nested website root:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = (Join-Path (Get-Location) '.playwright-browsers')
node play/last-bastion/playtest-evidence/2026-10-22-audit-review/capture.mjs
```

Set `AUDIT_SUPPLEMENT=1` for only the two corrected routes. Full verifier:
`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-last-bastion.ps1 -Json <new-report-path>`.
From `play/last-bastion/dev`, audio reproduction:
`node node_modules/vitest/vitest.mjs run --root .. playtest-evidence/2026-10-22-audit-review/audio-probe.test.ts`.
This reproducer belongs to audit checkpoint 4238b130; the subsequent audio-controls implementation changes the graph and has its own desired-behavior regressions. Do not run the old bug-demonstration assertion as current acceptance.
