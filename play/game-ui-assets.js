(function () {
  "use strict";

  var BASE = "./shared-assets/game-ui/";

  var cardBacks = [
    { key: "felt-green", name: "Felt Green", tier: "free", src: BASE + "card-decks/backs/felt-green.png" },
    { key: "classic-navy", name: "Classic Navy", tier: "free", src: BASE + "card-decks/backs/classic-navy.png" },
    { key: "snackpack-gold", name: "SnackPack Gold", tier: "free", src: BASE + "card-decks/backs/snackpack-gold.png" },
    { key: "royal-plum", name: "Royal Plum", tier: "pro", src: BASE + "card-decks/backs/royal-plum.png" },
    { key: "midnight-neon", name: "Midnight Neon", tier: "pro", src: BASE + "card-decks/backs/midnight-neon.png" },
    { key: "marble-rose", name: "Marble Rose", tier: "pro", src: BASE + "card-decks/backs/marble-rose.png" },
    { key: "emerald-arcade", name: "Emerald Arcade", tier: "pro", src: BASE + "card-decks/backs/emerald-arcade.png" },
    { key: "obsidian-star", name: "Obsidian Star", tier: "pro", src: BASE + "card-decks/backs/obsidian-star.png" }
  ];

  window.SnackPackGameUiAssets = {
    base: BASE,
    cards: {
      backs: cardBacks,
      suits: {
        C: BASE + "card-decks/suits/club.png",
        D: BASE + "card-decks/suits/diamond.png",
        S: BASE + "card-decks/suits/spade.png",
        H: BASE + "card-decks/suits/heart.png"
      },
      classicFacePath: BASE + "card-decks/faces/classic/"
    },
    mahjongTiles: BASE + "mahjong-tiles/png/",
    strategyTokens: BASE + "strategy-tokens/png/",
    chessPieces: BASE + "chess-pieces/png/",
    sokoban: BASE + "sokoban/png/",
    battleships: BASE + "battleships/png/",
    boardGames: BASE + "board-games/png/"
  };
}());
