import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  searchParams,
  basePath,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      if (typeof value === "string" && value) params.set(key, value);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex items-center justify-center gap-3 py-2 text-sm">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        className={`rounded-lg border border-border px-3 py-1.5 ${
          page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-gray-50"
        }`}
      >
        ← Précédent
      </Link>
      <span className="text-muted">
        Page {page} / {totalPages}
      </span>
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        className={`rounded-lg border border-border px-3 py-1.5 ${
          page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-gray-50"
        }`}
      >
        Suivant →
      </Link>
    </div>
  );
}
