import { FormEvent, useMemo, useState } from "react";
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
import { copy } from "../i18n/copy";

const countries = [
  { id: "gt", ...copy.countries.byId.gt, flagImage: "/flags/gt.svg", active: true },
  { id: "hn", ...copy.countries.byId.hn, flagImage: "/flags/hn.svg", active: true },
  { id: "cr", ...copy.countries.byId.cr, flagImage: "/flags/cr.svg", active: true },
  { id: "sv", ...copy.countries.byId.sv, flagImage: "/flags/sv.svg", active: false },
  { id: "ni", ...copy.countries.byId.ni, flagImage: "/flags/ni.svg", active: false },
  { id: "pa", ...copy.countries.byId.pa, flagImage: "/flags/pa.svg", active: false },
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
  const [selected, setSelected] = useState(["gt", "hn", "cr"]),
    [question, setQuestion] = useState(""),
    [notice, setNotice] = useState(""),
    [panelOpen, setPanelOpen] = useState(false);
  const conversation = useAskConversation();
  const allActiveSelected = useMemo(
    () => countries.filter((c) => c.active).every((c) => selected.includes(c.id)),
    [selected],
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
              <small>{copy.home.metrics.countries.label}</small>
              <strong className="tabular">{copy.home.metrics.countries.value}</strong>
              <span>{copy.home.metrics.countries.caption}</span>
            </div>
          </div>
          <div className="metric">
            <CalendarIcon className="icon" size={38} />
            <div>
              <small>{copy.home.metrics.coverage.label}</small>
              <strong className="tabular">{copy.home.metrics.coverage.value}</strong>
              <span>{copy.home.metrics.coverage.caption}</span>
            </div>
          </div>
          <div className="metric">
            <RefreshIcon className="icon" size={38} />
            <div>
              <small>{copy.home.metrics.updatedAt.label}</small>
              <strong className="tabular">{copy.home.metrics.updatedAt.value}</strong>
              <span className="tabular">{copy.home.metrics.updatedAt.caption}</span>
            </div>
          </div>
          <div className="metric">
            <DatabaseIcon className="icon" size={38} />
            <div>
              <small>{copy.home.metrics.records.label}</small>
              <strong className="tabular">{copy.home.metrics.records.value}</strong>
              <span>{copy.home.metrics.records.caption}</span>
            </div>
          </div>
          <div className="metric">
            <DocumentIcon className="icon" size={38} />
            <div>
              <small>{copy.home.metrics.sources.label}</small>
              <strong className="tabular">{copy.home.metrics.sources.value}</strong>
              <span>{copy.home.metrics.sources.caption}</span>
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
                <img className="flag" src={country.flagImage} alt="" aria-hidden="true" />
                <span>
                  {country.name}
                  {!country.active && <small>{copy.countries.soon}</small>}
                </span>
              </button>
            ))}
            <button
              className={`country all ${allActiveSelected ? "selected" : ""}`}
              onClick={() =>
                setSelected(
                  allActiveSelected ? [] : countries.filter((c) => c.active).map((c) => c.id),
                )
              }
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
