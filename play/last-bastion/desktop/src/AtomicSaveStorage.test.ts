import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { AtomicSaveStorage, LOCAL_SAVE_KEY, MAX_LOCAL_SAVE_BYTES } from "./AtomicSaveStorage.js";

const temporaryDirectories: string[] = [];

function storage(): AtomicSaveStorage {
  const directory = mkdtempSync(join(tmpdir(), "last-bastion-save-test-"));
  temporaryDirectories.push(directory);
  return new AtomicSaveStorage(directory);
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("atomic desktop save storage", () => {
  it("returns null before the first save and writes a valid primary", () => {
    const target = storage();
    assert.equal(target.getItem(LOCAL_SAVE_KEY), null);
    target.setItem(LOCAL_SAVE_KEY, '{"revision":1}');
    assert.equal(target.getItem(LOCAL_SAVE_KEY), '{"revision":1}');
    assert.equal(readFileSync(target.paths.primary, "utf8"), '{"revision":1}');
    assert.equal(existsSync(target.paths.temporary), false);
  });

  it("rotates one known-good backup on replacement", () => {
    const target = storage();
    target.setItem(LOCAL_SAVE_KEY, '{"revision":1}');
    target.setItem(LOCAL_SAVE_KEY, '{"revision":2}');
    assert.equal(readFileSync(target.paths.primary, "utf8"), '{"revision":2}');
    assert.equal(readFileSync(target.paths.backup, "utf8"), '{"revision":1}');
  });

  it("falls back to the backup when the primary is corrupt", () => {
    const target = storage();
    target.setItem(LOCAL_SAVE_KEY, '{"revision":1}');
    target.setItem(LOCAL_SAVE_KEY, '{"revision":2}');
    writeFileSync(target.paths.primary, "{broken", "utf8");
    assert.equal(target.getItem(LOCAL_SAVE_KEY), '{"revision":1}');
  });

  it("does not overwrite a good backup with a corrupt primary", () => {
    const target = storage();
    target.setItem(LOCAL_SAVE_KEY, '{"revision":1}');
    target.setItem(LOCAL_SAVE_KEY, '{"revision":2}');
    writeFileSync(target.paths.primary, "{broken", "utf8");
    target.setItem(LOCAL_SAVE_KEY, '{"revision":3}');
    assert.equal(readFileSync(target.paths.primary, "utf8"), '{"revision":3}');
    assert.equal(readFileSync(target.paths.backup, "utf8"), '{"revision":1}');
  });

  it("rejects arbitrary keys, malformed JSON, and oversized payloads", () => {
    const target = storage();
    assert.throws(() => target.getItem("../other-save"), /local save key/);
    assert.throws(() => target.setItem(LOCAL_SAVE_KEY, "broken"), /valid JSON/);
    assert.throws(() => target.setItem(LOCAL_SAVE_KEY, JSON.stringify("x".repeat(MAX_LOCAL_SAVE_BYTES))), /local save value/);
  });
});
