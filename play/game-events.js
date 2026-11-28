/* game-events.js -- anonymous arcade counts.
 *
 * Cloudflare Web Analytics only sees page arrivals, so it cannot say which
 * games get played. This sends fixed event names and nothing else: no IDs,
 * scores, free text or storage.
 *
 * On a game page (loaded by funnel.js):
 *   start             first real input in the game area (a page view is not a game)
 *   first-move        first successful slide (2048) or grid digit edit (Killer Sudoku)
 *   app-reminder-shown  the one-time Thirteen Android reminder was displayed
 *   win               SnackPack.celebrate was called (losses are not counted)
 *   daily             today's daily puzzle completed (daily-state.js)
 *   class-start      play began after opening a teacher link
 *   class-daily      today's daily was completed after opening a teacher link
 *   friends           a Thirteen friend table was used (rooms.js)
 *   time-<bucket>     after a start, how long the page was in view, sent once
 *                     when the page is hidden: under-1m, 1-5m, 5-15m, 15m-plus
 * On the /play/ hub (loaded by hub.js):
 *   hub/<slug>        a game tile was opened
 *   hub-position/<p>  where that tile sat: 1-5, 6-12, 13-plus, recent, or together
 *
 * Browsers that send Global Privacy Control or Do Not Track, and automated
 * browsers, send nothing. Keep /privacy/arcade/ in step with anything sent here.
 * Tests set window.SP_EVENTS_DEBUG = [] to collect paths instead of sending.
 */
(function () {
  "use strict";

  var ENDPOINT = "https://snackpack.goatcounter.com/count";
  var debug = Array.isArray(window.SP_EVENTS_DEBUG) ? window.SP_EVENTS_DEBUG : null;
  if (!debug && location.hostname !== "www.snackpackuniverse.com") return;
  if (window.__spGameEvents) return; // never wire twice
  window.__spGameEvents = true;

  var nav = window.navigator || {};
  var optedOut = nav.globalPrivacyControl === true || nav.doNotTrack === "1" || window.doNotTrack === "1";
  var automated = nav.webdriver === true || /HeadlessChrome|PhantomJS|Lighthouse/i.test(nav.userAgent || "");
  if (optedOut || (automated && !debug)) return;

  function send(path, title) {
    path = "/arcade/" + path;
    if (debug) { debug.push(path); return; }
    var query = "p=" + encodeURIComponent(path) + "&t=" + encodeURIComponent(title) +
      "&e=true&rnd=" + Math.random().toString(36).slice(2);
    new Image().src = ENDPOINT + "?" + query;
  }

  window.SnackPack = window.SnackPack || {};

  if (location.pathname === "/play/") { hub(); return; }

  var match = /^\/play\/([a-z0-9-]+)\/$/.exec(location.pathname);
  var RESERVED = { daily: 1, stats: 1, "last-bastion": 1, docs: 1 };
  if (!match || RESERVED[match[1]]) return;
  var game = match[1];
  var query = new URLSearchParams(location.search);
  var classroom = (game === "typing" || game === "math-facts") &&
    query.get("daily") === "today" && query.get("classroom") === "1";
  function count(action) { send(game + "/" + action, game + " " + action); }

  // ── start ──
  var started = false;
  var visibleMs = 0, visibleSince = 0, timeSent = false;
  function onInput(event) {
    if (started) return;
    var target = event.target;
    if (event.type === "keydown") {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key === "Tab") return;
      if (target && target.closest && target.closest("input, textarea, select, summary, a, nav, .site-header")) return;
    } else if (!target || !target.closest || !target.closest(".game-stage") || target.closest("a")) {
      return;
    }
    started = true;
    visibleSince = document.hidden ? 0 : Date.now();
    count("start");
    if (classroom) count("class-start");
    document.removeEventListener("pointerdown", onInput, true);
    document.removeEventListener("keydown", onInput, true);
    document.removeEventListener("input", onInput, true);
  }
  document.addEventListener("pointerdown", onInput, true);
  document.addEventListener("keydown", onInput, true);
  // Snack Typer takes keystrokes and IME text through its game textarea.
  if (game === "typing") document.addEventListener("input", onInput, true);

  // ── time in view after the start, sent once ──
  function bucket(ms) {
    var m = ms / 60000;
    return m < 1 ? "under-1m" : m < 5 ? "1-5m" : m < 15 ? "5-15m" : "15m-plus";
  }
  function onHide() {
    if (!started || timeSent) return;
    if (visibleSince) { visibleMs += Date.now() - visibleSince; visibleSince = 0; }
    timeSent = true;
    count("time-" + bucket(visibleMs));
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) onHide();
  });
  window.addEventListener("pagehide", onHide);

  // Keep the established start count separately from these gameplay milestones.
  if (game === "2048" || game === "killer-sudoku") {
    var firstMoveSent = false;
    window.SnackPack.countFirstMove = function () {
      if (firstMoveSent) return;
      firstMoveSent = true;
      count("first-move");
    };
  }
  if (game === "thirteen") {
    var reminderSent = false;
    window.SnackPack.countAppReminderShown = function () {
      if (reminderSent) return;
      reminderSent = true;
      count("app-reminder-shown");
    };
  }

  // ── friends, daily ──
  window.SnackPack.countFriends = function () { count("friends"); };
  var dailySent = false;
  window.SnackPack.countDaily = function () {
    if (dailySent) return;
    dailySent = true;
    count("daily");
    if (classroom) count("class-daily");
  };

  // ── win: every game that has a win calls SnackPack.celebrate, however it renders ──
  var wonAt = 0;
  var celebrate = window.SnackPack.celebrate;
  window.SnackPack.celebrate = function (opts) {
    var now = Date.now();
    if (now - wonAt > 5000) { wonAt = now; count("win"); }
    if (celebrate) return celebrate.call(this, opts);
  };

  // ── hub tile clicks ──
  function hub() {
    function slugOf(href) {
      var url = new URL(href, location.href);
      if (url.pathname === "/atlas-quest/") return "atlas-quest";
      var m = /^\/play\/([a-z0-9-]+)\/$/.exec(url.pathname);
      return m ? m[1] : "";
    }
    document.addEventListener("click", function (event) {
      var tile = event.target && event.target.closest && event.target.closest(".arcade-recent-grid a, .arcade-together-grid a, a.game-tile");
      if (!tile) return;
      var slug = slugOf(tile.href);
      if (!slug) return;
      var place;
      if (tile.closest(".arcade-recent-grid")) place = "recent";
      else if (tile.closest(".arcade-together-grid")) place = "together";
      else {
        var shown = Array.prototype.filter.call(document.querySelectorAll("#games .game-grid a.game-tile"), function (t) {
          return t.offsetParent !== null;
        });
        var i = shown.indexOf(tile) + 1;
        place = i < 1 || i > 12 ? "13-plus" : i <= 5 ? "1-5" : "6-12";
      }
      send("hub/" + slug, "hub " + slug);
      send("hub-position/" + place, "hub position " + place);
    }, true);
  }
})();
