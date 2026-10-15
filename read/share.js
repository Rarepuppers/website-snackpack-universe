/* read/share.js — "Share this book" for the /read/ bookshelf.
 *
 * Why: in October 2026 /read/ grew through links passed between parents and
 * teachers (Telegram, direct visits), not through search. Sharing was only
 * possible by copying the address bar. Every button marked [data-read-share]
 * now opens the phone's share sheet (WhatsApp, Telegram, Messages…), or copies
 * the link where there is no share sheet (most desktops).
 *
 * Shares the canonical URL, never location.href, so "#page-4" and tracking
 * parameters are not passed on. Wired in by scripts/build-read-shelf.mjs.
 */
(function () {
  "use strict";

  function canonicalUrl() {
    var link = document.querySelector('link[rel="canonical"]');
    return link ? link.href : location.origin + location.pathname;
  }

  function bookTitle() {
    var og = document.querySelector('meta[property="og:title"]');
    return og ? og.content : document.title.split("|")[0].trim();
  }

  function say(btn, msg) {
    var label = btn.getAttribute("data-label") || btn.textContent;
    btn.setAttribute("data-label", label);
    btn.textContent = msg;
    clearTimeout(btn._readShareTimer);
    btn._readShareTimer = setTimeout(function () { btn.textContent = label; }, 2200);
  }

  function legacyCopy(text) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(field);
    return ok;
  }

  function copy(btn, url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { say(btn, "Link copied"); },
        function () { say(btn, legacyCopy(url) ? "Link copied" : "Copy the address bar"); }
      );
    } else {
      say(btn, legacyCopy(url) ? "Link copied" : "Copy the address bar");
    }
  }

  function share(btn) {
    var url = canonicalUrl();
    var title = bookTitle();
    var text = btn.getAttribute("data-share-text") ||
      title + ": a free illustrated story to read together or print. No sign-up, no ads.";
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function (e) {
        // The person closed the share sheet: that is a choice, not a failure.
        if (e && e.name === "AbortError") return;
        copy(btn, url);
      });
      return;
    }
    copy(btn, url);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-read-share]");
    if (!btn) return;
    e.preventDefault();
    share(btn);
  });
})();
