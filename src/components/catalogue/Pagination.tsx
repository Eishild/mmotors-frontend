/**
 * Pagination (Server Component) : boutons précédent/suivant + indicateur de page.
 * Reçoit des href pré-calculés (conservant les filtres courants) ; rend un <Link>
 * actif ou un <span> grisé quand on est en bordure.
 */

import Link from "next/link";

function PageLink({
  href,
  disabled,
  label,
}: {
  href: string;
  disabled: boolean;
  label: string;
}) {
  const base = "rounded-lg border px-4 py-2 text-sm font-medium";
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={`${base} cursor-not-allowed border-foreground/10 text-foreground/30`}
      >
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`${base} border-foreground/15 transition-colors hover:bg-foreground/5`}
    >
      {label}
    </Link>
  );
}

export default function Pagination({
  page,
  totalPages,
  prevHref,
  nextHref,
}: {
  page: number;
  totalPages: number;
  prevHref: string;
  nextHref: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-10 flex items-center justify-center gap-4">
      <PageLink href={prevHref} disabled={page <= 1} label="← Précédent" />
      <span className="text-sm text-foreground/60">
        Page {page} / {totalPages}
      </span>
      <PageLink href={nextHref} disabled={page >= totalPages} label="Suivant →" />
    </nav>
  );
}
