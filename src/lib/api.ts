/**
 * Client HTTP minimal pour l'API backend (Express).
 *
 * - Préfixe toutes les requêtes avec NEXT_PUBLIC_API_URL.
 * - Inclut systématiquement `credentials: 'include'` afin que le cookie
 *   httpOnly d'authentification soit envoyé/reçu sur chaque appel.
 * - Normalise la gestion d'erreurs via la classe `ApiError`.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

/** Erreur enrichie levée lorsque l'API renvoie un statut non-2xx ou est injoignable. */
export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Effectue un appel à l'API backend.
 *
 * @param endpoint  Chemin relatif (ex: "/vehicles") ou absolu.
 * @param options   Options fetch standard (method, body, headers, ...).
 * @returns         Le corps de la réponse, parsé en JSON si possible.
 * @throws ApiError en cas d'erreur réseau ou de statut HTTP non-2xx.
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      // Toujours forcé après le spread : ne peut pas être écrasé par l'appelant.
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (cause) {
    throw new ApiError("Impossible de joindre l'API backend.", 0, cause);
  }

  const isJson = res.headers
    .get("content-type")
    ?.includes("application/json");
  const body = isJson
    ? await res.json().catch(() => null)
    : await res.text();

  if (!res.ok) {
    const message =
      isJson &&
      body !== null &&
      typeof body === "object" &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Erreur ${res.status} ${res.statusText}`;
    throw new ApiError(message, res.status, body);
  }

  return body as T;
}
