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
const CACHE = "snackpack-arcade-v18";
const LAST_BASTION_RELEASE = "2026-09-11-qa08-chests";
const LAST_BASTION_CACHE = `last-bastion-${LAST_BASTION_RELEASE}`;

// Stable public filenames make a partial cache refresh unsafe: a new scene can
// otherwise execute beside an old simulation chunk or sprite sheet. Install
// every executable chunk as one transaction. Media remains runtime-cached so
// installing the arcade worker does not download the full 150 MB game.
const LAST_BASTION_CORE = [
  "/play/last-bastion/",
  "/play/last-bastion/game-assets/index.css",
  "/play/last-bastion/game-assets/arctic-relay-map-backdrop-v1-1536x1024.js",
  "/play/last-bastion/game-assets/assault-select-portrait-v1-1024x1536.js",
  "/play/last-bastion/game-assets/AssetGalleryScene.js",
  "/play/last-bastion/game-assets/BastionBackdropAsset.js",
  "/play/last-bastion/game-assets/codex-weapon-tile-atlas-v1-128.js",
  "/play/last-bastion/game-assets/CombatSimulation.js",
  "/play/last-bastion/game-assets/EncounterEventCatalog.js",
  "/play/last-bastion/game-assets/EncounterEventScene.js",
  "/play/last-bastion/game-assets/ExpeditionEventScene.js",
  "/play/last-bastion/game-assets/ExpeditionRun.js",
  "/play/last-bastion/game-assets/ExpeditionScene.js",
  "/play/last-bastion/game-assets/formatStat.js",
  "/play/last-bastion/game-assets/game.js",
  "/play/last-bastion/game-assets/GameAssetManifest.js",
  "/play/last-bastion/game-assets/HeroCatalog.js",
  "/play/last-bastion/game-assets/marauder-ar-tile-v1-128.js",
  "/play/last-bastion/game-assets/medic-select-portrait-v1-1024x1536.js",
  "/play/last-bastion/game-assets/medic.js",
  "/play/last-bastion/game-assets/phaser.js",
  "/play/last-bastion/game-assets/PhaserAssetLoader.js",
  "/play/last-bastion/game-assets/PhaserAssetQueue.js",
  "/play/last-bastion/game-assets/PrototypeScene.js",
  "/play/last-bastion/game-assets/RunSummaryScene.js",
  "/play/last-bastion/game-assets/scout-select-portrait-v1-1024x1536.js",
  "/play/last-bastion/game-assets/ShellScene.js",
  "/play/last-bastion/game-assets/tactician-select-portrait-v1-1024x1536.js",
  "/play/last-bastion/game-assets/title-menu-backdrop-v1-3840x2160.js",
  "/play/last-bastion/game-assets/TransformationDecisionScene.js",
  "/play/last-bastion/game-assets/upgradeCatalog.js",
  "/play/last-bastion/game-assets/WeaponReviewRoutes.js",
  "/play/last-bastion/game-assets/WeaponRingLayout.js",
  "/play/last-bastion/game-assets/WeaponTileFrames.js",
];

const SHELL = [
  "/",
  "/play/",
  "/site.css",
  "/play/play.css?v=13",
  "/play/funnel.js",
  "/play/share-result.js",
  "/play/keyboard-grid.js",
  "/play/pause.js",
  "/play/store.js",
  "/play/resume.js",
  "/play/hub.js",
  "/play/game-ui-assets.js",
  "/play/stats/",
  "/play/stats/stats.js",
  "/theme.js",
  "/play/audio.js",
  // All eight cues are now mapped to concrete game actions and stay available
  // offline with the rest of the arcade shell.
  "/play/shared-assets/game-ui/audio/place.wav",
  "/play/shared-assets/game-ui/audio/invalid.wav",
  "/play/shared-assets/game-ui/audio/pickup.wav",
  "/play/shared-assets/game-ui/audio/success.wav",
  "/play/shared-assets/game-ui/audio/win.wav",
  "/play/shared-assets/game-ui/audio/tick.wav",
  "/play/shared-assets/game-ui/audio/pop.wav",
  "/play/shared-assets/game-ui/audio/whoosh.wav",
  "/assets/fonts/fonts.css",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/icon-maskable-512.png",
  "/assets/atlas/atlas-quest-gameplay-desktop.webp",
  "/assets/atlas/atlas-quest-gameplay-mobile.webp",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    Promise.all([
      caches
        .open(CACHE)
        // The shared shell predates strict release manifests. Preserve its
        // tolerant install until each arcade game has a versioned contract.
        .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))),
      // addAll is deliberately all-or-nothing here. A missing executable keeps
      // the previous worker active instead of publishing a mixed game build.
      caches.open(LAST_BASTION_CACHE).then((c) => c.addAll(LAST_BASTION_CORE)),
    ])
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE && k !== LAST_BASTION_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function cacheSuccessful(cacheName, req, res) {
  if (!res || !res.ok) return;
  const copy = res.clone();
  caches.open(cacheName).then((c) => c.put(req, copy)).catch(() => {});
}

function offlineUnavailable() {
  return new Response("This resource is not available offline.", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function networkFirst(req, fallback, cacheName = CACHE) {
  return fetch(req)
    .then((res) => {
      cacheSuccessful(cacheName, req, res);
      return res;
    })
    .catch(() =>
      caches.match(req, { cacheName }).then((hit) => {
        if (hit) return hit;
        if (!fallback) return offlineUnavailable();
        return caches.match(fallback, { cacheName }).then(
          (fallbackHit) => fallbackHit || offlineUnavailable()
        );
      })
    );
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Let analytics, fonts from other origins and everything else pass straight through.
  if (url.origin !== self.location.origin) return;

  // Last Bastion has a coordinated release cache. Fetch every game resource
  // from the network first so stable media filenames refresh with the code;
  // offline fallback is restricted to this release, never an older one.
  if (url.pathname.startsWith("/play/last-bastion/")) {
    e.respondWith(networkFirst(
      req,
      req.mode === "navigate" ? "/play/last-bastion/" : undefined,
      LAST_BASTION_CACHE,
    ));
    return;
  }

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
            cacheSuccessful(CACHE, req, res);
            return res;
          })
      )
    );
  }
});
