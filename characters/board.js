(() => {
  const filter = document.querySelector("[data-cast-filter]");
  const input = filter.querySelector("input");
  const count = filter.querySelector("[data-cast-count]");
  const cards = [...document.querySelectorAll("[data-cast-search]")];
  const normal = value => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");

  function update() {
    const query = normal(input.value);
    let visible = 0;
    for (const card of cards) {
      card.hidden = !normal(card.dataset.castSearch).includes(query);
      if (!card.hidden) visible++;
    }
    count.textContent = visible === 0 ? "No matching characters" : `${visible} ${visible === 1 ? "character" : "characters"}`;
  }

  input.addEventListener("input", update);
  window.addEventListener("pageshow", update);
  update();
  filter.hidden = false;
})();
