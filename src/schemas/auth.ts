/**
 * Schémas de validation Zod pour l'authentification.
 *
 * Alignés sur les règles du backend (@CONTEXT.md §5, section Auth) :
 * - email valide (trimmé/minusculé côté serveur, on le trim aussi ici) ;
 * - mot de passe ≥ 8 caractères, avec au moins une minuscule, une majuscule
 *   et un chiffre.
 *
 * Ces schémas servent à la fois :
 * - de validateur côté client via `@hookform/resolvers/zod` (resolver RHF) ;
 * - de source pour les types de formulaire (`z.infer`), évitant de redéclarer
 *   les champs à la main.
 */

import { z } from "zod";

/** Règles mot de passe identiques au backend (réutilisées par register + compte). */
export const passwordSchema = z
  .string()
  .min(8, { error: "Le mot de passe doit contenir au moins 8 caractères." })
  .regex(/[a-z]/, { error: "Le mot de passe doit contenir une minuscule." })
  .regex(/[A-Z]/, { error: "Le mot de passe doit contenir une majuscule." })
  .regex(/[0-9]/, { error: "Le mot de passe doit contenir un chiffre." });

/** Connexion : on ne revalide pas la complexité (juste « requis »). */
export const loginSchema = z.object({
  email: z
    .email({ error: "Email invalide." })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, { error: "Le mot de passe est requis." }),
});

/** Inscription : email + mot de passe complexe + identité. */
export const registerSchema = z.object({
  email: z
    .email({ error: "Email invalide." })
    .trim()
    .toLowerCase(),
  password: passwordSchema,
  firstName: z
    .string()
    .trim()
    .min(1, { error: "Le prénom est requis." }),
  lastName: z
    .string()
    .trim()
    .min(1, { error: "Le nom est requis." }),
  /**
   * Optionnel côté backend (`phone?`). Pas de `.transform()` ici : un transform
   * ferait diverger les types entrée/sortie du schéma et casserait le typage du
   * resolver RHF. La normalisation « "" → undefined » se fait au submit.
   */
  phone: z.string().trim().optional(),
});

/** Types de formulaire dérivés des schémas (pas de redéclaration manuelle). */
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
