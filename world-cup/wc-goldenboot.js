/*
 * Golden Boot leaderboard (client-side, no server, no API key).
 *
 * Uses ESPN's official tournament statistics endpoint (same free, CORS-open
 * host as wc-live.js), which returns FIFA's own computed goals/assists
 * leaderboard directly — this matches what's reported in the press. An
 * earlier version of this file reconstructed the tally from the scoreboard
 * endpoint's per-match `details` array, but that array is abbreviated (it
 * dropped roughly half the goals in some matches), so it silently undercounted
 * scorers and even omitted some entirely. The statistics endpoint doesn't
 * have that problem — it's ESPN's own leaderboard, not a reconstruction.
 *
 * Player headshots: ESPN hosts some, but not most, at a predictable CDN URL
 * by athlete id. Callers should treat the headshot URL as best-effort and
 * fall back to a generated avatar on image error (see golden-boot/index.html).
 * Team crests are supplied directly by this endpoint and are reliably present.
 */
(function (global) {
  "use strict";

  var ESPN_STATS = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/statistics";
  var CACHE_KEY = "snackpack_world_cup_golden_boot_cache_v2";
  var CACHE_TTL_MS = 5 * 60 * 1000;

  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
      return parsed.payload;
    } catch (error) {
      return null;
    }
  }

  function writeCache(payload) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ cachedAt: Date.now(), payload: payload }));
    } catch (error) {}
  }

  function matchesPlayed(displayValue) {
    var match = /Matches:\s*(\d+)/.exec(displayValue || "");
    return match ? Number(match[1]) : null;
  }

  function load() {
    var cached = readCache();
    if (cached) return Promise.resolve(cached);

    return fetch(ESPN_STATS, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("ESPN " + r.status);
        return r.json();
      })
      .then(function (data) {
        var stats = data.stats || [];
        var goalsBlock = stats.filter(function (s) { return s.name === "goalsLeaders"; })[0];
        var assistsBlock = stats.filter(function (s) { return s.name === "assistsLeaders"; })[0];

        var assistsById = {};
        (assistsBlock && assistsBlock.leaders || []).forEach(function (entry) {
          if (entry.athlete && entry.athlete.id) assistsById[entry.athlete.id] = entry.value;
        });

        var leaders = (goalsBlock && goalsBlock.leaders || []).map(function (entry) {
          var athlete = entry.athlete || {};
          var team = athlete.team || {};
          var logo = (team.logos || [])[0];
          return {
            id: athlete.id,
            name: athlete.displayName || athlete.shortName || "Unknown player",
            goals: entry.value,
            matches: matchesPlayed(entry.displayValue),
            assists: athlete.id ? (assistsById[athlete.id] || 0) : 0,
            headshot: athlete.headshot ? athlete.headshot.href : "https://a.espncdn.com/i/headshots/soccer/players/full/" + encodeURIComponent(athlete.id) + ".png",
            team: team.displayName || "",
            teamAbbreviation: team.abbreviation || "",
            teamColor: team.color ? "#" + team.color : "",
            crest: logo ? logo.href : ""
          };
        });

        var payload = { leaders: leaders, fetchedAt: new Date().toISOString() };
        writeCache(payload);
        return payload;
      });
  }

  global.WCGoldenBoot = { load: load };
})(window);
