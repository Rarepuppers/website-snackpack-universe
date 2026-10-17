(function () {
  "use strict";

  // Resolve from this script rather than the current page. Game pages load
  // this file from one directory up, while the play index loads it locally.
  var BASE = new URL("shared-assets/game-ui/", document.currentScript.src).href;
  var PRO = BASE + "pro-hand-painted/";

  var cardBacks = [
    // Generated from canonical deck-registry.json. All backs are free on the web.
    { key: "felt-green", name: "Felt Green", tier: "free", src: BASE + "card-decks/backs/felt-green.png" },
    { key: "classic-navy", name: "Classic Navy", tier: "free", src: BASE + "card-decks/backs/classic-navy.png" },
    { key: "snackpack-gold", name: "SnackPack Gold", tier: "free", src: BASE + "card-decks/backs/snackpack-gold.png" },
    { key: "royal-plum", name: "Royal Plum", tier: "pro", src: PRO + "card-decks/backs/royal-plum.png" },
    { key: "midnight-neon", name: "Midnight Neon", tier: "pro", src: PRO + "card-decks/backs/midnight-neon.png" },
    { key: "marble-rose", name: "Marble Rose", tier: "pro", src: PRO + "card-decks/backs/marble-rose.png" },
    { key: "emerald-arcade", name: "Emerald Arcade", tier: "pro", src: PRO + "card-decks/backs/emerald-arcade.png" },
    { key: "obsidian-star", name: "Obsidian Star", tier: "pro", src: PRO + "card-decks/backs/obsidian-star.png" }
  ];

  // A CSS image value for a shared-art PNG: WebP with the PNG as fallback where
  // the browser understands image-set(... type()), else the plain PNG. Never
  // hand an unsupported value to a custom property: inside var() it would
  // blank the whole background instead of falling back.
  var IMAGE_SET_OK = !!(window.CSS && CSS.supports && CSS.supports("background-image", 'image-set(url("a.webp") type("image/webp"))'));
  function cssImage(pngUrl) {
    var webpUrl = pngUrl.replace(/\.png$/i, ".webp");
    return IMAGE_SET_OK
      ? 'image-set(url("' + webpUrl + '") type("image/webp"), url("' + pngUrl + '") type("image/png"))'
      : 'url("' + pngUrl + '")';
  }

  window.SnackPackGameUiAssets = {
    base: BASE,
    cards: {
      backs: cardBacks,
      suits: {
        C: PRO + "card-decks/suits/club.png",
        D: PRO + "card-decks/suits/diamond.png",
        S: PRO + "card-decks/suits/spade.png",
        H: PRO + "card-decks/suits/heart.png"
      }
    },
    // Only the packs the site ships (Website target in
    // shared-assets/game-ui/derivative-profiles.json). Each PNG there has a
    // .webp beside it; use webp() to prefer it.
    strategyTokens: PRO + "strategy-tokens/png/",
    boardGames: PRO + "board-games/png/",
    gridLogicMarkers: PRO + "grid-logic-markers/png/",
    arcadeSprites: PRO + "arcade-sprites/png/",
    tableThemes: PRO + "table-themes/png/",
    webp: function (pngUrl) { return pngUrl.replace(/\.png$/i, ".webp"); },
    cssImage: cssImage
  };

  // Older cached HTML may not yet include the controls module.
  var scriptUrl = document.currentScript.src;
  function startControls() {
    if (window.SnackPackGameUiControls) window.SnackPackGameUiControls(window.SnackPackGameUiAssets, scriptUrl);
  }
  if (window.SnackPackGameUiControls) startControls();
  else {
    var controls = document.createElement("script");
    controls.src = new URL("game-ui-controls.js", scriptUrl).href;
    controls.onload = startControls;
    document.head.appendChild(controls);
  }
}());
