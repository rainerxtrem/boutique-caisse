// Store hours are hardcoded for now (no admin settings page for opening hours yet).
export const STORE_OPEN_HOUR = 9;
export const STORE_CLOSE_HOUR = 19;
export const SLOT_MINUTES = 30;
export const MIN_LEAD_MINUTES = 30;

export type PickupDay = {
  date: string; // yyyy-mm-dd
  label: string;
  slots: { value: string; label: string }[];
};

export function getAvailablePickupSlots(now: Date = new Date(), days = 2): PickupDay[] {
  const result: PickupDay[] = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + dayOffset);
    day.setHours(0, 0, 0, 0);

    const slots: { value: string; label: string }[] = [];
    const dayStart = new Date(day);
    dayStart.setHours(STORE_OPEN_HOUR, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(STORE_CLOSE_HOUR, 0, 0, 0);

    const earliest = new Date(now.getTime() + MIN_LEAD_MINUTES * 60 * 1000);

    for (
      let slot = new Date(dayStart);
      slot < dayEnd;
      slot = new Date(slot.getTime() + SLOT_MINUTES * 60 * 1000)
    ) {
      if (slot < earliest) continue;
      slots.push({
        value: slot.toISOString(),
        label: slot.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      });
    }

    if (slots.length > 0) {
      result.push({
        date: day.toISOString().slice(0, 10),
        label:
          dayOffset === 0
            ? "Aujourd'hui"
            : dayOffset === 1
              ? "Demain"
              : day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
        slots,
      });
    }
  }

  return result;
}
