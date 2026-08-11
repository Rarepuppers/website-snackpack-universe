/**
 * Playable-slice threat ladder. Keep this deliberately narrow until the first
 * five observed runs validate that the modifiers are readable and fair.
 */
export type ThreatTier = 0 | 1 | 2;

export interface ThreatTierDefinition {
  tier: ThreatTier;
  name: string;
  modifier: string;
  /** Ordinary combat nodes finish with this extra rank fight. */
  elitePatrols: boolean;
  /** Number of sequential elite patrol waves appended to ordinary combat nodes. */
  elitePatrolCount: 0 | 1 | 2;
  /** Multiplies spawn-pulse frequency without changing threat budgets. */
  spawnCadenceMultiplier: number;
}

export const THREAT_TIERS: readonly ThreatTierDefinition[] = Object.freeze([
  Object.freeze({
    tier: 0,
    name: "STANDARD",
    modifier: "No threat modifiers.",
    elitePatrols: false,
    elitePatrolCount: 0,
    spawnCadenceMultiplier: 1,
  }),
  Object.freeze({
    tier: 1,
    name: "ELITE PATROLS",
    modifier: "Ordinary combat nodes end with an elite patrol.",
    elitePatrols: true,
    elitePatrolCount: 1,
    spawnCadenceMultiplier: 1,
  }),
  Object.freeze({
    tier: 2,
    name: "RAPID INCURSION",
    modifier: "Enemy spawn pulses arrive 20% faster and combat nodes end with two distinct elite patrols.",
    elitePatrols: true,
    elitePatrolCount: 2,
    spawnCadenceMultiplier: 1.2,
  }),
]);

export function normalizeThreatTier(value: unknown): ThreatTier {
  return value === 1 || value === 2 ? value : 0;
}

export function threatTierDefinition(tier: ThreatTier): ThreatTierDefinition {
  return THREAT_TIERS[tier]!;
}

export type ThreatTierVictories = Readonly<Record<ThreatTier, number>>;

export function unlockedThreatTiers(victories: ThreatTierVictories): readonly ThreatTier[] {
  const unlocked: ThreatTier[] = [0];
  if (victories[0] > 0) unlocked.push(1);
  if (victories[0] > 0 && victories[1] > 0) unlocked.push(2);
  return Object.freeze(unlocked);
}
