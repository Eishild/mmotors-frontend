"use client";

import Link from "next/link";
import RouteGuard from "@/components/auth/RouteGuard";
import AdminDossiersList from "@/components/admin/AdminDossiersList";

export default function AdminDossiersPage() {
  return (
    <RouteGuard roles={["GESTIONNAIRE", "ADMIN"]}>
      <main className="mx-auto max-w-5xl p-8">
        <Link href="/admin" className="text-sm text-foreground/60 hover:text-foreground">
          ← Back-office
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Dossiers à instruire</h1>
        <p className="mt-1 text-foreground/70">
          Valider, refuser (motif obligatoire) ou demander un complément.
        </p>
        <AdminDossiersList />
      </main>
    </RouteGuard>
  );
}
