/** Formatage localisé (fr-FR) des valeurs métier affichées. */

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("fr-FR");

/**
 * Formate un prix en euros. `price` arrive en STRING (Decimal sérialisé) depuis l'API,
 * on le convertit donc avant calcul. Renvoie une chaîne vide si non parsable.
 */
export function formatPrice(price: string | number): string {
  const value = typeof price === "number" ? price : Number(price);
  if (Number.isNaN(value)) return "";
  return priceFormatter.format(value);
}

/** Formate un kilométrage : `120000` → "120 000 km". */
export function formatMileage(mileage: number): string {
  return `${numberFormatter.format(mileage)} km`;
}
