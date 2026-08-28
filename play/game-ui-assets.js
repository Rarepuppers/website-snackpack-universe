(function () {
  "use strict";

  // Resolve from this script rather than the current page. Game pages load
  // this file from one directory up, while the play index loads it locally.
  var BASE = new URL("shared-assets/game-ui/", document.currentScript.src).href;
  var PRO = BASE + "pro-hand-painted/";

  var cardBacks = [
    { key: "felt-green", name: "Felt Green", tier: "free", src: BASE + "card-decks/backs/felt-green.png" },
    { key: "classic-navy", name: "Classic Navy", tier: "free", src: BASE + "card-decks/backs/classic-navy.png" },
    { key: "snackpack-gold", name: "SnackPack Gold", tier: "free", src: BASE + "card-decks/backs/snackpack-gold.png" },
    { key: "royal-plum", name: "Royal Plum", tier: "pro", src: PRO + "card-decks/backs/royal-plum.png" },
    { key: "midnight-neon", name: "Midnight Neon", tier: "pro", src: PRO + "card-decks/backs/midnight-neon.png" },
    { key: "marble-rose", name: "Marble Rose", tier: "pro", src: PRO + "card-decks/backs/marble-rose.png" },
    { key: "emerald-arcade", name: "Emerald Arcade", tier: "pro", src: PRO + "card-decks/backs/emerald-arcade.png" },
    { key: "obsidian-star", name: "Obsidian Star", tier: "pro", src: PRO + "card-decks/backs/obsidian-star.png" }
  ];

  window.SnackPackGameUiAssets = {
    base: BASE,
    cards: {
      backs: cardBacks,
      suits: {
        C: PRO + "card-decks/suits/club.png",
        D: PRO + "card-decks/suits/diamond.png",
        S: PRO + "card-decks/suits/spade.png",
        H: PRO + "card-decks/suits/heart.png"
      },
      classicFacePath: BASE + "card-decks/faces/classic/"
    },
    mahjongTiles: BASE + "mahjong-tiles/png/",
    strategyTokens: PRO + "strategy-tokens/png/",
    chessPieces: BASE + "chess-pieces/png/",
    sokoban: BASE + "sokoban/png/",
    battleships: BASE + "battleships/png/",
    boardGames: PRO + "board-games/png/",
    dominoes: BASE + "dominoes/png/",
    gridLogicMarkers: PRO + "grid-logic-markers/png/",
    wordGameTiles: BASE + "word-game-tiles/png/",
    arcadeSprites: BASE + "arcade-sprites/png/",
    photoJigsaw: BASE + "photo-jigsaw/png/",
    tableThemes: BASE + "table-themes/png/",
    proHandPainted: {
      boardGames: BASE + "pro-hand-painted/board-games/png/",
      cardDecks: {
        backs: BASE + "pro-hand-painted/card-decks/backs/",
        suits: BASE + "pro-hand-painted/card-decks/suits/"
      },
      mahjongTiles: BASE + "pro-hand-painted/mahjong-tiles/png/",
      strategyTokens: BASE + "pro-hand-painted/strategy-tokens/png/",
      chessPieces: BASE + "pro-hand-painted/chess-pieces/png/",
      sokoban: BASE + "pro-hand-painted/sokoban/png/",
      battleships: BASE + "pro-hand-painted/battleships/png/",
      dominoes: BASE + "pro-hand-painted/dominoes/png/",
      gridLogicMarkers: BASE + "pro-hand-painted/grid-logic-markers/png/",
      wordGameTiles: BASE + "pro-hand-painted/word-game-tiles/png/",
      arcadeSprites: BASE + "pro-hand-painted/arcade-sprites/png/",
      photoJigsaw: BASE + "pro-hand-painted/photo-jigsaw/png/",
      tableThemes: BASE + "pro-hand-painted/table-themes/png/"
    }
  };

  // Keep a small, private-on-device return trail for the arcade hub. This file
  // is already loaded by every game, so one guarded hook covers the full set.
  (function recordRecentGame() {
    var match = location.pathname.match(/^\/play\/([^/]+)\/?$/);
    if (!match || match[1] === "daily" || match[1] === "stats") return;
    try {
      var recent = JSON.parse(localStorage.getItem("sp_recent") || "[]");
      if (!Array.isArray(recent)) recent = [];
      var titleNode = document.querySelector("h1");
      var item = {
        slug: match[1],
        title: titleNode ? titleNode.textContent.trim() : match[1].replace(/-/g, " "),
        href: location.pathname,
        at: Date.now()
      };
      recent = recent.filter(function (entry) { return entry && entry.slug !== item.slug; });
      recent.unshift(item);
      localStorage.setItem("sp_recent", JSON.stringify(recent.slice(0, 12)));
    } catch (error) {}
  }());

  (function persistExistingGameOptions() {
    var match = location.pathname.match(/^\/play\/([^/]+)\/?$/);
    if (!match) return;
    var slug = match[1].replace(/[^a-z0-9]+/g, "_");
    var attributes = ["mode", "level", "diff", "difficulty", "size", "layout", "cells", "suits", "players", "theme"];
    document.querySelectorAll(".game-controls [role=group], .game-controls .seg, .fc-actions [role=group], .fc-actions .fc-seg").forEach(function (group) {
      var attr = attributes.find(function (name) { return group.querySelector("[data-" + name + "]"); });
      if (!attr) return;
      var key = "sp_" + slug + "_pref_" + attr;
      var saved = null;
      try { saved = localStorage.getItem(key); } catch (error) {}
      var savedButton = saved && Array.from(group.querySelectorAll("[data-" + attr + "]")).find(function (button) { return button.dataset[attr] === saved; });
      if (savedButton && savedButton.getAttribute("aria-pressed") !== "true") savedButton.click();
      group.addEventListener("click", function (event) {
        var button = event.target.closest("[data-" + attr + "]");
        if (!button) return;
        try { localStorage.setItem(key, button.dataset[attr]); } catch (error) {}
      });
    });
  }());

  (function addLargePiecesPreference() {
    var match = location.pathname.match(/^\/play\/(checkers|reversi|connect-4|mahjong|sudoku|crossword)\/?$/);
    if (!match) return;
    var controls = document.querySelector(".game-controls");
    var stage = document.querySelector(".game-stage");
    if (!controls || !stage) return;
    var key = "sp_accessibility_large";
    var on = false;
    try { on = localStorage.getItem(key) === "1"; } catch (error) {}
    var button = document.createElement("button");
    button.className = "btn-game";
    button.type = "button";
    button.textContent = "Large pieces";
    button.title = "Make board pieces and labels larger on wide screens";
    controls.insertBefore(button, controls.lastElementChild);
    function apply() {
      stage.classList.toggle("sp-large-pieces", on);
      button.setAttribute("aria-pressed", String(on));
    }
    button.addEventListener("click", function () {
      on = !on;
      try { localStorage.setItem(key, on ? "1" : "0"); } catch (error) {}
      apply();
    });
    apply();
  }());

  (function addDeckPicker() {
    if (!/^\/play\/(solitaire|spider-solitaire|tripeaks|memory-match)\/?$/.test(location.pathname)) return;
    var controls = document.querySelector(".game-controls");
    var stage = document.querySelector(".game-stage");
    if (!controls || !stage) return;
    var label = document.createElement("label");
    label.className = "sp-deck-picker";
    label.innerHTML = '<span class="sr-only">Card back</span><select aria-label="Card back"></select>';
    var select = label.querySelector("select");
    cardBacks.forEach(function (back) {
      var option = document.createElement("option");
      option.value = back.key; option.textContent = back.name; option.dataset.src = back.src;
      select.appendChild(option);
    });
    var current = "emerald-arcade";
    try { current = localStorage.getItem("sp_cards_back") || current; } catch (error) {}
    if (!cardBacks.some(function (back) { return back.key === current; })) current = "emerald-arcade";
    select.value = current;
    function apply() {
      var back = cardBacks.find(function (item) { return item.key === select.value; }) || cardBacks[0];
      stage.style.setProperty("--sp-card-back", 'url("' + back.src + '")');
      try { localStorage.setItem("sp_cards_back", back.key); } catch (error) {}
    }
    select.addEventListener("change", apply);
    controls.insertBefore(label, controls.lastElementChild);
    apply();
  }());

  (function enableArcadeAudio() {
    var gameMatch = location.pathname.match(/^\/play\/([^/]+)\/?$/);
    if (!gameMatch || gameMatch[1] === "daily" || gameMatch[1] === "stats") return;

    function wire() {
      var controls = document.querySelector(".game-controls, .fc-actions");
      if (controls && !controls.querySelector("[data-sp-audio-toggle]")) {
        var toggle = document.createElement("button");
        toggle.type = "button"; toggle.className = "btn-game";
        toggle.setAttribute("data-sp-audio-toggle", "");
        controls.insertBefore(toggle, controls.lastElementChild);
        window.SnackPackAudio.setMuted(window.SnackPackAudio.isMuted());
      }
      window.SnackPackAudio.preload(["place", "invalid", "success", "win", "pop", "whoosh"]);
      document.addEventListener("click", function (event) {
        if (event.target.closest("[data-sp-audio-toggle], .theme-toggle, .sp-share-actions")) return;
        if (event.target.closest(".card, .fc-card, .spi-card, .th-card, .mj-tile, .mem-card, .ck-sq, .rv-sq, .c4-cell, .c4-col-btn, .ms-cell, .su-cell, .pc-cell, .kk-fill, .cw-cell, .ws-cell, .g2048-board")) {
          window.SnackPackAudio.play("place");
        }
      });
      var status = document.querySelector(".game-status");
      if (status) {
        var last = status.textContent;
        new MutationObserver(function () {
          var next = status.textContent;
          if (!next || next === last) return;
          last = next;
          if (/win|won|solved|cleared|all words|reached 100|picture revealed/i.test(next)) window.SnackPackAudio.play("win");
          else if (/wrong|mistake|boom|invalid|doesn't fit|try again/i.test(next)) window.SnackPackAudio.play("invalid");
          else if (/found|correct|ladder|goal|matched|nice/i.test(next)) window.SnackPackAudio.play("success");
        }).observe(status, { childList: true, characterData: true, subtree: true });
      }
      if (/^(asteroid-destroyer|flappy-snacky|snacky-worm|table-tennis|target-shooting-arena)$/.test(gameMatch[1])) {
        document.addEventListener("pointerdown", function (event) {
          if (event.target.closest("canvas, .as-btn, .tt-board-wrap")) window.SnackPackAudio.play(gameMatch[1] === "asteroid-destroyer" ? "pop" : "whoosh");
        });
      } else if (/^(keepy-uppy|free-kick-curl|crossbar-challenge|goalkeeper-hero|penalty-shootout|dribble-rush|header-hero)$/.test(gameMatch[1])) {
        document.addEventListener("pointerdown", function (event) { if (event.target.closest("canvas, .game-board-wrap")) window.SnackPackAudio.play("whoosh"); });
      }
    }
    if (window.SnackPackAudio) wire();
    else {
      var script = document.createElement("script");
      script.src = new URL("audio.js", document.currentScript ? document.currentScript.src : location.href).href;
      script.addEventListener("load", wire);
      document.head.appendChild(script);
    }
  }());
}());
