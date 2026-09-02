// Shared marker-block handling for the page generators.
//
// Six scripts inject a `<!-- x:generated -->` ... `<!-- /x:generated -->` block
// into pages and replace it on the next run. Five of them had independently
// copied the same regex:
//
//     new RegExp(`${OPEN}[\\s\\S]*?${CLOSE}\\n?`)   ...replaced with BLOCK + "\n"
//
// which is not idempotent on this repo, because `core.autocrlf=true` means the
// working tree is CRLF. After the close marker the next byte is `\r`, so the
// `\n?` matches nothing, the replacement appends its own `\n`, and the file
// gains a blank line -- every run, forever, on the three scripts that wrote
// unconditionally. `apps/index.html` had accumulated two.
//
// The fix is to notice what the file actually uses and speak its dialect:
// consume `\r?\n` after the close marker, and emit the block in the file's own
// line ending rather than always LF. Pair it with a write-only-if-changed
// guard at the call site so an unchanged page is not rewritten at all.

/** The line ending the file actually uses, so we can round-trip it unchanged. */
export function fileEol(html) {
  return html.includes("\r\n") ? "\r\n" : "\n";
}

/** Re-line-end a block that was authored with plain \n. */
export function withEol(block, eol) {
  return eol === "\n" ? block : block.replace(/\r\n|\n/g, eol);
}

// The markers are literal HTML comments, but they are interpolated into a
// RegExp, so escape them rather than trusting that no one ever adds a "+".
function escapeRe(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace an existing generated block, preserving the file's line endings.
 *
 * Returns the updated HTML, or `null` when the page has no block yet — the
 * caller owns first-time insertion, because every generator anchors somewhere
 * different (`</head>`, `</main>`, the footer, `</body>`).
 */
export function replaceMarkerBlock(html, open, close, block) {
  const existing = new RegExp(
    `${escapeRe(open)}[\\s\\S]*?${escapeRe(close)}(?:\\r?\\n)?`,
    "m"
  );
  if (!existing.test(html)) return null;
  const eol = fileEol(html);
  return html.replace(existing, withEol(block, eol) + eol);
}
