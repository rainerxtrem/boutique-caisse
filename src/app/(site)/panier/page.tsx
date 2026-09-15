import { getCurrentCustomer } from "@/lib/auth-customer";
import { isBirthdayPeriod, BIRTHDAY_DISCOUNT_PERCENT, getLoyaltyTiers, resolveTier } from "@/lib/loyalty";
import { getAvailablePickupSlots } from "@/lib/pickup";
import { PanierClient } from "./panier-client";

export default async function PanierPage() {
  const customer = await getCurrentCustomer();
  const birthdayActive = customer ? isBirthdayPeriod(customer.birthDate) : false;
  const tierDiscountPercent = customer
    ? resolveTier(await getLoyaltyTiers(), customer.lifetimePoints).current.discountPercent
    : 0;
  const customerDiscountPercent =
    (customer ? Number(customer.permanentDiscountPercent) : 0) +
    tierDiscountPercent +
    (birthdayActive ? BIRTHDAY_DISCOUNT_PERCENT : 0);

  return (
    <PanierClient
      customerDiscountPercent={customerDiscountPercent}
      birthdayActive={birthdayActive}
      pickupDays={getAvailablePickupSlots()}
    />
  );
}
