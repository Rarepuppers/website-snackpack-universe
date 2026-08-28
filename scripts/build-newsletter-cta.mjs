// Put an email signup on every app page.
//
// Why this exists: measured 2026-08-23, the site's only email capture was the
// Brevo form near the FOOT of the homepage — a page that drew 28 impressions in
// 28 days. Meanwhile the app pages are where referral traffic actually lands
// (the Reddit post for Prehistoric Pals), and they had no capture at all: a
// visitor arrived, found an Android-only store link, and left with no way to
// stay in touch. Roughly half of them cannot install the app at all, because
// there is no iOS build.
//
// Search is not the fix here. Over 90 days all 18 app pages together drew 0
// clicks and 37 impressions, and the Prehistoric Pals page drew zero. These
// pages get read because someone linked to them, so the only thing worth
// optimising on them is what happens to a reader who is already there.
//
// Posts to the same Brevo list as the homepage form, so subscribers land in one
// place. The GDPR consent checkbox is REQUIRED — that Brevo list has consent
// enabled and silently rejects submissions without it — and the honeypot
// (email_address_check) and locale fields are likewise part of Brevo's
// contract, not decoration.
//
// Usage:
//   node scripts/build-newsletter-cta.mjs           # insert/update in place
//   node scripts/build-newsletter-cta.mjs --check    # fail if stale (CI)

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const checkOnly = process.argv.includes("--check");

const OPEN = "<!-- newsletter:generated -->";
const CLOSE = "<!-- /newsletter:generated -->";

// Same list as the homepage form. If this ever 404s, re-copy it from the Brevo
// dashboard (Contacts -> Forms -> Share); it is a public form endpoint, not a
// secret, which is why it can live in the repo.
const ACTION =
  "https://c8e915bf.sibforms.com/serve/MUIFADVt4ZlXsiMM8wqiXqcGeRGBU0WF59M6fHpCegIo6lKDBIizhj4EybwGYQygjM8s619mIdox-2D8mik7upF-_5x30R9bApxbcK16bM2mPFLFTDokgMBnqtOdTY4r7u9TKTorSiC2MPn5mwOTncBTtrQAx2W58RDmqLLtC5OLxrFrNmZH7As9WjK4krNNglwOtxjzbYH3k9qc4Q==";

function block(appName, source) {
  const copy = source
    ? "A handful of new games a month. No spam, and you can unsubscribe in one click."
    : `New SnackPack apps, updates to ${appName}, and the occasional behind-the-scenes note. No spam, and you can unsubscribe in one click.`;
  const sourceField = source ? `\n          <input type="hidden" name="SOURCE" value="${source}">` : "";
  return `${OPEN}
  <section>
    <div class="shell">
      <div class="signup-card">
        <span class="eyebrow">Stay in the loop</span>
        <h2 class="section-title" style="margin:6px 0 10px;">Hear when the next one lands.</h2>
        <p class="section-copy">${copy}</p>
        <form class="signup-form" method="POST" action="${ACTION}" data-type="subscription">
          <div class="signup-row">
            <label class="signup-hp" for="EMAIL-cta">Your email address</label>
            <input class="signup-input" type="email" id="EMAIL-cta" name="EMAIL" autocomplete="email" placeholder="you@example.com" required>
            <button class="btn btn-primary" type="submit">Keep me posted</button>
          </div>
          <label class="signup-consent">
            <input type="checkbox" name="GDPR_CONSENT" value="1" required>
            <span>I agree to receive SnackPack Universe updates by email and accept the <a href="/privacy/">privacy policy</a>. Unsubscribe anytime.</span>
          </label>
          <!-- Brevo contract: honeypot must be present and empty; locale must be set. -->
          <input class="signup-hp" type="text" name="email_address_check" value="" tabindex="-1" autocomplete="off" aria-hidden="true">
          <input type="hidden" name="locale" value="en">${sourceField}
        </form>
      </div>
    </div>
  </section>
  ${CLOSE}`;
}

function updatePage(file, want, displayPath) {
  const original = fs.readFileSync(file, "utf8");
  let updated;
  if (original.includes(OPEN)) {
    const start = original.indexOf(OPEN);
    const end = original.indexOf(CLOSE) + CLOSE.length;
    updated = original.slice(0, start) + want + original.slice(end);
  } else {
    const anchor = original.lastIndexOf("</main>");
    if (anchor < 0) { stale.push(`${displayPath}: no </main> to anchor to`); return; }
    updated = original.slice(0, anchor) + want + "\n" + original.slice(anchor);
  }
  if (updated !== original) {
    if (checkOnly) stale.push(`${displayPath}: newsletter block missing or out of date`);
    else { fs.writeFileSync(file, updated); changed += 1; }
  }
}

const stale = [];
let changed = 0;
const appsDir = path.join(root, "apps");

for (const slug of fs.readdirSync(appsDir).sort()) {
  const file = path.join(appsDir, slug, "index.html");
  if (!fs.existsSync(file)) continue;
  const original = fs.readFileSync(file, "utf8");

  const title = (original.match(/<title>([^<]*)<\/title>/) || [])[1] || slug;
  const appName = title.split("|")[0].replace(/^SnackPack\s+/i, "").trim() || "this app";
  updatePage(file, block(appName), `apps/${slug}/index.html`);
}

// Small measured arcade pilot. SOURCE is deliberately page-specific so Brevo
// can tell whether a signup came from the hub or a game before this expands.
for (const slug of ["index", "solitaire", "sudoku", "minesweeper", "thirteen"]) {
  const file = slug === "index" ? path.join(root, "play", "index.html") : path.join(root, "play", slug, "index.html");
  updatePage(file, block("the arcade", `arcade-${slug === "index" ? "hub" : slug}`), slug === "index" ? "play/index.html" : `play/${slug}/index.html`);
}

if (stale.length) {
  console.error(`${stale.length} newsletter CTA problem(s):\n`);
  for (const s of stale) console.error(`  ${s}`);
  console.error("\nRun: node scripts/build-newsletter-cta.mjs");
  process.exit(1);
}
console.log(
  checkOnly
    ? "build-newsletter-cta: all app pages current."
    : `build-newsletter-cta: ${changed} app page(s) updated.`
);
