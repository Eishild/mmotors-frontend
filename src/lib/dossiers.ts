/**
 * Appels API du domaine « dossiers », centralisés au-dessus de `apiFetch` /
 * `apiUpload`. Préfixe `/api/v1` (cf. @CONTEXT.md §5).
 *
 * Règles métier reflétées ici (@CONTEXT.md §5) :
 * - `clientId` est dérivé du JWT côté serveur → JAMAIS envoyé par le front.
 * - `options` n'existent QUE pour `type = LOCATION` (les envoyer sur un ACHAT → 400).
 * - Un document : PDF / JPEG / PNG, ≤ 10 Mo, champ multipart nommé `document`.
 */

import { apiFetch, apiUpload } from "./api";
import type {
  ClientDossier,
  Dossier,
  DossierDetail,
  DossierDocument,
  DossierStatus,
  DossierType,
  DossierWithPricedOptions,
  OptionType,
  PaginatedResponse,
  PricedOption,
  StaffDossier,
} from "./types";

/** Libellés FR des options de location (partagés dépôt + suivi). */
export const OPTION_LABELS: Record<OptionType, string> = {
  ASSURANCE_TOUS_RISQUES: "Assurance tous risques",
  ASSISTANCE_DEPANNAGE: "Assistance dépannage",
  ENTRETIEN_SAV: "Entretien / SAV",
  CONTROLE_TECHNIQUE: "Contrôle technique",
};

/** Libellés FR des statuts de dossier. */
export const DOSSIER_STATUS_LABELS: Record<DossierStatus, string> = {
  EN_ATTENTE_DOCUMENTS: "En attente de documents",
  EN_COURS: "En cours d'instruction",
  COMPLEMENT_DEMANDE: "Complément demandé",
  VALIDE: "Validé",
  REFUSE: "Refusé",
};

/** Libellés FR des types de dossier. */
export const DOSSIER_TYPE_LABELS: Record<DossierType, string> = {
  ACHAT: "Achat",
  LOCATION: "Location",
};

/**
 * Machine à états (miroir de `ALLOWED_TRANSITIONS` backend, US-011) : transitions
 * autorisées depuis chaque statut. Sert à n'afficher que les actions valides ;
 * la vérification réelle reste serveur (409 si transition interdite).
 */
export const DOSSIER_STATUS_TRANSITIONS: Record<DossierStatus, DossierStatus[]> = {
  EN_ATTENTE_DOCUMENTS: ["EN_COURS"],
  EN_COURS: ["COMPLEMENT_DEMANDE", "VALIDE", "REFUSE"],
  COMPLEMENT_DEMANDE: ["EN_COURS", "VALIDE", "REFUSE"],
  VALIDE: [],
  REFUSE: [],
};

/** Libellé de l'action menant à un statut cible (bouton d'instruction). */
export const DOSSIER_TRANSITION_LABELS: Record<DossierStatus, string> = {
  EN_ATTENTE_DOCUMENTS: "Remettre en attente",
  EN_COURS: "Mettre en instruction",
  COMPLEMENT_DEMANDE: "Demander un complément",
  VALIDE: "Valider",
  REFUSE: "Refuser",
};

/** Taille maximale d'un document accepté par le backend (10 Mo). */
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

/** Types MIME autorisés pour un document de dossier. */
export const ACCEPTED_DOCUMENT_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

/** Valide un fichier côté client avant upload. `null` = valide, sinon message d'erreur. */
export function validateDocument(file: File): string | null {
  if (!ACCEPTED_DOCUMENT_MIME.includes(file.type as never)) {
    return "Format non supporté (PDF, JPEG ou PNG uniquement).";
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return "Fichier trop volumineux (10 Mo maximum).";
  }
  return null;
}

/**
 * Catalogue tarifé des options de location (`GET /dossiers/options/catalog`,
 * US-006). Public : libellé + prix mensuel des 4 options, trié par prix
 * décroissant côté serveur. Source de vérité des prix affichés.
 */
export async function getOptionsCatalog(): Promise<PricedOption[]> {
  const { data } = await apiFetch<{ data: PricedOption[] }>(
    "/api/v1/dossiers/options/catalog",
  );
  return data;
}

