/* read/reader.js — reading aids for every /read/ book.
 *
 * 1. "Read to me": speaks a page with the browser's own speech engine and
 *    highlights each word as it is spoken. No audio files, works offline once
 *    the page is cached. Shown only where speech synthesis exists; the voice is
 *    the device's, so quality varies, and it is always optional.
 * 2. "One page at a time": a full-screen picture-book mode for reading with a
 *    child. One page fills the screen, turned with the buttons, arrow keys or
 *    a swipe. Esc or "Close" returns to the normal scrolling page.
 *
 * Progressive enhancement: the book reads perfectly without this file. Every
 * control is created here, so nothing is left dangling when JS is off.
 * Wired in by scripts/build-read-shelf.mjs.
 */
(function () {
  "use strict";

  var cards = Array.prototype.slice.call(document.querySelectorAll(".story-page-card"));
  if (!cards.length) return;

  // ── Read to me ───────────────────────────────────────────────────────────
  var synth = window.speechSynthesis;
  var canSpeak = !!(synth && window.SpeechSynthesisUtterance);
  var speaking = null; // { card, button }

  // Speed (READ-PLAN C4): "Slow" for a child following each word, "Normal"
  // for an adult reading along. Remembered on this device only; if storage is
  // blocked (private window, previews) it simply starts at Slow each visit.
  var RATES = { slow: 0.82, normal: 1 };
  var SPEED_KEY = "snackpack-read-speed";
  var speed = "slow";
  try { if (localStorage.getItem(SPEED_KEY) === "normal") speed = "normal"; } catch (e) {}
  var speedButtons = [];

  function syncSpeed() {
    speedButtons.forEach(function (b) {
      b.textContent = speed === "slow" ? "Speed: slow" : "Speed: normal";
      b.setAttribute("aria-label", "Reading speed: " + speed + ". Change to " + (speed === "slow" ? "normal" : "slow") + ".");
    });
  }

  function toggleSpeed() {
    speed = speed === "slow" ? "normal" : "slow";
    try { localStorage.setItem(SPEED_KEY, speed); } catch (e) {}
    syncSpeed();
    // A voice can't change speed mid-sentence, so restart the page being read.
    if (speaking) { var s = speaking; stop(); speak(s.card, s.button); }
  }

  function pickVoice() {
    var voices = synth.getVoices() || [];
    function find(test) { for (var i = 0; i < voices.length; i++) if (test(voices[i])) return voices[i]; return null; }
    return find(function (v) { return /^en[-_]GB/i.test(v.lang) && v.localService; }) ||
      find(function (v) { return /^en[-_]GB/i.test(v.lang); }) ||
      find(function (v) { return /^en\b/i.test(v.lang) && v.localService; }) ||
      find(function (v) { return /^en\b/i.test(v.lang); });
  }

  // Wrap every word of the page text in a span (keeping <mark> highlights), so
  // the word being spoken can be lit up. Returns the plain text and the spans
  // with their character offsets in that text.
  function prepare(copy) {
    if (copy._words) return copy._words;
    var text = "";
    var words = [];
    // Story text, plus a number story's question so a child hears it too.
    var paras = copy.querySelectorAll(":scope > p, :scope > .math-question > .math-q");
    Array.prototype.forEach.call(paras, function (p, pi) {
      if (pi) text += " ";
      var walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        var parts = node.nodeValue.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); text += part; return; }
          var span = document.createElement("span");
          span.className = "read-word";
          span.textContent = part;
          frag.appendChild(span);
          words.push({ start: text.length, end: text.length + part.length, el: span });
          text += part;
        });
        node.parentNode.replaceChild(frag, node);
      });
    });
    copy._words = { text: text, words: words };
    return copy._words;
  }

  function clearSpoken(card) {
    Array.prototype.forEach.call(card.querySelectorAll(".read-word.is-spoken"), function (el) { el.classList.remove("is-spoken"); });
  }

  function stop() {
    if (!speaking) return;
    var s = speaking;
    speaking = null;
    synth.cancel();
    clearSpoken(s.card);
    s.button.textContent = "Read to me";
    s.button.setAttribute("aria-pressed", "false");
  }

  function speak(card, button) {
    var same = speaking && speaking.card === card;
    stop();
    if (same) return;
    var copy = card.querySelector(".story-page-copy");
    var data = prepare(copy);
    var u = new SpeechSynthesisUtterance(data.text);
    var voice = pickVoice();
    if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = "en-GB"; }
    u.rate = RATES[speed];
    u.onboundary = function (e) {
      if (!speaking || speaking.card !== card || e.name === "sentence") return;
      clearSpoken(card);
      for (var i = 0; i < data.words.length; i++) {
        var w = data.words[i];
        if (e.charIndex >= w.start && e.charIndex < w.end) { w.el.classList.add("is-spoken"); break; }
      }
    };
    u.onend = u.onerror = function () { if (speaking && speaking.card === card) stop(); };
    speaking = { card: card, button: button };
    button.textContent = "Stop reading";
    button.setAttribute("aria-pressed", "true");
    synth.speak(u);
  }

  if (canSpeak) {
    synth.getVoices(); // Chrome loads voices lazily; ask early.
    cards.forEach(function (card) {
      var copy = card.querySelector(".story-page-copy");
      if (!copy || !copy.querySelector(":scope > p")) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "read-aloud-btn";
      btn.textContent = "Read to me";
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", function () { speak(card, btn); });
      var spd = document.createElement("button");
      spd.type = "button";
      spd.className = "read-speed-btn";
      spd.addEventListener("click", toggleSpeed);
      speedButtons.push(spd);
      var row = document.createElement("div");
      row.className = "read-aloud-row";
      row.appendChild(btn);
      row.appendChild(spd);
      // Straight after the story text: before a number story's question box
      // or a "Talk together" note, whichever comes first.
      var after = copy.querySelector(":scope > .math-question, :scope > aside");
      copy.insertBefore(row, after || null);
    });
    syncSpeed();
    window.addEventListener("pagehide", stop);
  }

  // ── Number stories: tap an answer ────────────────────────────────────────
  // The page ships the choices as a plain list with "Show the answer" below,
  // which works without JS and on paper. Here each choice becomes a button: a
  // right answer opens the explanation, a wrong one invites another try and is
  // never marked in red, because the reader is six.
  Array.prototype.forEach.call(document.querySelectorAll(".math-choices[data-answer]"), function (list) {
    var answer = list.getAttribute("data-answer");
    var box = list.closest(".math-question");
    var details = box && box.querySelector(".math-answer");
    var note = document.createElement("p");
    note.className = "math-feedback";
    note.setAttribute("aria-live", "polite");
    list.parentNode.insertBefore(note, list.nextSibling);
    Array.prototype.forEach.call(list.querySelectorAll("li"), function (li) {
      var value = li.textContent.trim();
      var b = document.createElement("button");
      b.type = "button";
      b.className = "math-choice";
      b.textContent = value;
      li.textContent = "";
      li.appendChild(b);
      b.addEventListener("click", function () {
        var right = value.replace("−", "-") === answer.replace("−", "-");
        if (right) {
          Array.prototype.forEach.call(list.querySelectorAll(".math-choice"), function (x) { x.disabled = true; });
          b.classList.add("is-right");
          note.textContent = "Yes! " + value + " is right.";
          if (details) details.open = true;
        } else {
          b.classList.add("is-tried");
          b.disabled = true;
          note.textContent = "Not quite. Have another go.";
        }
      });
    });
  });

  // ── One page at a time ───────────────────────────────────────────────────
  var current = 0;
  var bar = null;
  var label = null;
  var prevBtn = null;
  var nextBtn = null;
  var lastFocus = null;

  function show(i) {
    stop();
    current = Math.max(0, Math.min(cards.length - 1, i));
    cards.forEach(function (c, ci) { c.classList.toggle("is-current", ci === current); });
    label.textContent = "Page " + (current + 1) + " of " + cards.length;
    prevBtn.disabled = current === 0;
    nextBtn.textContent = current === cards.length - 1 ? "The end" : "Next";
    window.scrollTo(0, 0);
    if (history.replaceState) history.replaceState(null, "", "#" + cards[current].id);
  }

  function buildBar() {
    bar = document.createElement("nav");
    bar.className = "reader-bar";
    bar.setAttribute("aria-label", "Page turner");
    prevBtn = document.createElement("button");
    prevBtn.type = "button"; prevBtn.className = "btn btn-secondary"; prevBtn.textContent = "Back";
    nextBtn = document.createElement("button");
    nextBtn.type = "button"; nextBtn.className = "btn btn-primary"; nextBtn.textContent = "Next";
    label = document.createElement("span");
    label.className = "reader-bar-label"; label.setAttribute("aria-live", "polite");
    var close = document.createElement("button");
    close.type = "button"; close.className = "reader-bar-close"; close.textContent = "Close";
    close.setAttribute("aria-label", "Close one-page mode");
    prevBtn.addEventListener("click", function () { show(current - 1); });
    nextBtn.addEventListener("click", function () {
      if (current === cards.length - 1) { exit(true); return; }
      show(current + 1);
    });
    close.addEventListener("click", function () { exit(false); });
    bar.appendChild(prevBtn); bar.appendChild(label); bar.appendChild(nextBtn); bar.appendChild(close);
    document.body.appendChild(bar);
  }

  function onKey(e) {
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); nextBtn.click(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); if (current > 0) show(current - 1); }
    else if (e.key === "Escape") { exit(false); }
  }

  var touchX = null, touchY = null;
  function onTouchStart(e) { var t = e.changedTouches[0]; touchX = t.clientX; touchY = t.clientY; }
  function onTouchEnd(e) {
    if (touchX === null) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchX, dy = t.clientY - touchY;
    touchX = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return; // a scroll, not a swipe
    if (dx < 0) nextBtn.click(); else if (current > 0) show(current - 1);
  }

  function enter() {
    lastFocus = document.activeElement;
    if (!bar) buildBar();
    var fromHash = cards.findIndex ? cards.findIndex(function (c) { return "#" + c.id === location.hash; }) : -1;
    document.body.classList.add("reader-mode");
    bar.hidden = false;
    show(fromHash > -1 ? fromHash : 0);
    document.addEventListener("keydown", onKey);
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    nextBtn.focus();
    var root = document.documentElement;
    if (root.requestFullscreen && window.matchMedia("(pointer: coarse)").matches) {
      root.requestFullscreen().catch(function () {});
    }
  }

  function exit(toEnd) {
    stop();
    document.body.classList.remove("reader-mode");
    cards.forEach(function (c) { c.classList.remove("is-current"); });
    if (bar) bar.hidden = true;
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("touchstart", onTouchStart);
    document.removeEventListener("touchend", onTouchEnd);
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    var target = toEnd ? document.querySelector(".story-finish-card") : cards[current];
    if (target) target.scrollIntoView({ block: "start" });
    if (!toEnd && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("fullscreenchange", function () {
    // Leaving full screen with the system gesture also leaves one-page mode.
    if (!document.fullscreenElement && document.body.classList.contains("reader-mode") &&
        window.matchMedia("(pointer: coarse)").matches) exit(false);
  });

  var begin = document.querySelector('.story-title-section a[href="#page-1"]');
  if (begin) {
    var modeBtn = document.createElement("button");
    modeBtn.type = "button";
    modeBtn.className = "btn btn-secondary read-mode-btn";
    modeBtn.textContent = "One page at a time";
    modeBtn.addEventListener("click", enter);
    begin.parentNode.insertBefore(modeBtn, begin.nextSibling);
  }
})();
