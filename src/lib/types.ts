/**
 * Types du domaine, recopiés depuis le contrat d'API backend (@CONTEXT.md §4).
 * Source de vérité : le backend `../backend`. Ne pas diverger sans arbitrage.
 */

export type Role = "CLIENT" | "GESTIONNAIRE" | "ADMIN";

/** Utilisateur tel que renvoyé par le backend (le mot de passe n'est JAMAIS exposé). */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export type FuelType = "ESSENCE" | "DIESEL" | "HYBRIDE" | "ELECTRIQUE";
export type Transmission = "MANUELLE" | "AUTOMATIQUE";
export type VehicleStatus = "DISPONIBLE" | "VENDU" | "LOUE" | "RESERVE";
export type PurchaseType = "VENTE" | "LOCATION";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  /** Decimal sérialisé en STRING (ex "14990.00") → parser avant calcul. */
  price: string;
  fuelType: FuelType;
  transmission: Transmission | null;
  color: string | null;
  description: string | null;
  status: VehicleStatus;
  purchaseType: PurchaseType;
  /** false = retiré du catalogue (soft delete). */
  available: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

/** Métadonnées de pagination renvoyées par les listes (`GET /vehicles`, `GET /dossiers`). */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Enveloppe d'une réponse liste paginée : `{ data, pagination }` (sans `data` supplémentaire). */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
