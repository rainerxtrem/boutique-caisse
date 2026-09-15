import { CartProvider } from "@/components/cart-context";
import { SiteHeader } from "@/components/site-header";
import { getCustomerSession } from "@/lib/auth-customer";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCustomerSession();

  return (
    <CartProvider>
      <div className="no-print contents">
        <SiteHeader isLoggedIn={!!session} />
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="no-print border-t border-border bg-surface py-6">
        <div className="mx-auto max-w-6xl px-4 text-sm text-muted sm:px-6">
          © {new Date().getFullYear()} La Boutique — Retrait en boutique
          uniquement.
        </div>
      </footer>
    </CartProvider>
  );
}
