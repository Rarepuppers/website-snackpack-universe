import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.LAST_BASTION_PERFORMANCE_URL ?? "http://127.0.0.1:44176";
const outputFlag = process.argv.indexOf("--output");
const outputPath = path.resolve(
  outputFlag >= 0 && process.argv[outputFlag + 1]
    ? process.argv[outputFlag + 1]
    : "performance-report.local.json",
);

const routes = {
  title: "/play/last-bastion/?screen=title",
  map: "/play/last-bastion/?screen=map&mapseed=2026&threat=2",
  combat: "/play/last-bastion/?scenario=density-capacity&debug=1&seed=61061",
  shop: "/play/last-bastion/?scenario=scrap-shop&loadout=vertical&seed=61061",
  debrief: "/play/last-bastion/?screen=summary&summarydemo=1",
  boss: "/play/last-bastion/?scenario=bastion-eater&loadout=vertical&seed=61061",
  heaviestReleasedLoadout: "/play/last-bastion/?stress=12&seed=61061",
};

function resourceGroup(url) {
  const pathname = new URL(url).pathname;
  if (/\/game-assets\/.*\.js$/.test(pathname)) return "executable";
  if (/\/game-assets\/.*\.(?:png|jpe?g|webp|gif|svg)$/.test(pathname)) return "authored-art";
  if (/\.(?:wav|mp3|ogg)$/.test(pathname)) return "audio";
  if (/\.(?:css|woff2?)$/.test(pathname)) return "style-font";
  if (pathname.endsWith("/play/last-bastion/") || pathname.endsWith("/index.html")) return "document";
  return "other";
}

function sumResources(resources) {
  const groups = {};
  for (const resource of resources) {
    const group = resourceGroup(resource.name);
    const current = groups[group] ?? { requests: 0, transferBytes: 0, encodedBytes: 0, decodedBytes: 0 };
    current.requests += 1;
    current.transferBytes += resource.transferSize;
    current.encodedBytes += resource.encodedBodySize;
    current.decodedBytes += resource.decodedBodySize;
    groups[group] = current;
  }
  return groups;
}

function largestResources(resources, limit = 10) {
  return [...resources]
    .sort((left, right) => right.transferSize - left.transferSize)
    .slice(0, limit)
    .map((resource) => ({
      path: new URL(resource.name).pathname,
      group: resourceGroup(resource.name),
      transferBytes: resource.transferSize,
      decodedBytes: resource.decodedBodySize,
    }));
}

async function waitForRoute(page, name) {
  if (name === "title") {
    await page.waitForFunction(() => window.__shellState?.screen === "title");
    return;
  }
  if (name === "map") {
    await page.waitForFunction(() => Boolean(window.__expeditionState));
    return;
  }
  if (name === "debrief") {
    await page.waitForFunction(() => Boolean(window.__runSummary));
    return;
  }
  await page.waitForFunction(() => Number(window.__combatAssetAudit?.count) > 0);
  await page.waitForFunction(() => window.__displayPresentationAudit?.framePacing?.ready === true, null, {
    timeout: 20_000,
  });
}

async function measureRoute(page, name, route, cycle) {
  await page.evaluate(() => performance.clearResourceTimings());
  const started = Date.now();
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  await waitForRoute(page, name);
  await page.waitForTimeout(250);
  const browserMetrics = await page.evaluate(() => {
    window.gc?.();
    const navigation = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource").map((entry) => ({
      name: entry.name,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
    }));
    return {
      elapsedMilliseconds: performance.now(),
      navigation: navigation ? {
        responseStartMilliseconds: navigation.responseStart,
        domContentLoadedMilliseconds: navigation.domContentLoadedEventEnd,
        loadMilliseconds: navigation.loadEventEnd,
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize,
        decodedBodySize: navigation.decodedBodySize,
      } : null,
      resources,
      framePacing: window.__displayPresentationAudit?.framePacing ?? null,
      textures: window.__displayPresentationAudit?.textures ?? null,
      jsHeapBytes: performance.memory?.usedJSHeapSize ?? null,
    };
  });
  return {
    name,
    route,
    cycle,
    wallMilliseconds: Date.now() - started,
    readyMilliseconds: browserMetrics.elapsedMilliseconds,
    navigation: browserMetrics.navigation,
    resourceGroups: sumResources(browserMetrics.resources),
    largestResources: largestResources(browserMetrics.resources),
    resourceCount: browserMetrics.resources.length,
    framePacing: browserMetrics.framePacing,
    textures: browserMetrics.textures,
    jsHeapBytes: browserMetrics.jsHeapBytes,
  };
}

