import { PERMISSIONS } from "@/lib/permission-catalog";

const CATEGORY_ORDER = ["Aperçu", "Vente", "Clients", "Catalogue", "Marketing", "Administration"];

export function PermissionCheckboxes({ selected = [] }: { selected?: string[] }) {
  const selectedSet = new Set(selected);
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: PERMISSIONS.filter((p) => p.category === category),
  }));

  return (
    <div className="flex flex-col gap-4">
      {grouped.map((group) => (
        <div key={group.category}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {group.category}
          </p>
          <div className="flex flex-col gap-1.5">
            {group.items.map((perm) => (
              <label key={perm.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="permissions"
                  value={perm.key}
                  defaultChecked={selectedSet.has(perm.key)}
                />
                {perm.label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
