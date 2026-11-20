(() => {
  'use strict';

  const activity = document.querySelector('[data-activity="midnight-clocks"]');
  if (!activity) return;

  const hour = 3600000;
  const day = 24 * hour;
  const cards = Array.from(activity.querySelectorAll('[data-clock]'), card => {
    const timeZone = card.dataset.zone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return {
      card,
      name: card.querySelector('h3').textContent,
      parts: new Intl.DateTimeFormat('en-GB-u-nu-latn', {
        timeZone, year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
      }),
      time: new Intl.DateTimeFormat(undefined, { timeZone, hour: 'numeric', minute: '2-digit' }),
      date: new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric', month: 'short' }),
      face: card.querySelector('svg'),
      shortHand: card.querySelector('[data-hour-hand]'),
      longHand: card.querySelector('[data-minute-hand]'),
      timeText: card.querySelector('[data-clock-time]'),
      dateText: card.querySelector('[data-clock-date]'),
      badge: card.querySelector('[data-new-year]'),
    };
  });
  const countdown = activity.querySelector('[data-countdown]');
  const status = activity.querySelector('[role="status"]');
  let boundaryYear;
  let timer;

  function localParts(clock, epoch) {
    const fields = clock.parts.formatToParts(epoch);
    return Object.fromEntries(fields.filter(field => field.type !== 'literal').map(field => [field.type, Number(field.value)]));
  }

  function midnightInZone(clock, year) {
    // Search for the first minute of 1 January in the named zone. This uses
    // the runtime's actual zone rules, including fractional offsets.
    const utc = Date.UTC(year, 0, 1);
    let before = (utc - day) / 60000;
    let after = (utc + day) / 60000;
    while (after - before > 1) {
      const mid = Math.floor((before + after) / 2);
      if (localParts(clock, mid * 60000).year < year) before = mid;
      else after = mid;
    }
    return after * 60000;
  }

  function update() {
    const now = Date.now();
    const local = localParts(cards[0], now);
    const year = local.year + (local.month > 6 ? 1 : 0);
    if (year !== boundaryYear) {
      boundaryYear = year;
      cards.forEach(clock => { clock.midnight = midnightInZone(clock, year); });
    }
    const season = (local.month === 12 && local.day >= 30) || (local.month === 1 && local.day <= 2);
    const newlyCelebrating = [];
    for (const clock of cards) {
      const { hour: localHour, minute } = localParts(clock, now);
      const date = clock.date.format(now);
      const time = clock.time.format(now);
      const celebrating = season && now >= clock.midnight;
      if (celebrating && clock.celebrating === false) newlyCelebrating.push(clock.name);
      clock.celebrating = celebrating;
      clock.badge.hidden = !celebrating;
      if (clock.timeText.textContent !== time || clock.dateText.textContent !== date) {
        clock.timeText.textContent = time;
        clock.dateText.textContent = date;
        clock.face.setAttribute('aria-label', `${clock.name}, ${time}, ${date}`);
        clock.shortHand.setAttribute('transform', `rotate(${(localHour % 12) * 30 + minute / 2} 48 48)`);
        clock.longHand.setAttribute('transform', `rotate(${minute * 6} 48 48)`);
      }
    }
    if (newlyCelebrating.length) status.textContent = newlyCelebrating.map(name =>
      name === 'Your time' ? 'It’s New Year where you are' : 'It’s New Year in ' + name).join('. ') + '.';
    const next = cards.filter(clock => now < clock.midnight).sort((a, b) => a.midnight - b.midnight)[0];
    if (!season) {
      countdown.textContent = 'Come back on New Year’s Eve to watch midnight travel round the world.';
    } else if (next) {
      const mins = Math.ceil((next.midnight - now) / 60000);
      const duration = mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`;
      const label = next.name === 'Your time' ? 'Your midnight' : next.name;
      countdown.textContent = `Next midnight: ${label} in ${duration}`;
    } else {
      countdown.textContent = 'It’s New Year in all five places!';
    }
  }

  function syncTimer() {
    clearInterval(timer);
    if (!document.hidden) {
      update();
      timer = setInterval(update, 1000);
    }
  }

  document.addEventListener('visibilitychange', syncTimer);
  update();
  activity.querySelector('[data-clock-controls]').hidden = false;
  if (!document.hidden) timer = setInterval(update, 1000);
})();
