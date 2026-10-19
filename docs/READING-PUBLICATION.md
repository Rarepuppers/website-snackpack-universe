# Reading publication checks

Run from the website repository. The companion `../apps/` checkout and its
installed TypeScript dependencies are required for a fresh app comparison.

```powershell
node scripts/verify-reads.mjs --require-apps --roundtrip
npm run test:reads
```

Python needs `pypdf` and Pillow. Set `SNACKPACK_PYTHON` to an existing Python
executable when `python` is not on PATH. For generating collection PDFs,
ReportLab is also required. Do not treat browser emulation as real-device
speech or native app launch evidence.

The verifier checks actual app exports against every published story,
prompt and primary quiz/maths answer; art hashes; metadata; real printable
text; collection source PDF hashes and copied text; responsive images,
social cards, shelf, site integrity, contrast and syntax. The optional round
trip imports the six decodables and proves reviewed HTML/50 image hashes
remain unchanged. Changed app art fails for review and revisioned web URLs.
The existing six decodables retain their approved free-web status even where
the app edition is Pro; no additional Pro book is admitted by that exception.

`test-read-publication.mjs` mutates copies of actual outputs and confirms
that changed prose, questions, artwork and PDFs fail. It also proves that
`--require-apps` fails without companion sources. It never edits app sources.

Website CI has no companion app checkout. It validates committed evidence
and artifact hashes, and explicitly reports evidence-only mode. That is not
a fresh comparison with current app source. Before publishing source/content
changes, run locally with `--require-apps`.

## After a reviewed content/art change

1. Fix text/art in the owning app first. Complete all required app checks.
2. Import only the reviewed book; use new web artwork filenames for changed
   art, then rebuild its WebPs, responsive variants, printable and social card.
3. Generate shelf, collection pages/PDFs when their source PDFs change,
   breadcrumbs, attributed app links and sitemap. Collections reuse books;
   they do not increase the original-book count.
4. Render and inspect every new/changed PDF. Compare complete art sequences
   with the prose and count visible teaching items before accepting them.
5. Refresh publication evidence only after that review:

   ```powershell
   node scripts/check-read-publication.mjs --require-apps --write-evidence
   node scripts/verify-reads.mjs --require-apps --roundtrip
   npm run test:reads
   ```

6. Commit/push only task paths, preserve concurrent work, verify live HTML
   and artifact bytes, and notify search engines for new public URLs.

When transferring a scoped commit onto a newer remote head, use
`git diff --binary --no-textconv` for its patch. A configured PDF textconv
driver can otherwise substitute extracted prose for the actual PDF bytes,
even when `--binary` is present. Before pushing, compare every task path's
Git blob ID in the proposed tree with the reviewed source commit, then
verify served bytes against those committed blobs. Windows working files
may have CRLF line endings; deployed HTML/JavaScript uses committed LF bytes.
CI also runs for PDF-only and Python verifier changes.

New artwork must not be hidden by an existing cache-first URL. Never bump
the service-worker cache just for reading UI/content; it evicts saved shelves.
Existing reviewed JPEG/WebP derivative relationships are pinned in
`data/decodable-art-pins.json`. Do not update those pins to bypass an art
review. All-source and PDF evidence is in `data/read-publication-evidence.json`.

## Device-only preferences

Reading position and normal/larger story text are stored only in that
browser. No account or analytics event is created. Forget reading position
clears the saved book/page. Malformed, retired or structurally stale book
positions are ignored, and blocked storage never blocks reading. A shared
explicit page fragment wins; a bare book visit does not jump automatically.
