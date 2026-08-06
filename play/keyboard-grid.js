/* keyboard-grid.js — shared arrow-key navigation for the arcade's grid games.
 *
 * Most of the board games were mouse-only. The ones built from <button> cells
 * were technically reachable, but only by tabbing through every cell in turn —
 * 480 presses to cross an expert Minesweeper board — and the ones built from
 * <div> cells could not be reached at all.
 *
 * This gives a grid a single tab stop and a roving cursor: Tab lands on the
 * board, arrows move a highlight, Enter/Space plays the focused cell. It reads
 * the row width from the rendered layout rather than being told, so it works
 * for any board shape and survives a resize.
 *
 * Usage:
 *   SnackPackKeyboard.attachGrid({
 *     container: "ms-grid",              // element or id
 *     cellSelector: "button.ms-cell",    // cells, in reading order
 *     label: "Minesweeper board",        // for screen readers
 *     secondaryKeys: ["f"],              // optional, e.g. flag
 *     onSecondary: function (cell) { ... }
 *   });
 *
 * The grid keeps working after the game re-renders — a MutationObserver puts
 * the cursor back. Activation goes through the cell's own click handler, so no
 * game logic needs to change.
 */
(function () {
  "use strict";

  var CURSOR = "kbd-cursor";

  function toEl(x) {
    return typeof x === "string" ? document.getElementById(x) : x;
  }

  function attachGrid(opts) {
    var container = toEl(opts.container);
    if (!container) return null;

    var cellSelector = opts.cellSelector;
    var index = 0;
    var engaged = false; // only show the cursor once the keyboard is actually used

    function cells() {
      return Array.prototype.filter.call(
        container.querySelectorAll(cellSelector),
        function (c) {
          return !c.disabled && c.offsetParent !== null;
        }
      );
    }

    // Row width is derived from the layout: count the cells sharing the first
    // row's offsetTop. Handles any board size, and re-measures after a resize.
    //
    // This only works when every cell in a row is genuinely at the same
    // height — true for uniform button/cell grids, but NOT for a single row
    // of card piles with unequal stack depths (a Spider Solitaire deal always
    // splits 4 columns of 6 cards and 6 of 5; a Solitaire tableau's column
    // heights vary by definition). There the topmost card in a taller column
    // sits lower on screen than a shorter column's, so auto-detection
    // undercounts the row and Up/Down jumps to the wrong column instead of
    // correctly doing nothing in a layout that has no second row at all.
    //
    // opts.rowWidth lets the caller skip detection and state the true width
    // directly — a number, or a function (for a width that can change, e.g.
    // with the board's own column count).
    function rowWidth(list) {
      if (typeof opts.rowWidth === "function") return opts.rowWidth() || list.length || 1;
      if (typeof opts.rowWidth === "number") return opts.rowWidth || list.length || 1;
      if (list.length < 2) return list.length || 1;
      var top = list[0].offsetTop;
      var n = 0;
      for (var i = 0; i < list.length; i++) {
        if (list[i].offsetTop !== top) break;
        n++;
      }
      return n || list.length;
    }

    function paint() {
      var list = cells();
      if (!list.length) return;
      if (index >= list.length) index = list.length - 1;
      if (index < 0) index = 0;
      for (var i = 0; i < list.length; i++) {
        var on = i === index;
        list[i].classList.toggle(CURSOR, on && engaged);
        list[i].tabIndex = on ? 0 : -1;
      }
    }

    function focusCell() {
      var list = cells();
      if (list[index]) list[index].focus({ preventScroll: false });
    }

    function move(delta) {
      var list = cells();
      if (!list.length) return;
      var next = index + delta;
      if (next < 0 || next >= list.length) return; // don't wrap; edges should feel solid
      index = next;
      engaged = true;
      paint();
      focusCell();
    }

    container.addEventListener("keydown", function (e) {
      var list = cells();
      if (!list.length) return;
      var w = rowWidth(list);
      var handled = true;

      switch (e.key) {
        case "ArrowRight": move(1); break;
        case "ArrowLeft":  move(-1); break;
        case "ArrowDown":  move(w); break;
        case "ArrowUp":    move(-w); break;
        case "Home":
          index = e.ctrlKey ? 0 : index - (index % w);
          engaged = true; paint(); focusCell(); break;
        case "End":
          index = e.ctrlKey ? list.length - 1 : Math.min(list.length - 1, index - (index % w) + w - 1);
          engaged = true; paint(); focusCell(); break;
        case "Enter":
        case " ":
          engaged = true;
          var cell = list[index];
          if (cell) {
            // <button> cells already fire click natively on Enter/Space; only
            // synthesise for elements that don't.
            if (cell.tagName !== "BUTTON") {
              cell.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            } else {
              handled = false;
            }
          }
          break;
        default:
          if (opts.secondaryKeys && opts.secondaryKeys.indexOf(e.key.toLowerCase()) !== -1 && opts.onSecondary) {
            engaged = true;
            opts.onSecondary(list[index], index);
          } else {
            handled = false;
          }
      }
      if (handled) e.preventDefault();
    });

    // Clicking with the mouse should move the cursor too, so switching between
    // input methods mid-game doesn't jump the highlight somewhere unexpected.
    container.addEventListener("click", function (e) {
      var list = cells();
      for (var i = 0; i < list.length; i++) {
        if (list[i] === e.target || list[i].contains(e.target)) {
          index = i;
          paint();
          return;
        }
      }
    });

    container.addEventListener("focusout", function (e) {
      if (!container.contains(e.relatedTarget)) {
        engaged = false;
        paint();
      }
    });

    if (opts.label && !container.getAttribute("aria-label")) {
      container.setAttribute("aria-label", opts.label);
    }

    // Boards re-render wholesale (innerHTML = ""), which drops the cursor and
    // every tabindex. Put them back after each rebuild.
    //
    // Debounced with setTimeout, not requestAnimationFrame. rAF is throttled to
    // never fire while the page is backgrounded (document.hidden) — so if a
    // board ever re-renders while the tab isn't visible (a turn resolving, a
    // timer tick), the deferred repaint would simply never run. Worse, `pending`
    // would stay stuck true forever, since nothing ever clears it, silently and
    // permanently breaking keyboard navigation for the rest of the session even
    // after the tab regains focus. setTimeout has no such starvation: it still
    // fires (just possibly coalesced to ~1/sec) while backgrounded.
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () {
        pending = false;
        paint();
      }, 0);
    }).observe(container, { childList: true, subtree: true });

    paint();
    return {
      focus: function () { engaged = true; paint(); focusCell(); },
      setIndex: function (i) { index = i; paint(); }
    };
  }

  window.SnackPackKeyboard = { attachGrid: attachGrid };
}());
