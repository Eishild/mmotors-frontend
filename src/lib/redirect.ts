/**
 * Sécurise une cible de redirection issue d'un paramètre d'URL (`?redirect=`).
 *
 * On n'autorise que les chemins **internes** : commencent par "/" mais pas par
 * "//" (qui serait une URL protocole-relative → open redirect vers un domaine
 * externe). Tout le reste retombe sur `fallback`.
 */
export function safeInternalPath(
  path: string | null | undefined,
  fallback = "/compte",
): string {
  if (path && path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return fallback;
}
