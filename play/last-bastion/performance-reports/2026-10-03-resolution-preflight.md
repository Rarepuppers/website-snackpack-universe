# Last Bastion resolution preflight — 3 October 2026

Build: `9b4371b1` (present in the published website history). Route:
`?scenario=density-capacity&debug=1&seed=61061`. Headless Chromium
151.0.7922.34 on the local Windows test host, device pixel ratio 1. Each run
waited for frame pacing telemetry and then sampled roughly 12 seconds. Browser
cache and hardware GPU conditions were not controlled. These results are
diagnostic, not a hardware release verdict.

| Viewport and backing canvas | Run | Average frame | p95 | p99 | Hitches | Page errors / context losses |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1920×1080 | 1 | 23.54 ms | 26.67 ms | 26.67 ms | 0 | 0 / 0 |
| 1920×1080 | 2 | 24.38 ms | 28.33 ms | 30.00 ms | 0 | 0 / 0 |
| 3840×2160 | 1 | 53.39 ms | 91.67 ms | 93.33 ms | 118 | 0 / 0 |
| 3840×2160 | 2 | 54.46 ms | 95.00 ms | 96.67 ms | 114 | 0 / 0 |

The 4K headless run is too slow to support a 60 fps claim. Headless Chromium
may use a different graphics path from a player's GPU, so do not lower 4K
render resolution or change image quality based on this result alone. The
browser profile's four automated checks passed, including bounded textures
through sustained dense combat and repeated scene transitions.

## Hardware acceptance still required

1. On a real target Windows GPU, run the same seed at Full HD and 4K in visible
   Chrome and the packaged desktop window. Record GPU, driver, browser, display
   refresh rate, device pixel ratio, presentation mode, and frame cap.
2. Compare title, character select, map, combat, decision overlays, and debrief
   for crisp text and art; capture the native-resolution screen, not a resized
   screenshot. Confirm keyboard and attached gamepad navigation.
3. In normal and dense combat, record frame average, p95/p99, hitches, input
   response, and audio continuity. Include a complete run or extended soak,
   plus pause, focus loss, resume, and monitor/resolution switching.
4. If 4K misses the agreed target on target hardware, profile the rendering
   pipeline there before selecting a quality/performance setting. Preserve a
   true native 4K option for hardware that can sustain it.

The five creator-observed campaign runs in `local-playtest-plan-2026-08-21.md`
remain open. Automated route checks do not replace that comprehension and
fairness gate.
