"use client";

import Link from "next/link";
import RouteGuard from "@/components/auth/RouteGuard";

const SECTIONS = [
  {
    href: "/admin/vehicules",
    title: "Véhicules",
    description:
      "Catalogue complet : créer, éditer, retirer un véhicule, basculer vente ↔ location.",
  },
  {
    href: "/admin/dossiers",
    title: "Dossiers",
    description:
      "Dossiers à instruire : valider, refuser (avec motif) ou demander un complément.",
  },
];

export default function AdminPage() {
  return (
    <RouteGuard roles={["GESTIONNAIRE", "ADMIN"]}>
      <main className="mx-auto max-w-6xl p-8">
        <h1 className="text-2xl font-bold">Back-office</h1>
        <p className="mt-2 text-foreground/70">
          Administration du catalogue et des dossiers clients.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-xl border border-foreground/10 p-6 transition-shadow hover:shadow-md"
            >
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-foreground/70">{s.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </RouteGuard>
  );
}
