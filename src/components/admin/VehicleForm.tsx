"use client";

/**
 * Formulaire création / édition d'un véhicule (back-office, US-008/009).
 *
 * - `vehicleId` absent → création (`POST /vehicles`).
 * - `vehicleId` présent → édition : charge le véhicule (le staff peut charger un
 *   véhicule retiré) puis `PUT /vehicles/:id`. `purchaseType` n'est pas modifiable
 *   ici (la bascule VENTE↔LOCATION se fait via l'action dédiée de la liste).
 *
 * Validation Zod alignée sur le backend ; les erreurs de validation serveur
 * (`{ errors: { champ: [...] } }`) sont remappées sur les champs via `applyApiError`.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "@/lib/api";
import { applyApiError } from "@/lib/apiErrors";
import type { FuelType, Transmission, VehicleStatus } from "@/lib/types";
import {
  createVehicle,
  FUEL_TYPE_LABELS,
  getVehicle,
  PURCHASE_TYPE_LABELS,
  TRANSMISSION_LABELS,
  updateVehicle,
  VEHICLE_STATUS_LABELS,
} from "@/lib/vehicles";
import {
  emptyVehicleForm,
  toCreateInput,
  toUpdateInput,
  vehicleFormSchema,
  type VehicleFormValues,
} from "@/schemas";
import AuthField from "@/components/auth/AuthField";

const FUEL_OPTIONS = Object.keys(FUEL_TYPE_LABELS) as FuelType[];
const TRANSMISSION_OPTIONS = Object.keys(TRANSMISSION_LABELS) as Transmission[];
const STATUS_OPTIONS = Object.keys(VEHICLE_STATUS_LABELS) as VehicleStatus[];

const SELECT_CLASS =
  "rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground/40 aria-[invalid=true]:border-red-500";

export default function VehicleForm({ vehicleId }: { vehicleId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(vehicleId);

  const [rootError, setRootError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(isEdit);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: emptyVehicleForm,
  });

  // Édition : précharge le véhicule. `reset()` (RHF) et les setState ne sont
  // appelés que dans les callbacks de la promesse → rien de synchrone dans l'effet.
  useEffect(() => {
    if (!vehicleId) return;
    let active = true;
    getVehicle(vehicleId)
      .then((v) => {
        if (!active) return;
        reset({
          brand: v.brand,
          model: v.model,
          year: String(v.year),
          mileage: String(v.mileage),
          price: v.price,
          fuelType: v.fuelType,
          purchaseType: v.purchaseType,
          transmission: v.transmission ?? "",
          color: v.color ?? "",
          description: v.description ?? "",
          status: v.status,
          images: v.images.join("\n"),
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(
          error instanceof ApiError && error.status === 404
            ? "Véhicule introuvable."
            : "Impossible de charger le véhicule.",
        );
      })
      .finally(() => {
        if (active) setLoadingVehicle(false);
      });
    return () => {
      active = false;
    };
  }, [vehicleId, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    try {
      if (vehicleId) {
        await updateVehicle(vehicleId, toUpdateInput(values));
      } else {
        await createVehicle(toCreateInput(values));
      }
      router.push("/admin/vehicules");
      router.refresh();
    } catch (error) {
      setRootError(applyApiError(error, setError));
    }
  });

  if (loadError) {
    return (
      <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <p className="font-medium text-red-600">{loadError}</p>
        <Link href="/admin/vehicules" className="mt-2 inline-block text-sm underline">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  if (loadingVehicle) {
    return <p className="mt-6 text-sm text-foreground/60">Chargement du véhicule…</p>;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-5">
      {rootError && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
        >
          {rootError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField label="Marque" error={errors.brand?.message} {...register("brand")} />
        <AuthField label="Modèle" error={errors.model?.message} {...register("model")} />
        <AuthField
          label="Année"
          inputMode="numeric"
          error={errors.year?.message}
          {...register("year")}
        />
        <AuthField
          label="Kilométrage"
          inputMode="numeric"
          error={errors.mileage?.message}
          {...register("mileage")}
        />
        <AuthField
          label="Prix (€)"
          inputMode="decimal"
          error={errors.price?.message}
          {...register("price")}
        />

        {/* Motorisation */}
        <div className="flex flex-col gap-1">
          <label htmlFor="fuelType" className="text-sm font-medium">
            Motorisation
          </label>
          <select
            id="fuelType"
            aria-invalid={errors.fuelType ? true : undefined}
            className={SELECT_CLASS}
            {...register("fuelType")}
          >
            {FUEL_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {FUEL_TYPE_LABELS[f]}
              </option>
            ))}
          </select>
          {errors.fuelType && (
            <p className="text-xs text-red-500">{errors.fuelType.message}</p>
          )}
        </div>

        {/* Type d'achat : éditable à la création, lecture seule en édition. */}
        {isEdit ? (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Type d&apos;achat</span>
            <p className="rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm text-foreground/70">
              Bascule vente ↔ location depuis la liste.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label htmlFor="purchaseType" className="text-sm font-medium">
              Type d&apos;achat
            </label>
            <select id="purchaseType" className={SELECT_CLASS} {...register("purchaseType")}>
              {(["VENTE", "LOCATION"] as const).map((p) => (
                <option key={p} value={p}>
                  {PURCHASE_TYPE_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Transmission (facultatif) */}
        <div className="flex flex-col gap-1">
          <label htmlFor="transmission" className="text-sm font-medium">
            Transmission <span className="text-foreground/50">(facultatif)</span>
          </label>
          <select id="transmission" className={SELECT_CLASS} {...register("transmission")}>
            <option value="">—</option>
            {TRANSMISSION_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TRANSMISSION_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {/* Statut (facultatif) */}
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-sm font-medium">
            Statut <span className="text-foreground/50">(facultatif)</span>
          </label>
          <select id="status" className={SELECT_CLASS} {...register("status")}>
            <option value="">— (défaut : disponible)</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {VEHICLE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <AuthField
          label="Couleur (facultatif)"
          error={errors.color?.message}
          {...register("color")}
        />
      </div>

      {/* Description (facultatif) */}
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-foreground/50">(facultatif)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          className={SELECT_CLASS}
          {...register("description")}
        />
      </div>

      {/* Images : une URL par ligne */}
      <div className="flex flex-col gap-1">
        <label htmlFor="images" className="text-sm font-medium">
          Images <span className="text-foreground/50">(une URL par ligne)</span>
        </label>
        <textarea
          id="images"
          rows={3}
          placeholder="https://exemple.com/photo-1.jpg"
          aria-invalid={errors.images ? true : undefined}
          className={SELECT_CLASS}
          {...register("images")}
        />
        {errors.images && (
          <p className="text-xs text-red-500">{errors.images.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-foreground px-6 py-3 text-base font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting
            ? "Enregistrement…"
            : isEdit
              ? "Enregistrer les modifications"
              : "Créer le véhicule"}
        </button>
        <Link
          href="/admin/vehicules"
          className="rounded-xl px-6 py-3 text-base font-medium text-foreground/70 hover:text-foreground"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
