"use client";

import { use } from "react";
import Link from "next/link";
import RouteGuard from "@/components/auth/RouteGuard";
import VehicleForm from "@/components/admin/VehicleForm";

export default function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <RouteGuard roles={["GESTIONNAIRE", "ADMIN"]}>
      <main className="mx-auto max-w-3xl p-8">
        <Link
          href="/admin/vehicules"
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← Gestion des véhicules
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Éditer le véhicule</h1>
        <VehicleForm vehicleId={id} />
      </main>
    </RouteGuard>
  );
}
