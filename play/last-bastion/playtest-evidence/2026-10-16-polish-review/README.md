# Asset-polish browser review — 16 October 2026

Build: `web-2026.10.16-asset-polish`, implementation commit `17ee207c`.
Four browser cases passed in 25.9 seconds. Each uses an isolated browser profile, 12-weapon stress
route, seed 61061, kit floor, Void affinity and Reduced Flash. Keyboard movement runs for 2.4 seconds,
then a real pointer click opens the affinity inspector. Settings, movement and runtime errors are
asserted; combat and inspection captures are retained with JSON evidence.

| Palette | Viewport | HUD scale | Radar scale |
|---|---:|---:|---:|
| Standard | 1920×1080 | 1 | 1 |
| Deuteranopia | 3840×2160 | 1.2 | 1.25 |
| Protanopia | 1920×1080 | 0.8 | 0.75 |
| Tritanopia | 3840×2160 | 1.2 | 1.25 |

Visual review: HUD and inspector remain readable; scaled panel stays within the display; actors,
projectiles and directional cues remain visible. The 12-weapon stress scene visibly crowds the
player with weapon bodies; this is a stress sample, not evidence that every normal loadout is clear.
The floor kit's broad modular grid remains visible. Keep it opt-in until continuous motion and
representative loadouts are accepted. No new runtime defect was established in this review.

Limits: sampled headless browser evidence, not continuous human play, a colour-blind-user study,
a 15-minute session, native GPU pacing, physical gamepad/audio testing, or Steam acceptance.
4K captures do not establish 4K60. These checks do not count as Runs 1–5.

Rerun from the website root with repository Chromium configured:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.playwright-browsers'
npx playwright test --config playwright.last-bastion-polish.config.mjs
```
