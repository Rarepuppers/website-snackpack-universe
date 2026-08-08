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
export const CLOUD_SYNC_METADATA_KEY = "last-bastion-cloud-sync";
export const MAX_LOCAL_SAVE_BYTES = 8 * 1024 * 1024;
export type LocalSaveKey = typeof LOCAL_SAVE_KEY | typeof CLOUD_SYNC_METADATA_KEY;

export interface AtomicSavePaths {
  readonly directory: string;
  readonly primary: string;
  readonly backup: string;
  readonly temporary: string;
}

export function atomicSavePaths(
  userDataDirectory: string,
  key: LocalSaveKey = LOCAL_SAVE_KEY,
): AtomicSavePaths {
  const directory = join(userDataDirectory, "saves");
  const stem = key;
  return {
    directory,
    primary: join(directory, `${stem}.json`),
    backup: join(directory, `${stem}.backup.json`),
    temporary: join(directory, `${stem}.tmp.json`),
  };
}

export function assertLocalSaveKey(value: unknown): asserts value is LocalSaveKey {
  if (value !== LOCAL_SAVE_KEY && value !== CLOUD_SYNC_METADATA_KEY) {
    throw new TypeError("Invalid Last Bastion local save key");
  }
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
  readonly metadataPaths: AtomicSavePaths;

  constructor(userDataDirectory: string) {
    this.paths = atomicSavePaths(userDataDirectory);
    this.metadataPaths = atomicSavePaths(userDataDirectory, CLOUD_SYNC_METADATA_KEY);
  }

  getItem(key: string): string | null {
    assertLocalSaveKey(key);
    const paths = this.pathsForKey(key);
    return readValidJson(paths.primary) ?? readValidJson(paths.backup);
  }

  setItem(key: string, value: string): void {
    assertLocalSaveKey(key);
    assertLocalSaveValue(value);
    const paths = this.pathsForKey(key);
    mkdirSync(paths.directory, { recursive: true });
    rmSync(paths.temporary, { force: true });
    try {
      writeDurably(paths.temporary, value);
      if (readValidJson(paths.primary) !== null) {
        rmSync(paths.backup, { force: true });
        renameSync(paths.primary, paths.backup);
      } else {
        rmSync(paths.primary, { force: true });
      }
      renameSync(paths.temporary, paths.primary);
    } finally {
      rmSync(paths.temporary, { force: true });
    }
  }

  private pathsForKey(key: LocalSaveKey): AtomicSavePaths {
    return key === CLOUD_SYNC_METADATA_KEY ? this.metadataPaths : this.paths;
  }
}
