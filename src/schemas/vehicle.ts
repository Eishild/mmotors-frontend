/**
 * Schéma de validation Zod du formulaire véhicule (back-office, US-008/009).
 *
 * Aligné sur le schema backend (`createVehicleSchema`/`updateVehicleSchema`) :
 * year ∈ [1900, annéeProchaine], mileage entier ≥ 0, price > 0, enums stricts.
 *
 * Choix de typage : les champs numériques sont validés en STRING (les <input>
 * renvoient des chaînes) puis convertis en nombres au submit via `toCreateInput`.
 * On évite ainsi un `z.coerce`/`transform` qui ferait diverger les types
 * entrée/sortie et casserait le resolver RHF (même parti pris que le schéma auth).
 */

import { z } from "zod";
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
} from "@/lib/vehicles";

const currentYear = new Date().getFullYear();
const maxYear = currentYear + 1;

const FUEL_TYPES = ["ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE"] as const;
const TRANSMISSIONS = ["MANUELLE", "AUTOMATIQUE"] as const;
const PURCHASE_TYPES = ["VENTE", "LOCATION"] as const;
const VEHICLE_STATUSES = ["DISPONIBLE", "VENDU", "LOUE", "RESERVE"] as const;

/** Vrai si la chaîne est une URL absolue valide. */
function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** Découpe un textarea d'URLs (une par ligne), en ignorant les lignes vides. */
export function parseImageLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export const vehicleFormSchema = z.object({
  brand: z.string().trim().min(1, { error: "La marque est requise." }),
  model: z.string().trim().min(1, { error: "Le modèle est requis." }),
  year: z
    .string()
    .trim()
    .min(1, { error: "L'année est requise." })
    .refine((v) => /^\d+$/.test(v), { error: "L'année doit être un entier." })
    .refine((v) => Number(v) >= 1900 && Number(v) <= maxYear, {
      error: `L'année doit être comprise entre 1900 et ${maxYear}.`,
    }),
  mileage: z
    .string()
    .trim()
    .min(1, { error: "Le kilométrage est requis." })
    .refine((v) => /^\d+$/.test(v), {
      error: "Le kilométrage doit être un entier positif.",
    }),
  price: z
    .string()
    .trim()
    .min(1, { error: "Le prix est requis." })
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), {
      error: "Prix invalide (ex. 14990 ou 14990.00).",
    })
    .refine((v) => Number(v) > 0, { error: "Le prix doit être positif." }),
  fuelType: z.enum(FUEL_TYPES, { error: "La motorisation est requise." }),
  // purchaseType : requis à la création ; ignoré en édition (bascule via action dédiée).
  purchaseType: z.enum(PURCHASE_TYPES, { error: "Le type d'achat est requis." }),
  // Selects facultatifs : "" = non renseigné (converti en undefined au submit).
  transmission: z.union([z.enum(TRANSMISSIONS), z.literal("")]),
  color: z.string().trim(),
  description: z.string().trim(),
  status: z.union([z.enum(VEHICLE_STATUSES), z.literal("")]),
  images: z.string().refine(
    (v) => parseImageLines(v).every(isUrl),
    { error: "Chaque image doit être une URL valide (une par ligne)." },
  ),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

/** Valeurs initiales d'un formulaire vierge (création). */
export const emptyVehicleForm: VehicleFormValues = {
  brand: "",
  model: "",
  year: "",
  mileage: "",
  price: "",
  fuelType: "ESSENCE",
  purchaseType: "VENTE",
  transmission: "",
  color: "",
  description: "",
  status: "",
  images: "",
};

/** Convertit les valeurs du formulaire en payload de création (nombres + nettoyage). */
export function toCreateInput(values: VehicleFormValues): CreateVehicleInput {
  return {
    brand: values.brand.trim(),
    model: values.model.trim(),
    year: Number(values.year),
    mileage: Number(values.mileage),
    price: Number(values.price),
    fuelType: values.fuelType,
    purchaseType: values.purchaseType,
    ...(values.transmission ? { transmission: values.transmission } : {}),
    ...(values.color.trim() ? { color: values.color.trim() } : {}),
    ...(values.description.trim()
      ? { description: values.description.trim() }
      : {}),
    ...(values.status ? { status: values.status } : {}),
    images: parseImageLines(values.images),
  };
}

/**
 * Payload de mise à jour : tout sauf `purchaseType` (exclu côté backend ; la
 * bascule VENTE↔LOCATION passe par l'action dédiée).
 */
export function toUpdateInput(values: VehicleFormValues): UpdateVehicleInput {
  const { purchaseType: _ignored, ...rest } = toCreateInput(values);
  void _ignored;
  return rest;
}
