// Syntax-check the website-owned JavaScript that is edited directly.
// Large built/vendor trees (notably Last Bastion) have their own build checks.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const root = path.resolve(".");
const candidates = [
  path.join(root, "sw.js"),
  ...fs.readdirSync(path.join(root, "play"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => path.join(root, "play", entry.name)),
  ...fs.readdirSync(path.join(root, "scripts"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:js|mjs)$/.test(entry.name))
    .map((entry) => path.join(root, "scripts", entry.name)),
].sort();

const failures = [];
for (const file of candidates) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    failures.push(`${path.relative(root, file)}\n${result.stderr || result.stdout}`);
  }
}

if (failures.length) {
  console.error(`JavaScript syntax check failed (${failures.length}):\n`);
  console.error(failures.join("\n"));
  process.exit(1);
}

// Exercise the service worker's routing boundary. PDFs and unknown large files
// must pass through untouched; only navigations, code, and approved small media
// should be handled by the offline cache.
const listeners = {};
const response = { ok: true, clone: () => response };
let fetchResponse = response;
let fetchCalls = 0;
let cacheMatchCalls = 0;
const cacheWrites = [];
const cacheAddAllCalls = [];
const context = {
  URL,
  Response,
  Promise,
  fetch: () => { fetchCalls += 1; return Promise.resolve(fetchResponse); },
  caches: {
    match: () => { cacheMatchCalls += 1; return Promise.resolve(undefined); },
    open: (name) => Promise.resolve({
      add: () => Promise.resolve(),
      addAll: (urls) => { cacheAddAllCalls.push({ name, urls }); return Promise.resolve(); },
      put: (request) => { cacheWrites.push({ name, request }); return Promise.resolve(); },
    }),
    keys: () => Promise.resolve([]),
    delete: () => Promise.resolve(true),
  },
  self: {
    location: { origin: "https://www.snackpackuniverse.com" },
    addEventListener: (type, handler) => { listeners[type] = handler; },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
  },
};
vm.runInNewContext(fs.readFileSync(path.join(root, "sw.js"), "utf8"), context);

function serviceWorkerHandles(pathname, mode = "no-cors") {
  let handled = false;
  listeners.fetch({
    request: { method: "GET", mode, url: `https://www.snackpackuniverse.com${pathname}` },
    respondWith: () => { handled = true; },
  });
  return handled;
}

if (serviceWorkerHandles("/read/book.pdf") || serviceWorkerHandles("/download/archive.zip")) {
  failures.push("sw.js cache routing must not intercept PDFs or unknown large downloads");
}
if (!serviceWorkerHandles("/read/cover.webp") || !serviceWorkerHandles("/play/game.js") || !serviceWorkerHandles("/read/", "navigate")) {
  failures.push("sw.js must still handle approved media, code, and navigations");
}

let installPromise;
listeners.install({ waitUntil: (promise) => { installPromise = promise; } });
await installPromise;
const lastBastionInstall = cacheAddAllCalls.find(({ name }) => name.startsWith("last-bastion-"));
if (!lastBastionInstall || !lastBastionInstall.urls.includes("/play/last-bastion/game-assets/game.js")) {
  failures.push("sw.js must install Last Bastion's executable release atomically");
}

const swSource = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const coreBlock = swSource.match(/const LAST_BASTION_CORE = \[([\s\S]*?)\];/)?.[1] ?? "";
const publishedChunks = fs.readdirSync(path.join(root, "play", "last-bastion", "game-assets"))
  .filter((name) => name.endsWith(".js"));
const omittedChunks = publishedChunks.filter((name) => !coreBlock.includes(`/play/last-bastion/game-assets/${name}`));
if (omittedChunks.length) {
  failures.push(`sw.js Last Bastion release omits executable chunks: ${omittedChunks.join(", ")}`);
}
const listedChunks = [...coreBlock.matchAll(/\/play\/last-bastion\/game-assets\/([^"']+\.js)/g)]
  .map((match) => match[1]);
const staleChunks = listedChunks.filter((name) => !publishedChunks.includes(name));
if (staleChunks.length) {
  failures.push(`sw.js Last Bastion release lists missing executable chunks: ${staleChunks.join(", ")}`);
}

async function serviceWorkerResponse(pathname, mode = "no-cors") {
  let responsePromise;
  listeners.fetch({
    request: { method: "GET", mode, url: `https://www.snackpackuniverse.com${pathname}` },
    respondWith: (promise) => { responsePromise = promise; },
  });
  return responsePromise;
}

fetchCalls = 0;
cacheMatchCalls = 0;
await serviceWorkerResponse("/play/last-bastion/game-assets/title-menu-backdrop-v1-3840x2160.png");
if (fetchCalls !== 1 || cacheMatchCalls !== 0) {
  failures.push("Last Bastion media must be network-first within its release cache");
}

const writesBeforeFailure = cacheWrites.length;
fetchResponse = { ok: false, clone: () => fetchResponse };
await serviceWorkerResponse("/play/last-bastion/game-assets/game.js");
await Promise.resolve();
if (cacheWrites.length !== writesBeforeFailure) {
  failures.push("sw.js must not cache unsuccessful Last Bastion responses");
}

if (failures.length) {
  console.error(`JavaScript policy check failed (${failures.length}):\n`);
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`JavaScript syntax check passed (${candidates.length} files).`);
