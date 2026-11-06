/* rooms.js -- play Thirteen with friends through a shared link.
 *
 * The rules run on the server (workers/arcade-rooms), so each browser only ever
 * receives its own hand. There are no names, accounts or chat. The button stays
 * hidden until ROOMS_URL is set, so this file does nothing before the Worker is live.
 */
(function () {
  "use strict";

  var ROOMS_URL = "";
  if (/^localhost$/.test(location.hostname)) ROOMS_URL = new URLSearchParams(location.search).get("roomsUrl") || ROOMS_URL;
  if (!ROOMS_URL) return;

  var SUIT_SYMBOLS = ["spade", "club", "diamond", "heart"];
  var SUIT_NAMES = ["spades", "clubs", "diamonds", "hearts"];
  var params = new URLSearchParams(location.search);
  var code = (params.get("room") || "").toUpperCase();
  var stage = document.querySelector(".game-stage");

  function roomLink(c) {
    var q = new URLSearchParams();
    q.set("room", c);
    if (params.get("roomsUrl")) q.set("roomsUrl", params.get("roomsUrl"));
    return location.origin + location.pathname + "?" + q.toString();
  }

  function createRoom(button) {
    button.disabled = true;
    fetch(ROOMS_URL + "/rooms", { method: "POST" }).then(function (r) { return r.json(); }).then(function (data) {
      location.href = roomLink(data.code);
    }).catch(function () {
      button.disabled = false;
      button.textContent = "Couldn't connect. Try again";
    });
  }

  if (!/^[A-Z]{6}$/.test(code)) {
    var controls = document.querySelector(".game-controls");
    var open = document.createElement("button");
    open.className = "btn-game";
    open.type = "button";
    open.textContent = "Play with friends";
    open.addEventListener("click", function () { createRoom(open); });
    controls.insertBefore(open, controls.firstChild);
    return;
  }

  // ── Room view ──
  var panel = document.createElement("div");
  panel.className = "game-stage";
  panel.innerHTML =
    '<div class="game-toolbar"><div class="game-readout"><span class="readout-chip"><span>Table</span><b>' + code + '</b></span></div>' +
    '<div class="game-controls"><button class="btn-game" id="r-copy" type="button">Copy invite link</button><a class="btn-game" href="' + location.pathname + '">Leave table</a></div></div>' +
    '<p class="game-status" id="r-status" aria-live="polite">Connecting…</p>' +
    '<div id="r-lobby"></div>' +
    '<div id="r-game" hidden><div class="th-opponents" id="r-opponents"></div>' +
    '<div class="th-table"><div class="th-table-label" id="r-tablelabel">Table</div><div class="th-table-cards" id="r-tablecards"></div><div class="th-table-by" id="r-tableby"></div></div>' +
    '<div class="th-hand-wrap"><div class="th-hand" id="r-hand" aria-label="Your hand"></div></div>' +
    '<div class="th-actions"><button class="btn-game btn-game--primary" id="r-play" type="button" disabled>Play</button><button class="btn-game" id="r-pass" type="button" disabled>Pass</button><button class="btn-game" id="r-sort" type="button">Sort</button></div></div>' +
    '<p class="game-hint" id="r-hint"></p>';
  stage.parentNode.insertBefore(panel, stage);
  stage.hidden = true;

  var el = function (id) { return document.getElementById(id); };
  var statusEl = el("r-status"), lobbyEl = el("r-lobby"), gameEl = el("r-game"), handEl = el("r-hand");
  var view = null, selected = [], socket = null, retries = 0, closed = false, counted = false;

  function token() {
    var key = "sp_thirteen_room_" + code, value = null;
    try { value = localStorage.getItem(key); } catch (e) {}
    if (!value) {
      value = Array.from(crypto.getRandomValues(new Uint8Array(12)), function (b) { return b.toString(16).padStart(2, "0"); }).join("");
      try { localStorage.setItem(key, value); } catch (e) {}
    }
    return value;
  }
  var seatToken = token();

  function send(message) { if (socket && socket.readyState === 1) socket.send(JSON.stringify(message)); }
  function seatName(seat) {
    if (seat === view.seat) return "You";
    return (view.seats[seat] === "cpu" ? "Computer " : "Player ") + (seat + 1);
  }

  function cardEl(c, button) {
    var b = document.createElement(button ? "button" : "div");
    var v = c.value, face = v === 1 ? "A" : v === 11 ? "J" : v === 12 ? "Q" : v === 13 ? "K" : String(v);
    b.className = "th-card" + (c.suit >= 2 ? " th-card--red" : "");
    if (button) { b.type = "button"; b.dataset.id = c.id; }
    b.innerHTML = '<span class="th-rank">' + face + '</span><span class="th-suit"><span class="card-suit-icon card-suit-icon--' + SUIT_SYMBOLS[c.suit] + '" aria-hidden="true"></span></span>';
    b.setAttribute("aria-label", ({ A: "Ace", J: "Jack", Q: "Queen", K: "King" }[face] || face) + " of " + SUIT_NAMES[c.suit]);
    if (!button) b.setAttribute("role", "img");
    return b;
  }

  function renderLobby() {
    var isHost = view.seat === view.host, html = '<ul class="list-clean">';
    view.seats.forEach(function (s, i) {
      html += "<li>" + (i === view.seat ? "You" : "Seat " + (i + 1)) + (s === "cpu" ? " · open, the computer plays if nobody joins" : s === "away" ? " · reconnecting" : " · ready") + (i === view.host ? " · host" : "") + "</li>";
    });
    html += "</ul>";
    if (isHost) {
      html += '<div class="th-actions"><div class="seg" role="group" aria-label="Rules"><button type="button" data-mode="standard" aria-pressed="true">Standard</button><button type="button" data-mode="classic" aria-pressed="false">Classic</button></div>' +
        '<button class="btn-game btn-game--primary" id="r-start" type="button">' + (view.winner == null ? "Start game" : "Deal again") + "</button></div>";
    }
    lobbyEl.innerHTML = html;
    lobbyEl.querySelectorAll("[data-mode]").forEach(function (b) {
      b.addEventListener("click", function () {
        lobbyEl.querySelectorAll("[data-mode]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      });
    });
    var startBtn = el("r-start");
    if (startBtn) startBtn.addEventListener("click", function () {
      var mode = lobbyEl.querySelector('[data-mode][aria-pressed="true"]').dataset.mode;
      send({ t: "start", mode: mode });
      if (!counted && window.SnackPack && window.SnackPack.countFriends) { counted = true; window.SnackPack.countFriends(); }
    });
  }

  function renderGame() {
    var opp = el("r-opponents");
    opp.innerHTML = "";
    for (var i = 1; i < 4; i++) {
      var seat = (view.seat + i) % 4, turn = view.playing && view.turn === seat, passed = view.passed.indexOf(seat) >= 0;
      var d = document.createElement("div");
      d.className = "th-opp" + (turn ? " is-turn" : "") + (passed ? " is-passed" : "");
      d.innerHTML = "<strong>" + seatName(seat) + "</strong><span>" + view.counts[seat] + " cards" + (passed ? " · passed" : turn ? " · playing…" : "") + "</span>";
      opp.appendChild(d);
    }
    var tableCards = el("r-tablecards");
    tableCards.innerHTML = "";
    if (view.table) {
      view.table.cards.forEach(function (c) { tableCards.appendChild(cardEl(c)); });
      el("r-tablelabel").textContent = view.table.name;
      el("r-tableby").textContent = "played by " + seatName(view.table.seat).replace("You", "you");
    } else {
      el("r-tablelabel").textContent = "New round";
      el("r-tableby").textContent = "";
    }
    handEl.innerHTML = "";
    (view.hand || []).forEach(function (c) {
      var card = cardEl(c, true);
      if (selected.indexOf(c.id) >= 0) card.classList.add("is-selected");
      handEl.appendChild(card);
    });
    var mine = view.playing && view.turn === view.seat;
    el("r-play").disabled = !mine || !selected.length;
    el("r-pass").disabled = !mine || !view.table || view.table.seat === view.seat;
  }

  function render() {
    var finished = view.winner !== null && view.winner !== undefined;
    lobbyEl.hidden = view.playing;
    gameEl.hidden = !view.playing && !finished;
    if (!view.playing) renderLobby();
    if (view.playing || finished) renderGame();
    statusEl.className = "game-status";
    if (finished) {
      statusEl.textContent = view.winner === view.seat ? "You win! 🏆 Hand cleared." : seatName(view.winner) + " wins this round.";
      statusEl.className = "game-status game-status--" + (view.winner === view.seat ? "win" : "lose");
    } else if (!view.playing) statusEl.textContent = view.seat === view.host ? "Share the invite link, then start when everyone's here." : "Waiting for the host to start.";
    else if (view.turn === view.seat) statusEl.textContent = view.firstTurn ? "Your move — you have 3♠, lead the round." : view.table ? "Your move — beat it or pass." : "Your move — lead the round.";
    else statusEl.textContent = seatName(view.turn) + " is playing…";
  }

  function connect() {
    var url = ROOMS_URL.replace(/^http/, "ws") + "/rooms/" + code + "?token=" + seatToken;
    socket = new WebSocket(url);
    socket.addEventListener("open", function () { retries = 0; });
    socket.addEventListener("message", function (event) {
      var message = JSON.parse(event.data);
      if (message.t === "error") {
        el("r-hint").textContent = message.message;
        if (message.fatal) { closed = true; statusEl.textContent = message.message; }
        return;
      }
      el("r-hint").textContent = "";
      view = message;
      selected = selected.filter(function (id) { return (view.hand || []).some(function (c) { return c.id === id; }); });
      render();
    });
    socket.addEventListener("close", function () {
      if (closed) return;
      statusEl.textContent = "Reconnecting…";
      retries++;
      setTimeout(connect, Math.min(5000, 700 * retries));
    });
  }

  handEl.addEventListener("click", function (e) {
    var card = e.target.closest(".th-card");
    if (!card || !view || !view.playing || view.turn !== view.seat) return;
    var id = card.dataset.id, at = selected.indexOf(id);
    if (at >= 0) selected.splice(at, 1); else selected.push(id);
    renderGame();
  });
  el("r-play").addEventListener("click", function () { send({ t: "play", ids: selected }); selected = []; });
  el("r-pass").addEventListener("click", function () { selected = []; send({ t: "pass" }); });
  el("r-sort").addEventListener("click", function () { send({ t: "sort" }); });
  el("r-copy").addEventListener("click", function () {
    var button = el("r-copy"), link = roomLink(code);
    function done() { button.textContent = "Link copied"; setTimeout(function () { button.textContent = "Copy invite link"; }, 2000); }
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(done, function () { window.prompt("Copy this link", link); });
    else window.prompt("Copy this link", link);
  });

  connect();
})();
