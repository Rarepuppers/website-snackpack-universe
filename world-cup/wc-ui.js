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
      '</div>';
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
    isLive: isLive,
    isPlayed: isPlayed,
    matchId: matchId,
    renderDrawer: renderDrawer,
    renderLiveStrip: renderLiveStrip,
    scoreText: scoreText
  };
})(window);
