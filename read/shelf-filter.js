/* read/shelf-filter.js — type and age filters plus "New" badges on /read/.
 *
 * Why: the shelf passed 25 books (29 on 2026-10-15), which is a long scroll on
 * a phone. Parents arrive asking "what suits a 5-year-old?" or "any maths?".
 * Each card carries data-kind (phonics / stories / maths), data-age ("min-max")
 * and data-added (YYYY-MM-DD), all generated from SHELF by
 * scripts/build-read-shelf.mjs.
 *
 * Progressive enhancement: the filter bar ships `hidden` and is revealed here,
 * so without JavaScript the full shelf shows. The choice lives in the URL
 * (?type=maths&age=7-8) so a filtered shelf can be shared, and needs no storage.
 * "New" is worked out from today's date in the reader's browser, so the badge
 * never goes stale between site builds.
 */
(function () {
  "use strict";

  var bar = document.querySelector(".read-filters");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".read-library-card[data-kind]"));
  if (!bar || !cards.length) return;

  var NEW_DAYS = 30;
  var status = bar.querySelector("[data-filter-status]");
  var empty = document.querySelector("[data-filter-empty]");
  var groups = Array.prototype.slice.call(document.querySelectorAll(".read-shelf-group"));
  var params = new URLSearchParams(location.search);
  var state = { kind: params.get("type") || "all", age: params.get("age") || "all" };

  function range(text) {
    var p = String(text).split("-");
    return [parseInt(p[0], 10), parseInt(p[1], 10)];
  }

  function matches(card) {
    if (state.kind !== "all" && card.getAttribute("data-kind") !== state.kind) return false;
    if (state.age === "all") return true;
    var book = range(card.getAttribute("data-age"));
    var want = range(state.age);
    return book[0] <= want[1] && book[1] >= want[0]; // the ranges overlap
  }

  function syncButtons(attr, value) {
    Array.prototype.forEach.call(bar.querySelectorAll("[" + attr + "]"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute(attr) === value));
    });
  }

  function apply(updateUrl) {
    // An unknown value in a shared link (e.g. a typo) falls back to "all",
    // and the address bar is tidied so the bad value is not passed on.
    if (!bar.querySelector('[data-filter-kind="' + state.kind + '"]')) { state.kind = "all"; updateUrl = true; }
    if (!bar.querySelector('[data-filter-age="' + state.age + '"]')) { state.age = "all"; updateUrl = true; }
    syncButtons("data-filter-kind", state.kind);
    syncButtons("data-filter-age", state.age);
    var shown = 0;
    cards.forEach(function (c) {
      var ok = matches(c);
      c.hidden = !ok;
      if (ok) shown++;
    });
    groups.forEach(function (g) {
      var any = g.querySelector(".read-library-card[data-kind]:not([hidden])");
      g.hidden = !any;
      var chip = document.querySelector('.read-jump-chip[href="#' + g.id + '"]');
      if (chip) chip.hidden = !any;
    });
    var filtered = state.kind !== "all" || state.age !== "all";
    status.textContent = filtered ? "Showing " + shown + " of " + cards.length + " books" : "";
    if (empty) empty.hidden = shown > 0;
    if (updateUrl && window.history && history.replaceState) {
      var q = new URLSearchParams(location.search);
      if (state.kind === "all") q.delete("type"); else q.set("type", state.kind);
      if (state.age === "all") q.delete("age"); else q.set("age", state.age);
      var qs = q.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    }
  }

  bar.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button");
    if (!b) return;
    if (b.hasAttribute("data-filter-kind")) state.kind = b.getAttribute("data-filter-kind");
    else if (b.hasAttribute("data-filter-age")) state.age = b.getAttribute("data-filter-age");
    else return;
    apply(true);
  });

  if (empty) {
    var reset = empty.querySelector("[data-filter-reset]");
    if (reset) reset.addEventListener("click", function () {
      state = { kind: "all", age: "all" };
      apply(true);
      var first = bar.querySelector("button");
      if (first) first.focus();
    });
  }

  // "New" badges: added within the last NEW_DAYS days, by the reader's own clock.
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  cards.forEach(function (c) {
    var parts = (c.getAttribute("data-added") || "").split("-");
    if (parts.length !== 3) return;
    var added = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var days = (today - added) / 86400000;
    if (days < 0 || days > NEW_DAYS) return;
    var eyebrow = c.querySelector(".eyebrow");
    if (!eyebrow || c.querySelector(".read-new-badge")) return;
    var badge = document.createElement("span");
    badge.className = "read-new-badge";
    badge.textContent = "New";
    eyebrow.parentNode.insertBefore(badge, eyebrow);
  });

  bar.hidden = false;
  apply(false);
})();
