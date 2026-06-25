"use client";

/**
 * En-tête global + barre de navigation (Client Component).
 *
 * Client car il met en évidence le lien actif (`usePathname`) et gère le menu
 * mobile (state). La navigation reste de simples <Link> (rendu/route côté Next).
 *
 * NB : pas encore d'affichage conditionnel selon l'état connecté/déconnecté —
 * l'auth repose sur un cookie httpOnly et il n'existe ni `GET /auth/me` ni
 * AuthContext pour l'instant. À brancher ici quand ce contexte sera créé.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/catalogue", label: "Catalogue" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string): boolean {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          M-Motors
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-foreground/10 text-foreground"
                  : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Inscription
          </Link>
        </div>

        {/* Bouton menu mobile */}
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label="Ouvrir le menu"
          className="rounded-lg border border-foreground/15 p-2 sm:hidden"
        >
          <span className="block h-0.5 w-5 bg-foreground" />
          <span className="mt-1 block h-0.5 w-5 bg-foreground" />
          <span className="mt-1 block h-0.5 w-5 bg-foreground" />
        </button>
      </div>

      {/* Panneau mobile déroulant */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          className="flex flex-col gap-1 border-t border-foreground/10 p-4 sm:hidden"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                isActive(link.href)
                  ? "bg-foreground/10 text-foreground"
                  : "text-foreground/70 hover:bg-foreground/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <hr className="my-2 border-foreground/10" />
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-foreground/5"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg bg-foreground px-3 py-2 text-center text-sm font-medium text-background"
          >
            Inscription
          </Link>
        </nav>
      )}
    </header>
  );
}
