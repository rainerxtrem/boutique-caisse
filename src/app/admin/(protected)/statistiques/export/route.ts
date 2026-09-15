import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth-staff";

function csvEscape(value: string) {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  await requireStaff();

  const orders = await prisma.order.findMany({
    include: { customer: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const header = [
    "Numero",
    "Date",
    "Source",
    "Statut",
    "Client",
    "Vendeur",
    "SousTotal",
    "Remise",
    "Total",
    "MoyenPaiement",
  ];

  const rows = orders.map((o) =>
    [
      o.number,
      o.createdAt.toISOString(),
      o.source,
      o.status,
      o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : "",
      o.user?.name ?? "",
      Number(o.subtotal).toFixed(2),
      Number(o.discountTotal).toFixed(2),
      Number(o.total).toFixed(2),
      o.paymentMethod ?? "",
    ]
      .map((v) => csvEscape(String(v)))
      .join(";")
  );

  const csv = [header.join(";"), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commandes.csv"`,
    },
  });
}
