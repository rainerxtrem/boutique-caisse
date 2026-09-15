import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Button, Card, Input, Label } from "@/components/ui";
import { requirePermission } from "@/lib/permissions";

export default async function RetoursCaissePage({
  searchParams,
}: PageProps<"/admin/caisse/retours">) {
  await requirePermission("caisse.retours");
  const params = await searchParams;
  const numero = typeof params.numero === "string" ? params.numero.trim() : "";

  let notFoundMessage: string | null = null;

  if (numero) {
    const order = await prisma.order.findUnique({
      where: { number: numero.toUpperCase() },
    });
    if (order) {
      redirect(`/admin/commandes/${order.id}`);
    }
    notFoundMessage = `Aucun ticket trouvé pour le numéro "${numero}".`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/caisse" className="text-sm text-muted hover:text-foreground">
          ← Retour à la caisse
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Retours / remboursements</h1>
        <p className="text-sm text-muted">
          Saisissez le numéro d&apos;un ticket (caisse ou commande web) pour le
          retrouver et traiter un retour.
        </p>
      </div>

      <Card className="max-w-md p-6">
        <form className="flex flex-col gap-4">
          <div>
            <Label htmlFor="numero">Numéro de ticket</Label>
            <Input
              id="numero"
              name="numero"
              placeholder="CAI-000123 ou CMD-000123"
              defaultValue={numero}
              autoFocus
              required
            />
          </div>
          <Button type="submit">Rechercher</Button>
        </form>
        {notFoundMessage && (
          <p className="mt-3 text-sm text-danger">{notFoundMessage}</p>
        )}
      </Card>
    </div>
  );
}
