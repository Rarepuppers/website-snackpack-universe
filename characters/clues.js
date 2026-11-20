(() => {
  const game = document.querySelector("[data-cast-game]");
  const fallback = document.querySelector("[data-cast-fallback]");
  const title = game.querySelector("[data-clue-title]");
  const list = game.querySelector("[data-clue-list]");
  const nextClue = game.querySelector("[data-next-clue]");
  const showAnswer = game.querySelector("[data-show-answer]");
  const feedback = game.querySelector("[data-feedback]");
  const reveal = game.querySelector("[data-reveal]");
  const visit = game.querySelector("[data-visit]");
  const nextRound = game.querySelector("[data-next-round]");
  const guesses = [...game.querySelectorAll("[data-guess]")];

  fetch("/characters/clue-rounds.json")
    .then(response => {
      if (!response.ok) throw new Error("Clues unavailable");
      return response.json();
    })
    .then(start)
    .catch(() => {
      game.hidden = true;
      fallback.hidden = false;
    });

  function start(rounds) {
    let roundIndex = 0;
    let clueCount = 0;
    function addClue() {
      const round = rounds[roundIndex];
      const item = document.createElement("li");
      item.textContent = round.clues[clueCount++];
      list.appendChild(item);
      title.textContent = `Clue ${clueCount} of ${round.clues.length}`;
      nextClue.disabled = clueCount === round.clues.length;
    }

    function reset() {
      clueCount = 0;
      list.replaceChildren();
      reveal.hidden = true;
      showAnswer.disabled = false;
      feedback.textContent = "";
      for (const button of guesses) {
        button.disabled = false;
        button.removeAttribute("data-correct");
      }
      addClue();
    }

    function finish(guessed) {
      const round = rounds[roundIndex];
      for (const button of guesses) {
        button.disabled = true;
        if (button.dataset.guess === round.answer) button.setAttribute("data-correct", "");
      }
      nextClue.disabled = showAnswer.disabled = true;
      feedback.textContent = `${guessed ? "You found " : "Behind the door is "}${round.name}! ${round.explanation}`;
      visit.href = `/characters/${round.answer}/`;
      reveal.hidden = false;
      visit.focus();
    }

    nextClue.addEventListener("click", () => {
      addClue();
      title.focus();
    });
    showAnswer.addEventListener("click", () => finish(false));
    nextRound.addEventListener("click", () => {
      roundIndex = (roundIndex + 1) % rounds.length;
      reset();
      title.focus();
    });
    for (const button of guesses) {
      button.addEventListener("click", () => {
        if (button.dataset.guess === rounds[roundIndex].answer) {
          finish(true);
        } else {
          feedback.textContent = clueCount === rounds[roundIndex].clues.length
            ? "Have another look at the last clue, or show the answer."
            : "Have another go. You can read another clue first.";
        }
      });
    }
    reset();
    game.hidden = false;
    fallback.hidden = true;
  }
})();
