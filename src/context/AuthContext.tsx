"use client";

/**
 * Gestion globale de l'authentification via le Context API.
 *
 * Pourquoi un Context ? L'utilisateur connecté est un état serveur partagé par
 * tout l'arbre (header, guards de routes, espace client, back-office). On le
 * vérifie une seule fois au montage et on le diffuse via `useAuth()`.
 *
 * Pourquoi passer par `GET /auth/me` et pas lire le token ?
 * Le JWT vit dans un cookie httpOnly : le JavaScript ne peut PAS le lire
 * (protection anti-XSS, @CONTEXT.md §2). On ne peut donc pas « décoder » la
 * session côté client. La seule façon de savoir qui est connecté est de
 * demander au serveur : il lit le cookie (envoyé via `credentials: "include"`)
 * et renvoie l'utilisateur — ou un 401 si la session est invalide.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type LoginPayload,
  type RegisterPayload,
} from "@/lib/auth";
import type { User } from "@/lib/types";

interface AuthContextValue {
  /** Utilisateur connecté, ou `null` si déconnecté. */
  user: User | null;
  /** `true` tant que la session initiale n'a pas été vérifiée. */
  isLoading: boolean;
  /** Connexion ; met à jour `user` et le renvoie. Lève `ApiError` en cas d'échec. */
  login: (payload: LoginPayload) => Promise<User>;
  /** Inscription ; met à jour `user` et le renvoie. Lève `ApiError` en cas d'échec. */
  register: (payload: RegisterPayload) => Promise<User>;
  /** Déconnexion : appelle l'API puis remet `user` à `null`. */
  logout: () => Promise<void>;
  /** Re-vérifie la session auprès du serveur (utile après une action externe). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Récupère l'utilisateur courant depuis le cookie de session. */
  const refresh = useCallback(async () => {
    try {
      setUser(await getCurrentUser());
    } catch {
      // Erreur réseau / serveur : on considère l'utilisateur comme déconnecté
      // plutôt que de bloquer l'app. (Les 401/404 sont déjà gérés → null.)
      setUser(null);
    }
  }, []);

  // Vérification de session au montage (une seule fois).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await getCurrentUser();
        if (active) setUser(current);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const loggedIn = await loginRequest(payload);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const created = await registerRequest(payload);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      // Même si l'appel échoue, on déconnecte localement.
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Accès au contexte d'authentification. À utiliser dans des composants client. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>.");
  }
  return context;
}
