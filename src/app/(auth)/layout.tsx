"use client";

import type { ReactNode } from "react";
import GuestGuard from "@/components/auth/GuestGuard";

/**
 * Layout du groupe `(auth)` : protège `/login` et `/register` des utilisateurs
 * déjà connectés (redirigés vers `/compte`).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <GuestGuard>{children}</GuestGuard>;
}
