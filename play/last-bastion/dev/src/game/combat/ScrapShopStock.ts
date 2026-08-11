/** Selects a deterministic wrapping window so every authored stock entry remains reachable. */
export function rotatingWindow<T>(entries: readonly T[], size: number, offset: number): readonly T[] {
  if (entries.length === 0 || size <= 0) return [];
  if (entries.length <= size) return entries;
  const start = ((offset % entries.length) + entries.length) % entries.length;
  const window: T[] = [];
  for (let step = 0; step < size; step += 1) {
    window.push(entries[(start + step) % entries.length]!);
  }
  return window;
}
