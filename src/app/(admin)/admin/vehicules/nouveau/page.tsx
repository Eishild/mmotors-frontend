"use client";

import Link from "next/link";
import RouteGuard from "@/components/auth/RouteGuard";
import VehicleForm from "@/components/admin/VehicleForm";

export default function NewVehiclePage() {
  return (
    <RouteGuard roles={["GESTIONNAIRE", "ADMIN"]}>
      <main className="mx-auto max-w-3xl p-8">
        <Link
          href="/admin/vehicules"
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← Gestion des véhicules
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nouveau véhicule</h1>
        <VehicleForm />
      </main>
    </RouteGuard>
  );
}
