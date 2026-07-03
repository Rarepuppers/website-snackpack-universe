(function () {
  "use strict";

  var script = document.currentScript;
  var base = new URL(".", script ? script.src : window.location.href);
  var sheet = new Image();
  var pitchWide = new Image();
  var pitchRunner = new Image();
  var ready = false;
  var callbacks = [];
  var pending = 3;

  function assetReady() {
    pending -= 1;
    if (pending > 0) return;
    ready = true;
    callbacks.splice(0).forEach(function (callback) { callback(); });
  }

  function load(img, name) {
    img.onload = assetReady;
    img.onerror = assetReady;
    img.src = new URL("sprites/" + name, base).href;
  }

  function sprite(ctx, sx, sy, sw, sh, x, y, w, h) {
    if (!ready || !sheet.complete || sheet.naturalWidth === 0) return false;
    ctx.drawImage(sheet, sx, sy, sw, sh, x, y, w, h);
    return true;
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
    var img = variant === "runner" ? pitchRunner : pitchWide;
    if (!ready || !img.complete || img.naturalWidth === 0) return false;
    ctx.drawImage(img, 0, 0, width, height);
    return true;
  }

  window.SnackSoccerAssets = {
    drawBall: drawBall,
    drawBoot: drawBoot,
    drawPitch: drawPitch,
    drawStar: drawStar,
    drawTarget: drawTarget,
    onReady: function (callback) {
      if (ready) callback();
      else callbacks.push(callback);
    }
  };

  load(sheet, "soccer-sprites.png");
  load(pitchWide, "pitch-wide.png");
  load(pitchRunner, "pitch-runner.png");
})();
