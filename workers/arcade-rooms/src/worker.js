// Friend rooms for the SnackPack arcade: one Durable Object per table.
import { DurableObject } from "cloudflare:workers";
import { createRoom, expired, join, leave, passTurn, playCards, sortHand, start, tick, viewFor } from "./room-logic.js";

const ORIGINS = new Set(["https://www.snackpackuniverse.com", "https://snackpackuniverse.com", "http://localhost:4191"]);
const CODE_LETTERS = "BCDFGHJKLMNPQRSTVWXZ";

function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CODE_LETTERS[b % CODE_LETTERS.length]).join("");
}

function cors(origin, response) {
  if (ORIGINS.has(origin)) response.headers.set("Access-Control-Allow-Origin", origin);
  return response;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return cors(origin, new Response(null, { status: 204, headers: { "Access-Control-Allow-Methods": "POST" } }));
    if (!ORIGINS.has(origin)) return new Response("Forbidden", { status: 403 });
    if (request.method === "POST" && url.pathname === "/rooms") {
      return cors(origin, Response.json({ code: makeCode() }));
    }
    const match = /^\/rooms\/([A-Z]{6})$/.exec(url.pathname);
    if (match && request.headers.get("Upgrade") === "websocket") {
      return env.ROOM.get(env.ROOM.idFromName(match[1])).fetch(request);
    }
    return new Response("Not found", { status: 404 });
  },
};

export class Room extends DurableObject {
  async fetch(request) {
    const url = new URL(request.url);
    const code = url.pathname.split("/").pop();
    const token = url.searchParams.get("token") || "";
    if (!/^[a-z0-9]{16,40}$/.test(token)) return new Response("Bad token", { status: 400 });
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ token, code });
    const room = (await this.ctx.storage.get("room")) || createRoom(Date.now());
    const result = join(room, token, Date.now());
    if (result.error) {
      pair[1].send(JSON.stringify({ t: "error", fatal: true, message: result.error }));
      pair[1].close(4000, "closed");
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    await this.save(room);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async webSocketMessage(socket, raw) {
    const { token } = socket.deserializeAttachment();
    const room = await this.ctx.storage.get("room");
    if (!room || typeof raw !== "string" || raw.length > 400) return;
    let message;
    try { message = JSON.parse(raw); } catch { return; }
    const now = Date.now();
    let result = {};
    if (message.t === "start") result = start(room, token, message.mode, now);
    else if (message.t === "play") result = playCards(room, token, message.ids, now);
    else if (message.t === "pass") result = passTurn(room, token, now);
    else if (message.t === "sort") sortHand(room, token);
    else return;
    if (result.error) { socket.send(JSON.stringify({ t: "error", message: result.error })); return; }
    await this.save(room);
  }

  async webSocketClose(socket) { await this.dropped(socket); }
  async webSocketError(socket) { await this.dropped(socket); }

  async dropped(socket) {
    const { token } = socket.deserializeAttachment();
    const stillHere = this.ctx.getWebSockets().some((s) => s !== socket && s.deserializeAttachment().token === token);
    if (stillHere) return;
    const room = await this.ctx.storage.get("room");
    if (!room) return;
    leave(room, token, Date.now());
    await this.save(room);
  }

  async alarm() {
    const room = await this.ctx.storage.get("room");
    if (!room) return;
    const now = Date.now();
    if (expired(room, now)) {
      for (const socket of this.ctx.getWebSockets()) socket.close(4001, "expired");
      await this.ctx.storage.deleteAll();
      return;
    }
    tick(room, now);
    await this.save(room);
  }

  async save(room) {
    await this.ctx.storage.put("room", room);
    const wake = room.deadline ?? room.touched + 2 * 60 * 60 * 1000 + 1000;
    await this.ctx.storage.setAlarm(wake);
    for (const socket of this.ctx.getWebSockets()) {
      const { token, code } = socket.deserializeAttachment();
      try { socket.send(JSON.stringify(viewFor(room, token, code))); } catch { /* the close handler tidies up */ }
    }
  }
}
