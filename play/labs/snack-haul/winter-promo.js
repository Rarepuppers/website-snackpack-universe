// The seasonal web teaser follows the same local calendar as Winter Haul.
const banner = document.querySelector("[data-snack-haul-winter]");
function refreshWinterPromo() {
  const date = new Date();
  banner.hidden = !(date.getMonth() === 11 || (date.getMonth() === 0 && date.getDate() <= 6));
  clearTimeout(refreshWinterPromo.timer);
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  refreshWinterPromo.timer = setTimeout(refreshWinterPromo, midnight - date + 100);
}
if (banner) {
  refreshWinterPromo();
  window.addEventListener("pageshow",refreshWinterPromo);
}
