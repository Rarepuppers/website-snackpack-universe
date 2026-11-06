// A friend room as plain data, with no Cloudflare APIs, so it can be tested in Node.
// Rooms hold a random seat token and the game. No names, chat or player details.
import { canBeat, comboName, cpuChoose, identifyCombo, newGame, pass, play, sortCards } from "./thirteen.js";

export const CPU_DELAY_MS = 1100;
export const TURN_LIMIT_MS = 60_000;
export const RECONNECT_GRACE_MS = 30_000;
export const ROOM_LIFETIME_MS = 2 * 60 * 60 * 1000;

export function createRoom(now) {
  return { seats: [null, null, null, null], host: null, game: null, deadline: null, touched: now };
}

function seatOf(room, token) { return room.seats.findIndex((s) => s && s.token === token); }

export function join(room, token, now) {
  let seat = seatOf(room, token);
  if (seat < 0) {
    if (room.game) return { error: "This game has already started." };
    seat = room.seats.findIndex((s) => !s);
    if (seat < 0) return { error: "This table is full." };
    room.seats[seat] = { token, connected: true, goneAt: null };
    if (room.host === null) room.host = seat;
  }
  room.seats[seat].connected = true;
  room.seats[seat].goneAt = null;
  room.touched = now;
  schedule(room, now);
  return { seat };
}

export function leave(room, token, now) {
  const seat = seatOf(room, token);
  if (seat < 0) return;
  room.seats[seat].connected = false;
  room.seats[seat].goneAt = now;
  if (!room.game) {
    room.seats[seat] = null;
    if (room.host === seat) {
      const next = room.seats.findIndex((s) => s);
      room.host = next < 0 ? null : next;
    }
  }
  schedule(room, now);
}

// True when nobody can take this turn themselves, so the computer plays it.
function isAutomatic(room, seat, now) {
  const s = room.seats[seat];
  return !s || (!s.connected && now - s.goneAt >= RECONNECT_GRACE_MS);
}

function schedule(room, now) {
  const game = room.game;
  if (!game || game.winner !== null) { room.deadline = null; return; }
  const s = room.seats[game.turn];
  if (!s) room.deadline = now + CPU_DELAY_MS;
  else if (s.connected) room.deadline = now + TURN_LIMIT_MS;
  else room.deadline = Math.max(s.goneAt + RECONNECT_GRACE_MS, now + CPU_DELAY_MS);
}

export function start(room, token, mode, now) {
  const seat = seatOf(room, token);
  if (seat !== room.host) return { error: "Only the host can start." };
  if (room.game && room.game.winner === null) return { error: "A game is already running." };
  room.game = newGame(mode === "classic" ? "classic" : "standard");
  room.touched = now;
  schedule(room, now);
  return {};
}

export function playCards(room, token, ids, now) {
  const seat = seatOf(room, token), game = room.game;
  if (!game || game.winner !== null || game.turn !== seat) return { error: "It isn't your turn." };
  if (!Array.isArray(ids) || new Set(ids).size !== ids.length) return { error: "That's not a valid combination." };
  const cards = ids.map((id) => game.hands[seat].find((c) => c.id === id));
  if (cards.some((c) => !c)) return { error: "That's not a valid combination." };
  const combo = identifyCombo(cards, game.mode);
  if (!combo) return { error: "That's not a valid combination." };
  const opens = !game.firstTurn || cards.some((c) => c.value === 3 && c.suit === 0);
  if (!opens) return { error: "Your first play must include 3♠." };
  if (!canBeat(combo, game.lastCombo, game.mode)) return { error: `${comboName(combo)} doesn't beat the table.` };
  play(game, seat, combo);
  room.touched = now;
  schedule(room, now);
  return {};
}

export function passTurn(room, token, now) {
  const seat = seatOf(room, token), game = room.game;
  if (!game || game.winner !== null || game.turn !== seat) return { error: "It isn't your turn." };
  if (!game.lastCombo || game.lastSeat === seat) return { error: "You lead this round, so choose a card." };
  pass(game, seat);
  room.touched = now;
  schedule(room, now);
  return {};
}

export function sortHand(room, token) {
  const seat = seatOf(room, token), game = room.game;
  if (game && seat >= 0) game.hands[seat] = sortCards(game.hands[seat], game.mode);
}

// Runs at the deadline. Plays computer seats and times out idle players.
export function tick(room, now) {
  const game = room.game;
  if (!game || game.winner !== null || room.deadline === null || now < room.deadline) return false;
  const seat = game.turn, s = room.seats[seat];
  if (!isAutomatic(room, seat, now) && !(s && s.connected)) { schedule(room, now); return false; }
  const choice = cpuChoose(game, seat);
  // A leader must play. Anyone else who has timed out, or cannot play, passes.
  if (choice && (!s || !s.connected || !game.lastCombo || game.lastSeat === seat)) play(game, seat, choice);
  else if (choice === null || (game.lastCombo && game.lastSeat !== seat)) pass(game, seat);
  schedule(room, now);
  return true;
}

export function viewFor(room, token, code) {
  const seat = seatOf(room, token), game = room.game;
  const view = {
    t: "state", code, seat, host: room.host,
    seats: room.seats.map((s) => (s ? (s.connected ? "here" : "away") : "cpu")),
    playing: !!game && game.winner === null,
    deadline: room.deadline,
  };
  if (game) {
    Object.assign(view, {
      mode: game.mode, turn: game.turn, passed: game.passed, firstTurn: game.firstTurn, winner: game.winner,
      counts: game.hands.map((h) => h.length),
      table: game.lastCombo ? { cards: game.lastCombo.cards, name: comboName(game.lastCombo), seat: game.lastSeat } : null,
      hand: seat >= 0 ? game.hands[seat] : [],
    });
  }
  return view;
}

export function expired(room, now) { return now - room.touched > ROOM_LIFETIME_MS; }
