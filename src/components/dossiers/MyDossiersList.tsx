"use client";

/**
 * Suivi des dossiers du client connecté (US-007).
 *
 * Charge `GET /dossiers/me` et affiche chaque dossier avec son véhicule, son type,
 * son statut (badge + explication), ses options et ses documents. Le motif de
 * refus est mis en avant quand le dossier est REFUSE.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  addDossierOptions,
  getMyDossiers,
  getOptionsCatalog,
  OPTION_LABELS,
} from "@/lib/dossiers";
import { formatDate, formatPriceCents } from "@/lib/format";
import type {
  ClientDossier,
  DossierStatus,
  DossierType,
  OptionType,
  PricedOption,
} from "@/lib/types";

interface StatusMeta {
  label: string;
  /** Classes Tailwind du badge. */
  badge: string;
  /** Phrase d'explication affichée sous le statut. */
  hint: string;
}

const STATUS_META: Record<DossierStatus, StatusMeta> = {
  EN_ATTENTE_DOCUMENTS: {
    label: "En attente de documents",
    badge: "bg-amber-100 text-amber-800",
    hint: "Des pièces justificatives sont encore attendues.",
  },
  EN_COURS: {
    label: "En cours d'instruction",
    badge: "bg-blue-100 text-blue-800",
    hint: "Votre dossier est en cours d'examen par nos équipes.",
  },
  COMPLEMENT_DEMANDE: {
    label: "Complément demandé",
    badge: "bg-amber-100 text-amber-800",
    hint: "Un complément d'information vous est demandé.",
  },
  VALIDE: {
    label: "Validé",
    badge: "bg-emerald-100 text-emerald-800",
    hint: "Votre dossier a été validé. Nous vous recontactons pour la suite.",
  },
  REFUSE: {
    label: "Refusé",
    badge: "bg-red-100 text-red-800",
    hint: "Votre dossier n'a pas été retenu.",
  },
};

const TYPE_LABEL: Record<DossierType, string> = {
  ACHAT: "Achat",
  LOCATION: "Location",
};

