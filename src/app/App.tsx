import { useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  BuildingIcon,
  CalendarIcon,
  DatabaseIcon,
  DocumentIcon,
  FilterIcon,
  GlobeIcon,
  HandshakeIcon,
  MonitorIcon,
  PillIcon,
  RefreshIcon,
  SearchIcon,
  ArrowUpIcon,
  ShieldIcon,
  SparkIcon,
} from "../components/icons";
import { MiraLogo } from "../components/icons/MiraLogo";
import { SiteFooter } from "../components/SiteFooter";
import { AskPanel } from "../features/ask/AskPanel";
import { useAskConversation } from "../features/ask/useAskConversation";
import { fetchCoverage } from "../features/coverage/api";
import { ManualSearchPanel } from "../features/manual-search/ManualSearchPanel";
import { copy } from "../i18n/copy";
import { formatCount } from "../lib/format";

// Bandera de reserva cuando la API no trae una, o el archivo no carga.
const GENERIC_FLAG_ASSET = "/flags/generic.svg";

const examples = [
  { Icon: BuildingIcon, text: copy.home.examples.mostContractsHonduras },
  { Icon: PillIcon, text: copy.home.examples.medicinePurchases },
  { Icon: MonitorIcon, text: copy.home.examples.computerEquipmentCostaRica },
  {
    Icon: HandshakeIcon,
    text: copy.home.examples.directAwardInstitutions,
  },
];

const MONTH_YEAR_FORMAT = new Intl.DateTimeFormat("es", {
  month: "short",
  year: "numeric",
});
const DATE_FORMAT = new Intl.DateTimeFormat("es", { dateStyle: "medium" });
const TIME_FORMAT = new Intl.DateTimeFormat("es", {
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
});

