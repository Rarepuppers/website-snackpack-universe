/* daily-state.js — shared record of "which daily puzzles are done today", plus
 * the streak. Read by /daily/, written by share-result.js.
 *
 * Why it hooks into share-result rather than each game's win logic: every game
 * already calls SnackPackShare.result() on a win, so one hook records all of
 * them. Editing 32 win handlers to do the same thing would be 32 chances to get
 * it wrong.
 *
 * What counts: the page must have been opened with ?daily= — that is the only
 * honest signal that the player was on the shared board. A win in free play is
 * a win, but it is not today's puzzle, and counting it would make the streak a
 * lie. Note a deal/puzzle NUMBER is not a reliable signal here: FreeCell shows
 * "Deal 774" in free play too.
 *
 * Storage (localStorage, per-origin so /play/ and /daily/ share it):
 *   sp_daily_done   {"date":"2026-08-14","games":{"sudoku":"Easy in 4:31"}}
 *   sp_daily_streak {"last":"2026-08-14","count":5,"best":9}
 *
 * Only today's completions are kept. A full history would grow without bound
 * for a feature that only ever displays today.
 */
(function () {
  "use strict";

  var DONE = "sp_daily_done";
  var STREAK = "sp_daily_streak";

  // UTC day, matching how the games derive their seed from ?daily=YYYY-MM-DD.
  // Using local time here would let a player near midnight see a mismatch
  // between the board they were served and the day it was filed under.
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function dayNumber(iso) {
    return Math.floor(Date.parse(iso + "T00:00:00Z") / 86400000);
  }

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* private mode / quota — the feature degrades to "nothing recorded" */
    }
  }

  // Slug from the URL, not the display name: "Mahjong Solitaire" varies with
  // copy edits, /play/mahjong/ does not.
  function slugFromPath() {
    var m = location.pathname.match(/\/play\/([a-z0-9-]+)\//);
    return m ? m[1] : null;
  }

  function state() {
    var d = read(DONE, null);
    var s = read(STREAK, { last: null, count: 0, best: 0 });
    var t = today();
    var games = d && d.date === t ? d.games || {} : {};
    // A streak survives "yesterday" but not a missed day. Report it as 0 once
    // broken rather than showing a stale number the player has already lost.
    var live = s.last === t || (s.last && dayNumber(t) - dayNumber(s.last) === 1);
    return {
      date: t,
      games: games,
      count: Object.keys(games).length,
      streak: live ? s.count : 0,
      best: s.best || 0,
      playedToday: s.last === t
    };
  }

  function record(slug, headline) {
    if (!slug) return;
    var t = today();
    var d = read(DONE, null);
    if (!d || d.date !== t) d = { date: t, games: {} };
    if (d.games[slug]) return; // first completion of the day stands
    d.games[slug] = headline || "";
    write(DONE, d);

    var s = read(STREAK, { last: null, count: 0, best: 0 });
    if (s.last !== t) {
      var consecutive = s.last && dayNumber(t) - dayNumber(s.last) === 1;
      s.count = consecutive ? (s.count || 0) + 1 : 1;
      s.last = t;
      if (s.count > (s.best || 0)) s.best = s.count;
      write(STREAK, s);
    }
  }

  // Called by share-result.js on every win. Returns true if it counted.
  function recordIfDaily(headline) {
    if (!new URLSearchParams(location.search).has("daily")) return false;
    var slug = slugFromPath();
    if (!slug) return false;
    record(slug, headline);
    return true;
  }

  window.SnackPackDaily = {
    state: state,
    record: record,
    recordIfDaily: recordIfDaily,
    today: today
  };
})();
