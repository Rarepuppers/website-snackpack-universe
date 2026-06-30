/*
 * Shared World Cup live-overlay helper (client-side, no server, no API key).
 *
 * ESPN's public soccer scoreboard is CORS-enabled (Access-Control-Allow-Origin: *),
 * so the browser can read it directly. This module fetches it and overlays LIVE
 * scores (and freshly-final results) onto the static data file committed by the
 * GitHub Action, giving ~60s-fresh live scores with zero infrastructure.
 *
 * It never interferes with the GitHub Action: the committed JSON stays the source
 * of truth for the schedule and final results. A FINAL score already in the base
 * data is treated as immutable here. The overlay only ADDS live scores (into the
 * separate lhs/las fields the standings ignore) and fills an early final that the
 * Action hasn't committed yet. If ESPN is slow or unreachable, overlay() resolves
 * to the base data unchanged — the page still works.
 */
(function (global) {
  "use strict";

  var ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

  // ESPN display name -> our canonical name. Only the ones that differ.
  var NAME_MAP = {
    "Bosnia-Herzegovina": "Bosnia and Herzegovina",
    "Congo DR": "DR Congo",
    "Curaçao": "Curacao",
    "Ivory Coast": "Cote d'Ivoire",
    "Türkiye": "Turkiye"
  };

  function norm(name) { return NAME_MAP[name] || name; }
  function pairKey(a, b) { return [a, b].sort().join("::"); }
  function pad(n) { return String(n).padStart(2, "0"); }

  var LIVE_STATUSES = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "IN PROGRESS"];
  function isLiveStatus(status) {
    return LIVE_STATUSES.indexOf(String(status || "").toUpperCase()) !== -1;
  }

  function todayIso() {
    var n = new Date();
    return n.getFullYear() + "-" + pad(n.getMonth() + 1) + "-" + pad(n.getDate());
  }

  // Only bother calling ESPN when something is actually happening: a match is
  // live, or one is scheduled today and not yet final.
  function worthLive(matches) {
    if (!Array.isArray(matches)) return false;
    var today = todayIso();
    return matches.some(function (m) {
      if (isLiveStatus(m.statusShort || m.time)) return true;
      return String(m.isoDate || "") === today && typeof m.hs !== "number";
    });
  }

  // A small UTC window around now (yesterday..tomorrow) reliably includes any
  // currently-live match regardless of where the UTC date boundary falls.
  function liveDateRange() {
    var now = Date.now();
    var d = function (offsetDays) {
      var x = new Date(now + offsetDays * 86400000);
      return "" + x.getUTCFullYear() + pad(x.getUTCMonth() + 1) + pad(x.getUTCDate());
    };
    return d(-1) + "-" + d(1);
  }

  function fetchEspn() {
    function kicks(c) {
      return c.shootoutKicks || c.penaltyKicks || c.penaltyShootout || null;
    }
    return fetch(ESPN + "?dates=" + liveDateRange(), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("ESPN " + r.status);
        return r.json();
      })
      .then(function (data) {
        var map = {};
        (data.events || []).forEach(function (ev) {
          var comp = ev.competitions && ev.competitions[0];
          if (!comp) return;
          var cs = comp.competitors || [];
          var home = cs.filter(function (c) { return c.homeAway === "home"; })[0];
          var away = cs.filter(function (c) { return c.homeAway === "away"; })[0];
          if (!home || !away) return;
          var hn = norm((home.team && home.team.displayName) || "");
          var an = norm((away.team && away.team.displayName) || "");
          var t = (comp.status && comp.status.type) || {};
          map[pairKey(hn, an)] = {
            home: hn,
            away: an,
            state: t.state,
            completed: t.completed === true,
            hs: Number(home.score),
            as: Number(away.score),
            hps: isFinite(Number(home.shootoutScore)) ? Number(home.shootoutScore) : null,
            aps: isFinite(Number(away.shootoutScore)) ? Number(away.shootoutScore) : null,
            hpk: kicks(home),
            apk: kicks(away)
          };
        });
        return map;
      });
  }

  // Returns a Promise of a NEW matches array with ESPN live/final data overlaid.
  // Never rejects.
  function overlay(matches) {
    if (!Array.isArray(matches) || !matches.length) return Promise.resolve(matches);
    return fetchEspn().then(function (map) {
      return matches.map(function (m) {
        var r = map[pairKey(m.home, m.away)];
        if (!r) return m;
        var next = {};
        for (var k in m) { if (Object.prototype.hasOwnProperty.call(m, k)) next[k] = m[k]; }
        var aligned = r.home === m.home;
        if (r.completed && isFinite(r.hs) && isFinite(r.as)) {
          // ESPN says final. A final already committed to the base file wins;
          // otherwise fill it in early so the result shows before the Action commits.
          if (typeof next.hs !== "number") {
            next.hs = aligned ? r.hs : r.as;
            next.as = aligned ? r.as : r.hs;
            next.time = "FT";
            next.statusShort = "FT";
            if (r.hps != null && r.aps != null) {
              next.hps = aligned ? r.hps : r.aps;
              next.aps = aligned ? r.aps : r.hps;
              if (r.hpk || r.apk) {
                next.hpk = aligned ? r.hpk : r.apk;
                next.apk = aligned ? r.apk : r.hpk;
              }
              next.statusShort = "FT-Pens";
            }
            delete next.lhs;
            delete next.las;
          }
        } else if (r.state === "in") {
          next.time = "Live";
          next.statusShort = "LIVE";
          if (isFinite(r.hs) && isFinite(r.as)) {
            next.lhs = aligned ? r.hs : r.as;
            next.las = aligned ? r.as : r.hs;
          }
        }
        return next;
      });
    }).catch(function () {
      return matches;
    });
  }

  global.WCLive = { overlay: overlay, worthLive: worthLive, isLiveStatus: isLiveStatus };
})(window);
