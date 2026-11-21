export const aboutPath = (id) => `/read/events/${id}/about/`;
export const isReviewedAbout = (entry) => Boolean(entry?.review?.date && entry.review.scope);

// The dialogue, fact and activity are all ordinary HTML. Native disclosures
// keep answers available by keyboard, touch and with scripting disabled.
export function renderEventAbout(entry, entries, hasShelf, escape) {
  const { id, title, intro, guides, when, who, why, history, fact, question, sources, related = [], review } = entry;
  const reviewed = isReviewedAbout(entry);
  const parent = hasShelf ? `/read/events/${id}/` : "/read/events/";
  const parentLabel = hasShelf ? `${title} stories` : "Holidays and events";
  const portrait = `/characters/media/${guides[0][0]}-480.webp`;
  const [factTitle, factCopy] = fact;
  const [prompt, ...options] = question;
  const facts = [
    ["When is it?", when],
    ["Who observes it?", who],
    ["Why does it matter?", why],
  ];
  const otherPages = entries.filter(item => item.id !== id && (!reviewed || isReviewedAbout(item)));
  const links = otherPages.map(item => `<li><a href="${aboutPath(item.id)}">${escape(item.title)}</a></li>`).join("");
  const relatedLinks = related.map(([label, url]) => `<a class="text-link" href="${escape(url)}">${escape(label)}</a>`).join(" · ");
  const body = `<div class="holiday-about">
<section class="holiday-about-hero">
  <div class="shell">
    <nav class="read-event-crumbs" aria-label="Breadcrumb"><a href="/read/">Reads</a> › <a href="${parent}">${escape(parentLabel)}</a> › About</nav>
    ${reviewed ? "" : '<p class="holiday-about-review">Editorial preview · Community review pending</p>'}
    <div class="holiday-about-intro">
      <div><h1>About ${escape(title)}</h1><p class="lead">${escape(intro)}</p>
        <a class="text-link" href="#how-it-began">How it began</a> · <a class="text-link" href="#try-it">Try the question</a>
      </div>
      <img src="${portrait}" width="240" height="240" alt="${escape(guides[0][1])}">
    </div>
    <div class="holiday-about-dialogue">${guides.map(([slug, name, line]) => `<p><a class="holiday-about-character" href="/characters/${escape(slug)}/"><img src="/characters/media/${escape(slug)}-240.webp" width="44" height="44" alt="">${escape(name)}</a>${escape(line)}</p>`).join("")}</div>
  </div>
</section>
<section class="shell holiday-about-content">
  <div class="holiday-about-facts">${facts.map(([label, copy]) => `<div><h2>${label}</h2><p>${escape(copy)}</p></div>`).join("")}</div>
  <div class="holiday-about-pair">
    <div class="holiday-about-card"><h2 id="how-it-began">How it began</h2><p>${escape(history)}</p></div>
    <div class="holiday-about-card holiday-about-highlight"><h2>Fun fact</h2><details><summary>${escape(factTitle)}</summary><p>${escape(factCopy)}</p></details></div>
  </div>
  <div class="holiday-about-card"><h2 id="try-it">Try it</h2><p>${escape(prompt)}</p>
    <div class="holiday-about-options">${options.map(([option, feedback]) => `<details><summary>${escape(option)}</summary><p>${escape(feedback)}</p></details>`).join("")}</div>
  </div>
  <div class="holiday-about-card"><h2>Learn more</h2><ul>${sources.map(([label, url]) => `<li><a href="${escape(url)}">${escape(label)}</a></li>`).join("")}</ul>
${reviewed ? `<p>Review dated <time datetime="${escape(review.date)}">${escape(review.date)}</time>. ${escape(review.scope)}</p>` : ""}
${relatedLinks ? `<p>${relatedLinks}</p>` : ""}
  </div>
  ${links ? `<nav class="holiday-about-more" aria-label="Explore other holidays"><h2>Explore other holidays</h2><ul>${links}</ul></nav>` : ""}
</section>
</div>`;
  return { body, portrait, noindex: !reviewed };
}
