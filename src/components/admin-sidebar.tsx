"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
  icon: string;
  permission: string | string[];
};

function linkAllowed(link: NavLink, permissions: Set<string>) {
  const keys = Array.isArray(link.permission) ? link.permission : [link.permission];
  return keys.some((key) => permissions.has(key));
}

const SECTIONS: { title: string; links: NavLink[] }[] = [
  {
    title: "Aperçu",
    links: [
      { href: "/admin", label: "Tableau de bord", icon: "◧", permission: "dashboard.view" },
      { href: "/admin/statistiques", label: "Statistiques", icon: "▩", permission: "statistiques.view" },
    ],
  },
  {
    title: "Vente",
    links: [
      { href: "/admin/caisse", label: "Caisse", icon: "▤", permission: "caisse.use" },
      { href: "/admin/caisse/cloture", label: "Clôture de caisse", icon: "▣", permission: "caisse.cloture" },
      { href: "/admin/commandes", label: "Commandes web", icon: "▥", permission: "commandes.view" },
    ],
  },
  {
    title: "Clients",
    links: [
      { href: "/admin/clients", label: "Clients fidélité", icon: "◐", permission: "clients.view" },
      { href: "/admin/fidelite", label: "Paliers fidélité", icon: "★", permission: "fidelite.manage_tiers" },
      {
        href: "/admin/recompenses",
        label: "Récompenses",
        icon: "◆",
        permission: ["recompenses.manage", "recompenses.fulfill"],
      },
    ],
  },
  {
    title: "Catalogue",
    links: [
      { href: "/admin/articles", label: "Articles", icon: "▦", permission: "articles.view" },
      { href: "/admin/fournisseurs", label: "Fournisseurs", icon: "▧", permission: "fournisseurs.manage" },
    ],
  },
  {
    title: "Marketing",
    links: [
      { href: "/admin/promotions", label: "Codes promo", icon: "◈", permission: "promotions.manage" },
      { href: "/admin/bannieres", label: "Bannières", icon: "▬", permission: "bannieres.manage" },
    ],
  },
  {
    title: "Administration",
    links: [
      { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "◎", permission: "utilisateurs.manage" },
      { href: "/admin/roles", label: "Rôles", icon: "⚙", permission: "roles.manage" },
      { href: "/admin/audit", label: "Journal d'audit", icon: "▤", permission: "audit.view" },
    ],
  },
];

export function AdminSidebar({
  staffName,
  permissions,
}: {
  staffName: string;
  permissions: Set<string>;
}) {
  const pathname = usePathname();

  const visibleSections = SECTIONS.map((section) => ({
    ...section,
    links: section.links.filter((link) => linkAllowed(link, permissions)),
  })).filter((section) => section.links.length > 0);

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col overflow-y-auto scrollbar-thin border-r border-white/10 bg-[#12151b] text-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-bold">
          B
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">La Boutique</p>
          <p className="text-xs text-white/40">Back-office</p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 px-3 pb-3">
        {visibleSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-white/35">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.links.map((link) => {
                const active =
                  link.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-brand text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="w-4 text-center">{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-sm font-medium">{staffName}</p>
        <Link
          href="/"
          target="_blank"
          className="text-xs text-white/40 hover:text-white/70"
        >
          Voir le site public ↗
        </Link>
      </div>
    </aside>
  );
}
