export type LoyaltyTierKey = "BRONZE" | "ARGENT" | "OR";

export const LOYALTY_TIERS: {
  key: LoyaltyTierKey;
  label: string;
  minPoints: number;
  perk: string;
}[] = [
  { key: "BRONZE", label: "Bronze", minPoints: 0, perk: "Bienvenue dans le programme fidélité" },
  { key: "ARGENT", label: "Argent", minPoints: 100, perk: "Offres anniversaire renforcées" },
  { key: "OR", label: "Or", minPoints: 300, perk: "Accès prioritaire aux ventes flash" },
];

export function getLoyaltyTier(lifetimePoints: number) {
  const sorted = [...LOYALTY_TIERS].sort((a, b) => b.minPoints - a.minPoints);
  const current = sorted.find((t) => lifetimePoints >= t.minPoints) ?? LOYALTY_TIERS[0];
  const currentIndex = LOYALTY_TIERS.findIndex((t) => t.key === current.key);
  const next = LOYALTY_TIERS[currentIndex + 1] ?? null;
  return {
    current,
    next,
    pointsToNext: next ? Math.max(0, next.minPoints - lifetimePoints) : 0,
  };
}

export const BIRTHDAY_DISCOUNT_PERCENT = 10;
export const BIRTHDAY_WINDOW_DAYS = 7;

/** True when `now` falls within BIRTHDAY_WINDOW_DAYS of the customer's birth month/day. */
export function isBirthdayPeriod(birthDate: Date, now: Date = new Date()) {
  const year = now.getFullYear();
  const candidates = [year - 1, year, year + 1].map(
    (y) => new Date(y, birthDate.getMonth(), birthDate.getDate())
  );
  const dayMs = 24 * 60 * 60 * 1000;
  return candidates.some(
    (d) => Math.abs(now.getTime() - d.getTime()) <= BIRTHDAY_WINDOW_DAYS * dayMs
  );
}

export const REFERRAL_BONUS_POINTS = 50;
