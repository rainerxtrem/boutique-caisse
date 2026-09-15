"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { computeOrderPricing } from "@/lib/pricing";
import {
  completeSale,
  findCustomerByPhone,
  previewPromoCode,
  type PaymentMethod,
} from "./actions";

type RelatedProduct = { id: string; name: string; price: number };

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryName: string | null;
  temporarilyUnavailable: boolean;
  relatedProducts: RelatedProduct[];
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
  permanentDiscountPercent: number;
};

const REGISTER_STORAGE_KEY = "caisse_register_label";

export function CaisseClient({
  products,
  categories,
  vendeurName,
}: {
  products: Product[];
  categories: string[];
  vendeurName: string;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<TicketLine[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | "Tout">("Tout");
  const [search, setSearch] = useState("");
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [searchingCustomer, startCustomerTransition] = useTransition();

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; type: "PERCENT" | "FIXED"; value: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checkingPromo, startPromoTransition] = useTransition();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  const [amountReceived, setAmountReceived] = useState<string>("");

  const [registerLabel, setRegisterLabel] = useState("Caisse 1");
  const [suggestion, setSuggestion] = useState<RelatedProduct[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REGISTER_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount
      if (saved) setRegisterLabel(saved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(REGISTER_STORAGE_KEY, registerLabel);
    } catch {
      // ignore
    }
  }, [registerLabel]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeCategory === "Tout" || p.categoryName === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, search]);

  const customerDiscountPercent =
    (customer?.permanentDiscountPercent ?? 0);

  const pricing = useMemo(
    () =>
      computeOrderPricing(
        lines.map((l) => ({
          unitPrice: l.unitPrice,
          qty: l.qty,
          discountPercent: l.discountPercent,
        })),
        {
          promoCode: promo,
          customerDiscountPercent,
          globalDiscountPercent: globalDiscount,
        }
      ),
    [lines, promo, customerDiscountPercent, globalDiscount]
  );

  const receivedAmount = Number(amountReceived) || 0;
  const change = paymentMethod !== "CARD" ? Math.max(0, receivedAmount - pricing.total) : 0;

  function addProduct(product: Product) {
    if (product.temporarilyUnavailable) return;
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
    setSuggestion(product.relatedProducts.length > 0 ? product.relatedProducts : []);
  }

  function updateSelectedQty(delta: number) {
    if (selectedIndex === null) return;
    setLines((prev) => {
      const next = [...prev];
      const line = next[selectedIndex];
      if (!line) return prev;
      next[selectedIndex] = { ...line, qty: Math.max(1, line.qty + delta) };
      return next;
    });
  }

  function updateSelectedDiscount(value: number) {
    if (selectedIndex === null) return;
    setLines((prev) => {
      const next = [...prev];
      const line = next[selectedIndex];
      if (!line) return prev;
      next[selectedIndex] = { ...line, discountPercent: Math.min(100, Math.max(0, value)) };
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
    setPromo(null);
    setPromoInput("");
    setPromoError(null);
    setAmountReceived("");
    setSuggestion([]);
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
        permanentDiscountPercent: Number(found.permanentDiscountPercent),
      });
    });
  }

  function handleCheckPromo() {
    setPromoError(null);
    if (!promoInput.trim()) {
      setPromo(null);
      return;
    }
    startPromoTransition(async () => {
      const result = await previewPromoCode(promoInput, pricing.subtotal);
      if (!result.ok) {
        setPromoError(result.error);
        setPromo(null);
        return;
      }
      setPromo({ code: promoInput.trim().toUpperCase(), ...result.promo });
    });
  }

  function handleValidate() {
    setSaleError(null);
    if (paymentMethod !== "CARD" && receivedAmount < pricing.total) {
      setSaleError("Le montant reçu est inférieur au total.");
      return;
    }
    startTransition(async () => {
      const result = await completeSale(
        lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          discountPercent: l.discountPercent,
        })),
        customer?.id ?? null,
        globalDiscount,
        promo?.code ?? null,
        {
          method: paymentMethod,
          amountPaid: paymentMethod === "CARD" ? pricing.total : receivedAmount,
        },
        registerLabel || null
      );
      if (!result.success) {
        setSaleError(result.error);
        return;
      }
      clearTicket();
      router.push(`/admin/caisse/recu/${result.orderNumber}`);
    });
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);

      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleValidate();
        return;
      }
      if (isTyping) return;
      if (e.key === "Escape") {
        setSelectedIndex(null);
      } else if (e.key === "+" ) {
        updateSelectedQty(1);
      } else if (e.key === "-") {
        updateSelectedQty(-1);
      } else if (e.key === "Delete") {
        removeSelectedLine();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, lines, pricing.total, paymentMethod, receivedAmount, customer, promo, globalDiscount, registerLabel]);

  const selectedLine = selectedIndex !== null ? lines[selectedIndex] : null;

  return (
    <div className="grid h-[calc(100vh-6rem)] grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
      {/* Products */}
      <div className="flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Rechercher un article... (F2)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <input
            type="text"
            value={registerLabel}
            onChange={(e) => setRegisterLabel(e.target.value)}
            title="Nom du poste de caisse"
            className="w-28 shrink-0 rounded-lg border border-border bg-white px-2 py-2 text-xs text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
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

        {suggestion.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-brand/40 bg-brand-light p-2 text-xs">
            <span className="font-medium text-brand-dark">Souvent acheté avec :</span>
            {suggestion.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  const full = products.find((p) => p.id === r.id);
                  if (full) addProduct(full);
                }}
                className="rounded-full bg-white px-2 py-1 font-medium text-brand-dark hover:bg-brand/10"
              >
                + {r.name}
              </button>
            ))}
            <button
              onClick={() => setSuggestion([])}
              className="ml-auto text-brand-dark/60 hover:text-brand-dark"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto scrollbar-thin sm:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addProduct(p)}
              disabled={p.stock <= 0 || p.temporarilyUnavailable}
              className="flex flex-col items-start gap-1 rounded-xl border border-border bg-white p-3 text-left transition hover:border-brand hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="text-sm font-medium leading-tight">{p.name}</span>
              <span className="text-sm font-semibold text-brand-dark">
                {formatPrice(p.price)}
              </span>
              <span className="text-xs text-muted">
                {p.temporarilyUnavailable ? "Indisponible" : `Stock: ${p.stock}`}
              </span>
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
          <p className="text-xs uppercase tracking-wide text-muted">
            Vendeur · {registerLabel}
          </p>
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
                    {customer.permanentDiscountPercent > 0 &&
                      ` · remise perm. ${customer.permanentDiscountPercent}%`}
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
            {customerError && <p className="mt-1 text-xs text-danger">{customerError}</p>}
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
                Suppr. (Del)
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Code promo"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              className="flex-1 rounded-lg border border-border px-2 py-1.5 text-sm uppercase focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <Button
              variant="secondary"
              className="!px-3 !py-1.5 text-xs"
              onClick={handleCheckPromo}
              disabled={checkingPromo}
            >
              Appliquer
            </Button>
          </div>
          {promoError && <p className="mt-1 text-xs text-danger">{promoError}</p>}
          {promo && (
            <p className="mt-1 text-xs text-brand-dark">
              Code {promo.code} appliqué (
              {promo.type === "PERCENT" ? `-${promo.value}%` : `-${formatPrice(promo.value)}`})
            </p>
          )}

          <div className="mt-3 flex items-center justify-between text-sm text-muted">
            <span>Sous-total</span>
            <span>{formatPrice(pricing.subtotal)}</span>
          </div>
          {pricing.promoDiscount > 0 && (
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Remise code promo</span>
              <span>-{formatPrice(pricing.promoDiscount)}</span>
            </div>
          )}
          {pricing.customerDiscount > 0 && (
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Remise fidélité client</span>
              <span>-{formatPrice(pricing.customerDiscount)}</span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted">
              Remise totale (manuelle)
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
            <span>-{formatPrice(pricing.globalDiscount)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xl font-semibold">
            <span>Total</span>
            <span>{formatPrice(pricing.total)}</span>
          </div>

          <div className="mt-3 flex gap-2">
            {(["CARD", "CASH", "MIXED"] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
                  paymentMethod === method
                    ? "border-brand bg-brand-light text-brand-dark"
                    : "border-border bg-white text-muted hover:bg-gray-50"
                }`}
              >
                {method === "CARD" ? "Carte" : method === "CASH" ? "Espèces" : "Mixte"}
              </button>
            ))}
          </div>
          {paymentMethod !== "CARD" && (
            <div className="mt-2 flex items-center justify-between gap-2 text-sm">
              <label className="flex items-center gap-2 text-muted">
                Montant reçu
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-24 rounded-lg border border-border px-2 py-1.5 text-sm"
                />
              </label>
              <span className="font-medium">
                Rendu : {formatPrice(change)}
              </span>
            </div>
          )}

          {saleError && <p className="mt-2 text-sm text-danger">{saleError}</p>}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={clearTicket} disabled={pending}>
              Annuler tout
            </Button>
            <Button
              onClick={handleValidate}
              disabled={pending || lines.length === 0}
            >
              {pending ? "Validation..." : "Valider (Ctrl+↵)"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
