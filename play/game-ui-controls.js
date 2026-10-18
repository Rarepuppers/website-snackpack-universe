(function () {
  "use strict";
  // Behavioral hooks are separate from generated asset metadata. Safe to call once.
  window.SnackPackGameUiControls = function (assets, scriptUrl) {
    if (window.SnackPackGameUiControls.started) return;
    window.SnackPackGameUiControls.started = true;
    var cardBacks = assets.cards.backs;
    var cssImage = assets.cssImage;
    // A failed decorative image must never erase a card's suit. Start with a
    // native glyph; replace it only after one of the actual formats decodes.
    function loadSuitArtwork() {
      if (!document.querySelector('.card-suit-icon')) return;
      Object.entries({ spade: 'S', heart: 'H', diamond: 'D', club: 'C' }).forEach(function (entry) {
        var name = entry[0], png = assets.cards.suits[entry[1]], image = new Image();
        var triedPng = false;
        image.onload = function () {
          document.documentElement.style.setProperty('--sp-suit-' + name + '-image', 'url("' + image.src + '")');
          document.documentElement.classList.add('sp-suit-' + name + '-ready');
        };
        image.onerror = function () {
          if (!triedPng) { triedPng = true; image.src = png; }
        };
        image.src = assets.webp(png);
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadSuitArtwork, { once: true });
    else loadSuitArtwork();
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
    var attributes = ["mode", "level", "diff", "difficulty", "size", "layout", "cells", "suits", "draw", "players", "theme"];
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

  (function addClearMahjongFaces() {
    if (!/^\/play\/mahjong\/?$/.test(location.pathname)) return;
    var controls = document.querySelector('.game-controls');
    var stage = document.querySelector('.game-stage');
    if (!controls || !stage) return;
    var key = 'sp_mahjong_clear_faces', on = false;
    try { on = localStorage.getItem(key) === '1'; } catch (error) {}
    var button = document.createElement('button');
    button.className = 'btn-game'; button.type = 'button'; button.textContent = 'Clear faces';
    button.title = 'Use simple family symbols and larger tile ranks';
    function apply() { stage.classList.toggle('sp-clear-faces', on); button.setAttribute('aria-pressed', String(on)); }
    button.addEventListener('click', function () { on = !on; try { localStorage.setItem(key, on ? '1' : '0'); } catch (error) {} apply(); });
    controls.insertBefore(button, controls.lastElementChild); apply();
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
      stage.style.setProperty("--sp-card-back", cssImage(back.src));
      try { localStorage.setItem("sp_cards_back", back.key); } catch (error) {}
    }
    select.addEventListener("change", apply);
    controls.insertBefore(label, controls.lastElementChild);
    apply();
  }());

  // Phones: fold the options row behind one button so the board is on the
  // first screen. play.css does the hiding (≤760 px) and keeps New game, Undo,
  // Hint and Pause out; this adds the button and names the current choices on
  // it, so a folded row never hides which mode you are in.
  (function addOptionsDisclosure() {
    // Pinball docks its own HUD under the header and is another session's.
    if (/^\/play\/pinball\/?$/.test(location.pathname)) return;
    var stage = document.querySelector(".game-stage");
    var controls = stage && stage.querySelector(".game-controls, .fc-actions");
    if (!controls || controls.querySelector(".sp-options-toggle")) return;
    var keep = ".btn-game--primary, .primary, [id$='-undo'], [id$='-hint'], #sp-pause";
    var foldable = Array.prototype.filter.call(controls.children, function (el) { return !el.matches(keep); }).length
      + stage.querySelectorAll(".color-pick, .category-controls").length;
    // The sound toggle joins later (enableArcadeAudio), so one is enough.
    if (foldable < 1) return;
    stage.classList.add("sp-has-options");
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "btn-game sp-options-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = 'Options <span class="sp-options-summary"></span>';
    var summary = toggle.querySelector(".sp-options-summary");
    function describe() {
      var picked = Array.prototype.map.call(controls.querySelectorAll(".seg [aria-pressed='true'], [role=group] [aria-pressed='true'], .fc-seg [aria-pressed='true']"), function (b) { return b.textContent.trim(); }).filter(Boolean);
      summary.textContent = picked.length ? "· " + picked.slice(0, 2).join(" · ") : "";
    }
    toggle.addEventListener("click", function () {
      var open = !stage.classList.contains("sp-options-open");
      stage.classList.toggle("sp-options-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    controls.addEventListener("click", function () { setTimeout(describe, 0); });
    controls.insertBefore(toggle, controls.firstChild);
    describe();
  }());

  (function enableArcadeAudio() {
    var gameMatch = location.pathname.match(/^\/play\/([^/]+)\/?$/);
    // Last Bastion owns its own Phaser audio stack. Without this guard the
    // arcade sound system is preloaded underneath it and the page ends up
    // running two of them.
    if (!gameMatch || gameMatch[1] === "daily" || gameMatch[1] === "stats"
        || gameMatch[1] === "last-bastion") return;

    function wire() {
      var controls = document.querySelector(".game-controls, .fc-actions");
      if (controls && !controls.querySelector("[data-sp-audio-toggle]")) {
        var toggle = document.createElement("button");
        toggle.type = "button"; toggle.className = "btn-game";
        toggle.setAttribute("data-sp-audio-toggle", "");
        controls.insertBefore(toggle, controls.lastElementChild);
        window.SnackPackAudio.setMuted(window.SnackPackAudio.isMuted());
      }
      window.SnackPackAudio.preload(["place", "pickup", "invalid", "success", "win", "tick", "pop", "whoosh"]);
      // Each game gets feedback that matches its action. Card games with richer
      // move knowledge own their sounds inline, avoiding the old double-trigger
      // where every click was treated as a successful placement.
      var slug = gameMatch[1];
      var inlineOwned = /^(solitaire|spider-solitaire|freecell|thirteen|tripeaks|pyramid|golf-solitaire|water-sort)$/;
      var clickProfiles = {
        "2048": [[".g2048-board", "tick"]],
        "checkers": [[".ck-sq", "pickup"]], "reversi": [[".rv-sq", "place"]],
        "connect-4": [[".c4-cell,.c4-col-btn", "place"]], "mahjong": [[".mj-tile", "pickup"]],
        "memory-match": [[".mem-card", "pickup"]], "minesweeper": [[".ms-cell", "tick"]],
        "sudoku": [[".su-cell,.su-pad button", "tick"]], "picross": [[".pc-cell", "tick"]],
        "killer-kenken": [[".kk-fill,.kk-cell", "tick"]], "crossword": [[".cw-cell", "tick"]],
        "word-search": [[".ws-cell", "pickup"]]
      };
      (clickProfiles[slug] || []).forEach(function (binding) {
        document.addEventListener("click", function (event) {
          if (!event.target.closest("[data-sp-audio-toggle], .theme-toggle, .sp-share-actions") && event.target.closest(binding[0])) window.SnackPackAudio.play(binding[1]);
        });
      });
      var status = document.querySelector(".game-status");
      if (status && !inlineOwned.test(slug)) {
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
      if (/^(asteroid-destroyer|flappy-snacky|snacky-worm|table-tennis|target-shooting-arena)$/.test(slug)) {
        document.addEventListener("pointerdown", function (event) {
          if (event.target.closest("canvas, .as-btn, .tt-board-wrap")) window.SnackPackAudio.play(slug === "asteroid-destroyer" ? "pop" : "whoosh");
        });
      } else if (/^(keepy-uppy|free-kick-curl|crossbar-challenge|goalkeeper-hero|penalty-shootout|dribble-rush|header-hero)$/.test(gameMatch[1])) {
        document.addEventListener("pointerdown", function (event) { if (event.target.closest("canvas, .game-board-wrap")) window.SnackPackAudio.play("whoosh"); });
      }
    }
    if (window.SnackPackAudio) wire();
    else {
      var script = document.createElement("script");
      script.src = new URL("audio.js", document.currentScript ? scriptUrl : location.href).href;
      script.addEventListener("load", wire);
      document.head.appendChild(script);
    }
  }());
  };
}());

