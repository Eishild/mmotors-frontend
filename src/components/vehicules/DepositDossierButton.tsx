"use client";

/**
 * Bouton « Déposer un dossier » de la fiche véhicule.
 *
 * Rendu dans un Server Component (la fiche), mais la cible dépend de l'état de
 * session → Client Component qui lit `useAuth()` :
 * - connecté   → parcours de dépôt de dossier (US-005), pré-rempli avec le véhicule ;
 * - déconnecté → `/login`, avec un `redirect` pour revenir ici après connexion.
 */

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const BTN_CLASS =
  "mt-8 inline-flex w-full items-center justify-center rounded-xl bg-foreground px-6 py-3 text-base font-semibold text-background transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:w-auto";

export default function DepositDossierButton({
  vehicleId,
}: {
  vehicleId: string;
}) {
  const { user, isLoading } = useAuth();

  // Tant que la session n'est pas vérifiée, on évite d'envoyer un utilisateur
  // connecté vers /login par erreur : bouton neutralisé.
  if (isLoading) {
    return (
      <span
        aria-disabled
        className={`${BTN_CLASS} pointer-events-none cursor-wait opacity-60`}
      >
        Déposer un dossier
      </span>
    );
  }

  const href = user
    ? `/compte/dossiers/nouveau?vehicleId=${vehicleId}`
    : `/login?redirect=${encodeURIComponent(`/vehicules/${vehicleId}`)}`;

  return (
    <Link href={href} className={BTN_CLASS}>
      Déposer un dossier
    </Link>
  );
}
