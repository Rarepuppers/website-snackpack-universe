# Current audit evidence — 21 October 2026

Review scope and tasks: [detailed audit](../../AUDIT-REVIEW-2026-10-21.md).
Starting nested-repository HEAD `1d592afd`; published identity remains
`web-2026.10.17-qa-readiness`. No game implementation changed during this audit.

## Fresh verification

- `unit-tests.txt`: host run, 1,781 tests / 312 files pass. The first sandbox attempt failed
  before tests on a Vitest temporary-file rename; the host result supersedes that environment failure.
- `browser-tests.txt`: 31 functional browser journeys pass in 52.3 seconds against local committed output.
- Additional current commands passed: `image:audit:webp` (63 derivatives),
  `combat:audit:boundaries` (33 adapters), `content:audit` (three inventory assertions),
  `ui:audit:text` (six scenes), `typecheck`, `test:build-check` and `build:check` (25 outputs).
  The last two compare a scratch build; no production executable was built.
- `portfolio-verification.txt`: fresh host `node scripts/check-all.js` passed all 20 guards.
  Historical October 17 evidence was not used as this result.
- `checks.json` summarizes these executed checks and their limits. Full smoke/offline and
  desktop-host lanes were not rerun in this audit; their prior results remain historical.

## Capture review

`capture-results.json` and `capture-results-followup.json` retain routes, viewport/canvas sizes,
page-error lists and DOM text for all twelve captures. These are short headless-browser samples
with desktop pointer emulation, not earned runs or hardware performance measurements.

| Retained image | What it supports |
|---|---|
| `menu-small.png` | Mode cards and footer fit at 960×540; optional title/hierarchy refinement remains subjective. |
| `map.png` | Existing code-native node symbols and focus brackets; does not establish unaided comprehension. |
| `default-gallery-ignores-hero.png` | Requested Medic selector displays Marine; oversized source frames obscure labels; manifest text overflows. This is diagnostic evidence, not Medic acceptance. |
| `medic-correct-gallery.png` | `batch=p` actually displays the Medic family and twenty frames. Static source review only. |
| `medic-combat.png`, `assault-combat.png` | Real production hero routes render their own art in sampled combat. No full animation/fairness acceptance. |
| `combat-baseline.png`, `combat-kit.png` | Fixed-theme/seed comparison: baseline grid is busier; existing kit deserves motion review. Wall-clock capture timing differs, so actor/HUD state is not a synchronized gameplay A/B result. |
| `build-small.png` | Sparse current-build inspection fits at 960×540; not a dense-build overflow proof. |
| `settings-4k.png` | Sampled settings group fits at a 3840×2160 backing canvas; not native display/scaling acceptance. |

No image generation, human audio listening, physical gamepad, 15-minute pacing test, packaged
Windows run, Steam test, live analytics or new deployment was performed. Default floors,
save schema 16, simulation compatibility 3 and published assets remain unchanged.
