"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/schemas";
import { useAuth } from "@/context/AuthContext";
import { applyApiError } from "@/lib/apiErrors";
import { safeInternalPath } from "@/lib/redirect";
import AuthField from "./AuthField";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerUser } = useAuth();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", firstName: "", lastName: "", phone: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    try {
      // "" → undefined : on n'envoie pas un téléphone vide au backend.
      await registerUser({ ...values, phone: values.phone || undefined });
      router.push(safeInternalPath(searchParams.get("redirect")));
      router.refresh();
    } catch (error) {
      setRootError(applyApiError(error, setError));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {rootError && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
        >
          {rootError}
        </p>
      )}

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
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <AuthField
        label="Téléphone (optionnel)"
        type="tel"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <AuthField
        label="Mot de passe"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <p className="-mt-2 text-xs text-foreground/60">
        Au moins 8 caractères, avec une minuscule, une majuscule et un chiffre.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? "Création…" : "Créer mon compte"}
      </button>

      <p className="text-sm text-foreground/70">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
