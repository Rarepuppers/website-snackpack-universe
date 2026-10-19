/* Device-only reading position and text size. Reading works without storage. */
(function () {
  "use strict";
  var KEY = "snackpack.reading.position.v1";
  var SIZE_KEY = "snackpack.reading.text-size.v1";
  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function forget() { try { localStorage.removeItem(KEY); } catch (e) {} }
  function position() {
    try {
      var p = JSON.parse(read(KEY));
      if (!p || p.version !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) ||
          !Number.isInteger(p.page) || !Number.isInteger(p.total) || p.total < 1 || p.total > 200 ||
          p.page < 1 || p.page > p.total || typeof p.completed !== "boolean") return null;
      return p;
    } catch (e) { return null; }
  }
  var size = read(SIZE_KEY) === "larger" ? "larger" : "normal";
  document.documentElement.setAttribute("data-read-text", size);
  var sizeButtons = [];
  function syncSize() {
    document.documentElement.setAttribute("data-read-text", size);
    sizeButtons.forEach(function (b) {
      b.textContent = size === "larger" ? "Text: larger" : "Text: normal";
      b.setAttribute("aria-pressed", String(size === "larger"));
      b.setAttribute("aria-label", size === "larger" ? "Use normal story text" : "Use larger story text");
    });
  }
  function addTextControl(parent) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "read-text-size read-speed-btn";
    b.addEventListener("click", function () { size = size === "normal" ? "larger" : "normal"; write(SIZE_KEY, size); syncSize(); });
    sizeButtons.push(b); parent.appendChild(b); syncSize();
  }
  window.SnackPackReading = { addTextControl: addTextControl };

  var saved = position();
  var resumeBox = document.querySelector("[data-read-continue]");
  if (resumeBox && saved && !saved.completed) {
    // Resolve stored slugs against the actual shelf; never trust a stored URL/title.
    var book = Array.prototype.find.call(document.querySelectorAll(".read-library-card"), function (a) {
      return a.getAttribute("href") === "./" + saved.slug + "/";
    });
    if (book && Number(book.getAttribute("data-pages")) === saved.total) {
      var heading = document.createElement("h2"); heading.textContent = "Continue reading";
      var link = document.createElement("a"); link.className = "text-link";
      link.href = book.getAttribute("href") + "#page-" + saved.page;
      link.textContent = book.querySelector("h3").textContent + " — page " + saved.page;
      var clear = document.createElement("button"); clear.type = "button"; clear.className = "text-link";
      clear.textContent = "Forget reading position";
      clear.addEventListener("click", function () {
        forget(); resumeBox.hidden = true;
        var target = document.querySelector("#read-search, .read-jump a"); if (target) target.focus();
      });
      resumeBox.appendChild(heading); resumeBox.appendChild(link); resumeBox.appendChild(clear); resumeBox.hidden = false;
    }
  }

  var cards = Array.prototype.slice.call(document.querySelectorAll(".story-page-card"));
  var route = location.pathname.match(/^\/read\/([a-z0-9-]+)\/$/);
  if (!cards.length || !route) return;
  var slug = route[1], finished = false, timer = null;
  function record(index, complete) {
    if (index < 0 || index >= cards.length) return;
    if (finished && !complete) return;
    if (complete) finished = true;
    write(KEY, JSON.stringify({ version: 1, slug: slug, page: index + 1, total: cards.length, completed: !!complete }));
  }
  function go(index) {
    if (index < 0 || index >= cards.length) return;
    finished = false;
    history.replaceState(null, "", location.pathname + location.search + "#" + cards[index].id);
    cards[index].scrollIntoView({ block: "start" });
    cards[index].setAttribute("tabindex", "-1"); cards[index].focus({ preventScroll: true });
    record(index, false);
  }
  var hero = document.querySelector(".story-title-grid>div");
  if (hero) {
    var tools = document.createElement("div"); tools.className = "read-comfort";
    tools.setAttribute("role", "group"); tools.setAttribute("aria-label", "Reading preferences");
    addTextControl(tools);
    if (saved && saved.slug === slug && saved.total === cards.length && saved.page <= cards.length && (saved.page > 1 || saved.completed)) {
      if (!saved.completed) {
        var resume = document.createElement("a"); resume.className = "text-link";
        resume.href = "#page-" + saved.page; resume.textContent = "Resume at page " + saved.page;
        resume.addEventListener("click", function (e) { e.preventDefault(); go(saved.page - 1); }); tools.appendChild(resume);
      }
      var restart = document.createElement("a"); restart.className = "text-link";
      restart.href = "#page-1"; restart.textContent = "Start again";
      restart.addEventListener("click", function (e) { e.preventDefault(); go(0); }); tools.appendChild(restart);
    }
    hero.appendChild(tools);
  }
  document.addEventListener("snackpack:reading-page", function (event) {
    if (timer) clearTimeout(timer);
    if (!event.detail.completed) finished = false;
    record(event.detail.index, event.detail.completed);
  });
  // A short dwell on visible story content counts as reading; opening the hero does not.
  function watchScroll() {
    if (document.body.classList.contains("reader-mode") || finished) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      if (document.visibilityState === "hidden") return;
      var best = -1, amount = 0;
      cards.forEach(function (card, i) {
        var r = card.getBoundingClientRect();
        var visible = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
        if (visible > amount && visible >= Math.min(r.height * 0.35, innerHeight * 0.35)) { amount = visible; best = i; }
      });
      if (best >= 0) record(best, false);
      var end = document.querySelector(".story-finish-card");
      if (end) { var r = end.getBoundingClientRect(); if (r.top < innerHeight * 0.65 && r.bottom > 0) record(cards.length - 1, true); }
    }, 650);
  }
  window.addEventListener("scroll", watchScroll, { passive: true });
  window.addEventListener("resize", watchScroll);
  watchScroll();
})();
