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

export type DossierType = "ACHAT" | "LOCATION";

export type DossierStatus =
  | "EN_ATTENTE_DOCUMENTS"
  | "EN_COURS"
  | "COMPLEMENT_DEMANDE"
  | "VALIDE"
  | "REFUSE";

export type OptionType =
  | "ASSURANCE_TOUS_RISQUES"
  | "ASSISTANCE_DEPANNAGE"
  | "ENTRETIEN_SAV"
  | "CONTROLE_TECHNIQUE";

/** Option d'un dossier de LOCATION (jamais sur un ACHAT). */
export interface DossierOption {
  id: string;
  type: OptionType;
  dossierId: string;
  createdAt: string;
}

/**
 * Pièce jointe d'un dossier. Nommé `DossierDocument` (et non `Document`) pour ne
 * pas masquer le type global `Document` du DOM.
 */
export interface DossierDocument {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  dossierId: string;
  uploadedAt: string;
}

export interface Dossier {
  id: string;
  type: DossierType;
  status: DossierStatus;
  /** Renseigné uniquement si `status === "REFUSE"`. */
  refusalMotif: string | null;
  clientId: string;
  vehicleId: string;
  /** Présentes uniquement pour les dossiers de LOCATION. */
  options: DossierOption[];
  documents: DossierDocument[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Vue « suivi client » d'un dossier, telle que renvoyée par `GET /dossiers/me`
 * (US-007). Différente du `Dossier` générique : le backend inclut le véhicule et
 * restreint les champs (options réduites à `{ type }`, documents sans `url` ni
 * chemins de stockage internes).
 */
export interface ClientDossierVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  images: string[];
}

export interface ClientDossierDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface ClientDossier {
  id: string;
  type: DossierType;
  status: DossierStatus;
  refusalMotif: string | null;
  clientId: string;
  vehicleId: string;
  createdAt: string;
  updatedAt: string;
  vehicle: ClientDossierVehicle;
  options: { type: OptionType }[];
  documents: ClientDossierDocument[];
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
