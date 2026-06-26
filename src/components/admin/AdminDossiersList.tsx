"use client";

/**
 * Liste des dossiers à instruire (back-office, US-010/011).
 *
 * Charge `GET /dossiers` (staff, paginé, filtrable par statut/type) et permet de
 * faire évoluer chaque dossier : mettre en instruction, demander un complément,
 * valider, refuser (motif obligatoire). Seules les transitions autorisées par la
 * machine à états sont proposées ; le serveur reste l'autorité (409 sinon).
 */

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  DOSSIER_STATUS_LABELS,
  DOSSIER_STATUS_TRANSITIONS,
  DOSSIER_TRANSITION_LABELS,
  DOSSIER_TYPE_LABELS,
  getDossierDetail,
  getStaffDossiers,
  OPTION_LABELS,
  updateDossierStatus,
  type StaffDossierFilters,
} from "@/lib/dossiers";
import { formatDate } from "@/lib/format";
import type {
  DossierDetailDocument,
  DossierStatus,
  DossierType,
  StaffDossier,
} from "@/lib/types";

/** Formate une taille de fichier en o / Ko / Mo. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

const PAGE_SIZE = 20;

const STATUS_OPTIONS: DossierStatus[] = [
  "EN_ATTENTE_DOCUMENTS",
  "EN_COURS",
  "COMPLEMENT_DEMANDE",
  "VALIDE",
  "REFUSE",
];

const STATUS_BADGE: Record<DossierStatus, string> = {
  EN_ATTENTE_DOCUMENTS: "bg-amber-100 text-amber-800",
  EN_COURS: "bg-blue-100 text-blue-800",
  COMPLEMENT_DEMANDE: "bg-amber-100 text-amber-800",
  VALIDE: "bg-emerald-100 text-emerald-800",
  REFUSE: "bg-red-100 text-red-800",
};

/** Couleur du bouton selon la transition cible. */
function transitionClass(target: DossierStatus): string {
  if (target === "VALIDE") {
    return "border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10";
  }
  if (target === "REFUSE") {
    return "border-red-500/40 text-red-700 hover:bg-red-500/10";
  }
  return "border-foreground/15 hover:bg-foreground/5";
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return "Accès réservé au back-office.";
    if (error.status === 401) return "Session expirée, reconnectez-vous.";
    return error.message;
  }
  return "Une erreur inattendue est survenue.";
}

