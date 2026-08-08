import { isAbsolute, relative, resolve } from "node:path";

export const WEB_PATH_PREFIX = "/play/last-bastion/";

export function resolveWebRequest(root: string, requestUrl: string): string | null {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(requestUrl).pathname);
  } catch {
    return null;
  }
  if (!pathname.startsWith(WEB_PATH_PREFIX)) return null;
  const relativePath = pathname.slice(WEB_PATH_PREFIX.length) || "index.html";
  const candidate = resolve(root, relativePath);
  const fromRoot = relative(root, candidate);
  if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) return null;
  return candidate;
}

export function isAllowedDevelopmentUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost");
  } catch {
    return false;
  }
}
