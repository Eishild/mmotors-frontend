"use client";

import RouteGuard from "@/components/auth/RouteGuard";
import MyDossiersList from "@/components/dossiers/MyDossiersList";
import { useAuth } from "@/context/AuthContext";

function CompteContent() {
  const { user } = useAuth();
  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-bold">Espace client</h1>
      <p className="mt-2 text-foreground/70">
        Bienvenue {user?.firstName} {user?.lastName}.
      </p>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Mes dossiers</h2>
        <MyDossiersList />
      </section>
    </main>
  );
}

export default function ComptePage() {
  return (
    <RouteGuard>
      <CompteContent />
    </RouteGuard>
  );
}
