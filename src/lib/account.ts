/**
 * Appels API de l'espace compte (profil + mot de passe), au-dessus de `apiFetch`.
 * Préfixe `/api/v1`. La session passe par le cookie httpOnly (credentials inclus).
 *
 * Endpoints backend (module `users`) :
 * - `PATCH /users/me`          → met à jour firstName / lastName / phone ;
 * - `PATCH /users/me/password` → change le mot de passe (ancien requis).
 */

import { apiFetch } from "./api";
import type { User } from "./types";

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  /** `null` pour effacer le numéro ; omis pour ne pas le toucher. */
  phone?: string | null;
}

/** Met à jour son profil. Ressource unique → enveloppe `{ data }`. */
export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await apiFetch<{ data: User }>("/api/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/**
 * Change son mot de passe. Le backend renvoie `{ message }` (pas de corps utile).
 * Lève `ApiError` : 401 si le mot de passe actuel est incorrect, 400 si le
 * nouveau ne respecte pas la politique de robustesse.
 */
export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiFetch("/api/v1/users/me/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
