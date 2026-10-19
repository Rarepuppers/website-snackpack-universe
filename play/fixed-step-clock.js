/* Original SnackPack fixed-step scheduling. Pure, no timers or platform globals. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.SnackPackClock = factory()
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict'
  function createFixedStepClock(stepMs = 1000 / 60, maxSteps = 8) {
    if (!Number.isFinite(stepMs) || stepMs <= 0 || !Number.isInteger(maxSteps) || maxSteps < 1) throw new Error('Invalid clock budget')
    let last = null, accumulated = 0
    function reset() { last = null; accumulated = 0 }
    function advance(now, step) {
      if (!Number.isFinite(now) || (last !== null && now < last)) { reset(); return 0 }
      if (last === null) { last = now; return 0 }
      accumulated = Math.min(accumulated + now - last, stepMs * maxSteps)
      last = now
      let count = 0
      while (accumulated + 1e-7 >= stepMs && count < maxSteps) {
        accumulated = Math.max(0, accumulated - stepMs)
        count++
        if (step() === false) { reset(); break }
      }
      return count
    }
    return { advance, reset }
  }
  return { createFixedStepClock }
})
