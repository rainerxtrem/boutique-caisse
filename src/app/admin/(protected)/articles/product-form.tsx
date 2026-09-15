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
  defaultValues,
  submitLabel,
}: {
  action: (
    prevState: ProductFormState,
    formData: FormData
  ) => Promise<ProductFormState>;
  categories: { id: string; name: string }[];
  defaultValues?: {
    name: string;
    description: string;
    price: number;
    stock: number;
    sku: string;
    categoryId: string;
    imageUrl: string;
    active: boolean;
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaultValues?.active ?? true}
          />
          Article actif (visible sur le site)
        </label>
        <FieldError>{state.error}</FieldError>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
