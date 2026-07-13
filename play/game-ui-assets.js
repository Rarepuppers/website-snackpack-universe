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
        suits: BASE + "pro-hand-painted/card-decks/suits/",
        classicFacePath: BASE + "pro-hand-painted/card-decks/faces/classic/"
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
}());
