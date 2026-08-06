/* pause.js — shared pause control for the arcade's timed and action games.
 *
 * None of them could be stopped mid-run: answer the door during a good
 * Asteroid Destroyer game and you came back to a dead ship. The Brain Games
 * apps already suspend their clocks when backgrounded; the web versions did
 * not, so a tab switch silently cost you the run.
 *
 * Each game keeps ownership of its own loop. This only supplies the UI — a
 * button, the P and Escape keys, an overlay, and an auto-pause when the tab
 * goes to the background — and calls back into the game to actually stop and
 * start it.
 *
 * Usage:
 *   SnackPackPause.attach({
 *     mount: document.querySelector(".game-controls"),
 *     stage: document.querySelector(".game-stage"),
 *     isPlaying: function () { return state.phase === "playing"; },
 *     pause:     function () { state.phase = "paused"; },
 *     resume:    function () { state.phase = "playing"; startLoop(); }
 *   });
 *
 * pause()/resume() must be safe to call repeatedly; the helper guards against
 * double-firing but games often have their own edge cases on restart.
 */
(function () {
  "use strict";

  function attach(opts) {
    var mount = opts.mount;
    var stage = opts.stage;
    if (!mount || typeof opts.pause !== "function" || typeof opts.resume !== "function") return null;

    var paused = false;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-game";
    btn.id = opts.id || "sp-pause";
    btn.textContent = "Pause";
    btn.setAttribute("aria-pressed", "false");
    mount.insertBefore(btn, mount.firstChild);

    var overlay = null;
    if (stage) {
      overlay = document.createElement("div");
      overlay.className = "sp-pause-overlay";
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML =
        '<div class="sp-pause-card">' +
        '<strong>Paused</strong>' +
        '<span>Press <kbd>P</kbd> or Escape to resume</span>' +
        '<button type="button" class="btn-game btn-game--primary sp-pause-resume">Resume</button>' +
        "</div>";
      if (getComputedStyle(stage).position === "static") stage.style.position = "relative";
      stage.appendChild(overlay);
      overlay.querySelector(".sp-pause-resume").addEventListener("click", function () { setPaused(false); });
    }

    function setPaused(next) {
      if (next === paused) return;
      // Never "pause" a game that isn't running — otherwise resuming would
      // start a loop the game had deliberately stopped (menu, game over).
      if (next && opts.isPlaying && !opts.isPlaying()) return;
      // Refuse to resume into a backgrounded tab. Some games (Flappy Snacky)
      // stop their own loop while hidden, so resuming here would restart a
      // loop that game is about to stop again — and the player can't see it
      // either way.
      if (!next && document.hidden) return;
      paused = next;
      btn.textContent = paused ? "Resume" : "Pause";
      btn.setAttribute("aria-pressed", String(paused));
      if (overlay) {
        overlay.classList.toggle("is-open", paused);
        overlay.setAttribute("aria-hidden", String(!paused));
      }
      try {
        if (paused) opts.pause();
        else opts.resume();
      } catch (e) {
        // A game that fails to resume shouldn't leave the UI stuck in "Paused".
        paused = false;
        btn.textContent = "Pause";
        if (overlay) overlay.classList.remove("is-open");
        throw e;
      }
    }

    btn.addEventListener("click", function () { setPaused(!paused); });

    // A sibling control in the toolbar (New game, a mode/difficulty button…)
    // can restart the game while paused — every game's own handler for those
    // already resets ITS state, but doesn't know about ours, so the overlay
    // stayed stuck open over a game that was quietly running again underneath.
    // Reproduced and confirmed 2026-08-07 across every game that uses this
    // helper, not just the newest ones. Drop the paused UI on any OTHER click
    // inside mount, without calling opts.pause()/resume() — the game already
    // owns whatever state it just transitioned to, and this only corrects the
    // UI to stop lying about it. Runs on the bubble phase, after the control's
    // own handler, so it sees the state the game already changed to.
    mount.addEventListener("click", function (e) {
      if (!paused || e.target === btn || btn.contains(e.target)) return;
      paused = false;
      btn.textContent = "Pause";
      btn.setAttribute("aria-pressed", "false");
      if (overlay) {
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
      }
    });

    window.addEventListener("keydown", function (e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === "p" || e.key === "P") { e.preventDefault(); setPaused(!paused); }
      else if (e.key === "Escape" && paused) { e.preventDefault(); setPaused(false); }
    });

    // Auto-pause when the tab is backgrounded. Deliberately does NOT auto-
    // resume — coming back to a running game you can't react to is worse than
    // coming back to a paused one.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) setPaused(true);
    });

    return {
      isPaused: function () { return paused; },
      pause: function () { setPaused(true); },
      resume: function () { setPaused(false); }
    };
  }

  window.SnackPackPause = { attach: attach };
}());
