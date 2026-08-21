import fs from "node:fs/promises";
import path from "node:path";

/*
 * Adds an onward-journey block to the bottom of each per-app privacy policy.
 *
 * Cloudflare analytics (Aug 2026) showed the privacy pages are the single
 * biggest traffic source on the site — ~1,060 of 1,720 monthly views, because
 * every Google Play listing links to one. None of them linked to the app on
 * Play or to the free arcade, so that traffic arrived on a legal page and
 * stopped there.
 *
 * Only live apps get a Play button. Unreleased apps get the arcade link alone,
 * so we never advertise a store page that doesn't exist.
 *
 * Idempotent: re-running replaces the generated block. Run:
 *   node scripts/build-privacy-cta.mjs
 */

const root = path.resolve(".");
const OPEN = "<!-- privacy-cta:generated -->";
const CLOSE = "<!-- /privacy-cta:generated -->";

// slug -> { name, appPage, pkg (null when not on Play yet), qr }
const APPS = {
  "badgify": { name: "Badgify", appPage: "badgify", pkg: "com.snackpackuniverse.badgify", qr: "qr-code-badgify.png" },
  "pawsitive-dose": { name: "Pawsitive Dose", appPage: "pawsitive-dose", pkg: "com.snackpackuniverse.pawsitivedose", qr: "qr-code-pawsitive-dose.png" },
  "snackpack-1-abcs-alphabet": { name: "SnackPack ABC: Learn to Read", appPage: "snackpack-1-abcs-alphabet", pkg: "com.snackpackuniverse.abcalphabet", qr: "qr-code-abc-learn-to-read.png" },
  "snackpack-2-123s-counting": { name: "SnackPack 123: Learn to Count", appPage: "snackpack-2-123s-counting", pkg: "com.snackpackuniverse.counting", qr: "qr-code-123-learn-to-count.png" },
  "snackpack-3-spelling-sentences": { name: "SnackPack Sentences & Spelling", appPage: "snackpack-3-spelling-sentences", pkg: "com.snackpackuniverse.sentencesspelling", qr: "qr-code-sentences-and-spelling.png" },
  "snackpack-4-math-arithmetic": { name: "SnackPack Basic Math", appPage: "snackpack-4-math-arithmetic", pkg: "com.snackpackuniverse.basicmath", qr: "qr-code-basic-math.png" },
  "snackpack-11-prehistoric-pals": { name: "SnackPack Prehistoric Pals", appPage: "snackpack-11-prehistoric-pals", pkg: "com.snackpackuniverse.prehistoricpals", qr: "qr-code-prehistoric-pals.png" },
  "snackpack-12-zoo-world": { name: "SnackPack Zoo World", appPage: "snackpack-12-zoo-world", pkg: "com.snackpackuniverse.zooworld", qr: "qr-code-zoo-world.png" },
  "snackpack-13-garden-world": { name: "SnackPack Garden World", appPage: "snackpack-13-garden-world", pkg: "com.snackpackuniverse.gardenworld", qr: "qr-code-garden-world.png" },
  "snackpack-brain-games": { name: "Snackpack Brain Games", appPage: "snackpack-brain-games", pkg: "com.snackpackuniverse.braingames", qr: "qr-code-brain-games.png" },
  "snackpack-brain-games-vol-2": { name: "Snackpack Brain Games Vol 2", appPage: "snackpack-brain-games-vol-2", pkg: "com.snackpackuniverse.braingames2", qr: "qr-code-brain-games-vol-2.png" },
  "snackpack-brain-games-vol-3": { name: "Snackpack Brain Games Vol 3", appPage: "snackpack-brain-games-vol-3", pkg: "com.snackpackuniverse.braingames3", qr: "qr-code-brain-games-vol-3.png" },
  // Not on Play yet — arcade link only.
  "snackpack-5-tales-trivia": { name: "SnackPack Tales & Trivia", appPage: "snackpack-5-tales-trivia", pkg: null },
  "snackpack-6-creative-studio": { name: "SnackPack Creative Studio", appPage: "snackpack-6-creative-studio", pkg: null },
  "snackpack-7-mathematics": { name: "SnackPack Mathematics", appPage: "snackpack-7-mathematics", pkg: null },
  "snackpack-8-earth-science": { name: "SnackPack Earth Science", appPage: "snackpack-8-earth-science", pkg: null },
  "snackpack-9-shape-space": { name: "SnackPack Shape & Space", appPage: "snackpack-9-shape-space", pkg: null },
  "snackpack-10-robot-recipe": { name: "SnackPack Robot Recipe", appPage: "snackpack-10-robot-recipe", pkg: null }
};

function block(app) {
  const store = app.pkg
    ? `        <a class="store-badge-link" href="https://play.google.com/store/apps/details?id=${app.pkg}" target="_blank" rel="noopener" aria-label="Get ${app.name} on Google Play">
          <img class="store-badge" src="../../assets/google-play-badge.svg" alt="Get it on Google Play" width="200" height="60" loading="lazy" decoding="async">
        </a>\n`
    : "";
  const qr = app.qr
    ? `      <div class="privacy-cta-aside">
        <img src="../../assets/qrcodes/${app.qr}" alt="QR code to download ${app.name} on Google Play" width="180" height="180" loading="lazy" decoding="async">
        <span>Scan to download</span>
      </div>\n`
    : "";
  const lead = app.pkg
    ? `${app.name} is free on Google Play — no third-party ads, no tracking SDKs, and nothing that follows you around.`
    : `${app.name} is still in development. In the meantime, everything else we make is ad-free too.`;

  return `${OPEN}
<section class="privacy-cta-section">
  <div class="shell">
    <div class="privacy-cta">
      <div class="privacy-cta-copy">
        <span class="eyebrow">While you're here</span>
        <h2>${app.pkg ? "Get the app" : "More from SnackPack"}</h2>
        <p>${lead}</p>
        <div class="privacy-cta-actions">
${store}          <a class="btn btn-secondary" href="../../apps/${app.appPage}/">App details</a>
          <a class="btn btn-secondary" href="/play/">Play 30+ free games</a>
        </div>
      </div>
${qr}    </div>
  </div>
</section>
${CLOSE}`;
}

async function main() {
  let done = 0;
  const missing = [];
  for (const [slug, app] of Object.entries(APPS)) {
    const file = path.join(root, "privacy", slug, "index.html");
    let html;
    try {
      html = await fs.readFile(file, "utf8");
    } catch {
      missing.push(slug);
      continue;
    }
    const b = block(app);
    const existing = new RegExp(`${OPEN}[\\s\\S]*?${CLOSE}\\n?`, "m");
    html = existing.test(html)
      ? html.replace(existing, b + "\n")
      : html.replace("</main>", b + "\n</main>");
    await fs.writeFile(file, html, "utf8");
    done++;
  }
  console.log(`privacy CTA written to ${done} pages`);
  if (missing.length) console.log("no page for:", missing.join(", "));
}

main();
