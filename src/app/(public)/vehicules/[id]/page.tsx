/**
 * Fiche véhicule — Server Component.
 *
 * Rendu serveur pour le SEO (HTML complet : titre, prix, description, métadonnées
 * `generateMetadata`). Le fetch est isolé sous un <Suspense> pour afficher un
 * skeleton pendant le chargement sans masquer le fil d'Ariane. La seule partie
 * interactive (sélection de la photo) est déléguée au Client Component
 * `VehicleGallery`.
 *
 * Cas gérés :
 * - 404 → `notFound()` (page « Véhicule introuvable » via not-found.tsx local).
 * - autre erreur API / réseau → encart d'erreur propre.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VehicleGallery from "@/components/vehicules/VehicleGallery";
import { ApiError } from "@/lib/api";
import { formatMileage, formatPrice } from "@/lib/format";
import type { FuelType, Transmission, Vehicle } from "@/lib/types";
import { getVehicle } from "@/lib/vehicles";

const FUEL_TYPE_LABEL: Record<FuelType, string> = {
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  ELECTRIQUE: "Électrique",
};

const TRANSMISSION_LABEL: Record<Transmission, string> = {
  MANUELLE: "Manuelle",
  AUTOMATIQUE: "Automatique",
};

const PURCHASE_TYPE_LABEL = {
  VENTE: "Vente",
  LOCATION: "Location",
} as const;

type LoadResult =
  | { ok: true; vehicle: Vehicle }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; message: string };

/**
 * Fetch isolé qui ne renvoie QUE des données (jamais de JSX) : on sépare le
 * try/catch du rendu. Le 404 est distingué pour déclencher `notFound()`.
 */
async function loadVehicle(id: string): Promise<LoadResult> {
  try {
    return { ok: true, vehicle: await getVehicle(id) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { ok: false, notFound: true };
    }
    const message =
      error instanceof ApiError
        ? error.message
        : "Une erreur inattendue est survenue.";
    return { ok: false, notFound: false, message };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await loadVehicle(id);

  if (!result.ok) {
    return { title: "Véhicule — M-Motors" };
  }

  const { brand, model, year } = result.vehicle;
  return {
    title: `${brand} ${model} (${year}) — M-Motors`,
    description:
      result.vehicle.description ??
      `${brand} ${model} ${year} disponible chez M-Motors.`,
  };
}

export default async function VehiculePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <nav aria-label="Fil d'Ariane" className="mb-6 text-sm">
        <Link
          href="/catalogue"
          className="text-foreground/60 transition hover:text-foreground"
        >
          ← Retour au catalogue
        </Link>
      </nav>

      <Suspense fallback={<VehicleDetailSkeleton />}>
        <VehicleDetail id={id} />
      </Suspense>
    </main>
  );
}

async function VehicleDetail({ id }: { id: string }) {
  const result = await loadVehicle(id);

  if (!result.ok && result.notFound) {
    notFound();
  }

  if (!result.ok) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8 text-center">
        <p className="font-medium text-red-600">
          Impossible de charger ce véhicule.
        </p>
        <p className="mt-1 text-sm text-foreground/60">{result.message}</p>
      </div>
    );
  }

  const vehicle = result.vehicle;
  const isLocation = vehicle.purchaseType === "LOCATION";

  return (
    <article className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <VehicleGallery
        images={vehicle.images}
        alt={`${vehicle.brand} ${vehicle.model}`}
      />

      <div className="flex flex-col">
        <span
          className={`mb-3 inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
            isLocation
              ? "bg-blue-600 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          {PURCHASE_TYPE_LABEL[vehicle.purchaseType]}
        </span>

        <h1 className="text-3xl font-bold">
          {vehicle.brand} {vehicle.model}
        </h1>
        <p className="mt-1 text-foreground/60">
          {vehicle.year} · {formatMileage(vehicle.mileage)}
        </p>

        <p className="mt-4 text-3xl font-bold">
          {formatPrice(vehicle.price)}
          {isLocation && (
            <span className="text-base font-normal text-foreground/60">
              {" "}
              / mois
            </span>
          )}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Spec label="Année" value={String(vehicle.year)} />
          <Spec label="Kilométrage" value={formatMileage(vehicle.mileage)} />
          <Spec label="Motorisation" value={FUEL_TYPE_LABEL[vehicle.fuelType]} />
          {vehicle.transmission && (
            <Spec
              label="Boîte de vitesses"
              value={TRANSMISSION_LABEL[vehicle.transmission]}
            />
          )}
          {vehicle.color && <Spec label="Couleur" value={vehicle.color} />}
        </dl>

        {vehicle.description && (
          <div className="mt-6">
            <h2 className="mb-2 font-semibold">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {vehicle.description}
            </p>
          </div>
        )}

        {/* TODO(auth) : si l'utilisateur est connecté, pointer vers le parcours
            de dépôt de dossier ; sinon /login. En attendant l'arbitrage auth,
            on dirige toujours vers /login. */}
        <Link
          href="/login"
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-foreground px-6 py-3 text-base font-semibold text-background transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:w-auto"
        >
          Déposer un dossier
        </Link>
      </div>
    </article>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-foreground/50">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

/** Skeleton affiché pendant le fetch serveur (fallback Suspense). */
function VehicleDetailSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="aspect-[4/3] w-full rounded-xl bg-foreground/10" />
      <div className="flex flex-col gap-4">
        <div className="h-6 w-24 rounded-full bg-foreground/10" />
        <div className="h-8 w-2/3 rounded bg-foreground/10" />
        <div className="h-4 w-1/3 rounded bg-foreground/10" />
        <div className="h-10 w-40 rounded bg-foreground/10" />
        <div className="mt-4 h-24 w-full rounded bg-foreground/10" />
        <div className="mt-4 h-12 w-48 rounded-xl bg-foreground/10" />
      </div>
    </div>
  );
}
