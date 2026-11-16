const byId = id => document.getElementById(id);
const activity = byId("activity");
const body = byId("activity-body");
const stories = {
  lantern: {
    title: "Corgi and the Little Lantern",
    image: "./art/corgi-lantern.webp",
    alt: "Corgi carries a lantern along a snowy trail",
    pages: [
      "The snow covered the path to the library. Corgi-on-the-Cob lifted his lantern. In its warm glow he saw tiny tracks that went away from the door.",
      "The tracks stopped under a pine. There sat Nutmeg with a book hugged to her chest. “I saw the light in the window,” she said, “but I lost the path.”",
      "“Walk with me,” said Corgi. They took little steps. At every turn Nutmeg spotted the next trail marker, and Corgi held the light high.",
      "Ted-E-Bear opened the library door. Nutmeg put her book beside the lantern. “Shall we read it together?” she asked. Corgi made room on the rug."
    ]
  },
  snow: {
    title: "Sub-Zero’s Snow Day",
    image: "./art/sub-zero-snow.webp",
    alt: "Sub-Zero holds a snowflake beside a sled full of scarves",
    pages: [
      "Sub-Zero put three scarves on the sled. Panda-Cake brought three more. How many scarves were on the sled altogether?",
      "Two friends picked a scarf each. Now two scarves were off the sled. How many were still in the pile?",
      "The wind sent one scarf over the snow. Sub-Zero slid after it, feet first! How many scarves were left on the sled while he fetched it?",
      "He put the scarf back. Four scarves sat snug in the sled. “That’s how many we had before!” said Panda-Cake. They took the long hill home together."
    ]
  }
};

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function control(text, action) {
  const button = element("button", text, "quiet");
  button.addEventListener("click", action);
  return button;
}

function openStory(story) {
  let page = 0;
  byId("activity-title").textContent = story.title;
  const art = element("img", "", "story-art");
  art.src = story.image;
  art.alt = story.alt;
  const prose = element("p", "", "story-prose");
  prose.setAttribute("aria-live", "polite");
  const count = element("span", "", "muted");
  const back = control("← Previous", () => { page--; update(); });
  const next = control("Next →", () => {
    if (page === story.pages.length - 1) activity.close();
    else { page++; update(); }
  });
  const controls = element("div", "", "activity-controls");
  controls.append(back, count, next);
  body.replaceChildren(art, prose, controls);

  function update() {
    prose.textContent = story.pages[page];
    count.textContent = (page + 1) + " / " + story.pages.length;
    back.disabled = page === 0;
    next.textContent = page === story.pages.length - 1 ? "Finish" : "Next →";
    if (!page && document.activeElement === back) next.focus();
  }
  update();
  activity.showModal();
}

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

let flipTimer;
activity.addEventListener("close", () => { if (!activity.open) clearTimeout(flipTimer); });

function openGame(type) {
  const match = type === "match";
  byId("activity-title").textContent = match ? "Mitten Match" : "Lantern Trail";
  const instructions = element("p", match
    ? "Turn over two tiles at a time. Find all six pairs."
    : "Tap the numbers from 1 to 12 to light the lantern.");
  const board = element("div", "", "board");
  board.setAttribute("aria-label", match ? "Matching tiles" : "Numbered trail");
  const feedback = element("p", "", "game-feedback");
  feedback.setAttribute("role", "status");
  const reset = control("Start again", () => {
    deal();
    board.querySelector("button").focus();
  });
  body.replaceChildren(instructions, board, feedback, reset);

  function deal() {
    clearTimeout(flipTimer);
    board.replaceChildren();
    feedback.textContent = match ? "0 of 6 pairs found." : "Look for stone 1.";
    if (match) makeMatchBoard(board, feedback);
    else makeTrailBoard(board, feedback);
  }

  deal();
  activity.showModal();
  board.querySelector("button").focus();
}

function makeMatchBoard(board, feedback) {
  const items = [["🧤","Mitten"],["🧣","Scarf"],["🏮","Lantern"],["❄","Snowflake"],["🛷","Sled"],["🌲","Pine"]];
  let first = null;
  let locked = false;
  let pairs = 0;

  shuffled([...items, ...items]).forEach(([icon, name], index) => {
    const tile = element("button", "", "tile");
    function turn(open) {
      tile.classList.toggle("open", open);
      tile.setAttribute("aria-label", (open ? name + ", tile " : "Hidden tile ") + (index + 1));
      tile.textContent = open ? icon : "✦";
      if (open) tile.append(element("small", name));
    }
    turn(false);
    tile.addEventListener("click", () => {
      if (locked || first?.tile === tile) return;
      turn(true);
      if (!first) {
        first = { tile, name, turn };
        feedback.textContent = name + " found. Choose another tile.";
        return;
      }
      if (first.name === name) {
        first.tile.disabled = true;
        tile.disabled = true;
        first = null;
        pairs++;
        feedback.textContent = pairs === 6 ? "You found all six pairs!" : pairs + " of 6 pairs found.";
        (board.querySelector(".tile:enabled") || body.lastElementChild).focus();
        return;
      }
      locked = true;
      feedback.textContent = first.name + " and " + name + ". Try another pair.";
      flipTimer = setTimeout(() => {
        first.turn(false);
        turn(false);
        first = null;
        locked = false;
      }, 1000);
    });
    board.append(tile);
  });
}

function makeTrailBoard(board, feedback) {
  let next = 1;
  shuffled(Array.from({ length: 12 }, (_, i) => i + 1)).forEach(number => {
    const tile = element("button", String(number), "tile");
    tile.addEventListener("click", () => {
      if (number !== next) {
        feedback.textContent = "Look for stone " + next + " next.";
        return;
      }
      tile.classList.add("visited");
      tile.disabled = true;
      next++;
      feedback.textContent = next === 13 ? "The library lantern is lit! 🏮" : "Good step. Look for stone " + next + ".";
      (board.querySelector(".tile:enabled") || body.lastElementChild).focus();
    });
    board.append(tile);
  });
}

document.querySelectorAll("[data-story]").forEach(button => {
  button.addEventListener("click", () => openStory(stories[button.dataset.story]));
});
document.querySelectorAll("[data-game]").forEach(button => {
  button.addEventListener("click", () => openGame(button.dataset.game));
});
