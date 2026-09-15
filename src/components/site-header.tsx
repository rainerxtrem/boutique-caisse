"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-context";

const NAV = [
  { href: "/", label: "Catalogue" },
  { href: "/favoris", label: "Favoris" },
  { href: "/fidelite", label: "Espace fidélité" },
];

export function SiteHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const { totalItems, openDrawer } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-bold text-white">
            B
          </span>
          <span className="text-lg font-semibold tracking-tight">
            La Boutique
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-brand-light text-brand-dark"
                  : "text-muted hover:bg-gray-100 hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={isLoggedIn ? "/fidelite" : "/connexion"}
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-gray-100 hover:text-foreground sm:block"
          >
            {isLoggedIn ? "Mon compte" : "Connexion"}
          </Link>
          <button
            onClick={openDrawer}
            className="relative inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Panier
            {totalItems > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold text-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
