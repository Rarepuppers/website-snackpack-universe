import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const desktopRoot = resolve(import.meta.dirname, "..");

describe("desktop packaging assets", () => {
  it("wires each platform to a source-controlled application icon", () => {
    const packageJson = JSON.parse(readFileSync(resolve(desktopRoot, "package.json"), "utf8")) as {
      description?: string;
      author?: string;
      build?: { win?: { icon?: string }; mac?: { icon?: string }; linux?: { icon?: string } };
    };
    assert.equal(packageJson.description, "Desktop host for the Last Bastion science-fiction survival game.");
    assert.equal(packageJson.author, "SnackPack Universe");
    assert.equal(packageJson.build?.win?.icon, "packaging-assets/icon.ico");
    assert.equal(packageJson.build?.mac?.icon, "packaging-assets/icon.icns");
    assert.equal(packageJson.build?.linux?.icon, "packaging-assets/icon.png");
  });

  it("retains a square source and a seven-resolution Windows ICO", () => {
    const source = readFileSync(resolve(desktopRoot, "packaging-assets/icon-source.png"));
    assert.equal(source.subarray(1, 4).toString("ascii"), "PNG");
    assert.equal(source.readUInt32BE(16), source.readUInt32BE(20));

    const windowsIcon = readFileSync(resolve(desktopRoot, "packaging-assets/icon.ico"));
    assert.equal(windowsIcon.readUInt16LE(0), 0);
    assert.equal(windowsIcon.readUInt16LE(2), 1);
    assert.equal(windowsIcon.readUInt16LE(4), 7);
  });

  it("keeps valid Linux PNG and macOS ICNS derivatives", () => {
    const linuxIcon = readFileSync(resolve(desktopRoot, "packaging-assets/icon.png"));
    assert.equal(linuxIcon.subarray(1, 4).toString("ascii"), "PNG");
    assert.equal(linuxIcon.readUInt32BE(16), 512);
    assert.equal(linuxIcon.readUInt32BE(20), 512);

    const macIcon = readFileSync(resolve(desktopRoot, "packaging-assets/icon.icns"));
    assert.equal(macIcon.subarray(0, 4).toString("ascii"), "icns");
  });
});
