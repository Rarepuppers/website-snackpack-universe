(function () {
  "use strict";
  var summary = document.getElementById("stats-summary");
  var bests = document.getElementById("stats-bests");
  var status = document.getElementById("stats-status");

  function readJSON(key, fallback) {
    try { var value = JSON.parse(localStorage.getItem(key) || "null"); return value == null ? fallback : value; }
    catch (error) { return fallback; }
  }
  function label(value) { return value.replace(/^sp_/, "").replace(/_/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function entries() {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var key = localStorage.key(i); if (key && key.indexOf("sp_") === 0) out.push({ key: key, value: localStorage.getItem(key) }); } }
    catch (error) {}
    return out;
  }
  function render() {
    var all = entries();
    var saves = all.filter(function (entry) { return /_save_/.test(entry.key); });
    var results = all.filter(function (entry) { return /_best_/.test(entry.key) || /_high_?score/.test(entry.key); });
    var recent = readJSON("sp_recent", []); if (!Array.isArray(recent)) recent = [];
    var favs = readJSON("sp_favs", []); if (!Array.isArray(favs)) favs = [];
    var streak = readJSON("sp_daily_streak", {});
    var cards = [
      [saves.length, "Saved games"], [results.length, "Personal bests"], [favs.length, "Favourites"], [Number(streak.count) || 0, "Daily streak"]
    ];
    summary.innerHTML = cards.map(function (card) { return '<article><strong>' + card[0] + '</strong><span>' + card[1] + '</span></article>'; }).join("");
    if (!results.length) {
      bests.innerHTML = '<div class="stats-empty"><h3>No personal bests yet</h3><p>Finish a timed game such as Sudoku, Minesweeper, Word Search, Picross or Kakuro and the result will appear here.</p><a class="btn btn-primary" href="../">Choose a game</a></div>';
      return;
    }
    results.sort(function (a, b) { return a.key.localeCompare(b.key); });
    bests.innerHTML = results.map(function (entry) {
      var value = /^\d+$/.test(entry.value || "") ? entry.value : String(entry.value || "—");
      return '<article class="stats-row"><span>' + label(entry.key.replace(/_best_/, " · ")) + '</span><strong>' + value + '</strong></article>';
    }).join("");
  }
  document.getElementById("stats-clear").addEventListener("click", function () {
    if (!window.confirm("Clear all SnackPack Arcade saves, bests, favourites and daily history from this browser? This cannot be undone.")) return;
    var keys = entries().map(function (entry) { return entry.key; });
    keys.forEach(function (key) { try { localStorage.removeItem(key); } catch (error) {} });
    status.textContent = "Arcade data cleared. Your theme preference was kept.";
    render();
  });
  render();
}());
