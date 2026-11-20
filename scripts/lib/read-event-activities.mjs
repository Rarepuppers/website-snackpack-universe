const clocks = [
  ['Your time', '', 'Depends on where you are'],
  ['Cairo', 'Africa/Cairo', 'UTC+2'],
  ['Nairobi', 'Africa/Nairobi', 'UTC+3'],
  ['Dubai', 'Asia/Dubai', 'UTC+4'],
  ['Kiritimati', 'Pacific/Kiritimati', 'UTC+14'],
];

const tickMarks = Array.from({ length: 12 }, (_, i) =>
  `<path d="M48 10v5" transform="rotate(${i * 30} 48 48)"/>`).join('');

const clockFace = `<svg viewBox="0 0 96 96" width="96" height="96" role="img"><circle cx="48" cy="48" r="43"/><g class="read-clock-ticks">${tickMarks}</g><path data-hour-hand d="M48 48V27"/><path data-minute-hand d="M48 48V19"/><circle cx="48" cy="48" r="2" fill="currentColor"/></svg>`;

function midnightClocks() {
  const rows = clocks.map(([name, , offset]) => `<tr><th scope="row">${name}</th><td>${offset}</td></tr>`).join('');
  const cards = clocks.map(([name, zone]) => `<li class="read-clock" data-clock data-zone="${zone}"><h3>${name}</h3>${clockFace}<p><span data-clock-time></span> · <span data-clock-date></span></p><p class="read-clock-badge" data-new-year hidden>New Year!</p></li>`).join('');
  return `<h2 class="read-shelf-heading">Midnight around the world</h2>
<p>Compare the times on Professor Hooten’s clock wall.</p>
<noscript><p>Places further ahead reach midnight first.</p><table><caption>Time differences on 31 December</caption><thead><tr><th scope="col">Place</th><th scope="col">Offset</th></tr></thead><tbody>${rows}</tbody></table></noscript>
<div data-clock-controls hidden><ul class="read-clock-grid">${cards}</ul><p data-countdown></p><p class="read-activity-status" role="status"></p></div>`;
}

function thankYouLeaves() {
  const colours = ['Rust', 'Gold', 'Red', 'Brown'].map((name, i) =>
    `<label><input type="radio" name="colour" value="${name.toLowerCase()}"${i === 0 ? ' checked' : ''}> ${name}</label>`).join('');
  return `<h2 class="read-shelf-heading">Thank-you Leaves</h2>
<p>Write who you’re thankful for on a leaf. <a href="./thank-you-leaves.pdf" download>Print the Thank-you Leaves sheet (PDF)</a> to make a branch on paper.</p>
<div data-leaves-controls hidden>
<form class="read-leaves-form" autocomplete="off">
<label for="thank-you-name">Who are you thankful for?</label>
<input id="thank-you-name" name="name" type="text" maxlength="40" required>
<fieldset><legend>Choose a leaf colour</legend><div class="read-leaf-colours">${colours}</div></fieldset>
<div class="stack-inline"><button class="btn btn-primary" type="submit">Hang my leaf</button></div>
<label class="read-leaf-keep"><input type="checkbox" name="keep"> Keep my leaves on this device</label>
<p class="read-event-note">Your leaves stay on this device.</p>
</form>
<div class="read-leaf-branch">
<svg viewBox="0 0 720 80" aria-hidden="true" width="720" height="80" preserveAspectRatio="none"><g fill="none" stroke="currentColor" stroke-linecap="round"><path stroke-width="7" d="M14 58 Q215 24 415 43 Q575 53 706 17"/><path stroke-width="4" d="M106 43 60 17 M190 37 225 65 M324 37 287 9 M425 43 468 73 M578 42 541 13 M638 31 684 48"/></g></svg>
<ul aria-label="Thank-you leaves"></ul></div>
<div class="stack-inline"><button class="btn btn-secondary" type="button" data-clear-leaves>Clear the branch</button><button class="btn btn-secondary" type="button" data-print-leaves>Print my branch</button></div>
<p class="read-activity-status" role="status"></p>
</div>`;
}

const activities = { 'thank-you-leaves': thankYouLeaves, 'midnight-clocks': midnightClocks };

export function renderReadEventActivity(name) {
  const render = activities[name];
  if (!render) throw new Error(`Unknown Reads event activity: ${name}`);
  return `<section class="read-event-activity" data-activity="${name}"><div class="shell">${render()}</div></section><script src="/read/activities/${name}.js" defer></script>`;
}
