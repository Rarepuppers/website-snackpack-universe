import { test, expect } from "@playwright/test";

// /go/* pages exist only to be counted by Cloudflare Web Analytics before they
// hand the visitor on to Google Play. Until 2026-10-24 they redirected from an
// inline script, before the deferred beacon had even run, so Cloudflare
// recorded 0 /go/ views in 28 days and "nobody clicks through to Play" was a
// measurement failure.
//
// The stub beacon reports the way the real one was measured to: one request to
// /cdn-cgi/rum right after window load. Play is stubbed so nothing leaves the
// test machine.

const GO = "/go/arcade/thirteen/braingames2/";

async function stub(page, { beacon }) {
  const events = [];
  await page.route("https://static.cloudflareinsights.com/**", (route) => {
    if (beacon === "blocked") return route.abort();
    return route.fulfill({
      contentType: "application/javascript",
      body: `addEventListener("load", function () {
        var x = new XMLHttpRequest();
        x.open("POST", "https://cloudflareinsights.com/cdn-cgi/rum");
        x.send("{}");
      });`,
    });
  });
  await page.route("https://cloudflareinsights.com/cdn-cgi/rum", (route) => {
    events.push("rum");
    return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } });
  });
  await page.route("https://play.google.com/**", (route) => {
    events.push("play");
    return route.fulfill({ contentType: "text/html", body: "<title>Play stub</title>" });
  });
  return events;
}

for (const campaign of ["thirteen", "thirteen-qr", "thirteen-reminder"]) {
  test(`${campaign} reports the view to Cloudflare and preserves its Play campaign`, async ({ page }) => {
    const events = await stub(page, { beacon: "ok" });
    await page.goto(`/go/arcade/${campaign}/braingames2/`, { waitUntil: "commit" });
    await page.waitForURL(/play\.google\.com/, { timeout: 5_000 });
    expect(events).toEqual(["rum", "play"]);
    const playUrl = new URL(page.url());
    expect(playUrl.searchParams.get("id")).toBe("com.snackpackuniverse.braingames2");
    expect(new URLSearchParams(playUrl.searchParams.get("referrer")).get("utm_campaign")).toBe(campaign);
  });
}

test("a blocked beacon does not strand the visitor", async ({ page }) => {
  const events = await stub(page, { beacon: "blocked" });
  const start = Date.now();
  await page.goto(GO, { waitUntil: "commit" });
  await page.waitForURL(/play\.google\.com/, { timeout: 5_000 });
  expect(events).toEqual(["play"]);
  expect(Date.now() - start).toBeLessThan(3_000);
});

test("the page shows a working link while it waits", async ({ page }) => {
  await stub(page, { beacon: "ok" });
  // Hold the beacon's report so the page stays put long enough to read.
  await page.route("https://cloudflareinsights.com/cdn-cgi/rum", () => {});
  await page.addInitScript(() => { window.setTimeout = () => 0; });
  await page.goto(GO);
  const link = page.locator("#go-link");
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", /^https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.snackpackuniverse\.braingames2&referrer=/);
});
