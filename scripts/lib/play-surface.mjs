// Where a page sits -> how Play Console should file the installs it drives.
//
// Extracted from build-play-links.mjs so build-go-links.mjs can reuse it.
// These two scripts MUST agree: build-go-links generates the interstitials and
// build-play-links tags the Play URL inside them, so if their idea of a
// surface ever diverged, every click would be filed under the wrong campaign
// and --check would fight itself forever. One copy, imported twice.

/**
 * Map a repo-relative HTML path to { surface, campaign }.
 * surface = the kind of page (the utm_medium), campaign = the specific page.
 */
export function classify(rel) {
  const parts = rel.split("/");
  const file = parts[parts.length - 1];
  const dir = parts.slice(0, -1);

  if (dir.length === 0) {
    // Root-level pages: index.html is the homepage, everything else is itself.
    const slug = file === "index.html" ? "home" : file.replace(/\.html$/, "");
    return { surface: "home", campaign: slug };
  }

  const section = dir[0];
  const leaf = dir[dir.length - 1];
  const isSectionIndex = dir.length === 1;

  switch (section) {
    case "play":
      if (isSectionIndex) return { surface: "arcade", campaign: "arcade-index" };
      if (leaf === "daily") return { surface: "daily", campaign: "daily-hub" };
      return { surface: "arcade", campaign: leaf };
    case "guides":
      if (isSectionIndex) return { surface: "guide", campaign: "guides-index" };
      return { surface: "guide", campaign: leaf };
    case "apps":
      if (isSectionIndex) return { surface: "app-index", campaign: "apps-index" };
      return { surface: "app-page", campaign: leaf };
    case "read":
      if (isSectionIndex) return { surface: "read", campaign: "read-shelf" };
      return { surface: "read", campaign: leaf };
    case "privacy":
      return { surface: "privacy", campaign: isSectionIndex ? "privacy-index" : leaf };
    case "world-cup":
      return { surface: "worldcup", campaign: isSectionIndex ? "worldcup-hub" : leaf };
    // go/<surface>/<campaign>/<app>/ is a click-counting interstitial standing in
    // for a link that lived on some other page (see build-go-links.mjs). It
    // carries the tag of the page the visitor actually clicked on, which is
    // encoded in its own path -- so the Play Console series is continuous
    // across the day the interstitials shipped, rather than restarting under a
    // new surface called "go".
    case "go":
      return { surface: dir[1], campaign: dir[2] };
    default:
      return { surface: "site", campaign: leaf };
  }
}

/** The referrer value Play reads, with the UTM pairs encoded inside it. */
export function referrerFor({ surface, campaign }) {
  const inner = `utm_source=website&utm_medium=${surface}&utm_campaign=${campaign}`;
  return encodeURIComponent(inner);
}
