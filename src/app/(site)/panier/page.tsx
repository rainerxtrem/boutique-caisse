import { getCurrentCustomer } from "@/lib/auth-customer";
import { isBirthdayPeriod, BIRTHDAY_DISCOUNT_PERCENT } from "@/lib/loyalty";
import { getAvailablePickupSlots } from "@/lib/pickup";
import { PanierClient } from "./panier-client";

export default async function PanierPage() {
  const customer = await getCurrentCustomer();
  const birthdayActive = customer ? isBirthdayPeriod(customer.birthDate) : false;
  const customerDiscountPercent =
    (customer ? Number(customer.permanentDiscountPercent) : 0) +
    (birthdayActive ? BIRTHDAY_DISCOUNT_PERCENT : 0);

  return (
    <PanierClient
      customerDiscountPercent={customerDiscountPercent}
      birthdayActive={birthdayActive}
      pickupDays={getAvailablePickupSlots()}
    />
  );
}
