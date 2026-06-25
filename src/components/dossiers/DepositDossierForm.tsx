"use client";

/**
 * Formulaire de dépôt de dossier (US-005).
 *
 * Flux :
 *  1. charge le véhicule (résumé + détermine le type de dossier) ;
 *  2. type dérivé du véhicule : VENTE → ACHAT, LOCATION → LOCATION
 *     (non modifiable par l'utilisateur) ;
 *  3. options proposées UNIQUEMENT pour une LOCATION (@CONTEXT.md §5) ;
 *  4. sélection des documents (validés côté client : PDF/JPEG/PNG, ≤ 10 Mo) ;
 *  5. submit : `POST /dossiers` puis upload de chaque document (1 fichier / appel).
 *
 * Le `clientId` n'est jamais envoyé : le backend le dérive du cookie de session.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  createDossier,
  OPTION_LABELS,
  uploadDossierDocument,
  validateDocument,
} from "@/lib/dossiers";
import { formatPrice } from "@/lib/format";
import type { DossierType, OptionType, Vehicle } from "@/lib/types";
import { getVehicle } from "@/lib/vehicles";

const OPTION_TYPES = Object.keys(OPTION_LABELS) as OptionType[];

/** Traduit une erreur API en message affichable. */
function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
    }
    if (error.status === 403) {
      return "Vous n'avez pas les droits pour déposer un dossier.";
    }
    return error.message;
  }
  return "Une erreur inattendue est survenue.";
}

interface SubmitResult {
  dossierId: string;
  total: number;
  /** Noms des documents dont l'upload a échoué (le dossier, lui, est créé). */
  failed: string[];
}

export default function DepositDossierForm({
  vehicleId,
}: {
  vehicleId: string;
}) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);

  const [options, setOptions] = useState<OptionType[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [fileNotice, setFileNotice] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    let active = true;
    getVehicle(vehicleId)
      .then((v) => {
        if (active) setVehicle(v);
      })
      .catch((error) => {
        if (active) {
          setLoadError(
            error instanceof ApiError && error.status === 404
              ? "Véhicule introuvable."
              : messageFor(error),
          );
        }
      })
      .finally(() => {
        if (active) setLoadingVehicle(false);
      });
    return () => {
      active = false;
    };
  }, [vehicleId]);

  if (loadingVehicle) {
    return <p className="mt-6 text-sm text-foreground/60">Chargement du véhicule…</p>;
  }

  if (loadError || !vehicle) {
    return (
      <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <p className="font-medium text-red-600">
          {loadError ?? "Véhicule introuvable."}
        </p>
        <Link href="/catalogue" className="mt-2 inline-block text-sm underline">
          ← Retour au catalogue
        </Link>
      </div>
    );
  }

  const isLocation = vehicle.purchaseType === "LOCATION";
  const type: DossierType = isLocation ? "LOCATION" : "ACHAT";

  // ----- Écran de confirmation -----
  if (result) {
    return (
      <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <h2 className="text-lg font-semibold text-emerald-700">
          Dossier déposé
        </h2>
        <p className="mt-1 text-sm text-foreground/70">
          {result.failed.length === 0
            ? `${result.total} document(s) transmis. Votre dossier est en attente d'instruction.`
            : `Dossier créé, mais ${result.failed.length} document(s) n'ont pas pu être envoyés : ${result.failed.join(", ")}. Vous pourrez les renvoyer depuis le suivi de vos dossiers.`}
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/compte"
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Voir mes dossiers
          </Link>
          <Link
            href={`/vehicules/${vehicle.id}`}
            className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground"
          >
            Retour au véhicule
          </Link>
        </div>
      </div>
    );
  }

  function toggleOption(option: OptionType) {
    setOptions((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option],
    );
  }

  function onFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of selected) {
      if (validateDocument(file)) rejected.push(file.name);
      else accepted.push(file);
    }
    setFiles((prev) => [...prev, ...accepted]);
    setFileNotice(
      rejected.length
        ? `Ignoré(s) (format ou taille) : ${rejected.join(", ")}`
        : null,
    );
    // Réinitialise pour autoriser une nouvelle sélection du même fichier.
    event.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setRootError(null);

    if (files.length === 0) {
      setRootError("Ajoutez au moins un document avant de déposer le dossier.");
      return;
    }

    setSubmitting(true);
    try {
      const dossier = await createDossier({
        vehicleId: vehicle!.id,
        type,
        options: isLocation && options.length ? options : undefined,
      });

      // Upload séquentiel : 1 fichier par requête. Une erreur sur un fichier
      // n'annule pas le dossier (déjà créé) → on collecte les échecs.
      const failed: string[] = [];
      for (const file of files) {
        try {
          await uploadDossierDocument(dossier.id, file);
        } catch {
          failed.push(file.name);
        }
      }

      setResult({ dossierId: dossier.id, total: files.length, failed });
    } catch (error) {
      setRootError(messageFor(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
      {/* Résumé véhicule */}
      <section className="rounded-xl border border-foreground/10 p-4">
        <p className="text-sm text-foreground/50">
          {isLocation ? "Location" : "Vente"}
        </p>
        <p className="font-semibold">
          {vehicle.brand} {vehicle.model} ({vehicle.year})
        </p>
        <p className="mt-1 text-sm text-foreground/70">
          {formatPrice(vehicle.price)}
          {isLocation && " / mois"}
        </p>
      </section>

      {/* Options (LOCATION uniquement) */}
      {isLocation && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">
            Options (facultatif)
          </legend>
          {OPTION_TYPES.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={options.includes(option)}
                onChange={() => toggleOption(option)}
                className="h-4 w-4"
              />
              {OPTION_LABELS[option]}
            </label>
          ))}
        </fieldset>
      )}

      {/* Documents */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Documents</legend>
        <p className="text-xs text-foreground/60">
          PDF, JPEG ou PNG, 10 Mo maximum par fichier.
        </p>
        <input
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png"
          onChange={onFilesSelected}
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-foreground file:px-3 file:py-2 file:text-sm file:font-medium file:text-background"
        />
        {fileNotice && (
          <p className="text-xs text-amber-600">{fileNotice}</p>
        )}
        {files.length > 0 && (
          <ul className="mt-1 flex flex-col gap-1">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-lg border border-foreground/10 px-3 py-2 text-sm"
              >
                <span className="truncate">
                  {file.name}{" "}
                  <span className="text-foreground/50">
                    ({(file.size / 1024 / 1024).toFixed(1)} Mo)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-3 shrink-0 text-foreground/50 hover:text-red-600"
                  aria-label={`Retirer ${file.name}`}
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {rootError && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
        >
          {rootError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-xl bg-foreground px-6 py-3 text-base font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Envoi en cours…" : "Déposer le dossier"}
      </button>
    </form>
  );
}
