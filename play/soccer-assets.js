(function () {
  "use strict";

  var script = document.currentScript;
  var base = new URL(".", script ? script.src : window.location.href);
  var sheet = new Image();
  var actors = new Image();
  var badges = new Image();
  var fx = new Image();
  var fxExtra = new Image();
  var goal = new Image();
  var ready = false;
  var callbacks = [];
  // Six sheets plus exactly one pitch.
  var pending = 7;

  // Only one pitch is ever drawn by a given game: seven of the eight soccer
  // games ask for "wide" and Dribble Rush asks for "runner". Loading both cost
  // every page 2.4-2.6 MB for art it could never draw — about a quarter of a
  // ~9 MB first load. The page declares what it needs with data-pitch on the
  // script tag, defaulting to wide; anything else is fetched on demand the
  // first time it is actually asked for, so a mismatch degrades to the game's
  // own gradient pitch for a moment rather than breaking.
  var PITCHES = { wide: "pitch-wide.png", runner: "pitch-runner.png" };
  var pitches = {};

  function pitchImage(variant, counted) {
    var name = PITCHES[variant] ? variant : "wide";
    var img = pitches[name];
    if (!img) {
      img = pitches[name] = new Image();
      if (counted) {
        load(img, PITCHES[name]);
      } else {
        // Lazily fetched because a game asked for a pitch it did not declare;
        // nothing is waiting on it, so it just needs the same WebP preference.
        img.src = new URL("sprites/" + (webpOk ? PITCHES[name].replace(/\.png$/, ".webp") : PITCHES[name]), base).href;
      }
    }
    return img;
  }

  var actorRects = {
    runner0: [0, 0, 128, 128],
    runner1: [128, 0, 128, 128],
    runner2: [256, 0, 128, 128],
    runnerHop: [384, 0, 128, 128],
    defender: [0, 128, 128, 128],
    tackle: [128, 128, 128, 128],
    striker: [256, 128, 128, 128],
    strikerHeader: [384, 128, 128, 128],
    keeperC: [512, 128, 128, 128],
    keeperL: [640, 128, 128, 128],
    keeperR: [768, 128, 128, 128],
    ball0: [32, 328, 64, 64],
    ball1: [112, 328, 64, 64],
    ball2: [192, 328, 64, 64],
    ball3: [272, 328, 64, 64]
  };

  var badgeRects = {
    cleanSheet: [0, 0, 256, 256],
    hatTrick: [256, 0, 256, 256],
    perfectHeader: [512, 0, 256, 256],
    longRun: [768, 0, 256, 256],
    flagStreak: [0, 256, 256, 256],
    goldenBoot: [256, 256, 256, 256],
    saveStreak: [512, 256, 256, 256],
    bullseye: [768, 256, 256, 256]
  };

  var fxRects = {
    sparkle: [0, 0, 128, 128],
    dust: [128, 0, 128, 128],
    timingRing: [256, 0, 160, 144],
    speedLines: [0, 128, 192, 96],
    netRipple: [208, 128, 160, 96],
    impact: [368, 128, 128, 96]
  };

  var fxExtraRects = {
    goalBurst: [0, 0, 256, 256],
    saveBurst: [256, 0, 256, 256],
    comboFlare: [512, 0, 256, 256],
    missPuff: [768, 0, 256, 256]
  };

  function assetReady() {
    pending -= 1;
    if (pending > 0) return;
    ready = true;
    callbacks.splice(0).forEach(function (callback) { callback(); });
  }

  // These sheets are the heaviest thing the soccer games pull — 8 MB of raw
  // PNG across the set. The same art at WebP q90 is 1.8 MB, so every sheet has
  // a .webp beside it and the .png stays as the fallback for anything that
  // cannot read one. Canvas toDataURL is the honest support test: a browser
  // without WebP hands back a PNG data URL instead.
  var webpOk = (function () {
    try {
      return document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0;
    } catch (error) {
      return false;
    }
  }());

  function load(img, name) {
    img.onload = assetReady;
    if (webpOk) {
      // One retry on the PNG if the WebP is missing or refused, so a sheet that
      // failed to generate degrades to the original rather than to nothing.
      img.onerror = function () {
        img.onerror = assetReady;
        img.src = new URL("sprites/" + name, base).href;
      };
      img.src = new URL("sprites/" + name.replace(/\.png$/, ".webp"), base).href;
      return;
    }
    img.onerror = assetReady;
    img.src = new URL("sprites/" + name, base).href;
  }

  function sprite(ctx, sx, sy, sw, sh, x, y, w, h) {
    if (!ready || !sheet.complete || sheet.naturalWidth === 0) return false;
    ctx.drawImage(sheet, sx, sy, sw, sh, x, y, w, h);
    return true;
  }

  function drawFrom(ctx, img, rect, x, y, w, h, angle) {
    if (!ready || !img.complete || img.naturalWidth === 0 || !rect) return false;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    if (angle) ctx.rotate(angle);
    ctx.drawImage(img, rect[0], rect[1], rect[2], rect[3], -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }

  function drawActor(ctx, name, x, y, w, h, angle) {
    return drawFrom(ctx, actors, actorRects[name], x, y, w, h, angle);
  }

  function drawBadge(ctx, name, x, y, w, h) {
    return drawFrom(ctx, badges, badgeRects[name], x, y, w, h, 0);
  }

  function drawFx(ctx, name, x, y, w, h, angle) {
    return drawFrom(ctx, fx, fxRects[name], x, y, w, h, angle);
  }

  function drawFxExtra(ctx, name, x, y, w, h, angle) {
    return drawFrom(ctx, fxExtra, fxExtraRects[name], x, y, w, h, angle);
  }

  function drawGoal(ctx, rect) {
    if (!ready || !goal.complete || goal.naturalWidth === 0 || !rect) return false;
    // Map the generated asset's visible alpha bounds to the gameplay goal
    // rect so the frame remains aligned with the existing hitbox.
    var alphaX = 78 / 1774, alphaY = 112 / 887;
    var alphaW = 1610 / 1774, alphaH = 666 / 887;
    var drawW = rect.w / alphaW, drawH = rect.h / alphaH;
    ctx.drawImage(goal, rect.x - alphaX * drawW, rect.y - alphaY * drawH, drawW, drawH);
    return true;
  }

  function goalFrameHit(rect, point, radius) {
    if (!rect || !point) return null;
    var r = radius || 10;
    var topHit = point.x >= rect.x - r && point.x <= rect.x + rect.w + r && Math.abs(point.y - rect.y) <= r;
    if (topHit) return "crossbar";
    var leftHit = Math.abs(point.x - rect.x) <= r && point.y >= rect.y - r && point.y <= rect.y + rect.h + r;
    var rightHit = Math.abs(point.x - (rect.x + rect.w)) <= r && point.y >= rect.y - r && point.y <= rect.y + rect.h + r;
    return leftHit || rightHit ? "post" : null;
  }

  function drawBall(ctx, x, y, radius) {
    return sprite(ctx, 0, 0, 256, 256, x - radius, y - radius, radius * 2, radius * 2);
  }

  function drawStar(ctx, x, y, radius) {
    return sprite(ctx, 256, 0, 256, 256, x - radius, y - radius, radius * 2, radius * 2);
  }

  function drawTarget(ctx, x, y, radius) {
    return sprite(ctx, 512, 0, 256, 256, x - radius, y - radius, radius * 2, radius * 2);
  }

  function drawBoot(ctx, x, y, width, height) {
    return sprite(ctx, 768, 0, 256, 256, x, y, width, height);
  }

  function drawPitch(ctx, width, height, variant) {
    var img = pitchImage(variant);
    if (!ready || !img.complete || img.naturalWidth === 0) return false;
    ctx.drawImage(img, 0, 0, width, height);
    return true;
  }

  window.SnackSoccerAssets = {
    drawActor: drawActor,
    drawBadge: drawBadge,
    drawBall: drawBall,
    drawBoot: drawBoot,
    drawFx: drawFx,
    drawFxExtra: drawFxExtra,
    drawGoal: drawGoal,
    goalFrameHit: goalFrameHit,
    drawPitch: drawPitch,
    drawStar: drawStar,
    drawTarget: drawTarget,
    onReady: function (callback) {
      if (ready) callback();
      else callbacks.push(callback);
    }
  };

  load(sheet, "soccer-sprites.png");
  load(actors, "soccer-actors.png");
  load(badges, "soccer-badges.png");
  load(fx, "soccer-fx.png");
  load(fxExtra, "soccer-fx-extra.png");
  load(goal, "soccer-goal.png");
  pitchImage((script && script.dataset && script.dataset.pitch) || "wide", true);
})();
