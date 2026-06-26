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

/** Option tarifée telle qu'exposée par `GET /dossiers/options/catalog` (US-006). */
export interface PricedOption {
  type: OptionType;
  label: string;
  /** Prix mensuel en euros (Decimal sérialisé en string, ex. "49.90"). */
  monthlyPrice: string;
}

/**
 * Dossier renvoyé par `POST /dossiers/:id/options` : options à jour + détail
 * tarifaire (prix par option et total mensuel, calculés et garantis côté serveur).
 */
export interface DossierWithPricedOptions {
  id: string;
  type: DossierType;
  status: DossierStatus;
  refusalMotif: string | null;
  clientId: string;
  vehicleId: string;
  createdAt: string;
  updatedAt: string;
  options: DossierOption[];
  pricedOptions: PricedOption[];
  /** Total mensuel des options (Decimal sérialisé en string). */
  monthlyOptionsTotal: string;
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

/**
 * Vue « back-office » d'un dossier, telle que renvoyée par `GET /dossiers` et
 * `PATCH /dossiers/:id/status` (US-010/011). Inclut le client et le véhicule
 * (champs réduits) + le nombre de documents ; pas d'URL de pièces ici.
 */
export interface StaffDossierClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface StaffDossierVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
}

export interface StaffDossier {
  id: string;
  type: DossierType;
  status: DossierStatus;
  refusalMotif: string | null;
  clientId: string;
  vehicleId: string;
  createdAt: string;
  updatedAt: string;
  client: StaffDossierClient;
  vehicle: StaffDossierVehicle;
  options: { type: OptionType }[];
  _count: { documents: number };
}

/**
 * Pièce jointe telle que renvoyée par `GET /dossiers/:id` : métadonnées + URL
 * signée éphémère (60 s) pour visualiser/télécharger. Pas de chemin de stockage.
 */
export interface DossierDetailDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  signedUrl: string;
}

/**
 * Détail complet d'un dossier (`GET /dossiers/:id`) : ouverture depuis le
 * back-office (ou par le client propriétaire), avec les documents accessibles.
 */
export interface DossierDetail {
  id: string;
  type: DossierType;
  status: DossierStatus;
  refusalMotif: string | null;
  clientId: string;
  vehicleId: string;
  createdAt: string;
  updatedAt: string;
  client: StaffDossierClient;
  vehicle: StaffDossierVehicle;
  options: { type: OptionType }[];
  documents: DossierDetailDocument[];
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
