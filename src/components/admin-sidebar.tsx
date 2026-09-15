"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Tableau de bord", icon: "◧" },
  { href: "/admin/caisse", label: "Caisse", icon: "▤" },
  { href: "/admin/caisse/cloture", label: "Clôture de caisse", icon: "▣" },
  { href: "/admin/commandes", label: "Commandes web", icon: "▥" },
  { href: "/admin/clients", label: "Clients fidélité", icon: "◐" },
  { href: "/admin/articles", label: "Articles", icon: "▦" },
  { href: "/admin/fournisseurs", label: "Fournisseurs", icon: "▧" },
  { href: "/admin/promotions", label: "Codes promo", icon: "◈" },
  { href: "/admin/bannieres", label: "Bannières", icon: "▬" },
  { href: "/admin/recompenses", label: "Récompenses", icon: "◆" },
  { href: "/admin/statistiques", label: "Statistiques", icon: "▩" },
];

const ADMIN_ONLY_LINKS = [
  { href: "/admin/fidelite", label: "Paliers fidélité", icon: "★" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "◎" },
  { href: "/admin/audit", label: "Journal d'audit", icon: "▤" },
];

export function AdminSidebar({
  staffName,
  isAdmin,
}: {
  staffName: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, ...ADMIN_ONLY_LINKS] : LINKS;

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-[#12151b] text-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-bold">
          B
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">La Boutique</p>
          <p className="text-xs text-white/40">Back-office</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map((link) => {
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
