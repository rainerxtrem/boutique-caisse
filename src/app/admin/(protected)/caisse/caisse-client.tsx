"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { computeOrderPricing } from "@/lib/pricing";
import {
  completeSale,
  getCustomerRewardRedemptions,
  previewPromoCode,
  type CustomerRewardRedemption,
  type PaymentMethod,
} from "./actions";
import { CustomerSearch, type CaisseCustomer } from "./customer-search";

type RelatedProduct = { id: string; name: string; price: number };

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
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

const REGISTER_STORAGE_KEY = "caisse_register_label";

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string; icon: string }[] = [
  { method: "CARD", label: "Carte", icon: "▭" },
  { method: "CASH", label: "Espèces", icon: "●" },
  { method: "MIXED", label: "Mixte", icon: "◐" },
];

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
  const [customer, setCustomer] = useState<CaisseCustomer | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; type: "PERCENT" | "FIXED"; value: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checkingPromo, startPromoTransition] = useTransition();

  const [availableRewards, setAvailableRewards] = useState<CustomerRewardRedemption[]>([]);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [, startRewardsTransition] = useTransition();

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets stale reward selection whenever the ticket's customer changes
    setSelectedRewardId(null);
    if (!customer) {
      setAvailableRewards([]);
      return;
    }
    startRewardsTransition(async () => {
      const rewards = await getCustomerRewardRedemptions(customer.id);
      setAvailableRewards(rewards);
    });
  }, [customer]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeCategory === "Tout" || p.categoryName === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, search]);

  const customerDiscountPercent =
    (customer?.permanentDiscountPercent ?? 0) + (customer?.tierDiscountPercent ?? 0);

  const selectedReward = useMemo(
    () => availableRewards.find((r) => r.id === selectedRewardId) ?? null,
    [availableRewards, selectedRewardId]
  );

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
          rewardDiscount: selectedReward ? { type: selectedReward.type, value: selectedReward.value } : null,
          globalDiscountPercent: globalDiscount,
        }
      ),
    [lines, promo, customerDiscountPercent, selectedReward, globalDiscount]
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

  function updateQtyAt(index: number, delta: number) {
    setLines((prev) => {
      const next = [...prev];
      const line = next[index];
      if (!line) return prev;
      next[index] = { ...line, qty: Math.max(1, line.qty + delta) };
      return next;
    });
  }

  function updateDiscountAt(index: number, value: number) {
    setLines((prev) => {
      const next = [...prev];
      const line = next[index];
      if (!line) return prev;
      next[index] = { ...line, discountPercent: Math.min(100, Math.max(0, value)) };
      return next;
    });
  }

  function removeLineAt(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex((prev) =>
      prev === null ? null : prev === index ? null : prev > index ? prev - 1 : prev
    );
  }

  function updateSelectedQty(delta: number) {
    if (selectedIndex === null) return;
    updateQtyAt(selectedIndex, delta);
  }

  function updateSelectedDiscount(value: number) {
    if (selectedIndex === null) return;
    updateDiscountAt(selectedIndex, value);
  }

  function removeSelectedLine() {
    if (selectedIndex === null) return;
    removeLineAt(selectedIndex);
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
    setSelectedRewardId(null);
    setAvailableRewards([]);
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
    if (
      !customer &&
      !window.confirm("Aucun client n'est associé à cet achat, confirmez-vous la vente ?")
    ) {
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
        registerLabel || null,
        selectedRewardId
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
  }, [selectedIndex, lines, pricing.total, paymentMethod, receivedAmount, customer, promo, globalDiscount, registerLabel, selectedRewardId]);

  const selectedLine = selectedIndex !== null ? lines[selectedIndex] : null;

  return (
    <div className="grid h-[calc(100vh-6rem)] grid-cols-1 gap-4 lg:grid-cols-[1fr_440px]">
      {/* Products */}
      <div className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              ⌕
            </span>
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Rechercher un article... (F2)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <input
            type="text"
            value={registerLabel}
            onChange={(e) => setRegisterLabel(e.target.value)}
            title="Nom du poste de caisse"
            className="w-28 shrink-0 rounded-lg border border-border bg-white px-2 py-2.5 text-xs font-medium text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <Link
            href="/admin/caisse/retours"
            className="shrink-0 rounded-lg border border-border bg-white px-3 py-2.5 text-xs font-medium text-muted hover:bg-gray-50"
          >
            ↩ Retours
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("Tout")}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === "Tout"
                ? "bg-brand text-white shadow-sm"
                : "bg-gray-100 text-muted hover:bg-gray-200"
            }`}
          >
            Tout
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-brand text-white shadow-sm"
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
          {filteredProducts.map((p) => {
            const lowStock = p.stock > 0 && p.stock <= 5;
            return (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                disabled={p.stock <= 0 || p.temporarilyUnavailable}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md active:translate-y-0 active:shadow-sm disabled:pointer-events-none disabled:opacity-40"
              >
                <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded-lg bg-brand-light text-lg font-semibold text-brand-dark">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    p.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <span className="text-sm font-medium leading-tight">{p.name}</span>
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-semibold text-brand-dark">
                    {formatPrice(p.price)}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                      p.temporarilyUnavailable
                        ? "bg-gray-100 text-muted"
                        : lowStock
                          ? "bg-amber-100 text-amber-800"
                          : "text-muted"
                    }`}
                  >
                    {p.temporarilyUnavailable ? "Indispo." : `Stock: ${p.stock}`}
                  </span>
                </div>
              </button>
            );
          })}
          {filteredProducts.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted">
              Aucun article.
            </p>
          )}
        </div>
      </div>

      {/* Ticket */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border p-4">
          <p className="text-xs uppercase tracking-wide text-muted">
            Vendeur · {registerLabel}
          </p>
          <p className="font-medium">{vendeurName}</p>

          <div className="mt-3">
            <CustomerSearch
              selected={customer}
              onSelect={setCustomer}
              onClear={() => setCustomer(null)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 py-10 text-center text-muted">
              <span className="text-2xl">🛒</span>
              <p className="text-sm">Ticket vide — sélectionnez un article</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {lines.map((line, i) => {
                const gross = line.unitPrice * line.qty;
                const lineTotal = gross - gross * (line.discountPercent / 100);
                return (
                  <li
                    key={line.productId}
                    onClick={() => setSelectedIndex(i)}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors ${
                      selectedIndex === i ? "bg-brand-light" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{line.name}</p>
                      {line.discountPercent > 0 && (
                        <p className="text-xs text-brand-dark">-{line.discountPercent}% remise</p>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => updateQtyAt(i, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-white text-sm hover:bg-gray-100"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-medium">{line.qty}</span>
                      <button
                        onClick={() => updateQtyAt(i, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-white text-sm hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <span className="w-20 shrink-0 text-right text-sm font-semibold">
                      {formatPrice(lineTotal)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLineAt(i);
                      }}
                      className="shrink-0 text-muted hover:text-danger"
                      aria-label="Supprimer la ligne"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selectedLine && (
          <div className="border-t border-border bg-gray-50 p-3">
            <div className="flex items-center gap-2">
              <p className="flex-1 truncate text-xs font-medium text-muted">
                Remise sur : {selectedLine.name}
              </p>
              <input
                type="number"
                min={0}
                max={100}
                value={selectedLine.discountPercent}
                onChange={(e) => updateSelectedDiscount(Number(e.target.value))}
                className="w-16 rounded-lg border border-border px-2 py-1.5 text-sm"
              />
              <span className="text-xs text-muted">% remise</span>
            </div>
          </div>
        )}

        {customer && availableRewards.length > 0 && (
          <div className="border-t border-border p-3">
            <p className="mb-2 text-xs font-medium text-muted">Récompenses disponibles</p>
            <div className="flex flex-wrap gap-2">
              {availableRewards.map((r) => {
                const active = selectedRewardId === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRewardId(active ? null : r.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-brand/40 bg-brand-light text-brand-dark hover:bg-brand/10"
                    }`}
                  >
                    {r.type === "PERCENT" ? `-${r.value}%` : `-${formatPrice(r.value)}`} · {r.rewardName}
                    {active && " ✓"}
                  </button>
                );
              })}
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

          <div className="mt-3 flex flex-col gap-1 text-sm text-muted">
            <div className="flex items-center justify-between">
              <span>Sous-total</span>
              <span>{formatPrice(pricing.subtotal)}</span>
            </div>
            {pricing.promoDiscount > 0 && (
              <div className="flex items-center justify-between">
                <span>Remise code promo</span>
                <span>-{formatPrice(pricing.promoDiscount)}</span>
              </div>
            )}
            {pricing.customerDiscount > 0 && (
              <div className="flex items-center justify-between">
                <span>Remise fidélité client</span>
                <span>-{formatPrice(pricing.customerDiscount)}</span>
              </div>
            )}
            {pricing.rewardDiscount > 0 && (
              <div className="flex items-center justify-between text-brand-dark">
                <span>Récompense appliquée</span>
                <span>-{formatPrice(pricing.rewardDiscount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
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
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-light px-4 py-3">
            <span className="text-sm font-medium text-brand-dark">Total</span>
            <span className="text-2xl font-bold text-brand-dark">{formatPrice(pricing.total)}</span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {PAYMENT_OPTIONS.map(({ method, label, icon }) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors ${
                  paymentMethod === method
                    ? "border-brand bg-brand-light text-brand-dark ring-1 ring-brand"
                    : "border-border bg-white text-muted hover:bg-gray-50"
                }`}
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
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
