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
import { byCountryId, formatCoverageRange, useCoverage } from "../features/coverage/useCoverage";
import { copy } from "../i18n/copy";
import { formatCount, formatDate } from "../lib/format";

/**
 * Catalogo de presentacion: nombre, bandera y orden. **No dice cuales estan
 * disponibles** -- eso lo decide GET /coverage, que sabe que cargo el ETL.
 * Tenerlo escrito a mano era como Guatemala y Honduras aparecian
 * seleccionables con cero datos: preguntabas y recibias un cero que no se
 * distinguia de "no hubo contrataciones".
 */
const COUNTRY_CATALOG = [
  { id: "gt", ...copy.countries.byId.gt },
  { id: "hn", ...copy.countries.byId.hn },
  { id: "cr", ...copy.countries.byId.cr },
  { id: "ni", ...copy.countries.byId.ni },
  { id: "sv", ...copy.countries.byId.sv },
];
const examples = [
  { Icon: BuildingIcon, text: copy.home.examples.mostContractsHonduras },
  { Icon: PillIcon, text: copy.home.examples.medicinePurchases },
  { Icon: MonitorIcon, text: copy.home.examples.computerEquipmentCostaRica },
  {
    Icon: HandshakeIcon,
    text: copy.home.examples.directAwardInstitutions,
  },
];

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
                  <b>•</b>{" "}
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
        ⠐⠘⠰
        <br />
        ⠀⠈⠘⠰
        <br />
        ⠀⠀⠀⠈⠘⠰
      </div>
    </header>
  );
}

export function App() {
  const [selected, setSelected] = useState<string[]>([]),
    [question, setQuestion] = useState(""),
    [notice, setNotice] = useState(""),
    [panelOpen, setPanelOpen] = useState(false);
  const conversation = useAskConversation();
  const { data: coverage } = useCoverage();

  // Un pais esta disponible si el ETL cargo datos suyos, no porque este en el
  // catalogo. Mientras la cobertura viaja, ninguno lo esta: preferible un
  // selector vacio un instante a ofrecer paises que quiza no responden.
  const porPais = useMemo(() => byCountryId(coverage?.countries), [coverage]);
  const countries = useMemo(
    () =>
      COUNTRY_CATALOG.map((country) => {
        const datos = porPais[country.id];
        return {
          ...country,
          active: datos?.status === "ACTIVE",
          processCount: datos?.process_count ?? 0,
        };
      }),
    [porPais],
  );
  const disponibles = useMemo(() => countries.filter((c) => c.active), [countries]);

  // Se seleccionan solos los que tienen datos, en cuanto se sabe cuales son.
  useEffect(() => {
    if (disponibles.length > 0 && selected.length === 0) {
      setSelected(disponibles.map((c) => c.id));
    }
    // Solo al llegar la cobertura: despues manda lo que elija la persona.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disponibles.length]);

  const allActiveSelected = useMemo(
    () => disponibles.length > 0 && disponibles.every((c) => selected.includes(c.id)),
    [disponibles, selected],
  );

  const m = copy.home.metrics;
  const resumen = coverage?.summary;
  const rangoCobertura = formatCoverageRange(
    resumen?.coverage_from ?? null,
    resumen?.coverage_to ?? null,
  );
  // La API espera codigos ISO en mayuscula; los ids de los botones son minusculas.
  const selectedCodes = useMemo(() => selected.map((id) => id.toUpperCase()), [selected]);
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  const ask = (text: string) => conversation.ask(text, selectedCodes);
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
              <small>{m.countries.label}</small>
              <strong className="tabular">
                {resumen ? `${disponibles.length} ${m.countries.activeSuffix}` : m.pending}
              </strong>
              <span>
                {countries.length - disponibles.length} {m.countries.soonSuffix}
              </span>
            </div>
          </div>
          <div className="metric">
            <CalendarIcon className="icon" size={38} />
            <div>
              <small>{m.coverage.label}</small>
              <strong className="tabular">{rangoCobertura ?? m.pending}</strong>
              <span>{m.coverage.caption}</span>
            </div>
          </div>
          <div className="metric">
            <RefreshIcon className="icon" size={38} />
            <div>
              <small>{m.updatedAt.label}</small>
              <strong className="tabular">
                {resumen?.last_successful_load_at
                  ? formatDate(resumen.last_successful_load_at)
                  : m.pending}
              </strong>
              <span className="tabular">{m.updatedAt.caption}</span>
            </div>
          </div>
          <div className="metric">
            <DatabaseIcon className="icon" size={38} />
            <div>
              <small>{m.records.label}</small>
              <strong className="tabular">
                {resumen ? formatCount(resumen.process_count) : m.pending}
              </strong>
              <span>{m.records.caption}</span>
            </div>
          </div>
          <div className="metric">
            <DocumentIcon className="icon" size={38} />
            <div>
              <small>{m.sources.label}</small>
              <strong className="tabular">
                {resumen ? formatCount(resumen.active_sources) : m.pending}
              </strong>
              <span>
                {disponibles.length === 1
                  ? m.sources.captionOne
                  : m.sources.captionMany.replace("{n}", String(disponibles.length))}
              </span>
            </div>
          </div>
        </section>
        <section className="countries card">
          <h2>{copy.countries.selectorTitle}</h2>
          <div className="country-grid">
            {countries.map((country) => (
              <button
                key={country.id}
                disabled={!country.active}
                onClick={() => toggle(country.id)}
                className={`country ${selected.includes(country.id) ? "selected" : ""}`}
              >
                <span className="checkbox" aria-hidden="true">
                  {selected.includes(country.id) ? "✓" : ""}
                </span>
                <span className="flag">{country.flag}</span>
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
              onClick={() => setSelected(allActiveSelected ? [] : disponibles.map((c) => c.id))}
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
          <strong>{copy.brand.name}</strong> · {copy.home.footer.product}
        </span>
        <span>{copy.home.footer.initiative}</span>
        <span>
          {copy.home.footer.version} <b>·</b> {copy.home.footer.date}
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
