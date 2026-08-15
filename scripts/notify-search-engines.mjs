// Tell search engines something shipped, instead of waiting to be crawled.
//
// Why this exists: the 2026-08-15 audit found that Google last *downloaded*
// sitemap.xml on 2026-08-11, before /read/, /play/daily/, /play/snackwords/ and
// the printables guide existed -- all four were reported "URL is unknown to
// Google". Separately, /play/thirteen/ ranked page-one on a single crawl dated
// 2026-07-25 and had not been recrawled 21 days later. With four inbound links,
// this site is crawled rarely and entirely on Google's schedule. A submit after
// each deploy is the only signal we can send at will.
//
// IMPORTANT -- the obvious approach does not work any more. Both legacy
// "ping" endpoints are dead, verified 2026-08-15:
//
//   https://www.google.com/ping?sitemap=...   -> 404 (retired 2023)
//   https://www.bing.com/ping?sitemap=...     -> 410 Gone
//
// So this uses the two mechanisms that are actually live:
//
//   1. Google -- the Search Console API's sitemaps.submit, authenticated with
//      the service account that already has Full permission on the property.
//   2. Everyone else -- IndexNow, which Bing, Yandex, Seznam and Naver share.
//      Bing matters here: it showed 841 impressions over ~6 months, on a
//      property Google barely crawls.
//
// Usage:
//   node scripts/notify-search-engines.mjs                 # sitemap + IndexNow
//   node scripts/notify-search-engines.mjs <url> [<url>…]  # also push URLs
//
// The service account key is not in this repo. Point SNACKPACK_GSC_KEY at it,
// or leave it unset and the Google half is skipped with a warning rather than
// failing -- IndexNow needs no credentials and still runs.

import crypto from "node:crypto";
import fs from "node:fs";

const ORIGIN = "https://www.snackpackuniverse.com";
const SITEMAP = `${ORIGIN}/sitemap.xml`;
const PROPERTY = "sc-domain:snackpackuniverse.com";

// A public verification token, not a secret. IndexNow requires it to be
// readable at the site root so the receiving engine can confirm we own the
// domain -- that is the whole point, so committing it is correct.
const INDEXNOW_KEY = "900693c096558a71b548e48b92b33acd";

const DEFAULT_KEY_PATH = "D:/billing/api-tokens/snackpack-abc-alphabet-billing-f2c06893aa0b.json";

let failed = false;

// ---------------------------------------------------------------------------
// Google — Search Console API
// ---------------------------------------------------------------------------

function base64url(value) {
  const buf = typeof value === "string" ? Buffer.from(value) : Buffer.from(JSON.stringify(value));
  return buf.toString("base64url");
}

/** Mint an access token from the service-account key (RS256 JWT bearer flow). */
async function accessToken(keyFile) {
  const key = JSON.parse(fs.readFileSync(keyFile, "utf8"));
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/webmasters",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };
  const unsigned = `${base64url({ alg: "RS256", typ: "JWT" })}.${base64url(claim)}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(key.private_key).toString("base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`
    })
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`token request failed: ${JSON.stringify(json)}`);
  return json.access_token;
}

async function submitSitemap() {
  const keyFile = process.env.SNACKPACK_GSC_KEY || DEFAULT_KEY_PATH;
  if (!fs.existsSync(keyFile)) {
    console.warn(`! Google: skipped — no service-account key at ${keyFile}`);
    console.warn("  Set SNACKPACK_GSC_KEY to the JSON key to enable this half.");
    return;
  }

  const token = await accessToken(keyFile);
  const url =
    `https://searchconsole.googleapis.com/webmasters/v3/sites/` +
    `${encodeURIComponent(PROPERTY)}/sitemaps/${encodeURIComponent(SITEMAP)}`;

  const res = await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.error(`✗ Google: sitemap submit returned ${res.status} ${await res.text()}`);
    failed = true;
    return;
  }
  console.log(`✓ Google: submitted ${SITEMAP} to ${PROPERTY}`);

  // Report what Google thinks it has, so a silent no-op is visible.
  const listRes = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(PROPERTY)}/sitemaps`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const list = await listRes.json();
  for (const entry of list.sitemap || []) {
    const web = (entry.contents || []).find((c) => c.type === "web");
    console.log(
      `  last downloaded ${entry.lastDownloaded || "never"}` +
        `, ${web ? web.submitted : "?"} URLs, ${entry.errors || 0} errors`
    );
  }
}

// ---------------------------------------------------------------------------
// IndexNow — Bing, Yandex, Seznam, Naver
// ---------------------------------------------------------------------------

/** Every indexable URL in the sitemap, so a bare run still pushes the lot. */
function urlsFromSitemap() {
  const xml = fs.readFileSync("sitemap.xml", "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function submitIndexNow(urls) {
  if (!fs.existsSync(`${INDEXNOW_KEY}.txt`)) {
    console.error(`✗ IndexNow: ${INDEXNOW_KEY}.txt is missing from the site root.`);
    console.error("  The receiving engine fetches that file to verify we own the domain.");
    failed = true;
    return;
  }

  // IndexNow accepts up to 10,000 per request; we are nowhere near that.
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: "www.snackpackuniverse.com",
      key: INDEXNOW_KEY,
      keyLocation: `${ORIGIN}/${INDEXNOW_KEY}.txt`,
      urlList: urls
    })
  });

  // 200 = accepted, 202 = accepted but key not yet validated (normal on the
  // first run, because the key file has to be live before they can fetch it).
  if (res.status === 200 || res.status === 202) {
    const note = res.status === 202 ? " (key pending validation — expected on first run)" : "";
    console.log(`✓ IndexNow: submitted ${urls.length} URL(s)${note}`);
    return;
  }
  console.error(`✗ IndexNow: returned ${res.status} ${await res.text()}`);
  failed = true;
}

// ---------------------------------------------------------------------------

const explicit = process.argv.slice(2).filter((a) => a.startsWith("http"));
const urls = explicit.length > 0 ? explicit : urlsFromSitemap();

console.log(`Notifying search engines about ${urls.length} URL(s).\n`);

try {
  await submitSitemap();
} catch (error) {
  console.error(`✗ Google: ${error.message}`);
  failed = true;
}

await submitIndexNow(urls);

if (failed) {
  console.error("\nOne or more notifications failed.");
  process.exit(1);
}
console.log("\nDone. Run this after every deploy.");
