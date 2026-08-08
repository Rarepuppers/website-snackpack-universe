import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolve } from "node:path";
import { desktopWebRoot } from "./DesktopPaths.js";

describe("desktop packaged paths", () => {
  it("reads staged web content from Electron resources when packaged", () => {
    assert.equal(desktopWebRoot({
      isPackaged: true,
      appPath: "C:/Games/Last Bastion/resources/app.asar",
      resourcesPath: "C:/Games/Last Bastion/resources",
    }), resolve("C:/Games/Last Bastion/resources/game"));
  });

  it("keeps source development rooted at the parent game directory", () => {
    assert.equal(desktopWebRoot({
      isPackaged: false,
      appPath: "C:/repo/last-bastion/desktop",
      resourcesPath: "C:/Program Files/node",
    }), resolve("C:/repo/last-bastion"));
  });

  it("honours the explicit test override in either mode", () => {
    assert.equal(desktopWebRoot({
      configuredRoot: "C:/qa/build",
      isPackaged: true,
      appPath: "ignored",
      resourcesPath: "ignored",
    }), resolve("C:/qa/build"));
  });
});
