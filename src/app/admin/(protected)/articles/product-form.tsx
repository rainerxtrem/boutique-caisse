"use client";

import { useActionState } from "react";
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import type { ProductFormState } from "./actions";

const initialState: ProductFormState = {};

export function ProductForm({
  action,
  categories,
  suppliers,
  relatedOptions,
  defaultValues,
  submitLabel,
}: {
  action: (
    prevState: ProductFormState,
    formData: FormData
  ) => Promise<ProductFormState>;
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  relatedOptions: { id: string; name: string }[];
  defaultValues?: {
    name: string;
    description: string;
    price: number;
    stock: number;
    sku: string;
    categoryId: string;
    supplierId: string;
    imageUrl: string;
    active: boolean;
    ingredients: string;
    allergens: string;
    prepTimeMinutes: number | null;
    temporarilyUnavailable: boolean;
    featured: boolean;
    flashPrice: number | null;
    flashPriceEndsAt: string;
    relatedIds: string[];
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card className="max-w-xl p-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Nom de l&apos;article</Label>
          <Input id="name" name="name" defaultValue={defaultValues?.name} required />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={defaultValues?.description}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Prix (€)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues?.price}
              required
            />
          </div>
          <div>
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              min="0"
              defaultValue={defaultValues?.stock}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku">Référence (SKU)</Label>
            <Input id="sku" name="sku" defaultValue={defaultValues?.sku} required />
          </div>
          <div>
            <Label htmlFor="categoryId">Catégorie</Label>
            <Select
              id="categoryId"
              name="categoryId"
              defaultValue={defaultValues?.categoryId}
            >
              <option value="">Aucune</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="imageUrl">URL image (optionnel)</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            defaultValue={defaultValues?.imageUrl}
            placeholder="https://..."
          />
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-sm font-semibold">Fiche produit</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="allergens">Allergènes</Label>
              <Input
                id="allergens"
                name="allergens"
                defaultValue={defaultValues?.allergens}
                placeholder="Gluten, lait..."
              />
            </div>
            <div>
              <Label htmlFor="prepTimeMinutes">Temps de préparation (min)</Label>
              <Input
                id="prepTimeMinutes"
                name="prepTimeMinutes"
                type="number"
                min="0"
                defaultValue={defaultValues?.prepTimeMinutes ?? undefined}
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="ingredients">Ingrédients</Label>
            <Textarea
              id="ingredients"
              name="ingredients"
              rows={2}
              defaultValue={defaultValues?.ingredients}
            />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-sm font-semibold">Fournisseur & produits complémentaires</p>
          <div>
            <Label htmlFor="supplierId">Fournisseur</Label>
            <Select id="supplierId" name="supplierId" defaultValue={defaultValues?.supplierId}>
              <option value="">Aucun</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-4">
            <Label htmlFor="relatedProductIds">
              Souvent acheté avec (Ctrl/Cmd + clic pour sélection multiple)
            </Label>
            <select
              id="relatedProductIds"
              name="relatedProductIds"
              multiple
              defaultValue={defaultValues?.relatedIds}
              className="h-32 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {relatedOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-sm font-semibold">Disponibilité & mise en avant</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={defaultValues?.active ?? true}
            />
            Article actif (visible sur le site)
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="temporarilyUnavailable"
              defaultChecked={defaultValues?.temporarilyUnavailable ?? false}
            />
            Rupture temporaire (masqué à la vente sans désactiver la fiche)
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={defaultValues?.featured ?? false}
            />
            Mettre en avant sur la page d&apos;accueil
          </label>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="flashPrice">Prix vente flash (€, optionnel)</Label>
              <Input
                id="flashPrice"
                name="flashPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={defaultValues?.flashPrice ?? undefined}
              />
            </div>
            <div>
              <Label htmlFor="flashPriceEndsAt">Fin de la vente flash</Label>
              <Input
                id="flashPriceEndsAt"
                name="flashPriceEndsAt"
                type="datetime-local"
                defaultValue={defaultValues?.flashPriceEndsAt}
              />
            </div>
          </div>
        </div>

        <FieldError>{state.error}</FieldError>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
