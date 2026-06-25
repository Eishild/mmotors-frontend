/**
 * Appels API du domaine « vehicles », centralisés au-dessus de `apiFetch`.
 * Le préfixe `/api/v1` est documenté dans @CONTEXT.md (la base URL `NEXT_PUBLIC_API_URL`
 * ne contient que l'origine, ex. http://localhost:3000).
 */

import { apiFetch } from "./api";
import type { PaginatedResponse, PurchaseType, Vehicle } from "./types";

/** Filtres acceptés par `GET /vehicles` (tous optionnels). */
export interface VehicleFilters {
  brand?: string;
  model?: string;
  fuelType?: string;
  purchaseType?: PurchaseType;
  minPrice?: number;
  maxPrice?: number;
  maxMileage?: number;
  page?: number;
  limit?: number;
}

/** Construit la query string en ignorant les valeurs vides / invalides. */
function buildQuery(filters: VehicleFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "number" && Number.isNaN(value)) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Récupère la liste paginée des véhicules du catalogue. */
export function getVehicles(
  filters: VehicleFilters = {},
): Promise<PaginatedResponse<Vehicle>> {
  return apiFetch<PaginatedResponse<Vehicle>>(
    `/api/v1/vehicles${buildQuery(filters)}`,
  );
}

/**
 * Récupère la fiche détaillée d'un véhicule. Ressource unique → enveloppe `{ data }`.
 * Lève `ApiError` (status 404) si l'id est introuvable.
 */
export async function getVehicle(id: string): Promise<Vehicle> {
  const { data } = await apiFetch<{ data: Vehicle }>(
    `/api/v1/vehicles/${encodeURIComponent(id)}`,
  );
  return data;
}
