/* game-events.js -- anonymous counts of arcade games started and won.
 *
 * Cloudflare Web Analytics only sees page arrivals, so it cannot say which
 * games get played. This sends two fixed event names per game and nothing else:
 * no IDs, scores, free text or storage. Loaded by funnel.js, so every arcade game
 * gets it from one place. Keep /privacy/arcade/ in step with anything sent here.
 */
(function () {
  "use strict";

  var ENDPOINT = "https://snackpack.goatcounter.com/count";
  var match = /^\/play\/([a-z0-9-]+)\/$/.exec(location.pathname);
  var RESERVED = { daily: 1, stats: 1, "last-bastion": 1, docs: 1 };
  if (!match || RESERVED[match[1]] || location.hostname !== "www.snackpackuniverse.com") return;
  var game = match[1];

  function send(action) {
    var path = "/arcade/" + game + "/" + action;
    var query = "p=" + encodeURIComponent(path) + "&t=" + encodeURIComponent(game + " " + action) +
      "&e=true&rnd=" + Math.random().toString(36).slice(2);
    new Image().src = ENDPOINT + "?" + query;
  }

  // A page view is not a game: count the first real input on the page's game area.
  var started = false;
  function onInput(event) {
    if (started) return;
    var target = event.target;
    if (event.type === "keydown") {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key === "Tab") return;
      if (target && target.closest && target.closest("input, textarea, select, a, nav, .site-header")) return;
    } else if (!target || !target.closest || !target.closest(".game-stage") || target.closest("a")) {
      return;
    }
    started = true;
    send("start");
    document.removeEventListener("pointerdown", onInput, true);
    document.removeEventListener("keydown", onInput, true);
  }
  document.addEventListener("pointerdown", onInput, true);
  document.addEventListener("keydown", onInput, true);

  // Every game that has a win calls SnackPack.celebrate, however it renders.
  var wonAt = 0;
  window.SnackPack = window.SnackPack || {};
  var celebrate = window.SnackPack.celebrate;
  window.SnackPack.celebrate = function (opts) {
    var now = Date.now();
    if (now - wonAt > 5000) { wonAt = now; send("win"); }
    if (celebrate) return celebrate.call(this, opts);
  };
})();
