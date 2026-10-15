/* read/offline.js — "Save the bookshelf for offline" on /read/.
 *
 * Copies every book page, its pictures, the stylesheet and fonts into the
 * site's service-worker cache, so the whole shelf opens on a plane or with no
 * signal. The list of files comes from read/offline-manifest.json, which
 * scripts/build-read-shelf.mjs writes from the shelf, so new books are
 * included automatically. PDFs are left out on purpose: they are large and
 * printing needs a connection anyway.
 *
 * Why the cache name is discovered rather than hard-coded: sw.js serves
 * offline pages only from its own versioned cache ("snackpack-arcade-vNN"),
 * and that name changes whenever sw.js is updated. Writing anywhere else would
 * look saved but never be served. The flip side: a new sw.js version clears
 * the old cache, so the status shown here is read from the cache itself, never
 * from a remembered flag, and says "Save again" when a copy has gone.
 */
(function () {
  "use strict";

  var btn = document.querySelector("[data-read-offline]");
  var status = document.querySelector("[data-read-offline-status]");
  if (!btn || !status) return;

  var wrap = btn.closest(".read-offline");
  if (!("caches" in window) || !("serviceWorker" in navigator)) {
    if (wrap) wrap.hidden = true; // nothing honest to offer
    return;
  }
  if (wrap) wrap.hidden = false;

  var manifest = null;

  function say(msg) { status.textContent = msg; }
  function mb(bytes) { return (bytes / 1048576).toFixed(bytes < 10485760 ? 1 : 0) + " MB"; }

  function cacheName() {
    return caches.keys().then(function (keys) {
      for (var i = 0; i < keys.length; i++) if (keys[i].indexOf("snackpack-arcade-") === 0) return keys[i];
      return null;
    });
  }

  function loadManifest() {
    if (manifest) return Promise.resolve(manifest);
    return fetch("./offline-manifest.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("manifest " + r.status); return r.json(); })
      .then(function (m) { manifest = m; return m; });
  }

  // Saved = every file in the manifest is in the worker's current cache. The
  // worker also caches pages as they are visited, so a partial count is normal
  // and is reported in books ("3 of 13"), never as files.
  var BOOK_PAGE = /^\/read\/(?!sound-cards\/)[^/]+\/$/;
  function checkSaved() {
    return Promise.all([loadManifest(), cacheName()]).then(function (res) {
      var m = res[0], name = res[1];
      var bookUrls = m.urls.filter(function (u) { return BOOK_PAGE.test(u); });
      if (!name) return { all: false, books: 0, m: m };
      return caches.open(name).then(function (c) {
        return Promise.all(m.urls.map(function (u) { return c.match(u).then(function (hit) { return !!hit; }); }));
      }).then(function (hits) {
        var books = bookUrls.filter(function (u) { return hits[m.urls.indexOf(u)]; }).length;
        return { all: hits.every(Boolean), books: books, m: m };
      });
    });
  }

  function refresh() {
    return checkSaved().then(function (s) {
      if (s.all) {
        btn.textContent = "Saved for offline ✓";
        btn.disabled = true;
        say("All " + s.m.books + " books open on this device without a connection.");
      } else if (s.books > 0) {
        btn.textContent = "Save all " + s.m.books + " books for offline";
        btn.disabled = false;
        say(s.books + " of " + s.m.books + " books are already on this device (the ones opened here). Save the rest too: about " + mb(s.m.bytes) + ".");
      } else {
        btn.textContent = "Save all " + s.m.books + " books for offline";
        btn.disabled = false;
        say("About " + mb(s.m.bytes) + ". Read them later with no signal. PDFs are not included.");
      }
    }).catch(function () { say(""); });
  }

  function save() {
    btn.disabled = true;
    say("Getting ready…");
    navigator.serviceWorker.register("/sw.js").catch(function () {});
    Promise.all([loadManifest(), navigator.serviceWorker.ready.then(cacheName)])
      .then(function (res) {
        var m = res[0], name = res[1];
        if (!name) throw new Error("no worker cache");
        return caches.open(name).then(function (cache) {
          var done = 0, failed = 0, next = 0;
          function worker() {
            if (next >= m.urls.length) return Promise.resolve();
            var url = m.urls[next++];
            return cache.add(url).catch(function () { failed++; }).then(function () {
              done++;
              say("Saving… " + done + " of " + m.urls.length);
              return worker();
            });
          }
          return Promise.all([worker(), worker(), worker(), worker()]).then(function () { return failed; });
        });
      })
      .then(function (failed) {
        if (failed) say(failed + " files could not be saved. Check the connection and try again.");
        return refresh();
      })
      .catch(function () {
        btn.disabled = false;
        say("Saving for offline is not available in this browser right now. Try again after the page has fully loaded.");
      });
  }

  btn.addEventListener("click", save);
  refresh();
})();
