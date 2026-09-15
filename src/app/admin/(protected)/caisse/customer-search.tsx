"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/toast-provider";
import { createFlashCustomer, searchCustomers, type CustomerSearchResult } from "./actions";

export type CaisseCustomer = CustomerSearchResult;

export function CustomerSearch({
  selected,
  onSelect,
  onClear,
}: {
  selected: CaisseCustomer | null;
  onSelect: (customer: CaisseCustomer) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CaisseCustomer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, startSearchTransition] = useTransition();

  const { showToast } = useToast();
  const [showFlashForm, setShowFlashForm] = useState(false);
  const [flashFirstName, setFlashFirstName] = useState("");
  const [flashLastName, setFlashLastName] = useState("");
  const [flashPhone, setFlashPhone] = useState("");
  const [flashReferralCode, setFlashReferralCode] = useState("");
  const [flashError, setFlashError] = useState<string | null>(null);
  const [creating, startCreateTransition] = useTransition();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      return;
    }
    debounceRef.current = setTimeout(() => {
      startSearchTransition(async () => {
        const found = await searchCustomers(query);
        setResults(found);
        setShowResults(true);
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleCreateFlash() {
    setFlashError(null);
    startCreateTransition(async () => {
      const result = await createFlashCustomer(
        flashFirstName,
        flashLastName,
        flashPhone,
        flashReferralCode
      );
      if (!result.success) {
        setFlashError(result.error);
        return;
      }
      onSelect(result.customer);
      if (result.referralRegistered) {
        showToast("Compte créé · parrainage enregistré, bonus à la première commande.");
      }
      setShowFlashForm(false);
      setFlashFirstName("");
      setFlashLastName("");
      setFlashPhone("");
      setFlashReferralCode("");
      setQuery("");
      setResults([]);
    });
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-brand-light p-2 text-sm">
        <div>
          <p className="font-medium text-brand-dark">
            {selected.firstName} {selected.lastName}
          </p>
          <p className="text-xs text-brand-dark/70">
            {selected.points} pts · {selected.phone} · palier {selected.tierLabel}
            {selected.tierDiscountPercent > 0 && ` (-${selected.tierDiscountPercent}%)`}
            {selected.permanentDiscountPercent > 0 &&
              ` · remise perm. ${selected.permanentDiscountPercent}%`}
          </p>
        </div>
        <button onClick={onClear} className="text-xs text-brand-dark hover:underline">
          Retirer
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nom, prénom ou téléphone..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="flex-1 rounded-lg border border-border px-2 py-1.5 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <Button
          type="button"
          variant="secondary"
          className="!px-3 !py-1.5 text-xs"
          onClick={() => setShowFlashForm((v) => !v)}
        >
          + Client flash
        </Button>
      </div>

      {showResults && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-white shadow-md">
          {searching ? (
            <p className="px-3 py-2 text-xs text-muted">Recherche...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted">Aucun client trouvé.</p>
          ) : (
            <ul className="max-h-48 overflow-y-auto scrollbar-thin">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setShowResults(false);
                      setQuery("");
                      setResults([]);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <span>
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="text-xs text-muted">{c.phone}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showFlashForm && (
        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-dashed border-border bg-gray-50 p-3">
          <p className="text-xs font-medium text-muted">
            Création rapide (à compléter plus tard dans la fiche client)
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Prénom"
              value={flashFirstName}
              onChange={(e) => setFlashFirstName(e.target.value)}
              className="flex-1 rounded-lg border border-border px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Nom (optionnel)"
              value={flashLastName}
              onChange={(e) => setFlashLastName(e.target.value)}
              className="flex-1 rounded-lg border border-border px-2 py-1.5 text-sm"
            />
          </div>
          <input
            type="tel"
            placeholder="Téléphone"
            value={flashPhone}
            onChange={(e) => setFlashPhone(e.target.value)}
            className="rounded-lg border border-border px-2 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Code de parrainage (optionnel)"
            value={flashReferralCode}
            onChange={(e) => setFlashReferralCode(e.target.value)}
            className="rounded-lg border border-border px-2 py-1.5 text-sm uppercase"
          />
          {flashError && <p className="text-xs text-danger">{flashError}</p>}
          <Button
            type="button"
            className="!py-1.5 text-xs"
            onClick={handleCreateFlash}
            disabled={creating || !flashFirstName || !flashPhone}
          >
            {creating ? "Création..." : "Créer et associer"}
          </Button>
        </div>
      )}
    </div>
  );
}
