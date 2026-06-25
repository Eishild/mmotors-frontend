/**
 * Page Catalogue — Server Component.
 *
 * Récupère les véhicules côté serveur (à chaque navigation/changement de query
 * string) via le module domaine `getVehicles`. Le filtrage et la pagination
 * passent par l'URL : la barre de filtres (client) réécrit la query string, ce
 * Server Component est re-rendu et refait le fetch. Aucun état serveur côté client.
 */

import { Suspense } from "react";
import CatalogueFilters from "@/components/catalogue/CatalogueFilters";
import CatalogueSkeleton from "@/components/catalogue/CatalogueSkeleton";
import Pagination from "@/components/catalogue/Pagination";
import VehicleCard from "@/components/catalogue/VehicleCard";
import { ApiError } from "@/lib/api";
import type { PurchaseType } from "@/lib/types";
import { getVehicles, type VehicleFilters } from "@/lib/vehicles";

type SearchParams = Record<string, string | string[] | undefined>;

/** Lit une valeur scalaire de la query string (ignore les tableaux). */
function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Traduit la query string de l'URL en filtres typés pour l'API. */
function parseFilters(params: SearchParams): VehicleFilters {
  const brand = single(params.brand)?.trim();
  const purchaseTypeRaw = single(params.purchaseType);
  const maxPriceRaw = single(params.maxPrice);
  const pageRaw = single(params.page);

  const purchaseType: PurchaseType | undefined =
    purchaseTypeRaw === "VENTE" || purchaseTypeRaw === "LOCATION"
      ? purchaseTypeRaw
      : undefined;

  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;
  const page = pageRaw ? Number(pageRaw) : undefined;

  return {
    brand: brand || undefined,
    purchaseType,
    maxPrice: maxPrice && maxPrice > 0 ? maxPrice : undefined,
    page: page && page > 0 ? page : undefined,
  };
}

/** Construit un href en conservant les filtres courants et en changeant la page. */
function pageHref(params: SearchParams, page: number): string {
  const next = new URLSearchParams();
  for (const key of ["brand", "purchaseType", "maxPrice"]) {
    const value = single(params[key]);
    if (value) next.set(key, value);
  }
  next.set("page", String(page));
  return `/catalogue?${next.toString()}`;
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);

  return (
    <main className="mx-auto max-w-6xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Catalogue</h1>
        <p className="mt-1 text-foreground/60">
          Nos véhicules d&apos;occasion disponibles à la vente et à la location.
        </p>
      </header>

      <CatalogueFilters />

      {/* `key` lié aux filtres : tout changement de query string remonte le
          fallback Suspense (skeleton) le temps du nouveau fetch serveur. */}
      <Suspense key={JSON.stringify(filters)} fallback={<CatalogueSkeleton />}>
        <CatalogueResults params={params} filters={filters} />
      </Suspense>
    </main>
  );
}

/**
 * Charge les véhicules en isolant le try/catch dans une fonction qui ne renvoie
 * QUE des données (pas de JSX) : c'est l'erreur de rendu qu'un try/catch ne peut
 * pas attraper, on garde donc fetch et rendu séparés.
 */
async function loadVehicles(
  filters: VehicleFilters,
): Promise<
  | { ok: true; data: Awaited<ReturnType<typeof getVehicles>> }
  | { ok: false; message: string }
> {
  try {
    return { ok: true, data: await getVehicles(filters) };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Une erreur inattendue est survenue.";
    return { ok: false, message };
  }
}

/**
 * Sous-composant async dédié au fetch : isolé sous un <Suspense> pour afficher
 * un skeleton pendant le chargement sans masquer la barre de filtres.
 */
async function CatalogueResults({
  params,
  filters,
}: {
  params: SearchParams;
  filters: VehicleFilters;
}) {
  const result = await loadVehicles(filters);

  if (!result.ok) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8 text-center">
        <p className="font-medium text-red-600">
          Impossible de charger le catalogue.
        </p>
        <p className="mt-1 text-sm text-foreground/60">{result.message}</p>
      </div>
    );
  }

  const { data: vehicles, pagination } = result.data;

  if (vehicles.length === 0) {
    return (
      <p className="rounded-xl border border-foreground/10 p-8 text-center text-foreground/60">
        Aucun véhicule ne correspond à ces critères.
      </p>
    );
  }

  const { page, totalPages, total } = pagination;

  return (
    <>
      <p className="mb-4 text-sm text-foreground/60">
        {total} véhicule{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        prevHref={pageHref(params, page - 1)}
        nextHref={pageHref(params, page + 1)}
      />
    </>
  );
}
