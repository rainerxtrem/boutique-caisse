"use client";

import { useActionState } from "react";
import { Button, FieldError, Input, Label } from "@/components/ui";
import type { BannerFormState } from "./actions";

const initialState: BannerFormState = {};

export function BannerForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: BannerFormState, formData: FormData) => Promise<BannerFormState>;
  defaultValues?: {
    title: string;
    subtitle: string;
    imageUrl: string;
    ctaLabel: string;
    ctaHref: string;
    active: boolean;
    order: number;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="title">Titre</Label>
        <Input id="title" name="title" defaultValue={defaultValues?.title} required />
      </div>
      <div>
        <Label htmlFor="subtitle">Sous-titre</Label>
        <Input id="subtitle" name="subtitle" defaultValue={defaultValues?.subtitle} />
      </div>
      <div>
        <Label htmlFor="imageUrl">Image de fond (URL, optionnel)</Label>
        <Input id="imageUrl" name="imageUrl" defaultValue={defaultValues?.imageUrl} placeholder="https://..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ctaLabel">Texte du bouton</Label>
          <Input id="ctaLabel" name="ctaLabel" defaultValue={defaultValues?.ctaLabel} placeholder="Voir le catalogue" />
        </div>
        <div>
          <Label htmlFor="ctaHref">Lien du bouton</Label>
          <Input id="ctaHref" name="ctaHref" defaultValue={defaultValues?.ctaHref} placeholder="/" />
        </div>
      </div>
      <div>
        <Label htmlFor="order">Ordre d&apos;affichage</Label>
        <Input id="order" name="order" type="number" defaultValue={defaultValues?.order ?? 0} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={defaultValues?.active ?? true} />
        Bannière active
      </label>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : submitLabel}
      </Button>
    </form>
  );
}
