import { useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { CalendarIcon, DocumentIcon, SearchIcon } from "../../components/icons";
import { MiraLogo } from "../../components/icons/MiraLogo";
import { getCopy, getLanguage, INTL_LOCALE, useCopy } from "../../i18n";
import { LanguageToggle } from "../../components/LanguageToggle";
import { SiteFooter } from "../../components/SiteFooter";
import { formatCount } from "../../lib/format";
import { fetchCoverage } from "../coverage/api";
import { fetchProcedures, fetchProcessStatuses, type ProcedureQuery } from "./api";

const PAGE_SIZE = 25;

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

function formatDate(value: string | null | undefined) {
  if (!value) return getCopy().procedures.noDate;
  return new Intl.DateTimeFormat(INTL_LOCALE[getLanguage()], { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function formatAmount(value: string | null | undefined, currency: string | null | undefined) {
  const locale = INTL_LOCALE[getLanguage()];
  if (!value || !Number.isFinite(Number(value))) return getCopy().procedures.noAmount;
  if (!currency) return new Intl.NumberFormat(locale).format(Number(value));
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return `${new Intl.NumberFormat(locale).format(Number(value))} ${currency}`;
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

function statusClass(status: string | null | undefined) {
  const suffix = (status ?? "unknown").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return `status-badge status-${suffix || "unknown"}`;
}

export function ProceduresPage() {
  const copy = useCopy();
  const [params, setParams] = useSearchParams();
  const applied = useMemo(() => readFilters(params), [params]);
  const [draft, setDraft] = useState(applied);
  // En movil los filtros arrancan plegados: apilados ocupan mas de una pantalla
  // y empujan la intro y los resultados fuera de vista. En escritorio el CSS
  // los muestra siempre y esconde el boton.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const page = Math.min(10_000, Math.max(1, Math.floor(Number(params.get("pagina")) || 1)));
  const appliedCount = Object.values(applied).filter((value) => value.trim()).length;

  useEffect(() => setDraft(applied), [applied]);
  // React Router conserva el scroll al navegar: sin esto se entra al catalogo a
  // media pagina y la cabecera queda fuera de vista.
  useEffect(() => window.scrollTo({ top: 0 }), []);
  // Depende de `copy` para que el titulo tambien cambie al cambiar de idioma.
  // No restaura el anterior: cada ruta fija el suyo al montar.
  useEffect(() => {
    document.title = copy.procedures.documentTitle;
  }, [copy]);

  const coverage = useQuery({ queryKey: ["coverage"], queryFn: fetchCoverage });
  const statuses = useQuery({
    queryKey: ["process-statuses"],
    queryFn: fetchProcessStatuses,
    staleTime: 10 * 60 * 1000,
  });
  const countryOptions = (coverage.data?.countries ?? [])
    .filter(({ status }) => status === "ACTIVE")
    .map(({ country_code, country_name }) => [country_code, country_name] as const);

  const query = useMemo<ProcedureQuery>(() => {
    const cleanQ = applied.q.trim();
    return {
      q: cleanQ.length >= 2 ? cleanQ : undefined,
      country: /^[a-z]{2}$/i.test(applied.country) ? [applied.country.toUpperCase()] : undefined,
      status: applied.status ? [applied.status] : undefined,
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
  // isFetching, no isLoading: isLoading solo es la primera carga, y el problema
  // estaba justo en los refetch (cambiar filtro o pagina).
  const isBusy = result.isFetching;

  return (
    <div className="site-shell procedures-shell">
      <main className="procedures-page">
        <header className="procedures-header">
          <Link to="/" className="procedures-brand" aria-label={copy.procedures.backHomeAriaLabel}>
            <MiraLogo />
            <span>MIRA</span>
          </Link>
          <div className="procedures-header-actions">
            <LanguageToggle />
            <Link to="/" className="back-home">
              {copy.procedures.backHome}
            </Link>
          </div>
        </header>

        <section className="procedures-intro">
          <div>
            <span>{copy.procedures.eyebrow}</span>
            <h1>{copy.procedures.title}</h1>
            <p>{copy.procedures.description}</p>
          </div>
          <DocumentIcon size={52} />
        </section>

        <div className={`procedure-filters-panel card ${filtersOpen ? "open" : ""}`}>
          <button
            type="button"
            className="procedure-filters-toggle"
            aria-expanded={filtersOpen}
            aria-controls="procedure-filters"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <span>{copy.procedures.filters}</span>
            <span className="toggle-meta">
              {appliedCount > 0 && (
                <span className="filters-count">
                  {appliedCount}{" "}
                  {appliedCount === 1
                    ? copy.procedures.filtersActiveOne
                    : copy.procedures.filtersActiveMany}
                </span>
              )}
              <span className="toggle-chevron" aria-hidden="true">
                ▼
              </span>
            </span>
          </button>
          <form id="procedure-filters" className="procedure-filters" onSubmit={submit}>
            <label className="filter-search">
              <span>{copy.procedures.search}</span>
              <div>
                <SearchIcon size={19} />
                <input
                  value={draft.q}
                  minLength={2}
                  maxLength={200}
                  placeholder={copy.procedures.searchPlaceholder}
                  onChange={(event) => setDraft({ ...draft, q: event.target.value })}
                />
              </div>
            </label>
            <label>
              <span>{copy.procedures.country}</span>
              <select
                value={draft.country}
                disabled={coverage.isLoading || coverage.isError}
                onChange={(event) => setDraft({ ...draft, country: event.target.value })}
              >
                <option value="">
                  {coverage.isLoading
                    ? copy.procedures.countryLoading
                    : coverage.isError
                      ? copy.procedures.countryUnavailable
                      : copy.procedures.countryAll}
                </option>
                {countryOptions.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{copy.procedures.status}</span>
              <select
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value })}
              >
                <option value="">
                  {statuses.isLoading
                    ? copy.procedures.statusLoading
                    : statuses.isError
                      ? copy.procedures.statusUnavailable
                      : copy.procedures.statusAll}
                </option>
                {(statuses.data?.statuses ?? []).map(({ value, process_count }) => (
                  <option key={value} value={value}>
                    {value} ({formatCount(process_count)})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{copy.procedures.method}</span>
              <input
                value={draft.method}
                maxLength={160}
                placeholder={copy.procedures.methodPlaceholder}
                onChange={(event) => setDraft({ ...draft, method: event.target.value })}
              />
            </label>
            <label>
              <span>{copy.procedures.publishedFrom}</span>
              <input
                type="date"
                value={draft.from}
                max={draft.to || undefined}
                onChange={(event) => setDraft({ ...draft, from: event.target.value })}
              />
            </label>
            <label>
              <span>{copy.procedures.publishedTo}</span>
              <input
                type="date"
                value={draft.to}
                min={draft.from || undefined}
                onChange={(event) => setDraft({ ...draft, to: event.target.value })}
              />
            </label>
            <div className="filter-actions">
              <button type="submit">{copy.procedures.submit}</button>
              <button
                type="button"
                onClick={() => {
                  setDraft(readFilters(new URLSearchParams()));
                  setParams(new URLSearchParams());
                }}
              >
                {copy.procedures.clear}
              </button>
            </div>
          </form>
        </div>

        <section className="procedure-results" aria-live="polite">
          <div className="results-heading">
            <div>
              <h2>{copy.procedures.resultsTitle}</h2>
              {!isBusy && !result.isError && (
                <p>
                  {(data?.total === 1
                    ? copy.procedures.resultsFoundOne
                    : copy.procedures.resultsFound
                  ).replace("{n}", formatCount(data?.total))}
                </p>
              )}
            </div>
          </div>

          {isBusy ? (
            <div className="results-state card" role="status">
              <span className="loading-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <strong>{copy.procedures.resultsLoading}</strong>
            </div>
          ) : result.isError ? (
            <div className="results-state card" role="alert">
              {copy.procedures.error}
            </div>
          ) : items.length === 0 ? (
            <div className="results-state card">
              <SearchIcon size={28} />
              <strong>{copy.procedures.emptyTitle}</strong>
              <span>{copy.procedures.emptyHint}</span>
            </div>
          ) : (
            <div className="procedure-table-wrap card">
              <table className="procedure-table">
                <thead>
                  <tr>
                    <th>{copy.procedures.columns.procedure}</th>
                    <th>{copy.procedures.columns.country}</th>
                    <th>{copy.procedures.columns.status}</th>
                    <th>{copy.procedures.columns.publication}</th>
                    <th>{copy.procedures.columns.estimatedAmount}</th>
                    <th>{copy.procedures.columns.source}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((procedure) => {
                    const sourceUrl = safeUrl(procedure.source_url);
                    return (
                      <tr key={procedure.process_id}>
                        <td data-label={copy.procedures.columns.procedure}>
                          <strong>{procedure.title || copy.procedures.untitled}</strong>
                          <small className="tabular">
                            {procedure.process_number || procedure.process_id}
                          </small>
                          {procedure.procurement_method && (
                            <small>{procedure.procurement_method}</small>
                          )}
                        </td>
                        <td data-label={copy.procedures.columns.country}>
                          <b className="country-code tabular">{procedure.country_code}</b>
                        </td>
                        <td data-label={copy.procedures.columns.status}>
                          <b className={statusClass(procedure.process_status)}>
                            {procedure.process_status ?? copy.procedures.noStatus}
                          </b>
                        </td>
                        <td data-label={copy.procedures.columns.publication}>
                          <CalendarIcon size={16} /> {formatDate(procedure.publication_date)}
                        </td>
                        <td
                          data-label={copy.procedures.columns.estimatedAmount}
                          className="tabular"
                        >
                          {formatAmount(procedure.estimated_amount, procedure.currency_code)}
                        </td>
                        <td data-label={copy.procedures.columns.source}>
                          {sourceUrl ? (
                            <a href={sourceUrl} target="_blank" rel="noreferrer">
                              {copy.procedures.viewOriginal}
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
            <nav className="pagination" aria-label={copy.procedures.paginationLabel}>
              <button disabled={isBusy || page <= 1} onClick={() => changePage(page - 1)}>
                {copy.procedures.previous}
              </button>
              <span className="tabular">
                {copy.procedures.pageOf
                  .replace("{page}", String(data?.page))
                  .replace("{total}", String(data?.total_pages))}
              </span>
              <button
                disabled={isBusy || page >= (data?.total_pages ?? 1)}
                onClick={() => changePage(page + 1)}
              >
                {copy.procedures.next}
              </button>
            </nav>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
