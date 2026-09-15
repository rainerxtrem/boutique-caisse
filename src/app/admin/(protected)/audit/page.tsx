import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { Badge, Card, Input } from "@/components/ui";
import { LiveSearchInput } from "@/components/live-search-input";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/format";
import { parsePage, paginationSkipTake, totalPages } from "@/lib/pagination";
import { requirePermission } from "@/lib/permissions";

export default async function AuditPage({
  searchParams,
}: PageProps<"/admin/audit">) {
  await requirePermission("audit.view");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const page = parsePage(params.page);

  const where = q
    ? {
        OR: [
          { summary: { contains: q, mode: "insensitive" as const } },
          { actorName: { contains: q, mode: "insensitive" as const } },
          { entityType: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [logs, count] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...paginationSkipTake(page, 40),
    }),
    prisma.auditLog.count({ where }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Journal d&apos;audit</h1>
        <p className="text-sm text-muted">
          Historique des actions sensibles (suppressions, remboursements,
          modifications de remises...).
        </p>
      </div>

      <Suspense fallback={<Input placeholder="Rechercher..." disabled />}>
        <div className="max-w-sm">
          <LiveSearchInput placeholder="Rechercher (personne, type, description)..." />
        </div>
      </Suspense>

      {logs.length === 0 ? (
        <EmptyState icon="search" title="Aucune entrée" description="Rien à afficher pour ce filtre." />
      ) : (
        <>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Auteur</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Détail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-border hover:bg-gray-50">
                    <td className="px-4 py-3 text-muted">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">{log.actorName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone="muted">{log.entityType}</Badge>
                    </td>
                    <td className="px-4 py-3">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination
            page={page}
            totalPages={totalPages(count, 40)}
            searchParams={params}
            basePath="/admin/audit"
          />
        </>
      )}
    </div>
  );
}
