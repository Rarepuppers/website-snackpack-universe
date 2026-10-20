# Reads discovery delivery - 20 October 2026

Bounded batch implemented: saved-card status/filter, audited reading guidance, distinct next choices, representative homepage and two fully reviewed free Spelling books. Current generated shelf: **54 books / 307 story pages / 54 individual PDFs / 379 printed pages**. Collections remain 3 / 99 printed pages. Both source questions ship for all 29 Spelling books.

## What changed

Saved status reuses offline.js completeness inspection: current normalized HTML SHA-256 plus every required picture and shared file. Cards distinguish saved, incomplete/needing update, unsaved and unavailable. A saved-only URL depends on this device; search/type/age/reset combine. Pageshow/focus refresh after save/remove/eviction. Blocked storage leaves navigation usable. The real-worker test exposed query-key lookup: offline shelf navigation now ignores filter query state when matching its saved HTML. Cache version unchanged; games/other books/shared dependencies are preserved.

ABC's existing auditor passes all six books. Imports expose current app parent notes plus declared tricky/bridge words before Begin. Two demonstrated parent-note defects were corrected in ABC source first; story prose and stages are unchanged. Shelf/guide independence overclaims are removed. All six Reading Trail introductions say shared focus practice with wider vocabulary, not a controlled independent decodable stage. The guide title distinguishes six decodables and six Trail stories. Recommendations use shelf groups/ages and explicit collections, preserve ordered phonics progression, exclude self/duplicates and offer a wider choice outside a quiet pair. Links work without JavaScript.

Homepage six slots: Pip, Hen-Berry's Digraph Dash, Panda-Cake A-Z, Luckybug's Art Gallery, Market Basket and Animal Architects. Existing art retained, full pictures contained, intrinsic dimensions included. Cold book-image responses at 320/390/1280 CSS px: six requests before and after, 326,396 -> 337,677 bytes (+11,281 bytes, 3.46%). No speed/conversion improvement claimed. Phone/desktop keyboard focus and 200% bookshelf zoom checked. Unrelated homepage hero/navigation overflow at extreme 320px with CSS zoom 2 is outside this component and remains a recorded limitation.

Pork-ulele and Beakon: reviewed every full-resolution source picture beside all paragraphs/prompts/quizzes and canonical references. Retain seven pictures. Pork p3 alone replaced because the old picture substituted a blue bird for Coop-Accino, changed the pig's shirt/hat and switched to sunset. One built-in imagegen proof accepted against references and pages 2/4; lossless master, superseded image, prompt and hashes retained in monorepo art-masters and app delivery manifest. Beakon source subtitle/page1/quiz now says red-and-gold, matching all retained pictures. Exact app export imports; no invented questions/explanations or access changes. Replacement web page uses -r2. Full editorial matrix/page review is monorepo docs/READS-NEXT-EDITORIAL-REVIEW-2026-10-20.md.

## Validation

- ABC npm run verify passes, including its decodability auditor and Expo helper. Spelling verify: 27 suites / 248 tests; separate Expo helper passes. No startup/provider/routing changes requiring first-paint smoke.
- npm run verify:reads passes; node scripts/verify-reads.mjs --require-apps --roundtrip passes: current source/art/quizzes, real PDFs, collections, schema, responsive/social images, site/contrast/syntax and six unchanged decodable HTML / 50 derivatives round trip.
- npm run test:reads: **37 passing cases**, preserving all prior 29 scenarios. New tests cover real cache operations, saved combinations/reset, removal/game preservation, stale HTML, missing image, blocked Cache API, exceptions, deterministic recommendations, homepage full images/layout/focus, and both new books + saved shelf disconnected with a real worker.
- All ten pages of the two final PDFs rendered and opened, including both question sheets. Five printed pages per book, complete prose, two answers below fold line, no clipping/overlap; established 186 x 255 mm A4/Letter safe area preserved. No physical print/device speech/native claim.
- Root portfolio gate and live deployment results are recorded in the final dated handoff. Early sandbox attempts stalled child-process checks; successful source verification used workspace TEMP/TMP outside sandbox. This is not a skipped source comparison.

## Publication

Task commits are transferred with binary/no-textconv preservation onto current remote main in an isolated website worktree. Compare every proposed task blob before push. CI, Pages, served-byte hashes, live browser acceptance and search notifications must be recorded after deployment; a commit alone is not live evidence.

No app build/submission/version/signing/Play edit, outreach, access change or new reminder. Existing **15 November 2026** decision gate remains. Physical devices, actual screen readers, printer output and native/store inclusion remain release-owner gates.
