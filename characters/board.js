(() => {
  const filter = document.querySelector("[data-cast-filter]");
  const input = filter.querySelector("input");
  const group = filter.querySelector("#cast-group");
  const story = filter.querySelector("#cast-story");
  const count = filter.querySelector("[data-cast-count]");
  const cards = [...document.querySelectorAll("[data-cast-search]")];
  const normal = value => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");

  function update() {
    const query = normal(input.value);
    let visible = 0;
    for (const card of cards) {
      card.hidden = !normal(card.dataset.castSearch).includes(query) ||
        (group.value !== "" && card.dataset.castGroup !== group.value) ||
        (story.value !== "" && !card.dataset.castStories.split(" ").includes(story.value));
      if (!card.hidden) visible++;
    }
    count.textContent = visible === 0 ? "No matching characters" : `${visible} ${visible === 1 ? "character" : "characters"}`;
  }

  function readLocation() {
    const params = new URLSearchParams(location.search);
    for (const [key, field] of [["group", group], ["story", story]]) {
      const value = params.get(key);
      field.value = Array.from(field.options).some(option => option.value === value) ? value : "";
    }
    update();
  }

  function storeFilters() {
    const url = new URL(location.href);
    for (const [key, field] of [["group", group], ["story", story]]) {
      if (field.value) url.searchParams.set(key, field.value);
      else url.searchParams.delete(key);
    }
    history.replaceState(history.state, "", url);
    update();
  }

  input.addEventListener("input", update);
  group.addEventListener("change", storeFilters);
  story.addEventListener("change", storeFilters);
  window.addEventListener("pageshow", readLocation);
  window.addEventListener("popstate", readLocation);
  readLocation();
  filter.hidden = false;
})();
