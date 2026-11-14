# Website and apps audit - 20 October 2026

Requested follow-up to the accepted Reads batch: fix the homepage zoom defect and audit the SnackPack Universe website and apps. No new books, access changes, app builds/submissions, store edits, outreach or reminders. The 15 November decision gate is unchanged.

## Homepage repair

The previous 320px / 200% observation combined three issues: implicit minimum grid widths clipping the hero and overflowing the newsletter, narrow card titles/controls escaping their frames, and native focus scrolling that sometimes revealed only part of a compact navigation link. The nav's horizontal scrolling itself is intentional. Repair grid minimums, long-text reflow, narrow newsletter padding/consent layout and constrained badge/QR layouts. Keep the compact nav; center a focused control in its scroller using the actual zoom scale. Styles and focus handling are scoped to homepage where appropriate. No overflow:hidden bandaid was added to hide page content.

At 320px with CSS zoom 2, document width was 555px before the fix and is 320px afterwards. Also checked 390px/1280px, zoom 1/2, all cream/dark/light themes, separate 200% text enlargement, complete text/control boxes, keyboard actions and invalid newsletter feedback. Tests never send a valid subscription. Existing art and content are retained.

## Website evidence

- **234 complete browser/visual scenarios pass**, including **19 new homepage reflow tests** and the existing Reads/offline, arcade, layouts, save/resume, pause and theme coverage.
- Reading/source/PDF verification passes: 54 books / 307 pages / 54 PDFs, 379 printed pages; real app-source/art/quiz parity and generated shelf/images/metadata checks. Site integrity checks 377 pages; contrast checks 489 rule/theme combinations; JavaScript syntax passes. Delivery contract and all 32 game-count markers pass.
- The live declared-asset checker checks **all 152 discovered declared asset URLs**, with no request cap reached: all resolve. This is the checker's declared inventory, not every possible URL or third-party service.
- Hero/newsletter/app-card screenshots and actual document widths captured at 320/390/1280px and 100%/200%. Visual review confirms reflow and reachable controls; decorative device-shot collage crops remain intentional. No conversion/performance claim.
- Final deployment/CI/served-byte evidence is in the monorepo dated audit handoff. The site is published via its separate repository using an isolated checkout on remote main; other sessions' local games/privacy changes are excluded.

## App audit

All **15 published apps' npm run verify commands pass** with installed dependencies: Badgify, PawsitiveDose, ABCs, Counting, Spelling, Basic Math, Mathematics, Earth Science, Space Math, Brain Games 1/2/3, Garden World, Prehistoric Pals and Zoo World. Brain Games initially failed a Checkers AI generic type during concurrent edits; its owner resolved the working code and the full verification rerun passed without this audit editing those files.

All **20 portfolio guards pass**: deep installed Expo dependencies, native permissions, assets, copy register, contrast, links, gameplay/delivery, image-host disclosures, backup presence, listing snapshots/source, no-ads/offline promises, pinball, stale native art, telemetry disclosures, verify scripts and versions. Live store listing checks use saved snapshots, not a fresh Play Console read.

Additional deep checks: Zoo's full content/rules/cache/cross-surface/safety suite and Jest **24 suites / 104 tests** pass; Garden's full check (progression, notifications, billing, content and media) passes; PawsitiveDose's full check (content, history, notifications, Pro access and attribution) passes. Sampled billing source confirms production guard separation and cached-entitlement fallbacks; Garden billing behavior tests pass. Actual store offerings, payments/restores and Android/iPhone runtime behavior were not exercised.

## Open findings - unpublished launch gates

| Priority | Project | Finding | Next action |
|---|---|---|---|
| P2 before release | Logic & Loops | Its existing verify fails installed SDK alignment: expo 54.0.36 vs ~54.0.37, react-native-svg 15.11.2 vs 15.12.1, jest-expo 54.0.17 vs ~54.0.18 | Align the owning project's installed/locked SDK packages and rerun its checks before preparing a release |
| P2 before release | Store Keeper Tycoon | Existing verify fails SDK 57 alignment across Expo modules, React Native, test/types/TypeScript packages; exact versions are in audit log | Dedicated SDK/lockfile review; do not blindly update portfolio dependencies |
| P2 before release | Tales & Trivia / Creative Studio | No top-level npm run verify entry point; unpublished and excluded from published portfolio requirement | Establish meaningful verification before considering publication |
| P2 before release | Store Keeper Tycoon / Creative Studio | Store Keeper points to generic privacy hub; Creative Studio has no obvious Settings/Legal privacy row in its app routes | Complete app-specific privacy/legal entry review before launch; these are not published apps |

Published Garden, Prehistoric and Zoo privacy pages use numbered website aliases (13, 11, 12) and were verified at their actual appMetadata URLs; folder-name guesses are not missing-page findings. No confirmed published-app source defect remains from the audit. The missing native/store/physical-device evidence remains an acceptance limit, not a green native-release claim.
