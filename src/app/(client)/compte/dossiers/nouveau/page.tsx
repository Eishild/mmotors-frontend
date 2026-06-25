import Link from "next/link";
import RouteGuard from "@/components/auth/RouteGuard";
import DepositDossierForm from "@/components/dossiers/DepositDossierForm";

/**
 * Page de dépôt de dossier (US-005). `vehicleId` arrive en query string depuis
 * la fiche véhicule. Réservée au rôle CLIENT (seul habilité à `POST /dossiers`).
 */
export default async function NewDossierPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string }>;
}) {
  const { vehicleId } = await searchParams;

  return (
    <RouteGuard roles={["CLIENT"]}>
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-bold">Déposer un dossier</h1>

        {vehicleId ? (
          <DepositDossierForm vehicleId={vehicleId} />
        ) : (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
            <p className="font-medium">Aucun véhicule sélectionné.</p>
            <Link
              href="/catalogue"
              className="mt-2 inline-block text-sm underline"
            >
              Parcourir le catalogue
            </Link>
          </div>
        )}
      </main>
    </RouteGuard>
  );
}
