(function (global) {
  "use strict";

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function isPlayed(match) {
    return typeof (match && match.hs) === "number";
  }

  function isLive(match) {
    var status = String((match && (match.statusShort || match.time)) || "").toUpperCase();
    return ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "IN PROGRESS"].indexOf(status) !== -1;
  }

  function todayIso() {
    var now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  }

  function matchId(match) {
    return encodeURIComponent([
      match.n || "",
      match.round || match.roundName || match.group || "",
      match.isoDate || match.date || "",
      match.home || "",
      match.away || ""
    ].join("|"));
  }

  function scoreText(match) {
    if (isPlayed(match)) {
      var score = match.hs + "-" + match.as;
      if (/pen/i.test(String(match.statusShort || "")) && Number.isFinite(Number(match.hps)) && Number.isFinite(Number(match.aps))) {
        score += " (" + match.hps + "-" + match.aps + " pens)";
      }
      return score;
    }
    if (isLive(match)) return typeof match.lhs === "number" ? match.lhs + "-" + match.las : "Live";
    return "Next";
  }

  function matchLabel(match) {
    if (match.round || match.roundName) return match.round || match.roundName;
    return match.group ? "Group " + match.group : "World Cup";
  }

  function matchSort(match) {
    return String(match.isoDate || match.date || "") + "|" + String(match.time || "") + "|" + String(match.home || "");
  }

  function timezoneName() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "your local timezone";
    } catch (error) {
      return "your local timezone";
    }
  }

  function renderTimezoneNote(target) {
    var root = typeof target === "string" ? document.getElementById(target) : target;
    if (!root) return;
    root.textContent = "Dates and today's match filters use your device timezone (" + timezoneName() + "). Live/final status comes from the score provider.";
  }

  function hasMatchWindow(matches) {
    var today = todayIso();
    return (matches || []).some(function (match) {
      return isLive(match) || (!isPlayed(match) && String(match.isoDate || "") === today);
    });
  }

  function renderFreshnessWarning(target, updatedAt, matches) {
    var root = typeof target === "string" ? document.getElementById(target) : target;
    if (!root) return;
    var date = updatedAt ? new Date(updatedAt) : null;
    var stale = date && !isNaN(date) ? Date.now() - date.getTime() : Infinity;
    var shouldWarn = hasMatchWindow(matches) && stale > 20 * 60 * 1000;
    root.hidden = !shouldWarn;
    if (!shouldWarn) {
      root.textContent = "";
      return;
    }
    root.textContent = "Score feed may be a few minutes behind during this match window. The page will keep checking live scores automatically.";
  }

  var favoriteKey = "snackpack_world_cup_favorite_team";

  function getFavoriteTeam() {
    try {
      return localStorage.getItem(favoriteKey) || "";
    } catch (error) {
      return "";
    }
  }

  function setFavoriteTeam(team) {
    try {
      if (team) localStorage.setItem(favoriteKey, team);
      else localStorage.removeItem(favoriteKey);
    } catch (error) {}
  }

  function uniqueTeams(teams) {
    var seen = {};
    return (teams || []).filter(function (team) {
      team = String(team || "").trim();
      if (!team || /^W |^L |^RU |^3rd|TBD$/i.test(team) || seen[team]) return false;
      seen[team] = true;
      return true;
    }).sort();
  }

  function highlightFavorite(scope) {
    var root = scope || document;
    var favorite = getFavoriteTeam();
    root.querySelectorAll(".is-favorite-team").forEach(function (node) {
      node.classList.remove("is-favorite-team");
    });
    if (!favorite) return;
    root.querySelectorAll("[data-team-name]").forEach(function (node) {
      node.classList.toggle("is-favorite-team", node.getAttribute("data-team-name") === favorite);
    });
  }

  function renderFavoriteTeam(target, teams) {
    var root = typeof target === "string" ? document.getElementById(target) : target;
    if (!root) return;
    var values = uniqueTeams(teams);
    if (!values.length) {
      root.innerHTML = "";
      return;
    }
    var current = getFavoriteTeam();
    root.innerHTML = '<div class="wc-favorite-panel"><label for="wc-favorite-team">Favorite team</label><select id="wc-favorite-team"><option value="">No favorite selected</option>' +
      values.map(function (team) {
        return '<option value="' + escapeHtml(team) + '"' + (team === current ? " selected" : "") + '>' + escapeHtml(team) + '</option>';
      }).join("") + '</select></div>';
    var select = root.querySelector("select");
    if (select && root.dataset.favoriteReady !== "true") {
      root.dataset.favoriteReady = "true";
      root.addEventListener("change", function (event) {
        if (!event.target.matches("select")) return;
        setFavoriteTeam(event.target.value);
        highlightFavorite(document);
      });
    }
    highlightFavorite(document);
  }

  function penaltyKicks(value) {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string") return value.trim().split(/\s*,\s*|\s+/).join("").split("");
    return [];
  }

  function penaltyMark(kick) {
    var value = String(kick || "").toLowerCase();
    if (value === "1" || value === "o" || value === "ok" || value === "made" || value === "scored" || value === "goal") return "O";
    if (value === "0" || value === "x" || value === "miss" || value === "missed" || value === "saved") return "X";
    return value ? value.toUpperCase() : "";
  }

  function penaltyShootoutHtml(match) {
    var home = penaltyKicks(match.hpk || match.homePenaltyKicks || match.homePens);
    var away = penaltyKicks(match.apk || match.awayPenaltyKicks || match.awayPens);
    if (!home.length && !away.length) return "";
    function row(team, kicks) {
      return '<div class="wc-pen-row"><span>' + escapeHtml(team || "TBD") + '</span><strong>' +
        kicks.map(function (kick) {
          var mark = penaltyMark(kick);
          return '<i class="wc-pen-mark wc-pen-mark--' + (mark === "O" ? "made" : mark === "X" ? "miss" : "other") + '">' + escapeHtml(mark) + '</i>';
        }).join("") + '</strong></div>';
    }
    return '<div class="wc-pen-detail"><span>Shootout kicks</span>' + row(match.home, home) + row(match.away, away) + '</div>';
  }

  function renderLiveStrip(target, matches) {
    var root = typeof target === "string" ? document.getElementById(target) : target;
    if (!root) return;
    var today = todayIso();
    var active = (matches || []).filter(function (match) {
      return isLive(match) || (!isPlayed(match) && String(match.isoDate || "") >= today);
    }).sort(function (a, b) {
      return (isLive(b) ? 1 : 0) - (isLive(a) ? 1 : 0) || matchSort(a).localeCompare(matchSort(b));
    }).slice(0, 3);
    if (!active.length) {
      root.innerHTML = '<div class="wc-live-item"><span>All listed games are final.</span><strong class="wc-live-badge">FT</strong></div>';
      return;
    }
    root.innerHTML = active.map(function (match) {
      var badge = isLive(match) ? " wc-live-badge--live" : "";
      return '<button class="wc-live-item wc-match-trigger" type="button" data-match-id="' + matchId(match) + '">' +
        '<span><b>' + escapeHtml((match.home || "TBD") + " vs " + (match.away || "TBD")) + '</b><small>' + escapeHtml((match.date || "Date TBD") + " - " + matchLabel(match) + " - " + (match.venue || "Venue TBD")) + '</small></span>' +
        '<strong class="wc-live-badge' + badge + '">' + escapeHtml(scoreText(match)) + '</strong></button>';
    }).join("");
  }

  function renderDrawer(target, match) {
    var root = typeof target === "string" ? document.getElementById(target) : target;
    if (!root || !match) return;
    var status = isLive(match) ? "Live" : isPlayed(match) ? "Final" : "Scheduled";
    var winner = match.winner || "";
    if (!winner && isPlayed(match) && match.hs !== match.as) winner = match.hs > match.as ? match.home : match.away;
    var pens = /pen/i.test(String(match.statusShort || "")) && Number.isFinite(Number(match.hps)) && Number.isFinite(Number(match.aps))
      ? '<span>Penalties</span><strong>' + escapeHtml(match.hps + "-" + match.aps) + '</strong>'
      : "";
    var shootout = penaltyShootoutHtml(match);
    var next = match.nextMatch ? '<span>Winner plays</span><strong>Match ' + escapeHtml(match.nextMatch) + '</strong>' : "";
    root.hidden = false;
    root.innerHTML =
      '<div class="wc-drawer-head"><div><span class="eyebrow">' + escapeHtml(status) + '</span><h3>' + escapeHtml((match.home || "TBD") + " vs " + (match.away || "TBD")) + '</h3></div><button class="wc-drawer-close" type="button" aria-label="Close match details">x</button></div>' +
      '<div class="wc-drawer-grid">' +
      '<span>Score</span><strong>' + escapeHtml(scoreText(match)) + '</strong>' +
      '<span>Round</span><strong>' + escapeHtml(matchLabel(match)) + '</strong>' +
      '<span>Date</span><strong>' + escapeHtml((match.date || "Date TBD") + (match.time ? ", " + match.time : "")) + '</strong>' +
      '<span>Venue</span><strong>' + escapeHtml(match.venue || "Venue TBD") + '</strong>' +
      (winner ? '<span>Advancing team</span><strong>' + escapeHtml(winner) + '</strong>' : '') +
      pens + next +
      '</div>' + shootout;
  }

  function bindMatchDrawer(options) {
    var root = typeof options.root === "string" ? document.getElementById(options.root) : options.root;
    var drawer = typeof options.drawer === "string" ? document.getElementById(options.drawer) : options.drawer;
    if (!root || !drawer || root.dataset.wcDrawerReady === "true") return;
    root.dataset.wcDrawerReady = "true";
    function findMatch(id) {
      return (options.getMatches() || []).filter(function (match) { return matchId(match) === id; })[0];
    }
    function openFrom(target) {
      if (target.closest("a")) return;
      var trigger = target.closest(".wc-match-trigger");
      if (!trigger) return;
      var match = findMatch(trigger.getAttribute("data-match-id"));
      if (!match) return;
      renderDrawer(drawer, match);
      drawer.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    root.addEventListener("click", function (event) {
      if (event.target.closest(".wc-drawer-close")) {
        drawer.hidden = true;
        return;
      }
      openFrom(event.target);
    });
    root.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      var trigger = event.target.closest(".wc-match-trigger");
      if (!trigger) return;
      event.preventDefault();
      openFrom(trigger);
    });
  }

  global.WCUI = {
    bindMatchDrawer: bindMatchDrawer,
    escapeHtml: escapeHtml,
    getFavoriteTeam: getFavoriteTeam,
    highlightFavorite: highlightFavorite,
    isLive: isLive,
    isPlayed: isPlayed,
    matchId: matchId,
    renderDrawer: renderDrawer,
    renderFavoriteTeam: renderFavoriteTeam,
    renderFreshnessWarning: renderFreshnessWarning,
    renderLiveStrip: renderLiveStrip,
    renderTimezoneNote: renderTimezoneNote,
    scoreText: scoreText
  };
})(window);
