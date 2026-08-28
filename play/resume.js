(function () {
  "use strict";

  var DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000;

  function attach(options) {
    if (!window.SnackPackStore || !options || !options.game) return null;

    var timer = null;
    var prompt = null;
    var pendingChoice = false;
    var destroyed = false;
    var currentVariant = variant();

    function variant() {
      try { return String(options.variant ? options.variant() : "default"); }
      catch (error) { return "default"; }
    }

    function storageKey(forVariant) {
      return window.SnackPackStore.key(options.game, "save", forVariant || variant());
    }

    function validEnvelope(value, expectedVariant) {
      if (!value || typeof value !== "object") return false;
      if (value.schemaVersion !== (options.schemaVersion || 1)) return false;
      if (value.gameVersion !== (options.gameVersion || 1)) return false;
      if (String(value.variant) !== String(expectedVariant)) return false;
      if (!Number.isFinite(value.updatedAt)) return false;
      if (Date.now() - value.updatedAt > (options.ttl || DEFAULT_TTL)) return false;
      if (!("payload" in value)) return false;
      if (options.validate) {
        try { return options.validate(value.payload) === true; }
        catch (error) { return false; }
      }
      return true;
    }

    function read(forVariant) {
      var key = storageKey(forVariant);
      var value = window.SnackPackStore.getJSON(key, null);
      if (!validEnvelope(value, forVariant)) {
        if (value != null) window.SnackPackStore.remove(key);
        return null;
      }
      return value;
    }

    function isActive() {
      try { return options.isActive ? options.isActive() === true : true; }
      catch (error) { return false; }
    }

    function saveNow() {
      if (destroyed || pendingChoice || !isActive()) return false;
      var payload;
      try { payload = options.serialize(); }
      catch (error) { return false; }
      if (payload == null) return false;
      currentVariant = variant();
      return window.SnackPackStore.setJSON(storageKey(currentVariant), {
        schemaVersion: options.schemaVersion || 1,
        gameVersion: options.gameVersion || 1,
        variant: currentVariant,
        updatedAt: Date.now(),
        payload: payload,
      });
    }

    function changed() {
      if (destroyed || pendingChoice) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(saveNow, options.debounce == null ? 400 : options.debounce);
    }

    function clear(forVariant) {
      window.clearTimeout(timer);
      return window.SnackPackStore.remove(storageKey(forVariant || variant()));
    }

    function removePrompt() {
      pendingChoice = false;
      if (prompt && prompt.parentNode) prompt.parentNode.removeChild(prompt);
      prompt = null;
    }

    function announce(message) {
      var target = document.querySelector(".game-status");
      if (target) target.textContent = message;
    }

    function offerResume() {
      currentVariant = variant();
      var saved = read(currentVariant);
      if (!saved) return;
      pendingChoice = true;
      prompt = document.createElement("section");
      prompt.className = "sp-resume";
      prompt.setAttribute("aria-label", "Saved game available");
      prompt.innerHTML =
        '<div><strong>Pick up where you left off?</strong>' +
        '<span>Your saved game is kept on this device.</span></div>' +
        '<div class="sp-resume-actions">' +
        '<button class="btn-game btn-game--primary" type="button" data-resume>Resume game</button>' +
        '<button class="btn-game" type="button" data-discard>Start fresh</button>' +
        '</div>';

      var toolbar = document.querySelector(".game-toolbar");
      var stage = document.querySelector(".game-stage");
      if (toolbar && toolbar.parentNode) toolbar.parentNode.insertBefore(prompt, toolbar.nextSibling);
      else if (stage) stage.insertBefore(prompt, stage.firstChild);
      else document.body.insertBefore(prompt, document.body.firstChild);

      prompt.querySelector("[data-resume]").addEventListener("click", function () {
        try {
          if (options.restore(saved.payload) === false) throw new Error("Invalid saved game");
          removePrompt();
          announce("Saved game restored.");
          if (options.onRestore) options.onRestore(saved.payload);
        } catch (error) {
          clear(currentVariant);
          removePrompt();
          announce("That saved game could not be restored. A fresh game is ready.");
        }
      });

      prompt.querySelector("[data-discard]").addEventListener("click", function () {
        clear(currentVariant);
        removePrompt();
        announce("Saved game discarded. A fresh game is ready.");
        if (options.onDiscard) options.onDiscard();
      });
    }

    function variantChanged() {
      var next = variant();
      if (next === currentVariant) return;
      removePrompt();
      currentVariant = next;
      offerResume();
    }

    function flushOnHide() {
      if (document.visibilityState === "hidden") saveNow();
    }

    document.addEventListener("visibilitychange", flushOnHide);
    window.addEventListener("pagehide", saveNow);
    window.setTimeout(offerResume, 0);

    return {
      changed: changed,
      save: saveNow,
      clear: clear,
      variantChanged: variantChanged,
      hasSave: function (forVariant) { return !!read(forVariant || variant()); },
      discard: clear,
      destroy: function () {
        destroyed = true;
        window.clearTimeout(timer);
        removePrompt();
        document.removeEventListener("visibilitychange", flushOnHide);
        window.removeEventListener("pagehide", saveNow);
      },
    };
  }

  window.SnackPackResume = { attach: attach };
})();
