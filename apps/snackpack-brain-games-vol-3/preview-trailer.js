const container = document.querySelector("[data-brain-games-player]");
const link = container.querySelector("a");

link.addEventListener("click", (event) => {
  if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

  event.preventDefault();
  const player = document.createElement("iframe");
  player.title = "Brain Games 3 gameplay trailer";
  player.src = `https://www.youtube-nocookie.com/embed/${container.dataset.brainGamesPlayer}?autoplay=1&playsinline=1`;
  player.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  player.allowFullscreen = true;
  player.referrerPolicy = "strict-origin-when-cross-origin";
  container.replaceChildren(player);
  player.focus();
});