/**
 * Ajoute/valide des options sur un dossier de LOCATION (`POST /dossiers/:id/options`).
 * Réservé au client propriétaire, dossier non finalisé (sinon `ApiError` 403/409).
 * Idempotent (ré-ajouter une option existante ne la duplique pas). Renvoie le
 * dossier avec le détail tarifaire + le total mensuel (garantis serveur).
 */
export async function addDossierOptions(
  id: string,
  options: OptionType[],
): Promise<DossierWithPricedOptions> {
  const { data } = await apiFetch<{ data: DossierWithPricedOptions }>(
    `/api/v1/dossiers/${encodeURIComponent(id)}/options`,
    { method: "POST", body: JSON.stringify({ options }) },
  );
  return data;
}

export interface CreateDossierPayload {
  vehicleId: string;
  type: DossierType;
  /** Uniquement pour `type = LOCATION`. Omis/ vide sinon. */
  options?: OptionType[];
}

/** Dépose un dossier (CLIENT). Ressource unique → enveloppe `{ data }`. */
export async function createDossier(
  payload: CreateDossierPayload,
): Promise<Dossier> {
  const { data } = await apiFetch<{ data: Dossier }>("/api/v1/dossiers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Téléverse une pièce jointe sur un dossier (multipart, champ `document`).
 * Un seul fichier par appel (cf. @CONTEXT.md §5).
 */
export async function uploadDossierDocument(
  dossierId: string,
  file: File,
): Promise<DossierDocument> {
  const form = new FormData();
  form.append("document", file);
  const { data } = await apiUpload<{ data: DossierDocument }>(
    `/api/v1/dossiers/${encodeURIComponent(dossierId)}/documents`,
    form,
  );
  return data;
}

/**
 * Dossiers du client connecté (suivi US-007), du plus récent au plus ancien.
 * Réponse non paginée `{ data: ClientDossier[] }` (véhicule inclus, champs réduits).
 */
export async function getMyDossiers(): Promise<ClientDossier[]> {
  const { data } = await apiFetch<{ data: ClientDossier[] }>(
    "/api/v1/dossiers/me",
  );
  return data;
}

// ─── Back-office (GESTIONNAIRE / ADMIN, US-010/011) ────────────────────────────

/** Filtres de la liste back-office des dossiers à instruire. */
export interface StaffDossierFilters {
  status?: DossierStatus;
  type?: DossierType;
  page?: number;
  limit?: number;
}

/**
 * Liste paginée des dossiers à instruire (`GET /dossiers`, staff). File
 * d'instruction triée du plus ancien au plus récent côté serveur.
 */
export function getStaffDossiers(
  filters: StaffDossierFilters = {},
): Promise<PaginatedResponse<StaffDossier>> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return apiFetch<PaginatedResponse<StaffDossier>>(
    `/api/v1/dossiers${qs ? `?${qs}` : ""}`,
  );
}

/**
 * Détail d'un dossier + ses documents (`GET /dossiers/:id`). Accessible au staff
 * et au client propriétaire. Les URLs signées des documents expirent vite (60 s)
 * → recharger à l'ouverture plutôt que mettre en cache.
 */
export async function getDossierDetail(id: string): Promise<DossierDetail> {
  const { data } = await apiFetch<{ data: DossierDetail }>(
    `/api/v1/dossiers/${encodeURIComponent(id)}`,
  );
  return data;
}

/** Payload de changement de statut. `refusalMotif` requis (et seulement) si REFUSE. */
export interface UpdateDossierStatusPayload {
  status: DossierStatus;
  refusalMotif?: string;
}

/**
 * Change le statut d'un dossier (`PATCH /dossiers/:id/status`). Lève `ApiError` :
 * 409 si transition interdite, 400 si motif manquant/invalide.
 */
export async function updateDossierStatus(
  id: string,
  payload: UpdateDossierStatusPayload,
): Promise<StaffDossier> {
  const { data } = await apiFetch<{ data: StaffDossier }>(
    `/api/v1/dossiers/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
  return data;
}
