// Shared World Cup 2026 knockout-bracket resolver.
//
// One source of truth used by BOTH:
//   - the browser (bracket + schedule pages) as a global, window.WC_KNOCKOUT
//   - the GitHub Action updater (scripts/update-world-cup-data.mjs) via require()
//
// It turns the fixed bracket structure + the live group results (and, once the
// knockout starts, the knockout results) into a fully resolved list of the 32
// knockout matches: real team names where known, seed labels otherwise, plus
// scores and the winner of each tie so later rounds fill in on their own.
(function (root) {
  "use strict";

  // Official Round-of-32 -> Final pairings (FIFA 2026 match numbers).
  // Slot labels: "W X"/"RU X" = group X winner/runner-up; "3rd ..." = a best
  // third-placed team (filled via the allocation table); "W n"/"L n" = the
  // winner/loser of match n.
  var STRUCTURE = [
    { round: "Round of 32", ties: [
      { n: 73, a: "RU A", b: "RU B" },
      { n: 74, a: "W E", b: "3rd A/B/C/D/F" },
      { n: 75, a: "W F", b: "RU C" },
      { n: 76, a: "W C", b: "RU F" },
      { n: 77, a: "W I", b: "3rd C/D/F/G/H" },
      { n: 78, a: "RU E", b: "RU I" },
      { n: 79, a: "W A", b: "3rd C/E/F/H/I" },
      { n: 80, a: "W L", b: "3rd E/H/I/J/K" },
      { n: 81, a: "W D", b: "3rd B/E/F/I/J" },
      { n: 82, a: "W G", b: "3rd A/E/H/I/J" },
      { n: 83, a: "RU K", b: "RU L" },
      { n: 84, a: "W H", b: "RU J" },
      { n: 85, a: "W B", b: "3rd E/F/G/I/J" },
      { n: 86, a: "W J", b: "RU H" },
      { n: 87, a: "W K", b: "3rd D/E/I/J/L" },
      { n: 88, a: "RU D", b: "RU G" }
    ] },
    { round: "Round of 16", ties: [
      { n: 89, a: "W 74", b: "W 77" },
      { n: 90, a: "W 73", b: "W 75" },
      { n: 91, a: "W 76", b: "W 78" },
      { n: 92, a: "W 79", b: "W 80" },
      { n: 93, a: "W 83", b: "W 84" },
      { n: 94, a: "W 81", b: "W 82" },
      { n: 95, a: "W 86", b: "W 88" },
      { n: 96, a: "W 85", b: "W 87" }
    ] },
    { round: "Quarter-finals", ties: [
      { n: 97, a: "W 89", b: "W 90" },
      { n: 98, a: "W 93", b: "W 94" },
      { n: 99, a: "W 91", b: "W 92" },
      { n: 100, a: "W 95", b: "W 96" }
    ] },
    { round: "Semi-finals", ties: [
      { n: 101, a: "W 97", b: "W 98" },
      { n: 102, a: "W 99", b: "W 100" }
    ] },
    { round: "Third place", ties: [
      { n: 103, a: "L 101", b: "L 102" }
    ] },
    { round: "Final", ties: [
      { n: 104, a: "W 101", b: "W 102" }
    ] }
  ];

  // Fixed date + host city per knockout match (parsed from the official schedule).
  var SCHEDULE = {"73":{"isoDate":"2026-06-28","date":"Jun 28","venue":"Inglewood"},"74":{"isoDate":"2026-06-29","date":"Jun 29","venue":"Foxborough"},"75":{"isoDate":"2026-06-29","date":"Jun 29","venue":"Guadalupe"},"76":{"isoDate":"2026-06-29","date":"Jun 29","venue":"Houston"},"77":{"isoDate":"2026-06-30","date":"Jun 30","venue":"New York/New Jersey"},"78":{"isoDate":"2026-06-30","date":"Jun 30","venue":"Arlington"},"79":{"isoDate":"2026-06-30","date":"Jun 30","venue":"Mexico City"},"80":{"isoDate":"2026-07-01","date":"Jul 1","venue":"Atlanta"},"81":{"isoDate":"2026-07-01","date":"Jul 1","venue":"Santa Clara"},"82":{"isoDate":"2026-07-01","date":"Jul 1","venue":"Seattle"},"83":{"isoDate":"2026-07-02","date":"Jul 2","venue":"Toronto"},"84":{"isoDate":"2026-07-02","date":"Jul 2","venue":"Inglewood"},"85":{"isoDate":"2026-07-02","date":"Jul 2","venue":"Vancouver"},"86":{"isoDate":"2026-07-03","date":"Jul 3","venue":"Miami Gardens"},"87":{"isoDate":"2026-07-03","date":"Jul 3","venue":"Kansas City"},"88":{"isoDate":"2026-07-03","date":"Jul 3","venue":"Arlington"},"89":{"isoDate":"2026-07-04","date":"Jul 4","venue":"Philadelphia"},"90":{"isoDate":"2026-07-04","date":"Jul 4","venue":"Houston"},"91":{"isoDate":"2026-07-05","date":"Jul 5","venue":"New York/New Jersey"},"92":{"isoDate":"2026-07-05","date":"Jul 5","venue":"Mexico City"},"93":{"isoDate":"2026-07-06","date":"Jul 6","venue":"Arlington"},"94":{"isoDate":"2026-07-06","date":"Jul 6","venue":"Seattle"},"95":{"isoDate":"2026-07-07","date":"Jul 7","venue":"Atlanta"},"96":{"isoDate":"2026-07-07","date":"Jul 7","venue":"Vancouver"},"97":{"isoDate":"2026-07-09","date":"Jul 9","venue":"Foxborough"},"98":{"isoDate":"2026-07-10","date":"Jul 10","venue":"Inglewood"},"99":{"isoDate":"2026-07-11","date":"Jul 11","venue":"Miami Gardens"},"100":{"isoDate":"2026-07-11","date":"Jul 11","venue":"Kansas City"},"101":{"isoDate":"2026-07-14","date":"Jul 14","venue":"Arlington"},"102":{"isoDate":"2026-07-15","date":"Jul 15","venue":"Atlanta"},"103":{"isoDate":"2026-07-18","date":"Jul 18","venue":"Miami Gardens"},"104":{"isoDate":"2026-07-19","date":"Jul 19","venue":"New York/New Jersey"}};

  function blankStats(team) {
    return { team: team, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
  }

  // Group standings from played group matches (same rules/tie-breaks as the pages).
  function standingsFor(groups, groupMatches, groupId) {
    var table = {};
    (groups[groupId] || []).forEach(function (t) { table[t] = blankStats(t); });
    groupMatches.filter(function (m) { return m.group === groupId && typeof m.hs === "number"; }).forEach(function (m) {
      var h = table[m.home], a = table[m.away];
      if (!h || !a) return;
      h.p++; a.p++;
      h.gf += m.hs; h.ga += m.as;
      a.gf += m.as; a.ga += m.hs;
      if (m.hs > m.as) { h.w++; a.l++; h.pts += 3; }
      else if (m.hs < m.as) { a.w++; h.l++; a.pts += 3; }
      else { h.d++; a.d++; h.pts++; a.pts++; }
    });
    return Object.keys(table).map(function (t) {
      table[t].gd = table[t].gf - table[t].ga;
      return table[t];
    }).sort(function (a, b) {
      return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team);
    });
  }

  function groupComplete(groups, groupMatches, groupId) {
    return (groups[groupId] || []).every(function (team) {
      return groupMatches.filter(function (m) {
        return m.group === groupId && (m.home === team || m.away === team) && typeof m.hs === "number";
      }).length >= 3;
    });
  }

  // Resolve the whole knockout bracket.
  //
  //   input.groups        { A:[teams], ... }
  //   input.groupMatches  the group-stage match list (with hs/as on finals)
  //   input.allocation    the WC_THIRD_ALLOCATION object (table + columnMatches)
  //   input.lookup(n, home, away) -> result | null   (optional)
  //       returns { hs, as, lhs, las, statusShort, winner } for a tie once its
  //       two teams are known. winner is a team name (handles penalty shootouts).
  //
  // Returns an array of match objects (one per knockout tie, ascending) with:
  //   n, round, isoDate, date, venue, homeLabel, awayLabel, home, away,
  //   hs?, as?, lhs?, las?, time, statusShort, winner
  function resolve(input) {
    var groups = input.groups || {};
    var groupMatches = input.groupMatches || [];
    var allocation = input.allocation || (root.WC_THIRD_ALLOCATION || null);
    var lookup = typeof input.lookup === "function" ? input.lookup : function () { return null; };

    var winners = {}, runners = {};
    var groupIds = Object.keys(groups);
    groupIds.forEach(function (g) {
      if (groupComplete(groups, groupMatches, g)) {
        var rows = standingsFor(groups, groupMatches, g);
        winners[g] = rows[0].team;
        runners[g] = rows[1].team;
      }
    });

    // Third-place teams drop into their Round-of-32 matches only once every
    // group is done (the eight best thirds aren't known until then).
    var thirdByMatch = {};
    var allComplete = groupIds.length > 0 && groupIds.every(function (g) { return groupComplete(groups, groupMatches, g); });
    if (allComplete && allocation && allocation.table) {
      var thirds = groupIds.map(function (g) {
        var r = standingsFor(groups, groupMatches, g)[2];
        return { g: g, pts: r.pts, gd: r.gd, gf: r.gf, team: r.team };
      });
      thirds.sort(function (a, b) {
        return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team);
      });
      var key = thirds.slice(0, 8).map(function (t) { return t.g; }).sort().join("");
      var alloc = allocation.table[key];
      if (alloc) {
        var thirdOf = {};
        thirds.forEach(function (t) { thirdOf[t.g] = t.team; });
        for (var i = 0; i < alloc.length; i++) {
          thirdByMatch[allocation.columnMatches[i]] = thirdOf[alloc[i]];
        }
      }
    }

    var winnerOf = {}; // match number -> winning team
    var loserOf = {};  // match number -> losing team

    function resolveSlot(label, n) {
      var m;
      if ((m = /^RU ([A-L])$/.exec(label))) return runners[m[1]] || null;
      if ((m = /^W ([A-L])$/.exec(label))) return winners[m[1]] || null;
      if (/^3rd/.test(label)) return thirdByMatch[n] || null;
      if ((m = /^W (\d+)$/.exec(label))) return winnerOf[m[1]] || null;
      if ((m = /^L (\d+)$/.exec(label))) return loserOf[m[1]] || null;
      return null;
    }

    var out = [];
    STRUCTURE.forEach(function (round) {
      round.ties.forEach(function (tie) {
        var sched = SCHEDULE[tie.n] || {};
        var home = resolveSlot(tie.a, tie.n);
        var away = resolveSlot(tie.b, tie.n);
        var match = {
          n: tie.n,
          round: round.round,
          isoDate: sched.isoDate || "",
          date: sched.date || "",
          venue: sched.venue || "",
          homeLabel: tie.a,
          awayLabel: tie.b,
          home: home,
          away: away,
          time: "Upcoming",
          statusShort: "",
          winner: null
        };
        var res = home && away ? lookup(tie.n, home, away) : null;
        if (res) {
          if (typeof res.hs === "number") { match.hs = res.hs; match.as = res.as; match.time = "FT"; match.statusShort = res.statusShort || "FT"; }
          if (typeof res.lhs === "number") { match.lhs = res.lhs; match.las = res.las; }
          if (res.statusShort) match.statusShort = res.statusShort;
          if (res.time) match.time = res.time;
          if (res.winner) {
            match.winner = res.winner;
            winnerOf[tie.n] = res.winner;
            loserOf[tie.n] = res.winner === home ? away : home;
          }
        }
        out.push(match);
      });
    });
    return out;
  }

  root.WC_KNOCKOUT = {
    STRUCTURE: STRUCTURE,
    SCHEDULE: SCHEDULE,
    standingsFor: standingsFor,
    groupComplete: groupComplete,
    resolve: resolve
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.WC_KNOCKOUT;
})(typeof window !== "undefined" ? window : this);
