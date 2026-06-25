"use client";

/**
 * Galerie d'images d'une fiche véhicule (Client Component).
 *
 * Seule partie interactive de la page (sélection de la photo affichée) : isolée
 * ici pour que la page reste un Server Component (SEO). Affiche une photo
 * principale ; si plusieurs images existent, une bande de miniatures cliquables
 * permet de changer la photo affichée.
 */

import { useState } from "react";

export default function VehicleGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-foreground/5 text-sm text-foreground/40">
        Pas de photo
      </div>
    );
  }

  const active = images[activeIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-foreground/5">
        {/* eslint-disable-next-line @next/next/no-img-element -- URLs arbitraires : <img> évite la config remotePatterns de next/image. */}
        <img
          src={active}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((url, index) => {
            const selected = index === activeIndex;
            return (
              <li key={url}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Voir la photo ${index + 1}`}
                  aria-current={selected}
                  className={`block aspect-[4/3] w-full overflow-hidden rounded-lg border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 ${
                    selected
                      ? "border-foreground"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- voir ci-dessus */}
                  <img
                    src={url}
                    alt={`${alt} — miniature ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
