import "server-only";
import { prisma } from "@/lib/db";

export type LoyaltyTier = {
  id: string;
  label: string;
  minPoints: number;
  perk: string;
  discountPercent: number;
};

const FALLBACK_TIER: LoyaltyTier = {
  id: "fallback",
  label: "Membre",
  minPoints: 0,
  perk: "Bienvenue dans le programme fidélité",
  discountPercent: 0,
};

/** Fetch all configured tiers, sorted by threshold. Falls back to a single default tier if none are configured. */
export async function getLoyaltyTiers(): Promise<LoyaltyTier[]> {
  const tiers = await prisma.loyaltyTier.findMany({ orderBy: { minPoints: "asc" } });
  return tiers.length > 0
    ? tiers.map((t) => ({ ...t, discountPercent: Number(t.discountPercent) }))
    : [FALLBACK_TIER];
}

/** Resolve a customer's current/next tier and progress from an already-fetched tier list. */
export function resolveTier(tiers: LoyaltyTier[], lifetimePoints: number) {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  let current = sorted[0];
  let currentIndex = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (lifetimePoints >= sorted[i].minPoints) {
      current = sorted[i];
      currentIndex = i;
    }
  }
  const next = sorted[currentIndex + 1] ?? null;
  return {
    current,
    next,
    pointsToNext: next ? Math.max(0, next.minPoints - lifetimePoints) : 0,
  };
}

/** Convenience helper for a single customer: fetches tiers then resolves. */
export async function getLoyaltyTier(lifetimePoints: number) {
  const tiers = await getLoyaltyTiers();
  return resolveTier(tiers, lifetimePoints);
}

export const BIRTHDAY_DISCOUNT_PERCENT = 10;
export const BIRTHDAY_WINDOW_DAYS = 7;

/** True when `now` falls within BIRTHDAY_WINDOW_DAYS of the customer's birth month/day. */
export function isBirthdayPeriod(birthDate: Date | null, now: Date = new Date()) {
  if (!birthDate) return false;
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
