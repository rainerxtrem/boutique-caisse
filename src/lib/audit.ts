import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

type AuditInput = {
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
};

/** Records a sensitive admin action. Safe to call within or outside a transaction. */
export async function logAudit(
  client: Prisma.TransactionClient | typeof prisma,
  input: AuditInput
) {
  await client.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
    },
  });
}
