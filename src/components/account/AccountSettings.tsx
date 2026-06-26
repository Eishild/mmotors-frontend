"use client";

/**
 * Espace compte — informations personnelles + mot de passe (US-003).
 *
 * Deux formulaires indépendants au-dessus du module backend `users` :
 *  - profil (`PATCH /users/me`) : prénom, nom, téléphone. L'email n'est pas
 *    modifiable (affiché en lecture seule). Après succès, on resynchronise le
 *    contexte d'auth (`refresh`) pour que le nom affiché partout soit à jour.
 *  - mot de passe (`PATCH /users/me/password`) : ancien + nouveau (confirmé).
 *
 * Réutilise le pattern auth du projet : React Hook Form + resolver Zod +
 * `AuthField` + `applyApiError` (mappe les 400 de validation sur les champs).
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from "@/schemas";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { applyApiError } from "@/lib/apiErrors";
import { changePassword, updateProfile } from "@/lib/account";
import AuthField from "@/components/auth/AuthField";

export default function AccountSettings() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ProfileForm />
      <PasswordForm />
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-foreground/10 p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SuccessNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
    >
      {children}
    </p>
  );
}

function RootError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
    >
      {children}
    </p>
  );
}

function ProfileForm() {
  const { user, refresh } = useAuth();
  const [rootError, setRootError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    // `values` (et non defaultValues) : le formulaire se cale sur l'utilisateur
    // courant et se met à jour si celui-ci change (ex. après refresh).
    values: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    setSaved(false);
    try {
      await updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        // Champ vidé → null pour effacer le numéro côté backend.
        phone: values.phone?.trim() ? values.phone.trim() : null,
      });
      await refresh();
      setSaved(true);
      reset(values); // remet le formulaire à l'état « propre » (isDirty = false)
    } catch (error) {
      setRootError(applyApiError(error, setError));
    }
  });

  return (
    <Card title="Mes informations">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {rootError && <RootError>{rootError}</RootError>}
        {saved && <SuccessNote>Profil mis à jour.</SuccessNote>}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground/70">Email</label>
          <input
            value={user?.email ?? ""}
            disabled
            className="cursor-not-allowed rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm text-foreground/60"
          />
          <p className="text-xs text-foreground/50">
            L&apos;adresse email n&apos;est pas modifiable.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <AuthField
            label="Prénom"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <AuthField
            label="Nom"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>

        <AuthField
          label="Téléphone (optionnel)"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="self-start rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const [rootError, setRootError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    setSaved(false);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setSaved(true);
      reset();
    } catch (error) {
      // Mot de passe actuel incorrect (401) → erreur ciblée sous le champ.
      if (error instanceof ApiError && error.status === 401) {
        setError("currentPassword", { type: "server", message: error.message });
        return;
      }
      setRootError(applyApiError(error, setError));
    }
  });

  return (
    <Card title="Mot de passe">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {rootError && <RootError>{rootError}</RootError>}
        {saved && <SuccessNote>Mot de passe mis à jour.</SuccessNote>}

        <AuthField
          label="Mot de passe actuel"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />
        <AuthField
          label="Nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <p className="-mt-2 text-xs text-foreground/60">
          Au moins 8 caractères, avec une minuscule, une majuscule et un chiffre.
        </p>
        <AuthField
          label="Confirmer le nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="self-start rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Modification…" : "Changer le mot de passe"}
        </button>
      </form>
    </Card>
  );
}
