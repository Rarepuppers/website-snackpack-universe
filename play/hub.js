(function () {
  "use strict";

  var grid = document.querySelector("#games .game-grid");
  if (!grid) return;

  var categories = {
    cards: ["solitaire", "spider-solitaire", "freecell", "tripeaks", "pyramid", "golf-solitaire", "thirteen"],
    puzzles: ["atlas-quest", "sudoku", "minesweeper", "kakuro", "picross", "water-sort", "2048", "cascade", "memory-match"],
    word: ["snackwords", "crossword", "word-search"],
    board: ["mahjong", "checkers", "connect-4", "reversi", "snakes-and-ladders"],
    arcade: ["table-tennis", "asteroid-destroyer", "flappy-snacky", "snacky-worm"],
    soccer: ["flag-frenzy", "soccer-trivia-sprint", "keepy-uppy", "target-shooting-arena", "free-kick-curl", "crossbar-challenge", "goalkeeper-hero", "penalty-shootout", "dribble-rush", "header-hero"],
    daily: ["sudoku", "minesweeper", "word-search", "freecell", "snackwords", "crossword", "kakuro", "picross", "water-sort", "mahjong", "flag-frenzy", "soccer-trivia-sprint", "thirteen"]
  };
  var recentAdded = ["water-sort", "spider-solitaire", "tripeaks", "pyramid", "snackwords", "flag-frenzy", "dribble-rush", "header-hero"];
  var tiles = Array.from(grid.querySelectorAll(":scope > .game-tile"));
  var records = [];

  function slugFor(tile) {
    var url = new URL(tile.href, location.href);
    if (url.pathname === "/atlas-quest/") return "atlas-quest";
    var match = url.pathname.match(/\/play\/([^/]+)\/?$/);
    return match ? match[1] : "";
  }
  function clean(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }
  function readJSON(key, fallback) {
    try { var value = JSON.parse(localStorage.getItem(key) || "null"); return value == null ? fallback : value; }
    catch (error) { return fallback; }
  }
  function writeJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {} }

  var favs = readJSON("sp_favs", []);
  if (!Array.isArray(favs)) favs = [];

  tiles.forEach(function (tile, index) {
    var slug = slugFor(tile);
    var cats = Object.keys(categories).filter(function (cat) { return categories[cat].indexOf(slug) >= 0; });
    tile.dataset.cat = cats.join(" ");
    tile.dataset.slug = slug;
    var wrap = document.createElement("div");
    wrap.className = "game-tile-wrap";
    tile.parentNode.insertBefore(wrap, tile);
    wrap.appendChild(tile);
    var fav = document.createElement("button");
    fav.className = "game-favourite";
    fav.type = "button";
    fav.setAttribute("aria-label", "Add " + tile.querySelector("h3").textContent + " to favourites");
    fav.innerHTML = '<span aria-hidden="true">☆</span>';
    wrap.appendChild(fav);
    records.push({ tile: tile, wrap: wrap, fav: fav, slug: slug, index: index, title: tile.querySelector("h3").textContent.trim(), text: tile.textContent.toLowerCase(), cats: cats });
    fav.addEventListener("click", function () {
      if (favs.indexOf(slug) >= 0) favs = favs.filter(function (item) { return item !== slug; });
      else favs.push(slug);
      writeJSON("sp_favs", favs);
      render();
    });
  });

  var panel = document.createElement("div");
  panel.className = "arcade-tools";
  panel.innerHTML =
    '<div class="arcade-search-row">' +
      '<label class="arcade-search"><span class="sr-only">Search games</span><input type="search" placeholder="Search 38 games" autocomplete="off"></label>' +
      '<label class="arcade-sort"><span>Sort</span><select><option value="featured">Featured</option><option value="az">A to Z</option><option value="new">Recently added</option><option value="favourites">Favourites first</option></select></label>' +
      '<button class="btn-game arcade-clear" type="button">Clear filters</button>' +
    '</div>' +
    '<div class="arcade-categories" role="group" aria-label="Game categories">' +
      ['all', 'cards', 'puzzles', 'word', 'board', 'arcade', 'soccer', 'daily'].map(function (cat) {
        return '<button type="button" data-category="' + cat + '" aria-pressed="' + (cat === 'all') + '">' + (cat === 'all' ? 'All games' : cat.charAt(0).toUpperCase() + cat.slice(1)) + '</button>';
      }).join("") +
    '</div>' +
    '<p class="arcade-result-count" aria-live="polite"></p>' +
    '<p class="arcade-empty" hidden>No games match those filters. <button type="button">Show all games</button></p>';
  grid.parentNode.insertBefore(panel, grid);

  var recentPanel = document.createElement("section");
  recentPanel.className = "arcade-recent";
  recentPanel.hidden = true;
  recentPanel.innerHTML = '<div class="arcade-recent-head"><div><span class="eyebrow">On this device</span><h3>Jump back in</h3></div><a href="./stats/">Your stats →</a></div><div class="arcade-recent-grid"></div>';
  panel.parentNode.insertBefore(recentPanel, panel);

  var input = panel.querySelector("input");
  var select = panel.querySelector("select");
  var count = panel.querySelector(".arcade-result-count");
  var empty = panel.querySelector(".arcade-empty");
  var activeCategory = "all";

  function hasSave(slug) {
    var prefix = "sp_" + clean(slug) + "_save_";
    try { for (var i = 0; i < localStorage.length; i++) if ((localStorage.key(i) || "").indexOf(prefix) === 0) return true; }
    catch (error) {}
    return false;
  }
  function renderRecent() {
    var recent = readJSON("sp_recent", []);
    if (!Array.isArray(recent)) recent = [];
    var bySlug = {};
    records.forEach(function (record) { bySlug[record.slug] = record; });
    var items = recent.filter(function (item) { return item && bySlug[item.slug]; }).slice(0, 4);
    recentPanel.hidden = items.length === 0;
    var recentGrid = recentPanel.querySelector(".arcade-recent-grid");
    recentGrid.innerHTML = "";
    items.forEach(function (item) {
      var record = bySlug[item.slug];
      var link = document.createElement("a");
      link.className = "arcade-recent-card";
      link.href = record.tile.href;
      var img = record.tile.querySelector("img");
      link.innerHTML = (img ? img.outerHTML : "") + '<span><strong>' + record.title + '</strong><small>' + (hasSave(item.slug) ? 'Resume saved game' : 'Play again') + '</small></span><b aria-hidden="true">→</b>';
      recentGrid.appendChild(link);
    });
  }
  function render() {
    var query = input.value.trim().toLowerCase();
    var visible = 0;
    records.forEach(function (record) {
      var matchesCategory = activeCategory === "all" || record.cats.indexOf(activeCategory) >= 0;
      var matchesText = !query || record.text.indexOf(query) >= 0;
      record.wrap.hidden = !(matchesCategory && matchesText);
      if (!record.wrap.hidden) visible++;
      var starred = favs.indexOf(record.slug) >= 0;
      record.fav.classList.toggle("is-favourite", starred);
      record.fav.querySelector("span").textContent = starred ? "★" : "☆";
      record.fav.setAttribute("aria-pressed", String(starred));
      record.fav.setAttribute("aria-label", (starred ? "Remove " : "Add ") + record.title + (starred ? " from favourites" : " to favourites"));
    });
    var ordered = records.slice();
    if (select.value === "az") ordered.sort(function (a, b) { return a.title.localeCompare(b.title); });
    else if (select.value === "new") ordered.sort(function (a, b) { return (recentAdded.indexOf(b.slug) >= 0) - (recentAdded.indexOf(a.slug) >= 0) || a.index - b.index; });
    else if (select.value === "favourites") ordered.sort(function (a, b) { return (favs.indexOf(b.slug) >= 0) - (favs.indexOf(a.slug) >= 0) || a.index - b.index; });
    else ordered.sort(function (a, b) { return a.index - b.index; });
    ordered.forEach(function (record) { grid.appendChild(record.wrap); });
    count.textContent = visible + (visible === 1 ? " game" : " games") + " shown";
    empty.hidden = visible !== 0;
  }
  function clearFilters() {
    input.value = ""; select.value = "featured"; activeCategory = "all";
    panel.querySelectorAll("[data-category]").forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.category === "all")); });
    render(); input.focus();
  }
  panel.querySelectorAll("[data-category]").forEach(function (button) {
    button.addEventListener("click", function () {
      activeCategory = button.dataset.category;
      panel.querySelectorAll("[data-category]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); });
      render();
    });
  });
  input.addEventListener("input", render);
  select.addEventListener("change", render);
  panel.querySelector(".arcade-clear").addEventListener("click", clearFilters);
  empty.querySelector("button").addEventListener("click", clearFilters);
  renderRecent(); render();
}());
