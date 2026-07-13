(function () {
  "use strict";

  var BASE = "../sprites/arcade/";
  var manifests = {
    "asteroid-destroyer": {
      bg: "asteroid-destroyer-bg.png",
      sheet: "asteroid-destroyer-sprites.png",
      sprites: {
        asteroidLarge: [12, 20, 116, 124],
        asteroidMedium: [148, 34, 84, 96],
        asteroidSmall: [264, 46, 62, 76],
        ship: [360, 18, 102, 112],
        shield: [50, 168, 56, 56],
        triple: [150, 168, 56, 56],
        slow: [250, 168, 56, 56]
      }
    },
    "flappy-snacky": {
      bgDay: "flappy-snacky-bg-day.png",
      bgNight: "flappy-snacky-bg-night.png",
      pipe: "../../shared-assets/game-ui/pro-hand-painted/arcade-sprites/png/pipe.png",
      bird0: "../../shared-assets/game-ui/pro-hand-painted/arcade-sprites/png/flappy-bird-0.png",
      bird1: "../../shared-assets/game-ui/pro-hand-painted/arcade-sprites/png/flappy-bird-1.png",
      bird2: "../../shared-assets/game-ui/pro-hand-painted/arcade-sprites/png/flappy-bird-2.png",
      chopsticks: "../../shared-assets/game-ui/pro-hand-painted/arcade-sprites/png/flappy-chopsticks.png",
      burger: "../../shared-assets/game-ui/pro-hand-painted/arcade-sprites/png/flappy-burger.png",
      lollipop: "../../shared-assets/game-ui/pro-hand-painted/arcade-sprites/png/flappy-lollipop.png"
    },
    "snacky-worm": {
      bg: "snacky-worm-bg.png",
      sheet: "snacky-worm-sprites.png",
      sprites: {
        head: [24, 24, 64, 64],
        body: [112, 28, 58, 58],
        tail: [196, 32, 50, 50],
        food: [306, 18, 54, 64],
        medal: [405, 36, 54, 54]
      }
    },
    "table-tennis": {
      bg: "table-tennis-bg.png",
      sheet: "table-tennis-sprites.png",
      sprites: {
        paddleBlue: [42, 28, 28, 156],
        paddleGold: [110, 28, 28, 156],
        ball: [188, 78, 48, 48],
        trail: [280, 86, 170, 34]
      }
    }
  };

  var cache = {};

  function loadImage(url, pack, key) {
    var img = new Image();
    img.onload = function () {
      pack.images[key] = img;
      pack.pending -= 1;
      if (pack.pending === 0) {
        pack.ready = true;
        window.dispatchEvent(new CustomEvent("snackpack:arcade-assets-ready", { detail: { slug: pack.slug } }));
      }
    };
    img.onerror = function () {
      pack.pending -= 1;
      if (pack.pending === 0) {
        pack.ready = true;
        window.dispatchEvent(new CustomEvent("snackpack:arcade-assets-ready", { detail: { slug: pack.slug } }));
      }
    };
    img.src = url;
  }

  function load(slug) {
    if (cache[slug]) return cache[slug];
    var manifest = manifests[slug];
    var pack = { slug: slug, manifest: manifest, images: {}, pending: 0, ready: false };
    cache[slug] = pack;
    if (!manifest) return pack;
    Object.keys(manifest).forEach(function (key) {
      if (key === "sprites") return;
      pack.pending += 1;
      loadImage(BASE + manifest[key], pack, key);
    });
    if (pack.pending === 0) pack.ready = true;
    return pack;
  }

  function drawCover(ctx, img, x, y, w, h) {
    var scale = Math.max(w / img.width, h / img.height);
    var sw = w / scale;
    var sh = h / scale;
    var sx = (img.width - sw) / 2;
    var sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function drawSprite(ctx, pack, name, x, y, w, h, angle) {
    var img = pack && pack.images && pack.images.sheet;
    var src = pack && pack.manifest && pack.manifest.sprites && pack.manifest.sprites[name];
    if (!img || !src) return false;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    if (angle) ctx.rotate(angle);
    ctx.drawImage(img, src[0], src[1], src[2], src[3], -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }

  function configureCanvas(canvas, logicalWidth, logicalHeight) {
    var ratio = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    var targetWidth = Math.round(logicalWidth * ratio);
    var targetHeight = Math.round(logicalHeight * ratio);
    if (canvas.width !== targetWidth) canvas.width = targetWidth;
    if (canvas.height !== targetHeight) canvas.height = targetHeight;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    canvas.dataset.pixelRatio = String(ratio);
    return ctx;
  }

  window.SnackPackArcadeAssets = {
    configureCanvas: configureCanvas,
    load: load,
    drawCover: drawCover,
    drawSprite: drawSprite
  };
})();
