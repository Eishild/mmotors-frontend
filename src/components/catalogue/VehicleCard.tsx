/**
 * Carte véhicule (Server Component, présentation pure).
 * Toute la carte est cliquable et mène à la fiche détaillée.
 */

import Link from "next/link"
import { formatMileage, formatPrice } from "@/lib/format"
import type { Vehicle } from "@/lib/types"

const PURCHASE_TYPE_LABEL: Record<Vehicle["purchaseType"], string> = {
  VENTE: "Vente",
  LOCATION: "Location",
}

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const cover = vehicle.images[0]

  return (
    <Link
      href={`/vehicules/${vehicle.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-foreground/10 bg-background transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-foreground/5">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- URLs arbitraires : <img> évite la config remotePatterns de next/image.
          <img
            src={cover}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-foreground/40">
            Pas de photo
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
            vehicle.purchaseType === "LOCATION"
              ? "bg-blue-600 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          {PURCHASE_TYPE_LABEL[vehicle.purchaseType]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="font-semibold">
          {vehicle.brand} {vehicle.model}
        </h2>
        <p className="text-sm text-foreground/60">
          {vehicle.year} · {formatMileage(vehicle.mileage)}
        </p>
        <p className="mt-auto pt-3 text-lg font-bold">
          {formatPrice(vehicle.price)}
          {vehicle.purchaseType === "LOCATION" && (
            <span className="text-sm font-normal text-foreground/60">
              {" "}
              / mois
            </span>
          )}
        </p>
      </div>
    </Link>
  )
}
