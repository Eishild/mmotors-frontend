"use client";

/**
 * Inverse de `RouteGuard` : réservé aux visiteurs **non connectés**.
 *
 * Empêche un utilisateur déjà authentifié d'accéder aux pages du groupe `(auth)`
 * (`/login`, `/register`) ; il est redirigé vers son espace. Confort UX — la
 * sécurité réelle reste serveur.
 */

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

export default function GuestGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/compte");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-sm p-8 text-sm text-foreground/60">
        Chargement…
      </div>
    );
  }
  // Connecté : on n'affiche pas le formulaire le temps de la redirection.
  if (user) return null;

  return <>{children}</>;
}
