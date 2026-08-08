import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

export const LOCAL_SAVE_KEY = "last-bastion-save";
export const MAX_LOCAL_SAVE_BYTES = 8 * 1024 * 1024;

export interface AtomicSavePaths {
  readonly directory: string;
  readonly primary: string;
  readonly backup: string;
  readonly temporary: string;
}

export function atomicSavePaths(userDataDirectory: string): AtomicSavePaths {
  const directory = join(userDataDirectory, "saves");
  return {
    directory,
    primary: join(directory, "last-bastion-save.json"),
    backup: join(directory, "last-bastion-save.backup.json"),
    temporary: join(directory, "last-bastion-save.tmp.json"),
  };
}

export function assertLocalSaveKey(value: unknown): asserts value is typeof LOCAL_SAVE_KEY {
  if (value !== LOCAL_SAVE_KEY) throw new TypeError("Invalid Last Bastion local save key");
}

export function assertLocalSaveValue(value: unknown): asserts value is string {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") > MAX_LOCAL_SAVE_BYTES) {
    throw new TypeError("Invalid Last Bastion local save value");
  }
  try {
    JSON.parse(value);
  } catch {
    throw new TypeError("Last Bastion local save must be valid JSON");
  }
}

function readValidJson(path: string): string | null {
  if (!existsSync(path)) return null;
  try {
    const value = readFileSync(path, "utf8");
    assertLocalSaveValue(value);
    return value;
  } catch {
    return null;
  }
}

function writeDurably(path: string, value: string): void {
  writeFileSync(path, value, { encoding: "utf8", flag: "w" });
  const descriptor = openSync(path, "r");
  try {
    try {
      fsyncSync(descriptor);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      // Some managed/network Windows filesystems reject fsync despite having
      // completed the write. Atomic rename still protects file integrity.
      if (code !== "EPERM" && code !== "ENOTSUP" && code !== "EINVAL") throw error;
    }
  } finally {
    closeSync(descriptor);
  }
}

export class AtomicSaveStorage {
  readonly paths: AtomicSavePaths;

  constructor(userDataDirectory: string) {
    this.paths = atomicSavePaths(userDataDirectory);
  }

  getItem(key: string): string | null {
    assertLocalSaveKey(key);
    return readValidJson(this.paths.primary) ?? readValidJson(this.paths.backup);
  }

  setItem(key: string, value: string): void {
    assertLocalSaveKey(key);
    assertLocalSaveValue(value);
    mkdirSync(this.paths.directory, { recursive: true });
    rmSync(this.paths.temporary, { force: true });
    try {
      writeDurably(this.paths.temporary, value);
      if (readValidJson(this.paths.primary) !== null) {
        rmSync(this.paths.backup, { force: true });
        renameSync(this.paths.primary, this.paths.backup);
      } else {
        rmSync(this.paths.primary, { force: true });
      }
      renameSync(this.paths.temporary, this.paths.primary);
    } finally {
      rmSync(this.paths.temporary, { force: true });
    }
  }
}
