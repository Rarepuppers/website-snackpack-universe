/* sw.js — service worker for the SnackPack arcade.
 *
 * The whole pitch of this arcade is "no ads, no sign-in, no download". Until
 * now "works offline" was only true of the Android bundle, not the site. This
 * makes it true of the site too: install it from the browser and the games keep
 * working on a plane or a bad train connection.
 *
 * ⚠ BUMP `CACHE` whenever shared code or markup changes. Code and markup are
 * served network-first so a fix still lands without one, but the bump is what
 * actually evicts the stale copies.
 *
 * Games are self-contained pages: one HTML file plus site.css/play.css and a
 * couple of shared scripts. So we precache the shell and let each game page
 * cache itself the first time it's visited.
 */
const CACHE = "snackpack-arcade-v6";

const SHELL = [
  "/",
  "/play/",
  "/site.css",
  "/play/play.css",
  "/play/funnel.js",
  "/play/share-result.js",
  "/play/keyboard-grid.js",
  "/play/pause.js",
  "/play/audio.js",
  // Only the sounds currently wired into a game are precached. The other four
  // (invalid, tick, pop, whoosh) exist and are generated, but nothing calls them
  // yet — precaching them would cost every visitor bytes for silence.
  "/play/shared-assets/game-ui/audio/place.wav",
  "/play/shared-assets/game-ui/audio/pickup.wav",
  "/play/shared-assets/game-ui/audio/success.wav",
  "/play/shared-assets/game-ui/audio/win.wav",
  "/assets/fonts/fonts.css",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/icon-maskable-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      // addAll is all-or-nothing; one 404 would abandon the whole install, so
      // add them individually and tolerate misses.
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function networkFirst(req, fallback) {
  return fetch(req)
    .then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    })
    .catch(() =>
      caches.match(req).then((hit) => hit || (fallback ? caches.match(fallback) : undefined))
    );
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Let analytics, fonts from other origins and everything else pass straight through.
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first so a page edit lands immediately; fall back to
  // the cached page, then the arcade index, when offline.
  if (req.mode === "navigate") {
    e.respondWith(networkFirst(req, "/play/"));
    return;
  }

  // Code and markup must never go stale.
  if (/\.(?:js|css|html|webmanifest|json)$/.test(url.pathname)) {
    e.respondWith(networkFirst(req));
    return;
  }

  // Only small, reusable media assets are cache-first. Leave PDFs, archives,
  // videos and unknown future file types to the browser/network so a corrected
  // download cannot be trapped in cache and large files cannot evict the
  // offline arcade shell.
  if (/\.(?:png|jpe?g|webp|svg|gif|woff2?|wav|mp3|ogg)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
      )
    );
  }
});
