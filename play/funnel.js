/* funnel.js — shared download-funnel + milestone donation prompt for the
   SnackPack web arcade. Tasteful and rate-limited: shows at most once per
   day, and never interrupts active play (only fires on a win or after a
   long, continuous dwell). */
(function () {
  "use strict";

  var STRIPE_URL = "https://buy.stripe.com/14A00k7Gi4TF3wl6AL0VO04";
  // Default to Brain Games (Vol 1). A page can point the funnel at a different
  // app by setting window.SP_PLAY_URL before this script loads (e.g. Vol 2).
  var DEFAULT_PLAY_URL = "https://play.google.com/store/apps/details?id=com.snackpackuniverse.braingames";
  function playUrl() { return window.SP_PLAY_URL || DEFAULT_PLAY_URL; }
  var DWELL_MS = 10 * 60 * 1000; // 10 minutes of continuous play
  var SHOWN_KEY = "sp_donate_shown_on";

  function todayStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  function shownToday() {
    try {
      return localStorage.getItem(SHOWN_KEY) === todayStamp();
    } catch (e) {
      return false;
    }
  }

  function markShown() {
    try {
      localStorage.setItem(SHOWN_KEY, todayStamp());
    } catch (e) {}
  }

  var modal = null;

  function buildModal() {
    if (modal) return modal;
    var backdrop = document.createElement("div");
    backdrop.className = "sp-modal-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", "Support SnackPack Studios");
    backdrop.innerHTML =
      '<div class="sp-modal">' +
      '<button class="sp-modal-close" type="button" aria-label="Close">&times;</button>' +
      '<div class="sp-emoji" aria-hidden="true">🍪</div>' +
      '<h2 class="sp-modal-title"></h2>' +
      '<p class="sp-modal-body"></p>' +
      '<div class="sp-modal-actions">' +
      '<a class="btn btn-primary" target="_blank" rel="noopener" href="' + STRIPE_URL + '">Tip the studio</a>' +
      '<a class="btn btn-secondary" target="_blank" rel="noopener" href="' + playUrl() + '">Get the free app on Android</a>' +
      '<button class="sp-dismiss-link" type="button">Maybe later</button>' +
      "</div>" +
      "</div>";

    function close() {
      backdrop.classList.remove("is-open");
    }
    backdrop.querySelector(".sp-modal-close").addEventListener("click", close);
    backdrop.querySelector(".sp-dismiss-link").addEventListener("click", close);
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    document.body.appendChild(backdrop);
    modal = backdrop;
    return modal;
  }

  function openModal(title, body) {
    if (shownToday()) return;
    markShown();
    var m = buildModal();
    m.querySelector(".sp-modal-title").textContent = title;
    m.querySelector(".sp-modal-body").textContent = body;
    m.classList.add("is-open");
  }

  // ── Dwell timer ──────────────────────────────────
  // Counts continuous, visible time on the page. Resets nothing; once the
  // user has spent DWELL_MS actively on the page, gently surface the prompt.
  var dwell = 0;
  var last = Date.now();
  var dwellFired = false;

  function tick() {
    var now = Date.now();
    if (!document.hidden) {
      dwell += now - last;
    }
    last = now;
    if (!dwellFired && dwell >= DWELL_MS) {
      dwellFired = true;
      openModal(
        "Enjoying the time here?",
        "You've been playing for a while — we love that. We're a tiny, ad-free studio. A small tip keeps the lights on, or grab the free app to play offline and keep your stats."
      );
    }
  }
  setInterval(tick, 15000);
  document.addEventListener("visibilitychange", function () {
    last = Date.now();
  });

  // ── Public API ───────────────────────────────────
  window.SnackPack = window.SnackPack || {};

  // Call on a win / milestone. Fires the prompt after a short beat so the
  // player can enjoy the win first.
  window.SnackPack.celebrate = function (opts) {
    opts = opts || {};
    setTimeout(function () {
      openModal(
        opts.title || "Nice win! 🎉",
        opts.body ||
          "Glad you're having fun. We build these calm, ad-free games as a tiny studio — a small tip helps, or get the full bundle free on Android to play offline with saved stats and streaks."
      );
    }, opts.delay != null ? opts.delay : 900);
  };
})();
