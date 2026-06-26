/**
 * Schémas de validation Zod de l'espace compte (profil + mot de passe).
 *
 * Alignés sur le backend (`PATCH /users/me`, `PATCH /users/me/password`) :
 * - profil : firstName / lastName requis, phone optionnel (vidé → effacé) ;
 *   email, mot de passe et rôle ne sont PAS modifiables ici ;
 * - mot de passe : ancien requis + nouveau respectant la même politique qu'à
 *   l'inscription, et différent de l'actuel.
 */

import { z } from "zod";
import { passwordSchema } from "./auth";

/** Mise à jour de son profil. */
export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, { error: "Le prénom est requis." }),
  lastName: z.string().trim().min(1, { error: "Le nom est requis." }),
  /** Optionnel : champ vidé → on enverra `null` au backend pour effacer. */
  phone: z.string().trim().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Changement de son mot de passe (avec confirmation côté client). */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: "Le mot de passe actuel est requis." }),
    newPassword: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, { error: "Confirmez le nouveau mot de passe." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    error: "Le nouveau mot de passe doit être différent de l'actuel.",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