export default function AdminDossiersList() {
  const [dossiers, setDossiers] = useState<StaffDossier[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<DossierStatus | "">("");
  const [type, setType] = useState<DossierType | "">("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback((): Promise<void> => {
    const filters: StaffDossierFilters = { page, limit: PAGE_SIZE };
    if (status) filters.status = status;
    if (type) filters.type = type;
    return getStaffDossiers(filters)
      .then((res) => {
        setDossiers(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        setLoadError(messageFor(error));
        setDossiers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, status, type]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mt-8">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Statut</span>
          <select
            value={status}
            onChange={(e) => {
              setLoading(true);
              setPage(1);
              setStatus(e.target.value as DossierStatus | "");
            }}
            className="rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {DOSSIER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Type</span>
          <select
            value={type}
            onChange={(e) => {
              setLoading(true);
              setPage(1);
              setType(e.target.value as DossierType | "");
            }}
            className="rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            <option value="ACHAT">Achat</option>
            <option value="LOCATION">Location</option>
          </select>
        </label>
      </div>

      {loadError && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
        >
          {loadError}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-foreground/60">Chargement des dossiers…</p>
      ) : dossiers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-foreground/10 p-8 text-center text-foreground/60">
          Aucun dossier pour ces filtres.
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {dossiers.map((dossier) => (
            <DossierInstructionCard
              key={dossier.id}
              dossier={dossier}
              onChanged={load}
            />
          ))}
        </ul>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-foreground/60">
        <span>{total} dossier(s)</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setPage((p) => Math.max(1, p - 1));
              }}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-foreground/15 px-3 py-1.5 font-medium transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Précédent
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setPage((p) => Math.min(totalPages, p + 1));
              }}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-foreground/15 px-3 py-1.5 font-medium transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function DossierInstructionCard({
  dossier,
  onChanged,
}: {
  dossier: StaffDossier;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refusing, setRefusing] = useState(false);
  const [motif, setMotif] = useState("");

  // Documents : chargés à la demande (URLs signées éphémères → pas de cache).
  const [docsOpen, setDocsOpen] = useState(false);
  const [docs, setDocs] = useState<DossierDetailDocument[] | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  const transitions = DOSSIER_STATUS_TRANSITIONS[dossier.status];
  const documentCount = dossier._count.documents;

  function loadDocs() {
    setDocsLoading(true);
    setDocsError(null);
    getDossierDetail(dossier.id)
      .then((detail) => setDocs(detail.documents))
      .catch((err: unknown) => setDocsError(messageFor(err)))
      .finally(() => setDocsLoading(false));
  }

  function toggleDocs() {
    if (docsOpen) {
      setDocsOpen(false);
      return;
    }
    setDocsOpen(true);
    loadDocs(); // (re)charge des URLs signées fraîches à chaque ouverture
  }

  async function applyStatus(next: DossierStatus, refusalMotif?: string) {
    setBusy(true);
    setError(null);
    try {
      await updateDossierStatus(dossier.id, { status: next, refusalMotif });
      await onChanged();
    } catch (err) {
      setError(messageFor(err));
      setBusy(false); // en cas de succès le composant est démonté par le reload
    }
  }

  function onConfirmRefuse() {
    if (!motif.trim()) {
      setError("Le motif de refus est obligatoire.");
      return;
    }
    void applyStatus("REFUSE", motif.trim());
  }

  return (
    <li className="rounded-xl border border-foreground/10 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[dossier.status]}`}
        >
          {DOSSIER_STATUS_LABELS[dossier.status]}
        </span>
        <span className="rounded-full bg-foreground/5 px-2.5 py-0.5 text-xs font-medium text-foreground/70">
          {DOSSIER_TYPE_LABELS[dossier.type]}
        </span>
        <span className="text-xs text-foreground/50">
          Déposé le {formatDate(dossier.createdAt)}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-foreground/50">Client</p>
          <p className="font-medium">
            {dossier.client.firstName} {dossier.client.lastName}
          </p>
          <p className="text-sm text-foreground/60">{dossier.client.email}</p>
        </div>
        <div>
          <p className="text-xs text-foreground/50">Véhicule</p>
          <p className="font-medium">
            {dossier.vehicle.brand} {dossier.vehicle.model} ({dossier.vehicle.year})
          </p>
          {dossier.options.length > 0 && (
            <p className="text-sm text-foreground/60">
              Options : {dossier.options.map((o) => OPTION_LABELS[o.type]).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Documents : ouverture à la demande (URLs signées valables 60 s). */}
      <div className="mt-3">
        {documentCount === 0 ? (
          <p className="text-sm text-foreground/50">Aucun document fourni.</p>
        ) : (
          <button
            type="button"
            onClick={toggleDocs}
            className="text-sm font-medium text-foreground/80 underline-offset-2 hover:underline"
            aria-expanded={docsOpen}
          >
            {docsOpen ? "▾" : "▸"} Documents ({documentCount})
          </button>
        )}

        {docsOpen && (
          <div className="mt-2 rounded-lg border border-foreground/10 p-3">
            {docsLoading ? (
              <p className="text-sm text-foreground/60">Chargement des documents…</p>
            ) : docsError ? (
              <div className="text-sm text-red-600">
                {docsError}{" "}
                <button
                  type="button"
                  onClick={loadDocs}
                  className="underline hover:no-underline"
                >
                  Réessayer
                </button>
              </div>
            ) : docs && docs.length > 0 ? (
              <>
                <ul className="flex flex-col gap-1">
                  {docs.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-700 hover:underline"
                      >
                        <span className="truncate">{doc.name}</span>
                        <span className="shrink-0 text-xs text-foreground/50">
                          {formatSize(doc.size)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 flex items-center gap-2 text-xs text-foreground/45">
                  Liens valables 60 s.
                  <button
                    type="button"
                    onClick={loadDocs}
                    className="underline hover:no-underline"
                  >
                    Rafraîchir
                  </button>
                </p>
              </>
            ) : (
              <p className="text-sm text-foreground/60">Aucun document.</p>
            )}
          </div>
        )}
      </div>

      {dossier.status === "REFUSE" && dossier.refusalMotif && (
        <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700">
          <span className="font-medium">Motif : </span>
          {dossier.refusalMotif}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Zone d'instruction : transitions autorisées uniquement. */}
      {transitions.length > 0 && !refusing && (
        <div className="mt-4 flex flex-wrap gap-2">
          {transitions.map((next) =>
            next === "REFUSE" ? (
              <button
                key={next}
                type="button"
                onClick={() => {
                  setError(null);
                  setRefusing(true);
                }}
                disabled={busy}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${transitionClass(next)}`}
              >
                {DOSSIER_TRANSITION_LABELS[next]}
              </button>
            ) : (
              <button
                key={next}
                type="button"
                onClick={() => void applyStatus(next)}
                disabled={busy}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${transitionClass(next)}`}
              >
                {DOSSIER_TRANSITION_LABELS[next]}
              </button>
            ),
          )}
        </div>
      )}

      {/* Formulaire de refus : motif obligatoire. */}
      {refusing && (
        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor={`motif-${dossier.id}`} className="text-sm font-medium">
            Motif du refus <span className="text-red-500">*</span>
          </label>
          <textarea
            id={`motif-${dossier.id}`}
            rows={2}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            className="rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
            placeholder="Expliquez la raison du refus (communiqué au client)."
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onConfirmRefuse}
              disabled={busy}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Refus en cours…" : "Confirmer le refus"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRefusing(false);
                setMotif("");
                setError(null);
              }}
              disabled={busy}
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
