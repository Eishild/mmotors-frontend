/**
 * Affichée lorsque `notFound()` est appelé depuis la fiche véhicule
 * (id inexistant → 404 renvoyé par l'API).
 */

import Link from "next/link";

export default function VehicleNotFound() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center justify-center p-8 py-24 text-center">
      <p className="text-5xl font-bold text-foreground/20">404</p>
      <h1 className="mt-4 text-2xl font-bold">Véhicule introuvable</h1>
      <p className="mt-2 text-foreground/60">
        Ce véhicule n&apos;existe pas ou n&apos;est plus disponible.
      </p>
      <Link
        href="/catalogue"
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-foreground px-6 py-3 text-base font-semibold text-background transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
      >
        ← Retour au catalogue
      </Link>
    </main>
  );
}
