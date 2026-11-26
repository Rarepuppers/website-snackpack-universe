/* Local-date advent calendars and reader locks. Every story page is available without JS. */
(function () {
  "use strict";

  function schedule(element) {
    var config = JSON.parse(element.dataset.readAdvent);
    var now = new Date();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var current = month * 100 + day;
    var teaser = Number(config.teaserFrom.replace("-", ""));
    var finalDay = config.month * 100 + config.lastDay;
    var total = config.lastDay - config.firstDay + 1;
    var open = total;
    if (current >= teaser && current <= finalDay) {
      open = month === config.month ? Math.max(0, day - config.firstDay + 1) : 0;
    }
    var today = month === config.month && day >= config.firstDay && day <= config.lastDay
      ? day - config.firstDay : -1;
    var monthName = new Date(now.getFullYear(), config.month - 1, 1)
      .toLocaleDateString("en-GB", { month: "long" });
    return { open: open, today: today, firstDay: config.firstDay, monthName: monthName };
  }

  function openingLabel(dates, index) {
    var day = index + dates.firstDay;
    return "Day " + (index + 1) + " opens on " + day + " " + dates.monthName;
  }

  document.querySelectorAll("[data-advent-calendar]").forEach(function (calendar) {
    var dates = schedule(calendar);
    calendar.querySelectorAll("[data-advent-tile]").forEach(function (tile, index) {
      if (index === dates.today) {
        tile.setAttribute("aria-current", "date");
        tile.setAttribute("aria-label", "Day " + (index + 1) + ", today");
      }
      if (index >= dates.open) {
        var label = openingLabel(dates, index);
        tile.setAttribute("data-advent-locked", "");
        tile.setAttribute("aria-label", label);
        tile.title = label;
        var date = document.createElement("small");
        date.textContent = (index + dates.firstDay) + " " + dates.monthName.slice(0, 3);
        date.setAttribute("aria-hidden", "true");
        tile.appendChild(date);
      }
    });
  });

  var reader = document.querySelector(".story-pages[data-read-advent]");
  if (!reader) return;
  var dates = schedule(reader);
  var cards = Array.from(reader.querySelectorAll(".story-page-card"));
  var footer = document.querySelector(".story-finish-card");
  var hero = document.querySelector(".story-title-grid > div");
  if (!cards.length || !hero) return;
  window.SnackPackAdvent = { defaultIndex: Math.max(0, dates.open - 1) };
  if (dates.open >= cards.length) return;

  var disclosure = document.createElement("details");
  disclosure.className = "read-advent-grownups";
  var summary = document.createElement("summary");
  summary.textContent = "For grown-ups";
  var note = document.createElement("p");
  note.textContent = "Days open one at a time in December. The whole story is open from Christmas Day.";
  var toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "btn btn-secondary";
  toggle.textContent = "Read ahead (grown-ups)";
  toggle.setAttribute("aria-pressed", "false");
  disclosure.append(summary, note, toggle);
  hero.appendChild(disclosure);

  var previews = cards.map(function (card, index) {
    if (index < dates.open) return null;
    var content = Array.from(card.children);
    var message = document.createElement("p");
    message.className = "read-advent-lock-message";
    message.textContent = openingLabel(dates, index);
    card.appendChild(message);
    if (index === dates.open) card.setAttribute("data-advent-next", "");
    return { card: card, content: content, message: message };
  });

  function setLocks(readAhead) {
    toggle.setAttribute("aria-pressed", String(readAhead));
    previews.forEach(function (preview) {
      if (!preview) return;
      preview.card.toggleAttribute("data-advent-locked", !readAhead);
      preview.content.forEach(function (element) { element.hidden = !readAhead; });
      preview.message.hidden = readAhead;
    });
    if (footer) footer.hidden = !readAhead;
  }
  toggle.addEventListener("click", function () { setLocks(toggle.getAttribute("aria-pressed") !== "true"); });
  setLocks(false);
})();
