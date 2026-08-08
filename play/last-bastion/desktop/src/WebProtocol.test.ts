import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolve } from "node:path";
import { isAllowedDevelopmentUrl, resolveWebRequest } from "./WebProtocol.js";

describe("desktop web protocol", () => {
  const root = resolve("C:/games/last-bastion");

  it("maps only the published game prefix beneath its root", () => {
    assert.equal(resolveWebRequest(root, "last-bastion://game/play/last-bastion/"), resolve(root, "index.html"));
    assert.equal(resolveWebRequest(root, "last-bastion://game/play/last-bastion/game-assets/game.js"), resolve(root, "game-assets/game.js"));
    assert.equal(resolveWebRequest(root, "last-bastion://game/privacy"), null);
  });

  it("rejects traversal and malformed URL input", () => {
    assert.equal(resolveWebRequest(root, "last-bastion://game/play/last-bastion/%2e%2e/secrets.txt"), null);
    assert.equal(resolveWebRequest(root, "not a url"), null);
  });

  it("allows a loopback HTTP origin only for development", () => {
    assert.equal(isAllowedDevelopmentUrl("http://127.0.0.1:4173/play/last-bastion/"), true);
    assert.equal(isAllowedDevelopmentUrl("http://localhost:4173/play/last-bastion/"), true);
    assert.equal(isAllowedDevelopmentUrl("https://example.com/"), false);
    assert.equal(isAllowedDevelopmentUrl("file:///tmp/index.html"), false);
  });
});
