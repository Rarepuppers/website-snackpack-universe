// Seasonal save data and rewards stay separate from the career tables.
export const WINTER_PAINTS = [
  { id: "candy-cane", name: "Candy Cane", colors: ["#d6342c","#fff6ec"] },
  { id: "gingerbread", name: "Gingerbread", colors: ["#9d603b","#ffd9ab"] },
  { id: "evergreen", name: "Evergreen", colors: ["#2e7d4f","#f2c14e"] },
  { id: "snowflake", name: "Snowflake", colors: ["#c9d8ec","#45678c"] },
  { id: "northern-lights", name: "Northern Lights", colors: ["#5938a1","#5be3a6"] },
  { id: "gold-runner", name: "Gold Runner", colors: ["#b72332","#ffd464"] }
];
export const WINTER_TOPPERS = [["santa_hat","Santa hat"],["antlers","Antlers"],["star","Gold star"]];
const REWARD_NAMES = {
  sleigh: "Jingle Sleigh", santa_hat: "Santa hat", antlers: "Antlers", star: "Gold star",
  tree: "Depot tree", lights: "Depot lights", wreath: "Depot wreath", snowman: "Depot snowman",
  ...Object.fromEntries(WINTER_PAINTS.map(p => [p.id,p.name]))
};
const DOOR_REWARDS = { 3:"sleigh", 7:"santa_hat", 10:"tree", 14:"candy-cane", 18:"antlers", 21:"lights", 24:"star" };
const ORDER_REWARDS = ["wreath","snowman","gingerbread","snowflake","evergreen","northern-lights"];
const map = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export function migrateWinterSave(save) {
  save.events = map(save.events);
  save.winterRewards = map(save.winterRewards);
  save.v = Math.max(2, Number(save.v) || 1);
}

export function seasonProgress(save, key) {
  const item = save.events[key] = map(save.events[key]);
  item.doors = map(item.doors);
  item.orders = map(item.orders);
  item.routes = map(item.routes);
  item.homes = Number(item.homes) || 0;
  item.sleighRuns = Number(item.sleighRuns) || 0;
  return item;
}

export function seasonStars(progress) {
  return Object.values(progress.routes).reduce((n, value) => n + value, 0);
}

export function canStartWinter(event, progress, delivery, ownedSleigh) {
  if (!event || !delivery) return false;
  if (delivery.orderKind === "advent") return delivery.door <= event.openDoors;
  if (delivery.orderKind === "route") return delivery.index !== 7 || event.openDoors === 24;
  return (!delivery.truck || ownedSleigh) && seasonStars(progress) >= delivery.requiredStars;
}

export function winterGoals(progress) {
  return [
    ["sleigh","Sleigh Driver","Complete 10 runs in the sleigh.",progress.sleighRuns >= 10],
    ["presents","Good Neighbour","Deliver 100 loads to porches.",progress.homes >= 100],
    ["advent","Advent Complete","Complete all 24 doors.",Object.keys(progress.doors).length === 24],
    ["christmas_eve","Christmas Eve","Earn three stars on Christmas Eve Run.",progress.doors[24] === 3 || progress.routes["northpole-8"] === 3],
    ["workshop","Workshop Hero","Complete all six Workshop Orders.",Object.keys(progress.orders).length === 6]
  ];
}

export function finishWinter(save, key, delivery, report, masteryLevel) {
  const progress = seasonProgress(save,key);
  const rewards = [];
  const award = (id) => {
    if (save.winterRewards[id]) return;
    save.winterRewards[id] = true;
    if (id === "sleigh" && !save.trucks.includes(id)) save.trucks.push(id);
    rewards.push(REWARD_NAMES[id]);
  };
  let coins = report.earned;
  if (report.status === "done") {
    progress.homes += report.kept;
    if (report.truck === "sleigh") {
      progress.sleighRuns++;
      save.mastery.sleigh = (save.mastery.sleigh || 0) + report.metres;
      if (masteryLevel("sleigh") >= 10) award("gold-runner");
    }
    if (delivery.orderKind === "advent") {
      const old = progress.doors[delivery.door] || 0;
      if (!old) {
        const prize = DOOR_REWARDS[delivery.door];
        if (prize) award(prize);
        else { coins += 25; rewards.push("Advent bonus +25 coins"); }
      }
      progress.doors[delivery.door] = Math.max(old,report.stars);
    } else if (delivery.orderKind === "route") {
      progress.routes[delivery.id] = Math.max(progress.routes[delivery.id]||0,report.stars);
    } else if (report.stars >= 2) {
      if (!progress.orders[delivery.id]) {
        award(ORDER_REWARDS[delivery.index]);
        coins += 30;
        rewards.push("Workshop bonus +30 coins");
      }
      progress.orders[delivery.id] = Math.max(progress.orders[delivery.id]||0,report.stars);
      if (delivery.twist === "rush" && report.express) { coins += 20; rewards.push("Rush tip +20 coins"); }
    }
  }
  save.coins += coins;
  return { rewards, coins };
}
