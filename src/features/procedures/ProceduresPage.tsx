import { useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { CalendarIcon, DocumentIcon, SearchIcon } from "../../components/icons";
import { MiraLogo } from "../../components/icons/MiraLogo";
import { formatCount } from "../../lib/format";
import { fetchCoverage } from "../coverage/api";
import { fetchProcedures, type Procedure, type ProcedureQuery, type ProcedureStatus } from "./api";

const PAGE_SIZE = 25;
const STATUSES: ReadonlyArray<{ value: ProcedureStatus; label: string }> = [
  { value: "PLANNED", label: "Planificado" },
  { value: "PUBLISHED", label: "Publicado" },
  { value: "OPEN", label: "Abierto" },
  { value: "EVALUATION", label: "En evaluación" },
  { value: "AWARDED", label: "Adjudicado" },
  { value: "CONTRACTED", label: "Contratado" },
  { value: "COMPLETED", label: "Completado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "DESERTED", label: "Desierto" },
  { value: "SUSPENDED", label: "Suspendido" },
];
const STATUS_VALUES = new Set<ProcedureStatus>(STATUSES.map(({ value }) => value));
const DATE_FORMAT = new Intl.DateTimeFormat("es", { dateStyle: "medium" });
const FALLBACK_COUNTRIES = [
  ["GT", "Guatemala"],
  ["HN", "Honduras"],
  ["CR", "Costa Rica"],
  ["NI", "Nicaragua"],
  ["SV", "El Salvador"],
  ["PA", "Panamá"],
] as const;

type Filters = {
  q: string;
  country: string;
  status: string;
  method: string;
  from: string;
  to: string;
};

function readFilters(params: URLSearchParams): Filters {
  return {
    q: params.get("q") ?? "",
    country: params.get("pais") ?? "",
    status: params.get("estado") ?? "",
    method: params.get("modalidad") ?? "",
    from: params.get("desde") ?? "",
    to: params.get("hasta") ?? "",
  };
}

function statusLabel(status: Procedure["process_status"]) {
  return STATUSES.find(({ value }) => value === status)?.label ?? "Sin estado";
}

function formatDate(value: string | null | undefined) {
  return value ? DATE_FORMAT.format(new Date(value)) : "Sin fecha";
}

function formatAmount(value: string | null | undefined, currency: string | null | undefined) {
  if (!value || !Number.isFinite(Number(value))) return "Sin monto estimado";
  if (!currency) return new Intl.NumberFormat("es").format(Number(value));
  try {
    return new Intl.NumberFormat("es", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return `${new Intl.NumberFormat("es").format(Number(value))} ${currency}`;
  }
}

function safeUrl(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function ProceduresPage() {
  const [params, setParams] = useSearchParams();
  const applied = useMemo(() => readFilters(params), [params]);
  const [draft, setDraft] = useState(applied);
  const page = Math.min(10_000, Math.max(1, Math.floor(Number(params.get("pagina")) || 1)));

  useEffect(() => setDraft(applied), [applied]);
  useEffect(() => {
    const previous = document.title;
    document.title = "Procedimientos - MIRA";
    return () => {
      document.title = previous;
    };
  }, []);

  const coverage = useQuery({ queryKey: ["coverage"], queryFn: fetchCoverage });
  const countryOptions = coverage.data
    ? (coverage.data.countries ?? [])
        .filter(({ status }) => status === "ACTIVE")
        .map(({ country_code, country_name }) => [country_code, country_name] as const)
    : coverage.isError
      ? FALLBACK_COUNTRIES
      : [];

  const query = useMemo<ProcedureQuery>(() => {
    const cleanQ = applied.q.trim();
    const status = STATUS_VALUES.has(applied.status as ProcedureStatus)
      ? ([applied.status] as ProcedureStatus[])
      : undefined;
    return {
      q: cleanQ.length >= 2 ? cleanQ : undefined,
      country: /^[a-z]{2}$/i.test(applied.country) ? [applied.country.toUpperCase()] : undefined,
      status,
      procurement_method: applied.method.trim() ? [applied.method.trim()] : undefined,
      published_from: applied.from || undefined,
      published_to: applied.to || undefined,
      page,
      page_size: PAGE_SIZE,
    };
  }, [applied, page]);

  const result = useQuery({
    queryKey: ["procedures", query],
    queryFn: () => fetchProcedures(query),
    placeholderData: (previous) => previous,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams();
    if (draft.q.trim()) next.set("q", draft.q.trim());
    if (draft.country) next.set("pais", draft.country);
    if (draft.status) next.set("estado", draft.status);
    if (draft.method.trim()) next.set("modalidad", draft.method.trim());
    if (draft.from) next.set("desde", draft.from);
    if (draft.to) next.set("hasta", draft.to);
    setParams(next);
  };

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    if (nextPage <= 1) next.delete("pagina");
    else next.set("pagina", String(nextPage));
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const data = result.data;
  const items = data?.items ?? [];

  return (
    <div className="site-shell procedures-shell">
      <main className="procedures-page">
        <header className="procedures-header">
          <Link to="/" className="procedures-brand" aria-label="Volver al inicio de MIRA">
            <MiraLogo />
            <span>MIRA</span>
          </Link>
          <Link to="/" className="back-home">
            Volver al inicio
          </Link>
        </header>

        <section className="procedures-intro">
          <div>
            <span>Catálogo público</span>
            <h1>Explora los procedimientos</h1>
            <p>
              Consulta directamente los registros cargados, sin utilizar inteligencia artificial.
            </p>
          </div>
          <DocumentIcon size={52} />
        </section>

        <form className="procedure-filters card" onSubmit={submit}>
          <label className="filter-search">
            <span>Palabra o número</span>
            <div>
              <SearchIcon size={19} />
              <input
                value={draft.q}
                minLength={2}
                maxLength={200}
                placeholder="Ej. medicamentos o 45/2026"
                onChange={(event) => setDraft({ ...draft, q: event.target.value })}
              />
            </div>
          </label>
          <label>
            <span>País</span>
            <select
              value={draft.country}
              onChange={(event) => setDraft({ ...draft, country: event.target.value })}
            >
              <option value="">Todos los países</option>
              {countryOptions.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Estado</span>
            <select
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value })}
            >
              <option value="">Todos los estados</option>
              {STATUSES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Modalidad</span>
            <input
              value={draft.method}
              maxLength={160}
              placeholder="Ej. contratación menor"
              onChange={(event) => setDraft({ ...draft, method: event.target.value })}
            />
          </label>
          <label>
            <span>Publicado desde</span>
            <input
              type="date"
              value={draft.from}
              max={draft.to || undefined}
              onChange={(event) => setDraft({ ...draft, from: event.target.value })}
            />
          </label>
          <label>
            <span>Publicado hasta</span>
            <input
              type="date"
              value={draft.to}
              min={draft.from || undefined}
              onChange={(event) => setDraft({ ...draft, to: event.target.value })}
            />
          </label>
          <div className="filter-actions">
            <button type="submit">Buscar</button>
            <button
              type="button"
              onClick={() => {
                setDraft(readFilters(new URLSearchParams()));
                setParams(new URLSearchParams());
              }}
            >
              Limpiar
            </button>
          </div>
        </form>

        <section className="procedure-results" aria-live="polite">
          <div className="results-heading">
            <div>
              <h2>Resultados</h2>
              <p className="tabular">
                {result.isLoading
                  ? "Consultando registros…"
                  : `${formatCount(data?.total)} procedimientos encontrados`}
              </p>
            </div>
            {result.isFetching && !result.isLoading && <span>Actualizando…</span>}
          </div>

          {result.isError ? (
            <div className="results-state card" role="alert">
              No pudimos consultar los procedimientos. Intenta de nuevo en un momento.
            </div>
          ) : !result.isLoading && items.length === 0 ? (
            <div className="results-state card">
              <SearchIcon size={28} />
              <strong>No encontramos procedimientos con estos filtros.</strong>
              <span>Prueba con menos filtros o con otra palabra.</span>
            </div>
          ) : (
            <div className="procedure-table-wrap card">
              <table className="procedure-table">
                <thead>
                  <tr>
                    <th>Procedimiento</th>
                    <th>País</th>
                    <th>Estado</th>
                    <th>Publicación</th>
                    <th>Monto estimado</th>
                    <th>Fuente</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((procedure) => {
                    const sourceUrl = safeUrl(procedure.source_url);
                    return (
                      <tr key={procedure.process_id}>
                        <td data-label="Procedimiento">
                          <strong>{procedure.title || "Procedimiento sin título"}</strong>
                          <small className="tabular">
                            {procedure.process_number || procedure.process_id}
                          </small>
                          {procedure.procurement_method && (
                            <small>{procedure.procurement_method}</small>
                          )}
                        </td>
                        <td data-label="País">
                          <b className="country-code tabular">{procedure.country_code}</b>
                        </td>
                        <td data-label="Estado">
                          <b
                            className={`status-badge status-${procedure.process_status?.toLowerCase() ?? "unknown"}`}
                          >
                            {statusLabel(procedure.process_status)}
                          </b>
                        </td>
                        <td data-label="Publicación">
                          <CalendarIcon size={16} /> {formatDate(procedure.publication_date)}
                        </td>
                        <td data-label="Monto estimado" className="tabular">
                          {formatAmount(procedure.estimated_amount, procedure.currency_code)}
                        </td>
                        <td data-label="Fuente">
                          {sourceUrl ? (
                            <a href={sourceUrl} target="_blank" rel="noreferrer">
                              Ver original
                            </a>
                          ) : (
                            procedure.source_system
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {(data?.total_pages ?? 0) > 1 && (
            <nav className="pagination" aria-label="Paginación de procedimientos">
              <button disabled={page <= 1} onClick={() => changePage(page - 1)}>
                Anterior
              </button>
              <span className="tabular">
                Página {data?.page} de {data?.total_pages}
              </span>
              <button
                disabled={page >= (data?.total_pages ?? 1)}
                onClick={() => changePage(page + 1)}
              >
                Siguiente
              </button>
            </nav>
          )}
        </section>
      </main>
    </div>
  );
}
