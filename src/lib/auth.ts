/**
 * Appels API du domaine « auth », centralisés au-dessus de `apiFetch`.
 *
 * Rappel sécurité (@CONTEXT.md §2) : l'auth repose sur un cookie httpOnly `token`
 * posé par le serveur. Le front ne lit/stocke JAMAIS le JWT — `apiFetch` force déjà
 * `credentials: "include"`, donc le cookie est envoyé/reçu automatiquement.
 *
 * ⚠️ `GET /auth/me` n'existe PAS encore côté backend (@CONTEXT.md §2 & §7).
 *    `getCurrentUser` est codé pour la route cible et tolère un 401/404 (→ null)
 *    afin que l'app fonctionne tant que le backend ne l'a pas ajoutée.
 */

import { apiFetch, ApiError } from "./api";
import type { User } from "./types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

/** Le backend renvoie `{ data: { user, token } }` sur login/register. */
interface AuthResponse {
  data: {
    user: User;
    /** Présent par rétro-compat header Bearer, mais ignoré côté navigateur. */
    token: string;
  };
}

/**
 * Récupère l'utilisateur courant à partir du cookie de session.
 * Ressource unique → enveloppe `{ data }`.
 *
 * Renvoie `null` (plutôt que de lever) pour les cas « pas de session valide » :
 * - 401 : non authentifié (cookie absent/expiré) ;
 * - 404 : la route `/auth/me` n'existe pas (encore) côté backend.
 * Toute autre erreur (réseau, 500) est relancée à l'appelant.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await apiFetch<{ data: User }>("/api/v1/auth/me");
    return data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
      return null;
    }
    throw error;
  }
}

/** Connexion. Le serveur pose le cookie ; on renvoie l'utilisateur du body. */
export async function login(payload: LoginPayload): Promise<User> {
  const { data } = await apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.user;
}

/** Inscription (compte créé en CLIENT). Le serveur pose le cookie. */
export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await apiFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.user;
}

/** Déconnexion : le serveur efface le cookie httpOnly. */
export async function logout(): Promise<void> {
  await apiFetch("/api/v1/auth/logout", { method: "POST" });
}
