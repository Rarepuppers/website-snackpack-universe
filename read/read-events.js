/* read-events.js -- anonymous counts for /read/ books.
 *
 * Page views cannot say whether a book was read. This sends fixed event names
 * per book and nothing else: no IDs, page numbers, free text or storage.
 *   books/<slug>/start    reading began (a page stayed in view, or a page was turned)
 *   books/<slug>/finish   the reader reached the end of the story
 *   books/<slug>/listen   "Read to me" was used
 *   books/<slug>/pdf      the printable PDF was opened
 * Each is sent at most once per page load. Loaded by reading-position.js.
 * Browsers that send Global Privacy Control or Do Not Track, and automated
 * browsers, send nothing. Keep /privacy/arcade/ in step with anything sent here.
 * Tests set window.SP_EVENTS_DEBUG = [] to collect paths instead of sending.
 */
(function () {
  "use strict";

  var ENDPOINT = "https://snackpack.goatcounter.com/count";
  var debug = Array.isArray(window.SP_EVENTS_DEBUG) ? window.SP_EVENTS_DEBUG : null;
  if (!debug && location.hostname !== "www.snackpackuniverse.com") return;
  var match = /^\/read\/([a-z0-9-]+)\/$/.exec(location.pathname);
  if (!match || window.__spReadEvents) return;
  window.__spReadEvents = true;

  var nav = window.navigator || {};
  var optedOut = nav.globalPrivacyControl === true || nav.doNotTrack === "1" || window.doNotTrack === "1";
  var automated = nav.webdriver === true || /HeadlessChrome|PhantomJS|Lighthouse/i.test(nav.userAgent || "");
  if (optedOut || (automated && !debug)) return;

  var book = match[1];
  var sent = {};
  function count(action) {
    if (sent[action]) return;
    sent[action] = true;
    var path = "/books/" + book + "/" + action;
    if (debug) { debug.push(path); return; }
    new Image().src = ENDPOINT + "?p=" + encodeURIComponent(path) + "&t=" + encodeURIComponent(book + " " + action) +
      "&e=true&rnd=" + Math.random().toString(36).slice(2);
  }

  function progress(completed) {
    count("start");
    if (completed) count("finish");
  }
  (window.__spReadProgress || []).forEach(progress);
  document.addEventListener("snackpack:reading-progress", function (e) { progress(e.detail && e.detail.completed); });
  document.addEventListener("snackpack:read-aloud", function () { count("listen"); });
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (a && /\.pdf(?:$|[?#])/i.test(a.getAttribute("href"))) count("pdf");
  }, true);
})();
