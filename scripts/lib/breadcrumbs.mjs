import path from "node:path";
import { fileEol, replaceMarkerBlock, withEol } from "./marker-block.mjs";

const ORIGIN = "https://www.snackpackuniverse.com";
const MARKER_OPEN = "<!-- breadcrumbs:generated -->";
const MARKER_CLOSE = "<!-- /breadcrumbs:generated -->";

// Human labels for the section roots.
const SECTION = {
  apps: "Apps",
  characters: "Meet the Characters",
  animals: "Animals",
  play: "Play",
  guides: "Guides",
  privacy: "Privacy",
  terms: "Terms",
  "world-cup": "World Cup",
  // App slugs that appear as an intermediate crumb (e.g. a nested data-deletion
  // page). Without these the slug is title-cased from its parts rather than
  // reading as the app's actual name.
  "snackpack-8-earth-science": "Earth Science"
};

function breadcrumbTitle(html) {
  return html.match(/<title>(.*?)<\/title>/s)?.[1] ?? "";
}

function pageLabel(title) {
  // Strip the site suffix so the crumb reads as a page name, not a full title.
  return title
    .split("|")[0]
    .split("—")[0]
    .trim()
    .replace(/&amp;/g, "&");
}

export function breadcrumbBlock(file, title, omittedPath) {
  const dir = path.posix.dirname(file);
  const parts = dir.split("/");
  const items = [{ name: "Home", url: `${ORIGIN}/` }];
  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    acc += `/${parts[i]}`;
    const isLast = i === parts.length - 1;
    if (acc === omittedPath) continue;
    const label = isLast
      ? pageLabel(title) || SECTION[parts[i]] || parts[i]
      : SECTION[parts[i]] ||
        parts[i].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    items.push({ name: label, url: `${ORIGIN}${acc}/` });
  }

  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url
    }))
  };

  return `${MARKER_OPEN}\n<script type="application/ld+json">\n` +
    JSON.stringify(ld, null, 2).replace(/</g, "\\u003c") +
    `\n</script>\n${MARKER_CLOSE}`;
}

export function withBreadcrumbs(html, file, omittedPath) {
  const block = breadcrumbBlock(file, breadcrumbTitle(html), omittedPath);
  // Replace an earlier generated block, else insert before </head>.
  const eol = fileEol(html);
  return replaceMarkerBlock(html, MARKER_OPEN, MARKER_CLOSE, block) ??
    html.replace("</head>", withEol(block, eol) + eol + "</head>");
}
