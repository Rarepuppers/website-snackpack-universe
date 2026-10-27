# Shop navigation and spacing — 27 October 2026

Prepared local identity `web-2026.10.27-shop-polish`; schema 17, simulation compatibility 3.
G4 reuses production panels/portraits and code styling. No new art, prices, sale semantics or balance.

## Findings and correction

- Existing capture showed footer rows crossing the decorative frame; navigation used the item
  fallback tile. The new compact text-only navigation footer fits inside the frame. Four wide
  offers retain full authored text and font size; larger lists use at most five two-column rows.
- Lists over ten choices paginate. Each page repeats navigation (including Back/Leave and Sell Weapon where present),
  reserving space for Previous/Next. Sale pages carry seven weapons; management pages reserve
  room for both navigation actions. Navigation never reaches the
  transaction resolver. Keyboard quick picks cover the first nine displayed choices; the hint
  explicitly identifies arrows/D-pad for all choices. Existing confirmation/held-input edges remain.
- Fresh production-renderer probe confirmed a same-ID description/price update stayed stale:
  `coverage-before.json` has `labelUpdated: false`. The overlay now keys the full presentation,
  retains a surviving enabled selection on its correct page for same-mode updates, clamps pages,
  and selects Back/Leave if the selected action disappears or becomes disabled. Page navigation
  resets focus rather than carrying a transaction selection into the next page.

## Evidence

`audit-bounds.mjs` uses the actual overlay, simulation, catalogue factories and existing art.
352 after cases pass with zero choice-text or header overflow/overlap, including 99-copy locked item labels,
page/sale boundaries, an unchanged-ID label refresh and a removed-selection fallback. Shop
choice bottoms are also checked against a 50-pixel panel-bottom inset. The representative
`long-description.png` was inspected: footer is inside the frame, no sale tiles on navigation.
The initial two-column six-option layout overflowed one long item label; the final layout
retains wide offers and uses compact footer controls instead. No smaller fonts or cut copy.

The first full browser run caught five failures because Sell Weapon had moved off the first
management page. The final projection repeats all navigation actions on each page; the same
browser regressions are rerun. Full game verifier PASS in 166.8 seconds: 1,808 unit tests, 59 browser checks and 31
desktop-host tests, plus static/build/smoke/offline. All 23 portfolio guards pass. Results were finalized on 28 October; runtime identity and
evidence-folder date retain the implementation date. Browser tests
retain held Enter/pointer/simulated-pad checks and resize continuity, updated for seven-item
pages and Back on page one. Pure page tests cover all choices exactly once and bounded pages.
This is automated/local evidence, not human comprehension, physical pad, hardware or Steam
acceptance. No push, package or deployment.
