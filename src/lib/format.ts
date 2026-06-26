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

const preciseFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Comme `formatPrice` mais avec les centimes (ex. "49,90 €"). À utiliser pour les
 * petits montants où l'arrondi à l'euro fausserait l'affichage (prix d'options).
 */
export function formatPriceCents(price: string | number): string {
  const value = typeof price === "number" ? price : Number(price);
  if (Number.isNaN(value)) return "";
  return preciseFormatter.format(value);
}

/** Formate un kilométrage : `120000` → "120 000 km". */
export function formatMileage(mileage: number): string {
  return `${numberFormatter.format(mileage)} km`;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/** Formate une date ISO en français (ex. "25 juin 2026"). Chaîne vide si invalide. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return dateFormatter.format(date);
}
