// Count outbound Play-badge clicks from app pages.
//
// Why this exists: Cloudflare Web Analytics is the only analytics on this
// property, it is the beacon-only free tier, and that tier has no custom
// events -- so an onclick handler has nowhere to report to. The single thing
// Cloudflare will count is a page view of a real page that a real browser
// renders. So each app page's Play badge now points at a tiny interstitial,
// /go/<slug>/, which loads (and is therefore counted) and immediately hands
// the visitor on to the tagged Play URL.
//
// That turns "did anyone who read the app page actually go to the store?" --
// unanswerable before, and the question every traffic spike raises -- into a
// row in the Cloudflare page-views table.
//
// Play attribution is unchanged on purpose. build-play-links.mjs classifies
// go/<slug>/ as surface `app-page`, campaign <slug>: byte-identical to the
// referrer the badge carried when it linked to Play directly, so the existing
// Play Console series continues rather than restarting.
//
// Deliberately app pages only. The home page, /apps/, guides and the arcade
// keep their direct Play links -- they have their own surface tags, and the
// open question is specifically about app-page readers.
//
// Usage:
//   node scripts/build-go-links.mjs           # generate + rewrite in place
//   node scripts/build-go-links.mjs --check   # fail if anything is stale (CI)

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const checkOnly = process.argv.includes("--check");

const PLAY_HOST = "https://play.google.com/store/apps/details";
const BEACON = '{"token": "0e57cfb3eb86422ca40e5fac02b1cf94"}';

// The referrer build-play-links.mjs would write for a file at go/<slug>/.
// Replicated rather than imported because that file is a script, not a module.
// Drift is caught, not silent: `build-play-links.mjs --check` rewrites anything
// that disagrees with it, so CI fails if this ever falls out of step.
function referrerFor(slug) {
  return encodeURIComponent(`utm_source=website&utm_medium=app-page&utm_campaign=${slug}`);
}

const badgeRe = /(<a class="store-badge-link" href=")([^"]*)(")/g;
const playIdRe = /https:\/\/play\.google\.com\/store\/apps\/details\?id=([A-Za-z0-9._]+)/;

const stale = [];
let generated = 0;
let rewritten = 0;

const appsDir = path.join(root, "apps");
for (const slug of fs.readdirSync(appsDir).sort()) {
  const pageFile = path.join(appsDir, slug, "index.html");
  if (!fs.existsSync(pageFile)) continue;

  const html = fs.readFileSync(pageFile, "utf8");
  const badges = [...html.matchAll(badgeRe)];
  if (badges.length === 0) continue; // unreleased app: no badge, nothing to count

  // The package id can already have moved into the interstitial on a re-run,
  // so read it from whichever of the two currently holds the real Play URL.
  const goFile = path.join(root, "go", slug, "index.html");
  const existingGo = fs.existsSync(goFile) ? fs.readFileSync(goFile, "utf8") : "";
  const pkg = (html.match(playIdRe) || existingGo.match(playIdRe) || [])[1];
  if (!pkg) {
    stale.push(`apps/${slug}: has a store badge but no Play package id`);
    continue;
  }

  // ── the interstitial ──
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || slug;
  const name = title.split("|")[0].trim();
  const playUrl = `${PLAY_HOST}?id=${pkg}&referrer=${referrerFor(slug)}`;
  const wantGo = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Opening Google Play — ${name}</title>
<link rel="icon" type="image/png" href="/assets/favicon-32.png">
<style>
  body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh;
         display: flex; align-items: center; justify-content: center;
         text-align: center; padding: 24px; }
</style>
</head>
<body>
<main>
  <p>Taking you to Google Play…</p>
  <!-- Single source of truth for the URL: the redirect below reads this
       anchor, so build-play-links.mjs tagging it tags the redirect too. It is
       also the no-JavaScript path -- without it this page is a dead end. -->
  <p><a id="go-link" href="${playUrl}" rel="noopener">Continue to ${name} on Google Play</a></p>
  <p><a href="/apps/${slug}/">Back to the ${name} page</a></p>
</main>
<!-- Cloudflare Web Analytics -->
<script defer src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon='${BEACON}'></script>
<!-- End Cloudflare Web Analytics -->
<script>
  // replace(), not assign(): Back from the Play listing should return to the
  // app page the visitor came from, not to this page, which would bounce them
  // straight forward again and trap them.
  (function () {
    var a = document.getElementById("go-link");
    if (a) { window.location.replace(a.href); }
  })();
</script>
</body>
</html>
`;

  if (existingGo !== wantGo) {
    if (checkOnly) stale.push(`go/${slug}/index.html: out of date`);
    else {
      fs.mkdirSync(path.dirname(goFile), { recursive: true });
      fs.writeFileSync(goFile, wantGo);
      generated += 1;
    }
  }

  // ── point the badge at it ──
  const updated = html.replace(badgeRe, (m, open, href, close) =>
    href === `/go/${slug}/` ? m : `${open}/go/${slug}/${close}`
  );
  if (updated !== html) {
    if (checkOnly) stale.push(`apps/${slug}/index.html: store badge does not point at /go/${slug}/`);
    else {
      fs.writeFileSync(pageFile, updated);
      rewritten += 1;
    }
  }
}

if (stale.length) {
  console.error("Stale download-click tracking:\n" + stale.map((s) => "  " + s).join("\n"));
  console.error("\nRun: node scripts/build-go-links.mjs");
  process.exit(1);
}
console.log(
  checkOnly
    ? "build-go-links: all interstitials current."
    : `build-go-links: ${generated} interstitial(s) written, ${rewritten} app page(s) repointed.`
);
