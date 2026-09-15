"use client";

import { Select } from "@/components/ui";

const SORT_OPTIONS = [
  { value: "nom", label: "Nom (A-Z)" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
] as const;

export function CatalogFilters({
  sort,
  onlyInStock,
}: {
  sort: string;
  onlyInStock: boolean;
}) {
  return (
    <>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          name="dispo"
          value="stock"
          defaultChecked={onlyInStock}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
        En stock uniquement
      </label>
      <Select
        name="tri"
        defaultValue={sort}
        className="w-auto"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </>
  );
}
