import "server-only";
import { prisma } from "@/lib/db";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 8) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export async function generateUniqueRedemptionCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const existing = await prisma.rewardRedemption.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Impossible de générer un code d'échange unique.");
}
