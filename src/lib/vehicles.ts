/**
 * Appels API du domaine « vehicles », centralisés au-dessus de `apiFetch`.
 * Le préfixe `/api/v1` est documenté dans @CONTEXT.md (la base URL `NEXT_PUBLIC_API_URL`
 * ne contient que l'origine, ex. http://localhost:3000).
 */

import { apiFetch } from "./api";
import type {
  FuelType,
  PaginatedResponse,
  PurchaseType,
  Transmission,
  Vehicle,
  VehicleStatus,
} from "./types";

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

/** Valeur sérialisable dans une query string. */
type QueryValue = string | number | boolean | undefined | null;

/** Construit la query string en ignorant les valeurs vides / invalides. */
function buildQuery(filters: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "number" && Number.isNaN(value)) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// ─── Libellés FR (back-office & affichage) ─────────────────────────────────────

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  ELECTRIQUE: "Électrique",
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  MANUELLE: "Manuelle",
  AUTOMATIQUE: "Automatique",
};

export const PURCHASE_TYPE_LABELS: Record<PurchaseType, string> = {
  VENTE: "Vente",
  LOCATION: "Location",
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  DISPONIBLE: "Disponible",
  VENDU: "Vendu",
  LOUE: "Loué",
  RESERVE: "Réservé",
};

/** Récupère la liste paginée des véhicules du catalogue. */
export function getVehicles(
  filters: VehicleFilters = {},
): Promise<PaginatedResponse<Vehicle>> {
  return apiFetch<PaginatedResponse<Vehicle>>(
    `/api/v1/vehicles${buildQuery({ ...filters })}`,
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

// ─── Back-office (GESTIONNAIRE / ADMIN, US-008/009) ────────────────────────────

/** Filtres du listing back-office : étend les filtres publics avec status/available. */
export interface AdminVehicleFilters extends VehicleFilters {
  status?: VehicleStatus;
  /** `true` = en catalogue, `false` = retirés (soft delete). Omis = tout le parc. */
  available?: boolean;
}

/**
 * Listing back-office : `GET /vehicles?scope=admin`. Contrairement au catalogue
 * public, renvoie tout le parc (VENDU/LOUE/RESERVE + retirés). Réservé au staff
 * côté serveur (403 sinon) ; le cookie de session part via `credentials:"include"`.
 */
export function getAdminVehicles(
  filters: AdminVehicleFilters = {},
): Promise<PaginatedResponse<Vehicle>> {
  return apiFetch<PaginatedResponse<Vehicle>>(
    `/api/v1/vehicles${buildQuery({ ...filters, scope: "admin" })}`,
  );
}

/** Champs acceptés à la création (alignés sur le schema Zod backend). */
export interface CreateVehicleInput {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  /** Nombre > 0 (le backend stocke un Decimal). */
  price: number;
  fuelType: FuelType;
  purchaseType: PurchaseType;
  transmission?: Transmission;
  color?: string;
  description?: string;
  status?: VehicleStatus;
  images?: string[];
}

/**
 * Mise à jour partielle (≥ 1 champ). `purchaseType` est exclu : la bascule
 * VENTE↔LOCATION passe par `toggleVehiclePurchaseType`. `available` est piloté
 * par le soft delete uniquement.
 */
export type UpdateVehicleInput = Partial<Omit<CreateVehicleInput, "purchaseType">>;

/** Crée un véhicule. `201 { data }`. */
export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  const { data } = await apiFetch<{ data: Vehicle }>(`/api/v1/vehicles`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data;
}

/** Met à jour un véhicule (mise à jour partielle). `200 { data }`. */
export async function updateVehicle(
  id: string,
  input: UpdateVehicleInput,
): Promise<Vehicle> {
  const { data } = await apiFetch<{ data: Vehicle }>(
    `/api/v1/vehicles/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(input) },
  );
  return data;
}

/** Soft delete : retire du catalogue (`available=false`). Renvoie la ressource mise à jour. */
export async function deleteVehicle(id: string): Promise<Vehicle> {
  const { data } = await apiFetch<{ data: Vehicle; message: string }>(
    `/api/v1/vehicles/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  return data;
}

/**
 * Bascule VENTE↔LOCATION (`PATCH /:id/status`, sans body). Lève `ApiError`
 * status 409 si un dossier EN_COURS est lié au véhicule.
 */
export async function toggleVehiclePurchaseType(id: string): Promise<Vehicle> {
  const { data } = await apiFetch<{ data: Vehicle }>(
    `/api/v1/vehicles/${encodeURIComponent(id)}/status`,
    { method: "PATCH" },
  );
  return data;
}
