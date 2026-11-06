// node --test workers/arcade-rooms/test/rooms.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { canBeat, identifyCombo } from "../src/thirteen.js";
import { CPU_DELAY_MS, RECONNECT_GRACE_MS, TURN_LIMIT_MS, createRoom, join, leave, passTurn, playCards, start, tick, viewFor } from "../src/room-logic.js";

const C = (value, suit) => ({ value, suit, id: `${value}-${suit}` });

test("rules match the page", () => {
  assert.equal(identifyCombo([C(5, 0), C(6, 1), C(7, 2)], "standard").type, "sequence");
  assert.equal(identifyCombo([C(1, 0), C(2, 1), C(3, 2)], "standard"), null);
  const two = identifyCombo([C(2, 3)], "standard");
  assert.ok(canBeat(identifyCombo([C(8, 0), C(8, 1), C(8, 2), C(8, 3)], "standard"), two, "standard"));
  assert.ok(!canBeat(identifyCombo([C(1, 3)], "standard"), two, "standard"));
});

test("lobby: fifth player is refused, host moves on leaving", () => {
  const room = createRoom(0);
  ["a", "b", "c", "d"].forEach((t) => assert.ok(join(room, t, 0).seat >= 0));
  assert.match(join(room, "e", 0).error, /full/);
  leave(room, "a", 1);
  assert.equal(room.host, 1);
  assert.match(start(room, "c", "standard", 2).error, /host/);
});

test("nobody joins a running game; seat holders can return", () => {
  const room = createRoom(0);
  join(room, "a", 0);
  start(room, "a", "standard", 1);
  assert.match(join(room, "z", 2).error, /started/);
  leave(room, "a", 3);
  assert.equal(join(room, "a", 4).seat, 0);
  assert.equal(room.seats[0].connected, true);
});

test("views never show another player's cards", () => {
  const room = createRoom(0);
  join(room, "a", 0); join(room, "b", 0);
  start(room, "a", "standard", 1);
  const a = viewFor(room, "a", "ABCDEF"), b = viewFor(room, "b", "ABCDEF");
  assert.equal(a.hand.length, 13);
  assert.ok(a.hand.every((card) => !b.hand.some((x) => x.id === card.id)));
  assert.ok(!JSON.stringify(a).includes('"hands"'));
  assert.ok(!JSON.stringify(a).includes('"token"'));
  assert.deepEqual(a.counts, [13, 13, 13, 13]);
});

test("cheating is refused", () => {
  const room = createRoom(0);
  join(room, "a", 0); join(room, "b", 0);
  start(room, "a", "standard", 1);
  const turnSeat = room.game.turn;
  const human = turnSeat === 0 ? "a" : turnSeat === 1 ? "b" : null;
  const other = human === "a" ? "b" : "a";
  const stolen = room.game.hands[(room.seats.findIndex((s) => s.token === other))][0].id;
  assert.match(playCards(room, other, [stolen], 2).error, /turn/);
  if (human) {
    assert.match(playCards(room, human, [stolen], 2).error, /valid/);
    const first = room.game.hands[turnSeat].find((c) => !(c.value === 3 && c.suit === 0));
    assert.match(playCards(room, human, [first.id], 2).error, /3♠/);
    assert.match(passTurn(room, human, 2).error, /lead/);
    const opening = room.game.hands[turnSeat].find((c) => c.value === 3 && c.suit === 0);
    assert.match(playCards(room, human, [opening.id, opening.id], 2).error, /valid/);
  }
});

test("a disconnected player is covered after the grace period and can return", () => {
  const room = createRoom(0);
  join(room, "a", 0); join(room, "b", 0);
  start(room, "a", "standard", 1);
  let now = 1;
  while (room.game.turn !== 0) { now += CPU_DELAY_MS + TURN_LIMIT_MS; tick(room, now); if (room.game.winner !== null) return; }
  leave(room, "a", now);
  assert.equal(tick(room, now + RECONNECT_GRACE_MS - 1), false);
  assert.equal(room.game.turn, 0);
  assert.equal(tick(room, now + RECONNECT_GRACE_MS), true);
  assert.notEqual(room.game.turn, 0);
  join(room, "a", now + RECONNECT_GRACE_MS + 1);
  assert.equal(room.seats[0].connected, true);
});

test("idle players time out, and full games always finish", () => {
  for (let i = 0; i < 300; i++) {
    const room = createRoom(0);
    ["a", "b"].forEach((t) => join(room, t, 0));
    start(room, "a", i % 2 ? "classic" : "standard", 1);
    let now = 1, steps = 0;
    while (room.game.winner === null && steps < 3000) {
      now = room.deadline;
      assert.ok(Number.isFinite(now), "a running game always has a deadline");
      tick(room, now);
      steps++;
    }
    assert.notEqual(room.game.winner, null, "game finished");
    assert.equal(room.deadline, null);
    assert.equal(room.game.hands[room.game.winner].length, 0);
  }
});
