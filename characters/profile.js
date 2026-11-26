(() => {
  const button = document.querySelector("[data-cast-greetings]");
  const greeting = button.previousElementSibling;
  const options = JSON.parse(button.dataset.castGreetings);
  let selected = 0;

  greeting.setAttribute("aria-live", "polite");
  button.hidden = false;
  button.addEventListener("click", () => {
    selected = (selected + 1) % options.length;
    greeting.textContent = options[selected];
  });
})();
