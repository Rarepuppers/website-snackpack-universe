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
const response = { clone: () => response };
const context = {
  URL,
  fetch: () => Promise.resolve(response),
  caches: {
    match: () => Promise.resolve(undefined),
    open: () => Promise.resolve({ add: () => Promise.resolve(), put: () => Promise.resolve() }),
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

if (failures.length) {
  console.error(`JavaScript policy check failed (${failures.length}):\n`);
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`JavaScript syntax check passed (${candidates.length} files).`);
