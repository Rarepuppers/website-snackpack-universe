/**
 * Three-way theme toggle and SnackPack Universe header controls.
 *
 *   dark   →  light  →  cream  →  dark …
 *
 * Themes are applied as `data-theme` on <html>; each stylesheet defines the
 * palette for all three under `:root[data-theme="…"]`. Nothing here knows about
 * colours, so a site can restyle a theme without touching this file.
 *
 * Two things worth knowing:
 *
 *  1. **The initial theme is set by a tiny inline snippet in <head>, not here.**
 *     This file is deferred, which means it runs after first paint — if it owned
 *     the initial choice, every visit would flash the default palette before
 *     switching. The snippet is injected by scripts/build-theme.mjs; see there.
 *
 *  2. **The button mounts itself**, so adding the toggle to a page needs no
 *     markup. It looks for an explicit `[data-theme-slot]`, then a `.nav-links`
 *     list, then falls back to a fixed top-right button. Preferring the nav
 *     matters on pages whose header already occupies that corner: a fixed
 *     button would sit on top of the links.
 */
(function () {
  "use strict";

  var KEY = "snackpack.theme.v1";
  var ORDER = ["dark", "light", "cream"];

  var META = {
    dark:  { icon: "☾", label: "dark" },
    light: { icon: "☀", label: "light" },
    cream: { icon: "◐", label: "cream" }
  };

  var root = document.documentElement;

  function fallback() {
    // Per-site default, written into <html data-theme-default="…"> by the build
    // step. Each site states its own, so the OS preference is only consulted
    // when a page somehow ships without the attribute.
    var declared = root.getAttribute("data-theme-default");
    if (declared && META[declared]) return declared;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "cream";
  }

  function current() {
    var value = root.getAttribute("data-theme");
    return META[value] ? value : fallback();
  }

  function next(theme) {
    return ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  }

  function apply(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (persist) {
      try { localStorage.setItem(KEY, theme); } catch (error) {}
    }
    paint(theme);
  }

  var button = null;

  function paint(theme) {
    if (!button) return;
    var upcoming = next(theme);
    button.textContent = META[theme].icon;
    // The control cycles, so the honest label is what the NEXT press does.
    var text = "Switch to " + META[upcoming].label + " mode";
    button.setAttribute("aria-label", text);
    button.setAttribute("title", text);
  }

  function mount() {
    button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.setAttribute("data-theme-toggle", "");

    var slot = document.querySelector("[data-theme-slot]");
    var nav = document.querySelector(".nav-links");

    if (slot) {
      slot.appendChild(button);
    } else if (nav) {
      var item = document.createElement("li");
      item.className = "nav-theme-item";
      item.appendChild(button);
      nav.appendChild(item);
    } else {
      button.classList.add("theme-toggle--floating");
      document.body.appendChild(button);
    }

    button.addEventListener("click", function () {
      apply(next(current()), true);
    });

    // Native focus scrolling can leave part of a compact-nav link outside
    // its scroller at page zoom. Reveal the complete focused control.
    if (nav && document.body.classList.contains("home-page")) {
      var scroller = nav.closest("nav");
      if (scroller) scroller.addEventListener("focusin", function (event) {
        var target = event.target.closest("a,button");
        if (!target) return;
        requestAnimationFrame(function () {
          if (scroller.scrollWidth <= scroller.clientWidth) return;
          var frame = scroller.getBoundingClientRect(), item = target.getBoundingClientRect();
          var scale = frame.width / scroller.offsetWidth;
          scroller.scrollTo({left: scroller.scrollLeft + (item.left + item.right - frame.left - frame.right) / (2 * scale), behavior: "instant"});
        });
      });
    }
    paint(current());
  }

  // Keep the disclosure outside the horizontal scroller so its panel can
  // open below the sticky header. Reuse the original links and desktop order.
  function mountMobileNavigation() {
    var links = document.querySelector(".topbar .topbar-inner > nav > .nav-links");
    if (!links || !window.matchMedia) return;

    var secondary = Array.from(links.children).filter(function (item) {
      var link = item.querySelector("a[href]");
      return link && (
        link.protocol === "mailto:" ||
        /^\/(?:play\/daily|guides|privacy|terms)\/?$/.test(link.pathname) ||
        (link.pathname === "/" && link.hash === "#pipeline")
      );
    });
    if (!secondary.length) return;

    var header = links.closest(".topbar-inner");
    var menu = document.createElement("details");
    menu.className = "nav-more";
    var summary = document.createElement("summary");
    summary.textContent = "More";
    var panel = document.createElement("ul");
    panel.className = "nav-more-links";
    menu.append(summary, panel);
    header.appendChild(menu);

    var positions = secondary.map(function (item) {
      var marker = document.createComment("secondary navigation link");
      item.before(marker);
      return marker;
    });

    var compact = window.matchMedia("(max-width: 980px)");
    function arrange() {
      menu.open = false;
      header.classList.toggle("topbar-has-more", compact.matches);
      secondary.forEach(function (item, index) {
        if (compact.matches) panel.appendChild(item);
        else positions[index].after(item);
      });
    }
    arrange();
    if (compact.addEventListener) compact.addEventListener("change", arrange);
    else compact.addListener(arrange);

    document.addEventListener("click", function (event) {
      if (!menu.contains(event.target)) menu.open = false;
    });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !menu.open) return;
      menu.open = false;
      if (menu.contains(document.activeElement)) summary.focus();
    });
    panel.addEventListener("click", function (event) {
      if (!event.target.closest("a")) return;
      summary.focus();
      menu.open = false;
    });
  }

  function mountHeader() {
    mount();
    mountMobileNavigation();
  }

  // Follow the OS only while the visitor has never chosen for themselves.
  if (window.matchMedia) {
    var query = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function () {
      var saved = null;
      try { saved = localStorage.getItem(KEY); } catch (error) {}
      if (!saved) apply(fallback(), false);
    };
    if (query.addEventListener) query.addEventListener("change", onChange);
    else if (query.addListener) query.addListener(onChange);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountHeader);
  } else {
    mountHeader();
  }
})();