function dateOnly(value: string): Date {
  const [year = "0", month = "1", day = "1"] = value.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function capitalize(value: string): string {
  return value ? `${value[0]?.toUpperCase()}${value.slice(1)}` : value;
}

function formatCoverageRange(from: string | null | undefined, to: string | null | undefined) {
  if (!from || !to) return copy.format.missingDate;
  const fromLabel = capitalize(MONTH_YEAR_FORMAT.format(dateOnly(from)));
  const toLabel = capitalize(MONTH_YEAR_FORMAT.format(dateOnly(to)));
  return `${fromLabel} - ${toLabel}`;
}

function formatCoverageDate(value: string | null | undefined) {
  if (!value) return copy.format.missingDate;
  return DATE_FORMAT.format(new Date(value));
}

function formatCoverageTime(value: string | null | undefined) {
  if (!value) return copy.format.missingDate;
  return TIME_FORMAT.format(new Date(value));
}

function Brand() {
  return (
    <header className="brand" aria-label={copy.brand.ariaLabel}>
      <MiraLogo className="brand-mark" />
      <div>
        <div className="brand-name">{copy.brand.name}</div>
        <div className="brand-expansion">
          {copy.brand.expansionParts.map((part, index) => (
            <span key={part}>
              {index > 0 && (
                <>
                  {" "}
                  <b>*</b>{" "}
                </>
              )}
              {part}
            </span>
          ))}
        </div>
        <div className="brand-promise">
          {copy.brand.promiseLine1}
          <br />
          {copy.brand.promiseLine2}
        </div>
      </div>
      <div className="region-dots" aria-hidden="true">
        . . .
        <br />
        . . . .
        <br />. . . . .
      </div>
    </header>
  );
}

export function App() {
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [manualSearchOpen, setManualSearchOpen] = useState(false);
  const [showFilterHint, setShowFilterHint] = useState(false);
  const manualSearchButtonRef = useRef<HTMLButtonElement>(null);

  const conversation = useAskConversation();
  const coverageQuery = useQuery({
    queryKey: ["coverage"],
    queryFn: fetchCoverage,
  });
  const coverage = coverageQuery.data;
  const coverageSummary = coverage?.summary;

  const countryOptions = useMemo(
    () =>
      (coverage?.countries ?? []).map((country) => {
        const code = country.country_code.toUpperCase();
        return {
          code,
          name: country.country_name,
          flagImage: country.flag_asset ?? GENERIC_FLAG_ASSET,
          status: country.status,
          active: country.status === "ACTIVE",
          processCount: country.process_count,
        };
      }),
    [coverage],
  );

  const activeCountryCodes = useMemo(
    () => countryOptions.filter((country) => country.active).map((country) => country.code),
    [countryOptions],
  );

  useEffect(() => {
    if (manualSearchOpen || panelOpen || question.trim()) {
      setShowFilterHint(false);
      return;
    }
    const showTimer = window.setTimeout(() => setShowFilterHint(true), 5000);
    const hideTimer = window.setTimeout(() => setShowFilterHint(false), 12000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [manualSearchOpen, panelOpen, question]);

  // El boton flotante y el hueco que le reserva el pie de pagina dependen de lo
  // mismo: hay conversacion y el panel esta cerrado.
  const showReopenButton = conversation.turns.length > 0 && !panelOpen;
  const currentConversationCountries = conversation.turns.at(-1)?.countries ?? activeCountryCodes;
  const askAllCountries = (text: string) => conversation.ask(text, activeCountryCodes);
  const askFollowUp = (text: string) => conversation.ask(text, currentConversationCountries);

  const metricValue = (value: string) => {
    if (coverageQuery.isLoading) return copy.home.loadingCoverage;
    if (coverageQuery.isError) return copy.home.unavailableCoverage;
    return value;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) {
      setNotice(copy.home.ask.missingQuestion);
      return;
    }
    if (activeCountryCodes.length === 0) {
      setNotice(copy.home.ask.missingCountry);
      return;
    }
    setNotice("");
    setPanelOpen(true);
    askAllCountries(question.trim());
    setQuestion("");
  };

  const closeManualSearch = () => {
    setManualSearchOpen(false);
    window.requestAnimationFrame(() => manualSearchButtonRef.current?.focus());
  };

  const submitManualSearch = (generatedQuestion: string, countries: string[]) => {
    setNotice("");
    setManualSearchOpen(false);
    setPanelOpen(true);
    conversation.ask(generatedQuestion, countries);
  };

  return (
    <div className="site-shell">
      <main className="page">
        {/* 1. Header / Brand Original */}
        <Brand />

        {/* 2. Resumen de cobertura, con el estado real de cada país */}
        <section
          className="metrics-card card coverage-summary"
          aria-label={copy.home.coverageAriaLabel}
        >
          <button
            type="button"
            className={`metrics-toggle ${coverageOpen ? "open" : ""}`}
            onClick={() => setCoverageOpen(!coverageOpen)}
          >
            <span>{copy.home.coverageAriaLabel}</span>
            <div className="toggle-meta">
              <span className="tabular">
                {metricValue(`${formatCount(coverageSummary?.process_count)} procesos cargados`)}
              </span>
              <span className="toggle-chevron" aria-hidden="true">
                ▼
              </span>
            </div>
          </button>

          {coverageOpen && (
            <div className="coverage-details">
              <div className="coverage-countries">
                <h2>{copy.home.metrics.countries.detailTitle}</h2>
                {coverageQuery.isLoading ? (
                  <p className="coverage-country-message">{copy.home.loadingCoverage}</p>
                ) : coverageQuery.isError ? (
                  <p className="coverage-country-message" role="alert">
                    {copy.home.unavailableCoverage}
                  </p>
                ) : (
                  <div className="country-grid coverage-country-grid">
                    {countryOptions.map((country) => (
                      <article
                        key={country.code}
                        className={`country coverage-country ${country.status.toLowerCase()}`}
                      >
                        <img
                          className="flag"
                          src={country.flagImage}
                          alt=""
                          aria-hidden="true"
                          onError={(event) => {
                            if (event.currentTarget.src.endsWith(GENERIC_FLAG_ASSET)) return;
                            event.currentTarget.src = GENERIC_FLAG_ASSET;
                          }}
                        />
                        <div className="country-info">
                          <span className="country-name">{country.name}</span>
                        </div>
                        <span className={`coverage-status ${country.status.toLowerCase()}`}>
                          {country.status === "ACTIVE"
                            ? copy.home.metrics.countries.recordCount.replace(
                                "{n}",
                                formatCount(country.processCount),
                              )
                            : country.status === "PLANNED"
                              ? copy.home.metrics.countries.soonStatus
                              : copy.home.metrics.countries.inactiveStatus}
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="metrics collapsible">
                <div className="metric">
                  <GlobeIcon className="icon" size={38} />
                  <div>
                    <small>{copy.home.metrics.countries.label}</small>
                    <strong className="tabular">
                      {metricValue(
                        `${formatCount(coverageSummary?.active_countries)} ${copy.home.metrics.countries.activeSuffix}`,
                      )}
                    </strong>
                    <span>
                      {metricValue(
                        `${formatCount(coverageSummary?.planned_countries)} ${copy.home.metrics.countries.soonSuffix}`,
                      )}
                    </span>
                  </div>
                </div>
                <div className="metric">
                  <CalendarIcon className="icon" size={38} />
                  <div>
                    <small>{copy.home.metrics.coverage.label}</small>
                    <strong className="tabular">
                      {metricValue(
                        formatCoverageRange(
                          coverageSummary?.coverage_from,
                          coverageSummary?.coverage_to,
                        ),
                      )}
                    </strong>
                    <span>{copy.home.metrics.coverage.caption}</span>
                  </div>
                </div>
                <div className="metric">
                  <RefreshIcon className="icon" size={38} />
                  <div>
                    <small>{copy.home.metrics.updatedAt.label}</small>
                    <strong className="tabular">
                      {metricValue(formatCoverageDate(coverageSummary?.last_successful_load_at))}
                    </strong>
                    <span className="tabular">
                      {metricValue(formatCoverageTime(coverageSummary?.last_successful_load_at))}
                    </span>
                  </div>
                </div>
                <div className="metric">
                  <DatabaseIcon className="icon" size={38} />
                  <div>
                    <small>{copy.home.metrics.records.label}</small>
                    <strong className="tabular">
                      {metricValue(formatCount(coverageSummary?.process_count))}
                    </strong>
                    <span>{copy.home.metrics.records.caption}</span>
                  </div>
                </div>
                <div className="metric">
                  <DocumentIcon className="icon" size={38} />
                  <div>
                    <small>{copy.home.metrics.sources.label}</small>
                    <strong className="tabular">
                      {metricValue(formatCount(coverageSummary?.active_sources))}
                    </strong>
                    <span>
                      {metricValue(
                        coverageSummary?.active_countries === 1
                          ? copy.home.metrics.sources.captionOne
                          : copy.home.metrics.sources.captionMany.replace(
                              "{n}",
                              formatCount(coverageSummary?.active_countries),
                            ),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. Área de Pregunta y Búsqueda Original */}
        <section className={`ask card ${manualSearchOpen ? "manual-search-active" : ""}`}>
          {manualSearchOpen ? (
            <ManualSearchPanel
              countryOptions={countryOptions}
              countryCatalogLoading={coverageQuery.isLoading}
              countryCatalogUnavailable={coverageQuery.isError}
              isPending={conversation.isPending}
              onBack={closeManualSearch}
              onSearch={submitManualSearch}
            />
          ) : (
            <>
              <div className="ask-heading">
                <h2>{copy.home.ask.title}</h2>
                <p>{copy.home.ask.description}</p>
              </div>
              <form className="search-box" onSubmit={submit}>
                <SearchIcon className="icon" size={30} />
                <input
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    setNotice("");
                  }}
                  aria-label={copy.home.ask.inputLabel}
                  placeholder={copy.home.ask.placeholder}
                />
                <div className="search-actions">
                  <span className="manual-search-trigger">
                    {showFilterHint && (
                      <span className="manual-search-hint" role="status">
                        {copy.home.ask.filterHint}
                      </span>
                    )}
                    <button
                      ref={manualSearchButtonRef}
                      type="button"
                      className="manual-search-open-button"
                      onClick={() => {
                        setShowFilterHint(false);
                        setManualSearchOpen(true);
                      }}
                      aria-label={copy.home.ask.manualSearch}
                      title={copy.home.ask.manualSearch}
                    >
                      <FilterIcon size={20} />
                    </button>
                  </span>
                  {question.trim().length > 0 && (
                    <button
                      type="submit"
                      aria-label={copy.home.ask.submit}
                      title={copy.home.ask.submit}
                    >
                      <ArrowUpIcon size={20} />
                    </button>
                  )}
                </div>
              </form>
              <div className="trust-row">
                <p>
                  <ShieldIcon className="icon" size={20} />
                  {copy.home.ask.trust}
                </p>
              </div>
              {notice && (
                <p className="notice" role="status">
                  {notice}
                </p>
              )}
              <h3 id="examples">{copy.home.ask.examplesTitle}</h3>
              <div className="examples">
                {examples.map((example) => (
                  <button
                    key={example.text}
                    onClick={() => {
                      setQuestion(example.text);
                      setNotice("");
                      if (activeCountryCodes.length > 0) {
                        setPanelOpen(true);
                        askAllCountries(example.text);
                      } else {
                        setNotice(copy.home.ask.missingCountry);
                      }
                    }}
                    className="example"
                  >
                    <span className="example-icon">
                      <example.Icon className="icon" size={30} />
                    </span>
                    <span>{example.text}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="procedure-access card">
          <div className="procedure-access-icon">
            <DocumentIcon size={30} />
          </div>
          <div>
            <h2>{copy.home.catalog.title}</h2>
            <p>{copy.home.catalog.description}</p>
          </div>
          <Link to="/procedimientos">
            {copy.home.catalog.action}
            <ArrowRightIcon size={18} />
          </Link>
        </section>
      </main>

      <SiteFooter reserveFloatingAction={showReopenButton} />

      {/* BotA3n flotante para reabrir el asistente */}
      {showReopenButton && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="reopen-chat-btn"
          aria-label="Abrir asistente de consultas"
        >
          <SparkIcon size={18} />
          <span>Ver consulta ({conversation.turns.length})</span>
        </button>
      )}

      {/* Panel Conversacional */}
      <AskPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        turns={conversation.turns}
        countries={currentConversationCountries}
        isPending={conversation.isPending}
        onAsk={askFollowUp}
      />
    </div>
  );
}
