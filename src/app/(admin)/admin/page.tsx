"use client";

import RouteGuard from "@/components/auth/RouteGuard";

export default function AdminPage() {
  return (
    <RouteGuard roles={["GESTIONNAIRE", "ADMIN"]}>
      <main className="mx-auto max-w-6xl p-8">
        <h1 className="text-2xl font-bold">Back-office</h1>
        <p className="mt-2 text-foreground/70">
          Administration du catalogue et des utilisateurs.
        </p>
      </main>
    </RouteGuard>
  );
}
