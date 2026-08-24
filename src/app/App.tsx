import { useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BuildingIcon,
  CalendarIcon,
  DatabaseIcon,
  DocumentIcon,
  GlobeIcon,
  HandshakeIcon,
  MonitorIcon,
  PillIcon,
  RefreshIcon,
  SearchIcon,
  SendIcon,
  ShieldIcon,
  SparkIcon,
} from "../components/icons";
import { MiraLogo } from "../components/icons/MiraLogo";
import { AskPanel } from "../features/ask/AskPanel";
import { useAskConversation } from "../features/ask/useAskConversation";
import { fetchCoverage } from "../features/coverage/api";
import { copy } from "../i18n/copy";
import { formatCount } from "../lib/format";

//: Bandera de reserva cuando la API no trae una, o el archivo no carga.
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
  const [selected, setSelected] = useState<string[]>([]),
    [question, setQuestion] = useState(""),
    [notice, setNotice] = useState(""),
    [panelOpen, setPanelOpen] = useState(false),
    [coverageInitialized, setCoverageInitialized] = useState(false);
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
          id: code.toLowerCase(),
          code,
          name: country.country_name,
          flagImage: country.flag_asset ?? GENERIC_FLAG_ASSET,
          status: country.status,
          active: country.status === "ACTIVE",
          //: El conteo real distingue de un vistazo un pais completo de
          //: uno recien empezado. Costa Rica y Nicaragua no estan igual
          //: de cargados y la interfaz no deberia ocultarlo.
          processCount: country.process_count,
        };
      }),
    [coverage],
  );
  const activeCountryIds = useMemo(
    () => countryOptions.filter((country) => country.active).map((country) => country.id),
    [countryOptions],
  );
  useEffect(() => {
    if (!coverage || coverageInitialized) return;
    setSelected(activeCountryIds);
    setCoverageInitialized(true);
  }, [activeCountryIds, coverage, coverageInitialized]);
  const allActiveSelected = useMemo(
    () => activeCountryIds.length > 0 && activeCountryIds.every((id) => selected.includes(id)),
    [activeCountryIds, selected],
  );
  // La API espera codigos ISO en mayuscula; los ids de los botones son minusculas.
  const selectedCodes = useMemo(() => selected.map((id) => id.toUpperCase()), [selected]);
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  const ask = (text: string) => conversation.ask(text, selectedCodes);
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
    if (selected.length === 0) {
      setNotice(copy.home.ask.missingCountry);
      return;
    }
    setNotice("");
    setPanelOpen(true);
    ask(question.trim());
    setQuestion("");
  };

  return (
    <div className="site-shell">
      <main className="page">
        <Brand />
        <section className="metrics card" aria-label={copy.home.coverageAriaLabel}>
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
                  formatCoverageRange(coverageSummary?.coverage_from, coverageSummary?.coverage_to),
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
        </section>
        <section className="countries card">
          <h2>{copy.countries.selectorTitle}</h2>
          <div className="country-grid">
            {countryOptions.map((country) => (
              <button
                key={country.id}
                disabled={!country.active}
                onClick={() => toggle(country.id)}
                className={`country ${selected.includes(country.id) ? "selected" : ""}`}
              >
                <span className="checkbox" aria-hidden="true">
                  {selected.includes(country.id) ? "✓" : ""}
                </span>
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
                <span>
                  {country.name}
                  {/* El conteo real distingue de un vistazo un pais completo de
                      uno recien empezado -- Costa Rica y Nicaragua no estan
                      igual de cargados, y la interfaz no deberia ocultarlo. */}
                  {country.active ? (
                    <small>
                      {copy.countries.processCount.replace(
                        "{n}",
                        formatCount(country.processCount),
                      )}
                    </small>
                  ) : (
                    <small>{copy.countries.soon}</small>
                  )}
                </span>
              </button>
            ))}
            <button
              className={`country all ${allActiveSelected ? "selected" : ""}`}
              onClick={() => setSelected(allActiveSelected ? [] : activeCountryIds)}
              disabled={activeCountryIds.length === 0}
            >
              <span className="checkbox" aria-hidden="true">
                {allActiveSelected ? "✓" : ""}
              </span>
              <GlobeIcon className="icon" />
              <span>{copy.countries.all}</span>
            </button>
          </div>
        </section>
        <section className="ask card">
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
            <button type="submit">
              <SendIcon className="icon" />
              {copy.home.ask.submit}
            </button>
          </form>
          <div className="trust-row">
            <p>
              <ShieldIcon className="icon" size={20} />
              {copy.home.ask.trust}
            </p>
            <button
              onClick={() =>
                document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <SparkIcon className="icon" />
              {copy.home.ask.examplesButton}
            </button>
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
        </section>
      </main>
      <footer>
        <span>
          <strong>{copy.brand.name}</strong> - {copy.home.footer.product}
        </span>
        <span>{copy.home.footer.initiative}</span>
        <span>
          {copy.home.footer.version} <b>-</b> {copy.home.footer.date}
        </span>
      </footer>
      <AskPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        turns={conversation.turns}
        countries={selectedCodes}
        isPending={conversation.isPending}
        onAsk={ask}
      />
    </div>
  );
}
