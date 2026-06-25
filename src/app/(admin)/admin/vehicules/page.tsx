"use client";

import Link from "next/link";
import RouteGuard from "@/components/auth/RouteGuard";
import AdminVehiclesList from "@/components/admin/AdminVehiclesList";

export default function AdminVehiclesPage() {
  return (
    <RouteGuard roles={["GESTIONNAIRE", "ADMIN"]}>
      <main className="mx-auto max-w-6xl p-8">
        <Link href="/admin" className="text-sm text-foreground/60 hover:text-foreground">
          ← Back-office
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Gestion des véhicules</h1>
        <p className="mt-1 text-foreground/70">
          Créer, éditer, retirer un véhicule et basculer vente ↔ location.
        </p>
        <AdminVehiclesList />
      </main>
    </RouteGuard>
  );
}
