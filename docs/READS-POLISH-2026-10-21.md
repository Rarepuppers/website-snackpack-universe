# Reads correctness and polish — 21 October 2026

Implements the accepted review's correctness, two-book diagram pilot and editorial/discovery batches. Source app commit: **59d0fdddd**. No new book, access-tier change, native app build or store submission. The 15 November expansion decision is unchanged.

- The one-page toolbar uses available width, measures its height for page clearance, and keeps Back/Next/Close reachable under narrow zoom/text enlargement. Maths choices can shrink/wrap. Utility button styling is restricted to Reads.
- The Booklava prompt now asks which **digit** occupies the tens place in 205. Lantern's six spare lanterns and Parcel's separate delivery batches are explicit. ABC describes H as a soft breath; Library Day consistently shares a poem. Text corrections were made in each owning app before import.
- One Hop-Tart cover proof replaces the incorrect green companion with canonical brown, helmeted Centi-Peed. Four existing interior scenes remain. Source/master/superseded asset and delivery metadata live in the monorepo; the changed public cover uses `cover-r2` URLs.
- Eight explicit, authored teaching models support Hop-Tart and Below-Zero. App/web images are byte-identical; instructions and alt text come from app data. The same models are included with retained scenes in each printable, without adding PDF pages. No diagram infers its model or displays an answer count from the quiz answer.
- Offline manifests include the model PNGs and only currently referenced original WebP art. Saved books retain actual completeness checks and revisioned artwork. The service-worker cache version is unchanged; PDFs remain separate downloads.
- Guide introductions, metadata and adjacent guide cards follow the actual shelf counts and distinguish phonics practice from the full illustrated shelf. Print-preview guidance is consistent. Mandatory word lists remain visible; longer adult notes expand on request.
- Wider next-book choices have stable variety, retain phonics order and label a number-story transition. Maths topic hints come from imported book schema and participate in search.

## Verification

- **54 books / 307 story pages / 54 PDFs / 379 printed pages**; three collections retain 99 printed pages.
- All three owning app verifications and Expo helpers pass. Spelling: 27 suites / 248 tests. Basic Math fresh/returning/settled web first-paint smoke passes; this is not native launch evidence.
- All **64 Reads browser cases** pass, including 27 new scenarios, real offline model retrieval, unchanged no-JS browsing and combined theme/width/text/zoom tests.
- All **261 website browser cases** pass on the reviewed checkout. Source/art/PDF integrity, six-book import round trip, 495 contrast combinations, model delivery and generated-output checks pass.
- Seven changed PDFs were rendered and all 57 pages reviewed. One cover proof was accepted; no interior art was regenerated.
- Fresh 390px measurements put Pip's Begin action about 111px higher; shelf cover entry improves modestly (about 30px fresh / 21px returning). These are layout measurements, not claims of conversion or general performance improvement.

## Remaining gates

Actual Android/iPhone speech and text scaling, assistive-technology sessions, physical A4/Letter printing and store-binary inclusion remain unverified. Additional diagram books are a conditional follow-up after the two-book pilot's device review. Existing Ted costume sets, backgrounds and passing art are retained. No raster sprites, animated backgrounds or narration production were added. Root verification/publication/live-deployment results belong to the monorepo's dated implementation handoff.
