/* Holiday and event bookshelves: decides, on the visitor's own calendar day,
 * which events are in season, and fills in countdowns and "Read together
 * tonight". Generated markup carries the dates (scripts/build-read-events.mjs);
 * this script only reveals and orders it. Without JavaScript every event page
 * still lists every book, and the hub keeps its full shelf. Nothing is stored. */
(() => {
  const DAY = 86400000;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  const month = (t) => new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "long", timeZone: "UTC" });

  // The event date this visit belongs to: the one whose featured window holds
  // today, or else the next one. Returns null when the table has run out.
  function status(el) {
    const dates = el.dataset.dates.split(" ").map(parse);
    const lead = Number(el.dataset.lead) * DAY, tail = Number(el.dataset.tail) * DAY;
    // An event with no finished books is never featured, only "coming up".
    const ready = el.dataset.books !== "0";
    for (const d of dates) if (ready && today >= d - lead && today <= d + tail) return { featured: true, date: d };
    if (!ready) { const d = dates.find((x) => x >= today); return d ? { featured: false, date: d } : null; }
    const next = dates.find((d) => d > today);
    return next ? { featured: false, date: next } : null;
  }

  function countdown(el, s) {
    const label = el.dataset.day;
    const days = Math.round((s.date - today) / DAY);
    if (!s.featured) return `Next: ${month(s.date)}`;
    if (days > 1) return `${days} days to ${label}`;
    if (days === 1) return `${label} is tomorrow`;
    if (days === 0) return `Today is ${label}`;
    return "Read them all year round";
  }

  const events = [...document.querySelectorAll("[data-read-event]")].map((el) => ({ el, s: status(el) }));
  for (const { el, s } of events) {
    for (const c of el.querySelectorAll("[data-event-countdown]")) if (s) c.textContent = countdown(el, s);
  }

  // Hub band: show featured events only, nearest date first.
  const band = document.querySelector("[data-read-season]");
  if (band) {
    const live = events.filter((e) => band.contains(e.el) && e.s?.featured).sort((a, b) => a.s.date - b.s.date);
    const host = band.querySelector(".shell"), last = band.querySelector(".read-season-all");
    for (const e of live) { e.el.hidden = false; host.insertBefore(e.el, last); }
    band.hidden = !live.length;
  }

  // All-events page: featured first, then coming up in date order.
  const list = document.querySelector("[data-read-event-list]");
  if (list) {
    const rank = (e) => (e.s ? (e.s.featured ? 0 : 1) * 1e13 + e.s.date : 9e13);
    for (const e of events.filter((x) => list.contains(x.el)).sort((a, b) => rank(a) - rank(b))) {
      e.el.classList.toggle("is-featured", Boolean(e.s?.featured));
      list.appendChild(e.el);
    }
  }

  // "Read together tonight": the local holiday pick takes priority over rotation.
  const tonight = [];
  for (const box of document.querySelectorAll("[data-read-tonight]")) {
    const picks = [...box.querySelectorAll("[data-tonight]")];
    if (picks.length) tonight.push(picks);
  }
  if (tonight.length) {
    let timer;
    function refreshTonight() {
      const local = new Date();
      const day = Date.UTC(local.getFullYear(), local.getMonth(), local.getDate());
      const date = new Date(day).toISOString().slice(5, 10);
      for (const picks of tonight) {
        const special = picks.find(pick => pick.dataset.tonightDate === date);
        const chosen = special ?? picks[Math.floor(day / DAY) % picks.length];
        for (const pick of picks) {
          pick.hidden = pick !== chosen;
          const label = pick.querySelector("[data-tonight-label]");
          if (label) label.textContent = pick === special ? pick.dataset.tonightSpecial : "Read together tonight";
        }
      }
      clearTimeout(timer);
      const midnight = new Date(local.getFullYear(), local.getMonth(), local.getDate() + 1);
      timer = setTimeout(refreshTonight, midnight - local + 100);
    }
    window.addEventListener("pageshow", refreshTonight);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refreshTonight();
    });
    refreshTonight();
  }
})();
