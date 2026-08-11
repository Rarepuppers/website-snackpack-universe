/** Maps one already-consumed unit RNG value onto an authored weighted candidate index. */
export function selectWeightedOfferIndex(
  weights: readonly number[],
  randomUnit: number,
): number {
  if (weights.length === 0) return -1;
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = randomUnit * total;
  let index = 0;
  while (index < weights.length - 1) {
    roll -= weights[index]!;
    if (roll <= 0) break;
    index += 1;
  }
  return index;
}
