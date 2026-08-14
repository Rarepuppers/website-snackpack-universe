(function () {
  "use strict";

  var script = document.currentScript;
  var base = new URL(".", script ? script.src : window.location.href);
  var storageKey = "snackpack.arcade.audio.muted.v1";
  var muted = false;

  try { muted = localStorage.getItem(storageKey) === "1"; } catch (error) {}

  function updateButtons() {
    document.querySelectorAll("[data-sp-audio-toggle]").forEach(function (button) {
      button.setAttribute("aria-pressed", muted ? "true" : "false");
      button.textContent = muted ? "Sound off" : "Sound on";
      button.title = muted ? "Turn game sounds on" : "Turn game sounds off";
    });
  }

  function setMuted(next) {
    muted = Boolean(next);
    try { localStorage.setItem(storageKey, muted ? "1" : "0"); } catch (error) {}
    updateButtons();
  }

  function play(name) {
    if (muted) return;
    var audio = new Audio(new URL("shared-assets/game-ui/audio/" + name + ".wav", base).href);
    audio.preload = "auto";
    audio.volume = 0.65;
    var promise = audio.play();
    if (promise && promise.catch) promise.catch(function () {});
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-sp-audio-toggle]");
    if (button) setMuted(!muted);
  });
  document.addEventListener("DOMContentLoaded", updateButtons);

  window.SnackPackAudio = {
    isMuted: function () { return muted; },
    play: play,
    setMuted: setMuted
  };
})();
