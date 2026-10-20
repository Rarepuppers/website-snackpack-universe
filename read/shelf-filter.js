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
  var search = bar.querySelector("[data-read-search]");
  var state = { kind: params.get("type") || "all", age: params.get("age") || "all", saved: params.get("saved") === "1", query: (params.get("q") || "").slice(0, 120) };
  if (search) search.value = state.query;
  function folded(text) {
    return String(text).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function range(text) {
    var p = String(text).split("-");
    return [parseInt(p[0], 10), parseInt(p[1], 10)];
  }

  function matches(card) {
    if (state.saved && card.getAttribute("data-saved-state") !== "saved") return false;
    if (state.kind !== "all" && card.getAttribute("data-kind") !== state.kind) return false;
    var text = folded(card.getAttribute("data-search") || card.textContent);
    var words = folded(state.query).split(/\s+/).filter(Boolean);
    if (!words.every(function (word) { return text.indexOf(word) !== -1 || text.replace(/ /g, "").indexOf(word) !== -1; })) return false;
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
    function valid(attr, value) { return Array.prototype.some.call(bar.querySelectorAll("[" + attr + "]"), function (b) { return b.getAttribute(attr) === value; }); }
    if (!valid("data-filter-kind", state.kind)) { state.kind = "all"; updateUrl = true; }
    if (!valid("data-filter-age", state.age)) { state.age = "all"; updateUrl = true; }
    var savedButton = bar.querySelector("[data-filter-saved]"); if(savedButton) savedButton.setAttribute("aria-pressed",String(state.saved));
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
    var filtered = state.saved || state.kind !== "all" || state.age !== "all" || state.query.trim();
    status.textContent = filtered ? "Showing " + shown + " of " + cards.length + " books" + (state.saved ? ". Saved results depend on this device." : "") : "";
    var clear = bar.querySelector('[data-read-reset]'); if (clear) clear.hidden = !filtered;
    if (empty) empty.hidden = shown > 0;
    if (updateUrl && window.history && history.replaceState) {
      var q = new URLSearchParams(location.search);
      if(state.saved) q.set("saved","1"); else q.delete("saved");
      if (state.kind === "all") q.delete("type"); else q.set("type", state.kind);
      if (state.age === "all") q.delete("age"); else q.set("age", state.age);
      if (!state.query.trim()) q.delete("q"); else q.set("q", state.query.trim());
      var qs = q.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    }
  }

  bar.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button");
    if (!b) return;
    if (b.hasAttribute("data-read-reset")) { state = { kind: "all", age: "all", saved: false, query: "" }; if (search) { search.value = ""; search.focus(); } }
    else if (b.hasAttribute("data-filter-saved")) state.saved = !state.saved;
    else if (b.hasAttribute("data-filter-kind")) state.kind = b.getAttribute("data-filter-kind");
    else if (b.hasAttribute("data-filter-age")) state.age = b.getAttribute("data-filter-age");
    else return;
    apply(true);
  });

  if (search) search.addEventListener("input", function () { state.query = search.value.slice(0, 120); apply(true); });
  window.addEventListener("popstate", function () {
    var p = new URLSearchParams(location.search);
    state = { kind: p.get("type") || "all", age: p.get("age") || "all", saved: p.get("saved") === "1", query: (p.get("q") || "").slice(0, 120) };
    if (search) search.value = state.query;
    apply(false);
  });

  if (empty) {
    var reset = empty.querySelector("[data-filter-reset]");
    if (reset) reset.addEventListener("click", function () {
      state = { kind: "all", age: "all", saved: false, query: "" };
      if (search) search.value = "";
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

  window.addEventListener("read-saved-status", function(event) {
    cards.forEach(function(card) {
      var slug = new URL(card.href).pathname.split("/")[2];
      var value = event.detail && event.detail[slug] || "unavailable";
      card.setAttribute("data-saved-state",value);
      var label = card.querySelector("[data-saved-label]");
      if(label) label.textContent = {saved:"Saved on this device",incomplete:"Incomplete or needs update",unsaved:"Not saved on this device",unavailable:"Saved status unavailable"}[value];
    });
    apply(false);
  });
  bar.hidden = false;
  apply(false);
})();