const browser = await chromium.launch({
  args: ["--enable-precise-memory-info", "--js-flags=--expose-gc"],
});
const browserVersion = browser.version();
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  serviceWorkers: "block",
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Network.enable");
await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });

const failures = [];
page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  const expectedAnalyticsFailure = message.text().includes("cloudflareinsights.com/cdn-cgi/rum");
  if (message.type() === "error" && !expectedAnalyticsFailure) {
    failures.push(`console: ${message.text()}`);
  }
});
page.on("requestfailed", (request) => {
  if (request.url().includes("/play/last-bastion/")) {
    failures.push(`request: ${request.url()} (${request.failure()?.errorText ?? "failed"})`);
  }
});
page.on("response", (response) => {
  if (response.url().includes("/play/last-bastion/") && response.status() >= 400) {
    failures.push(`response: ${response.status()} ${response.url()}`);
  }
});

const samples = [];
try {
  samples.push(await measureRoute(page, "title", routes.title, 0));
  samples.push(await measureRoute(page, "boss", routes.boss, 0));
  samples.push(await measureRoute(page, "heaviestReleasedLoadout", routes.heaviestReleasedLoadout, 0));
  for (let cycle = 1; cycle <= 3; cycle += 1) {
    for (const name of ["map", "combat", "shop", "debrief"]) {
      samples.push(await measureRoute(page, name, routes[name], cycle));
    }
  }
} finally {
  await browser.close();
}

const repeatedRouteTrends = Object.fromEntries(
  ["map", "combat", "shop", "debrief"].map((name) => {
    const matching = samples.filter((sample) => sample.name === name);
    const first = matching[0];
    const last = matching[matching.length - 1];
    const heaps = matching.map((sample) => sample.jsHeapBytes).filter((value) => value !== null);
    const textureCounts = matching.map((sample) => sample.textures?.textureCount ?? null)
      .filter((value) => value !== null);
    return [name, {
      heapDeltaBytes: first?.jsHeapBytes === null || last?.jsHeapBytes === null
        ? null
        : last.jsHeapBytes - first.jsHeapBytes,
      textureCountDelta: first?.textures === null || last?.textures === null
        ? null
        : last.textures.textureCount - first.textures.textureCount,
      decodedTextureBytesDelta: first?.textures === null || last?.textures === null
        ? null
        : last.textures.estimatedDecodedBytes - first.textures.estimatedDecodedBytes,
      heapMonotonicallyIncreased: heaps.length === matching.length
        ? heaps.slice(1).every((value, index) => value > heaps[index])
        : null,
      textureCountMonotonicallyIncreased: textureCounts.length === matching.length
        ? textureCounts.slice(1).every((value, index) => value > textureCounts[index])
        : null,
    }];
  }),
);

const report = {
  schemaVersion: 1,
  measuredAt: new Date().toISOString(),
  advisoryOnly: true,
  note: "Set device budgets before treating these measurements as pass/fail gates.",
  environment: {
    browser: `Chromium ${browserVersion}`,
    platform: `${process.platform}-${process.arch}`,
    viewport: { width: 1920, height: 1080 },
    baseUrl,
  },
  failures,
  samples,
  repeatedRouteTrends,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Performance report written to ${outputPath}`);
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
