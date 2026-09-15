"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { completeSale, findCustomerByPhone } from "./actions";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryName: string | null;
};

type TicketLine = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  discountPercent: number;
};

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  points: number;
};

export function CaisseClient({
  products,
  categories,
  vendeurName,
}: {
  products: Product[];
  categories: string[];
  vendeurName: string;
}) {
  const [lines, setLines] = useState<TicketLine[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | "Tout">("Tout");
  const [search, setSearch] = useState("");
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<{ number: string; total: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const [searchingCustomer, startCustomerTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeCategory === "Tout" || p.categoryName === activeCategory;
      const matchesSearch = p.name
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, search]);

  const subtotal = lines.reduce((sum, l) => {
    const gross = l.unitPrice * l.qty;
    return sum + gross - gross * (l.discountPercent / 100);
  }, 0);
  const discountAmount = subtotal * (globalDiscount / 100);
  const total = Math.max(0, subtotal - discountAmount);

  function addProduct(product: Product) {
    setLastReceipt(null);
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        setSelectedIndex(idx);
        return next;
      }
      setSelectedIndex(prev.length);
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          qty: 1,
          unitPrice: product.price,
          discountPercent: 0,
        },
      ];
    });
  }

  function updateSelectedQty(delta: number) {
    if (selectedIndex === null) return;
    setLines((prev) => {
      const next = [...prev];
      const line = next[selectedIndex];
      if (!line) return prev;
      const qty = Math.max(1, line.qty + delta);
      next[selectedIndex] = { ...line, qty };
      return next;
    });
  }

  function updateSelectedDiscount(value: number) {
    if (selectedIndex === null) return;
    setLines((prev) => {
      const next = [...prev];
      const line = next[selectedIndex];
      if (!line) return prev;
      next[selectedIndex] = {
        ...line,
        discountPercent: Math.min(100, Math.max(0, value)),
      };
      return next;
    });
  }

  function removeSelectedLine() {
    if (selectedIndex === null) return;
    setLines((prev) => prev.filter((_, i) => i !== selectedIndex));
    setSelectedIndex(null);
  }

  function clearTicket() {
    setLines([]);
    setSelectedIndex(null);
    setGlobalDiscount(0);
    setCustomer(null);
    setSaleError(null);
  }

  function handleFindCustomer() {
    setCustomerError(null);
    startCustomerTransition(async () => {
      const found = await findCustomerByPhone(phoneInput);
      if (!found) {
        setCustomerError("Aucun client trouvé pour ce numéro.");
        setCustomer(null);
        return;
      }
      setCustomer({
        id: found.id,
        firstName: found.firstName,
        lastName: found.lastName,
        phone: found.phone,
        points: found.points,
      });
    });
  }

  function handleValidate() {
    setSaleError(null);
    startTransition(async () => {
      const result = await completeSale(
        lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          discountPercent: l.discountPercent,
        })),
        customer?.id ?? null,
        globalDiscount
      );
      if (!result.success) {
        setSaleError(result.error);
        return;
      }
      setLastReceipt({ number: result.orderNumber, total: result.total });
      setLines([]);
      setSelectedIndex(null);
      setGlobalDiscount(0);
      setCustomer(null);
      setPhoneInput("");
    });
  }

  const selectedLine = selectedIndex !== null ? lines[selectedIndex] : null;

  return (
    <div className="grid h-[calc(100vh-6rem)] grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
      {/* Products */}
      <div className="flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-surface p-4">
        <input
          type="search"
          placeholder="Rechercher un article..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <div className="flex flex-wrap gap-2">
          {["Tout", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as typeof activeCategory)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                activeCategory === cat
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-muted hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto scrollbar-thin sm:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addProduct(p)}
              disabled={p.stock <= 0}
              className="flex flex-col items-start gap-1 rounded-xl border border-border bg-white p-3 text-left transition hover:border-brand hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="text-sm font-medium leading-tight">{p.name}</span>
              <span className="text-sm font-semibold text-brand-dark">
                {formatPrice(p.price)}
              </span>
              <span className="text-xs text-muted">Stock: {p.stock}</span>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted">
              Aucun article.
            </p>
          )}
        </div>
      </div>

      {/* Ticket */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Vendeur</p>
          <p className="font-medium">{vendeurName}</p>

          <div className="mt-3">
            {customer ? (
              <div className="flex items-center justify-between rounded-lg bg-brand-light p-2 text-sm">
                <div>
                  <p className="font-medium text-brand-dark">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="text-xs text-brand-dark/70">
                    {customer.points} pts · {customer.phone}
                  </p>
                </div>
                <button
                  onClick={() => setCustomer(null)}
                  className="text-xs text-brand-dark hover:underline"
                >
                  Retirer
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Tél. client (fidélité)"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="flex-1 rounded-lg border border-border px-2 py-1.5 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <Button
                  variant="secondary"
                  className="!px-3 !py-1.5 text-xs"
                  onClick={handleFindCustomer}
                  disabled={searchingCustomer || !phoneInput}
                >
                  Associer
                </Button>
              </div>
            )}
            {customerError && (
              <p className="mt-1 text-xs text-danger">{customerError}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2 text-left">Produit</th>
                <th className="px-3 py-2 text-center">Qté</th>
                <th className="px-3 py-2 text-right">Remise</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => {
                const gross = line.unitPrice * line.qty;
                const lineTotal = gross - gross * (line.discountPercent / 100);
                return (
                  <tr
                    key={line.productId}
                    onClick={() => setSelectedIndex(i)}
                    className={`cursor-pointer border-b border-border ${
                      selectedIndex === i ? "bg-brand-light" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-3 py-2">{line.name}</td>
                    <td className="px-3 py-2 text-center">{line.qty}</td>
                    <td className="px-3 py-2 text-right">
                      {line.discountPercent > 0 ? `${line.discountPercent}%` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatPrice(lineTotal)}
                    </td>
                  </tr>
                );
              })}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-muted">
                    Ticket vide — sélectionnez un article
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedLine && (
          <div className="border-t border-border bg-gray-50 p-3">
            <p className="mb-2 text-xs font-medium text-muted">
              Ligne sélectionnée : {selectedLine.name}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateSelectedQty(-1)}
                className="h-8 w-8 rounded-lg border border-border bg-white hover:bg-gray-100"
              >
                −
              </button>
              <span className="w-6 text-center text-sm">{selectedLine.qty}</span>
              <button
                onClick={() => updateSelectedQty(1)}
                className="h-8 w-8 rounded-lg border border-border bg-white hover:bg-gray-100"
              >
                +
              </button>
              <input
                type="number"
                min={0}
                max={100}
                value={selectedLine.discountPercent}
                onChange={(e) => updateSelectedDiscount(Number(e.target.value))}
                className="w-16 rounded-lg border border-border px-2 py-1.5 text-sm"
              />
              <span className="text-xs text-muted">% remise</span>
              <button
                onClick={removeSelectedLine}
                className="ml-auto text-xs font-medium text-danger hover:underline"
              >
                Supprimer la ligne
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Sous-total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted">
              Remise totale
              <input
                type="number"
                min={0}
                max={100}
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                className="w-14 rounded-lg border border-border px-1.5 py-1 text-xs"
              />
              %
            </span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xl font-semibold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          {saleError && <p className="mt-2 text-sm text-danger">{saleError}</p>}
          {lastReceipt && (
            <p className="mt-2 text-sm text-brand-dark">
              Vente {lastReceipt.number} enregistrée —{" "}
              {formatPrice(lastReceipt.total)}
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={clearTicket} disabled={pending}>
              Annuler tout
            </Button>
            <Button
              onClick={handleValidate}
              disabled={pending || lines.length === 0}
            >
              {pending ? "Validation..." : "Valider la vente"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
