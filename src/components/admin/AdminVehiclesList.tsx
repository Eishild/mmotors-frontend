"use client";

/**
 * Liste de gestion des véhicules (back-office, US-008/009).
 *
 * Utilise `getAdminVehicles` (scope=admin) : affiche TOUT le parc, y compris les
 * véhicules VENDU/LOUE/RESERVE et ceux retirés (available=false), invisibles du
 * catalogue public. Actions par ligne : éditer, basculer VENTE↔LOCATION, retirer.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { formatMileage, formatPrice } from "@/lib/format";
import type { Vehicle, VehicleStatus } from "@/lib/types";
import {
  deleteVehicle,
  getAdminVehicles,
  PURCHASE_TYPE_LABELS,
  toggleVehiclePurchaseType,
  VEHICLE_STATUS_LABELS,
  type AdminVehicleFilters,
} from "@/lib/vehicles";

const PAGE_SIZE = 20;

/** Filtre de disponibilité exposé dans l'UI (mappé sur le param `available`). */
type AvailabilityFilter = "all" | "available" | "retired";

const STATUS_OPTIONS: VehicleStatus[] = ["DISPONIBLE", "VENDU", "LOUE", "RESERVE"];

/** Traduit une erreur API en message affichable. */
function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return "Accès réservé au back-office.";
    if (error.status === 401) return "Session expirée, reconnectez-vous.";
    return error.message;
  }
  return "Une erreur inattendue est survenue.";
}

function StatusBadge({ status }: { status: VehicleStatus }) {
  const tone: Record<VehicleStatus, string> = {
    DISPONIBLE: "bg-emerald-100 text-emerald-700",
    VENDU: "bg-foreground/10 text-foreground/60",
    LOUE: "bg-blue-100 text-blue-700",
    RESERVE: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone[status]}`}>
      {VEHICLE_STATUS_LABELS[status]}
    </span>
  );
}

export default function AdminVehiclesList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<VehicleStatus | "">("");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Action en cours sur une ligne donnée (désactive ses boutons) + erreur ciblée.
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  // Chaîne de promesses (et non un corps async) : les setState vivent dans les
  // callbacks .then/.catch/.finally, donc jamais synchrones dans l'effet — ce qui
  // évite les cascades de rendus. Le voyant de chargement est armé par les
  // handlers d'événements (changement de filtre/page).
  const load = useCallback((): Promise<void> => {
    const filters: AdminVehicleFilters = { page, limit: PAGE_SIZE };
    if (status) filters.status = status;
    if (availability === "available") filters.available = true;
    if (availability === "retired") filters.available = false;
    return getAdminVehicles(filters)
      .then((res) => {
        setVehicles(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        setLoadError(messageFor(error));
        setVehicles([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, status, availability]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onToggle(vehicle: Vehicle) {
    setBusyId(vehicle.id);
    setRowError(null);
    try {
      await toggleVehiclePurchaseType(vehicle.id);
      await load();
    } catch (error) {
      // 409 = un dossier EN_COURS est lié au véhicule (message backend explicite).
      setRowError({ id: vehicle.id, message: messageFor(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(vehicle: Vehicle) {
    if (
      !window.confirm(
        `Retirer ${vehicle.brand} ${vehicle.model} du catalogue ? Le véhicule sera marqué indisponible (réversible côté base).`,
      )
    ) {
      return;
    }
    setBusyId(vehicle.id);
    setRowError(null);
    try {
      await deleteVehicle(vehicle.id);
      await load();
    } catch (error) {
      setRowError({ id: vehicle.id, message: messageFor(error) });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Statut</span>
            <select
              value={status}
              onChange={(e) => {
                setLoading(true);
                setPage(1);
                setStatus(e.target.value as VehicleStatus | "");
              }}
              className="rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {VEHICLE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Disponibilité</span>
            <select
              value={availability}
              onChange={(e) => {
                setLoading(true);
                setPage(1);
                setAvailability(e.target.value as AvailabilityFilter);
              }}
              className="rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm"
            >
              <option value="all">Tout le parc</option>
              <option value="available">En catalogue</option>
              <option value="retired">Retirés</option>
            </select>
          </label>
        </div>
        <Link
          href="/admin/vehicules/nouveau"
          className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
        >
          + Nouveau véhicule
        </Link>
      </div>

      {loadError && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
        >
          {loadError}
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-foreground/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-foreground/10 bg-foreground/5 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3 font-medium">Véhicule</th>
              <th className="px-4 py-3 font-medium">Prix</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-foreground/50">
                  Chargement…
                </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-foreground/50">
                  Aucun véhicule pour ces filtres.
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr
                  key={v.id}
                  className={`border-b border-foreground/5 ${v.available ? "" : "opacity-60"}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {v.brand} {v.model}
                    </div>
                    <div className="text-xs text-foreground/55">
                      {v.year} · {formatMileage(v.mileage)}
                      {!v.available && " · retiré"}
                    </div>
                    {rowError?.id === v.id && (
                      <p role="alert" className="mt-1 text-xs text-red-600">
                        {rowError.message}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatPrice(v.price)}
                    {v.purchaseType === "LOCATION" && (
                      <span className="text-foreground/50"> /mois</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{PURCHASE_TYPE_LABELS[v.purchaseType]}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      <Link
                        href={`/admin/vehicules/${v.id}/editer`}
                        className="rounded-lg border border-foreground/15 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-foreground/5"
                      >
                        Éditer
                      </Link>
                      <button
                        type="button"
                        onClick={() => onToggle(v)}
                        disabled={busyId === v.id}
                        className="rounded-lg border border-foreground/15 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-foreground/5 disabled:opacity-50"
                        title="Basculer vente ↔ location"
                      >
                        → {v.purchaseType === "VENTE" ? "Location" : "Vente"}
                      </button>
                      {v.available && (
                        <button
                          type="button"
                          onClick={() => onDelete(v)}
                          disabled={busyId === v.id}
                          className="rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-foreground/60">
        <span>{total} véhicule(s)</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setPage((p) => Math.max(1, p - 1));
              }}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-foreground/15 px-3 py-1.5 font-medium transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Précédent
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setPage((p) => Math.min(totalPages, p + 1));
              }}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-foreground/15 px-3 py-1.5 font-medium transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
