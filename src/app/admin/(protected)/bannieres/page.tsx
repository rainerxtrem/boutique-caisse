import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { BannerForm } from "./banner-form";
import { createBanner } from "./actions";

export default async function BanneresPage() {
  const banners = await prisma.banner.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Bannières d&apos;accueil</h1>
        <p className="text-sm text-muted">
          La bannière active avec le plus petit ordre s&apos;affiche en haut de
          la page d&apos;accueil du site.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          {banners.length === 0 ? (
            <EmptyState
              icon="box"
              title="Aucune bannière"
              description="Le site affichera le message de bienvenue par défaut."
            />
          ) : (
            banners.map((banner) => (
              <Card key={banner.id} className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{banner.title}</span>
                    <Badge tone={banner.active ? "brand" : "muted"}>
                      {banner.active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge tone="muted">Ordre {banner.order}</Badge>
                  </div>
                  <Link
                    href={`/admin/bannieres/${banner.id}`}
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    Modifier
                  </Link>
                </div>
                {banner.subtitle && <p className="text-sm text-muted">{banner.subtitle}</p>}
              </Card>
            ))
          )}
        </div>

        <Card className="h-fit p-6">
          <h2 className="mb-3 font-semibold">Nouvelle bannière</h2>
          <BannerForm action={createBanner} submitLabel="Créer la bannière" />
        </Card>
      </div>
    </div>
  );
}
