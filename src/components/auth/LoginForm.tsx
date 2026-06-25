"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/schemas";
import { useAuth } from "@/context/AuthContext";
import { applyApiError } from "@/lib/apiErrors";
import { safeInternalPath } from "@/lib/redirect";
import AuthField from "./AuthField";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    try {
      await login(values);
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

      <AuthField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <AuthField
        label="Mot de passe"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-sm text-foreground/70">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-medium underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
