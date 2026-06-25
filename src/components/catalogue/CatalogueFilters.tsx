"use client"

/**
 * Barre de filtres (Client Component).
 *
 * Seul îlot interactif de la page : il ne fait AUCUN fetch lui-même.
 * Il réécrit la query string de l'URL ; le Server Component `page.tsx` est alors
 * re-rendu côté serveur et refait l'appel API. L'URL reste la source de vérité.
 *
 * Champs CONTRÔLÉS (state) : indispensable pour que « Réinitialiser » vide
 * réellement les inputs (un simple `defaultValue` ne se réapplique pas au reset).
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition, type FormEvent } from "react"

export default function CatalogueFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [brand, setBrand] = useState(searchParams.get("brand") ?? "")
  const [purchaseType, setPurchaseType] = useState(
    searchParams.get("purchaseType") ?? "",
  )
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "")

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()

    const trimmedBrand = brand.trim()
    const trimmedMaxPrice = maxPrice.trim()

    if (trimmedBrand) params.set("brand", trimmedBrand)
    if (purchaseType) params.set("purchaseType", purchaseType)
    if (trimmedMaxPrice) params.set("maxPrice", trimmedMaxPrice)
    // Tout changement de filtre ramène à la page 1 (on n'ajoute pas `page`).

    const query = params.toString()
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  function reset() {
    setBrand("")
    setPurchaseType("")
    setMaxPrice("")
    startTransition(() => {
      router.push(pathname)
    })
  }

  return (
    <form
      onSubmit={applyFilters}
      className="mb-8 grid grid-cols-1 gap-4 rounded-xl border border-foreground/10 bg-foreground/2 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Marque</span>
        <input
          type="text"
          name="brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Renault, Peugeot…"
          className="rounded-lg border border-foreground/15 bg-background px-3 py-2 outline-none focus:border-foreground/40"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Type</span>
        <select
          name="purchaseType"
          value={purchaseType}
          onChange={(e) => setPurchaseType(e.target.value)}
          className="rounded-lg border border-foreground/15 bg-background px-3 py-2 outline-none focus:border-foreground/40"
        >
          <option value="">Tous</option>
          <option value="VENTE">Vente</option>
          <option value="LOCATION">Location</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Prix max (€)</span>
        <input
          type="number"
          name="maxPrice"
          min={0}
          step={500}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="20000"
          className="rounded-lg border border-foreground/15 bg-background px-3 py-2 outline-none focus:border-foreground/40"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "…" : "Filtrer"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={isPending}
          className="rounded-lg border border-foreground/15 px-4 py-2 font-medium transition-colors hover:bg-foreground/5 disabled:opacity-50"
        >
          Réinitialiser
        </button>
      </div>
    </form>
  )
}
