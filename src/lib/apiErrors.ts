/**
 * Pont entre les erreurs API (`ApiError`) et React Hook Form.
 *
 * Le backend renvoie sur un 400 de validation : `{ message, errors: { champ: string[] } }`
 * (@CONTEXT.md §3). On reporte ces erreurs sur les champs RHF correspondants et on
 * renvoie un message global pour les erreurs non liées à un champ (401, 409, 429, 500…).
 */

import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "./api";

/** Vrai si `value` ressemble à la map `{ champ: string[] }` du backend. */
function isFieldErrorMap(value: unknown): value is Record<string, string[]> {
  return value !== null && typeof value === "object";
}

/**
 * Applique une erreur API à un formulaire RHF.
 *
 * - 400 avec `errors` → `setError` champ par champ (premier message de chaque champ).
 * - Sinon → ne touche pas aux champs.
 *
 * @returns Le message à afficher globalement (au-dessus du formulaire).
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string {
  if (!(error instanceof ApiError)) {
    return "Une erreur inattendue est survenue. Réessayez.";
  }

  if (error.status === 429) {
    return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
  }

  const data = error.data;
  if (
    error.status === 400 &&
    data !== null &&
    typeof data === "object" &&
    "errors" in data &&
    isFieldErrorMap((data as { errors: unknown }).errors)
  ) {
    const fieldErrors = (data as { errors: Record<string, string[]> }).errors;
    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages?.length) {
        setError(field as Path<T>, { type: "server", message: messages[0] });
      }
    }
  }

  return error.message;
}
