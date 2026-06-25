"use client";

import RouteGuard from "@/components/auth/RouteGuard";
import { useAuth } from "@/context/AuthContext";

function CompteContent() {
  const { user } = useAuth();
  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-bold">Espace client</h1>
      <p className="mt-2 text-foreground/70">
        Bienvenue {user?.firstName} {user?.lastName}.
      </p>
    </main>
  );
}

export default function ComptePage() {
  return (
    <RouteGuard>
      <CompteContent />
    </RouteGuard>
  );
}