export default function MyDossiersList() {
  const [dossiers, setDossiers] = useState<ClientDossier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Catalogue tarifé partagé entre les cartes (prix + ajout d'options). Un échec
  // ne casse pas l'affichage : on dégrade simplement la partie options.
  const [catalog, setCatalog] = useState<PricedOption[] | null>(null);

  useEffect(() => {
    let active = true;
    getMyDossiers()
      .then((data) => {
        if (active) setDossiers(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Impossible de charger vos dossiers.",
          );
        }
      });
    getOptionsCatalog()
      .then((c) => {
        if (active) setCatalog(c);
      })
      .catch(() => {
        if (active) setCatalog([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (dossiers === null) {
    return <p className="text-sm text-foreground/60">Chargement de vos dossiers…</p>;
  }

  if (dossiers.length === 0) {
    return (
      <div className="rounded-xl border border-foreground/10 p-6 text-center">
        <p className="text-foreground/70">
          {"Vous n'avez encore aucun dossier."}
        </p>
        <Link
          href="/catalogue"
          className="mt-3 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Parcourir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {dossiers.map((dossier) => (
        <DossierCard key={dossier.id} dossier={dossier} catalog={catalog} />
      ))}
    </ul>
  );
}

function DossierCard({
  dossier,
  catalog,
}: {
  dossier: ClientDossier;
  catalog: PricedOption[] | null;
}) {
  const status = STATUS_META[dossier.status];
  const { vehicle } = dossier;
  const thumbnail = vehicle.images[0];

  // Copie locale des options pour refléter un ajout sans recharger toute la liste.
  const [optionTypes, setOptionTypes] = useState<OptionType[]>(() =>
    dossier.options.map((o) => o.type),
  );
  const [serverMonthly, setServerMonthly] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [selection, setSelection] = useState<OptionType[]>([]);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const isLocation = dossier.type === "LOCATION";
  const finalized = dossier.status === "VALIDE" || dossier.status === "REFUSE";
  const canAddOptions = isLocation && !finalized;

  // Options du catalogue pas encore présentes sur le dossier.
  const available = (catalog ?? []).filter((o) => !optionTypes.includes(o.type));

  // Total mensuel : valeur serveur après un ajout, sinon recalculée localement
  // depuis le catalogue (affichage seulement ; le serveur reste la référence).
  const monthlyTotal =
    serverMonthly ??
    (catalog
      ? String(
          catalog
            .filter((o) => optionTypes.includes(o.type))
            .reduce((sum, o) => sum + Number(o.monthlyPrice), 0),
        )
      : null);

  function toggleSelect(type: OptionType) {
    setSelection((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  async function submitOptions() {
    if (selection.length === 0) return;
    setSaving(true);
    setAddError(null);
    try {
      const updated = await addDossierOptions(dossier.id, selection);
      setOptionTypes(updated.options.map((o) => o.type));
      setServerMonthly(updated.monthlyOptionsTotal);
      setSelection([]);
      setAdding(false);
    } catch (err) {
      setAddError(
        err instanceof ApiError
          ? err.message
          : "Impossible d'ajouter les options.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-foreground/10 p-4 sm:flex-row">
      {thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element -- URLs arbitraires : <img> évite la config remotePatterns de next/image.
        <img
          src={thumbnail}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-24 w-full rounded-lg object-cover sm:w-36"
        />
      )}

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.badge}`}
          >
            {status.label}
          </span>
          <span className="rounded-full bg-foreground/5 px-2.5 py-0.5 text-xs font-medium text-foreground/70">
            {TYPE_LABEL[dossier.type]}
          </span>
        </div>

        <Link
          href={`/vehicules/${vehicle.id}`}
          className="mt-2 inline-block font-semibold hover:underline"
        >
          {vehicle.brand} {vehicle.model} ({vehicle.year})
        </Link>

        <p className="mt-1 text-xs text-foreground/50">
          Déposé le {formatDate(dossier.createdAt)} ·{" "}
          {dossier.documents.length} document(s)
        </p>

        <p className="mt-2 text-sm text-foreground/70">{status.hint}</p>

        {dossier.status === "REFUSE" && dossier.refusalMotif && (
          <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700">
            <span className="font-medium">Motif : </span>
            {dossier.refusalMotif}
          </p>
        )}

        {isLocation && (
          <div className="mt-2">
            {optionTypes.length > 0 ? (
              <p className="text-xs text-foreground/60">
                Options : {optionTypes.map((t) => OPTION_LABELS[t]).join(", ")}
                {monthlyTotal && Number(monthlyTotal) > 0 && (
                  <> — {formatPriceCents(monthlyTotal)} / mois</>
                )}
              </p>
            ) : (
              <p className="text-xs text-foreground/50">Aucune option.</p>
            )}

            {canAddOptions && available.length > 0 && (
              <div className="mt-1">
                {!adding ? (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="text-xs font-medium text-blue-700 hover:underline"
                  >
                    + Ajouter des options
                  </button>
                ) : (
                  <div className="mt-1 rounded-lg border border-foreground/10 p-3">
                    <div className="flex flex-col gap-1">
                      {available.map((opt) => (
                        <label
                          key={opt.type}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selection.includes(opt.type)}
                              onChange={() => toggleSelect(opt.type)}
                              className="h-4 w-4"
                            />
                            {opt.label}
                          </span>
                          <span className="shrink-0 text-foreground/60">
                            {formatPriceCents(opt.monthlyPrice)} / mois
                          </span>
                        </label>
                      ))}
                    </div>
                    {addError && (
                      <p className="mt-2 text-xs text-red-600">{addError}</p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={submitOptions}
                        disabled={saving || selection.length === 0}
                        className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
                      >
                        {saving ? "Ajout…" : "Valider les options"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAdding(false);
                          setSelection([]);
                          setAddError(null);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-foreground/60 hover:text-foreground"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
