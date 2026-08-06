/* share-result.js — shared "share your result" control for the arcade.
 *
 * Why this is separate from funnel.js: `SnackPack.celebrate()` routes into a
 * modal that is rate-limited to once per day (`sp_donate_shown_on`). That is
 * correct for a donation ask and wrong for a share prompt — a player who wins
 * three puzzles should be offered a share three times. So this owns its own
 * surface and is deliberately NOT rate-limited.
 *
 * Flag Frenzy already had a hand-rolled Wordle-style share; this generalises
 * that same shape so every game can use it and they all read alike.
 *
 * Spoiler rule: the text must never contain the solution. Emoji rows describe
 * shape and outcome, never content. A share that spoils today's puzzle stops
 * people sharing it.
 *
 * Usage — call on a win, alongside SnackPack.celebrate():
 *
 *   SnackPackShare.result({
 *     mount: document.querySelector(".game-stage"),
 *     game:  "Sudoku",
 *     puzzle: 212,                       // optional daily number
 *     headline: "Easy solved in 4:31",   // the one-line result
 *     stats: ["0 mistakes", "no hints"], // optional short facts
 *     grid: ["🟩🟩🟩", "🟩⬜🟩"]           // optional spoiler-free rows
 *   });
 *
 * Everything except `game` is optional. Call `result()` again to replace the
 * card (a second win in the same session reuses one node).
 */
(function () {
  "use strict";

  var SITE = "https://www.snackpackuniverse.com";

  // `daily` is the puzzle number when the result came from a daily board.
  // Carrying it in the URL is what closes the loop: without it the recipient of
  // "SnackPack Sudoku #20671" lands in free play and can't play the board being
  // compared, which makes the share pointless to send.
  function pageUrl(daily) {
    // Prefer the canonical link so a share from ?daily=… or a dev host still
    // points at the real page.
    var base;
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon && canon.href) base = canon.href;
    else if (location.protocol === "http:" && /^(localhost|127\.)/.test(location.hostname)) {
      base = SITE + location.pathname;
    } else base = location.origin + location.pathname;

    if (daily == null) return base;
    return base + (base.indexOf("?") === -1 ? "?" : "&") + "daily=" + daily;
  }

  function buildText(opts) {
    var title = "SnackPack " + opts.game;
    if (opts.puzzle != null) title += " #" + opts.puzzle;

    var lines = [title];
    if (opts.headline) lines.push(opts.headline);
    if (opts.grid && opts.grid.length) lines.push("", opts.grid.join("\n"));
    if (opts.stats && opts.stats.length) lines.push("", opts.stats.join(" · "));
    lines.push("", pageUrl(opts.puzzle));
    return lines.join("\n");
  }

  /* send(text, opts) — the one implementation of "get this text to somewhere
   * the user can paste it". Exposed publicly so games with their own share UI
   * (Flag Frenzy) can reuse the mechanics without adopting the card.
   *
   * Order matters: the native share sheet first (it's the only good option on
   * mobile and it offers apps, not just the clipboard), then the async
   * Clipboard API, then execCommand, then a visible textarea to select by hand.
   *
   *   opts.title    — title for the native share sheet
   *   opts.onStatus — called with a short message ("Copied!") to surface
   *   opts.onManual — called when every automatic path failed and the caller
   *                   should reveal a selectable textarea
   */
  function send(text, opts) {
    opts = opts || {};
    var status = opts.onStatus || function () {};

    if (navigator.share) {
      navigator.share({ title: opts.title || "SnackPack", text: text }).catch(function (e) {
        // A dismissed share sheet is a choice, not a failure — don't nag.
        if (e && e.name === "AbortError") return;
        clipboardPath();
      });
      return;
    }
    clipboardPath();

    function clipboardPath() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { status("Copied!"); }, manualPath);
        return;
      }
      manualPath();
    }

    function manualPath() {
      if (legacyCopy(text)) { status("Copied!"); return; }
      if (opts.onManual) opts.onManual();
      status("Press Ctrl+C");
    }
  }

  var card = null;

  function buildCard() {
    if (card) return card;
    card = document.createElement("div");
    card.className = "sp-share";
    card.innerHTML =
      '<div class="sp-share-head">' +
      '<strong class="sp-share-title"></strong>' +
      '<span class="sp-share-sub"></span>' +
      "</div>" +
      '<pre class="sp-share-grid" aria-hidden="true"></pre>' +
      '<div class="sp-share-actions">' +
      '<button type="button" class="btn-game btn-game--primary sp-share-btn">Share result</button>' +
      '<button type="button" class="btn-game sp-share-x">Post to X</button>' +
      "</div>" +
      '<textarea class="sp-share-fallback" readonly hidden aria-label="Your result — copy this"></textarea>' +
      '<span class="sp-share-live" role="status" aria-live="polite"></span>';
    return card;
  }

  function flash(node, msg) {
    var live = node.querySelector(".sp-share-live");
    var btn = node.querySelector(".sp-share-btn");
    var original = btn.textContent;
    btn.textContent = msg;
    if (live) live.textContent = msg;
    setTimeout(function () {
      btn.textContent = original;
      if (live) live.textContent = "";
    }, 1800);
  }

  // The async Clipboard API needs a secure context and transient user
  // activation, and is still refused in some embedded views — so keep the old
  // execCommand path as a fallback, then a visible textarea as a last resort.
  function legacyCopy(value) {
    try {
      var ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, value.length);
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function result(opts) {
    opts = opts || {};
    if (!opts.game) return null;

    var mount =
      opts.mount ||
      document.querySelector(".game-stage") ||
      document.querySelector(".shell");
    if (!mount) return null;

    var node = buildCard();
    var text = buildText(opts);

    node.querySelector(".sp-share-title").textContent =
      "Nice one — share your result?";
    node.querySelector(".sp-share-sub").textContent =
      opts.headline || ("SnackPack " + opts.game);

    var gridEl = node.querySelector(".sp-share-grid");
    if (opts.grid && opts.grid.length) {
      gridEl.textContent = opts.grid.join("\n");
      gridEl.hidden = false;
    } else {
      gridEl.textContent = "";
      gridEl.hidden = true;
    }

    var fallback = node.querySelector(".sp-share-fallback");
    fallback.hidden = true;
    fallback.value = text;

    var shareBtn = node.querySelector(".sp-share-btn");
    shareBtn.onclick = function () {
      send(text, {
        title: "SnackPack " + opts.game,
        onStatus: function (msg) { flash(node, msg); },
        onManual: function () {
          fallback.hidden = false;
          fallback.focus();
          fallback.select();
        }
      });
    };

    var xBtn = node.querySelector(".sp-share-x");
    xBtn.onclick = function () {
      // X strips the URL out of `text` into its own card, so pass it as `url`.
      var shareUrl = pageUrl(opts.puzzle);
      var body = text.replace("\n\n" + shareUrl, "");
      window.open(
        "https://twitter.com/intent/tweet?text=" +
          encodeURIComponent(body) +
          "&url=" +
          encodeURIComponent(shareUrl),
        "_blank",
        "noopener"
      );
    };

    if (node.parentNode !== mount) mount.appendChild(node);
    node.classList.add("is-open");
    return node;
  }

  function hide() {
    if (card) card.classList.remove("is-open");
  }

  window.SnackPackShare = { result: result, hide: hide, buildText: buildText, send: send };
})();
