type EmptyIcon = "cart" | "box" | "search" | "heart";

const ICONS: Record<EmptyIcon, React.ReactNode> = {
  cart: (
    <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none">
      <circle cx="32" cy="32" r="30" className="fill-brand-light" />
      <path
        d="M18 22h4l3 20a3 3 0 0 0 3 2.5h14a3 3 0 0 0 3-2.5l2.5-14H24"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand-dark"
      />
      <circle cx="27" cy="48" r="2.5" className="fill-brand-dark" />
      <circle cx="39" cy="48" r="2.5" className="fill-brand-dark" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none">
      <circle cx="32" cy="32" r="30" className="fill-brand-light" />
      <path
        d="M20 26l12-6 12 6v14l-12 6-12-6V26z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        className="text-brand-dark"
      />
      <path
        d="M20 26l12 6 12-6M32 32v14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand-dark"
      />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none">
      <circle cx="32" cy="32" r="30" className="fill-brand-light" />
      <circle
        cx="29"
        cy="29"
        r="10"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-brand-dark"
      />
      <path
        d="M36.5 36.5L44 44"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-brand-dark"
      />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none">
      <circle cx="32" cy="32" r="30" className="fill-brand-light" />
      <path
        d="M32 44s-12-7.5-12-16a7 7 0 0 1 12-4.9A7 7 0 0 1 44 28c0 8.5-12 16-12 16z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        className="text-brand-dark"
      />
    </svg>
  ),
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: EmptyIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-white py-16 text-center">
      {ICONS[icon]}
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}
