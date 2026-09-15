"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createCustomerSession } from "@/lib/auth-customer";

export type LoginState = { error?: string };

export async function loginWithPhone(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const phone = String(formData.get("phone") ?? "").trim();

  if (!phone) {
    return { error: "Veuillez saisir un numéro de téléphone." };
  }

  const customer = await prisma.customer.findUnique({ where: { phone } });

  if (!customer) {
    return {
      error:
        "Aucun compte fidélité trouvé pour ce numéro. Créez votre compte en boutique pour commander en ligne.",
    };
  }

  await createCustomerSession(customer.id);
  redirect("/fidelite");
}
