(function () {
  "use strict";

  function cleanPart(value) {
    return String(value == null ? "" : value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "default";
  }

  function key(game, field, variant) {
    var parts = ["sp", cleanPart(game), cleanPart(field)];
    if (variant != null && variant !== "") parts.push(cleanPart(variant));
    return parts.join("_");
  }

  function readRaw(storageKey) {
    try { return window.localStorage.getItem(storageKey); }
    catch (error) { return null; }
  }

  function writeRaw(storageKey, value) {
    try {
      window.localStorage.setItem(storageKey, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function remove(storageKey) {
    try {
      window.localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function getJSON(storageKey, fallback) {
    var raw = readRaw(storageKey);
    if (raw == null) return fallback;
    try { return JSON.parse(raw); }
    catch (error) { return fallback; }
  }

  function setJSON(storageKey, value) {
    var encoded;
    try { encoded = JSON.stringify(value); }
    catch (error) { return false; }
    return writeRaw(storageKey, encoded);
  }

  function readMigrated(options) {
    var canonical = options.key;
    var found = readRaw(canonical);
    if (found != null) return found;
    var legacy = options.legacy || [];
    for (var i = 0; i < legacy.length; i++) {
      found = readRaw(legacy[i]);
      if (found != null) {
        writeRaw(canonical, found);
        return found;
      }
    }
    return options.fallback == null ? null : options.fallback;
  }

  function get(gameOrKey, field, variant) {
    return arguments.length === 1 ? readRaw(gameOrKey) : readRaw(key(gameOrKey, field, variant));
  }

  function set(gameOrKey, fieldOrValue, variantOrValue, value) {
    if (arguments.length === 2) return writeRaw(gameOrKey, fieldOrValue);
    if (arguments.length === 3) return writeRaw(key(gameOrKey, fieldOrValue), variantOrValue);
    return writeRaw(key(gameOrKey, fieldOrValue, variantOrValue), value);
  }

  function removeKey(gameOrKey, field, variant) {
    return arguments.length === 1 ? remove(gameOrKey) : remove(key(gameOrKey, field, variant));
  }

  window.SnackPackStore = {
    key: key,
    get: get,
    set: set,
    remove: removeKey,
    getJSON: getJSON,
    setJSON: setJSON,
    readMigrated: readMigrated,
  };
})();
