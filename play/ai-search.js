(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SnackPackSearch = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var STOP = {};
  function limit(value, fallback) { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback; }
  function control(options, async) {
    return { deadline: Date.now() + limit(options.budgetMs, async ? 400 : 60), sliceDeadline: Infinity, nodes: 0, maxNodes: limit(options.maxNodes, 20000), cancelled: options.cancelled };
  }
  function tick(state) {
    if (++state.nodes > state.maxNodes || Date.now() >= Math.min(state.deadline, state.sliceDeadline) || (state.cancelled && state.cancelled())) throw STOP;
  }
  function cancelled(options) { return !!(options.cancelled && options.cancelled()); }
  function pick(scored, options) {
    var best = Math.max.apply(null, scored.map(function (item) { return item.value; }));
    var pool = scored.filter(function (item) { return best - item.value <= limit(options.window, 0); });
    return pool[Math.min(pool.length - 1, Math.floor((options.random || Math.random)() * pool.length))].move;
  }
  function initial(moves, fallback) {
    return moves.map(function (move) { return { move: move, value: fallback(move) }; }).sort(function (a, b) { return b.value - a.value; });
  }
  // Only a complete root iteration may replace the fallback/previous depth.
  // This prevents a time limit from favoring whichever move happened to be first.
  function choose(moves, maxDepth, fallback, score, options) {
    options = options || {};
    if (!moves.length || cancelled(options)) return null;
    var ordered = initial(moves, fallback), best = ordered[0].move, state = control(options, false);
    for (var depth = 1; depth <= maxDepth; depth++) {
      var scored = [];
      try {
        for (var i = 0; i < ordered.length; i++) { tick(state); scored.push({ move: ordered[i].move, value: score(ordered[i].move, depth - 1, state) }); }
        best = pick(scored, options);
      } catch (error) { if (error !== STOP) throw error; break; }
    }
    return cancelled(options) ? null : best;
  }
  function yieldTurn() { return new Promise(function (resolve) { setTimeout(resolve, 0); }); }
  async function chooseAsync(moves, maxDepth, fallback, score, options) {
    options = options || {};
    await yieldTurn();
    if (!moves.length || cancelled(options)) return null;
    var ordered = [];
    for (var i = 0; i < moves.length; i++) {
      if (cancelled(options)) return null;
      ordered.push({ move: moves[i], value: fallback(moves[i]) });
      await yieldTurn();
    }
    ordered.sort(function (a, b) { return b.value - a.value; });
    var best = ordered[0].move, state = control(options, true);
    for (var depth = 1; depth <= maxDepth; depth++) {
      var scored = [];
      try {
        for (var j = 0; j < ordered.length; j++) {
          state.sliceDeadline = Date.now() + limit(options.sliceMs, 12);
          tick(state);
          scored.push({ move: ordered[j].move, value: score(ordered[j].move, depth - 1, state) });
          await yieldTurn();
        }
        best = pick(scored, options);
      } catch (error) { if (error !== STOP) throw error; break; }
    }
    return cancelled(options) ? null : best;
  }
  return { choose: choose, chooseAsync: chooseAsync, tick: tick };
}));
