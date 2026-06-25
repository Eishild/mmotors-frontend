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
  DossierDocument,
  DossierType,
  OptionType,
} from "./types";

/** Libellés FR des options de location (partagés dépôt + suivi). */
export const OPTION_LABELS: Record<OptionType, string> = {
  ASSURANCE_TOUS_RISQUES: "Assurance tous risques",
  ASSISTANCE_DEPANNAGE: "Assistance dépannage",
  ENTRETIEN_SAV: "Entretien / SAV",
  CONTROLE_TECHNIQUE: "Contrôle technique",
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
