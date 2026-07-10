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
    boardGames: BASE + "board-games/png/",
    dominoes: BASE + "dominoes/png/",
    gridLogicMarkers: BASE + "grid-logic-markers/png/",
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
