"use client";

/**
 * Guard de routes côté client basé sur `user.role`.
 *
 * ⚠️ Confort UX uniquement : la vraie sécurité est serveur (chaque endpoint
 * protégé renvoie 401/403). On évite juste d'afficher un écran réservé à un
 * utilisateur non autorisé, et on le redirige.
 *
 * Usage :
 *   <RouteGuard>…</RouteGuard>                       // connecté (n'importe quel rôle)
 *   <RouteGuard roles={["GESTIONNAIRE", "ADMIN"]}>…  // back-office
 */

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/types";

interface RouteGuardProps {
  children: ReactNode;
  /** Rôles autorisés. Omis → tout utilisateur connecté est accepté. */
  roles?: Role[];
}

export default function RouteGuard({ children, roles }: RouteGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const allowed = user !== null && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (roles && !roles.includes(user.role)) {
      router.replace("/");
    }
  }, [user, isLoading, roles, router]);

  // Pendant la vérification de session, ou avant la redirection : ne rien
  // divulguer du contenu protégé.
  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-sm text-foreground/60">
        Chargement…
      </div>
    );
  }
  if (!allowed) return null;

  return <>{children}</>;
}
